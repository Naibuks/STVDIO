const { Resend } = require("resend");
const { sanitizeHeader } = require("./templates/layout");

const welcomeTemplate = require("./templates/welcome.template");
const orderConfirmationTemplate = require("./templates/order-confirmation.template");
const newOrderTemplate = require("./templates/new-order.template");
const paymentConfirmationTemplate = require("./templates/payment-confirmation.template");
const orderStatusTemplate = require("./templates/order-status.template");
const passwordResetTemplate = require("./templates/password-reset.template");
const collaborationTemplate = require("./templates/collaboration.template");

/**
 * The only place STVDIO° talks to Resend.
 *
 * Controllers never construct a Resend client and never write HTML; they call
 * a named sender such as sendOrderConfirmation(). That keeps the API key in
 * one module and means changing provider later touches one file.
 */

let client = null;

/**
 * Built lazily and cached, so requiring this file never throws in a process
 * without a key (the seed script, tests) and only one client ever exists.
 */
const getClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
};

const isConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:3000";

/**
 * Low-level send. Returns a result rather than throwing.
 *
 * Resend's SDK reports API failures as `{ error }` instead of rejecting, so
 * both that and a thrown network error are normalised here into one shape.
 * Nothing logged includes the API key or the message body.
 */
const send = async ({ to, subject, html }) => {
  if (!isConfigured()) {
    console.warn(
      `[email] skipped "${subject}" — RESEND_API_KEY or EMAIL_FROM is not set`,
    );
    return { sent: false, skipped: true, reason: "not configured" };
  }

  if (!to) {
    console.warn(`[email] skipped "${subject}" — no recipient`);
    return { sent: false, skipped: true, reason: "no recipient" };
  }

  try {
    const { data, error } = await getClient().emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      // Sanitised because a subject is a header: a newline in user-supplied
      // text would otherwise let extra headers be injected.
      subject: sanitizeHeader(subject),
      html,
    });

    if (error) {
      console.error(`[email] "${subject}" rejected by Resend: ${error.message}`);
      return { sent: false, error: error.message };
    }

    console.log(`[email] sent "${subject}" (${data?.id ?? "no id"})`);
    return { sent: true, id: data?.id };
  } catch (error) {
    console.error(`[email] "${subject}" failed: ${error.message}`);
    return { sent: false, error: error.message };
  }
};

/**
 * Fire an email without making the caller wait for it, and without letting it
 * reject.
 *
 * An order must not be slower to create — or fail — because a mail provider is
 * slow or down. `send` already swallows its own errors; the extra catch here
 * guarantees no unhandled rejection can reach the process even if `send`
 * itself is changed later.
 *
 * The trade-off is deliberate and worth stating: there is no retry. A dropped
 * email is logged and lost, which is the right balance for transactional
 * notices in a project of this size, and the point where a queue would go if
 * that ever stops being true.
 */
const dispatch = (promiseFactory) => {
  try {
    Promise.resolve(promiseFactory()).catch((error) =>
      console.error(`[email] dispatch failed: ${error.message}`),
    );
  } catch (error) {
    console.error(`[email] dispatch failed: ${error.message}`);
  }
};

// --- Named senders --------------------------------------------------------
// Each takes domain objects, picks its template, and sends. Callers never see
// HTML or a subject line.

const sendWelcome = (user) =>
  send({
    to: user.email,
    ...welcomeTemplate({
      name: user.name,
      username: user.username,
      clientUrl: clientUrl(),
    }),
  });

const sendOrderConfirmation = ({ order, client: buyer, creative }) =>
  send({
    to: buyer.email,
    ...orderConfirmationTemplate({
      order,
      clientName: buyer.name,
      creativeName: creative?.name ?? "your creative",
      clientUrl: clientUrl(),
    }),
  });

const sendNewOrderNotification = ({ order, client: buyer, creative }) =>
  send({
    to: creative.email,
    ...newOrderTemplate({
      order,
      clientName: buyer?.name ?? "A client",
      creativeName: creative.name,
      clientUrl: clientUrl(),
    }),
  });

const sendPaymentConfirmation = ({ order, payment, client: buyer }) =>
  send({
    to: buyer.email,
    ...paymentConfirmationTemplate({
      order,
      payment,
      clientName: buyer.name,
      clientUrl: clientUrl(),
    }),
  });

const sendOrderStatusUpdate = ({ order, recipient, previousStatus }) =>
  send({
    to: recipient.email,
    ...orderStatusTemplate({
      order,
      recipientName: recipient.name,
      previousStatus,
      clientUrl: clientUrl(),
    }),
  });

/** Ready for a future password-reset flow; nothing calls it yet. */
const sendPasswordReset = ({ user, resetUrl, expiresInMinutes }) =>
  send({
    to: user.email,
    ...passwordResetTemplate({
      name: user.name,
      resetUrl,
      expiresInMinutes,
    }),
  });

/** Ready for Phase 9 collaborations; nothing calls it yet. */
const sendCollaborationNotification = ({
  recipient,
  actor,
  collaboration,
  kind,
}) =>
  send({
    to: recipient.email,
    ...collaborationTemplate({
      recipientName: recipient.name,
      actorName: actor?.name ?? "Someone",
      collaboration,
      kind,
      clientUrl: clientUrl(),
    }),
  });

module.exports = {
  send,
  dispatch,
  isConfigured,
  sendWelcome,
  sendOrderConfirmation,
  sendNewOrderNotification,
  sendPaymentConfirmation,
  sendOrderStatusUpdate,
  sendPasswordReset,
  sendCollaborationNotification,
};

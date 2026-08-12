const {
  layout,
  paragraph,
  detailTable,
  button,
  sanitizeHeader,
} = require("./layout");

/**
 * Sent when an order moves through the Phase 6 state machine.
 *
 * The wording map covers exactly the statuses in the existing ORDER_STATUS
 * enum — no invented states. Anything not listed falls back to a neutral line
 * rather than being suppressed, so a new status can never silently send a
 * blank email.
 */
const EXPLANATION = {
  PENDING: "The order is waiting for the creative to accept it.",
  ACCEPTED: "The creative has accepted this order and will begin work.",
  IN_PROGRESS: "Work on your order has started.",
  DELIVERED:
    "The work has been delivered. Review it and approve the order when you are happy.",
  COMPLETED: "This order is complete. Thank you for using STVDIO°.",
  CANCELLED: "This order has been cancelled.",
  DISPUTED: "This order has been marked as disputed and is under review.",
};

module.exports = ({ order, recipientName, previousStatus, clientUrl }) => ({
  subject: `Order ${sanitizeHeader(order.status.replace(/_/g, " ").toLowerCase())} — ${sanitizeHeader(order.serviceSnapshot?.title)}`,
  html: layout({
    preheader: `Your order is now ${order.status.replace(/_/g, " ").toLowerCase()}.`,
    heading: "Order update",
    bodyHtml: `
      ${paragraph(`${recipientName} — there is an update on your order.`)}
      ${detailTable([
        ["Service", order.serviceSnapshot?.title],
        ["Order reference", order._id?.toString()],
        ["Previous status", previousStatus?.replace(/_/g, " ")],
        ["New status", order.status.replace(/_/g, " ")],
      ])}
      ${paragraph(EXPLANATION[order.status] ?? "Your order status has changed.")}
      ${button(`${clientUrl}/orders`, "View your order")}
    `,
  }),
});

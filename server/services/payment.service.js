const mongoose = require("mongoose");
const { Order, Payment } = require("../models");
const ApiError = require("../utils/ApiError");
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS,
  USER_ROLES,
} = require("../utils/constants");
const paystack = require("./paystack.service");

/**
 * Payment business logic.
 *
 * The rule that governs this whole file: money facts come from our own Order
 * document and from Paystack's verify endpoint. Nothing a browser sends is
 * ever treated as a fact about money.
 */

/** Statuses from which an order can still be paid for. */
const UNPAYABLE_ORDER_STATUSES = [ORDER_STATUS.CANCELLED];

const assertValidId = (id, label = "Order") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound(`${label} not found`);
  }
};

/**
 * Load an order and confirm this user is the one who should be paying.
 *
 * 404 rather than 403 when the caller is a stranger: someone who is not on
 * the order should not learn it exists. The creative is refused explicitly —
 * they are the payee, and letting a seller pay their own service would corrupt
 * earnings data.
 */
const loadPayableOrder = async (orderId, user) => {
  assertValidId(orderId);

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");

  if (order.creative.equals(user._id)) {
    throw ApiError.forbidden("You cannot pay for your own service");
  }
  if (!order.client.equals(user._id)) {
    throw ApiError.notFound("Order not found");
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw ApiError.conflict("This order has already been paid for");
  }
  if (UNPAYABLE_ORDER_STATUSES.includes(order.status)) {
    throw ApiError.conflict(`A ${order.status} order cannot be paid for`);
  }

  return order;
};

/**
 * Begin a payment.
 *
 * Ownership and eligibility are checked before Paystack is contacted, so an
 * unauthorised caller never causes an upstream transaction to exist.
 *
 * A fresh Payment row per attempt is deliberate — the model documents itself
 * as recording every attempt — and each carries its own reference, because
 * Paystack rejects a reused one.
 */
const initialize = async (orderId, user, { callbackUrl }) => {
  const order = await loadPayableOrder(orderId, user);

  const reference = paystack.generateReference(order._id);

  // Written before the upstream call so a transaction can never exist at
  // Paystack without a local record of it.
  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    // Straight off the Order. The request body is not consulted.
    amount: order.amount,
    currency: order.currency,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    reference,
    status: PAYMENT_STATUS.PENDING,
  });

  let transaction;
  try {
    transaction = await paystack.initializeTransaction({
      email: user.email,
      amountMinor: order.amount,
      currency: order.currency,
      reference,
      callbackUrl,
      metadata: {
        orderId: order._id.toString(),
        paymentId: payment._id.toString(),
        serviceTitle: order.serviceSnapshot?.title,
      },
    });
  } catch (error) {
    // Don't leave a PENDING row for a transaction that was never created.
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    throw error;
  }

  // Points at the attempt currently in flight. A previous FAILED attempt is
  // cleared back to PENDING so the dashboard reflects the live attempt rather
  // than a stale failure.
  order.paystackReference = reference;
  order.paymentStatus = PAYMENT_STATUS.PENDING;
  await order.save();

  return {
    authorizationUrl: transaction.authorization_url,
    accessCode: transaction.access_code,
    reference,
    payment,
    order,
  };
};

/** The shape returned to a client. Never includes `metadata`. */
const publicPayment = (payment) => ({
  _id: payment._id,
  order: payment.order,
  amount: payment.amount,
  currency: payment.currency,
  provider: payment.provider,
  reference: payment.reference,
  status: payment.status,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
});

/**
 * Apply a successful Paystack transaction to our records.
 *
 * Shared by the verify endpoint and the webhook so the two can never disagree
 * about what "paid" means. Idempotent: if the payment is already PAID it
 * returns untouched, which matters because Paystack redelivers webhooks and
 * the browser may also verify the same reference.
 */
const applySuccessfulTransaction = async (payment, transaction) => {
  if (payment.status === PAYMENT_STATUS.PAID) {
    const order = await Order.findById(payment.order);
    return { payment, order, alreadyApplied: true };
  }

  const order = await Order.findById(payment.order);
  if (!order) throw ApiError.notFound("Order not found");

  // Cross-checks against what we recorded, not against anything a caller sent.
  if (transaction.reference !== payment.reference) {
    throw ApiError.badRequest("Transaction reference does not match");
  }
  if (Number(transaction.amount) !== payment.amount) {
    throw ApiError.badRequest(
      "Paid amount does not match the order — payment not applied",
    );
  }
  if (String(transaction.currency).toUpperCase() !== payment.currency) {
    throw ApiError.badRequest(
      "Paid currency does not match the order — payment not applied",
    );
  }

  payment.status = PAYMENT_STATUS.PAID;
  payment.paidAt = transaction.paid_at ? new Date(transaction.paid_at) : new Date();
  payment.metadata = transaction;
  await payment.save();

  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.paystackReference = payment.reference;
  order.paidAt = payment.paidAt;
  await order.save();

  return { payment, order, alreadyApplied: false };
};

/**
 * Record a transaction Paystack reports as not successful.
 *
 * The order is marked FAILED as well as the attempt, so the dashboard can
 * distinguish "not paid yet" from "a payment was tried and did not work".
 * FAILED is still payable — `loadPayableOrder` only refuses PAID — so the
 * buyer can retry, and initialize() resets it to PENDING for the new attempt.
 */
const applyFailedTransaction = async (payment, transaction) => {
  if (payment.status === PAYMENT_STATUS.PAID) return payment;

  payment.status = PAYMENT_STATUS.FAILED;
  payment.metadata = transaction;
  await payment.save();

  await Order.updateOne(
    { _id: payment.order, paymentStatus: { $ne: PAYMENT_STATUS.PAID } },
    { paymentStatus: PAYMENT_STATUS.FAILED },
  );

  return payment;
};

/**
 * Confirm a payment with Paystack.
 *
 * The reference is the only thing the browser supplies; everything decisive
 * comes from Paystack's own verify response.
 */
const verify = async (reference, user) => {
  const payment = await Payment.findOne({ reference }).select("+metadata");
  if (!payment) throw ApiError.notFound("Payment not found");

  const isOwner = payment.user.equals(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN;
  if (!isOwner && !isAdmin) {
    // Same reasoning as orders: do not confirm the reference exists.
    throw ApiError.notFound("Payment not found");
  }

  // Idempotent short-circuit — no second upstream call, no second write.
  if (payment.status === PAYMENT_STATUS.PAID) {
    const order = await Order.findById(payment.order);
    return {
      payment: publicPayment(payment),
      order,
      status: PAYMENT_STATUS.PAID,
      alreadyApplied: true,
    };
  }

  const transaction = await paystack.verifyTransaction(reference);

  // Paystack's own transaction state, not the HTTP status.
  if (transaction.status !== "success") {
    const failed = await applyFailedTransaction(payment, transaction);
    return {
      payment: publicPayment(failed),
      order: await Order.findById(payment.order),
      status: failed.status,
      paystackStatus: transaction.status,
      alreadyApplied: false,
    };
  }

  const result = await applySuccessfulTransaction(payment, transaction);

  return {
    payment: publicPayment(result.payment),
    order: result.order,
    status: PAYMENT_STATUS.PAID,
    alreadyApplied: result.alreadyApplied,
  };
};

/**
 * Handle a Paystack webhook.
 *
 * Signature is checked against the raw body before the payload is trusted for
 * anything. Unknown events are acknowledged and ignored, so Paystack does not
 * retry them forever.
 */
const handleWebhook = async (rawBody, signature) => {
  if (!paystack.verifyWebhookSignature(rawBody, signature)) {
    throw ApiError.unauthorized("Invalid webhook signature");
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw ApiError.badRequest("Webhook body is not valid JSON");
  }

  if (event?.event !== "charge.success") {
    return { handled: false, event: event?.event ?? "unknown" };
  }

  const reference = event?.data?.reference;
  if (!reference) throw ApiError.badRequest("Webhook is missing a reference");

  const payment = await Payment.findOne({ reference }).select("+metadata");
  // A reference we do not know is not an error worth retrying.
  if (!payment) return { handled: false, reason: "unknown reference" };

  const result = await applySuccessfulTransaction(payment, event.data);

  return {
    handled: true,
    alreadyApplied: result.alreadyApplied,
    reference,
  };
};

/** A single payment, readable by its owner (or an admin). */
const getById = async (paymentId, user) => {
  assertValidId(paymentId, "Payment");

  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound("Payment not found");

  const isOwner = payment.user.equals(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN;
  if (!isOwner && !isAdmin) throw ApiError.notFound("Payment not found");

  return publicPayment(payment);
};

/** Every payment attempt on an order, for the client's own record. */
const listForOrder = async (orderId, user) => {
  assertValidId(orderId);

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");

  const isParticipant =
    order.client.equals(user._id) || order.creative.equals(user._id);
  if (!isParticipant && user.role !== USER_ROLES.ADMIN) {
    throw ApiError.notFound("Order not found");
  }

  const payments = await Payment.find({ order: order._id }).sort({
    createdAt: -1,
  });

  return payments.map(publicPayment);
};

module.exports = {
  initialize,
  verify,
  handleWebhook,
  getById,
  listForOrder,
  publicPayment,
};

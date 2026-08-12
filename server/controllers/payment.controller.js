const paymentService = require("../services/payment.service");
const paystack = require("../services/paystack.service");
const ApiError = require("../utils/ApiError");

/**
 * A clear 503 beats an obscure 502 when the server simply has no key.
 * Checked in the controller so the service layer stays about payments.
 */
const assertConfigured = () => {
  if (!paystack.isConfigured()) {
    throw new ApiError(
      503,
      "Payments are not configured on this server. Set PAYSTACK_SECRET_KEY in server/.env",
    );
  }
};

/**
 * POST /api/payments/initialize
 *
 * Accepts only an orderId. Any `amount`, `currency`, `status` or `reference`
 * in the body is ignored — those are read from the Order and generated here.
 */
const initializePayment = async (req, res) => {
  assertConfigured();

  const orderId = req.body?.orderId ?? req.body?.order;
  if (!orderId || typeof orderId !== "string") {
    throw ApiError.badRequest("Validation failed", ["orderId is required"], {
      orderId: "orderId is required",
    });
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const result = await paymentService.initialize(orderId, req.user, {
    callbackUrl: `${clientUrl}/orders/callback`,
  });

  res.status(201).json({
    success: true,
    message: "Payment initialized",
    data: {
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      payment: paymentService.publicPayment(result.payment),
      order: {
        _id: result.order._id,
        amount: result.order.amount,
        currency: result.order.currency,
        paymentStatus: result.order.paymentStatus,
      },
    },
  });
};

/**
 * POST /api/payments/verify
 * The browser supplies a reference; everything else comes from Paystack.
 */
const verifyPayment = async (req, res) => {
  assertConfigured();

  const reference = req.body?.reference;
  if (!reference || typeof reference !== "string") {
    throw ApiError.badRequest("Validation failed", ["reference is required"], {
      reference: "reference is required",
    });
  }

  const result = await paymentService.verify(reference.trim(), req.user);

  res.json({
    success: true,
    message:
      result.status === "PAID"
        ? result.alreadyApplied
          ? "Payment already confirmed"
          : "Payment confirmed"
        : "Payment was not successful",
    data: result,
  });
};

/**
 * POST /api/payments/webhook — called by Paystack, never by a browser.
 *
 * Always answers 200 once the signature is valid: a non-2xx makes Paystack
 * retry, and an event we chose to ignore is not a failure. A bad signature
 * still throws, so unauthenticated callers get 401.
 */
const paystackWebhook = async (req, res) => {
  const result = await paymentService.handleWebhook(
    req.rawBody,
    req.headers["x-paystack-signature"],
  );

  res.json({ success: true, message: "Webhook received", data: result });
};

/** GET /api/payments/:id */
const getPayment = async (req, res) => {
  const payment = await paymentService.getById(req.params.id, req.user);
  res.json({ success: true, message: "Payment retrieved", data: { payment } });
};

/** GET /api/payments/order/:orderId */
const getOrderPayments = async (req, res) => {
  const payments = await paymentService.listForOrder(
    req.params.orderId,
    req.user,
  );
  res.json({
    success: true,
    message: "Payments retrieved",
    data: { payments, count: payments.length },
  });
};

module.exports = {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getPayment,
  getOrderPayments,
};

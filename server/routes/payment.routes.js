const express = require("express");
const {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getPayment,
  getOrderPayments,
} = require("../controllers/payment.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * Paystack calls this one, so it is deliberately unauthenticated — there is no
 * JWT to send. Its authentication is the HMAC signature over the raw body,
 * checked in payment.service before the payload is trusted.
 *
 * Declared before the authenticated routes purely for readability; Express
 * matches on path, so order is not significant here.
 */
router.post("/webhook", paystackWebhook);

router.post("/initialize", authenticate, initializePayment);
router.post("/verify", authenticate, verifyPayment);
router.get("/order/:orderId", authenticate, getOrderPayments);
router.get("/:id", authenticate, getPayment);

module.exports = router;

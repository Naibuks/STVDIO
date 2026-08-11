const mongoose = require("mongoose");
const {
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS,
  CURRENCIES,
  values,
} = require("../utils/constants");

/**
 * A transaction record — the audit trail for money.
 *
 * Order.paymentStatus answers "is this order paid?" quickly; Payment records
 * every attempt, including failures and retries, so a single order may have
 * several payments. Written only after server-side verification with Paystack
 * (Phase 7), never from a frontend success callback.
 */
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be a whole number in the currency's minor unit",
      },
    },
    currency: {
      type: String,
      enum: {
        values: CURRENCIES,
        message: "{VALUE} is not a supported currency",
      },
      default: "NGN",
      uppercase: true,
    },
    provider: {
      type: String,
      enum: {
        values: values(PAYMENT_PROVIDERS),
        message: "{VALUE} is not a supported payment provider",
      },
      default: PAYMENT_PROVIDERS.PAYSTACK,
    },
    /**
     * Provider transaction reference. Unique and required — this is what makes
     * webhook handling idempotent, since Paystack may deliver the same event
     * more than once and the duplicate insert will simply fail.
     */
    reference: {
      type: String,
      required: [true, "Reference is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: values(PAYMENT_STATUS),
        message: "{VALUE} is not a valid payment status",
      },
      default: PAYMENT_STATUS.PENDING,
    },
    /**
     * Raw verification response from the provider, for debugging and disputes.
     * Never expose this to clients — it can contain card and customer details.
     */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      select: false,
    },
    paidAt: Date,
  },
  { timestamps: true },
);

paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);

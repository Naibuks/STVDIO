const mongoose = require("mongoose");
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  CURRENCIES,
  values,
} = require("../utils/constants");

/**
 * A purchase of a Service.
 *
 * `status` (work progress) and `paymentStatus` (money) are deliberately
 * separate: an order can be PAID but still IN_PROGRESS, or DELIVERED while a
 * refund is pending. Collapsing them into one field would make those states
 * unrepresentable.
 */
const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client is required"],
    },
    creative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creative is required"],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required"],
    },
    /**
     * What the service looked like when it was bought. The creative can edit
     * or deactivate the live Service afterwards, so the order keeps its own
     * copy — otherwise a receipt would silently change after the fact.
     */
    serviceSnapshot: {
      title: String,
      price: Number,
      currency: String,
      deliveryTime: Number,
    },
    /** Charged amount in the currency's minor unit. See Service.price. */
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
    status: {
      type: String,
      enum: {
        values: values(ORDER_STATUS),
        message: "{VALUE} is not a valid order status",
      },
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: values(PAYMENT_STATUS),
        message: "{VALUE} is not a valid payment status",
      },
      default: PAYMENT_STATUS.PENDING,
    },
    /**
     * Paystack transaction reference. Unique so a single Paystack transaction
     * can never be attributed to two orders; sparse because it is absent until
     * checkout starts, and a unique index would otherwise reject every
     * unpaid order after the first.
     */
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    paidAt: Date,
    /** Buyer's instructions to the creative. */
    requirements: {
      type: String,
      trim: true,
      maxlength: [2000, "Requirements cannot exceed 2000 characters"],
    },
    dueAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

// Dashboard queries: "my orders as a buyer" and "my orders as a seller".
orderSchema.index({ client: 1, createdAt: -1 });
orderSchema.index({ creative: 1, createdAt: -1 });
orderSchema.index({ service: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });

/** Buying your own service would corrupt earnings and review data. */
orderSchema.pre("validate", function () {
  if (this.client && this.creative && this.client.equals(this.creative)) {
    throw new Error("A user cannot order their own service");
  }
});

module.exports = mongoose.model("Order", orderSchema);

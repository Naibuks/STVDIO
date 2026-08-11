const mongoose = require("mongoose");
const mediaSchema = require("./media.schema");
const { CATEGORIES, CURRENCIES } = require("../utils/constants");

/**
 * A packaged offering a creative sells, e.g. "Logo Design" or
 * "Half-day Photography Session".
 */
const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
    },
    /**
     * Price in the currency's MINOR unit as a whole number — ₦5,000 is 500000
     * kobo. Floats cannot represent money exactly, and Paystack's API expects
     * the minor unit, so storing it this way avoids both rounding bugs and a
     * conversion at payment time. Format for display at the edge, never here.
     */
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Price must be a whole number in the currency's minor unit",
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
    /** Turnaround in days. */
    deliveryTime: {
      type: Number,
      required: [true, "Delivery time is required"],
      min: [1, "Delivery time must be at least 1 day"],
      max: [365, "Delivery time cannot exceed 365 days"],
    },
    /** What the buyer receives, e.g. "3 concepts", "Source files". */
    deliverables: {
      type: [String],
      default: [],
    },
    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (media) => media.length <= 10,
        message: "A service cannot have more than 10 media items",
      },
    },
    /** Creatives hide a service instead of deleting it, so past orders survive. */
    isActive: {
      type: Boolean,
      default: true,
    },
    ordersCount: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

serviceSchema.index({ title: "text", description: "text" });
serviceSchema.index({ creator: 1, createdAt: -1 });
serviceSchema.index({ isActive: 1, category: 1, price: 1 });
serviceSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Service", serviceSchema);

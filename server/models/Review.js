const mongoose = require("mongoose");

/**
 * A client's review of a creative, written against a specific order.
 *
 * Anchoring reviews to an order is what makes ratings trustworthy — a review
 * can only exist where a real transaction did. The rule that the order must
 * be COMPLETED is enforced in the controller (Phase 6), since a schema cannot
 * read another document's state; the unique index below enforces the part
 * that can be guaranteed here: one review per order.
 */
const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required"],
    },
    creative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creative is required"],
    },
    /** Denormalised from the order so service pages can show their reviews. */
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 5",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  { timestamps: true },
);

// One review per order — blocks a client reviewing the same job twice.
reviewSchema.index({ order: 1 }, { unique: true });
// Reviews on a creative's profile and on a service page.
reviewSchema.index({ creative: 1, createdAt: -1 });
reviewSchema.index({ service: 1, createdAt: -1 });

/** Reviewing yourself would let a creative inflate their own rating. */
reviewSchema.pre("validate", function () {
  if (this.reviewer && this.creative && this.reviewer.equals(this.creative)) {
    throw new Error("A user cannot review themselves");
  }
});

module.exports = mongoose.model("Review", reviewSchema);

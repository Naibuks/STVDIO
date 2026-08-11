const mongoose = require("mongoose");
const {
  CATEGORIES,
  COLLABORATION_STATUS,
  CURRENCIES,
  values,
} = require("../utils/constants");

/**
 * An open creative opportunity, e.g. "Looking for a photographer for a Lagos
 * fashion campaign". Unlike a Service (the creative sells), a Collaboration is
 * posted by whoever needs the work done.
 */
const collaborationSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
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
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, "Location cannot exceed 120 characters"],
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    /**
     * Optional budget range in the currency's minor unit. Both bounds are
     * optional because plenty of opportunities are posted without a figure.
     */
    budget: {
      min: {
        type: Number,
        min: [0, "Budget cannot be negative"],
      },
      max: {
        type: Number,
        min: [0, "Budget cannot be negative"],
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
    },
    deadline: Date,
    status: {
      type: String,
      enum: {
        values: values(COLLABORATION_STATUS),
        message: "{VALUE} is not a valid collaboration status",
      },
      default: COLLABORATION_STATUS.OPEN,
    },
    applicationsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

collaborationSchema.index({ title: "text", description: "text" });
collaborationSchema.index({ status: 1, createdAt: -1 });
collaborationSchema.index({ category: 1, status: 1 });
collaborationSchema.index({ creator: 1, createdAt: -1 });

/** A max below the min would silently break range filtering. */
collaborationSchema.pre("validate", function () {
  const { min, max } = this.budget ?? {};
  if (min != null && max != null && max < min) {
    throw new Error("Budget max cannot be less than budget min");
  }
});

module.exports = mongoose.model("Collaboration", collaborationSchema);

const mongoose = require("mongoose");
const { APPLICATION_STATUS, values } = require("../utils/constants");

/**
 * A user applying to a Collaboration.
 */
const collaborationApplicationSchema = new mongoose.Schema(
  {
    collaboration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collaboration",
      required: [true, "Collaboration is required"],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant is required"],
    },
    message: {
      type: String,
      required: [true, "Application message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    /** Optional projects submitted as supporting work. */
    portfolioProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    status: {
      type: String,
      enum: {
        values: values(APPLICATION_STATUS),
        message: "{VALUE} is not a valid application status",
      },
      default: APPLICATION_STATUS.PENDING,
    },
    respondedAt: Date,
  },
  { timestamps: true },
);

// One application per user per opportunity, enforced by the database.
collaborationApplicationSchema.index(
  { collaboration: 1, applicant: 1 },
  { unique: true },
);
collaborationApplicationSchema.index({ collaboration: 1, status: 1 });
collaborationApplicationSchema.index({ applicant: 1, createdAt: -1 });

module.exports = mongoose.model(
  "CollaborationApplication",
  collaborationApplicationSchema,
);

const mongoose = require("mongoose");
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_TARGETS,
  values,
} = require("../utils/constants");

/**
 * An in-app notification.
 *
 * `relatedId` points at whatever the notification is about — a project, an
 * order, a conversation. Because that target varies, `relatedModel` names the
 * collection so Mongoose can populate it dynamically via refPath instead of
 * needing a separate field per type.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    /** Who triggered it. Absent for system notifications. */
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: values(NOTIFICATION_TYPES),
        message: "{VALUE} is not a valid notification type",
      },
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
      enum: {
        values: values(NOTIFICATION_TARGETS),
        message: "{VALUE} is not a valid notification target",
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true },
);

// The notification bell: a user's list, and their unread badge count.
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

/** refPath needs the model name, so require it whenever a target is set. */
notificationSchema.pre("validate", function () {
  if (this.relatedId && !this.relatedModel) {
    throw new Error("relatedModel is required when relatedId is set");
  }
});

module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");
const mediaSchema = require("./media.schema");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    /** Attachments. A message may be media-only, hence `content` is optional. */
    attachments: {
      type: [mediaSchema],
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true },
);

// Loading a conversation's history, newest first, then paginating back.
messageSchema.index({ conversation: 1, createdAt: -1 });
// Counting a user's unread messages in a conversation.
messageSchema.index({ conversation: 1, read: 1, sender: 1 });

/** An empty message with no attachments is not a message. */
messageSchema.pre("validate", function () {
  if (!this.content?.trim() && this.attachments.length === 0) {
    throw new Error("A message needs either content or an attachment");
  }
});

module.exports = mongoose.model("Message", messageSchema);

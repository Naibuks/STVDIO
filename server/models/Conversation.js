const mongoose = require("mongoose");

/**
 * A private one-to-one conversation.
 *
 * Preventing two conversations between the same pair is harder than it looks:
 * a unique index on an array field indexes each element separately, so it
 * would wrongly stop a user from having more than one conversation at all.
 * Instead the two participant ids are sorted and joined into `participantsKey`,
 * and that single string carries the unique index. Sorting makes the key
 * identical whichever user opens the conversation first.
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: true,
      validate: {
        validator: (participants) => participants.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
    },
    /** Derived: sorted participant ids joined by ":". Set automatically. */
    participantsKey: {
      type: String,
      required: true,
      unique: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    /** Sort key for the inbox. Denormalised so listing needs no join. */
    lastMessageAt: Date,
    /**
     * Unread counts keyed by user id, e.g. { "<userId>": 3 }. A map rather
     * than a field per user because participants are not known in advance.
     */
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  { timestamps: true },
);

// Inbox query: every conversation a user is in, most recent first.
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

conversationSchema.pre("validate", function () {
  if (this.participants?.length === 2) {
    const [a, b] = this.participants;
    if (a.equals(b)) {
      throw new Error("A user cannot start a conversation with themselves");
    }
    this.participantsKey = [a.toString(), b.toString()].sort().join(":");
  }
});

module.exports = mongoose.model("Conversation", conversationSchema);

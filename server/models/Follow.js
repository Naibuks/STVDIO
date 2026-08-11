const mongoose = require("mongoose");

/**
 * A directed follow relationship: `follower` follows `following`.
 *
 * Stored as its own collection for the same reasons as Like — unbounded
 * growth and database-enforced uniqueness.
 */
const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Follower is required"],
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Following is required"],
    },
  },
  { timestamps: true },
);

// The duplicate-follow guard.
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// Follower and following lists, newest first.
followSchema.index({ following: 1, createdAt: -1 });
followSchema.index({ follower: 1, createdAt: -1 });

/**
 * A unique index cannot express "these two fields must differ", so self-follows
 * are rejected in validation instead.
 */
followSchema.pre("validate", function () {
  if (this.follower && this.following && this.follower.equals(this.following)) {
    throw new Error("A user cannot follow themselves");
  }
});

module.exports = mongoose.model("Follow", followSchema);

const mongoose = require("mongoose");

/**
 * A like is its own document rather than an array on Project.
 *
 * An array would grow without bound inside the 16 MB document limit, and
 * answering "has this user liked this project?" would mean scanning it. A
 * separate collection with a compound unique index makes a duplicate like
 * impossible at the database level — not merely discouraged in a controller.
 */
const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
  },
  { timestamps: true },
);

// The duplicate-like guard. A second insert of the same pair throws E11000.
likeSchema.index({ user: 1, project: 1 }, { unique: true });
// "Who liked this project" and "what has this user liked".
likeSchema.index({ project: 1, createdAt: -1 });
likeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Like", likeSchema);

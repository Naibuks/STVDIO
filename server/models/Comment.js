const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    /**
     * Set when this comment replies to another comment. One level of nesting
     * only — replies to replies attach to the same top-level parent, which
     * keeps rendering simple and avoids unbounded recursion.
     */
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true },
);

// Reading a project's comments newest-first is the only common query.
commentSchema.index({ project: 1, createdAt: -1 });
commentSchema.index({ parent: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);

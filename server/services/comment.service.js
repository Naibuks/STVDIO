const mongoose = require("mongoose");
const { Comment, Project } = require("../models");
const ApiError = require("../utils/ApiError");
const { USER_ROLES } = require("../utils/constants");
const { assertViewable } = require("./like.service");

/**
 * Only public profile fields are populated onto a comment's author.
 * An allowlist, so a field added to User later stays private by default —
 * and `email` is deliberately absent.
 */
const AUTHOR_FIELDS = "name username avatar role isVerified";

const listForProject = async (projectId, viewer, { page = 1, limit = 30 } = {}) => {
  const project = await assertViewable(projectId, viewer);
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ project: project._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", AUTHOR_FIELDS),
    Comment.countDocuments({ project: project._id }),
  ]);

  return { comments, total, page, limit };
};

/** Post a comment. The author is the authenticated user, never the body. */
const create = async (projectId, viewer, { content }) => {
  const project = await assertViewable(projectId, viewer);

  const comment = await Comment.create({
    user: viewer._id,
    project: project._id,
    content,
  });

  await Project.updateOne({ _id: project._id }, { $inc: { commentsCount: 1 } });

  return comment.populate("user", AUTHOR_FIELDS);
};

/**
 * Delete a comment.
 *
 * Allowed for the comment's author, for an admin (moderation), and for the
 * owner of the project the comment sits on — a creative can clear abuse from
 * their own work without waiting for an admin. Anyone else gets 403.
 */
const remove = async (commentId, actor) => {
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw ApiError.notFound("Comment not found");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");

  const project = await Project.findById(comment.project).select("owner");

  const isAuthor = comment.user.equals(actor._id);
  const isAdmin = actor.role === USER_ROLES.ADMIN;
  const isProjectOwner = Boolean(project && project.owner.equals(actor._id));

  if (!isAuthor && !isAdmin && !isProjectOwner) {
    throw ApiError.forbidden("You can only delete your own comments");
  }

  await comment.deleteOne();

  await Project.updateOne(
    { _id: comment.project, commentsCount: { $gt: 0 } },
    { $inc: { commentsCount: -1 } },
  );

  return { id: commentId };
};

module.exports = { listForProject, create, remove };

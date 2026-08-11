const likeService = require("../services/like.service");
const commentService = require("../services/comment.service");
const followService = require("../services/follow.service");
const ApiError = require("../utils/ApiError");
const { validateComment, validateFeedQuery } = require("../utils/validators");

/**
 * Likes, comments and follows share one controller because each is a thin
 * HTTP shell over its own service — three near-empty files would add
 * navigation cost without adding separation.
 */

// --- Likes ----------------------------------------------------------------

/** POST /api/projects/:id/like */
const likeProject = async (req, res) => {
  const data = await likeService.like(req.params.id, req.user);
  res.status(201).json({ success: true, message: "Project liked", data });
};

/** DELETE /api/projects/:id/like */
const unlikeProject = async (req, res) => {
  const data = await likeService.unlike(req.params.id, req.user);
  res.json({ success: true, message: "Like removed", data });
};

/** GET /api/projects/:id/likes */
const getProjectLikes = async (req, res) => {
  const { value } = validateFeedQuery(req.query);
  const data = await likeService.listLikes(req.params.id, req.user, value);
  res.json({ success: true, message: "Likes retrieved", data });
};

// --- Comments -------------------------------------------------------------

/** GET /api/projects/:id/comments */
const getProjectComments = async (req, res) => {
  const { value } = validateFeedQuery(req.query);
  const data = await commentService.listForProject(
    req.params.id,
    req.user,
    value,
  );
  res.json({ success: true, message: "Comments retrieved", data });
};

/** POST /api/projects/:id/comments */
const createComment = async (req, res) => {
  const { errors, value } = validateComment(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);

  const comment = await commentService.create(req.params.id, req.user, value);

  res.status(201).json({
    success: true,
    message: "Comment posted",
    data: { comment },
  });
};

/** DELETE /api/comments/:id */
const deleteComment = async (req, res) => {
  await commentService.remove(req.params.id, req.user);
  res.json({ success: true, message: "Comment deleted", data: null });
};

// --- Follows --------------------------------------------------------------

/** POST /api/users/:username/follow */
const followUser = async (req, res) => {
  const data = await followService.follow(req.params.username, req.user);
  res.status(201).json({ success: true, message: "Followed", data });
};

/** DELETE /api/users/:username/follow */
const unfollowUser = async (req, res) => {
  const data = await followService.unfollow(req.params.username, req.user);
  res.json({ success: true, message: "Unfollowed", data });
};

/** GET /api/users/:username/followers */
const getFollowers = async (req, res) => {
  const { value } = validateFeedQuery(req.query);
  const data = await followService.listFollowers(req.params.username, value);
  res.json({ success: true, message: "Followers retrieved", data });
};

/** GET /api/users/:username/following */
const getFollowing = async (req, res) => {
  const { value } = validateFeedQuery(req.query);
  const data = await followService.listFollowing(req.params.username, value);
  res.json({ success: true, message: "Following retrieved", data });
};

module.exports = {
  likeProject,
  unlikeProject,
  getProjectLikes,
  getProjectComments,
  createComment,
  deleteComment,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};

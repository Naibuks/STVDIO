const userService = require("../services/user.service");
const followService = require("../services/follow.service");
const { withLikeState } = require("../services/feed.service");
const ApiError = require("../utils/ApiError");
const { validateProfileUpdate, validateAccountDeletion } = require("../utils/validators");

/** GET /api/users/me — the caller's own profile, including private fields. */
const getMe = async (req, res) => {
  res.json({
    success: true,
    message: "Profile retrieved",
    data: { user: req.user },
  });
};

/** PUT /api/users/me — update the caller's own profile. */
const updateMe = async (req, res) => {
  const { errors, value } = validateProfileUpdate(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);

  const user = await userService.updateOwnProfile(req.user._id, value);

  res.json({
    success: true,
    message: "Profile updated",
    data: { user },
  });
};

/** DELETE /api/users/me — permanently delete the authenticated user account. */
const deleteMe = async (req, res) => {
  const { errors, value } = validateAccountDeletion(req.body);
  if (errors.length) throw ApiError.badRequest("Confirmation required", errors);

  const result = await userService.deleteOwnAccount(req.user._id, value.confirmation);

  res.json({
    success: true,
    message: "Account deleted",
    data: result,
  });
};

/** GET /api/users/:username — public profile. */
const getPublicProfile = async (req, res) => {
  const user = await userService.getPublicProfile(req.params.username);

  // Lets the FollowButton render the right state on first paint instead of
  // flashing "Follow" before a second request corrects it.
  const isFollowing = await followService.isFollowing(user._id, req.user);
  const isSelf = Boolean(req.user && req.user._id.equals(user._id));

  res.json({
    success: true,
    message: "Profile retrieved",
    data: { user, isFollowing, isSelf },
  });
};

/** GET /api/users/:username/projects — that user's public portfolio. */
const getUserProjects = async (req, res) => {
  const { owner, projects, isOwner } = await userService.getUserProjects(
    req.params.username,
    req.user,
  );

  // The profile page renders the FollowButton from this single request, so the
  // relationship state ships with the portfolio rather than needing a second
  // round trip.
  const isFollowing = await followService.isFollowing(owner._id, req.user);

  res.json({
    success: true,
    message: "Portfolio retrieved",
    data: {
      owner,
      projects: await withLikeState(projects, req.user),
      isOwner,
      isFollowing,
      count: projects.length,
    },
  });
};

module.exports = { getMe, updateMe, deleteMe, getPublicProfile, getUserProjects };

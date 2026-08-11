const userService = require("../services/user.service");
const ApiError = require("../utils/ApiError");
const { validateProfileUpdate } = require("../utils/validators");

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

/** GET /api/users/:username — public profile. */
const getPublicProfile = async (req, res) => {
  const user = await userService.getPublicProfile(req.params.username);

  res.json({
    success: true,
    message: "Profile retrieved",
    data: { user },
  });
};

/** GET /api/users/:username/projects — that user's public portfolio. */
const getUserProjects = async (req, res) => {
  const { owner, projects, isOwner } = await userService.getUserProjects(
    req.params.username,
    req.user,
  );

  res.json({
    success: true,
    message: "Portfolio retrieved",
    data: { owner, projects, isOwner, count: projects.length },
  });
};

module.exports = { getMe, updateMe, getPublicProfile, getUserProjects };

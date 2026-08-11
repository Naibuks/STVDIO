const { User, Project } = require("../models");
const ApiError = require("../utils/ApiError");
const { PROJECT_VISIBILITY } = require("../utils/constants");

/**
 * Fields safe to show on a public profile.
 *
 * An allowlist rather than a denylist: a field added to the User schema later
 * is private until someone deliberately adds it here. Note the absence of
 * `email` — it is visible to the account owner via /me, never to the public.
 */
const PUBLIC_PROFILE_FIELDS = [
  "_id",
  "name",
  "username",
  "role",
  "avatar",
  "coverImage",
  "bio",
  "location",
  "skills",
  "categories",
  "website",
  "socialLinks",
  "isVerified",
  "followersCount",
  "followingCount",
  "projectsCount",
  "rating",
  "reviewsCount",
  "createdAt",
].join(" ");

/** Look up a public profile by username. */
const getPublicProfile = async (username) => {
  const user = await User.findOne({
    username: String(username).toLowerCase(),
    // A deactivated account is indistinguishable from one that never existed.
    isActive: true,
  }).select(PUBLIC_PROFILE_FIELDS);

  if (!user) throw ApiError.notFound("Profile not found");
  return user;
};

/**
 * A user's public portfolio.
 *
 * PRIVATE and UNLISTED projects are excluded for everyone except the owner —
 * UNLISTED means reachable by direct link, not listed on the profile.
 */
const getUserProjects = async (username, viewer) => {
  const owner = await getPublicProfile(username);
  // Boolean(), not a truthy value: an undefined field is dropped entirely by
  // JSON.stringify, so an anonymous viewer would receive no `isOwner` key.
  const isOwner = Boolean(viewer && viewer._id.equals(owner._id));

  const filter = { owner: owner._id };
  if (!isOwner) filter.visibility = PROJECT_VISIBILITY.PUBLIC;

  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .populate("owner", "name username avatar");

  return { owner, projects, isOwner };
};

/**
 * Apply a validated, whitelisted patch to the authenticated user.
 *
 * The document is loaded and saved rather than updated in place so that
 * schema validators and the password-hashing hook behave exactly as they do
 * everywhere else. `runValidators` on an update would not fire the hooks.
 */
const updateOwnProfile = async (userId, patch) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  // Username is unique — check before saving so the client gets a clear 409
  // rather than a raw duplicate-key error.
  if (patch.username && patch.username !== user.username) {
    const taken = await User.exists({
      username: patch.username,
      _id: { $ne: user._id },
    });
    if (taken) throw ApiError.conflict("That username is already taken");
  }

  Object.assign(user, patch);
  await user.save();

  return user;
};

module.exports = {
  getPublicProfile,
  getUserProjects,
  updateOwnProfile,
  PUBLIC_PROFILE_FIELDS,
};

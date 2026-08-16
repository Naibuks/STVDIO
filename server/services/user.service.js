const mongoose = require("mongoose");
const {
  User,
  Project,
  Service,
  Like,
  Comment,
  Follow,
  Notification,
  Collaboration,
  CollaborationApplication,
  Conversation,
  Message,
  Review,
} = require("../models");
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

  /**
   * `avatar: null` means "remove it". Assigning null (or undefined) to a
   * subdocument path does not reliably clear it, so the path is unset
   * explicitly and removed from the patch before the rest is applied.
   */
  const { avatar, ...rest } = patch;
  if ("avatar" in patch && avatar === null) {
    user.set("avatar", undefined);
  } else if (avatar) {
    user.set("avatar", avatar);
  }

  Object.assign(user, rest);
  await user.save();

  return user;
};

/**
 * Delete the authenticated user and the data they created while keeping the
 * financial audit trail intact. We do not accept a client-supplied userId and
 * we clean up all user-owned references before removing the account itself.
 */
const deleteOwnAccount = async (userId, confirmation) => {
  if (confirmation !== "DELETE") {
    throw ApiError.badRequest("Confirmation required", ["Type DELETE to confirm account deletion"]);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.notFound("User not found");
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const userObjectId = user._id;

  const conversations = await Conversation.find({ participants: userObjectId }).select(
    "_id",
  );
  const conversationIds = conversations.map((conversation) => conversation._id);

  await Promise.all([
    Project.deleteMany({ owner: userObjectId }),
    Service.deleteMany({ creator: userObjectId }),
    Like.deleteMany({ $or: [{ user: userObjectId }, { project: { $in: await Project.find({ owner: userObjectId }).distinct("_id") } }] }),
    Comment.deleteMany({ $or: [{ user: userObjectId }, { project: { $in: await Project.find({ owner: userObjectId }).distinct("_id") } }] }),
    Follow.deleteMany({
      $or: [{ follower: userObjectId }, { following: userObjectId }],
    }),
    Notification.deleteMany({
      $or: [{ recipient: userObjectId }, { actor: userObjectId }],
    }),
    Collaboration.deleteMany({ creator: userObjectId }),
    CollaborationApplication.deleteMany({ applicant: userObjectId }),
    Review.deleteMany({
      $or: [{ reviewer: userObjectId }, { creative: userObjectId }],
    }),
    Message.deleteMany({
      $or: [{ sender: userObjectId }, { conversation: { $in: conversationIds } }],
    }),
    Conversation.deleteMany({ participants: userObjectId }),
    Project.updateMany(
      { collaborators: userObjectId },
      { $pull: { collaborators: userObjectId } },
    ),
  ]);

  await User.findByIdAndDelete(userObjectId);

  return {
    deletedUserId: String(userObjectId),
    deletedProjects: true,
    deletedServices: true,
    deletedConversations: conversationIds.length,
    preservedFinancialHistory: true,
  };
};

module.exports = {
  getPublicProfile,
  getUserProjects,
  updateOwnProfile,
  deleteOwnAccount,
  PUBLIC_PROFILE_FIELDS,
};

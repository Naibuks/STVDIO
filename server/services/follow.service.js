const { Follow, User } = require("../models");
const ApiError = require("../utils/ApiError");
const userService = require("./user.service");

const PROFILE_FIELDS =
  "name username avatar role bio location categories isVerified followersCount projectsCount";

/**
 * Resolve the target of a follow action.
 * Reuses getPublicProfile, which already 404s for a deactivated account, so a
 * deactivated user cannot be followed.
 */
const resolveTarget = (username) => userService.getPublicProfile(username);

/**
 * Follow a user.
 *
 * Self-follow is rejected here with a 400 rather than being left to the
 * model's pre-validate hook: that hook throws a plain Error, which the error
 * handler would report as a 500.
 *
 * Both counters are only incremented after the insert has succeeded, so a
 * duplicate attempt cannot inflate them.
 */
const follow = async (username, follower) => {
  const target = await resolveTarget(username);

  if (target._id.equals(follower._id)) {
    throw ApiError.badRequest("You cannot follow yourself");
  }

  try {
    await Follow.create({ follower: follower._id, following: target._id });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict(`You already follow @${target.username}`);
    }
    throw error;
  }

  await Promise.all([
    User.updateOne({ _id: target._id }, { $inc: { followersCount: 1 } }),
    User.updateOne({ _id: follower._id }, { $inc: { followingCount: 1 } }),
  ]);

  return {
    following: true,
    followersCount: target.followersCount + 1,
    username: target.username,
  };
};

/** Remove only the caller's own follow relationship. */
const unfollow = async (username, follower) => {
  const target = await resolveTarget(username);

  const { deletedCount } = await Follow.deleteOne({
    follower: follower._id,
    following: target._id,
  });

  if (deletedCount === 0) {
    throw ApiError.notFound(`You do not follow @${target.username}`);
  }

  await Promise.all([
    User.updateOne(
      { _id: target._id, followersCount: { $gt: 0 } },
      { $inc: { followersCount: -1 } },
    ),
    User.updateOne(
      { _id: follower._id, followingCount: { $gt: 0 } },
      { $inc: { followingCount: -1 } },
    ),
  ]);

  return {
    following: false,
    followersCount: Math.max(0, target.followersCount - 1),
    username: target.username,
  };
};

/**
 * Shared implementation of the followers / following lists.
 * `edge` is the field holding the target, `other` the field to populate.
 */
const listRelationships = async (
  username,
  { edge, other, page = 1, limit = 24 },
) => {
  const target = await resolveTarget(username);
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    Follow.find({ [edge]: target._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(other, PROFILE_FIELDS),
    Follow.countDocuments({ [edge]: target._id }),
  ]);

  return {
    users: rows.map((row) => row[other]).filter(Boolean),
    total,
    page,
    limit,
  };
};

const listFollowers = (username, options) =>
  listRelationships(username, {
    edge: "following",
    other: "follower",
    ...options,
  });

const listFollowing = (username, options) =>
  listRelationships(username, {
    edge: "follower",
    other: "following",
    ...options,
  });

/** Does the viewer already follow this user? False when anonymous. */
const isFollowing = async (targetId, viewer) => {
  if (!viewer || viewer._id.equals(targetId)) return false;
  return Boolean(
    await Follow.exists({ follower: viewer._id, following: targetId }),
  );
};

module.exports = {
  follow,
  unfollow,
  listFollowers,
  listFollowing,
  isFollowing,
};

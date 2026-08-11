const { Like, Project } = require("../models");
const ApiError = require("../utils/ApiError");
const projectService = require("./project.service");

const LIKER_FIELDS = "name username avatar role";

/**
 * A viewer may only interact with a project they are allowed to see.
 *
 * Reuses project.service.getById rather than re-implementing the visibility
 * rules, so a PRIVATE project 404s here exactly as it does when read directly
 * — liking cannot be used to probe for hidden work.
 */
const assertViewable = async (projectId, viewer) => {
  const { project } = await projectService.getById(projectId, viewer);
  return project;
};

/**
 * Like a project.
 *
 * The unique index on {user, project} is the real duplicate guard; the E11000
 * catch simply turns it into a 409. The counter is only incremented once the
 * insert has actually succeeded, so it cannot drift on a duplicate attempt.
 */
const like = async (projectId, viewer) => {
  const project = await assertViewable(projectId, viewer);

  try {
    await Like.create({ user: viewer._id, project: project._id });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict("You have already liked this project");
    }
    throw error;
  }

  await Project.updateOne({ _id: project._id }, { $inc: { likesCount: 1 } });

  return { likesCount: project.likesCount + 1, likedByMe: true };
};

/** Remove only the caller's own like. */
const unlike = async (projectId, viewer) => {
  const project = await assertViewable(projectId, viewer);

  const { deletedCount } = await Like.deleteOne({
    user: viewer._id,
    project: project._id,
  });

  if (deletedCount === 0) {
    throw ApiError.notFound("You have not liked this project");
  }

  // The `$gt: 0` guard means a counter that somehow reached zero can never go
  // negative, even if a like was removed out of band.
  await Project.updateOne(
    { _id: project._id, likesCount: { $gt: 0 } },
    { $inc: { likesCount: -1 } },
  );

  return {
    likesCount: Math.max(0, project.likesCount - 1),
    likedByMe: false,
  };
};

/** Who liked a project, newest first. Readable by anyone who can see it. */
const listLikes = async (projectId, viewer, { page = 1, limit = 24 } = {}) => {
  const project = await assertViewable(projectId, viewer);
  const skip = (page - 1) * limit;

  const [likes, total] = await Promise.all([
    Like.find({ project: project._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", LIKER_FIELDS),
    Like.countDocuments({ project: project._id }),
  ]);

  const likedByMe = viewer
    ? Boolean(await Like.exists({ user: viewer._id, project: project._id }))
    : false;

  return {
    users: likes.map((entry) => entry.user).filter(Boolean),
    total,
    likedByMe,
    page,
    limit,
  };
};

/** Has this viewer liked this project? False when anonymous. */
const isLikedBy = async (projectId, viewer) => {
  if (!viewer) return false;
  return Boolean(await Like.exists({ user: viewer._id, project: projectId }));
};

module.exports = { like, unlike, listLikes, assertViewable, isLikedBy };

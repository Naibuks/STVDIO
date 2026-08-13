const mongoose = require("mongoose");
const { Project, User, Like, Comment } = require("../models");
const ApiError = require("../utils/ApiError");
const { PROJECT_VISIBILITY, USER_ROLES } = require("../utils/constants");

const OWNER_FIELDS = "name username avatar role";

/** Reject a malformed id before it reaches MongoDB and throws a CastError. */
const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound("Project not found");
  }
};

/**
 * Load a project and confirm the actor may modify it.
 *
 * This is the single chokepoint for ownership. Both update and delete go
 * through it, so the rule cannot drift between the two. It deliberately
 * returns 403 (not 404) for a project that exists but belongs to someone
 * else — the caller is authenticated, so hiding its existence buys nothing.
 */
const loadOwnedProject = async (projectId, actor) => {
  assertValidId(projectId);

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const isOwner = project.owner.equals(actor._id);
  const isAdmin = actor.role === USER_ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You can only modify your own projects");
  }

  return project;
};

const create = async (ownerId, data) => {
  // Ownership comes from the authenticated token, never from the request body.
  const project = await Project.create({ ...data, owner: ownerId });

  await User.updateOne({ _id: ownerId }, { $inc: { projectsCount: 1 } });

  return project.populate("owner", OWNER_FIELDS);
};

/** Every project belonging to the caller, including private ones. */
const listOwn = (ownerId) =>
  Project.find({ owner: ownerId })
    .sort({ createdAt: -1 })
    .populate("owner", OWNER_FIELDS);

/**
 * A single project.
 *
 * PRIVATE projects are visible only to their owner and to admins; to anyone
 * else they 404 rather than 403, so a private project's existence stays
 * secret. UNLISTED is readable by direct link, which is the point of it.
 */
const getById = async (projectId, viewer) => {
  assertValidId(projectId);

  const project = await Project.findById(projectId).populate(
    "owner",
    OWNER_FIELDS,
  );
  if (!project) throw ApiError.notFound("Project not found");

  const ownerId = project.owner?._id ?? project.owner;
  const isOwner = viewer && ownerId.equals(viewer._id);
  const isAdmin = viewer?.role === USER_ROLES.ADMIN;

  if (project.visibility === PROJECT_VISIBILITY.PRIVATE && !isOwner && !isAdmin) {
    throw ApiError.notFound("Project not found");
  }

  return { project, isOwner: Boolean(isOwner) };
};

const update = async (projectId, actor, patch) => {
  const project = await loadOwnedProject(projectId, actor);

  Object.assign(project, patch);
  await project.save();

  return project.populate("owner", OWNER_FIELDS);
};

const remove = async (projectId, actor) => {
  const project = await loadOwnedProject(projectId, actor);
  const ownerId = project.owner;

  await project.deleteOne();

  /**
   * Likes and comments reference the project and have no meaning without it,
   * so they are removed with it. Without this they became rows no endpoint
   * could ever reach again — and they would still be counted by anything that
   * aggregates over the collections, such as the admin statistics.
   */
  const [likes, comments] = await Promise.all([
    Like.deleteMany({ project: projectId }),
    Comment.deleteMany({ project: projectId }),
  ]);

  // Keep the profile counter honest, and never let it go negative.
  await User.updateOne(
    { _id: ownerId, projectsCount: { $gt: 0 } },
    { $inc: { projectsCount: -1 } },
  );

  return {
    id: projectId,
    likesRemoved: likes.deletedCount,
    commentsRemoved: comments.deletedCount,
  };
};

module.exports = { create, listOwn, getById, update, remove };

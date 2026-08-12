const mongoose = require("mongoose");
const {
  Collaboration,
  CollaborationApplication,
  User,
} = require("../models");
const ApiError = require("../utils/ApiError");
const {
  APPLICATION_STATUS,
  COLLABORATION_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TARGETS,
  USER_ROLES,
} = require("../utils/constants");
const notificationService = require("./notification.service");
const emailService = require("./email/email.service");

/**
 * Collaboration opportunities and the applications made to them.
 *
 * Both live here because an application has no meaning outside its
 * collaboration — every application rule needs the parent loaded anyway.
 */

const CREATOR_FIELDS = "name username avatar role isVerified";
const APPLICANT_FIELDS =
  "name username avatar role isVerified bio location categories";

/** Only an OPEN opportunity accepts new applications. */
const isAcceptingApplications = (collaboration) =>
  collaboration.status === COLLABORATION_STATUS.OPEN;

const assertValidId = (id, label = "Collaboration") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound(`${label} not found`);
  }
};

/**
 * Load a collaboration and confirm the actor may change it.
 *
 * The single chokepoint for ownership, mirroring project.service and
 * marketplace.service so edit, delete, close and application-management
 * cannot drift apart.
 */
const loadOwnedCollaboration = async (collaborationId, actor) => {
  assertValidId(collaborationId);

  const collaboration = await Collaboration.findById(collaborationId);
  if (!collaboration) throw ApiError.notFound("Collaboration not found");

  const isOwner = collaboration.creator.equals(actor._id);
  const isAdmin = actor.role === USER_ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You can only manage your own collaborations");
  }

  return collaboration;
};

// --- Collaborations -------------------------------------------------------

/**
 * Public discovery.
 *
 * Defaults to OPEN opportunities — a board of things you cannot apply to is
 * not a board — but an explicit `status` shows any state.
 */
const browse = async ({ page, limit, category, search, status, location }) => {
  const filter = {};
  filter.status = status || COLLABORATION_STATUS.OPEN;
  if (category) filter.category = category;
  // Location is a free-text field, so an anchored, escaped prefix match is the
  // only safe option — $text is already taken by title/description.
  if (location) {
    filter.location = {
      $regex: `^${String(location).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      $options: "i",
    };
  }
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;
  const sort = search
    ? { score: { $meta: "textScore" }, createdAt: -1 }
    : { createdAt: -1 };

  const query = Collaboration.find(filter);
  if (search) query.select({ score: { $meta: "textScore" } });

  const [collaborations, total] = await Promise.all([
    query.sort(sort).skip(skip).limit(limit).populate("creator", CREATOR_FIELDS),
    Collaboration.countDocuments(filter),
  ]);

  return {
    collaborations,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: skip + collaborations.length < total,
  };
};

/** Every opportunity the caller posted, in any state. */
const listOwn = (creatorId) =>
  Collaboration.find({ creator: creatorId })
    .sort({ createdAt: -1 })
    .populate("creator", CREATOR_FIELDS);

/** Applications the caller has sent, with their outcome. */
const listOwnApplications = (applicantId) =>
  CollaborationApplication.find({ applicant: applicantId })
    .sort({ createdAt: -1 })
    .populate({
      path: "collaboration",
      select: "title category location status deadline budget creator",
      populate: { path: "creator", select: CREATOR_FIELDS },
    });

/**
 * A single opportunity.
 *
 * Also reports the viewer's relationship to it, so the page can decide between
 * an application form, a management panel, or neither — without a second
 * request and without leaking who else applied.
 */
const getById = async (collaborationId, viewer) => {
  assertValidId(collaborationId);

  const collaboration = await Collaboration.findById(collaborationId).populate(
    "creator",
    CREATOR_FIELDS,
  );
  if (!collaboration) throw ApiError.notFound("Collaboration not found");

  const creatorId = collaboration.creator?._id ?? collaboration.creator;
  const isOwner = Boolean(viewer && creatorId.equals(viewer._id));

  // Only ever the viewer's own application — never anybody else's.
  const myApplication =
    viewer && !isOwner
      ? await CollaborationApplication.findOne({
          collaboration: collaboration._id,
          applicant: viewer._id,
        }).select("status message createdAt respondedAt")
      : null;

  return { collaboration, isOwner, myApplication };
};

const create = async (creatorId, data) => {
  // Ownership comes from the authenticated token, never the request body.
  const collaboration = await Collaboration.create({
    ...data,
    creator: creatorId,
  });
  return collaboration.populate("creator", CREATOR_FIELDS);
};

const update = async (collaborationId, actor, patch) => {
  const collaboration = await loadOwnedCollaboration(collaborationId, actor);
  Object.assign(collaboration, patch);
  await collaboration.save();
  return collaboration.populate("creator", CREATOR_FIELDS);
};

/**
 * Delete an opportunity and its applications.
 *
 * Applications reference the collaboration and have no meaning without it, so
 * leaving them behind would orphan rows that no endpoint can reach.
 */
const remove = async (collaborationId, actor) => {
  const collaboration = await loadOwnedCollaboration(collaborationId, actor);

  const { deletedCount } = await CollaborationApplication.deleteMany({
    collaboration: collaboration._id,
  });
  await collaboration.deleteOne();

  return { id: collaborationId, applicationsRemoved: deletedCount };
};

// --- Applications ---------------------------------------------------------

/**
 * Apply to an opportunity.
 *
 * Rules, in the order they are checked: the opportunity must exist, it must be
 * open, you cannot apply to your own, and you cannot apply twice. The last one
 * is guaranteed by the compound unique index — the catch simply turns E11000
 * into a 409, so two simultaneous requests still cannot both succeed.
 */
const apply = async (collaborationId, applicant, { message, portfolioProjects }) => {
  assertValidId(collaborationId);

  const collaboration = await Collaboration.findById(collaborationId);
  if (!collaboration) throw ApiError.notFound("Collaboration not found");

  if (collaboration.creator.equals(applicant._id)) {
    throw ApiError.badRequest("You cannot apply to your own collaboration");
  }

  if (!isAcceptingApplications(collaboration)) {
    throw ApiError.conflict(
      `This collaboration is ${collaboration.status.toLowerCase()} and is no longer accepting applications`,
    );
  }

  let application;
  try {
    application = await CollaborationApplication.create({
      collaboration: collaboration._id,
      applicant: applicant._id,
      message,
      ...(portfolioProjects && { portfolioProjects }),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict("You have already applied to this collaboration");
    }
    throw error;
  }

  await Collaboration.updateOne(
    { _id: collaboration._id },
    { $inc: { applicationsCount: 1 } },
  );

  // In-app notification first: it is the record users see inside STVDIO°.
  await notificationService.notify({
    recipient: collaboration.creator,
    actor: applicant._id,
    type: NOTIFICATION_TYPES.COLLABORATION_APPLICATION,
    message: `${applicant.name} applied to "${collaboration.title}"`,
    relatedId: collaboration._id,
    relatedModel: NOTIFICATION_TARGETS.COLLABORATION,
  });

  // Email is dispatched, not awaited — Phase 8's rule that a mail provider
  // can never delay or fail a business transaction.
  emailService.dispatch(async () => {
    const creator = await User.findById(collaboration.creator).select(
      "name email",
    );
    if (!creator) return;
    await emailService.sendCollaborationNotification({
      recipient: creator,
      actor: applicant,
      collaboration,
      kind: "APPLICATION",
    });
  });

  return application.populate("applicant", APPLICANT_FIELDS);
};

/** Applications on an opportunity — visible only to the person who posted it. */
const listApplications = async (collaborationId, actor, { status } = {}) => {
  const collaboration = await loadOwnedCollaboration(collaborationId, actor);

  const filter = { collaboration: collaboration._id };
  if (status) filter.status = status;

  const applications = await CollaborationApplication.find(filter)
    .sort({ createdAt: -1 })
    .populate("applicant", APPLICANT_FIELDS)
    .populate("portfolioProjects", "title media category");

  return { collaboration, applications };
};

/**
 * Accept or reject an application.
 *
 * Only PENDING applications can be decided. A decision is final: re-deciding
 * would send a second contradictory notification and email to someone who has
 * already been told the outcome.
 */
const respondToApplication = async (
  collaborationId,
  applicationId,
  actor,
  nextStatus,
) => {
  const collaboration = await loadOwnedCollaboration(collaborationId, actor);
  assertValidId(applicationId, "Application");

  const application = await CollaborationApplication.findOne({
    _id: applicationId,
    // Scoped to this collaboration so an id from someone else's opportunity
    // cannot be decided by way of a collaboration the actor does own.
    collaboration: collaboration._id,
  }).populate("applicant", APPLICANT_FIELDS);

  if (!application) throw ApiError.notFound("Application not found");

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw ApiError.conflict(
      `This application has already been ${application.status.toLowerCase()}`,
    );
  }

  application.status = nextStatus;
  application.respondedAt = new Date();
  await application.save();

  const accepted = nextStatus === APPLICATION_STATUS.ACCEPTED;

  await notificationService.notify({
    recipient: application.applicant._id,
    actor: actor._id,
    type: accepted
      ? NOTIFICATION_TYPES.COLLABORATION_ACCEPTED
      : NOTIFICATION_TYPES.COLLABORATION_REJECTED,
    message: accepted
      ? `Your application to "${collaboration.title}" was accepted`
      : `Your application to "${collaboration.title}" was not successful`,
    relatedId: collaboration._id,
    relatedModel: NOTIFICATION_TARGETS.COLLABORATION,
  });

  emailService.dispatch(async () => {
    const applicant = await User.findById(application.applicant._id).select(
      "name email",
    );
    if (!applicant) return;
    await emailService.sendCollaborationNotification({
      recipient: applicant,
      actor,
      collaboration,
      kind: accepted ? "ACCEPTED" : "REJECTED",
    });
  });

  return application;
};

module.exports = {
  browse,
  listOwn,
  listOwnApplications,
  getById,
  create,
  update,
  remove,
  apply,
  listApplications,
  respondToApplication,
  loadOwnedCollaboration,
};

const mongoose = require("mongoose");
const { Service } = require("../models");
const ApiError = require("../utils/ApiError");
const { USER_ROLES } = require("../utils/constants");

/**
 * Service (listing) business logic.
 *
 * Named `marketplace` rather than `service.service` — the domain object and
 * the architectural layer share a word, and `service.service.js` reads badly.
 */

const CREATOR_FIELDS = "name username avatar role isVerified rating reviewsCount";

/** Sorts the marketplace exposes. Anything else falls back to newest. */
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popular: { ordersCount: -1, createdAt: -1 },
};

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound("Service not found");
  }
};

/**
 * Load a service and confirm the actor may modify it.
 *
 * The single chokepoint for listing ownership, mirroring
 * project.service.loadOwnedProject so update and deactivate cannot drift.
 */
const loadOwnedService = async (serviceId, actor) => {
  assertValidId(serviceId);

  const service = await Service.findById(serviceId);
  if (!service) throw ApiError.notFound("Service not found");

  const isOwner = service.creator.equals(actor._id);
  const isAdmin = actor.role === USER_ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You can only modify your own services");
  }

  return service;
};

/**
 * Public marketplace listing.
 *
 * Hard-filters to `isActive: true`; a creative's hidden listings are reachable
 * only through listOwn, so deactivating genuinely removes a service from sale.
 */
const browse = async ({ page, limit, category, search, sort }) => {
  const filter = { isActive: true };
  if (category) filter.category = category;
  // $text uses the index Phase 2 created on title/description. Passed as data,
  // never interpolated into a regex.
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;
  const order = search
    ? { score: { $meta: "textScore" }, createdAt: -1 }
    : (SORTS[sort] ?? SORTS.newest);

  const query = Service.find(filter);
  if (search) query.select({ score: { $meta: "textScore" } });

  const [services, total] = await Promise.all([
    query.sort(order).skip(skip).limit(limit).populate("creator", CREATOR_FIELDS),
    Service.countDocuments(filter),
  ]);

  return {
    services,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: skip + services.length < total,
  };
};

/** Every listing belonging to the caller, deactivated ones included. */
const listOwn = (creatorId) =>
  Service.find({ creator: creatorId })
    .sort({ createdAt: -1 })
    .populate("creator", CREATOR_FIELDS);

/**
 * A single listing.
 *
 * A deactivated service stays readable by its owner and by admins so the edit
 * page still works, but 404s for everyone else — it is off the market.
 */
const getById = async (serviceId, viewer) => {
  assertValidId(serviceId);

  const service = await Service.findById(serviceId).populate(
    "creator",
    CREATOR_FIELDS,
  );
  if (!service) throw ApiError.notFound("Service not found");

  const creatorId = service.creator?._id ?? service.creator;
  const isOwner = Boolean(viewer && creatorId.equals(viewer._id));
  const isAdmin = viewer?.role === USER_ROLES.ADMIN;

  if (!service.isActive && !isOwner && !isAdmin) {
    throw ApiError.notFound("Service not found");
  }

  return { service, isOwner };
};

const create = async (creatorId, data) => {
  // Ownership comes from the authenticated token, never the request body.
  const service = await Service.create({ ...data, creator: creatorId });
  return service.populate("creator", CREATOR_FIELDS);
};

const update = async (serviceId, actor, patch) => {
  const service = await loadOwnedService(serviceId, actor);
  Object.assign(service, patch);
  await service.save();
  return service.populate("creator", CREATOR_FIELDS);
};

/**
 * Take a listing off the market.
 *
 * Deactivation rather than deletion: orders reference the service, and the
 * model's own comment states that hiding is the intended behaviour so past
 * orders survive. Reversible by PATCHing isActive back to true.
 */
const deactivate = async (serviceId, actor) => {
  const service = await loadOwnedService(serviceId, actor);

  if (!service.isActive) {
    throw ApiError.conflict("That service is already deactivated");
  }

  service.isActive = false;
  await service.save();

  return service;
};

module.exports = {
  browse,
  listOwn,
  getById,
  create,
  update,
  deactivate,
  loadOwnedService,
  SORTS,
  CREATOR_FIELDS,
};

const mongoose = require("mongoose");
const { Order, Service } = require("../models");
const ApiError = require("../utils/ApiError");
const { ORDER_STATUS, USER_ROLES } = require("../utils/constants");

const CLIENT_FIELDS = "name username avatar role";
const CREATIVE_FIELDS = "name username avatar role isVerified";
const SERVICE_FIELDS = "title category price currency deliveryTime media isActive";

/**
 * Who may move an order from one status to another.
 *
 * Reading down the table is the whole authorisation model for order progress:
 *
 *   - Only the creative can accept, start and deliver — the client cannot push
 *     work forward on the creative's behalf.
 *   - Only the client can mark an order COMPLETED, and only from DELIVERED.
 *     This is the rule that stops a buyer closing an order the moment they
 *     place it, and stops a seller declaring their own work accepted.
 *   - Cancelling is mutual while nothing has been built yet; once work is in
 *     progress only the creative can cancel, so a client cannot walk away
 *     mid-project without it becoming a dispute.
 *   - COMPLETED and CANCELLED are terminal.
 *
 * Phase 6 has no payments, so none of this touches `paymentStatus`.
 */
const TRANSITIONS = {
  [ORDER_STATUS.PENDING]: {
    [ORDER_STATUS.ACCEPTED]: ["creative"],
    [ORDER_STATUS.CANCELLED]: ["client", "creative"],
  },
  [ORDER_STATUS.ACCEPTED]: {
    [ORDER_STATUS.IN_PROGRESS]: ["creative"],
    [ORDER_STATUS.CANCELLED]: ["client", "creative"],
  },
  [ORDER_STATUS.IN_PROGRESS]: {
    [ORDER_STATUS.DELIVERED]: ["creative"],
    [ORDER_STATUS.CANCELLED]: ["creative"],
  },
  [ORDER_STATUS.DELIVERED]: {
    [ORDER_STATUS.COMPLETED]: ["client"],
    [ORDER_STATUS.DISPUTED]: ["client"],
    // The creative can reopen for revisions after feedback.
    [ORDER_STATUS.IN_PROGRESS]: ["creative"],
  },
  [ORDER_STATUS.DISPUTED]: {
    [ORDER_STATUS.COMPLETED]: ["admin"],
    [ORDER_STATUS.CANCELLED]: ["admin"],
  },
  [ORDER_STATUS.COMPLETED]: {},
  [ORDER_STATUS.CANCELLED]: {},
};

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound("Order not found");
  }
};

const populateOrder = (query) =>
  query
    .populate("client", CLIENT_FIELDS)
    .populate("creative", CREATIVE_FIELDS)
    .populate("service", SERVICE_FIELDS);

/** The actor's relationship to this order, or null if they have none. */
const relationOf = (order, actor) => {
  const clientId = order.client?._id ?? order.client;
  const creativeId = order.creative?._id ?? order.creative;

  if (clientId.equals(actor._id)) return "client";
  if (creativeId.equals(actor._id)) return "creative";
  if (actor.role === USER_ROLES.ADMIN) return "admin";
  return null;
};

/**
 * Place an order.
 *
 * Everything that matters is derived from the stored Service: the client from
 * the token, the creative and price from the service document. The request
 * body contributes only the service id and the buyer's requirements, so a
 * crafted payload cannot set its own price or name a different seller.
 */
const create = async (client, { serviceId, requirements }) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw ApiError.notFound("Service not found");
  }

  const service = await Service.findById(serviceId);
  if (!service) throw ApiError.notFound("Service not found");

  if (!service.isActive) {
    throw ApiError.conflict("That service is no longer available");
  }

  if (service.creator.equals(client._id)) {
    throw ApiError.badRequest("You cannot order your own service");
  }

  const order = await Order.create({
    client: client._id,
    creative: service.creator,
    service: service._id,
    // Frozen copy, so editing or deactivating the live service later never
    // rewrites what this buyer agreed to.
    serviceSnapshot: {
      title: service.title,
      price: service.price,
      currency: service.currency,
      deliveryTime: service.deliveryTime,
    },
    amount: service.price,
    currency: service.currency,
    requirements,
    dueAt: new Date(Date.now() + service.deliveryTime * 24 * 60 * 60 * 1000),
  });

  await Service.updateOne({ _id: service._id }, { $inc: { ordersCount: 1 } });

  return populateOrder(Order.findById(order._id));
};

/**
 * Orders for one side of the marketplace.
 * `role` picks which column of the relationship to match, so a user never
 * sees an order they are not party to.
 */
const listForUser = (userId, role, { status } = {}) => {
  const filter = role === "creative" ? { creative: userId } : { client: userId };
  if (status) filter.status = status;

  return populateOrder(Order.find(filter).sort({ createdAt: -1 }));
};

/** A single order, readable only by its two participants (or an admin). */
const getById = async (orderId, actor) => {
  assertValidId(orderId);

  const order = await populateOrder(Order.findById(orderId));
  if (!order) throw ApiError.notFound("Order not found");

  const relation = relationOf(order, actor);
  if (!relation) {
    // 404 rather than 403: a stranger should not learn the order exists.
    throw ApiError.notFound("Order not found");
  }

  return { order, relation };
};

/**
 * Move an order to a new status, subject to the TRANSITIONS table.
 *
 * Distinguishes "you are not on this order" (404) from "that move is not
 * yours to make" (403) from "that move is impossible from here" (409).
 */
const updateStatus = async (orderId, actor, nextStatus) => {
  const { order, relation } = await getById(orderId, actor);

  if (order.status === nextStatus) {
    throw ApiError.conflict(`This order is already ${nextStatus}`);
  }

  const allowedFromHere = TRANSITIONS[order.status] ?? {};
  const permittedRoles = allowedFromHere[nextStatus];

  if (!permittedRoles) {
    const options = Object.keys(allowedFromHere);
    throw ApiError.conflict(
      options.length
        ? `Cannot move an order from ${order.status} to ${nextStatus}. Possible: ${options.join(", ")}`
        : `An order that is ${order.status} can no longer change status`,
    );
  }

  // Admins may apply any transition the table defines for the current status.
  const isAdmin = actor.role === USER_ROLES.ADMIN;
  if (!permittedRoles.includes(relation) && !isAdmin) {
    throw ApiError.forbidden(
      `Only the ${permittedRoles.join(" or ")} can move this order to ${nextStatus}`,
    );
  }

  order.status = nextStatus;
  if (nextStatus === ORDER_STATUS.COMPLETED) order.completedAt = new Date();
  if (nextStatus === ORDER_STATUS.CANCELLED) order.cancelledAt = new Date();
  await order.save();

  return order;
};

/**
 * The transitions this actor could perform right now — used by the dashboards
 * so a button is only rendered when the server would actually accept it.
 */
const availableTransitions = (order, relation, actorRole) => {
  const allowed = TRANSITIONS[order.status] ?? {};
  return Object.entries(allowed)
    .filter(
      ([, roles]) =>
        roles.includes(relation) || actorRole === USER_ROLES.ADMIN,
    )
    .map(([status]) => status);
};

module.exports = {
  create,
  listForUser,
  getById,
  updateStatus,
  availableTransitions,
  relationOf,
  TRANSITIONS,
};

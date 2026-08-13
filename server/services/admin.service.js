const mongoose = require("mongoose");
const {
  User,
  Project,
  Service,
  Order,
  Payment,
  Collaboration,
  CollaborationApplication,
  Conversation,
  Message,
  Like,
  Comment,
  Review,
} = require("../models");
const ApiError = require("../utils/ApiError");
const {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
} = require("../utils/constants");
const { escapeRegex } = require("../utils/validators");
const projectService = require("./project.service");
const marketplaceService = require("./marketplace.service");

/**
 * Administrative reads and the few write operations an admin is allowed.
 *
 * Two rules shape this file:
 *
 *  1. It reads existing collections and never introduces an admin-only model.
 *  2. Where an operation already exists elsewhere (deleting a project,
 *     deactivating a service) it delegates to that service rather than
 *     reimplementing it, so admin and owner paths cannot diverge in what they
 *     clean up.
 */

/** Public-safe projection. `password` is select:false, but be explicit anyway. */
const USER_FIELDS =
  "name username email role avatar bio location skills categories website isVerified isActive followersCount followingCount projectsCount rating reviewsCount createdAt updatedAt";

/** Case-insensitive contains across the fields an admin actually searches. */
const userSearchFilter = (search) => {
  if (!search) return {};
  const safe = escapeRegex(search);
  return {
    $or: [
      { name: { $regex: safe, $options: "i" } },
      { username: { $regex: safe, $options: "i" } },
      // Email is not in the $text index, which is why this is a regex at all.
      { email: { $regex: safe, $options: "i" } },
    ],
  };
};

const assertValidId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound(`${label} not found`);
  }
};

/** Shared pagination envelope so every admin list looks the same. */
const paginate = (items, total, page, limit, key) => ({
  [key]: items,
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasMore: (page - 1) * limit + items.length < total,
});

// --- Statistics -----------------------------------------------------------

/**
 * Platform statistics.
 *
 * Every figure is a countDocuments or an aggregation — no collection is ever
 * pulled into memory to be counted in JavaScript. All of them are issued
 * concurrently, so the endpoint costs one round trip rather than twenty.
 */
const getStats = async () => {
  const [
    users,
    creatives,
    brands,
    admins,
    activeUsers,
    verifiedUsers,
    projects,
    services,
    activeServices,
    orders,
    collaborations,
    openCollaborations,
    applications,
    conversations,
    messages,
    likes,
    comments,
    reviews,
    payments,
    ordersByStatus,
    ordersByPayment,
    paymentTotals,
    recentUsers,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: USER_ROLES.CREATIVE }),
    User.countDocuments({ role: USER_ROLES.BRAND }),
    User.countDocuments({ role: USER_ROLES.ADMIN }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isVerified: true }),
    Project.countDocuments(),
    Service.countDocuments(),
    Service.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Collaboration.countDocuments(),
    Collaboration.countDocuments({ status: "OPEN" }),
    CollaborationApplication.countDocuments(),
    Conversation.countDocuments(),
    Message.countDocuments(),
    Like.countDocuments(),
    Comment.countDocuments(),
    Review.countDocuments(),
    Payment.countDocuments(),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }]),
    // Money is only ever summed for payments Paystack actually confirmed.
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select("name username role createdAt avatar"),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("amount currency status paymentStatus createdAt serviceSnapshot")
      .populate("client", "name username")
      .populate("creative", "name username"),
  ]);

  /** Turn an aggregation into a plain object with every enum key present. */
  const tally = (rows, allowed) => {
    const out = Object.fromEntries(allowed.map((key) => [key, 0]));
    for (const row of rows) if (row._id in out) out[row._id] = row.count;
    return out;
  };

  return {
    users: {
      total: users,
      creatives,
      brands,
      admins,
      active: activeUsers,
      deactivated: users - activeUsers,
      verified: verifiedUsers,
    },
    content: {
      projects,
      likes,
      comments,
      reviews,
    },
    marketplace: {
      services,
      activeServices,
      inactiveServices: services - activeServices,
      orders,
      ordersByStatus: tally(ordersByStatus, Object.values(ORDER_STATUS)),
      ordersByPaymentStatus: tally(
        ordersByPayment,
        Object.values(PAYMENT_STATUS),
      ),
    },
    payments: {
      total: payments,
      // Grouped by currency: summing NGN and USD into one number would be
      // meaningless, so each is reported separately.
      succeededByCurrency: paymentTotals.map((row) => ({
        currency: row._id,
        amount: row.total,
        count: row.count,
      })),
    },
    collaborations: {
      total: collaborations,
      open: openCollaborations,
      applications,
    },
    messaging: {
      // Aggregate only. Private conversations are never listed or readable
      // through the admin API.
      conversations,
      messages,
    },
    recent: { users: recentUsers, orders: recentOrders },
  };
};

// --- Users ----------------------------------------------------------------

const listUsers = async ({ page, limit, search, role, isActive }) => {
  const filter = { ...userSearchFilter(search) };
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return paginate(users, total, page, limit, "users");
};

/**
 * One user, with the activity counts an admin needs to make a decision.
 * Counts are queried directly rather than trusting the denormalised fields,
 * so a drifted counter shows up here instead of being repeated.
 */
const getUserById = async (userId) => {
  assertValidId(userId, "User");

  const user = await User.findById(userId).select(USER_FIELDS);
  if (!user) throw ApiError.notFound("User not found");

  const [
    projectCount,
    serviceCount,
    ordersPlaced,
    ordersReceived,
    collaborationsPosted,
    applicationsSent,
    followers,
    following,
  ] = await Promise.all([
    Project.countDocuments({ owner: user._id }),
    Service.countDocuments({ creator: user._id }),
    Order.countDocuments({ client: user._id }),
    Order.countDocuments({ creative: user._id }),
    Collaboration.countDocuments({ creator: user._id }),
    CollaborationApplication.countDocuments({ applicant: user._id }),
    User.db.model("Follow").countDocuments({ following: user._id }),
    User.db.model("Follow").countDocuments({ follower: user._id }),
  ]);

  return {
    user,
    activity: {
      projectCount,
      serviceCount,
      ordersPlaced,
      ordersReceived,
      collaborationsPosted,
      applicationsSent,
      followers,
      following,
    },
  };
};

/**
 * Activate or deactivate an account.
 *
 * Two guards stop an administrator locking the platform out of itself: you
 * cannot deactivate your own account, and you cannot deactivate the last
 * active admin. Nothing else about the user can be changed here — the
 * validator only lets `isActive` through, so role and verification are
 * untouchable on this route.
 */
const setUserStatus = async (userId, actor, isActive) => {
  assertValidId(userId, "User");

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (user._id.equals(actor._id)) {
    throw ApiError.badRequest("You cannot change your own account status");
  }

  if (!isActive && user.role === USER_ROLES.ADMIN) {
    const otherActiveAdmins = await User.countDocuments({
      role: USER_ROLES.ADMIN,
      isActive: true,
      _id: { $ne: user._id },
    });
    if (otherActiveAdmins === 0) {
      throw ApiError.conflict(
        "Cannot deactivate the last active administrator",
      );
    }
  }

  if (user.isActive === isActive) {
    throw ApiError.conflict(
      `That account is already ${isActive ? "active" : "deactivated"}`,
    );
  }

  user.isActive = isActive;
  await user.save();

  return User.findById(user._id).select(USER_FIELDS);
};

// --- Projects -------------------------------------------------------------

const listProjects = async ({ page, limit, search, category }) => {
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title category visibility likesCount commentsCount media createdAt owner")
      .populate("owner", "name username role isActive"),
    Project.countDocuments(filter),
  ]);

  return paginate(projects, total, page, limit, "projects");
};

const getProjectById = async (projectId) => {
  assertValidId(projectId, "Project");

  const project = await Project.findById(projectId).populate(
    "owner",
    "name username role isActive email",
  );
  if (!project) throw ApiError.notFound("Project not found");

  return project;
};

/**
 * Remove a project from the platform.
 *
 * Delegates to project.service, which already permits ADMIN and handles the
 * owner's counter plus the likes and comments that reference it. Duplicating
 * that here is how the two paths would drift.
 */
const removeProject = (projectId, actor) =>
  projectService.remove(projectId, actor);

// --- Services -------------------------------------------------------------

const listServices = async ({ page, limit, search, category, isActive }) => {
  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title category price currency deliveryTime isActive ordersCount createdAt creator")
      .populate("creator", "name username role isActive"),
    Service.countDocuments(filter),
  ]);

  return paginate(services, total, page, limit, "services");
};

/**
 * Hide or relist a service.
 *
 * Deactivation, never deletion: orders reference services, and their
 * serviceSnapshot exists precisely so historical orders survive. Delegates to
 * marketplace.service, which already allows ADMIN.
 */
const setServiceStatus = async (serviceId, actor, isActive) =>
  marketplaceService.update(serviceId, actor, { isActive });

// --- Orders ---------------------------------------------------------------

const listOrders = async ({ page, limit, search, status, paymentStatus }) => {
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { "serviceSnapshot.title": { $regex: safe, $options: "i" } },
      { paystackReference: { $regex: safe, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("client", "name username role")
      .populate("creative", "name username role")
      .populate("service", "title category"),
    Order.countDocuments(filter),
  ]);

  return paginate(orders, total, page, limit, "orders");
};

const getOrderById = async (orderId) => {
  assertValidId(orderId, "Order");

  const order = await Order.findById(orderId)
    .populate("client", "name username email role")
    .populate("creative", "name username email role")
    .populate("service", "title category price currency isActive");
  if (!order) throw ApiError.notFound("Order not found");

  // The attempt history for this order. `metadata` stays select:false, so the
  // raw provider response never leaves the server.
  const payments = await Payment.find({ order: order._id })
    .sort({ createdAt: -1 })
    .select("amount currency provider reference status paidAt createdAt");

  return { order, payments };
};

// --- Payments -------------------------------------------------------------

/**
 * Payment records, read-only.
 *
 * There is deliberately no endpoint that writes a payment status. Payment
 * truth comes from Paystack verification (Phase 7) and nowhere else, so an
 * administrator can observe payments but cannot manufacture one.
 *
 * `metadata` is excluded by the model's select:false and is not re-selected
 * here — it holds the raw provider payload, including customer details.
 */
const listPayments = async ({ page, limit, search, status }) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.reference = { $regex: escapeRegex(search), $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [payments, total, totals] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("amount currency provider reference status paidAt createdAt order user")
      .populate("user", "name username role")
      .populate("order", "status paymentStatus serviceSnapshot"),
    Payment.countDocuments(filter),
    Payment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    ...paginate(payments, total, page, limit, "payments"),
    summary: Object.fromEntries(totals.map((row) => [row._id, row.count])),
  };
};

// --- Collaborations -------------------------------------------------------

/** Read-only overview. Application contents are not exposed here. */
const listCollaborations = async ({ page, limit, search, status, category }) => {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  const [collaborations, total] = await Promise.all([
    Collaboration.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title category location status budget deadline applicationsCount createdAt creator")
      .populate("creator", "name username role isActive"),
    Collaboration.countDocuments(filter),
  ]);

  return paginate(collaborations, total, page, limit, "collaborations");
};

module.exports = {
  getStats,
  listUsers,
  getUserById,
  setUserStatus,
  listProjects,
  getProjectById,
  removeProject,
  listServices,
  setServiceStatus,
  listOrders,
  getOrderById,
  listPayments,
  listCollaborations,
};

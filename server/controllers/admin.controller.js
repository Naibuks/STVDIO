const adminService = require("../services/admin.service");
const ApiError = require("../utils/ApiError");
const {
  validateAdminQuery,
  validateUserStatus,
} = require("../utils/validators");

/**
 * HTTP layer for the admin API.
 *
 * Thin by design: every controller validates its query, calls admin.service,
 * and shapes the response. Authorization is not checked here — the router
 * applies it once to every route, so no endpoint can be added without it.
 */

/** Runs the query validator and throws a 400 rather than silently ignoring. */
const query = (req, allow) => {
  const { errors, value } = validateAdminQuery(req.query, { allow });
  if (errors.length) throw ApiError.badRequest("Invalid query", errors);
  return value;
};

/** GET /api/admin/stats */
const getStats = async (req, res) => {
  const stats = await adminService.getStats();
  res.json({ success: true, message: "Statistics retrieved", data: stats });
};

/** GET /api/admin/users */
const getUsers = async (req, res) => {
  const result = await adminService.listUsers(
    query(req, ["role", "isActive"]),
  );
  res.json({ success: true, message: "Users retrieved", data: result });
};

/** GET /api/admin/creatives — the users list, fixed to one role. */
const getCreatives = async (req, res) => {
  const result = await adminService.listUsers({
    ...query(req, ["isActive"]),
    role: "CREATIVE",
  });
  res.json({ success: true, message: "Creatives retrieved", data: result });
};

/** GET /api/admin/brands */
const getBrands = async (req, res) => {
  const result = await adminService.listUsers({
    ...query(req, ["isActive"]),
    role: "BRAND",
  });
  res.json({ success: true, message: "Brands retrieved", data: result });
};

/** GET /api/admin/users/:id */
const getUser = async (req, res) => {
  const data = await adminService.getUserById(req.params.id);
  res.json({ success: true, message: "User retrieved", data });
};

/** PATCH /api/admin/users/:id/status */
const setUserStatus = async (req, res) => {
  const { errors, value } = validateUserStatus(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);

  const user = await adminService.setUserStatus(
    req.params.id,
    req.user,
    value.isActive,
  );

  res.json({
    success: true,
    message: value.isActive ? "Account reactivated" : "Account deactivated",
    data: { user },
  });
};

/** GET /api/admin/projects */
const getProjects = async (req, res) => {
  const result = await adminService.listProjects(query(req, ["category"]));
  res.json({ success: true, message: "Projects retrieved", data: result });
};

/** GET /api/admin/projects/:id */
const getProject = async (req, res) => {
  const project = await adminService.getProjectById(req.params.id);
  res.json({ success: true, message: "Project retrieved", data: { project } });
};

/** DELETE /api/admin/projects/:id */
const deleteProject = async (req, res) => {
  const result = await adminService.removeProject(req.params.id, req.user);
  res.json({ success: true, message: "Project removed", data: result });
};

/** GET /api/admin/services */
const getServices = async (req, res) => {
  const result = await adminService.listServices(
    query(req, ["category", "isActive"]),
  );
  res.json({ success: true, message: "Services retrieved", data: result });
};

/** PATCH /api/admin/services/:id/status — hide or relist, never delete. */
const setServiceStatus = async (req, res) => {
  const { errors, value } = validateUserStatus(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);

  const service = await adminService.setServiceStatus(
    req.params.id,
    req.user,
    value.isActive,
  );

  res.json({
    success: true,
    message: value.isActive ? "Service relisted" : "Service hidden",
    data: { service },
  });
};

/** GET /api/admin/orders */
const getOrders = async (req, res) => {
  const result = await adminService.listOrders(
    query(req, ["status", "paymentStatus"]),
  );
  res.json({ success: true, message: "Orders retrieved", data: result });
};

/** GET /api/admin/orders/:id */
const getOrder = async (req, res) => {
  const data = await adminService.getOrderById(req.params.id);
  res.json({ success: true, message: "Order retrieved", data });
};

/** GET /api/admin/payments — read-only; there is no write counterpart. */
const getPayments = async (req, res) => {
  // A payment's own state uses the PAYMENT_STATUS enum, which the validator
  // exposes as `paymentStatus`; the service filters on `status`.
  const value = query(req, ["paymentStatus"]);
  const result = await adminService.listPayments({
    ...value,
    status: value.paymentStatus,
  });
  res.json({ success: true, message: "Payments retrieved", data: result });
};

/** GET /api/admin/collaborations */
const getCollaborations = async (req, res) => {
  const result = await adminService.listCollaborations(
    query(req, ["status", "collaborationStatus", "category"]),
  );
  res.json({
    success: true,
    message: "Collaborations retrieved",
    data: result,
  });
};

module.exports = {
  getStats,
  getUsers,
  getCreatives,
  getBrands,
  getUser,
  setUserStatus,
  getProjects,
  getProject,
  deleteProject,
  getServices,
  setServiceStatus,
  getOrders,
  getOrder,
  getPayments,
  getCollaborations,
};

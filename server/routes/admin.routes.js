const express = require("express");
const {
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
} = require("../controllers/admin.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const { USER_ROLES } = require("../utils/constants");

const router = express.Router();

/**
 * The security boundary for the whole admin API.
 *
 * Applied with router.use rather than per route, so a route added later
 * inherits it automatically — forgetting to protect a new admin endpoint is
 * not possible. Reuses the existing middleware: `authenticate` loads the
 * current user from the database (so a deactivated admin's old token stops
 * working), and `authorizeRoles` answers 401 when unauthenticated and 403
 * when authenticated as the wrong role.
 */
router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.get("/stats", getStats);

// Creatives and brands are the users list with the role fixed, so they are
// declared before "/users/:id" cannot be confused with them — different path
// prefixes, but kept together for readability.
router.get("/users", getUsers);
router.get("/creatives", getCreatives);
router.get("/brands", getBrands);
router.get("/users/:id", getUser);
router.patch("/users/:id/status", setUserStatus);

router.get("/projects", getProjects);
router.get("/projects/:id", getProject);
router.delete("/projects/:id", deleteProject);

router.get("/services", getServices);
router.patch("/services/:id/status", setServiceStatus);

router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);

// Read-only on purpose: payment truth stays with Paystack verification.
router.get("/payments", getPayments);

router.get("/collaborations", getCollaborations);

module.exports = router;

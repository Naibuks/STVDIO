const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  logout,
} = require("../controllers/auth.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { USER_ROLES } = require("../utils/constants");

const router = express.Router();

// --- Public ---------------------------------------------------------------
router.post("/register", register);
router.post("/login", login);

// --- Authenticated --------------------------------------------------------
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

/**
 * Verification endpoint for role authorization — proves that `authorizeRoles`
 * returns 403 for an authenticated non-admin and 200 for an admin.
 *
 * It exists only so Phase 3 can be tested end to end. Real admin routes arrive
 * in Phase 11 and this can be deleted then.
 */
router.get(
  "/admin-only",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access confirmed",
      data: { username: req.user.username, role: req.user.role },
    });
  },
);

module.exports = router;

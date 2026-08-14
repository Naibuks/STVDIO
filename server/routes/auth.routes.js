const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  logout,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authRateLimit } = require("../middleware/rateLimit.middleware");

const router = express.Router();

// --- Public ---------------------------------------------------------------
router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);

// --- Authenticated --------------------------------------------------------
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

// The Phase 3 /admin-only verification endpoint lived here. It existed solely
// to prove authorizeRoles worked before any real admin route did; /api/admin
// now covers that, so it has been removed rather than left as a live endpoint
// with no purpose.

module.exports = router;

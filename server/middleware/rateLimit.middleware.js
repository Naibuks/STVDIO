const rateLimit = require("express-rate-limit");

/**
 * Protect authentication endpoints from brute-force and automated abuse.
 *
 * This limiter is intentionally scoped to authentication routes only.
 * Normal browsing, feeds, projects, messages, uploads, etc. are unaffected.
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per IP per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

module.exports = { authRateLimit };
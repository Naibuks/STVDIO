const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../services/token.service");

/**
 * Pull a bearer token out of the Authorization header.
 * Returns null rather than throwing so the caller decides what a miss means.
 */
const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
};

/**
 * Require a valid token. Attaches the full user document to `req.user`.
 *
 * The user is re-read from the database on every request rather than trusted
 * from the token payload. A JWT is valid until it expires, so without this a
 * deactivated account or a demoted admin would keep their old access for up to
 * seven days. The cost is one indexed _id lookup per request.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized(
        "Authentication required. Send an Authorization: Bearer <token> header",
      );
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);
    if (!user) {
      throw ApiError.unauthorized("The account for this token no longer exists");
    }
    if (!user.isActive) {
      throw ApiError.forbidden("This account has been deactivated");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require one of the given roles. Must run after `authenticate`.
 *
 *   router.get("/admin", authenticate, authorizeRoles("ADMIN"), handler)
 *
 * The 401 vs 403 distinction matters: 401 means "we do not know who you are",
 * 403 means "we know exactly who you are and the answer is still no".
 */
const authorizeRoles = (...roles) => {
  if (roles.length === 0) {
    throw new Error("authorizeRoles() requires at least one role");
  }

  return (req, res, next) => {
    if (!req.user) {
      return next(
        ApiError.unauthorized("authorizeRoles used without authenticate"),
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires one of these roles: ${roles.join(", ")}`,
        ),
      );
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };

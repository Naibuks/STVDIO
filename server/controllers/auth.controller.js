const authService = require("../services/auth.service");
const ApiError = require("../utils/ApiError");
const { validateRegister, validateLogin } = require("../utils/validators");

/**
 * Controllers handle HTTP only: read the request, call a service, shape the
 * response. No database or bcrypt calls live here.
 *
 * These are async and may throw — Express 5 forwards a rejected promise to the
 * error handler on its own, so no try/catch or asyncHandler wrapper is needed.
 */

/** POST /api/auth/register */
const register = async (req, res) => {
  const { errors, value } = validateRegister(req.body);
  if (errors.length) {
    throw ApiError.badRequest("Validation failed", errors);
  }

  const { user, token } = await authService.register(value);

  // 201 Created. `user` is serialised through the model's toJSON transform,
  // which strips the password hash.
  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user, token },
  });
};

/** POST /api/auth/login */
const login = async (req, res) => {
  const { errors, value } = validateLogin(req.body);
  if (errors.length) {
    throw ApiError.badRequest("Validation failed", errors);
  }

  const { user, token } = await authService.login(value);

  res.json({
    success: true,
    message: "Logged in successfully",
    data: { user, token },
  });
};

/** GET /api/auth/me — requires authenticate */
const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    message: "Current user retrieved",
    data: { user: req.user },
  });
};

/**
 * POST /api/auth/logout — requires authenticate
 *
 * JWTs are stateless: the server cannot un-issue one. Logging out means the
 * client discards its token. This endpoint exists so the client has something
 * to call and so logout can be audited later; genuine server-side revocation
 * needs a token denylist, which is deferred.
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully. Discard the token on the client.",
    data: null,
  });
};

module.exports = { register, login, getCurrentUser, logout };

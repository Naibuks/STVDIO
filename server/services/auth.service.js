const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { USER_ROLES } = require("../utils/constants");
const { signAccessToken } = require("./token.service");

/**
 * Roles a member of the public may choose at registration.
 * ADMIN is deliberately absent — it can only be granted directly in the
 * database (or by an admin tool in Phase 11), never by self-service.
 */
const PUBLIC_ROLES = [USER_ROLES.CREATIVE, USER_ROLES.BRAND];

/**
 * Create an account.
 *
 * The password is hashed by the User model's pre-save hook, so this function
 * never handles a hash itself.
 */
const register = async ({ name, username, email, password, role }) => {
  if (role && !PUBLIC_ROLES.includes(role)) {
    throw ApiError.forbidden(
      `Cannot register with role ${role}. Choose one of: ${PUBLIC_ROLES.join(", ")}`,
    );
  }

  // Checked explicitly so the client gets a clear 409 naming the field, rather
  // than a raw duplicate-key error. The unique indexes remain the real
  // guarantee — they also cover the race where two identical registrations
  // arrive at once and both pass this check.
  const existing = await User.findOne({ $or: [{ email }, { username }] })
    .select("email username")
    .lean();

  if (existing) {
    throw ApiError.conflict(
      existing.email === email
        ? "An account with that email already exists"
        : "That username is already taken",
    );
  }

  const user = await User.create({
    name,
    username,
    email,
    password,
    role: role || USER_ROLES.CREATIVE,
  });

  return { user, token: signAccessToken(user) };
};

/**
 * Exchange credentials for a token.
 *
 * Both "no such user" and "wrong password" return the same message, so the
 * endpoint cannot be used to discover which email addresses are registered.
 */
const login = async ({ email, password }) => {
  const invalid = ApiError.unauthorized("Invalid email or password");

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw invalid;

  const matches = await user.comparePassword(password);
  if (!matches) throw invalid;

  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  // Drop the hash from the in-memory document before it can reach a response.
  user.password = undefined;

  return { user, token: signAccessToken(user) };
};

module.exports = { register, login, PUBLIC_ROLES };

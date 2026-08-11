const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

const DEFAULT_EXPIRES_IN = "7d";

/**
 * Read the secret at call time rather than at module load, so that requiring
 * this file never crashes a process that does not need JWTs (the seed script,
 * for example). server.js refuses to boot without it.
 */
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set — cannot sign or verify tokens");
  }
  return secret;
};

/**
 * Build the token payload.
 *
 * Deliberately minimal: a subject and a role, nothing else. A JWT is signed,
 * not encrypted — anyone holding it can read the payload — so it must never
 * carry the password hash, the email, or anything private. The role is
 * included as a hint only; `authenticate` re-reads it from the database on
 * every request so a revoked admin cannot keep using an old token.
 */
const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
  });

/**
 * Verify a token and return its payload.
 * Translates jsonwebtoken's error types into 401s with useful messages.
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Token has expired, please log in again");
    }
    if (error.name === "JsonWebTokenError") {
      throw ApiError.unauthorized("Invalid token");
    }
    throw error;
  }
};

module.exports = { signAccessToken, verifyAccessToken };

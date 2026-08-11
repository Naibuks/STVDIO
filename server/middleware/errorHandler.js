const ApiError = require("../utils/ApiError");

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Translate a thrown error into a consistent API response.
 *
 * Every response has the same shape: { success, message } plus optional
 * `errors` detail. Errors we raised deliberately (ApiError) show their message;
 * anything unexpected is reported as a generic 500 in production so that
 * internal details never leak.
 */
const normalise = (err) => {
  if (err instanceof ApiError) {
    return { status: err.statusCode, message: err.message, errors: err.details };
  }

  // Mongoose schema validation — surface which fields failed.
  if (err.name === "ValidationError") {
    return {
      status: 400,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    };
  }

  // Unique index violation. Names the field without echoing the value back.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {}).join(", ") || "field";
    return { status: 409, message: `That ${field} is already in use` };
  }

  // Malformed ObjectId in a route parameter.
  if (err.name === "CastError") {
    return { status: 400, message: `Invalid ${err.path}` };
  }

  // Safety net — token.service normally converts these itself.
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return { status: 401, message: "Invalid or expired token" };
  }

  return { status: err.status || 500, message: err.message || "Internal server error" };
};

// Express identifies error handlers by arity, so `next` must stay declared.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const { status, message, errors } = normalise(err);
  const isProduction = process.env.NODE_ENV === "production";

  // Log the full error server-side; 5xx only, so a wrong password does not
  // fill the log with noise.
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    // An unexpected 500 must not echo an internal message to the client.
    message: status >= 500 && isProduction ? "Internal server error" : message,
    ...(errors && { errors }),
    // Stack traces can leak file paths and logic — development only.
    ...(!isProduction && status >= 500 && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };

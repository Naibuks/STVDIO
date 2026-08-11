/**
 * An error that carries an HTTP status code.
 *
 * Services and controllers throw these; the central errorHandler turns them
 * into a response. Anything thrown that is NOT an ApiError is treated as an
 * unexpected 500 and its message is hidden from the client in production.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    // `isOperational` marks errors we raised deliberately and whose message is
    // safe to show the user, as opposed to an unexpected crash.
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have permission to do that") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Express identifies error handlers by arity, so `next` must stay declared.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = res.statusCode !== 200 ? res.statusCode : err.status || 500;

  console.error(err);

  res.status(status).json({
    message: err.message || "Internal server error",
    // Stack traces can leak file paths and logic — development only.
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };

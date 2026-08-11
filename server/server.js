require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { connectDB, disconnectDB } = require("./config/db");
// Registers every schema with Mongoose so populate() resolves across models.
require("./models");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const projectRoutes = require("./routes/project.routes");
const feedRoutes = require("./routes/feed.routes");
const commentRoutes = require("./routes/comment.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/comments", commentRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  // Authentication is now part of the core API. Booting without a signing key
  // would let every protected route fail at request time instead of here.
  if (!process.env.JWT_SECRET) {
    console.error(
      "JWT_SECRET is not set. Add it to server/.env — see .env.example.",
    );
    process.exit(1);
  }

  // The API is allowed to boot without a database so the foundation can be
  // verified before MongoDB Atlas is provisioned. A URI that is set but
  // unreachable is a real misconfiguration, so we stop instead.
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (error) {
      console.error(`Database connection failed: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.warn("MONGODB_URI is not set — starting API without a database.");
  }

  const server = app.listen(PORT, () => {
    console.log(`STVDIO° API running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Set a different PORT in server/.env`);
    } else {
      console.error(`Server error: ${error.message}`);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start();

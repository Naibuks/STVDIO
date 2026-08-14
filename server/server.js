require("dotenv").config({ quiet: true });

const http = require("http");
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
const serviceRoutes = require("./routes/service.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const collaborationRoutes = require("./routes/collaboration.routes");
const conversationRoutes = require("./routes/conversation.routes");
const adminRoutes = require("./routes/admin.routes");
const uploadRoutes = require("./routes/upload.routes");
const { initSocket } = require("./services/socket.service");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const emailService = require("./services/email/email.service");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
/**
 * The Paystack webhook signature is an HMAC of the exact bytes Paystack sent,
 * so re-serialising the parsed object would not reproduce it. `verify` runs
 * before parsing and hands us the untouched buffer.
 *
 * Scoped to the webhook path so every other route is completely unaffected —
 * express.json() behaves exactly as it did before, and no other request pays
 * the cost of retaining its body.
 */
const WEBHOOK_PATH = "/api/payments/webhook";

app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl === WEBHOOK_PATH) req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);

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

  /**
   * Socket.io needs an http.Server to attach to, which app.listen() creates
   * internally and does not expose in a way we can hand over. Creating it
   * explicitly changes nothing about how Express handles requests — the same
   * app, the same port — it just gives the websocket transport something to
   * upgrade on.
   */
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`STVDIO° API running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Realtime: Socket.io listening on the same port`);
    // Whether email is on, never what the key is. Silent skipping would be
    // very hard to diagnose from a missing inbox alone.
    console.log(
      emailService.isConfigured()
        ? "Email: Resend configured"
        : "Email: not configured — set RESEND_API_KEY and EMAIL_FROM in server/.env to enable sending",
    );
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

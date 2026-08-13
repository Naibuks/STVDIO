const { Server } = require("socket.io");
const { User } = require("../models");
const { verifyAccessToken } = require("./token.service");
const conversationService = require("./conversation.service");
const realtime = require("./realtime");

/**
 * Socket.io transport.
 *
 * Attached to the same HTTP server as Express — one process, one port. This
 * file handles connection lifecycle and event routing only; every rule about
 * who may read or write a conversation lives in conversation.service, so REST
 * and sockets cannot drift apart.
 */

/**
 * Authenticate the socket before it is allowed to connect.
 *
 * Reuses the existing JWT — there is no second auth system. The user is loaded
 * from the database rather than trusted from the token payload, exactly as the
 * HTTP `authenticate` middleware does, so a deactivated account cannot connect
 * with a still-valid token.
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      // Fallback for clients that cannot set auth, e.g. plain WebSocket tools.
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) return next(new Error("Authentication required"));

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select(
      "name username avatar role isActive",
    );

    if (!user) return next(new Error("Account no longer exists"));
    if (!user.isActive) return next(new Error("Account is deactivated"));

    // The only place the socket's identity is set. Nothing the client sends
    // later can change it.
    socket.user = user;
    next();
  } catch (error) {
    // ApiError from verifyAccessToken, or anything unexpected.
    next(new Error(error.message || "Authentication failed"));
  }
};

const registerHandlers = (io, socket) => {
  const user = socket.user;
  const userId = user._id.toString();

  // Personal room: lets the server reach this user for inbox updates without
  // them having any conversation open.
  socket.join(realtime.userRoom(userId));

  const cameOnline = realtime.addConnection(userId, socket.id);
  if (cameOnline) {
    realtime.emitToAll("user:online", { userId, username: user.username });
  }

  // Current presence, so a freshly connected client is not blind until the
  // next change.
  socket.emit("presence:snapshot", { online: realtime.onlineUserIds() });

  /** Open a thread. Access is re-checked here, not taken on trust. */
  socket.on("conversation:join", async ({ conversationId } = {}, ack) => {
    try {
      // Throws 404 for a conversation the user is not part of, so knowing an
      // id is not enough to join its room.
      await conversationService.loadParticipantConversation(
        conversationId,
        user,
      );
      socket.join(realtime.conversationRoom(conversationId));
      ack?.({ success: true, conversationId });
    } catch (error) {
      ack?.({ success: false, message: error.message });
      socket.emit("error:message", { message: error.message });
    }
  });

  socket.on("conversation:leave", ({ conversationId } = {}) => {
    if (conversationId) {
      socket.leave(realtime.conversationRoom(conversationId));
    }
  });

  /**
   * Send a message.
   *
   * Delegates to the same service the REST endpoint uses, which persists the
   * message and emits `message:new` itself — this handler never broadcasts
   * unsaved content.
   */
  socket.on("message:send", async ({ conversationId, content } = {}, ack) => {
    try {
      const { message } = await conversationService.sendMessage(
        conversationId,
        user,
        content,
      );
      ack?.({ success: true, message });
    } catch (error) {
      ack?.({ success: false, message: error.message });
      socket.emit("error:message", { message: error.message });
    }
  });

  socket.on("message:read", async ({ conversationId } = {}, ack) => {
    try {
      const result = await conversationService.markRead(conversationId, user);
      ack?.({ success: true, ...result });
    } catch (error) {
      ack?.({ success: false, message: error.message });
    }
  });

  socket.on("disconnect", () => {
    const wentOffline = realtime.removeConnection(userId, socket.id);
    if (wentOffline) {
      realtime.emitToAll("user:offline", { userId, username: user.username });
    }
  });
};

/**
 * Attach Socket.io to the running HTTP server.
 * Called from server.js after the server is created but before it listens.
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      // Same origin policy as the REST API.
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(authenticateSocket);
  io.on("connection", (socket) => registerHandlers(io, socket));

  realtime.setIo(io);
  return io;
};

module.exports = { initSocket, authenticateSocket };

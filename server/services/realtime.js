/**
 * The seam between business logic and Socket.io.
 *
 * conversation.service needs to broadcast, and socket.service needs to call
 * conversation.service — importing each other directly would be a require
 * cycle. This module holds the io instance and the presence map, depends on
 * nothing, and both sides import it.
 *
 * Every emit here is a no-op until setIo runs, so the REST API works
 * identically whether or not sockets are running.
 */

let io = null;

/**
 * userId -> Set of socket ids.
 *
 * In memory on purpose: presence is volatile and worthless after a restart,
 * so persisting it to MongoDB would only create rows that lie. The known
 * limitation is that this does not survive a restart and does not work across
 * multiple server instances — a Redis adapter is what that would need.
 */
const online = new Map();

const setIo = (instance) => {
  io = instance;
};

const getIo = () => io;

/** Room a conversation's open participants join. */
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

/**
 * Every socket a user has open. Joined automatically on connect so a user can
 * be reached (for inbox badges) without having a conversation open.
 */
const userRoom = (userId) => `user:${userId}`;

const emitToConversation = (conversationId, event, payload) => {
  io?.to(conversationRoom(conversationId)).emit(event, payload);
};

const emitToUser = (userId, event, payload) => {
  io?.to(userRoom(String(userId))).emit(event, payload);
};

/** Broadcast to everyone connected — used only for presence. */
const emitToAll = (event, payload) => {
  io?.emit(event, payload);
};

// --- Presence -------------------------------------------------------------

/** Returns true when this is the user's first socket, i.e. they just came online. */
const addConnection = (userId, socketId) => {
  const key = String(userId);
  const sockets = online.get(key) ?? new Set();
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  online.set(key, sockets);
  return wasOffline;
};

/** Returns true when that was the user's last socket, i.e. they went offline. */
const removeConnection = (userId, socketId) => {
  const key = String(userId);
  const sockets = online.get(key);
  if (!sockets) return false;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    online.delete(key);
    return true;
  }
  return false;
};

const isOnline = (userId) => online.has(String(userId));

const onlineUserIds = () => [...online.keys()];

/**
 * Is this user currently looking at this conversation?
 *
 * Used to decide whether a message needs a notification: someone reading the
 * thread does not need to be told about it. Reads Socket.io's own room
 * membership rather than tracking it separately, so it cannot drift.
 */
const isViewingConversation = async (userId, conversationId) => {
  if (!io) return false;
  const sockets = online.get(String(userId));
  if (!sockets || sockets.size === 0) return false;

  const room = conversationRoom(conversationId);
  const inRoom = await io.in(room).fetchSockets();
  return inRoom.some((socket) => sockets.has(socket.id));
};

module.exports = {
  setIo,
  getIo,
  conversationRoom,
  userRoom,
  emitToConversation,
  emitToUser,
  emitToAll,
  addConnection,
  removeConnection,
  isOnline,
  onlineUserIds,
  isViewingConversation,
};

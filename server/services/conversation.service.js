const mongoose = require("mongoose");
const { Conversation, Message, User } = require("../models");
const ApiError = require("../utils/ApiError");
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_TARGETS,
} = require("../utils/constants");
const notificationService = require("./notification.service");
const realtime = require("./realtime");

/**
 * Conversations and messages.
 *
 * MongoDB is the source of truth. Sockets only announce what has already been
 * written, so a disconnected user loses nothing — reconnecting and refetching
 * history shows exactly the same thing.
 *
 * Both the REST controller and the socket handlers call these functions, so
 * the two transports cannot enforce different rules.
 */

const PARTICIPANT_FIELDS = "name username avatar role isVerified";
const MAX_MESSAGE_LENGTH = 5000;

const assertValidId = (id, label = "Conversation") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound(`${label} not found`);
  }
};

/**
 * Load a conversation the user actually belongs to.
 *
 * The single gate for every conversation operation — REST and socket alike.
 * Returns 404 rather than 403 for a non-participant: someone who is not in a
 * private conversation should not learn that it exists.
 */
const loadParticipantConversation = async (conversationId, user) => {
  assertValidId(conversationId);

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const belongs = conversation.participants.some((id) => id.equals(user._id));
  if (!belongs) throw ApiError.notFound("Conversation not found");

  return conversation;
};

/** The participant who is not the viewer. */
const otherParticipant = (conversation, userId) =>
  conversation.participants.find(
    (participant) => !(participant._id ?? participant).equals(userId),
  );

/**
 * Shape a conversation for its viewer: the other person, the last message,
 * and only *this* viewer's unread count — never the other side's.
 */
const forViewer = (conversation, userId) => {
  const other = otherParticipant(conversation, userId);
  const unread = conversation.unreadCounts?.get?.(String(userId)) ?? 0;

  return {
    _id: conversation._id,
    participant: other ?? null,
    lastMessage: conversation.lastMessage ?? null,
    lastMessageAt: conversation.lastMessageAt ?? conversation.createdAt,
    unreadCount: unread,
    isParticipantOnline: other
      ? realtime.isOnline(other._id ?? other)
      : false,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

/** Every conversation the caller is in, most recent first. */
const listForUser = async (user) => {
  const conversations = await Conversation.find({ participants: user._id })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .populate("participants", PARTICIPANT_FIELDS)
    .populate({ path: "lastMessage", select: "content sender createdAt read" });

  return conversations.map((conversation) => forViewer(conversation, user._id));
};

/**
 * Open a conversation with someone, creating it only if it does not exist.
 *
 * The unique `participantsKey` index is the real guarantee against duplicates;
 * the E11000 catch handles two simultaneous opens by re-reading the row the
 * other request just created.
 */
const openWith = async (user, otherUserId) => {
  assertValidId(otherUserId, "User");

  if (String(otherUserId) === String(user._id)) {
    throw ApiError.badRequest("You cannot start a conversation with yourself");
  }

  const other = await User.findOne({ _id: otherUserId, isActive: true }).select(
    PARTICIPANT_FIELDS,
  );
  if (!other) throw ApiError.notFound("User not found");

  const key = [user._id.toString(), other._id.toString()].sort().join(":");

  let conversation = await Conversation.findOne({ participantsKey: key });
  let created = false;

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        participants: [user._id, other._id],
      });
      created = true;
    } catch (error) {
      if (error.code === 11000) {
        conversation = await Conversation.findOne({ participantsKey: key });
      } else {
        throw error;
      }
    }
  }

  await conversation.populate("participants", PARTICIPANT_FIELDS);
  await conversation.populate({
    path: "lastMessage",
    select: "content sender createdAt read",
  });

  return { conversation: forViewer(conversation, user._id), created };
};

/** A single conversation, for its participants only. */
const getById = async (conversationId, user) => {
  const conversation = await loadParticipantConversation(conversationId, user);

  await conversation.populate("participants", PARTICIPANT_FIELDS);
  await conversation.populate({
    path: "lastMessage",
    select: "content sender createdAt read",
  });

  return forViewer(conversation, user._id);
};

/**
 * Message history, newest first.
 *
 * Page 1 is the most recent messages, matching the {conversation, createdAt:-1}
 * index. The client reverses each page to render oldest-to-newest.
 */
const listMessages = async (conversationId, user, { page = 1, limit = 30 }) => {
  await loadParticipantConversation(conversationId, user);

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", PARTICIPANT_FIELDS),
    Message.countDocuments({ conversation: conversationId }),
  ]);

  return {
    messages,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: skip + messages.length < total,
  };
};

/**
 * Send a message.
 *
 * The sender is always the authenticated user — a `sender` in the payload is
 * ignored because it is never read. Persist first, announce second: if the
 * broadcast fails the message still exists and appears on the next fetch.
 */
const sendMessage = async (conversationId, sender, rawContent) => {
  const conversation = await loadParticipantConversation(conversationId, sender);

  const content = typeof rawContent === "string" ? rawContent.trim() : "";
  if (!content) {
    throw ApiError.badRequest("A message cannot be empty");
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw ApiError.badRequest(
      `A message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
    );
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: sender._id,
    content,
  });
  await message.populate("sender", PARTICIPANT_FIELDS);

  const recipientId = otherParticipant(conversation, sender._id);

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  if (recipientId) {
    const key = String(recipientId);
    conversation.unreadCounts.set(
      key,
      (conversation.unreadCounts.get(key) ?? 0) + 1,
    );
  }
  await conversation.save();

  // Everyone with the thread open sees it immediately.
  realtime.emitToConversation(conversation._id, "message:new", {
    conversationId: conversation._id.toString(),
    message,
  });

  if (recipientId) {
    // Also to the recipient's personal room, so an inbox badge updates even
    // when they do not have this thread open.
    realtime.emitToUser(recipientId, "conversation:updated", {
      conversationId: conversation._id.toString(),
      lastMessage: message,
    });

    /**
     * A notification per message would flood the bell during a live
     * back-and-forth, so it is skipped when the recipient already has the
     * thread open — they have seen it. Never for the sender.
     */
    const watching = await realtime.isViewingConversation(
      recipientId,
      conversation._id,
    );
    if (!watching) {
      await notificationService.notify({
        recipient: recipientId,
        actor: sender._id,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        message: `${sender.name} sent you a message`,
        relatedId: conversation._id,
        relatedModel: NOTIFICATION_TARGETS.CONVERSATION,
      });
    }
  }

  return { message, conversation, recipientId };
};

/**
 * Mark the other person's messages as read.
 *
 * Scoped with `sender: { $ne: user }` so a user can only ever clear messages
 * addressed to them — you cannot mark your own as read, and you cannot touch
 * anyone else's state.
 */
const markRead = async (conversationId, user) => {
  const conversation = await loadParticipantConversation(conversationId, user);

  const now = new Date();
  const { modifiedCount } = await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: user._id },
      read: false,
    },
    { read: true, readAt: now },
  );

  conversation.unreadCounts.set(String(user._id), 0);
  await conversation.save();

  if (modifiedCount > 0) {
    // Tells the sender their messages were seen.
    realtime.emitToConversation(conversation._id, "message:read:update", {
      conversationId: conversation._id.toString(),
      readBy: user._id.toString(),
      readAt: now,
      count: modifiedCount,
    });
  }

  return { conversationId: conversation._id, markedRead: modifiedCount };
};

/** Total unread across every conversation, for the header badge. */
const unreadTotal = async (user) => {
  const conversations = await Conversation.find({
    participants: user._id,
  }).select("unreadCounts");

  return conversations.reduce(
    (sum, conversation) =>
      sum + (conversation.unreadCounts?.get?.(String(user._id)) ?? 0),
    0,
  );
};

module.exports = {
  listForUser,
  openWith,
  getById,
  listMessages,
  sendMessage,
  markRead,
  unreadTotal,
  loadParticipantConversation,
  MAX_MESSAGE_LENGTH,
};

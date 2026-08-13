const conversationService = require("../services/conversation.service");
const ApiError = require("../utils/ApiError");
const { validateFeedQuery } = require("../utils/validators");

/**
 * REST alongside sockets, not instead of them: history, inbox and the initial
 * load come over HTTP, and the socket only carries live updates. Both call the
 * same service, so a message sent over REST reaches open sockets too.
 */

/** GET /api/conversations */
const getConversations = async (req, res) => {
  const conversations = await conversationService.listForUser(req.user);

  res.json({
    success: true,
    message: "Conversations retrieved",
    data: { conversations, count: conversations.length },
  });
};

/** GET /api/conversations/unread — total across all threads, for the header. */
const getUnreadTotal = async (req, res) => {
  const unread = await conversationService.unreadTotal(req.user);
  res.json({
    success: true,
    message: "Unread total retrieved",
    data: { unread },
  });
};

/**
 * POST /api/conversations — open a thread with someone.
 * Returns the existing conversation when there already is one.
 */
const openConversation = async (req, res) => {
  const userId = req.body?.userId ?? req.body?.participantId;
  if (!userId || typeof userId !== "string") {
    throw ApiError.badRequest("Validation failed", ["userId is required"], {
      userId: "userId is required",
    });
  }

  const { conversation, created } = await conversationService.openWith(
    req.user,
    userId,
  );

  res.status(created ? 201 : 200).json({
    success: true,
    message: created ? "Conversation started" : "Conversation retrieved",
    data: { conversation, created },
  });
};

/** GET /api/conversations/:id */
const getConversation = async (req, res) => {
  const conversation = await conversationService.getById(
    req.params.id,
    req.user,
  );

  res.json({
    success: true,
    message: "Conversation retrieved",
    data: { conversation },
  });
};

/** GET /api/conversations/:id/messages — newest first, paginated. */
const getMessages = async (req, res) => {
  const { errors, value } = validateFeedQuery(req.query);
  if (errors.length) throw ApiError.badRequest("Invalid query", errors);

  const result = await conversationService.listMessages(req.params.id, req.user, {
    page: value.page,
    limit: value.limit,
  });

  res.json({ success: true, message: "Messages retrieved", data: result });
};

/**
 * POST /api/conversations/:id/messages
 * The sender is the authenticated user; any `sender` in the body is ignored.
 */
const sendMessage = async (req, res) => {
  const { message } = await conversationService.sendMessage(
    req.params.id,
    req.user,
    req.body?.content,
  );

  res.status(201).json({
    success: true,
    message: "Message sent",
    data: { message },
  });
};

/** PATCH /api/conversations/:id/read */
const markRead = async (req, res) => {
  const result = await conversationService.markRead(req.params.id, req.user);

  res.json({
    success: true,
    message: "Conversation marked as read",
    data: result,
  });
};

module.exports = {
  getConversations,
  getUnreadTotal,
  openConversation,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
};

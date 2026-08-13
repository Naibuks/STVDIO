const express = require("express");
const {
  getConversations,
  getUnreadTotal,
  openConversation,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
} = require("../controllers/conversation.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Every route is private — a conversation has no public view. Participation is
// checked per conversation inside the service, not by this router.
router.use(authenticate);

router.get("/", getConversations);
// Declared before "/:id" so "unread" is never parsed as a conversation id.
router.get("/unread", getUnreadTotal);
router.post("/", openConversation);

router.get("/:id", getConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.patch("/:id/read", markRead);

module.exports = router;

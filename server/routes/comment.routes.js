const express = require("express");
const { deleteComment } = require("../controllers/social.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Comments are created and listed under their project; only deletion needs a
// top-level route, because a comment id is enough to identify it.
router.delete("/:id", authenticate, deleteComment);

module.exports = router;

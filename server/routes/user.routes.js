const express = require("express");
const {
  getMe,
  updateMe,
  getPublicProfile,
  getUserProjects,
} = require("../controllers/user.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

// "/me" is declared before "/:username" so it is never swallowed by the
// dynamic segment and treated as a user called "me".
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);

// Public, but optionalAuthenticate lets the owner see their own unlisted and
// private work on their own profile.
router.get("/:username", getPublicProfile);
router.get("/:username/projects", optionalAuthenticate, getUserProjects);

module.exports = router;

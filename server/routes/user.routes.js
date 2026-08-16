const express = require("express");
const {
  getMe,
  updateMe,
  deleteMe,
  getPublicProfile,
  getUserProjects,
} = require("../controllers/user.controller");
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require("../controllers/social.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

// "/me" is declared before "/:username" so it is never swallowed by the
// dynamic segment and treated as a user called "me".
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.delete("/me", authenticate, deleteMe);

// Public, but optionalAuthenticate lets the owner see their own unlisted and
// private work on their own profile, and tells a signed-in viewer whether they
// already follow this person.
router.get("/:username", optionalAuthenticate, getPublicProfile);
router.get("/:username/projects", optionalAuthenticate, getUserProjects);

// --- Follows (Phase 5) ----------------------------------------------------
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowing);
router.post("/:username/follow", authenticate, followUser);
router.delete("/:username/follow", authenticate, unfollowUser);

module.exports = router;

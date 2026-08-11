const express = require("express");
const {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");
const {
  likeProject,
  unlikeProject,
  getProjectLikes,
  getProjectComments,
  createComment,
} = require("../controllers/social.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authenticate, createProject);

// Declared before "/:id" so "my" is not parsed as a project id.
router.get("/my", authenticate, getMyProjects);

// Public read; the viewer's identity only decides whether a PRIVATE project
// is visible. Ownership for writes is enforced in the service layer.
router.get("/:id", optionalAuthenticate, getProject);

router.put("/:id", authenticate, updateProject);
router.delete("/:id", authenticate, deleteProject);

// --- Social interactions (Phase 5) ---------------------------------------
// Reading is public but still visibility-checked in the service, so a PRIVATE
// project 404s here exactly as it does on the project itself.
router.get("/:id/likes", optionalAuthenticate, getProjectLikes);
router.post("/:id/like", authenticate, likeProject);
router.delete("/:id/like", authenticate, unlikeProject);

router.get("/:id/comments", optionalAuthenticate, getProjectComments);
router.post("/:id/comments", authenticate, createComment);

module.exports = router;

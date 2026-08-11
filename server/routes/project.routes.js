const express = require("express");
const {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");
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

module.exports = router;

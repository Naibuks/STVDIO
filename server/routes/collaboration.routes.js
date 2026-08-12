const express = require("express");
const {
  browseCollaborations,
  getMyCollaborations,
  getMyApplications,
  getCollaboration,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
  applyToCollaboration,
  getApplications,
  respondToApplication,
} = require("../controllers/collaboration.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Public board.
router.get("/", browseCollaborations);

// Declared before "/:id" so "mine" is never parsed as a collaboration id.
// "/mine/applications" must also come before "/:id/applications".
router.get("/mine/applications", authenticate, getMyApplications);
router.get("/mine", authenticate, getMyCollaborations);

router.post("/", authenticate, createCollaboration);

// Public detail. optionalAuthenticate only tells the page whether the viewer
// is the creator or has already applied — it never widens what is returned.
router.get("/:id", optionalAuthenticate, getCollaboration);

router.patch("/:id", authenticate, updateCollaboration);
router.delete("/:id", authenticate, deleteCollaboration);

// --- Applications ---------------------------------------------------------
router.post("/:id/applications", authenticate, applyToCollaboration);
// Creator-only; ownership is enforced in the service, not by this route.
router.get("/:id/applications", authenticate, getApplications);
router.patch(
  "/:id/applications/:applicationId",
  authenticate,
  respondToApplication,
);

module.exports = router;

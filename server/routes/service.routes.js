const express = require("express");
const {
  browseServices,
  getMyServices,
  getService,
  createService,
  updateService,
  deactivateService,
} = require("../controllers/service.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", browseServices);

// Declared before "/:id" so "mine" is not parsed as a service id.
router.get("/mine", authenticate, getMyServices);

router.post("/", authenticate, createService);

// Public read; optionalAuthenticate only lets the owner see their own
// deactivated listing so the edit page keeps working.
router.get("/:id", optionalAuthenticate, getService);

router.put("/:id", authenticate, updateService);
// Deactivates rather than destroys — orders reference the service.
router.delete("/:id", authenticate, deactivateService);

module.exports = router;

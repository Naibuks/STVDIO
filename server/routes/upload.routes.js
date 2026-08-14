const express = require("express");
const { uploadImage, uploadMedia } = require("../controllers/upload.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { uploadSingle, uploadMany } = require("../middleware/upload.middleware");

const router = express.Router();

/**
 * Uploading costs money and storage, so both routes require a signed-in user.
 * `authenticate` runs before multer, which means an anonymous request is
 * rejected before its body is read rather than after a 100 MB video has been
 * buffered into memory.
 */
router.use(authenticate);

router.post("/image", uploadSingle, uploadImage);
router.post("/media", uploadMany, uploadMedia);

module.exports = router;

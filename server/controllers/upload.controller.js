const uploadService = require("../services/upload.service");
const ApiError = require("../utils/ApiError");

/**
 * Upload endpoints.
 *
 * They return media objects only — storing them is the caller's next request
 * (PUT /users/me for an avatar, POST /projects for a project). Keeping upload
 * and persistence separate is what lets the browser show a preview and let the
 * user back out before anything is saved.
 */

/** POST /api/uploads/image — one image, for an avatar. */
const uploadImage = async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file was uploaded");

  const media = await uploadService.uploadOne(req.file, "avatar");

  res.status(201).json({
    success: true,
    message: "Image uploaded",
    data: { media },
  });
};

/** POST /api/uploads/media — up to 20 images or videos, for a project. */
const uploadMedia = async (req, res) => {
  const files = req.files ?? [];
  if (files.length === 0) throw ApiError.badRequest("No files were uploaded");

  const media = await uploadService.uploadMany(files, "project");

  res.status(201).json({
    success: true,
    message: `${media.length} file${media.length === 1 ? "" : "s"} uploaded`,
    data: { media, count: media.length },
  });
};

module.exports = { uploadImage, uploadMedia };

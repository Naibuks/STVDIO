const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { isAcceptableMime } = require("../utils/fileType");
const { MAX_VIDEO_BYTES } = require("../services/upload.service");

/**
 * Multipart parsing for uploads.
 *
 * memoryStorage keeps files in RAM: nothing is written to disk, so there is no
 * temp directory to secure, clean up, or accidentally serve. The trade-off is
 * that a file must fit in memory, which the size limits below already bound.
 *
 * The checks here are a cheap first pass on client-supplied metadata. The
 * authoritative check is upload.service.inspect(), which reads the actual
 * bytes — see utils/fileType.js.
 */
const storage = multer.memoryStorage();

/**
 * Rejects clearly-wrong declared types before a byte is buffered.
 * "Unknown" types are allowed through and settled by the signature check.
 */
const fileFilter = (req, file, cb) => {
  if (!isAcceptableMime(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `${file.originalname || "That file"} is not a supported type. Accepted: JPG, PNG, WEBP, MP4, MOV, WEBM`,
      ),
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // The ceiling for any single file. Images are held to a lower limit by
    // upload.service once the real type is known.
    fileSize: MAX_VIDEO_BYTES,
    files: 20, // matches Project.media's maximum
  },
});

/** One file, field name "file". */
const single = upload.single("file");

/** Up to 20 files, field name "files". */
const many = upload.array("files", 20);

/**
 * Translate multer's own errors into the project's ApiError shape.
 *
 * Without this a file that is too large surfaces as an unhandled MulterError
 * and becomes a 500, when it is plainly a 400.
 */
const withMulterErrors = (handler) => (req, res, next) =>
  handler(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          ApiError.badRequest(
            `That file is too large. The maximum is ${MAX_VIDEO_BYTES / 1024 / 1024} MB`,
          ),
        );
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return next(ApiError.badRequest("Too many files — 20 at most"));
      }
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          ApiError.badRequest(`Unexpected file field "${error.field}"`),
        );
      }
      return next(ApiError.badRequest(error.message));
    }

    next(error);
  });

module.exports = {
  uploadSingle: withMulterErrors(single),
  uploadMany: withMulterErrors(many),
};

const { getCloudinary, isConfigured, FOLDER } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const { detect } = require("../utils/fileType");

/**
 * The only place STVDIO° talks to Cloudinary.
 *
 * Controllers hand it a buffer and get back a media object shaped exactly like
 * models/media.schema.js, so an upload result can be stored on a User avatar
 * or in Project.media without any translation.
 */

/** Bytes. Videos get more room, but not unbounded. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

/** Uploads are grouped by what they are for, not by who uploaded them. */
const FOLDERS = {
  avatar: `${FOLDER}/avatars`,
  project: `${FOLDER}/projects`,
};

/**
 * Validate a buffer against the accepted formats and size caps.
 *
 * The browser's MIME type is not consulted here at all — only the bytes. The
 * middleware already rejected obviously wrong MIME types as a cheap first
 * pass; this is the check that actually decides.
 */
const inspect = (file) => {
  const detected = detect(file.buffer);

  if (!detected) {
    throw ApiError.badRequest(
      `${file.originalname || "That file"} is not a supported format. Accepted: JPG, PNG, WEBP, MP4, MOV, WEBM`,
    );
  }

  const limit = detected.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw ApiError.badRequest(
      `${file.originalname || "That file"} is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit for ${detected.kind}s is ${limit / 1024 / 1024} MB`,
    );
  }

  return detected;
};

/**
 * Send one buffer to Cloudinary.
 *
 * upload_stream is used rather than upload() because the file never touches
 * disk — multer keeps it in memory, so there is no temp file to clean up or
 * leak. Returns only the fields media.schema.js stores; the rest of
 * Cloudinary's response (including any account detail) is discarded.
 */
const uploadBuffer = (buffer, { folder, resourceType }) =>
  new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Let Cloudinary pick the best format and quality for each viewer.
        ...(resourceType === "image" && {
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        }),
      },
      (error, result) => {
        if (error) {
          // Cloudinary's message is safe to pass on; its config is not, so
          // nothing else from the error object is surfaced or logged.
          return reject(
            new ApiError(502, `Cloudinary upload failed: ${error.message}`),
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          width: result.width,
          height: result.height,
        });
      },
    );

    stream.end(buffer);
  });

const assertConfigured = () => {
  if (!isConfigured()) {
    throw new ApiError(
      503,
      "Media uploads are not configured on this server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env",
    );
  }
};

/** Validate then upload a single file. */
const uploadOne = async (file, purpose = "project") => {
  assertConfigured();
  const detected = inspect(file);

  return uploadBuffer(file.buffer, {
    folder: FOLDERS[purpose] ?? FOLDERS.project,
    resourceType: detected.kind,
  });
};

/**
 * Validate every file before uploading any of them.
 *
 * A rejected fifth file should not leave four orphans in Cloudinary, so the
 * whole batch is checked first and only then sent.
 */
const uploadMany = async (files, purpose = "project") => {
  assertConfigured();
  files.forEach(inspect);

  return Promise.all(files.map((file) => uploadOne(file, purpose)));
};

/**
 * Remove an asset. Best-effort: a failure here is logged, not thrown, because
 * it is only ever a tidy-up after the database has already been updated.
 */
const destroy = async (publicId, resourceType = "image") => {
  if (!publicId || !isConfigured()) return false;
  try {
    await getCloudinary().uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return true;
  } catch (error) {
    console.error(`[upload] could not delete ${publicId}: ${error.message}`);
    return false;
  }
};

module.exports = {
  uploadOne,
  uploadMany,
  destroy,
  inspect,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
};

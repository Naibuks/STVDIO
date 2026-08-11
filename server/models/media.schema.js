const mongoose = require("mongoose");

/**
 * Reusable Cloudinary media sub-document.
 *
 * Media is never stored in MongoDB itself — only the Cloudinary URL and the
 * `publicId` needed to delete or transform the asset later. This is embedded
 * (not referenced) because a media item has no meaning outside its parent.
 *
 * Uploading is Phase 4; this only fixes the shape now so later phases don't
 * have to migrate documents.
 */
const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Media url is required"],
      trim: true,
    },
    publicId: {
      type: String,
      required: [true, "Media publicId is required"],
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "image",
    },
    width: Number,
    height: Number,
  },
  { _id: false },
);

module.exports = mediaSchema;

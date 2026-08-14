const { v2: cloudinary } = require("cloudinary");

/**
 * Cloudinary configuration.
 *
 * Sits beside config/db.js because it is infrastructure wiring, not business
 * logic. The API secret is read from the environment here and nowhere else;
 * nothing in this file is ever imported by the client bundle.
 */

let configured = false;

/**
 * Configure lazily on first use so requiring this file never crashes a
 * process without credentials (the seed script, tests).
 */
const getCloudinary = () => {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
};

/** True when all three credentials are present. */
const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

/** Everything STVDIO° uploads lives under one prefix. */
const FOLDER = "stvdio";

module.exports = { getCloudinary, isConfigured, FOLDER };

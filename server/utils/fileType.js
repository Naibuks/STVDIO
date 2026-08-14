/**
 * File-type detection from the bytes themselves.
 *
 * A browser-supplied MIME type and a filename extension are both just strings
 * the client chose; renaming `payload.svg` to `photo.png` changes neither the
 * bytes nor what a browser will do with them. So the accepted list is checked
 * against the file's actual signature, and the MIME type is only a first,
 * cheap filter.
 */

/** Every format STVDIO° accepts, with the signature that identifies it. */
const SIGNATURES = [
  {
    ext: "jpg",
    mime: "image/jpeg",
    kind: "image",
    // SOI marker.
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "png",
    mime: "image/png",
    kind: "image",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: "webp",
    mime: "image/webp",
    kind: "image",
    // "RIFF" .... "WEBP"
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    ext: "mp4",
    mime: "video/mp4",
    kind: "video",
    // ISO base media: "ftyp" at offset 4. Covers mp4 and most .mov files.
    test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    ext: "webm",
    mime: "video/webm",
    kind: "video",
    // EBML header, shared with matroska.
    test: (b) =>
      b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
];

/** MIME types the upload middleware lets through before the byte check. */
const ACCEPTED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov — an ISO base media file, matched by "ftyp"
  "video/webm",
];

/**
 * Types meaning "the client could not work out what this is".
 *
 * Browsers and HTTP clients frequently send application/octet-stream for
 * WEBP, MP4, MOV and WEBM — a MIME-only filter therefore rejects perfectly
 * valid uploads. These are allowed past the cheap pre-filter and decided by
 * the signature check, which is authoritative anyway. Nothing is weakened:
 * a file whose bytes are not on the accepted list is still refused.
 */
const UNKNOWN_MIME = ["application/octet-stream", "binary/octet-stream", ""];

/** True when the declared type should not by itself cause a rejection. */
const isAcceptableMime = (mimetype) =>
  ACCEPTED_MIME.includes(mimetype) || UNKNOWN_MIME.includes(mimetype ?? "");

/**
 * Identify a buffer. Returns { ext, mime, kind } or null when the bytes match
 * nothing on the accepted list.
 */
const detect = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  const head = buffer.subarray(0, 16);
  return SIGNATURES.find((signature) => signature.test(head)) ?? null;
};

module.exports = {
  detect,
  isAcceptableMime,
  ACCEPTED_MIME,
  UNKNOWN_MIME,
  SIGNATURES,
};

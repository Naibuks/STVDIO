import { API_URL } from "@/lib/env";
import { getToken } from "@/lib/auth";
import { ApiRequestError } from "./api";
import type { ApiError, ApiResponse, Media } from "@/types/api";

/**
 * File uploads.
 *
 * These bypass apiRequest because that helper always sets
 * `Content-Type: application/json`. A multipart body must let the browser set
 * its own Content-Type so it can add the boundary — setting it manually
 * produces a body the server cannot parse. Everything else (bearer token,
 * ApiRequestError) matches the shared client.
 */
const postForm = async <T>(path: string, form: FormData): Promise<T> => {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    // No Content-Type header on purpose — see above.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;
    throw new ApiRequestError(
      error?.message ?? response.statusText,
      response.status,
      error?.errors,
      error?.fields,
    );
  }

  return (data as ApiResponse<T>).data;
};

/** One image, for an avatar. Returns a media object ready to store. */
export const uploadImage = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return postForm<{ media: Media }>("/uploads/image", form);
};

/** Up to 20 images or videos, for a project. */
export const uploadMedia = (files: File[]) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  return postForm<{ media: Media[]; count: number }>("/uploads/media", form);
};

/** Mirrors the server's limits so the browser can reject early. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";
export const ACCEPT_MEDIA =
  "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

/** "2.4 MB" */
export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Client-side pre-check.
 *
 * Purely to save the user a round trip — the server re-checks the actual bytes
 * and is the only thing that decides. Returns an error string or null.
 */
export const checkFile = (file: File, { allowVideo = true } = {}) => {
  const isVideo = file.type.startsWith("video/");

  if (!isVideo && !file.type.startsWith("image/")) {
    return `${file.name} is not an image${allowVideo ? " or video" : ""}`;
  }
  if (isVideo && !allowVideo) {
    return `${file.name} is a video — only images are allowed here`;
  }

  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return `${file.name} is ${formatBytes(file.size)} — the limit for ${
      isVideo ? "videos" : "images"
    } is ${formatBytes(limit)}`;
  }

  return null;
};

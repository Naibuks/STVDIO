"use client";

import { useEffect, useRef, useState } from "react";
import SafeImage from "./SafeImage";
import { ApiRequestError } from "@/services/api";
import {
  ACCEPT_IMAGE,
  checkFile,
  formatBytes,
  MAX_IMAGE_BYTES,
  uploadImage,
} from "@/services/uploads";
import type { Media } from "@/types/api";

const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

/**
 * Profile picture upload.
 *
 * Replaces the old "paste a URL" input. The file goes to our own API, which
 * holds the Cloudinary credentials — nothing about Cloudinary reaches the
 * browser. Uploading happens on selection so the user sees the real hosted
 * image before saving, and the parent form only ever deals with the resulting
 * media object.
 */
export default function AvatarUploader({
  value,
  onChange,
  name,
}: {
  /** Current avatar, or null when there is none. */
  value: Media | null;
  onChange: (media: Media | null) => void;
  /** Used for the initial-letter placeholder. */
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Object URLs are a manual allocation; releasing them avoids leaking a blob
  // for every file the user tries.
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    const problem = checkFile(file, { allowVideo: false });
    if (problem) {
      setError(problem);
      return;
    }

    // Instant feedback while the upload is in flight.
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setError(null);
    setUploading(true);

    try {
      const { media } = await uploadImage(file);
      onChange(media);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed",
      );
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setError(null);
    onChange(null);
  };

  // The uploaded result wins once it arrives; the blob is only a stand-in.
  const shown = value?.url ?? localPreview;

  return (
    <div>
      <span className={labelClass}>Profile picture</span>

      <div className="mt-3 flex flex-wrap items-center gap-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-current/10">
          {shown ? (
            <SafeImage
              src={shown}
              alt={name || "Profile picture"}
              className="h-full w-full object-cover"
              fallback={
                <span className="flex h-full items-center justify-center text-xl font-medium text-current/30">
                  {name?.charAt(0) ?? "?"}
                </span>
              }
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xl font-medium text-current/30">
              {name?.charAt(0) ?? "?"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="border border-current px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
          >
            {uploading
              ? "Uploading…"
              : shown
                ? "Replace picture"
                : "Upload picture"}
          </button>

          {shown && !uploading && (
            <button
              type="button"
              onClick={remove}
              className="border border-current/30 px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/60 hover:bg-current/5"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_IMAGE}
          onChange={pick}
          className="hidden"
          aria-label="Choose a profile picture"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      ) : (
        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-current/30">
          JPG, PNG or WEBP · up to {formatBytes(MAX_IMAGE_BYTES)}
        </p>
      )}
    </div>
  );
}

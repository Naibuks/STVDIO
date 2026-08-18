"use client";

import { useEffect, useRef, useState } from "react";
import SafeMedia from "./SafeMedia";
import { ApiRequestError } from "@/services/api";
import {
  ACCEPT_IMAGE,
  ACCEPT_MEDIA,
  checkFile,
  formatBytes,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  uploadMedia,
} from "@/services/uploads";
import type { Media } from "@/types/api";

const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

const MAX_ITEMS = 20; // matches Project.media's maximum

/**
 * Photo and video upload for a post.
 *
 * Files are uploaded as soon as they are chosen, so what the user reviews is
 * the hosted file that will actually be stored, not a local stand-in that
 * might fail server-side validation at publish time. The parent form receives
 * finished media objects and submits them unchanged.
 */
export default function MediaUploader({
  value,
  onChange,
  onBusyChange,
  allowVideo = true,
  maxItems = MAX_ITEMS,
  label = "Photos & videos — the first is the cover",
  accept,
}: {
  value: Media[];
  onChange: (media: Media[]) => void;
  /** Lets the form disable Publish while an upload is in flight. */
  onBusyChange?: (busy: boolean) => void;
  allowVideo?: boolean;
  maxItems?: number;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Local blob previews for the batch currently uploading. */
  const [pending, setPending] = useState<{ url: string; isVideo: boolean }[]>(
    [],
  );

  /**
   * Live object URLs, written only from event handlers.
   *
   * The unmount cleanup needs the current list without re-subscribing on every
   * render, and a ref must not be written during render — so `pick` keeps this
   * in step rather than mirroring state here.
   */
  const blobsRef = useRef<string[]>([]);

  // Release any blob still outstanding if the form unmounts mid-upload.
  useEffect(
    () => () => {
      blobsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobsRef.current = [];
    },
    [],
  );

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onBusyChange?.(busy);
  };

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset so re-picking the same file still fires a change event.
    event.target.value = "";
    if (files.length === 0) return;

    if (value.length + files.length > maxItems) {
      setError(
        `That would be ${value.length + files.length} files — ${maxItems} at most`,
      );
      return;
    }

    // Reject the batch on the first bad file so the user is not left guessing
    // which of several uploads silently vanished. The server does the same.
    const problem = files.map((file) => checkFile(file, { allowVideo })).find(Boolean);
    if (problem) {
      setError(problem);
      return;
    }

    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));
    blobsRef.current = previews.map((item) => item.url);
    setPending(previews);
    setError(null);
    setBusy(true);

    try {
      const { media } = await uploadMedia(files);
      onChange([...value, ...media]);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed",
      );
    } finally {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
      blobsRef.current = [];
      setPending([]);
      setBusy(false);
    }
  };

  const removeAt = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const tileClass = "h-24 w-24 object-cover";

  return (
    <div>
      <span className={labelClass}>{label}</span>

      <div className="mt-3 flex flex-wrap gap-3">
        {value.map((media, index) => (
          <div
            key={media.publicId ?? `${media.url}-${index}`}
            className="group relative border border-current/15"
          >
            <SafeMedia
              media={media}
              alt={`Selected media ${index + 1}`}
              className={tileClass}
              variant="preview"
              fallback={
                <div className="flex h-24 w-24 items-center justify-center border border-dashed border-current/25 text-center font-mono text-[0.5rem] uppercase leading-tight tracking-widest text-current/40">
                  Can&rsquo;t load
                </div>
              }
            />

            {index === 0 && (
              <span className="absolute left-0 top-0 bg-black/70 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-white">
                Cover
              </span>
            )}

            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove file ${index + 1}`}
              className="absolute right-0 top-0 bg-black/70 px-1.5 py-0.5 font-mono text-[0.6rem] leading-none text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
            >
              ×
            </button>
          </div>
        ))}

        {/* Blob previews for the batch still uploading. */}
        {pending.map((item, index) => (
          <div
            key={`pending-${index}`}
            className="relative border border-current/15"
          >
            {item.isVideo ? (
              <video src={item.url} className={tileClass} muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className={tileClass} />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-mono text-[0.5rem] uppercase tracking-widest text-white">
              Uploading…
            </span>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || value.length >= maxItems}
          className="flex h-24 w-24 items-center justify-center border border-dashed border-current/30 text-center font-mono text-[0.55rem] uppercase leading-tight tracking-widest text-current/50 hover:border-current/60 disabled:opacity-40"
        >
          {uploading ? "Uploading…" : "+ Add files"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept ?? (allowVideo ? ACCEPT_MEDIA : ACCEPT_IMAGE)}
          multiple
          onChange={pick}
          className="hidden"
          aria-label={allowVideo ? "Choose photos or videos" : "Choose service photos"}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      ) : (
        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-current/30">
          JPG, PNG, WEBP up to {formatBytes(MAX_IMAGE_BYTES)} · MP4, MOV, WEBM
          up to {formatBytes(MAX_VIDEO_BYTES)}
        </p>
      )}
    </div>
  );
}

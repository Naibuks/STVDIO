"use client";

import { useState } from "react";
import SafeImage from "./SafeImage";
import type { Media } from "@/types/api";

/**
 * Renders one media item — image or video — with the same graceful fallback
 * SafeImage provides.
 *
 * Before uploads existed every media item was an image, so ProjectCard and the
 * project page used SafeImage directly and a video would have rendered as a
 * broken image. This picks the right element from `resourceType`, falling back
 * to the file extension for items stored before that field was populated.
 */
const looksLikeVideo = (media?: Media | null) => {
  if (!media) return false;
  if (media.resourceType === "video") return true;
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(media.url ?? "");
};

export default function SafeMedia({
  media,
  alt,
  className,
  fallback,
  /** "preview" is a silent poster-frame tile; "full" is a playable player. */
  variant = "preview",
}: {
  media?: Media | null;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
  variant?: "preview" | "full";
}) {
  const [failed, setFailed] = useState(false);

  if (!media?.url || failed) return <>{fallback}</>;

  if (looksLikeVideo(media)) {
    return (
      <video
        src={media.url}
        className={className}
        // A grid tile is a still frame; a detail page should be playable.
        controls={variant === "full"}
        muted={variant === "preview"}
        loop={variant === "preview"}
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
        aria-label={alt}
      />
    );
  }

  return (
    <SafeImage
      src={media.url}
      alt={alt}
      className={className}
      fallback={fallback}
    />
  );
}

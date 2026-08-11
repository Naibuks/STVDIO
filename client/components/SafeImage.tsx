"use client";

import { useState } from "react";

/**
 * An <img> that degrades to a placeholder instead of a broken-image icon.
 *
 * Media URLs are typed in by users and point at hosts we do not control, so a
 * dead link is an expected state rather than an exception. Without this, a
 * 404 leaves the browser's torn-page glyph in the middle of an editorial grid.
 *
 * A plain <img> rather than next/image because the URLs are arbitrary; that
 * would require every possible host in next.config remotePatterns. Revisit
 * when Cloudinary lands and all media comes from one known host.
 *
 * `failedSrc` stores which URL failed rather than a boolean, so changing `src`
 * automatically clears the error without the caller having to remount us.
 */
export default function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string;
  alt: string;
  className?: string;
  /** Rendered when there is no src, or the src failed to load. */
  fallback: React.ReactNode;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}

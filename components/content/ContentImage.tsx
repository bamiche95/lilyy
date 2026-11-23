"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

/**
 * A photo an admin curates, with the bundled asset as a safety net: a stale
 * upload URL renders the photograph the site shipped with instead of a gap.
 */
export function ContentImage({
  src,
  fallback,
  alt = "",
  sizes,
  priority = false,
  className = "object-cover",
}: {
  src: string;
  fallback: StaticImageData;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  // Remembering the URL that failed (rather than a boolean) means a photo the
  // admin replaces gets a fresh attempt without a state-resetting effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useFallback = src.length === 0 || failedSrc === src;

  return (
    <Image
      src={useFallback ? fallback : src}
      alt={alt}
      fill
      priority={priority}
      placeholder={useFallback ? "blur" : "empty"}
      sizes={sizes}
      onError={useFallback ? undefined : () => setFailedSrc(src)}
      unoptimized={!useFallback}
      className={className}
    />
  );
}

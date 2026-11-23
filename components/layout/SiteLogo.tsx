"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Locale } from "@/lib/i18n";

/**
 * The brand lockup (wheat sprig, wordmark and tagline) shipped as a single PNG.
 * 669×270 keeps the intrinsic ratio, so `w-auto` never shifts the header layout.
 */
const LOGO = { src: "/images/lilyy-logo.png", width: 200, height: 80 } as const;

export function SiteLogo({
  lang,
  logoSrc = null,
  alt = "Lilyy Bakers",
  className = "h-10 w-auto md:h-12",
  loading = "lazy",
}: {
  lang: Locale;
  /** Admin-uploaded logo; the bundled lockup is used when empty or broken. */
  logoSrc?: string | null;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  // The URL that failed, not a boolean: a replacement logo is tried normally.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const custom = Boolean(logoSrc) && failedSrc !== logoSrc;

  return (
    <Link href={`/${lang}`} className="inline-flex shrink-0 items-center">
      {custom && logoSrc ? (
        // The upload may have any aspect ratio; a plain <img> keeps it intact
        // while the bundled lockup keeps the optimised path.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={alt}
          onError={() => setFailedSrc(logoSrc)}
          className={className}
          loading={loading}
        />
      ) : (
        <Image
          src={LOGO.src}
          alt={alt}
          width={LOGO.width}
          height={LOGO.height}
          loading={loading}
          sizes="(min-width: 768px) 120px, 100px"
          className={className}
        />
      )}
    </Link>
  );
}


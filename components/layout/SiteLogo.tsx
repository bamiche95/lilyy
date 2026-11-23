import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";

/**
 * The brand lockup (wheat sprig, wordmark and tagline) shipped as a single PNG.
 * 669×270 keeps the intrinsic ratio, so `w-auto` never shifts the header layout.
 */
const LOGO = { src: "/images/lilyy-logo.png", width: 200, height: 80 } as const;

export function SiteLogo({
  lang,
  className = "h-10 w-auto md:h-12",
  loading = "lazy",
}: {
  lang: Locale;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  return (
    <Link href={`/${lang}`} className="inline-flex shrink-0 items-center">
      <Image
        src={LOGO.src}
        alt="Lilyy Bakers"
        width={LOGO.width}
        height={LOGO.height}
        loading={loading}
        sizes="(min-width: 768px) 120px, 100px"
        className={className}
      />
    </Link>
  );
}

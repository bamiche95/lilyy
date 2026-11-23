"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { localised, type Locale } from "@/lib/i18n";
import type { ShopCategory } from "@/lib/shop";
import { cn } from "@/lib/utils";

type CategoryStripProps = {
  lang: Locale;
  categories: ShopCategory[];
  allLabel: string;
  ariaLabel: string;
};

const pill = "shrink-0 rounded-full px-3 py-1 text-sm whitespace-nowrap transition";
const idle = "text-cream/70 hover:bg-cream/10 hover:text-cream";
const selected = "bg-cream text-cocoa";

/**
 * The link list itself. Split out so the header can render it as the Suspense
 * fallback, keeping the category links in the server HTML (and crawlable) even
 * though the active pill needs the query string.
 */
export function CategoryStripLinks({
  lang,
  categories,
  allLabel,
  ariaLabel,
  activeSlug,
}: CategoryStripProps & { activeSlug: string | null }) {
  const everythingActive = activeSlug === null;

  return (
    <nav aria-label={ariaLabel} className="-mx-1 overflow-x-auto px-1">
      <ul className="flex items-center gap-1 py-1.5">
        <li>
          <Link
            href={`/${lang}/shop`}
            aria-current={everythingActive ? "page" : undefined}
            className={cn(pill, everythingActive ? selected : idle)}
          >
            {allLabel}
          </Link>
        </li>

        {categories.map((category) => {
          const isActive = activeSlug === category.slug;

          return (
            <li key={category.id}>
              <Link
                href={`/${lang}/shop?category=${encodeURIComponent(category.slug)}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(pill, isActive ? selected : idle)}
              >
                {localised(lang, category.nameEn, category.nameNo)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Active-pill wrapper for the desktop header. Active state only applies on the
 * shop listing; on product pages nothing is highlighted.
 */
export function CategoryStrip(props: CategoryStripProps) {
  const pathname = usePathname() ?? `/${props.lang}`;
  const searchParams = useSearchParams();
  const onShop = pathname === `/${props.lang}/shop`;

  return <CategoryStripLinks {...props} activeSlug={onShop ? searchParams.get("category") : null} />;
}

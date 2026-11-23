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

  // Scrolls sideways only: overflow-y stays hidden so a stray pixel can never
  // raise a vertical bar inside the header, and the bars themselves are drawn
  // by nothing, so the pills keep the full height of the bar. The vertical
  // padding keeps the focus ring from being clipped by the scroll box.
  return (
    <nav
      aria-label={ariaLabel}
      className="-mx-1 overflow-x-auto overflow-y-hidden px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* w-max + mx-auto centres the pills in the one-row header, and still lets
          the scroller start at the first pill once they no longer fit. */}
      <ul className="mx-auto flex w-max items-center gap-1 py-1.5">
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

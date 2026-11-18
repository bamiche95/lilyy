import Link from "next/link";

import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { PRODUCT_CATEGORIES, shopHref, type ShopCategory, type ShopSort } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function CategoryFilter({
  lang,
  dict,
  active,
  q,
  sort,
}: {
  lang: Locale;
  dict: Dictionary;
  active?: ShopCategory;
  q?: string;
  sort: ShopSort;
}) {
  const chip = "shrink-0 rounded-full border px-4 py-2 text-sm transition";
  const idle = "border-cocoa/20 bg-white text-mocha hover:border-cocoa/45 hover:text-cocoa";
  const selected = "border-cocoa bg-cocoa text-cream";

  return (
    <nav aria-label={dict.shop.allCategories} className="-mx-1 overflow-x-auto px-1 py-1">
      <ul className="flex gap-2">
        <li>
          <Link
            href={shopHref(lang, { q, sort })}
            aria-current={active ? undefined : "page"}
            className={cn(chip, active ? idle : selected)}
          >
            {dict.shop.allCategories}
          </Link>
        </li>

        {PRODUCT_CATEGORIES.map((category) => {
          const isActive = active === category;

          return (
            <li key={category}>
              <Link
                href={shopHref(lang, { category, q, sort })}
                aria-current={isActive ? "page" : undefined}
                className={cn(chip, isActive ? selected : idle)}
              >
                {dict.categories[category]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import type { Locale } from "./i18n";

/**
 * A category row as the UI needs it. Kept here (not in `lib/categories.ts`) so
 * client components can import the type without touching the server-only
 * loader.
 */
export type ShopCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameNo: string;
  sortOrder: number;
};

export const SHOP_SORTS = ["featured", "price-asc", "price-desc", "newest"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];

export const SORT_LABEL_KEYS = {
  featured: "sortFeatured",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
  newest: "sortNewest",
} as const satisfies Record<ShopSort, string>;

export type ShopFilters = {
  /** Category slug from `?category=`; the page resolves it against the DB. */
  category?: string;
  q?: string;
  sort: ShopSort;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Tolerant parser: `?category=` is only shape-checked here. The shop page looks
 * the slug up in the categories table, so an unknown/stale slug degrades to
 * "all products" instead of a 404.
 */
export function parseShopFilters(raw: RawSearchParams): ShopFilters {
  const categoryParam = first(raw.category)?.trim().toLowerCase().slice(0, 80);
  const sortParam = first(raw.sort);
  const query = first(raw.q)?.trim().slice(0, 80);

  return {
    category: categoryParam && /^[a-z0-9-]+$/.test(categoryParam) ? categoryParam : undefined,
    q: query ? query : undefined,
    sort: SHOP_SORTS.find((sort) => sort === sortParam) ?? "featured",
  };
}

/** Builds a shop URL, dropping defaults so the canonical listing stays clean. */
export function shopHref(
  lang: Locale,
  filters: { category?: string | null; q?: string | null; sort?: string | null } = {},
): string {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);

  const query = params.toString();
  return `/${lang}/shop${query ? `?${query}` : ""}`;
}

export function productHref(lang: Locale, slug: string): string {
  return `/${lang}/shop/${slug}`;
}

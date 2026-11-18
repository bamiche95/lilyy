import type { Locale } from "./i18n";

/** Mirrors the `ProductCategory` Prisma enum without importing Prisma client code. */
export const PRODUCT_CATEGORIES = [
  "BREAD",
  "CAKE",
  "PASTRY",
  "COOKIES",
  "SAVOURY",
  "SEASONAL",
  "DRINKS",
] as const;

export type ShopCategory = (typeof PRODUCT_CATEGORIES)[number];

export const SHOP_SORTS = ["featured", "price-asc", "price-desc", "newest"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];

export const SORT_LABEL_KEYS = {
  featured: "sortFeatured",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
  newest: "sortNewest",
} as const satisfies Record<ShopSort, string>;

export type ShopFilters = {
  category?: ShopCategory;
  q?: string;
  sort: ShopSort;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Tolerant parser: an unknown `?category=` degrades to "all" instead of a 404. */
export function parseShopFilters(raw: RawSearchParams): ShopFilters {
  const categoryParam = first(raw.category)?.toUpperCase();
  const sortParam = first(raw.sort);
  const query = first(raw.q)?.trim().slice(0, 80);

  return {
    category: PRODUCT_CATEGORIES.find((category) => category === categoryParam),
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

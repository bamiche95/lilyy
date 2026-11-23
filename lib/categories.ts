import "server-only";

import { cache } from "react";

import { prisma } from "./prisma";
import type { ShopCategory } from "./shop";

export type { ShopCategory };

/**
 * All categories, in the order the bakery arranged them.
 *
 * Wrapped in React's `cache()` so the layout header, the shop page, the admin
 * forms and every product card share a single query per request. Writes call
 * `revalidatePath("/", "layout")`, which discards the cached render.
 */
export const getCategories = cache(async (): Promise<ShopCategory[]> => {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    select: { id: true, slug: true, nameEn: true, nameNo: true, sortOrder: true },
  });
});

/** Resolves a `?category=` slug, returning undefined for unknown/stale links. */
export function findCategory(
  categories: ShopCategory[],
  slug: string | undefined,
): ShopCategory | undefined {
  if (!slug) return undefined;
  return categories.find((category) => category.slug === slug);
}

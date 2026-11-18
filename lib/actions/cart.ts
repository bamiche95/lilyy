"use server";

import { MAX_CART_LINES, type CartLine } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

/** A `CartLine` without the client-owned quantity. */
export type FreshCartItem = Omit<CartLine, "quantity">;

export type SyncCartResult = {
  ok: boolean;
  items: FreshCartItem[];
  /** Product ids that were deleted or pulled from the menu. */
  unavailable: string[];
};

/**
 * Re-prices a basket held in `localStorage`.
 *
 * The client only ever sends product ids; names, prices and images come back
 * from the database, so a tampered basket cannot invent a price.
 */
export async function syncCart(productIds: string[]): Promise<SyncCartResult> {
  const ids = Array.isArray(productIds)
    ? [...new Set(productIds.filter((id) => typeof id === "string" && id.length > 0))].slice(
        0,
        MAX_CART_LINES,
      )
    : [];

  if (ids.length === 0) {
    return { ok: true, items: [], unavailable: [] };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isAvailable: true },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameNo: true,
      price: true,
      images: true,
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  return {
    ok: true,
    items: products.map((product) => ({
      productId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameNo: product.nameNo,
      price: Number(product.price),
      image: product.images[0] ?? null,
    })),
    unavailable: ids.filter((id) => !byId.has(id)),
  };
}

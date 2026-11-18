/**
 * Basket model shared by the client store, the cart page and the server action
 * that re-prices a basket. Prices are stored in NOK (the shop's base currency)
 * exactly like `Product.price`, so the currency switcher can convert on render.
 */

export type CartLine = {
  productId: string;
  slug: string;
  nameEn: string;
  nameNo: string;
  /** NOK, plain number — Prisma `Decimal` values are normalised on add. */
  price: number;
  image: string | null;
  quantity: number;
};

export const CART_STORAGE_KEY = "lilyy_cart_v1";
export const MAX_QUANTITY_PER_LINE = 50;
export const MAX_CART_LINES = 40;

function toPositiveInt(value: unknown, fallback = 1): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) return fallback;

  return Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(numeric)));
}

function toText(value: unknown, max = 200): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function toSlug(value: unknown): string {
  return toText(value, 120).replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

/**
 * Validates a value parsed from `localStorage` or sent by the client.
 * Anything malformed is dropped rather than trusted — the cart is client state.
 */
export function sanitiseCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  const byProduct = new Map<string, CartLine>();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;

    const raw = entry as Record<string, unknown>;
    const productId = toText(raw.productId, 40);
    const slug = toSlug(raw.slug);
    const price = Number(raw.price);

    if (!productId || !slug || !Number.isFinite(price) || price < 0) continue;

    const existing = byProduct.get(productId);
    const quantity = toPositiveInt(raw.quantity);

    if (existing) {
      existing.quantity = toPositiveInt(existing.quantity + quantity);
      continue;
    }

    byProduct.set(productId, {
      productId,
      slug,
      nameEn: toText(raw.nameEn) || slug,
      nameNo: toText(raw.nameNo) || toText(raw.nameEn) || slug,
      price: Math.round(price * 100) / 100,
      image: typeof raw.image === "string" && raw.image ? raw.image : null,
      quantity,
    });
  }

  return [...byProduct.values()].slice(0, MAX_CART_LINES);
}

/** Adds `incoming` or bumps the existing line, never exceeding the per-line cap. */
export function mergeCartLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const index = lines.findIndex((line) => line.productId === incoming.productId);

  if (index === -1) {
    if (lines.length >= MAX_CART_LINES) return lines;
    return [...lines, { ...incoming, quantity: toPositiveInt(incoming.quantity) }];
  }

  const next = [...lines];
  next[index] = {
    ...next[index],
    // Refresh the snapshot so a re-added item picks up the current price/name.
    ...incoming,
    quantity: toPositiveInt(next[index].quantity + incoming.quantity),
  };

  return next;
}

export function setCartQuantity(lines: CartLine[], productId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((line) => line.productId !== productId);

  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: toPositiveInt(quantity) } : line,
  );
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** Subtotal in NOK. Money is rounded to øre before it is formatted. */
export function cartSubtotalNok(lines: CartLine[]): number {
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return Math.round(total * 100) / 100;
}

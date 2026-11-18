"use client";

import {
  CART_STORAGE_KEY,
  mergeCartLine,
  sanitiseCartLines,
  setCartQuantity,
  type CartLine,
} from "./cart";

/**
 * Tiny external store for the basket.
 *
 * `useSyncExternalStore` needs a stable snapshot, so the array lives at module
 * scope. Hydration from `localStorage` happens when the first component
 * subscribes (after mount), which keeps server and client markup identical.
 */

const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

let snapshot: CartLine[] = EMPTY;
let hydrated = false;
let started = false;

function emit() {
  for (const listener of listeners) listener();
}

function readFromStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = sanitiseCartLines(JSON.parse(raw));
    return parsed.length > 0 ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeToStorage(lines: CartLine[]) {
  try {
    if (lines.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    }
  } catch {
    // Private mode or a full quota: the basket still works for this session.
  }
}

function commit(next: CartLine[]) {
  snapshot = next;
  writeToStorage(next);
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  snapshot = readFromStorage();
  hydrated = true;

  // Another tab changed the basket.
  window.addEventListener("storage", (event) => {
    if (event.key !== CART_STORAGE_KEY) return;
    snapshot = readFromStorage();
    emit();
  });

  emit();
}

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  start();

  return () => {
    listeners.delete(listener);
  };
}

export function getCartSnapshot(): CartLine[] {
  return snapshot;
}

export function getServerCartSnapshot(): CartLine[] {
  return EMPTY;
}

export function getCartHydrated(): boolean {
  return hydrated;
}

export function getServerCartHydrated(): boolean {
  return false;
}

export function addCartLine(line: CartLine) {
  commit(mergeCartLine(snapshot, line));
}

export function updateCartQuantity(productId: string, quantity: number) {
  commit(setCartQuantity(snapshot, productId, quantity));
}

export function removeCartLine(productId: string) {
  commit(snapshot.filter((line) => line.productId !== productId));
}

export function clearCart() {
  commit(EMPTY);
}

/**
 * Replaces prices/names with server data while keeping local quantities.
 * Returns the lines that are no longer sold, so the cart can name them.
 */
export function reconcileCart(items: Omit<CartLine, "quantity">[]): CartLine[] {
  const fresh = new Map(items.map((item) => [item.productId, item]));
  const dropped = snapshot.filter((line) => !fresh.has(line.productId));

  commit(
    snapshot.flatMap((line) => {
      const item = fresh.get(line.productId);
      return item ? [{ ...item, quantity: line.quantity }] : [];
    }),
  );

  return dropped;
}

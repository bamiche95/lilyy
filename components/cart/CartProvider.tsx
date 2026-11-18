"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { syncCart } from "@/lib/actions/cart";
import { cartCount, cartSubtotalNok, type CartLine } from "@/lib/cart";
import {
  addCartLine,
  clearCart,
  getCartHydrated,
  getCartSnapshot,
  getServerCartHydrated,
  getServerCartSnapshot,
  reconcileCart,
  removeCartLine,
  subscribeCart,
  updateCartQuantity,
} from "@/lib/cart-store";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalNok: number;
  /** False until `localStorage` has been read — badges hide until then. */
  hydrated: boolean;
  /** Lines dropped from the basket because they left the menu. */
  unavailable: CartLine[];
  add: (line: CartLine) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  dismissUnavailable: () => void;
  sync: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const hydrated = useSyncExternalStore(subscribeCart, getCartHydrated, getServerCartHydrated);
  const [unavailable, setUnavailable] = useState<CartLine[]>([]);

  const add = useCallback((line: CartLine) => {
    addCartLine(line);
    setUnavailable((current) => current.filter((item) => item.productId !== line.productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    updateCartQuantity(productId, quantity);
  }, []);

  const remove = useCallback((productId: string) => {
    removeCartLine(productId);
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setUnavailable([]);
  }, []);

  const dismissUnavailable = useCallback(() => setUnavailable([]), []);

  /** Re-reads prices/availability from the server, keeping local quantities. */
  const sync = useCallback(async () => {
    const ids = getCartSnapshot().map((line) => line.productId);

    if (ids.length === 0) {
      setUnavailable([]);
      return;
    }

    const result = await syncCart(ids);

    if (!result.ok) return;

    setUnavailable(reconcileCart(result.items));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotalNok: cartSubtotalNok(lines),
      hydrated,
      unavailable,
      add,
      setQuantity,
      remove,
      clear,
      dismissUnavailable,
      sync,
    }),
    [lines, hydrated, unavailable, add, setQuantity, remove, clear, dismissUnavailable, sync],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }

  return context;
}

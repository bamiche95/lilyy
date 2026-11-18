"use client";

import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import type { Dictionary } from "@/lib/dictionaries";

/** Serialisable subset of a product that the basket needs. */
export type CartProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameNo: string;
  price: number;
  image: string | null;
};

type Labels = Dictionary["product"];

function toLine(product: CartProduct, quantity: number) {
  return {
    productId: product.id,
    slug: product.slug,
    nameEn: product.nameEn,
    nameNo: product.nameNo,
    price: product.price,
    image: product.image,
    quantity,
  };
}

/** Full control for the product page: stepper plus a wide add button. */
export function AddToCartButton({
  product,
  labels,
  disabled = false,
}: {
  product: CartProduct;
  labels: Labels;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [added]);

  if (disabled) {
    return (
      <p className="rounded-full border border-cocoa/15 bg-crust px-5 py-3 text-center text-sm text-mocha">
        {labels.outOfStock}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-cocoa/20 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            aria-label={labels.decrease}
            className="h-10 w-10 rounded-l-full text-lg leading-none text-cocoa transition hover:bg-crust disabled:opacity-40"
          >
            −
          </button>
          <span aria-live="polite" className="min-w-10 text-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(50, current + 1))}
            disabled={quantity >= 50}
            aria-label={labels.increase}
            className="h-10 w-10 rounded-r-full text-lg leading-none text-cocoa transition hover:bg-crust disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            add(toLine(product, quantity));
            setAdded(true);
          }}
          className="btn btn-primary flex-1 sm:flex-none"
        >
          {labels.addToCart}
        </button>
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-sage">
        {added ? labels.added : ""}
      </p>
    </div>
  );
}

/** One-tap add used on listing cards. */
export function QuickAddButton({ product, label }: { product: CartProduct; label: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        add(toLine(product, 1));
        setAdded(true);
      }}
      className="btn btn-outline w-full"
    >
      {added ? `✓ ${label}` : label}
    </button>
  );
}

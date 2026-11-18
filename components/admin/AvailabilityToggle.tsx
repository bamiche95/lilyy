"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { setProductAvailability } from "@/lib/actions/products";

export function AvailabilityToggle({
  productId,
  isAvailable,
  onLabel,
  offLabel,
}: {
  productId: string;
  isAvailable: boolean;
  onLabel: string;
  offLabel: string;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState(isAvailable);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !available;
    setPending(true);

    const result = await setProductAvailability(productId, next);

    if (result.ok) {
      setAvailable(next);
      router.refresh();
    }

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={available}
      className={
        available
          ? "rounded-full border border-sage/40 bg-sage/10 px-3 py-1 text-xs text-sage transition hover:border-sage disabled:opacity-50"
          : "rounded-full border border-cocoa/20 bg-crust px-3 py-1 text-xs text-mocha transition hover:border-cocoa/40 disabled:opacity-50"
      }
    >
      {available ? onLabel : offLabel}
    </button>
  );
}

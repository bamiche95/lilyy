"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setPreferences } from "@/lib/actions/preferences";
import { SUPPORTED_CURRENCIES, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({
  currency,
  label,
  tone = "light",
}: {
  currency: Currency;
  label: string;
  /** `dark` keeps a light chip so its native option list stays legible. */
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const onDark = tone === "dark";

  function change(next: string) {
    startTransition(async () => {
      const result = await setPreferences({ currency: next });
      if (result.ok) router.refresh();
    });
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={currency}
        disabled={isPending}
        onChange={(event) => change(event.target.value)}
        className={cn(
          "cursor-pointer rounded-full border py-1.5 pl-3 pr-7 text-[11px] font-semibold uppercase text-cocoa transition disabled:opacity-60",
          onDark
            ? "border-cream/25 bg-cream hover:border-cream/70"
            : "border-cocoa/15 bg-white hover:border-cocoa/35",
        )}
      >
        {SUPPORTED_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}

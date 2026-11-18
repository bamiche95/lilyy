"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setPreferences } from "@/lib/actions/preferences";
import { SUPPORTED_CURRENCIES, type Currency } from "@/lib/currency";

export function CurrencySwitcher({ currency, label }: { currency: Currency; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        className="cursor-pointer rounded-full border border-cocoa/15 bg-white py-1.5 pl-3 pr-7 text-[11px] font-semibold uppercase text-cocoa transition hover:border-cocoa/35 disabled:opacity-60"
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

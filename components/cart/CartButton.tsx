"use client";

import { ShoppingBasket } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/components/providers/I18nProvider";

import { useCart } from "./CartProvider";

export function CartButton({ label }: { label: string }) {
  const { count, hydrated } = useCart();
  const { locale } = useI18n();
  const visibleCount = hydrated ? count : 0;

  return (
    <Link
      href={`/${locale}/cart`}
      aria-label={`${label}: ${visibleCount}`}
      className="relative inline-flex h-9 items-center gap-2 rounded-full border border-cocoa/25 px-3 text-sm transition hover:border-cocoa/55"
    >
      <ShoppingBasket aria-hidden className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      <span
        aria-hidden
        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cocoa px-1 text-[11px] font-semibold leading-none text-cream"
      >
        {visibleCount}
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n";

export type AccountNavLabels = {
  profile: string;
  orders: string;
  payments: string;
};

/**
 * The account area has three neighbouring pages, so each one carries this
 * strip under the shared heading. Kept client-side because the active pill
 * follows `usePathname` and the labels arrive as plain strings — no dictionary
 * bundle is shipped to the browser.
 */
export function AccountNav({
  lang,
  label,
  labels,
}: {
  lang: Locale;
  label: string;
  labels: AccountNavLabels;
}) {
  const pathname = usePathname() ?? `/${lang}/account`;
  const root = `/${lang}/account`;

  const items: { href: string; label: string; exact?: boolean }[] = [
    { href: root, label: labels.profile, exact: true },
    { href: `${root}/orders`, label: labels.orders },
    { href: `${root}/payments`, label: labels.payments },
  ];

  return (
    <nav aria-label={label} className="mt-6 flex flex-wrap gap-2 text-xs">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3 py-1 transition ${
              active ? "border-cocoa bg-cocoa text-white" : "border-cocoa/15 hover:border-cocoa/30"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

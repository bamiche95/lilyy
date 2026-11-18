import Link from "next/link";

import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export type AdminSection = "products" | "orders";

/**
 * The admin area has no shared layout, so each list page drops this strip in
 * under its heading to keep the two wings one click apart.
 */
export async function AdminNav({
  lang,
  current,
}: {
  lang: Locale;
  current: AdminSection;
}) {
  const dict = await getDictionary(lang);

  const items: { key: AdminSection; href: string; label: string }[] = [
    { key: "products", href: `/${lang}/admin/products`, label: dict.adminProducts.title },
    { key: "orders", href: `/${lang}/admin/orders`, label: dict.adminOrders.title },
  ];

  return (
    <nav aria-label={dict.nav.admin} className="mt-6 flex flex-wrap gap-2 text-xs">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === current ? "page" : undefined}
          className={`rounded-full border px-3 py-1 transition ${
            item.key === current
              ? "border-cocoa bg-cocoa text-white"
              : "border-cocoa/15 hover:border-cocoa/30"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

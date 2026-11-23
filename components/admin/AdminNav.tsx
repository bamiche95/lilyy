import Link from "next/link";

import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export type AdminSection = "overview" | "products" | "categories" | "orders" | "users" | "email";

/**
 * The admin area has no shared layout, so each list page drops this strip in
 * under its heading to keep every wing one click apart. Small screens use the
 * floating admin tab bar instead, so this is desktop-only.
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
    { key: "overview", href: `/${lang}/admin`, label: dict.adminOverview.title },
    { key: "products", href: `/${lang}/admin/products`, label: dict.adminProducts.title },
    { key: "categories", href: `/${lang}/admin/categories`, label: dict.adminCategories.title },
    { key: "orders", href: `/${lang}/admin/orders`, label: dict.adminOrders.title },
    { key: "users", href: `/${lang}/admin/users`, label: dict.adminUsers.title },
    { key: "email", href: `/${lang}/admin/email`, label: dict.adminEmail.title },
  ];

  return (
    <nav aria-label={dict.nav.admin} className="mt-6 hidden flex-wrap gap-2 text-xs md:flex">
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

import type { Locale } from "@/lib/i18n";

/**
 * Admin navigation shared by the desktop sidebar and the top bar. Pure data, so
 * it stays importable from both server and client components.
 */

export type AdminSectionKey =
  | "overview"
  | "products"
  | "categories"
  | "content"
  | "orders"
  | "users"
  | "email";

export type AdminShellLabels = {
  workspace: string;
  console: string;
  catalogue: string;
  storefront: string;
  operations: string;
  viewSite: string;
  language: string;
  overview: string;
  products: string;
  categories: string;
  content: string;
  orders: string;
  users: string;
  email: string;
};

export type AdminNavItem = {
  key: AdminSectionKey;
  href: string;
  label: string;
};

export type AdminNavGroup = {
  key: string;
  /** Hidden on the collapsed icon rail, where there is no room for headings. */
  label?: string;
  items: AdminNavItem[];
};

/** Nav sections in dashboard order: overview, catalogue, storefront, operations. */
export function adminNavGroups(lang: Locale, labels: AdminShellLabels): AdminNavGroup[] {
  return [
    {
      key: "home",
      items: [{ key: "overview", href: `/${lang}/admin`, label: labels.overview }],
    },
    {
      key: "catalogue",
      label: labels.catalogue,
      items: [
        { key: "products", href: `/${lang}/admin/products`, label: labels.products },
        { key: "categories", href: `/${lang}/admin/categories`, label: labels.categories },
      ],
    },
    {
      key: "storefront",
      label: labels.storefront,
      items: [{ key: "content", href: `/${lang}/admin/content`, label: labels.content }],
    },
    {
      key: "operations",
      label: labels.operations,
      items: [
        { key: "orders", href: `/${lang}/admin/orders`, label: labels.orders },
        { key: "users", href: `/${lang}/admin/users`, label: labels.users },
        { key: "email", href: `/${lang}/admin/email`, label: labels.email },
      ],
    },
  ];
}

function isAdminSectionKey(value: string | undefined): value is AdminSectionKey {
  return (
    value === "products" ||
    value === "categories" ||
    value === "content" ||
    value === "orders" ||
    value === "users" ||
    value === "email"
  );
}

/**
 * Which wing of the admin area a path belongs to. Detail pages (`/products/abc`)
 * light up their list section; anything unrecognised falls back to overview.
 */
export function activeAdminSection(pathname: string, lang: Locale): AdminSectionKey | null {
  const root = `/${lang}/admin`;

  if (pathname === root || pathname === `${root}/`) return "overview";
  if (!pathname.startsWith(`${root}/`)) return null;

  const [section] = pathname.slice(root.length + 1).split("/");
  return isAdminSectionKey(section) ? section : null;
}

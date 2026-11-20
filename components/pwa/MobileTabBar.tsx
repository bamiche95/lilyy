"use client";

import {
  House,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  ReceiptText,
  ShoppingBasket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { useMobileMenu } from "@/components/layout/MobileMenuProvider";
import type { Locale } from "@/lib/i18n";

export type TabLabels = {
  menu: string;
  home: string;
  shop: string;
  basket: string;
  admin: {
    overview: string;
    products: string;
    orders: string;
    users: string;
    email: string;
  };
};

type Tab = {
  key: string;
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  /** Root tabs match exactly; the rest also stay lit on their detail pages. */
  exact?: boolean;
};

/**
 * The floating iOS-style tab bar shared by every small screen.
 *
 * The admin area is a separate stack: signed-in staff get the bakery dashboard
 * (where the PWA actually gets used), visitors get the shop. Path is the only
 * input, so the bar needs no session lookup on the server and stays cheap.
 */
export function MobileTabBar({ lang, labels }: { lang: Locale; labels: TabLabels }) {
  const pathname = usePathname() ?? `/${lang}`;
  const { count, hydrated } = useCart();
  const { open: menuOpen, openMenu } = useMobileMenu();

  const adminRoot = `/${lang}/admin`;
  const inAdmin = pathname === adminRoot || pathname.startsWith(`${adminRoot}/`);

  const tabs: Tab[] = inAdmin
    ? [
        { key: "overview", href: adminRoot, label: labels.admin.overview, icon: LayoutDashboard, exact: true },
        { key: "orders", href: `${adminRoot}/orders`, label: labels.admin.orders, icon: ReceiptText },
        { key: "products", href: `${adminRoot}/products`, label: labels.admin.products, icon: Package },
        { key: "users", href: `${adminRoot}/users`, label: labels.admin.users, icon: Users },
        { key: "email", href: `${adminRoot}/email`, label: labels.admin.email, icon: Mail },
      ]
    : [
        { key: "home", href: `/${lang}`, label: labels.home, icon: House, exact: true },
        { key: "shop", href: `/${lang}/shop`, label: labels.shop, icon: Package },
        { key: "basket", href: `/${lang}/cart`, label: labels.basket, icon: ShoppingBasket },
      ];

  const activeKey = tabs.find((tab) =>
    tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`),
  )?.key;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] print:hidden md:hidden">
      <nav
        aria-label={labels.menu}
        className="tabbar pointer-events-auto mx-auto flex max-w-md items-stretch gap-1 p-1.5"
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey && !menuOpen;
          const Icon = tab.icon;
          const showBadge = tab.key === "basket" && hydrated && count > 0;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[1.35rem] px-1 py-1.5 text-[10px] font-medium tracking-wide transition-[transform,background-color,color] duration-200 active:scale-[0.97] ${
                active
                  ? "bg-cocoa text-cream shadow-[0_10px_24px_-12px_rgba(59,42,32,0.9)]"
                  : "text-mocha hover:text-cocoa"
              }`}
            >
              <Icon
                aria-hidden
                className="h-[1.15rem] w-[1.15rem]"
                strokeWidth={active ? 2.1 : 1.7}
              />
              <span className="max-w-full truncate">{tab.label}</span>

              {showBadge ? (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] leading-none font-semibold text-cocoa"
                >
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
          );
        })}

        {inAdmin ? null : (
          <button
            type="button"
            onClick={openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu-sheet"
            className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[1.35rem] px-1 py-1.5 text-[10px] font-medium tracking-wide transition-[transform,background-color,color] duration-200 active:scale-[0.97] ${
              menuOpen
                ? "bg-cocoa text-cream shadow-[0_10px_24px_-12px_rgba(59,42,32,0.9)]"
                : "text-mocha hover:text-cocoa"
            }`}
          >
            <Menu
              aria-hidden
              className="h-[1.15rem] w-[1.15rem]"
              strokeWidth={menuOpen ? 2.1 : 1.7}
            />
            <span className="max-w-full truncate">{labels.menu}</span>
          </button>
        )}
      </nav>
    </div>
  );
}

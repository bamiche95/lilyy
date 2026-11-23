"use client";

import {
  ArrowUpRight,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Package,
  ReceiptText,
  Shapes,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import {
  activeAdminSection,
  adminNavGroups,
  type AdminSectionKey,
  type AdminShellLabels,
} from "@/components/admin/admin-nav";
import type { Locale } from "@/lib/i18n";
import { initials } from "@/lib/utils";

type AdminIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}>;

const ICONS: Record<AdminSectionKey, AdminIcon> = {
  overview: LayoutDashboard,
  products: Package,
  categories: Shapes,
  content: LayoutTemplate,
  orders: ReceiptText,
  users: Users,
  email: Mail,
};

/**
 * The desktop admin rail: full height, fixed, and collapsed to icons between
 * `md` and `lg`. Phones keep the floating tab bar instead, so this never renders
 * below `md`.
 */
export function AdminSidebar({
  lang,
  labels,
  brandName,
  user,
}: {
  lang: Locale;
  labels: AdminShellLabels;
  brandName: string;
  user: { name: string; email: string };
}) {
  const pathname = usePathname() ?? `/${lang}/admin`;
  const current = activeAdminSection(pathname, lang);
  const groups = adminNavGroups(lang, labels);
  const displayName = user.name.trim() || user.email;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[4.5rem] flex-col border-r border-cream/10 bg-cocoa text-cream md:flex lg:w-72">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-black/20"
      />

      <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-cream/10 px-3 lg:px-5">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold font-serif text-lg font-bold text-cocoa"
        >
          {initials(brandName).slice(0, 1) || "L"}
        </span>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate font-serif text-[15px] leading-tight text-cream">{brandName}</p>
          <p className="mt-1 truncate text-[10px] font-semibold tracking-[0.22em] text-cream/45 uppercase">
            {labels.console}
          </p>
        </div>
      </div>

      <nav
        aria-label={labels.workspace}
        className="relative flex-1 overflow-y-auto px-2 py-4 lg:px-3"
      >
        {groups.map((group, index) => (
          <div key={group.key}>
            {index > 0 ? (
              <div aria-hidden className="mx-auto my-3 h-px w-8 bg-cream/10 lg:hidden" />
            ) : null}

            {group.label ? (
              <p className="mt-1 mb-2 hidden px-3 text-[10px] font-semibold tracking-[0.2em] text-cream/40 uppercase lg:block">
                {group.label}
              </p>
            ) : null}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.key === current;
                const Icon = ICONS[item.key];

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={item.label}
                      className={`group relative flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:justify-start ${
                        active
                          ? "bg-cream/10 text-cream"
                          : "text-cream/60 hover:bg-cream/5 hover:text-cream"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold transition-opacity ${
                          active ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <Icon
                        aria-hidden
                        className="h-[1.15rem] w-[1.15rem] shrink-0"
                        strokeWidth={active ? 2.1 : 1.7}
                      />
                      <span className="hidden min-w-0 flex-1 truncate lg:block">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-cream/10 p-2 lg:p-3">
        <Link
          href={`/${lang}`}
          className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-cream/55 transition hover:bg-cream/5 hover:text-cream lg:flex"
        >
          <Store aria-hidden className="h-4 w-4 shrink-0" />
          <span className="truncate">{labels.viewSite}</span>
          <ArrowUpRight aria-hidden className="ml-auto h-3.5 w-3.5 shrink-0" />
        </Link>

        <div className="mt-1 flex items-center justify-center gap-2.5 rounded-xl px-1 py-2 lg:justify-start lg:px-2">
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-[11px] font-semibold text-cocoa uppercase"
          >
            {initials(displayName)}
          </span>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-xs font-medium text-cream">{displayName}</p>
            {displayName === user.email ? null : (
              <p className="truncate text-[11px] text-cream/45">{user.email}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

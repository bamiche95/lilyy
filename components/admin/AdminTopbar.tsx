"use client";

import { ArrowUpRight, ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { activeAdminSection, type AdminShellLabels } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import type { Locale } from "@/lib/i18n";
import { initials } from "@/lib/utils";

/**
 * Desktop admin top bar: breadcrumb on the left, storefront/language/account on
 * the right. Small screens keep the storefront header, so this is `md` and up.
 */
export function AdminTopbar({
  lang,
  labels,
  user,
  signOut,
}: {
  lang: Locale;
  labels: AdminShellLabels;
  user: { name: string; email: string };
  signOut: { label: string; errorLabel: string };
}) {
  const pathname = usePathname() ?? `/${lang}/admin`;
  const section = activeAdminSection(pathname, lang);
  const sectionLabel = labels[section ?? "overview"];
  const displayName = user.name.trim() || user.email;

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-3 border-b border-cocoa/10 bg-white/85 px-6 backdrop-blur md:flex lg:px-10">
      <div className="min-w-0 flex-1">
        <nav aria-label={labels.workspace} className="flex items-center gap-1.5 text-xs">
          <Link
            href={`/${lang}/admin`}
            className="rounded text-mocha transition hover:text-cocoa"
          >
            {labels.workspace}
          </Link>
          <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-cocoa/30" />
          <span aria-current="page" className="truncate font-semibold text-cocoa">
            {sectionLabel}
          </span>
        </nav>
      </div>

      <Link
        href={`/${lang}`}
        className="hidden items-center gap-1.5 rounded-full border border-cocoa/15 px-3 py-1.5 text-xs font-medium text-cocoa transition hover:border-cocoa/35 hover:bg-crust/60 lg:inline-flex"
      >
        <Store aria-hidden className="h-3.5 w-3.5" />
        {labels.viewSite}
        <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-mocha" />
      </Link>

      <LanguageSwitcher locale={lang} label={labels.language} />

      <span aria-hidden className="mx-1 h-6 w-px bg-cocoa/10" />

      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cocoa text-[11px] font-semibold text-cream uppercase"
        >
          {initials(displayName)}
        </span>
        <div className="hidden min-w-0 xl:block">
          <p className="truncate text-xs font-medium text-cocoa">{displayName}</p>
          {displayName === user.email ? null : (
            <p className="truncate text-[11px] text-mocha">{user.email}</p>
          )}
        </div>
      </div>

      <SignOutButton
        lang={lang}
        label={signOut.label}
        errorLabel={signOut.errorLabel}
        className="inline-flex items-center gap-1.5 rounded-full border border-cocoa/15 px-3 py-1.5 text-xs font-medium text-cocoa transition hover:border-berry/40 hover:bg-berry/5 hover:text-berry disabled:opacity-60"
      />
    </header>
  );
}

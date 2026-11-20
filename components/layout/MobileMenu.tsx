"use client";

import {
  House,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBasket,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ComponentType } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { useCart } from "@/components/cart/CartProvider";
import { authClient } from "@/lib/auth-client";
import type { Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n";

import { CurrencySwitcher } from "./CurrencySwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useMobileMenu } from "./MobileMenuProvider";

const TRIGGER_ID = "mobile-menu-trigger";
const SHEET_ID = "mobile-menu-sheet";

export type MobileMenuLabels = {
  title: string;
  close: string;
  tagline: string;
  home: string;
  shop: string;
  basket: string;
  signIn: string;
  signUp: string;
  signOut: string;
  account: string;
  admin: string;
  preferences: string;
  language: string;
  currency: string;
  error: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  exact?: boolean;
  badge?: number;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** The hamburger in the mobile header. Only one of these is ever on screen. */
export function MobileMenuTrigger({ label }: { label: string }) {
  const { open, openMenu } = useMobileMenu();

  return (
    <button
      id={TRIGGER_ID}
      type="button"
      onClick={openMenu}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={SHEET_ID}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cocoa/25 text-cocoa transition hover:border-cocoa/55 active:scale-95 md:hidden"
    >
      <Menu aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </button>
  );
}

/**
 * Right-hand slide-out for small screens. Holds everything the wide header used
 * to crowd into one row: account, shop links and the language/currency pickers.
 * Stays mounted (inert while closed) so it can animate both ways.
 */
export function MobileMenuSheet({
  lang,
  labels,
  currency,
}: {
  lang: Locale;
  labels: MobileMenuLabels;
  currency: Currency;
}) {
  const { open, closeMenu } = useMobileMenu();
  const pathname = usePathname() ?? `/${lang}`;
  const { data: session } = authClient.useSession();
  const { count, hydrated } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Lock the page behind the sheet, close on Escape and keep Tab inside it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeMenu]);

  // Move focus into the sheet on open and back to the trigger on close.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus({ preventScroll: true });
      return;
    }

    if (wasOpen.current) {
      wasOpen.current = false;
      document.getElementById(TRIGGER_ID)?.focus({ preventScroll: true });
    }
  }, [open]);

  const navItems: NavItem[] = [
    { href: `/${lang}`, label: labels.home, icon: House, exact: true },
    { href: `/${lang}/shop`, label: labels.shop, icon: Package },
    {
      href: `/${lang}/cart`,
      label: labels.basket,
      icon: ShoppingBasket,
      badge: hydrated && count > 0 ? count : 0,
    },
  ];

  if (session?.user.role === "admin") {
    navItems.push({ href: `/${lang}/admin`, label: labels.admin, icon: LayoutDashboard });
  }

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`}
    >
      <button
        type="button"
        aria-label={labels.close}
        onClick={closeMenu}
        className={`absolute inset-0 h-full w-full cursor-default bg-cocoa/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        id={SHEET_ID}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        className={`absolute inset-y-0 right-0 flex w-[min(85vw,21rem)] flex-col bg-cream shadow-[-24px_0_60px_-30px_rgba(59,42,32,0.65)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-cocoa/10 px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-4">
          <div className="min-w-0">
            <p className="font-serif text-lg leading-none">Lilyy Bakers</p>
            <p className="mt-1 truncate text-[10px] tracking-[0.3em] text-mocha uppercase">
              {labels.tagline}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeMenu}
            aria-label={labels.close}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cocoa/20 text-mocha transition hover:bg-crust hover:text-cocoa active:scale-95"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <h2 id="mobile-menu-title" className="sr-only">
            {labels.title}
          </h2>

          <nav aria-label={labels.title}>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href, item.exact);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition active:scale-[0.99] ${
                        active ? "bg-cocoa text-cream" : "text-cocoa hover:bg-crust"
                      }`}
                    >
                      <Icon
                        aria-hidden
                        className="h-[1.15rem] w-[1.15rem]"
                        strokeWidth={active ? 2.1 : 1.7}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          aria-hidden
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] leading-none font-semibold text-cocoa"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-5 rounded-2xl border border-cocoa/10 bg-white p-4">
            <p className="text-[10px] tracking-[0.25em] text-mocha uppercase">{labels.account}</p>

            {session?.user ? (
              <>
                <p className="mt-2 truncate text-sm font-medium text-cocoa">
                  {session.user.name || session.user.email}
                </p>
                {session.user.name ? (
                  <p className="truncate text-xs text-mocha">{session.user.email}</p>
                ) : null}
                <SignOutButton
                  lang={lang}
                  label={labels.signOut}
                  errorLabel={labels.error}
                  className="btn btn-outline mt-3 w-full disabled:opacity-60"
                  onSignedOut={closeMenu}
                />
              </>
            ) : (
              <div className="mt-2 space-y-2">
                <Link
                  href={`/${lang}/auth/sign-in`}
                  onClick={closeMenu}
                  className="btn btn-primary w-full"
                >
                  {labels.signIn}
                </Link>
                <Link
                  href={`/${lang}/auth/sign-up`}
                  onClick={closeMenu}
                  className="btn btn-outline w-full"
                >
                  {labels.signUp}
                </Link>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-cocoa/10 bg-white p-4">
            <p className="text-[10px] tracking-[0.25em] text-mocha uppercase">
              {labels.preferences}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-cocoa">{labels.language}</span>
              <LanguageSwitcher locale={lang} label={labels.language} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-cocoa">{labels.currency}</span>
              <CurrencySwitcher currency={currency} label={labels.currency} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogIn,
  ReceiptText,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { authClient } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Shared row shape for the account dropdown. */
const itemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-cocoa transition hover:bg-crust disabled:opacity-60";

/** Up to two initials from the display name, falling back to the email. */
function initials(user: { name?: string | null; email: string }) {
  const source = user.name?.trim() || user.email;
  const letters = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (letters || source.slice(0, 1)).toUpperCase();
}

/**
 * Desktop account cluster: one compact trigger that opens a dropdown holding
 * the profile name, the admin shortcut and the sign-in/sign-out controls.
 * Keeping those rows inside the menu is what keeps the cocoa bar uncluttered.
 *
 * Below `md` the same links live in the mobile drawer, so this component is
 * only rendered from `md` up.
 */
export function HeaderAuth({
  lang,
  nav,
  auth,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  auth: Dictionary["auth"];
}) {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on an outside press or Escape, and hand focus back to the trigger so
  // keyboard users are not dropped at the top of the document.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (isPending) {
    return <span aria-hidden className="h-9 w-9 animate-pulse rounded-full bg-cream/20" />;
  }

  const user = session?.user;
  const displayName = user ? user.name?.trim() || user.email : "";
  const isAdmin = user?.role === "admin";

  function close() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={user ? `${nav.account}: ${displayName}` : nav.account}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-cream/30 pr-2.5 text-sm text-cream transition hover:border-cream/70",
          user ? "pl-1.5" : "pl-3",
          open && "border-cream/70 bg-cream/10",
        )}
      >
        {user ? (
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-semibold uppercase text-cocoa"
          >
            {initials(user)}
          </span>
        ) : (
          <UserRound aria-hidden className="h-4 w-4" />
        )}
        {user ? null : <span>{nav.account}</span>}
        <ChevronDown
          aria-hidden
          className={cn("h-4 w-4 text-cream/70 transition", open && "rotate-180 text-cream")}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-cocoa/10 bg-white p-1.5 text-cocoa shadow-[0_24px_48px_-24px_rgba(59,42,32,0.55)]"
        >
          {user ? (
            <>
              <div className="border-b border-cocoa/10 px-3 pb-2.5 pt-2">
                <p className="truncate text-sm font-medium">{displayName}</p>
                {user.name?.trim() ? (
                  <p className="mt-0.5 truncate text-xs text-mocha">{user.email}</p>
                ) : null}
              </div>

              <div className="pt-1.5">
                <Link href={`/${lang}/account`} onClick={close} className={itemClass}>
                  <UserRound aria-hidden className="h-4 w-4 text-mocha" />
                  {nav.profile}
                </Link>
                <Link href={`/${lang}/account/orders`} onClick={close} className={itemClass}>
                  <ReceiptText aria-hidden className="h-4 w-4 text-mocha" />
                  {nav.orders}
                </Link>
                <Link href={`/${lang}/account/payments`} onClick={close} className={itemClass}>
                  <CreditCard aria-hidden className="h-4 w-4 text-mocha" />
                  {nav.payments}
                </Link>

                <div className="my-1 h-px bg-cocoa/10" />

                {isAdmin ? (
                  <Link href={`/${lang}/admin`} onClick={close} className={itemClass}>
                    <LayoutDashboard aria-hidden className="h-4 w-4 text-mocha" />
                    {nav.admin}
                  </Link>
                ) : null}

                <SignOutButton
                  lang={lang}
                  label={nav.signOut}
                  errorLabel={auth.genericError}
                  className={itemClass}
                  onSignedOut={close}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <Link
                href={`/${lang}/auth/sign-in`}
                onClick={close}
                className={cn(itemClass, "bg-cocoa text-cream hover:bg-mocha")}
              >
                <LogIn aria-hidden className="h-4 w-4" />
                {nav.signIn}
              </Link>
              <Link href={`/${lang}/auth/sign-up`} onClick={close} className={itemClass}>
                <UserPlus aria-hidden className="h-4 w-4 text-mocha" />
                {nav.signUp}
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

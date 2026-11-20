"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { authClient } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

/**
 * Desktop account cluster. Below `md` the same links live in the mobile drawer,
 * so this component is only rendered from `md` up.
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

  if (isPending) {
    return <span aria-hidden className="h-9 w-24 animate-pulse rounded-full bg-crust" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/${lang}/auth/sign-in`} className="btn btn-outline">
          {nav.signIn}
        </Link>
        <Link href={`/${lang}/auth/sign-up`} className="btn btn-primary">
          {nav.signUp}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[12rem] truncate text-sm text-mocha lg:inline">
        {session.user.name || session.user.email}
      </span>
      {session.user.role === "admin" ? (
        <Link
          href={`/${lang}/admin`}
          className="text-sm text-mocha underline-offset-4 transition hover:text-cocoa hover:underline"
        >
          {nav.admin}
        </Link>
      ) : null}
      <SignOutButton lang={lang} label={nav.signOut} errorLabel={auth.genericError} />
    </div>
  );
}

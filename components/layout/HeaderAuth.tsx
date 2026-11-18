"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function HeaderAuth({
  lang,
  nav,
  auth,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  auth: Dictionary["auth"];
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    startTransition(async () => {
      const { error: signOutError } = await authClient.signOut();

      if (signOutError) {
        setError(auth.genericError);
        return;
      }

      setError(null);
      router.push(`/${lang}`);
      router.refresh();
    });
  }

  if (isPending) {
    return <span aria-hidden className="h-9 w-24 animate-pulse rounded-full bg-crust" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/${lang}/auth/sign-in`} className="btn btn-outline hidden sm:inline-flex">
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
      <span className="hidden max-w-[12rem] truncate text-sm text-mocha sm:inline">
        {session.user.name || session.user.email}
      </span>
      {session.user.role === "admin" ? (
        <Link
          href={`/${lang}/admin/products`}
          className="hidden text-sm text-mocha underline-offset-4 transition hover:text-cocoa hover:underline sm:inline"
        >
          {nav.admin}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="btn btn-outline disabled:opacity-60"
      >
        {nav.signOut}
      </button>
      {error ? <span className="text-xs text-berry">{error}</span> : null}
    </div>
  );
}

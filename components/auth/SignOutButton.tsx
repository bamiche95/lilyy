"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/i18n";

/**
 * The one sign-out control, shared by the desktop header and the mobile drawer
 * so both surfaces clear the session and land on the same page.
 */
export function SignOutButton({
  lang,
  label,
  errorLabel,
  className,
  onSignedOut,
}: {
  lang: Locale;
  label: string;
  errorLabel: string;
  className?: string;
  onSignedOut?: () => void;
}) {
  const router = useRouter();
  const [isSigningOut, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    startTransition(async () => {
      const { error: signOutError } = await authClient.signOut();

      if (signOutError) {
        setError(errorLabel);
        return;
      }

      setError(null);
      onSignedOut?.();
      router.push(`/${lang}`);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-busy={isSigningOut}
        className={className ?? "btn btn-outline disabled:opacity-60"}
      >
        {label}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-berry">
          {error}
        </span>
      ) : null}
    </>
  );
}

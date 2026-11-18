"use client";

import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function OAuthButtons({
  label,
  callbackURL,
}: {
  label: string;
  callbackURL: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function signInWithGoogle() {
    setError(null);

    startTransition(async () => {
      const { error: socialError } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (socialError) {
        setError(socialError.message ?? "Google sign-in is unavailable right now.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="btn btn-outline w-full disabled:opacity-60"
      >
        <GoogleMark />
        {label}
      </button>
      {error ? <p className="mt-2 text-sm text-berry">{error}</p> : null}
    </div>
  );
}

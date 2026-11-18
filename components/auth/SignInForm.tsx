"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function SignInForm({
  lang,
  dict,
  redirectTo,
}: {
  lang: Locale;
  dict: Dictionary["auth"];
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const { error: signInError } = await authClient.signIn.email({ email, password });

      if (signInError) {
        setError(
          signInError.status === 401
            ? dict.invalidCredentials
            : (signInError.message ?? dict.genericError),
        );
        return;
      }

      router.push(redirectTo || `/${lang}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="sign-in-email">
          {dict.email}
        </label>
        <input
          id="sign-in-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
          aria-invalid={Boolean(error) || undefined}
        />
      </div>

      <div>
        <label className="label" htmlFor="sign-in-password">
          {dict.password}
        </label>
        <input
          id="sign-in-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
          aria-invalid={Boolean(error) || undefined}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-berry/10 px-3 py-2 text-sm text-berry">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn btn-primary w-full disabled:opacity-60">
        {isPending ? dict.submitSignIn + "…" : dict.submitSignIn}
      </button>
    </form>
  );
}

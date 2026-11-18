"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function SignUpForm({ lang, dict }: { lang: Locale; dict: Dictionary["auth"] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(dict.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(dict.passwordMismatch);
      return;
    }

    startTransition(async () => {
      const { error: signUpError } = await authClient.signUp.email({ name, email, password });

      if (signUpError) {
        const duplicate = signUpError.status === 422 || /exist/i.test(signUpError.message ?? "");
        setError(duplicate ? dict.emailTaken : (signUpError.message ?? dict.genericError));
        return;
      }

      router.push(`/${lang}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="sign-up-name">
          {dict.name}
        </label>
        <input
          id="sign-up-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="sign-up-email">
          {dict.email}
        </label>
        <input
          id="sign-up-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="sign-up-password">
          {dict.password}
        </label>
        <input
          id="sign-up-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="sign-up-confirm">
          {dict.confirmPassword}
        </label>
        <input
          id="sign-up-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="field"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-berry/10 px-3 py-2 text-sm text-berry">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn btn-primary w-full disabled:opacity-60">
        {isPending ? dict.submitSignUp + "…" : dict.submitSignUp}
      </button>
    </form>
  );
}

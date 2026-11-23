"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { updateProfile, type ProfileActionState } from "@/lib/actions/account";
import { authClient } from "@/lib/auth-client";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

type Labels = Dictionary["account"];

const initialState: ProfileActionState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-berry">{message}</p>;
}

/**
 * Name and phone only: the email is the sign-in identity and stays read-only
 * here. A successful save refreshes the route so the header trigger picks up
 * the new name straight away.
 */
export function ProfileForm({
  lang,
  labels,
  values,
}: {
  lang: Locale;
  labels: Labels;
  values: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.ok) return;

    // The header trigger prints the name from the client session store, so nudge
    // it the same way Better Auth does after its own `/update-user` call.
    authClient.$store.notify("$sessionSignal");
    router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="card mt-5 max-w-2xl p-5 sm:p-6">
      <input type="hidden" name="lang" value={lang} />

      {state.ok ? (
        <p
          role="status"
          className="rounded-lg border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage"
        >
          {labels.saved}
        </p>
      ) : null}

      {!state.ok && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-berry/40 bg-berry/5 px-4 py-3 text-sm text-berry"
        >
          {state.message === "invalid" ? labels.invalid : labels.saveError}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="account-name" className="label">
            {labels.name}
          </label>
          <input
            id="account-name"
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            defaultValue={values.name}
            aria-invalid={errors.name ? true : undefined}
            className="field"
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label htmlFor="account-email" className="label">
            {labels.email}
          </label>
          <input
            id="account-email"
            type="email"
            value={values.email}
            readOnly
            aria-describedby="account-email-hint"
            className="field bg-crust/60 text-mocha"
          />
          <p id="account-email-hint" className="mt-1 text-xs text-mocha">
            {labels.emailHint}
          </p>
        </div>

        <div>
          <label htmlFor="account-phone" className="label">
            {labels.phone}
          </label>
          <input
            id="account-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            defaultValue={values.phone}
            aria-describedby="account-phone-hint"
            aria-invalid={errors.phone ? true : undefined}
            className="field"
          />
          <p id="account-phone-hint" className="mt-1 text-xs text-mocha">
            {labels.phoneHint}
          </p>
          <FieldError message={errors.phone} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary mt-5 disabled:opacity-60">
        {pending ? labels.saving : labels.save}
      </button>
    </form>
  );
}

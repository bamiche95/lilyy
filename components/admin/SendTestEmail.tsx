"use client";

import { useActionState } from "react";

import { sendTemplateTest, type SendTestEmailState } from "@/lib/actions/email";
import type { Dictionary } from "@/lib/dictionaries";

const INITIAL_STATE: SendTestEmailState = { ok: false };

/**
 * The recipient is always the signed-in admin — the action refuses anything
 * else, so this form only needs to say which template and language to render.
 */
export function SendTestEmail({
  templateKey,
  locale,
  email,
  labels,
}: {
  templateKey: string;
  locale: string;
  email: string;
  labels: Dictionary["adminEmail"];
}) {
  const [state, formAction, pending] = useActionState(sendTemplateTest, INITIAL_STATE);

  const problem =
    state.ok || !state.message
      ? null
      : state.message === "failed"
        ? labels.failed
        : state.message === "forbidden"
          ? labels.forbidden
          : labels.notFound;

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="key" value={templateKey} />
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
        {pending ? labels.sending : labels.sendTest}
      </button>
      <p className="mt-2 text-xs text-mocha">{email}</p>

      {state.ok ? (
        <p role="status" className="mt-3 text-sm font-medium text-emerald-700">
          {labels.sentMessage}
        </p>
      ) : null}

      {problem ? (
        <p role="alert" className="mt-3 text-sm font-medium text-berry">
          {problem}
        </p>
      ) : null}
    </form>
  );
}
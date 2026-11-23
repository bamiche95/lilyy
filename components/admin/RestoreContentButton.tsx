"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { restoreContentDefaults, type ContentActionState } from "@/lib/actions/content";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

const initialState: ContentActionState = { ok: false };

/**
 * "Back to the built-in site" — clears every override in one go. Kept in its
 * own form because HTML does not allow a form inside the content form.
 */
export function RestoreContentButton({
  lang,
  labels,
}: {
  lang: Locale;
  labels: Dictionary["adminContent"];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(restoreContentDefaults, initialState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(labels.confirmRestore)) event.preventDefault();
      }}
      className="mt-10 max-w-4xl border-t border-cocoa/10 pt-6"
    >
      <input type="hidden" name="lang" value={lang} />

      <p className="text-sm font-semibold">{labels.restoreTitle}</p>
      <p className="mt-1 max-w-xl text-xs text-mocha">{labels.restoreHint}</p>

      <button type="submit" disabled={pending} className="btn btn-outline mt-3 disabled:opacity-60">
        {pending ? labels.restoring : labels.restore}
      </button>

      {state.ok ? (
        <p role="status" className="mt-3 text-sm text-sage">
          {labels.restored}
        </p>
      ) : null}

      {!state.ok && state.message ? (
        <p role="alert" className="mt-3 text-sm text-berry">
          {labels.error}
        </p>
      ) : null}
    </form>
  );
}

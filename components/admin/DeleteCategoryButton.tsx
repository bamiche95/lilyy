"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { deleteCategory, type CategoryActionState } from "@/lib/actions/categories";
import type { Dictionary } from "@/lib/dictionaries";

type Labels = Dictionary["adminCategories"];

const initialState: CategoryActionState = { ok: false };

/**
 * Deleting a category is guarded twice: this confirmation, and the action's
 * product count / `Restrict` foreign key. A category that still has products
 * comes back with `inUse` and how many are holding it back.
 */
export function DeleteCategoryButton({
  categoryId,
  lang,
  labels,
  redirectTo,
}: {
  categoryId: string;
  lang: "en" | "no";
  labels: Labels;
  /** Send the browser back to the list after a successful delete. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(deleteCategory, initialState);

  useEffect(() => {
    if (!state.ok) return;

    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }

    router.refresh();
  }, [state, redirectTo, router]);

  const error =
    !state.ok && state.message
      ? state.message === "inUse"
        ? `${labels.inUse} (${state.productCount ?? 0})`
        : state.message === "notFound"
          ? labels.notFound
          : state.message === "invalid"
            ? labels.invalid
            : labels.error
      : null;

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(labels.confirmDelete)) event.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      <input type="hidden" name="id" value={categoryId} />
      <input type="hidden" name="lang" value={lang} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-berry/40 px-3 py-1 text-xs text-berry transition hover:bg-berry/5 disabled:opacity-50"
      >
        {pending ? labels.deleting : labels.delete}
      </button>
      {state.ok ? (
        <p role="status" className="text-xs text-sage">
          {labels.deleted}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="max-w-56 text-xs text-berry">
          {error}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { saveCategory, type CategoryActionState } from "@/lib/actions/categories";
import type { Dictionary } from "@/lib/dictionaries";
import { CategoryPhoto } from "./CategoryPhoto";

export type CategoryFormValues = {
  id: string;
  slug: string;
  nameEn: string;
  nameNo: string;
  image: string | null;
  sortOrder: string;
};

type Labels = Dictionary["adminCategories"];

const initialState: CategoryActionState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-berry">{message}</p>;
}

export function CategoryForm({
  lang,
  labels,
  values,
  uploadEnabled,
}: {
  lang: "en" | "no";
  labels: Labels;
  values?: CategoryFormValues;
  uploadEnabled: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveCategory, initialState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.ok) return;

    if (!values && state.categoryId) {
      router.replace(`/${lang}/admin/categories/${state.categoryId}`);
      return;
    }

    router.refresh();
  }, [state, values, lang, router]);

  return (
    <form action={formAction} className="mt-8 max-w-2xl space-y-6">
      <input type="hidden" name="lang" value={lang} />
      {values ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.ok ? (
        <p
          role="status"
          className="rounded-lg border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage"
        >
          {state.message === "created" ? labels.created : labels.saved}
        </p>
      ) : null}

      {!state.ok && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-berry/40 bg-berry/5 px-4 py-3 text-sm text-berry"
        >
          {state.message === "notFound" ? labels.notFound : labels.invalid}
        </p>
      ) : null}

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold">{labels.title}</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nameEn" className="label">
              {labels.nameEn}
            </label>
            <input
              id="nameEn"
              name="nameEn"
              required
              defaultValue={values?.nameEn ?? ""}
              aria-invalid={errors.nameEn ? true : undefined}
              className="field"
            />
            <FieldError message={errors.nameEn} />
          </div>
          <div>
            <label htmlFor="nameNo" className="label">
              {labels.nameNo}
            </label>
            <input
              id="nameNo"
              name="nameNo"
              required
              defaultValue={values?.nameNo ?? ""}
              aria-invalid={errors.nameNo ? true : undefined}
              className="field"
            />
            <FieldError message={errors.nameNo} />
          </div>
          <div>
            <label htmlFor="slug" className="label">
              {labels.slug}
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={values?.slug ?? ""}
              aria-describedby="slug-hint"
              aria-invalid={errors.slug ? true : undefined}
              className="field"
            />
            <p id="slug-hint" className="mt-1 text-xs text-mocha">
              {labels.slugHint}
            </p>
            <FieldError message={errors.slug} />
          </div>
          <div>
            <label htmlFor="sortOrder" className="label">
              {labels.sortOrder}
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min="0"
              defaultValue={values?.sortOrder ?? "0"}
              aria-invalid={errors.sortOrder ? true : undefined}
              className="field"
            />
            <FieldError message={errors.sortOrder} />
          </div>
        </div>
      </fieldset>

      <CategoryPhoto
        slug={values?.slug ?? ""}
        initialImage={values?.image ?? null}
        labels={labels}
        uploadEnabled={uploadEnabled}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? labels.saving : values ? labels.save : labels.create}
        </button>
        <Link href={`/${lang}/admin/categories`} className="btn btn-outline">
          {labels.backToCategories}
        </Link>
      </div>
    </form>
  );
}

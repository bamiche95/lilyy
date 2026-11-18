"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { saveProduct, type ProductActionState } from "@/lib/actions/products";
import type { Dictionary } from "@/lib/dictionaries";
import { PRODUCT_CATEGORIES } from "@/lib/shop";

export type ProductFormValues = {
  id: string;
  slug: string;
  nameEn: string;
  nameNo: string;
  descriptionEn: string;
  descriptionNo: string;
  ingredientsEn: string | null;
  ingredientsNo: string | null;
  allergensEn: string[];
  allergensNo: string[];
  price: string;
  compareAtPrice: string | null;
  category: string;
  weightGrams: string | null;
  serves: string | null;
  leadTimeHours: string;
  stock: string;
  sortOrder: string;
  isFeatured: boolean;
  isAvailable: boolean;
};

type Labels = Dictionary["adminProducts"];

const initialState: ProductActionState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-berry">{message}</p>;
}

function TextField({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  required = false,
  step,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  error?: string;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="field"
      />
      <FieldError message={error} />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  error,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  error?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="field resize-y"
      />
      <FieldError message={error} />
    </div>
  );
}

export function ProductForm({
  lang,
  labels,
  categories,
  values,
}: {
  lang: "en" | "no";
  labels: Labels;
  categories: Dictionary["categories"];
  values?: ProductFormValues;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveProduct, initialState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.ok) return;

    if (!values && state.productId) {
      router.replace(`/${lang}/admin/products/${state.productId}`);
      return;
    }

    router.refresh();
  }, [state, values, lang, router]);

  return (
    <form action={formAction} className="mt-8 space-y-8">
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

      {!state.ok && state.message === "error" ? (
        <p role="alert" className="rounded-lg border border-berry/40 bg-berry/5 px-4 py-3 text-sm text-berry">
          {labels.invalid}
        </p>
      ) : null}

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold">{labels.title}</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label={labels.nameEn}
            name="nameEn"
            required
            defaultValue={values?.nameEn}
            error={errors.nameEn}
          />
          <TextField
            label={labels.nameNo}
            name="nameNo"
            required
            defaultValue={values?.nameNo}
            error={errors.nameNo}
          />
          <TextField label={labels.slug} name="slug" defaultValue={values?.slug} error={errors.slug} />
          <div>
            <label htmlFor="category" className="label">
              {labels.category}
            </label>
            <select
              id="category"
              name="category"
              defaultValue={values?.category ?? "BREAD"}
              className="field"
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categories[category]}
                </option>
              ))}
            </select>
            <FieldError message={errors.category} />
          </div>
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold">{labels.descriptionEn}</legend>
        <div className="mt-4 grid gap-4">
          <TextArea
            label={labels.descriptionEn}
            name="descriptionEn"
            defaultValue={values?.descriptionEn}
            error={errors.descriptionEn}
          />
          <TextArea
            label={labels.descriptionNo}
            name="descriptionNo"
            defaultValue={values?.descriptionNo}
            error={errors.descriptionNo}
          />
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold">{labels.ingredientsEn}</legend>
        <div className="mt-4 grid gap-4">
          <TextArea
            label={labels.ingredientsEn}
            name="ingredientsEn"
            defaultValue={values?.ingredientsEn}
            error={errors.ingredientsEn}
          />
          <TextArea
            label={labels.ingredientsNo}
            name="ingredientsNo"
            defaultValue={values?.ingredientsNo}
            error={errors.ingredientsNo}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={labels.allergensEn}
              name="allergensEn"
              defaultValue={values?.allergensEn.join(", ")}
              error={errors.allergensEn}
            />
            <TextField
              label={labels.allergensNo}
              name="allergensNo"
              defaultValue={values?.allergensNo.join(", ")}
              error={errors.allergensNo}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold">{labels.price}</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            label={labels.price}
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={values?.price}
            error={errors.price}
          />
          <TextField
            label={labels.compareAtPrice}
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={values?.compareAtPrice}
            error={errors.compareAtPrice}
          />
          <TextField
            label={labels.weightGrams}
            name="weightGrams"
            type="number"
            min="0"
            defaultValue={values?.weightGrams}
            error={errors.weightGrams}
          />
          <TextField
            label={labels.serves}
            name="serves"
            type="number"
            min="0"
            defaultValue={values?.serves}
            error={errors.serves}
          />
          <TextField
            label={labels.leadTimeHours}
            name="leadTimeHours"
            type="number"
            min="0"
            defaultValue={values?.leadTimeHours ?? "24"}
            error={errors.leadTimeHours}
          />
          <TextField
            label={labels.stock}
            name="stock"
            type="number"
            min="0"
            defaultValue={values?.stock ?? "0"}
            error={errors.stock}
          />
          <TextField
            label={labels.sortOrder}
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={values?.sortOrder ?? "0"}
            error={errors.sortOrder}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-cocoa/10 pt-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={values?.isFeatured ?? false}
              className="h-4 w-4 accent-cocoa"
            />
            {labels.isFeatured}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isAvailable"
              defaultChecked={values?.isAvailable ?? true}
              className="h-4 w-4 accent-cocoa"
            />
            {labels.isAvailable}
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? labels.saving : values ? labels.save : labels.create}
        </button>
        <Link href={`/${lang}/admin/products`} className="btn btn-outline">
          {labels.backToProducts}
        </Link>
        {!state.ok && state.message === "invalid" ? (
          <p className="text-sm text-berry">{labels.invalid}</p>
        ) : null}
      </div>
    </form>
  );
}


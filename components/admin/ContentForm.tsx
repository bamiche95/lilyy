"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { saveContent, type ContentActionState } from "@/lib/actions/content";
import {
  CONTENT_GROUPS,
  SHARED_LOCALE,
  contentFieldId,
  contentFieldsIn,
  contentInputName,
  type ContentField,
  type ContentKey,
  type ContentLocale,
} from "@/lib/content-fields";
import type { Dictionary } from "@/lib/dictionaries";
import { LOCALES, type Locale } from "@/lib/i18n";

import { ImageField } from "./ImageField";

type Labels = Dictionary["adminContent"];

const initialState: ContentActionState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-berry">{message}</p>;
}

function localeLabel(labels: Labels, locale: ContentLocale): string | null {
  if (locale === "en") return labels.english;
  if (locale === "no") return labels.norwegian;
  return null;
}

/**
 * One text field with its "customised" badge and a button that restores the
 * built-in copy. Values are controlled so that button can rewrite the input;
 * the form itself still submits through `FormData`.
 */
function TextInput({
  field,
  locale,
  label,
  hint,
  labels,
  values,
  defaults,
  stored,
  error,
}: {
  field: ContentField;
  locale: ContentLocale;
  label: string;
  hint?: string;
  labels: Labels;
  values: Record<string, string>;
  defaults: Record<string, string>;
  stored: string[];
  error?: string;
}) {
  const id = contentFieldId(locale, field.key as ContentKey);
  const inputId = `content-${id}`;
  const fallback = defaults[id] ?? "";
  const [value, setValue] = useState(values[id] ?? fallback);
  const isStored = stored.includes(id);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="label">
          {label}
        </label>
        <span className="flex items-center gap-2 text-[11px] text-mocha">
          {isStored ? (
            <span className="rounded-full bg-crust px-2 py-0.5">{labels.customised}</span>
          ) : null}
          {value !== fallback ? (
            <button
              type="button"
              onClick={() => setValue(fallback)}
              className="underline-offset-2 hover:underline"
            >
              {labels.useDefault}
            </button>
          ) : null}
        </span>
      </div>
      {field.type === "textarea" ? (
        <textarea
          id={inputId}
          name={contentInputName(locale, field.key as ContentKey)}
          rows={3}
          maxLength={field.maxLength}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          className="field"
        />
      ) : (
        <input
          id={inputId}
          name={contentInputName(locale, field.key as ContentKey)}
          type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
          maxLength={field.maxLength}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          className="field"
        />
      )}
      {hint ? <p className="mt-1 text-xs text-mocha">{hint}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

/**
 * The whole public-site content editor: one fieldset per group, side-by-side
 * language columns for localised copy, and a photo picker per image field.
 */
export function ContentForm({
  lang,
  labels,
  values,
  defaults,
  stored,
  uploadEnabled,
}: {
  lang: Locale;
  labels: Labels;
  values: Record<string, string>;
  defaults: Record<string, string>;
  stored: string[];
  uploadEnabled: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveContent, initialState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="mt-8 max-w-4xl space-y-6">
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
          {state.message === "error" ? labels.error : labels.invalid}
        </p>
      ) : null}

      {CONTENT_GROUPS.map((group) => (
        <fieldset key={group.id} className="card p-5">
          <legend className="px-1 text-sm font-semibold">{group.label[lang]}</legend>

          <div className="mt-4 space-y-5">
            {contentFieldsIn(group.id).map((field) => {
              const hint = field.hint?.[lang];

              if (field.type === "image") {
                const locale = SHARED_LOCALE;
                const id = contentFieldId(locale, field.key as ContentKey);
                const name = contentInputName(locale, field.key as ContentKey);

                return (
                  <div key={field.key}>
                    <ImageField
                      name={name}
                      kind="content"
                      slug={field.key}
                      initialImage={values[id] || null}
                      uploadEnabled={uploadEnabled}
                      idPrefix={`content-${field.key}`}
                      labels={{
                        photo: field.label[lang],
                        photoHint: hint ?? "",
                        upload: labels.upload,
                        uploading: labels.uploading,
                        uploadFailed: labels.uploadFailed,
                        uploadUnavailable: labels.uploadUnavailable,
                        imageUrlLabel: labels.imageUrlLabel,
                        addImage: labels.addImage,
                        removeImage: labels.removeImage,
                        noPhoto: labels.noPhoto,
                      }}
                    />
                    <FieldError message={errors[name]} />
                  </div>
                );
              }

              if (!field.localized) {
                return (
                  <TextInput
                    key={field.key}
                    field={field}
                    locale={SHARED_LOCALE}
                    label={field.label[lang]}
                    hint={hint}
                    labels={labels}
                    values={values}
                    defaults={defaults}
                    stored={stored}
                    error={errors[contentInputName(SHARED_LOCALE, field.key as ContentKey)]}
                  />
                );
              }

              return (
                <div key={field.key}>
                  <p className="text-sm font-medium">{field.label[lang]}</p>
                  {hint ? <p className="mt-1 text-xs text-mocha">{hint}</p> : null}
                  <div className="mt-2 grid gap-4 sm:grid-cols-2">
                    {LOCALES.map((locale) => (
                      <TextInput
                        key={locale}
                        field={field}
                        locale={locale}
                        label={localeLabel(labels, locale) ?? field.label[lang]}
                        labels={labels}
                        values={values}
                        defaults={defaults}
                        stored={stored}
                        error={errors[contentInputName(locale, field.key as ContentKey)]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? labels.saving : labels.save}
        </button>
        <Link href={`/${lang}/admin`} className="btn btn-outline">
          {labels.backToAdmin}
        </Link>
      </div>
    </form>
  );
}

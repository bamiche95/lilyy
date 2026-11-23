"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export type ImageFieldLabels = {
  photo: string;
  photoHint: string;
  upload: string;
  uploading: string;
  uploadFailed: string;
  uploadUnavailable: string;
  imageUrlLabel: string;
  addImage: string;
  removeImage: string;
  noPhoto: string;
};

/**
 * Single photo picker shared by the category form and the content editor.
 * The chosen URL lives in a hidden `name` input and is saved with the rest of
 * the form; the file itself goes straight to R2 through the shared upload
 * endpoint, so it also works before the record exists.
 */
export function ImageField({
  name = "image",
  kind,
  slug = "",
  initialImage,
  labels,
  uploadEnabled,
  idPrefix = "image",
}: {
  name?: string;
  kind: "category" | "content";
  slug?: string;
  initialImage: string | null;
  labels: ImageFieldLabels;
  uploadEnabled: boolean;
  /** Scopes the URL input id so many pickers can share a page. */
  idPrefix?: string;
}) {
  const [image, setImage] = useState<string | null>(initialImage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  /** R2 key hint; an empty slug is fine, the server falls back to the kind. */
  function uploadSlug(): string {
    if (slug.trim()) return slug.trim();

    const form = fileInput.current?.closest("form");
    const field = form?.querySelector<HTMLInputElement>("#slug, #nameEn");

    return field?.value.trim() ?? "";
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);

    try {
      const ticketResponse = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          slug: uploadSlug(),
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!ticketResponse.ok) throw new Error("ticket");

      const ticket = (await ticketResponse.json()) as { uploadUrl: string; publicUrl: string };

      const uploadResponse = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("upload");

      setImage(ticket.publicUrl);
    } catch {
      setError(labels.uploadFailed);
    } finally {
      setBusy(false);

      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addUrl() {
    const url = urlDraft.trim();

    if (!/^https?:\/\//i.test(url)) {
      setError(labels.uploadFailed);
      return;
    }

    setImage(url);
    setUrlDraft("");
    setError(null);
  }

  return (
    <section className="rounded-lg border border-cocoa/10 p-4">
      <input type="hidden" name={name} value={image ?? ""} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{labels.photo}</p>
        <p className="text-xs text-mocha">{labels.photoHint}</p>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-cocoa/10 bg-crust">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              unoptimized
              sizes="12rem"
              className="object-cover"
            />
          ) : (
            <p className="flex h-full items-center justify-center px-4 text-center text-xs text-mocha">
              {labels.noPhoto}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {uploadEnabled ? (
            <>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                  className="btn btn-primary disabled:opacity-60"
                >
                  {busy ? labels.uploading : labels.upload}
                </button>
                {image ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setImage(null)}
                    className="text-xs text-berry underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {labels.removeImage}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-xs text-mocha">{labels.uploadUnavailable}</p>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1">
              <label htmlFor={`${idPrefix}-image-url`} className="label">
                {labels.imageUrlLabel}
              </label>
              <input
                id={`${idPrefix}-image-url`}
                type="url"
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                placeholder="https://…"
                className="field"
              />
            </div>
            <button
              type="button"
              disabled={busy || urlDraft.trim().length === 0}
              onClick={addUrl}
              className="btn btn-outline disabled:opacity-60"
            >
              {labels.addImage}
            </button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-berry">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

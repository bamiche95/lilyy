"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { setProductImages } from "@/lib/actions/products";
import type { Dictionary } from "@/lib/dictionaries";

type Labels = Dictionary["adminProducts"];

const MAX_IMAGES = 8;

export function ProductImages({
  productId,
  slug,
  initialImages,
  labels,
  uploadEnabled,
}: {
  productId: string;
  slug: string;
  initialImages: string[];
  labels: Labels;
  uploadEnabled: boolean;
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function persist(next: string[]) {
    setBusy(true);
    setError(null);

    const result = await setProductImages(productId, next);

    if (!result.ok || !result.images) {
      setError(labels.uploadFailed);
      setBusy(false);
      return false;
    }

    setImages(result.images);
    setBusy(false);
    return true;
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);

    try {
      const ticketResponse = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, contentType: file.type, size: file.size }),
      });

      if (!ticketResponse.ok) throw new Error("ticket");

      const ticket = (await ticketResponse.json()) as { uploadUrl: string; publicUrl: string };

      const uploadResponse = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("upload");

      await persist([...images, ticket.publicUrl]);
    } catch {
      setError(labels.uploadFailed);
      setBusy(false);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addUrl() {
    const url = urlDraft.trim();

    if (!/^https?:\/\//i.test(url) || images.length >= MAX_IMAGES) {
      setError(labels.uploadFailed);
      return;
    }

    void persist([...images, url]).then((ok) => {
      if (ok) setUrlDraft("");
    });
  }

  return (
    <section className="card mt-8 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">{labels.images}</h2>
        <p className="text-xs text-mocha">{labels.imagesHint}</p>
      </div>

      {images.length === 0 ? (
        <p className="mt-4 text-sm text-mocha">{labels.noImages}</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={`${image}-${index}`}
              className="overflow-hidden rounded-lg border border-cocoa/10"
            >
              <div className="relative aspect-[4/3] bg-crust">
                <Image
                  src={image}
                  alt=""
                  fill
                  unoptimized
                  sizes="12rem"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-cocoa/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cream">
                    1
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 p-2 text-xs">
                {index > 0 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void persist([image, ...images.filter((_, i) => i !== index)])}
                    className="underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {labels.makePrimary}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void persist(images.filter((_, i) => i !== index))}
                  className="text-berry underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {labels.removeImage}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-cocoa/10 pt-5">
        {uploadEnabled ? (
          <div className="flex flex-wrap items-center gap-3">
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
            <button
              type="button"
              disabled={busy || images.length >= MAX_IMAGES}
              onClick={() => fileInput.current?.click()}
              className="btn btn-primary disabled:opacity-60"
            >
              {busy ? labels.uploading : labels.upload}
            </button>
          </div>
        ) : (
          <p className="text-xs text-mocha">{labels.uploadUnavailable}</p>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <label htmlFor="image-url" className="label">
              {labels.imageUrlPlaceholder}
            </label>
            <input
              id="image-url"
              type="url"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              placeholder={labels.imageUrlPlaceholder}
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

    </section>
  );
}

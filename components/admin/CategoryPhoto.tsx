"use client";

import type { Dictionary } from "@/lib/dictionaries";

import { ImageField } from "./ImageField";

type Labels = Dictionary["adminCategories"];

/**
 * Single photo picker for a category card. Kept as a thin wrapper so the
 * category form reads like the rest of the admin, while the actual picker is
 * shared with the home page content editor.
 */
export function CategoryPhoto({
  slug = "",
  initialImage,
  labels,
  uploadEnabled,
}: {
  slug?: string;
  initialImage: string | null;
  labels: Labels;
  uploadEnabled: boolean;
}) {
  return (
    <div className="mt-8">
      <ImageField
        name="image"
        kind="category"
        slug={slug}
        initialImage={initialImage}
        uploadEnabled={uploadEnabled}
        idPrefix="category"
        labels={{
          photo: labels.photo,
          photoHint: labels.photoHint,
          upload: labels.upload,
          uploading: labels.uploading,
          uploadFailed: labels.uploadFailed,
          uploadUnavailable: labels.uploadUnavailable,
          imageUrlLabel: labels.imageUrlPlaceholder,
          addImage: labels.addImage,
          removeImage: labels.removeImage,
          noPhoto: labels.noPhoto,
        }}
      />
    </div>
  );
}

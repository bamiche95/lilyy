"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Main photo plus a thumbnail strip; falls back to a monogram when empty. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-crust">
        <span aria-hidden className="font-serif text-4xl text-cocoa/25">
          Lilyy
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-crust">
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 36rem, 92vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={`${image}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${alt} — ${index + 1}`}
                aria-pressed={index === active}
                className={cn(
                  "relative h-16 w-20 overflow-hidden rounded-lg border transition",
                  index === active ? "border-cocoa" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image} alt="" fill sizes="5rem" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

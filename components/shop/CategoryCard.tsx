"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { localised, type Locale } from "@/lib/i18n";
import { shopHref, type ShopCategory } from "@/lib/shop";

/**
 * Home page category tile. A photo uploaded in the admin is shown as-is; a
 * category without one — or with a photo that no longer resolves — still gets a
 * warm, readable card instead of a gap.
 */
export function CategoryCard({ category, lang }: { category: ShopCategory; lang: Locale }) {
  const name = localised(lang, category.nameEn, category.nameNo);
  const [failed, setFailed] = useState(false);
  const photo = category.image && !failed ? category.image : null;

  return (
    <li className="group relative overflow-hidden rounded-2xl bg-cocoa shadow-sm">
      <Link href={shopHref(lang, { category: category.slug })} className="block">
        <div className="relative aspect-[4/5] overflow-hidden">
          {photo ? (
            <Image
              src={photo}
              alt=""
              fill
              sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
              onError={() => setFailed(true)}
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <>
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-crust via-crust to-mocha/70"
              />
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center pb-10 font-serif text-6xl text-cocoa/15"
              >
                {name.slice(0, 1).toUpperCase()}
              </span>
            </>
          )}

          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-cocoa/85 via-cocoa/15 to-transparent"
          />

          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-5">
            <span className="font-serif text-xl text-cream">{name}</span>
            <span
              aria-hidden
              className="text-cream/70 transition duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

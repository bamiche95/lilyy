import Image from "next/image";
import Link from "next/link";

import { formatPrice, type Currency } from "@/lib/currency";
import type { Dictionary } from "@/lib/dictionaries";
import { localised, type Locale } from "@/lib/i18n";
import { productHref } from "@/lib/shop";

import { QuickAddButton } from "./AddToCartButton";

export type ProductCardData = {
  id: string;
  slug: string;
  nameEn: string;
  nameNo: string;
  descriptionEn: string;
  descriptionNo: string;
  price: number;
  images: string[];
  category: keyof Dictionary["categories"];
};

export function ProductCard({
  product,
  lang,
  dict,
  currency,
}: {
  product: ProductCardData;
  lang: Locale;
  dict: Dictionary;
  currency: Currency;
}) {
  const name = localised(lang, product.nameEn, product.nameNo);
  const image = product.images[0] ?? null;

  return (
    <li className="card group flex flex-col overflow-hidden">
      <Link
        href={productHref(lang, product.slug)}
        className="relative block aspect-[4/3] overflow-hidden bg-crust"
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full items-center justify-center font-serif text-3xl text-cocoa/25"
          >
            Lilyy
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{dict.categories[product.category]}</p>
        <h3 className="mt-1 text-lg">
          <Link href={productHref(lang, product.slug)} className="hover:text-mocha">
            {name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-mocha">
          {localised(lang, product.descriptionEn, product.descriptionNo)}
        </p>

        <div className="mt-auto pt-4">
          <p className="text-sm font-semibold">{formatPrice(product.price, currency, lang)}</p>
          <div className="mt-3">
            <QuickAddButton
              label={dict.product.addToCart}
              product={{
                id: product.id,
                slug: product.slug,
                nameEn: product.nameEn,
                nameNo: product.nameNo,
                price: product.price,
                image,
              }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

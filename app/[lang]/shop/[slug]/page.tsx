import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { formatPrice } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localised, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getRequestCurrency } from "@/lib/request";
import { productHref, shopHref } from "@/lib/shop";

type PageProps = { params: Promise<{ lang: string; slug: string }> };

/** Deduped between `generateMetadata` and the page render. */
const getProduct = cache(async (slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameNo: true,
      descriptionEn: true,
      descriptionNo: true,
      ingredientsEn: true,
      ingredientsNo: true,
      allergensEn: true,
      allergensNo: true,
      price: true,
      compareAtPrice: true,
      category: true,
      images: true,
      weightGrams: true,
      serves: true,
      leadTimeHours: true,
      isAvailable: true,
      isFeatured: true,
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;

  if (!isLocale(lang)) return { title: "Lilyy Bakers" };

  const product = await getProduct(slug);

  if (!product) return { title: "Lilyy Bakers" };

  const name = localised(lang, product.nameEn, product.nameNo);
  const description = localised(lang, product.descriptionEn, product.descriptionNo);

  return {
    title: name,
    description,
    alternates: {
      canonical: productHref(lang, product.slug),
      languages: {
        en: `/en/shop/${product.slug}`,
        no: `/no/shop/${product.slug}`,
      },
    },
    openGraph: {
      type: "website",
      title: name,
      description,
      url: productHref(lang, product.slug),
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { lang, slug } = await params;

  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const product = await getProduct(slug);

  if (!product || !product.isAvailable) notFound();

  const [dict, currency] = await Promise.all([getDictionary(locale), getRequestCurrency()]);

  const name = localised(locale, product.nameEn, product.nameNo);
  const description = localised(locale, product.descriptionEn, product.descriptionNo);
  const ingredients = localised(locale, product.ingredientsEn ?? "", product.ingredientsNo ?? "");
  const allergens = locale === "no" ? product.allergensNo : product.allergensEn;
  const price = Number(product.price);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;

  const related = await prisma.product.findMany({
    where: { category: product.category, isAvailable: true, id: { not: product.id } },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: 3,
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameNo: true,
      descriptionEn: true,
      descriptionNo: true,
      price: true,
      images: true,
      category: true,
    },
  });

  const facts = [
    product.weightGrams
      ? { label: dict.product.weight, value: `${product.weightGrams} g` }
      : null,
    product.serves ? { label: dict.product.serves, value: String(product.serves) } : null,
    product.leadTimeHours
      ? {
          label: dict.product.leadTime,
          value: `${product.leadTimeHours} ${
            product.leadTimeHours === 1 ? dict.product.hoursOne : dict.product.hoursMany
          }`,
        }
      : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  return (
    <>
      <div className="border-b border-cocoa/10 bg-crust">
        <div className="container-page py-4 text-sm text-mocha">
          <Link href={shopHref(locale)} className="transition hover:text-cocoa">
            {dict.product.backToShop}
          </Link>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-2 lg:py-16">
        <ProductGallery images={product.images} alt={name} />

        <div>
          <p className="eyebrow">{dict.categories[product.category]}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{name}</h1>
          <p className="mt-4 text-base leading-relaxed text-mocha">{description}</p>

          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatPrice(price, currency, locale)}</span>
            {compareAt && compareAt > price ? (
              <span className="text-sm text-mocha line-through">
                {formatPrice(compareAt, currency, locale)}
              </span>
            ) : null}
          </p>

          <div className="mt-6">
            <AddToCartButton
              labels={dict.product}
              disabled={!product.isAvailable}
              product={{
                id: product.id,
                slug: product.slug,
                nameEn: product.nameEn,
                nameNo: product.nameNo,
                price,
                image: product.images[0] ?? null,
              }}
            />
          </div>

          {facts.length > 0 ? (
            <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-cocoa/10 py-4 text-sm">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs uppercase tracking-wider text-mocha">{fact.label}</dt>
                  <dd className="mt-1 font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {ingredients ? (
            <section className="mt-8">
              <h2 className="text-lg">{dict.product.ingredients}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mocha">{ingredients}</p>
            </section>
          ) : null}

          <section className="mt-6">
            <h2 className="text-lg">{dict.product.allergens}</h2>
            {allergens.length === 0 ? (
              <p className="mt-2 text-sm text-mocha">{dict.product.noAllergens}</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {allergens.map((allergen) => (
                  <li
                    key={allergen}
                    className="rounded-full border border-berry/30 bg-berry/5 px-3 py-1 text-xs text-berry"
                  >
                    {allergen}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="container-page pb-16">
          <h2 className="text-2xl">{dict.product.related}</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={{ ...item, price: Number(item.price) }}
                lang={locale}
                dict={dict}
                currency={currency}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}


import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductCard } from "@/components/shop/ProductCard";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getRequestCurrency } from "@/lib/request";
import {
  SHOP_SORTS,
  SORT_LABEL_KEYS,
  parseShopFilters,
  shopHref,
  type ShopFilters,
} from "@/lib/shop";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function orderByFor(sort: ShopFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { sortOrder: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { sortOrder: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { sortOrder: "asc" }, { nameEn: "asc" }];
  }
}

function whereFor(filters: ShopFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isAvailable: true };

  if (filters.category) where.category = filters.category;

  if (filters.q) {
    where.OR = [
      { nameEn: { contains: filters.q, mode: "insensitive" } },
      { nameNo: { contains: filters.q, mode: "insensitive" } },
      { descriptionEn: { contains: filters.q, mode: "insensitive" } },
      { descriptionNo: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return { title: "Lilyy Bakers" };

  const dict = await getDictionary(lang);

  return {
    title: dict.shop.title,
    description: dict.shop.subtitle,
    alternates: { canonical: `/${lang}/shop`, languages: { en: "/en/shop", no: "/no/shop" } },
    openGraph: { title: dict.shop.title, description: dict.shop.subtitle, url: `/${lang}/shop` },
  };
}


export default async function ShopPage({ params, searchParams }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const filters = parseShopFilters(await searchParams);
  const [dict, currency] = await Promise.all([getDictionary(locale), getRequestCurrency()]);

  const products = await prisma.product.findMany({
    where: whereFor(filters),
    orderBy: orderByFor(filters.sort),
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

  const cards = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    nameEn: product.nameEn,
    nameNo: product.nameNo,
    descriptionEn: product.descriptionEn,
    descriptionNo: product.descriptionNo,
    price: Number(product.price),
    images: product.images,
    category: product.category,
  }));

  const countLabel = cards.length === 1 ? dict.shop.resultsOne : dict.shop.resultsMany;

  return (
    <>
      <section className="border-b border-cocoa/10 bg-crust">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow">{dict.nav.shop}</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">{dict.shop.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-mocha">{dict.shop.subtitle}</p>

          <form
            method="get"
            action={`/${locale}/shop`}
            role="search"
            className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            {filters.category ? (
              <input type="hidden" name="category" value={filters.category} />
            ) : null}
            {filters.sort !== "featured" ? (
              <input type="hidden" name="sort" value={filters.sort} />
            ) : null}
            <label htmlFor="shop-search" className="sr-only">
              {dict.shop.searchLabel}
            </label>
            <input
              id="shop-search"
              type="search"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder={dict.shop.searchPlaceholder}
              className="field"
            />
            <button type="submit" className="btn btn-primary">
              {dict.shop.submitSearch}
            </button>
          </form>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CategoryFilter
            lang={locale}
            dict={dict}
            active={filters.category}
            q={filters.q}
            sort={filters.sort}
          />

          <details className="relative shrink-0">
            <summary className="btn btn-outline cursor-pointer list-none">
              {dict.shop.sortLabel}: {dict.shop[SORT_LABEL_KEYS[filters.sort]]}
            </summary>
            <ul className="card absolute right-0 z-30 mt-2 w-56 p-2 text-sm shadow-lg">
              {SHOP_SORTS.map((sort) => (
                <li key={sort}>
                  <Link
                    href={shopHref(locale, { category: filters.category, q: filters.q, sort })}
                    aria-current={sort === filters.sort ? "true" : undefined}
                    className={
                      sort === filters.sort
                        ? "block rounded-lg bg-crust px-3 py-2 font-semibold"
                        : "block rounded-lg px-3 py-2 text-mocha hover:bg-crust"
                    }
                  >
                    {dict.shop[SORT_LABEL_KEYS[sort]]}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <p className="mt-6 text-sm text-mocha">
          {cards.length} {countLabel}
        </p>

        {cards.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <h2 className="text-xl">{dict.shop.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">{dict.shop.emptyBody}</p>
            <Link href={shopHref(locale)} className="btn btn-primary mt-6">
              {dict.shop.clearFilters}
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={locale}
                dict={dict}
                currency={currency}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

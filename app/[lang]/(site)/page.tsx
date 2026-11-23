import Link from "next/link";
import { notFound } from "next/navigation";

import heroSpread from "@/public/images/hero-bakery-spread-01.jpg";
import heroCounter from "@/public/images/hero-bakery-spread-02.jpg";

import { ContentImage } from "@/components/content/ContentImage";
import { CategoryCard } from "@/components/shop/CategoryCard";
import { getCategories } from "@/lib/categories";
import { getSiteContent } from "@/lib/content";
import { formatPrice } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localised } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getRequestCurrency } from "@/lib/request";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const [dict, currency, categories, featured, content] = await Promise.all([
    getDictionary(lang),
    getRequestCurrency(),
    getCategories(),
    prisma.product.findMany({
      where: { isFeatured: true, isAvailable: true },
      orderBy: { sortOrder: "asc" },
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
        category: { select: { nameEn: true, nameNo: true } },
      },
    }),
    getSiteContent(lang),
  ]);

  return (
    <>
      <section className="border-b border-cocoa/10 bg-crust">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">{content["brand.tagline"]}</p>
            <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">{content["hero.title"]}</h1>
            <p className="mt-5 max-w-xl text-base text-mocha">{content["hero.subtitle"]}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${lang}/shop`} className="btn btn-primary">
                {content["hero.ctaLabel"]}
              </Link>
              <Link href={`/${lang}/auth/sign-up`} className="btn btn-outline">
                {dict.nav.signUp}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cocoa/5 shadow-sm">
              <ContentImage
                src={content["hero.imagePrimary"]}
                fallback={heroSpread}
                priority
                sizes="(min-width: 1024px) 24rem, 45vw"
              />
            </div>
            <div className="relative mt-6 aspect-[4/5] overflow-hidden rounded-2xl bg-cocoa/5 shadow-sm sm:mt-10">
              <ContentImage
                src={content["hero.imageSecondary"]}
                fallback={heroCounter}
                sizes="(min-width: 1024px) 20rem, 45vw"
              />
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section id="categories" className="container-page pt-14 sm:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl">{content["sections.categories.title"]}</h2>
              <p className="mt-2 text-sm text-mocha">{content["sections.categories.subtitle"]}</p>
            </div>
            <Link
              href={`/${lang}/shop`}
              className="text-sm text-mocha underline-offset-4 transition hover:text-cocoa hover:underline"
            >
              {content["hero.ctaLabel"]}
            </Link>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} lang={lang} />
            ))}
          </ul>
        </section>
      ) : null}

      <section id="featured" className="container-page py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">{content["sections.featured.title"]}</h2>
            <p className="mt-2 text-sm text-mocha">{content["sections.featured.subtitle"]}</p>
          </div>
        </div>

        {featured.length === 0 ? (
          <p className="mt-8 text-sm text-mocha">{dict.common.loading}</p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <li key={product.id} className="card flex flex-col p-6">
                <Link
                  href={`/${lang}/shop/${product.slug}`}
                  aria-hidden
                  tabIndex={-1}
                  className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-crust"
                >
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </Link>
                <p className="eyebrow mt-4">
                  {localised(lang, product.category.nameEn, product.category.nameNo)}
                </p>
                <h3 className="mt-1 text-lg">
                  <Link href={`/${lang}/shop/${product.slug}`} className="hover:text-mocha">
                    {localised(lang, product.nameEn, product.nameNo)}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-mocha">
                  {localised(lang, product.descriptionEn, product.descriptionNo)}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="text-sm font-semibold">
                    {formatPrice(product.price, currency, lang)}
                  </p>
                  <Link
                    href={`/${lang}/shop/${product.slug}`}
                    className="text-sm text-mocha underline-offset-4 transition hover:text-cocoa hover:underline"
                  >
                    {dict.shop.view}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-cocoa/10 bg-white">
        <div className="container-page flex flex-col items-start gap-4 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl">{content["sections.signup.title"]}</h2>
            <p className="mt-2 text-sm text-mocha">{content["sections.signup.subtitle"]}</p>
          </div>
          <Link href={`/${lang}/auth/sign-up`} className="btn btn-gold">
            {dict.auth.submitSignUp}
          </Link>
        </div>
      </section>
    </>
  );
}

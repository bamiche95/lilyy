import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityToggle } from "@/components/admin/AvailabilityToggle";
import { formatPrice } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localised } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getRequestCurrency } from "@/lib/request";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminProductsPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const [dict, currency, products] = await Promise.all([
    getDictionary(lang),
    getRequestCurrency(),
    prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameNo: true,
        price: true,
        category: { select: { nameEn: true, nameNo: true } },
        images: true,
        isAvailable: true,
        isFeatured: true,
      },
    }),
  ]);

  const labels = dict.adminProducts;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
          <p className="mt-2 text-sm text-mocha">
            {products.length} {products.length === 1 ? dict.shop.resultsOne : dict.shop.resultsMany}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/${lang}/admin/categories`} className="btn btn-outline">
            {dict.adminCategories.title}
          </Link>
          <Link href={`/${lang}/admin/products/new`} className="btn btn-primary">
            {labels.new}
          </Link>
        </div>
      </div>

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
              <th scope="col" className="p-3 font-medium">
                {labels.nameEn}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.category}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.price}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.isAvailable}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.edit}
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const primaryImage = product.images.find((src) => src.trim().length > 0);

              return (
                <tr key={product.id} className="border-b border-cocoa/5 last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={localised(lang, product.nameEn, product.nameNo)}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg border border-cocoa/10 object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-cocoa/20 text-center text-[10px] leading-tight text-mocha"
                        >
                          {labels.noPhoto}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{localised(lang, product.nameEn, product.nameNo)}</p>
                        <p className="text-xs text-mocha">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-mocha">
                    {localised(lang, product.category.nameEn, product.category.nameNo)}
                  </td>
                  <td className="p-3 font-medium">{formatPrice(product.price, currency, lang)}</td>
                  <td className="p-3">
                    <AvailabilityToggle
                      productId={product.id}
                      isAvailable={product.isAvailable}
                      onLabel={labels.isAvailable}
                      offLabel={labels.archive}
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/${lang}/admin/products/${product.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {labels.edit}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
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
        category: true,
        images: true,
        isAvailable: true,
        isFeatured: true,
      },
    }),
  ]);

  const labels = dict.adminProducts;

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
          <p className="mt-2 text-sm text-mocha">
            {products.length} {products.length === 1 ? dict.shop.resultsOne : dict.shop.resultsMany}
          </p>
        </div>
        <Link href={`/${lang}/admin/products/new`} className="btn btn-primary">
          {labels.new}
        </Link>
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
            {products.map((product) => (
              <tr key={product.id} className="border-b border-cocoa/5 last:border-0">
                <td className="p-3">
                  <p className="font-medium">{localised(lang, product.nameEn, product.nameNo)}</p>
                  <p className="text-xs text-mocha">{product.slug}</p>
                </td>
                <td className="p-3 text-mocha">{dict.categories[product.category]}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

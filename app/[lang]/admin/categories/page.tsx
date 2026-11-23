import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";
import { getCategories } from "@/lib/categories";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localised } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminCategoriesPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const [dict, categories, counts] = await Promise.all([
    getDictionary(lang),
    getCategories(),
    prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  const labels = dict.adminCategories;
  const countById = new Map(counts.map((row) => [row.categoryId, row._count._all]));

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
          <p className="mt-2 text-sm text-mocha">
            {categories.length} {categories.length === 1 ? dict.shop.resultsOne : dict.shop.resultsMany}
          </p>
        </div>
        <Link href={`/${lang}/admin/categories/new`} className="btn btn-primary">
          {labels.new}
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-sm text-mocha">{labels.empty}</p>
          <Link href={`/${lang}/admin/categories/new`} className="btn btn-primary mt-4">
            {labels.new}
          </Link>
        </div>
      ) : (
        <div className="card mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
                <th scope="col" className="p-3 font-medium">
                  {labels.photo}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.nameEn}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.slug}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.sortOrder}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.products}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.edit}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.delete}
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-cocoa/5 last:border-0">
                  <td className="p-3">
                    {category.image ? (
                      <div className="relative size-12 overflow-hidden rounded-md border border-cocoa/10 bg-crust">
                        <Image
                          src={category.image}
                          alt=""
                          fill
                          unoptimized
                          sizes="3rem"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-mocha">{labels.noPhoto}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">
                      {localised(lang, category.nameEn, category.nameNo)}
                    </p>
                  </td>
                  <td className="p-3 text-mocha">{category.slug}</td>
                  <td className="p-3 text-mocha">{category.sortOrder}</td>
                  <td className="p-3 text-mocha">{countById.get(category.id) ?? 0}</td>
                  <td className="p-3">
                    <Link
                      href={`/${lang}/admin/categories/${category.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {labels.edit}
                    </Link>
                  </td>
                  <td className="p-3">
                    <DeleteCategoryButton categoryId={category.id} lang={lang} labels={labels} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

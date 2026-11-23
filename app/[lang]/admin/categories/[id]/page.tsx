import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { shopHref } from "@/lib/shop";

type PageProps = { params: Promise<{ lang: string; id: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditCategoryPage({ params }: PageProps) {
  const { lang, id } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) notFound();

  const dict = await getDictionary(lang);
  const labels = dict.adminCategories;

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{category.nameEn}</h1>
        </div>
        <Link href={shopHref(lang, { category: category.slug })} className="btn btn-outline">
          {labels.viewInShop}
        </Link>
      </div>

      <CategoryForm
        lang={lang}
        labels={labels}
        values={{
          id: category.id,
          slug: category.slug,
          nameEn: category.nameEn,
          nameNo: category.nameNo,
          sortOrder: String(category.sortOrder),
        }}
      />

      <div className="mt-8 border-t border-cocoa/10 pt-6">
        <DeleteCategoryButton
          categoryId={category.id}
          lang={lang}
          labels={labels}
          redirectTo={`/${lang}/admin/categories`}
        />
      </div>
    </section>
  );
}

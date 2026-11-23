import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/CategoryForm";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewCategoryPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const dict = await getDictionary(lang);
  const labels = dict.adminCategories;

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{labels.createTitle}</h1>
        </div>
        <Link href={`/${lang}/admin/categories`} className="btn btn-outline">
          {labels.backToCategories}
        </Link>
      </div>

      <CategoryForm lang={lang} labels={labels} />
    </section>
  );
}

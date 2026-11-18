import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImages } from "@/components/admin/ProductImages";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { isR2Configured } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewProductPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const dict = await getDictionary(lang);
  const labels = dict.adminProducts;

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{labels.createTitle}</h1>
        </div>
        <Link href={`/${lang}/admin/products`} className="btn btn-outline">
          {labels.backToProducts}
        </Link>
      </div>

      <p className="mt-3 max-w-xl text-sm text-mocha">{labels.imagesHint}</p>

      <ProductForm
        lang={lang}
        labels={labels}
        categories={dict.categories}
        imagesSlot={
          <ProductImages
            initialImages={[]}
            labels={labels}
            uploadEnabled={isR2Configured()}
          />
        }
      />
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImages } from "@/components/admin/ProductImages";
import { getCategories } from "@/lib/categories";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";
import { productHref } from "@/lib/shop";

type PageProps = { params: Promise<{ lang: string; id: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: PageProps) {
  const { lang, id } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) notFound();

  const [dict, categories] = await Promise.all([getDictionary(lang), getCategories()]);
  const labels = dict.adminProducts;

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <h1 className="mt-2 text-3xl">{product.nameEn}</h1>
        </div>
        <Link href={productHref(lang, product.slug)} className="btn btn-outline">
          {labels.viewInShop}
        </Link>
      </div>

      <ProductForm
        lang={lang}
        labels={labels}
        categories={categories}
        values={{
          id: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameNo: product.nameNo,
          descriptionEn: product.descriptionEn,
          descriptionNo: product.descriptionNo,
          ingredientsEn: product.ingredientsEn,
          ingredientsNo: product.ingredientsNo,
          allergensEn: product.allergensEn,
          allergensNo: product.allergensNo,
          price: product.price.toString(),
          compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : null,
          categoryId: product.categoryId,
          weightGrams: product.weightGrams === null ? null : String(product.weightGrams),
          serves: product.serves === null ? null : String(product.serves),
          leadTimeHours: String(product.leadTimeHours),
          stock: String(product.stock),
          sortOrder: String(product.sortOrder),
          isFeatured: product.isFeatured,
          isAvailable: product.isAvailable,
        }}
      />

      <ProductImages
        productId={product.id}
        slug={product.slug}
        initialImages={product.images}
        labels={labels}
        uploadEnabled={isR2Configured()}
      />
    </section>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return { title: "Lilyy Bakers" };

  const dict = await getDictionary(lang);

  return {
    title: dict.checkout.title,
    description: dict.checkout.subtitle,
    robots: { index: false },
    alternates: { canonical: `/${lang}/checkout` },
  };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl">{dict.checkout.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-mocha">{dict.checkout.subtitle}</p>
      <CheckoutView labels={dict.checkout} />
    </section>
  );
}

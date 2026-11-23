import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCategories } from "@/lib/categories";
import { getSiteContent } from "@/lib/content";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getRequestCurrency } from "@/lib/request";

type SiteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

/**
 * Storefront chrome. The admin area lives in a sibling route group with its own
 * dashboard shell, so the shop header/footer never frame the admin pages.
 */
export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const [dict, currency, categories, content] = await Promise.all([
    getDictionary(lang),
    getRequestCurrency(),
    getCategories(),
    getSiteContent(lang),
  ]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        {lang === "no" ? "Hopp til innhold" : "Skip to content"}
      </a>

      <SiteHeader
        lang={lang}
        dict={dict}
        currency={currency}
        categories={categories}
        logoSrc={content["brand.logo"] || null}
        brandName={content["brand.name"] || dict.meta.siteName}
      />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <SiteFooter lang={lang} dict={dict} content={content} />
    </>
  );
}

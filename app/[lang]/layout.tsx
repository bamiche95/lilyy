import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { CartProvider } from "@/components/cart/CartProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getCurrencyRates } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { LOCALE_META, isLocale } from "@/lib/i18n";
import { getRequestCurrency } from "@/lib/request";

import "../globals.css";

type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf7ef",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) {
    return { title: "Lilyy Bakers" };
  }

  const dict = await getDictionary(lang);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    applicationName: dict.meta.siteName,
    title: {
      default: `${dict.meta.siteName} — ${dict.meta.tagline}`,
      template: `%s | ${dict.meta.siteName}`,
    },
    description: dict.meta.description,
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: `/${lang}`,
      languages: { en: "/en", no: "/no" },
    },
    openGraph: {
      type: "website",
      siteName: dict.meta.siteName,
      title: `${dict.meta.siteName} — ${dict.meta.tagline}`,
      description: dict.meta.description,
      locale: lang === "no" ? "nb_NO" : "en_GB",
      url: `/${lang}`,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const [dict, currency] = await Promise.all([getDictionary(lang), getRequestCurrency()]);

  return (
    <html lang={LOCALE_META[lang].htmlLang} className="h-full">
      <body className="flex min-h-full flex-col bg-cream text-cocoa antialiased">
        <I18nProvider locale={lang} currency={currency} rates={getCurrencyRates()}>
          <CartProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
            >
              {lang === "no" ? "Hopp til innhold" : "Skip to content"}
            </a>

            <SiteHeader lang={lang} dict={dict} currency={currency} />

            <main id="main-content" className="flex-1">
              {children}
            </main>

            <SiteFooter lang={lang} dict={dict} />
            <ServiceWorkerRegister />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

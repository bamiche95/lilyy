import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { bodyFont, displayFont } from "@/app/fonts";
import { CartProvider } from "@/components/cart/CartProvider";
import { MobileMenuSheet } from "@/components/layout/MobileMenu";
import { MobileMenuProvider } from "@/components/layout/MobileMenuProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { MobileTabBar } from "@/components/pwa/MobileTabBar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getCurrencyRates } from "@/lib/currency";
import { getCategories } from "@/lib/categories";
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
  // Edge-to-edge inside the installed PWA; the tab bar and header pad
  // themselves with env(safe-area-inset-*).
  viewportFit: "cover",
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
    icons: { apple: "/icons/apple-touch-icon.png" },
    appleWebApp: {
      capable: true,
      title: dict.meta.siteName,
      statusBarStyle: "default",
    },
    formatDetection: { telephone: false },
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

  const [dict, currency, categories] = await Promise.all([
    getDictionary(lang),
    getRequestCurrency(),
    getCategories(),
  ]);

  return (
    <html
      lang={LOCALE_META[lang].htmlLang}
      className={`h-full ${displayFont.variable} ${bodyFont.variable}`}
    >
      <body className="flex min-h-full flex-col bg-cream pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-cocoa antialiased md:pb-0">
        <I18nProvider locale={lang} currency={currency} rates={getCurrencyRates()}>
          <CartProvider>
            <MobileMenuProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
              >
                {lang === "no" ? "Hopp til innhold" : "Skip to content"}
              </a>

              <SiteHeader lang={lang} dict={dict} currency={currency} categories={categories} />

              <main id="main-content" className="flex-1">
                {children}
              </main>

              <SiteFooter lang={lang} dict={dict} />

              <MobileMenuSheet
                lang={lang}
                currency={currency}
                categories={categories}
                labels={{
                  title: dict.nav.menu,
                  close: dict.common.close,
                  tagline: dict.meta.tagline,
                  home: dict.nav.home,
                  shop: dict.nav.shop,
                  basket: dict.nav.basket,
                  signIn: dict.nav.signIn,
                  signUp: dict.nav.signUp,
                  signOut: dict.nav.signOut,
                  account: dict.nav.account,
                  admin: dict.nav.admin,
                  profile: dict.nav.profile,
                  orders: dict.nav.orders,
                  payments: dict.nav.payments,
                  preferences: dict.nav.preferences,
                  language: dict.common.language,
                  currency: dict.common.currency,
                  error: dict.auth.genericError,
                  categories: dict.home.categoriesTitle,
                  allCategories: dict.shop.allCategories,
                }}
              />

              <MobileTabBar
                lang={lang}
                labels={{
                  menu: dict.nav.menu,
                  home: dict.nav.home,
                  shop: dict.nav.shop,
                  basket: dict.nav.basket,
                  admin: {
                    overview: dict.adminOverview.title,
                    products: dict.adminProducts.title,
                    orders: dict.adminOrders.title,
                    users: dict.adminUsers.title,
                    email: dict.adminEmail.title,
                  },
                }}
              />

              <ServiceWorkerRegister />
            </MobileMenuProvider>
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { bodyFont, displayFont } from "@/app/fonts";
import { CartProvider } from "@/components/cart/CartProvider";
import { MobileMenuSheet } from "@/components/layout/MobileMenu";
import { MobileMenuProvider } from "@/components/layout/MobileMenuProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { MobileTabBar } from "@/components/pwa/MobileTabBar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getCurrencyRates } from "@/lib/currency";
import { getCategories } from "@/lib/categories";
import { getSiteContent } from "@/lib/content";
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

  const [dict, content] = await Promise.all([getDictionary(lang), getSiteContent(lang)]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // The admin can rewrite the brand block, so the tab title, description and
  // social preview all follow the same curated copy as the page itself.
  const siteName = content["brand.name"].trim() || dict.meta.siteName;
  const tagline = content["brand.tagline"].trim() || dict.meta.tagline;
  const description = content["brand.description"].trim() || dict.meta.description;

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    title: {
      default: `${siteName} — ${tagline}`,
      template: `%s | ${siteName}`,
    },
    description,
    manifest: "/manifest.webmanifest",
    icons: { apple: "/icons/apple-touch-icon.png" },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    formatDetection: { telephone: false },
    alternates: {
      canonical: `/${lang}`,
      // Norwegian is the home market, so it is also the x-default document.
      languages: { en: "/en", no: "/no", "x-default": "/no" },
    },
    openGraph: {
      type: "website",
      siteName,
      title: `${siteName} — ${tagline}`,
      description,
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
              {/* Each area brings its own chrome: `(site)` renders the storefront
                  header/footer, `admin` the dashboard shell. The proxy, the mobile
                  menu sheet and the tab bar stay here because both share them. */}
              {children}

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

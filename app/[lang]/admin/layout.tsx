import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { AdminShellLabels } from "@/components/admin/admin-nav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCategories } from "@/lib/categories";
import { getSiteContent } from "@/lib/content";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getRequestCurrency } from "@/lib/request";
import { requireAdmin } from "@/lib/session";

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

// Every admin route is private; the pages repeat this so a direct hit on a
// detail page cannot leak into an index even if the layout is skipped.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The dashboard shell. Desktops get a full-height sidebar with the workspace to
 * its right; phones keep the storefront header/footer and the floating tab bar
 * they had before, so only the desktop layout changes.
 *
 * The session check lives here as well as in the pages on purpose: the shell
 * renders the signed-in identity, and `getSession` is request-cached, so the
 * second check costs nothing.
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const session = await requireAdmin(`/${lang}`);

  const [dict, currency, categories, content] = await Promise.all([
    getDictionary(lang),
    getRequestCurrency(),
    getCategories(),
    getSiteContent(lang),
  ]);

  const shell: AdminShellLabels = {
    workspace: dict.admin.workspace,
    console: dict.admin.console,
    catalogue: dict.admin.sectionCatalogue,
    storefront: dict.admin.sectionStorefront,
    operations: dict.admin.sectionOperations,
    viewSite: dict.admin.viewSite,
    language: dict.common.language,
    overview: dict.adminOverview.title,
    products: dict.adminProducts.title,
    categories: dict.adminCategories.title,
    content: dict.adminContent.title,
    orders: dict.adminOrders.title,
    users: dict.adminUsers.title,
    email: dict.adminEmail.title,
  };

  const brandName = content["brand.name"].trim() || dict.meta.siteName;
  const user = { name: session.user.name ?? "", email: session.user.email };

  return (
    <div className="min-h-dvh bg-cream md:pl-[4.5rem] lg:pl-72">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        {lang === "no" ? "Hopp til innhold" : "Skip to content"}
      </a>

      <AdminSidebar lang={lang} labels={shell} brandName={brandName} user={user} />

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Phones keep the shop header and footer byte-for-byte; from `md` up the
            sidebar and top bar replace them. */}
        <div className="md:hidden">
          <SiteHeader
            lang={lang}
            dict={dict}
            currency={currency}
            categories={categories}
            logoSrc={content["brand.logo"] || null}
            brandName={brandName}
          />
        </div>

        <AdminTopbar
          lang={lang}
          labels={shell}
          user={user}
          signOut={{ label: dict.nav.signOut, errorLabel: dict.auth.genericError }}
        />

        <main
          id="admin-main"
          className="flex-1 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10"
        >
          <div className="mx-auto w-full max-w-[100rem]">{children}</div>
        </main>

        <div className="md:hidden">
          <SiteFooter lang={lang} dict={dict} content={content} />
        </div>
      </div>
    </div>
  );
}

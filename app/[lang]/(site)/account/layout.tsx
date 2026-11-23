import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountNav } from "@/components/account/AccountNav";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/session";

type AccountLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared shell for the three account pages. The sign-in gate lives in each page
 * rather than here, so an anonymous deep link sends the shopper back to the page
 * they asked for; this layout only needs the session for the greeting.
 */
export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const user = await getSessionUser();
  const displayName = user ? user.name?.trim() || user.email : null;

  return (
    <section className="container-page py-10 sm:py-14">
      <p className="eyebrow">{dict.nav.account}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{dict.account.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-mocha">{dict.account.subtitle}</p>
      {displayName ? (
        <p className="mt-1 text-sm text-mocha">
          {dict.account.welcome}, <span className="font-medium text-cocoa">{displayName}</span>
        </p>
      ) : null}

      <AccountNav lang={lang} label={dict.account.title} labels={dict.account.nav} />

      <div className="mt-8">{children}</div>
    </section>
  );
}

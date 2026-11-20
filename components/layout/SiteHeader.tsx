import Link from "next/link";

import { CartButton } from "@/components/cart/CartButton";
import type { Currency } from "@/lib/currency";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

import { CurrencySwitcher } from "./CurrencySwitcher";
import { HeaderAuth } from "./HeaderAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenuTrigger } from "./MobileMenu";

export function SiteHeader({
  lang,
  dict,
  currency,
}: {
  lang: Locale;
  dict: Dictionary;
  currency: Currency;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/10 bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href={`/${lang}`} className="flex items-baseline gap-2">
            <span className="font-serif text-xl tracking-tight">Lilyy Bakers</span>
            <span className="hidden text-[10px] uppercase tracking-[0.3em] text-mocha sm:inline">
              {dict.meta.tagline}
            </span>
          </Link>

          <nav aria-label={dict.nav.shop} className="hidden md:block">
            <Link
              href={`/${lang}/shop`}
              className="text-sm text-mocha transition hover:text-cocoa"
            >
              {dict.nav.shop}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* On small screens the header keeps only the logo and the hamburger:
              the basket lives in the tab bar and everything else in the drawer. */}
          <div className="hidden md:block">
            <CartButton label={dict.nav.basket} />
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher locale={lang} label={dict.common.language} />
            <CurrencySwitcher currency={currency} label={dict.common.currency} />
            <HeaderAuth lang={lang} nav={dict.nav} auth={dict.auth} />
          </div>

          <MobileMenuTrigger label={dict.nav.menu} />
        </div>
      </div>
    </header>
  );
}

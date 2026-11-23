import Link from "next/link";
import { Suspense } from "react";

import { CartButton } from "@/components/cart/CartButton";
import type { Currency } from "@/lib/currency";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { ShopCategory } from "@/lib/shop";

import { CategoryStrip, CategoryStripLinks } from "./CategoryStrip";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { HeaderAuth } from "./HeaderAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenuTrigger } from "./MobileMenu";
import { SiteLogo } from "./SiteLogo";

export function SiteHeader({
  lang,
  dict,
  currency,
  categories,
}: {
  lang: Locale;
  dict: Dictionary;
  currency: Currency;
  categories: ShopCategory[];
}) {
  // The bar is cocoa so the white lockup reads at full contrast; every control
  // inside is styled for a dark surface.
  return (
    <header className="sticky top-0 z-40 border-b border-cream/15 bg-cocoa/95 pt-[env(safe-area-inset-top)] text-cream backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-6">
          {/* The lockup carries its own tagline, so the header no longer repeats
              one; the localised tagline still appears in metadata and the hero. */}
          <SiteLogo lang={lang} loading="eager" />

          <nav aria-label={dict.nav.shop} className="hidden md:block">
            <Link
              href={`/${lang}/shop`}
              className="text-sm text-cream/75 transition hover:text-cream"
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
            <LanguageSwitcher locale={lang} label={dict.common.language} tone="dark" />
            <CurrencySwitcher currency={currency} label={dict.common.currency} tone="dark" />
            <HeaderAuth lang={lang} nav={dict.nav} auth={dict.auth} />
          </div>

          <MobileMenuTrigger label={dict.nav.menu} />
        </div>
      </div>

      {/* Desktop-only category strip: the shop sections one click from anywhere.
          On phones the drawer carries the same list. */}
      <div className="hidden border-t border-cream/10 md:block">
        <div className="container-page">
          <Suspense
            fallback={
              <CategoryStripLinks
                lang={lang}
                categories={categories}
                allLabel={dict.shop.allCategories}
                ariaLabel={dict.home.categoriesTitle}
                activeSlug={null}
              />
            }
          >
            <CategoryStrip
              lang={lang}
              categories={categories}
              allLabel={dict.shop.allCategories}
              ariaLabel={dict.home.categoriesTitle}
            />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

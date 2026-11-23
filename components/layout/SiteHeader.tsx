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
  logoSrc,
  brandName,
}: {
  lang: Locale;
  dict: Dictionary;
  currency: Currency;
  categories: ShopCategory[];
  /** Admin-uploaded logo; `null` keeps the bundled lockup. */
  logoSrc: string | null;
  brandName: string;
}) {
  // One bar, three slots: the lockup, the shop sections, then the account
  // cluster. The bar is cocoa so the white lockup reads at full contrast; every
  // control inside is styled for a dark surface.
  return (
    <header className="sticky top-0 z-40 border-b border-cream/15 bg-cocoa/95 pt-[env(safe-area-inset-top)] text-cream backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        {/* Both outer slots grow from a zero basis, so they end up the same width
            and the category list sits on the centre of the bar rather than in the
            gap left between a narrow logo and a wide cluster of controls. */}
        <div className="flex min-w-0 flex-1 items-center">
          {/* The lockup carries its own tagline, so the header no longer repeats
              one; the localised tagline still appears in metadata and the hero. */}
          <SiteLogo lang={lang} logoSrc={logoSrc} alt={brandName} loading="eager" />
        </div>

        <div className="hidden min-w-0 items-center md:flex">
          {/* Pills from lg, where the widened page shell leaves room for them.
              Between md and lg the plain shop link stands in: the drawer trigger
              is hidden from md up, so it would otherwise be the only way into the
              shop on tablets. */}
          <nav aria-label={dict.nav.shop} className="lg:hidden">
            <Link
              href={`/${lang}/shop`}
              className="text-sm text-cream/75 transition hover:text-cream"
            >
              {dict.nav.shop}
            </Link>
          </nav>

          {/* No overflow here: the strip below is the one scroller. Nesting a
              second one made its scrollbar take height off the pills, which then
              spilled into a vertical scrollbar. */}
          <div className="hidden min-w-0 max-w-full lg:block">
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

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
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
    </header>
  );
}

import Link from "next/link";

import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function SiteFooter({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cocoa/10 bg-cocoa text-cream">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg">{dict.footer.aboutTitle}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">
            {dict.footer.aboutBody}
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-cream/50">
            {dict.footer.contactTitle}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>
              <a className="transition hover:text-gold" href="mailto:orders@lilyybakers.com">
                orders@lilyybakers.com
              </a>
            </li>
            <li>
              <a className="transition hover:text-gold" href="mailto:contact@lilyybakers.com">
                contact@lilyybakers.com
              </a>
            </li>
            <li className="text-cream/60">{dict.footer.openingHours}</li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-cream/50">
            {dict.footer.helpTitle}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>
              <Link className="transition hover:text-gold" href={`/${lang}/auth/sign-in`}>
                {dict.nav.signIn}
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-gold" href={`/${lang}/auth/sign-up`}>
                {dict.nav.signUp}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Lilyy Bakers. {dict.footer.rights}
          </p>
          <p>{dict.footer.privacy} · {dict.footer.terms}</p>
        </div>
      </div>
    </footer>
  );
}

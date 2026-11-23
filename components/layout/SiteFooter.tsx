import Link from "next/link";

import type { SiteContent } from "@/lib/content-fields";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

/**
 * The footer reads the admin-curated content: business name, about paragraph
 * and contact rows. A blank field hides its row, so the bakery can publish a
 * phone number only once there is one to publish.
 */
export function SiteFooter({
  lang,
  dict,
  content,
}: {
  lang: Locale;
  dict: Dictionary;
  content: SiteContent;
}) {
  const year = new Date().getFullYear();

  const businessName = content["brand.name"].trim() || dict.footer.aboutTitle;
  const about = content["footer.about"].trim();
  const ordersEmail = content["contact.emailOrders"].trim();
  const supportEmail = content["contact.emailSupport"].trim();
  const phone = content["contact.phone"].trim();
  const address = content["contact.address"].trim();
  const hours = content["contact.hours"].trim();

  const hasContact = Boolean(ordersEmail || supportEmail || phone || address || hours);

  return (
    <footer className="border-t border-cocoa/10 bg-cocoa text-cream">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg">{businessName}</p>
          {about ? (
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">{about}</p>
          ) : null}
        </div>

        {hasContact ? (
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-cream/50">
              {dict.footer.contactTitle}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-cream/80">
              {ordersEmail ? (
                <li>
                  <a className="transition hover:text-gold" href={`mailto:${ordersEmail}`}>
                    {ordersEmail}
                  </a>
                </li>
              ) : null}
              {supportEmail ? (
                <li>
                  <a className="transition hover:text-gold" href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <a
                    className="transition hover:text-gold"
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  >
                    {phone}
                  </a>
                </li>
              ) : null}
              {address ? <li className="text-cream/60">{address}</li> : null}
              {hours ? <li className="text-cream/60">{hours}</li> : null}
            </ul>
          </div>
        ) : null}

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
            © {year} {businessName}. {dict.footer.rights}
          </p>
          <p>{dict.footer.privacy} · {dict.footer.terms}</p>
        </div>
      </div>
    </footer>
  );
}

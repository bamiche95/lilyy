import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileForm } from "@/components/account/ProfileForm";
import { CURRENCY_META, DEFAULT_CURRENCY, isCurrency } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, LOCALE_META } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return { title: "Lilyy Bakers" };

  const dict = await getDictionary(lang);

  return {
    title: dict.account.profileTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account` },
  };
}

export default async function AccountProfilePage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const session = await requireUser(`/${lang}/auth/sign-in`, `/${lang}/account`);

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      locale: true,
      currency: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!profile) notFound();

  const labels = dict.account;
  const dateFormatter = new Intl.DateTimeFormat(LOCALE_META[lang].dateLocale, {
    dateStyle: "long",
  });
  const profileLocale = isLocale(profile.locale) ? profile.locale : lang;
  const profileCurrency = isCurrency(profile.currency) ? profile.currency : DEFAULT_CURRENCY;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <h2 className="text-2xl">{labels.profileTitle}</h2>
        <p className="mt-2 text-sm text-mocha">{labels.profileBody}</p>

        <ProfileForm
          lang={lang}
          labels={labels}
          values={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone ?? "",
          }}
        />
      </div>

      <aside className="card h-fit p-5 text-sm">
        <p className="eyebrow">{labels.title}</p>

        <dl className="mt-3 space-y-4">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.15em] text-mocha">{labels.email}</dt>
            <dd className="mt-0.5 break-all">{profile.email}</dd>
            <dd className="mt-1.5">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${
                  profile.emailVerified
                    ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                    : "border-cocoa/20 bg-crust text-mocha"
                }`}
              >
                {profile.emailVerified ? labels.verified : labels.unverified}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase tracking-[0.15em] text-mocha">
              {labels.memberSince}
            </dt>
            <dd className="mt-0.5">{dateFormatter.format(profile.createdAt)}</dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase tracking-[0.15em] text-mocha">
              {labels.language}
            </dt>
            <dd className="mt-0.5">{LOCALE_META[profileLocale].label}</dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase tracking-[0.15em] text-mocha">
              {labels.currency}
            </dt>
            <dd className="mt-0.5">{CURRENCY_META[profileCurrency].label}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

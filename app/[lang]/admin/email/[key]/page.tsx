import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { SendTestEmail } from "@/components/admin/SendTestEmail";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import {
  getMailTemplate,
  isMailTemplateKey,
  MAIL_LOCALES,
  type MailLocale,
} from "@/lib/mail-catalog";
import { requireAdmin } from "@/lib/session";

type PageProps = {
  params: Promise<{ lang: string; key: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

function isMailLocale(value: unknown): value is MailLocale {
  return typeof value === "string" && (MAIL_LOCALES as readonly string[]).includes(value);
}

export default async function AdminEmailTemplatePage({ params, searchParams }: PageProps) {
  const { lang, key } = await params;

  if (!isLocale(lang) || !isMailTemplateKey(key)) notFound();

  const session = await requireAdmin(`/${lang}`);
  const template = getMailTemplate(key);

  if (!template) notFound();

  const { locale } = await searchParams;
  const requested = isMailLocale(locale) && template.locales.includes(locale) ? locale : undefined;
  const selected: MailLocale =
    requested ?? (template.locales.includes(lang) ? lang : (template.locales[0] ?? "en"));

  const dict = await getDictionary(lang);
  const labels = dict.adminEmail;
  const name = labels.templateNames[template.key];
  const rendered = template.render(selected);

  return (
    <section className="container-page py-10 sm:py-14">
      <Link
        href={`/${lang}/admin/email`}
        className="text-xs text-mocha underline-offset-2 hover:text-berry hover:underline"
      >
        ← {labels.backToEmail}
      </Link>

      <div className="mt-4">
        <p className="eyebrow">{labels.templatesTitle}</p>
        <h1 className="mt-2 text-3xl">{name}</h1>
        <p className="mt-2 text-sm text-mocha">{labels.templateDescriptions[template.key]}</p>
      </div>

      <AdminNav lang={lang} current="email" />

      <div className="card mt-6 p-5">
        <p className="text-xs uppercase tracking-wider text-mocha">{labels.subject}</p>
        <p className="mt-1 font-medium">{rendered.subject}</p>

        {template.locales.length > 1 ? (
          <nav aria-label={labels.languages} className="mt-4 flex flex-wrap gap-2 text-xs">
            {template.locales.map((value) => (
              <Link
                key={value}
                href={`/${lang}/admin/email/${template.key}?locale=${value}`}
                aria-current={selected === value ? "page" : undefined}
                className={`rounded-full border px-3 py-1 transition ${
                  selected === value
                    ? "border-cocoa bg-cocoa text-white"
                    : "border-cocoa/15 hover:border-cocoa/30"
                }`}
              >
                {value === "no" ? labels.norwegian : labels.english}
              </Link>
            ))}
          </nav>
        ) : null}

        <p className="mt-4 text-xs text-mocha">{labels.previewNote}</p>

        <SendTestEmail
          templateKey={template.key}
          locale={selected}
          email={session.user.email}
          labels={labels}
        />
      </div>

      <div className="mt-6">
        <iframe
          title={`${name} — ${selected === "no" ? labels.norwegian : labels.english}`}
          srcDoc={rendered.html}
          sandbox=""
          className="h-[38rem] w-full rounded-xl border border-cocoa/10 bg-white"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-lg">{labels.textVersion}</h2>
        <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-crust p-4 text-xs whitespace-pre-wrap">
          {rendered.text}
        </pre>
      </div>
    </section>
  );
}
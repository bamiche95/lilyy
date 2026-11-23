import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentForm } from "@/components/admin/ContentForm";
import { RestoreContentButton } from "@/components/admin/RestoreContentButton";
import { getContentFormState } from "@/lib/content";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { isR2Configured } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminContentPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const [dict, content] = await Promise.all([getDictionary(lang), getContentFormState()]);
  const labels = dict.adminContent;

  return (
    <section>
      <div className="max-w-2xl">
        <p className="eyebrow">{labels.title}</p>
        <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
        <p className="mt-2 text-sm text-mocha">{labels.intro}</p>
      </div>

      <ContentForm
        lang={lang}
        labels={labels}
        values={content.values}
        defaults={content.defaults}
        stored={content.stored}
        uploadEnabled={isR2Configured()}
      />

      <RestoreContentButton lang={lang} labels={labels} />
    </section>
  );
}

import Link from "next/link";

import { getDictionary } from "@/lib/dictionaries";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

export default async function NotFound({
  params,
}: {
  params?: Promise<{ lang: string }>;
}) {
  const resolved = params ? await params : undefined;
  const lang = isLocale(resolved?.lang) ? resolved.lang : DEFAULT_LOCALE;
  const dict = await getDictionary(lang);

  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-3xl sm:text-4xl">{dict.errors.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-sm text-mocha">{dict.errors.notFoundBody}</p>
      <Link href={`/${lang}`} className="btn btn-primary mt-8">
        {dict.errors.goHome}
      </Link>
    </div>
  );
}

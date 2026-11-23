import { NotFoundPanel } from "@/components/layout/NotFoundPanel";
import { getDictionary } from "@/lib/dictionaries";
import { getRequestLocale } from "@/lib/request";

/**
 * Storefront 404. Lives in `(site)` so the bakery header and footer still frame
 * it; the locale comes from the proxy header because `not-found` gets no params.
 */
export default async function SiteNotFound() {
  const lang = await getRequestLocale();
  const dict = await getDictionary(lang);

  return (
    <NotFoundPanel
      title={dict.errors.notFoundTitle}
      body={dict.errors.notFoundBody}
      action={dict.errors.goHome}
      href={`/${lang}`}
    />
  );
}

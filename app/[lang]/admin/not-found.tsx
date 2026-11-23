import { NotFoundPanel } from "@/components/layout/NotFoundPanel";
import { getDictionary } from "@/lib/dictionaries";
import { getRequestLocale } from "@/lib/request";

/**
 * Dashboard 404 for missing records (a deleted product, a stale order link).
 * The admin layout wraps this file, so the sidebar and top bar stay put.
 */
export default async function AdminNotFound() {
  const lang = await getRequestLocale();
  const dict = await getDictionary(lang);

  return (
    <NotFoundPanel
      title={dict.errors.notFoundTitle}
      body={dict.errors.notFoundBody}
      action={dict.adminOverview.title}
      href={`/${lang}/admin`}
    />
  );
}

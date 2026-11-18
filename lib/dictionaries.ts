import type { Locale } from "./i18n";

/**
 * Dictionary loading lives here (not in `lib/i18n.ts`) so that `proxy.ts` can
 * import the locale primitives without pulling the JSON bundles into the edge
 * bundle.
 */
const dictionaries = {
  en: () => import("../dictionaries/en.json").then((module) => module.default),
  no: () => import("../dictionaries/no.json").then((module) => module.default),
} as const;

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

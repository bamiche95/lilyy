import type { Currency } from "./currency";

export const LOCALES = ["en", "no"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "lilyy_locale";
export const CURRENCY_COOKIE = "lilyy_currency";

/** Request headers written by `proxy.ts` and read via `lib/request.ts`. */
export const LOCALE_HEADER = "x-lilyy-locale";
export const CURRENCY_HEADER = "x-lilyy-currency";

export const LOCALE_META: Record<
  Locale,
  { label: string; englishLabel: string; htmlLang: string; dateLocale: string; defaultCurrency: Currency }
> = {
  en: {
    label: "English",
    englishLabel: "English",
    htmlLang: "en",
    dateLocale: "en-GB",
    defaultCurrency: "NOK",
  },
  no: {
    label: "Norsk",
    englishLabel: "Norwegian",
    htmlLang: "nb",
    dateLocale: "nb-NO",
    defaultCurrency: "NOK",
  },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

/** Pick the localised variant of a dual-language DB row. */
export function localised(
  locale: Locale,
  en: string | null | undefined,
  no: string | null | undefined,
): string {
  const value = locale === "no" ? no : en;
  return value ?? en ?? no ?? "";
}

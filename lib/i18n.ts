import type { Currency } from "./currency";

export const LOCALES = ["en", "no"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The bakery's home market is Norway: a request with no usable signal
 * (crawlers, `curl`, a stripped `Accept-Language`) lands on Norwegian.
 * `DEFAULT_LOCALE` in the environment can override the fallback at request
 * time; see `proxy.ts` and `lib/request.ts`.
 */
export const DEFAULT_LOCALE: Locale = "no";

/**
 * An explicit choice made in the language switcher. Only
 * `lib/actions/preferences.ts` writes it — auto-detection stays stateless, so
 * the country/language decision is re-evaluated on every unprefixed request.
 */
export const LOCALE_COOKIE = "lilyy_locale_pref";

/**
 * The cookie an older build wrote on every auto-detection, with a one-year TTL,
 * so real browsers still send it. It is cleared on sight: it must never pin a
 * visitor to a language they did not pick.
 */
export const LEGACY_LOCALE_COOKIE = "lilyy_locale";

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

/**
 * Country → locale for markets that get their own language by default.
 *
 * Norway is the home market, so a Norwegian IP is served Norwegian even when
 * the browser asks for English. Every other country returns `null` and falls
 * through to the browser's language list.
 */
export function localeForCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;

  return country.trim().toUpperCase() === "NO" ? "no" : null;
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

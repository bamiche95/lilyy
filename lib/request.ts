import "server-only";

import { cookies, headers } from "next/headers";

import { DEFAULT_CURRENCY, isCurrency, type Currency } from "./currency";
import {
  CURRENCY_COOKIE,
  CURRENCY_HEADER,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  localeForCountry,
  type Locale,
} from "./i18n";

/** Mirrors `proxy.ts`: the environment may pin the no-signal fallback. */
const FALLBACK_LOCALE: Locale = isLocale(process.env.DEFAULT_LOCALE)
  ? process.env.DEFAULT_LOCALE
  : DEFAULT_LOCALE;

/**
 * Resolves the active locale/currency for a request. `proxy.ts` attaches them as
 * request headers; the cookie is the explicit switcher choice, and the country
 * header keeps context-free renders (route handlers, not-found pages) aligned
 * with the routing decision.
 */
export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get(LOCALE_HEADER);

  if (isLocale(headerLocale)) return headerLocale;

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const country =
    requestHeaders.get("x-vercel-ip-country") ?? requestHeaders.get("cf-ipcountry");

  return localeForCountry(country) ?? FALLBACK_LOCALE;
}

export async function getRequestCurrency(): Promise<Currency> {
  const requestHeaders = await headers();
  const headerCurrency = requestHeaders.get(CURRENCY_HEADER);

  if (isCurrency(headerCurrency)) return headerCurrency;

  const cookieCurrency = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(cookieCurrency) ? cookieCurrency : DEFAULT_CURRENCY;
}


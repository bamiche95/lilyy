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
  type Locale,
} from "./i18n";

/**
 * Resolves the active locale/currency for a request. `proxy.ts` attaches them as
 * request headers; the cookie is the fallback for route handlers and for the
 * first render after the cookie is written.
 */
export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get(LOCALE_HEADER);

  if (isLocale(headerLocale)) return headerLocale;

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}

export async function getRequestCurrency(): Promise<Currency> {
  const requestHeaders = await headers();
  const headerCurrency = requestHeaders.get(CURRENCY_HEADER);

  if (isCurrency(headerCurrency)) return headerCurrency;

  const cookieCurrency = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(cookieCurrency) ? cookieCurrency : DEFAULT_CURRENCY;
}


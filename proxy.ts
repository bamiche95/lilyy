import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_CURRENCY, isCurrency, type Currency } from "@/lib/currency";
import {
  CURRENCY_COOKIE,
  CURRENCY_HEADER,
  DEFAULT_LOCALE,
  LEGACY_LOCALE_COOKIE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  localeForCountry,
  type Locale,
} from "@/lib/i18n";

/**
 * Locale + currency routing only. Auth is deliberately NOT handled here —
 * Better Auth's `getSessionCookie()` is optimistic, so every protected page and
 * route handler re-checks the real session with `getSession()`.
 */

const ONE_YEAR = 60 * 60 * 24 * 365;

/** `DEFAULT_LOCALE` from the environment when it is valid, the home market otherwise. */
const FALLBACK_LOCALE: Locale = isLocale(process.env.DEFAULT_LOCALE)
  ? process.env.DEFAULT_LOCALE
  : DEFAULT_LOCALE;

const EUROZONE = new Set([
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE",
  "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
]);

/**
 * `Accept-Language` split into bare language tags, highest q-value first. Only
 * the primary subtag matters here (`nb-NO` → `nb`).
 */
function preferredLanguages(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().toLowerCase().split(";");
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const weight = quality ? Number.parseFloat(quality.slice(2)) : 1;

      return { tag: rawTag.split("-")[0] ?? "", weight: Number.isFinite(weight) ? weight : 0 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => entry.tag);
}

/**
 * Resolves the locale for an unprefixed URL.
 *
 * 1. An explicit switcher choice always wins.
 * 2. Norway is the home market, so a Norwegian IP gets Norwegian even when the
 *    browser is set to English — the case this site used to get wrong.
 * 3. Otherwise the browser's ordered language list decides; a visitor who
 *    speaks neither language gets the international (English) store.
 * 4. With no signal at all (crawlers, `curl`) we fall back to the home market.
 */
function detectLocale(request: NextRequest): Locale {
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");
  const byCountry = localeForCountry(country);
  if (byCountry) return byCountry;

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    for (const language of preferredLanguages(acceptLanguage)) {
      if (language === "nb" || language === "nn" || language === "no") return "no";
      if (language === "en") return "en";
    }

    // A language was requested, just not one we publish.
    return "en";
  }

  return FALLBACK_LOCALE;
}

/**
 * Drops the cookie the previous auto-detection build wrote. It carried a
 * one-year TTL, so returning visitors still send it and it would otherwise keep
 * overriding the country decision.
 */
function clearLegacyLocaleCookie(response: NextResponse, request: NextRequest) {
  if (request.cookies.has(LEGACY_LOCALE_COOKIE)) {
    response.cookies.set(LEGACY_LOCALE_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }

  return response;
}

function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY;

  const code = country.toUpperCase();
  if (code === "NO") return "NOK";
  if (code === "GB") return "GBP";
  if (code === "US") return "USD";
  if (EUROZONE.has(code)) return "EUR";

  return DEFAULT_CURRENCY;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  const cookieCurrency = request.cookies.get(CURRENCY_COOKIE)?.value;
  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");

  const currency: Currency = isCurrency(cookieCurrency)
    ? cookieCurrency
    : currencyForCountry(country);

  // Already localised: forward locale/currency to the render tree.
  if (isLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, firstSegment);
    requestHeaders.set(CURRENCY_HEADER, currency);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    if (!isCurrency(cookieCurrency)) {
      response.cookies.set(CURRENCY_COOKIE, currency, {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "lax",
      });
    }

    return clearLegacyLocaleCookie(response, request);
  }

  // Unprefixed URL: redirect to the visitor's preferred locale, preserving the path.
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);

  // The decision depends on IP and request headers, never on the URL alone, so
  // no intermediary may cache it. `307` stays temporary; a `308` would be
  // cached by the browser forever.
  response.headers.set("Cache-Control", "private, no-store");

  // Auto-detection is stateless now: nothing is written, and the stale cookie
  // from the previous build must not pin a language nobody chose.
  return clearLegacyLocaleCookie(response, request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  // `_next` is excluded as a whole: the dev server serves its HMR socket at
  // `/_next/webpack-hmr`, and locale-redirecting that request breaks the
  // handshake (and with it Fast Refresh).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

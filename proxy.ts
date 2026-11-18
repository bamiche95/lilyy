import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_CURRENCY, isCurrency, type Currency } from "@/lib/currency";
import {
  CURRENCY_COOKIE,
  CURRENCY_HEADER,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  type Locale,
} from "@/lib/i18n";

/**
 * Locale + currency routing only. Auth is deliberately NOT handled here —
 * Better Auth's `getSessionCookie()` is optimistic, so every protected page and
 * route handler re-checks the real session with `getSession()`.
 */

const ONE_YEAR = 60 * 60 * 24 * 365;

const EUROZONE = new Set([
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE",
  "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
]);

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (/(^|[,;\s])(nb|nn|no)(-|[,;\s]|$)/.test(acceptLanguage)) return "no";

  return DEFAULT_LOCALE;
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

    return response;
  }

  // Unprefixed URL: redirect to the visitor's preferred locale, preserving the path.
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);

  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|_vercel|.*\\..*).*)"],
};

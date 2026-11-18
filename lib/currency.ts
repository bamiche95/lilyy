/**
 * Currency handling. All prices are stored in NOK; other currencies are derived
 * from a static rate table so the storefront never depends on a live FX API.
 */
export const SUPPORTED_CURRENCIES = ["NOK", "USD", "EUR", "GBP"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "NOK";

export const CURRENCY_META: Record<Currency, { label: string; symbol: string }> = {
  NOK: { label: "Norwegian krone", symbol: "kr" },
  USD: { label: "US dollar", symbol: "$" },
  EUR: { label: "Euro", symbol: "€" },
  GBP: { label: "British pound", symbol: "£" },
};

/** 1 NOK expressed in each currency. */
const FALLBACK_RATES: Record<Currency, number> = {
  NOK: 1,
  USD: 0.094,
  EUR: 0.086,
  GBP: 0.074,
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && SUPPORTED_CURRENCIES.includes(value as Currency);
}

export type CurrencyRates = Record<Currency, number>;

export function getCurrencyRates(): CurrencyRates {
  const raw = process.env.CURRENCY_RATES;
  if (!raw) return FALLBACK_RATES;

  try {
    const parsed = JSON.parse(raw) as Partial<Record<Currency, unknown>>;
    const rates = { ...FALLBACK_RATES };

    for (const currency of SUPPORTED_CURRENCIES) {
      const rate = parsed[currency];
      if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
        rates[currency] = rate;
      }
    }

    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}

/**
 * Client components cannot read `CURRENCY_RATES` (not a NEXT_PUBLIC_ var), so
 * the server passes its rate table down through `I18nProvider` — see `usePrice`.
 */
export function convertFromNok(
  amountNok: number,
  currency: Currency,
  rates: CurrencyRates = getCurrencyRates(),
): number {
  return amountNok * rates[currency];
}

const INTL_LOCALE: Record<string, string> = {
  en: "en-GB",
  no: "nb-NO",
};

/** Fraction digits per currency — NOK is conventionally shown without øre. */
function fractionDigits(currency: Currency): number {
  return currency === "NOK" ? 0 : 2;
}

/**
 * Format a NOK amount in the shopper's currency.
 * Accepts Prisma `Decimal` (anything with a numeric `toString`).
 */
export function formatPrice(
  amountNok: number | string | { toString(): string },
  currency: Currency = DEFAULT_CURRENCY,
  locale = "en",
  rates?: CurrencyRates,
): string {
  const numeric = Number(amountNok);
  const value = Number.isFinite(numeric) ? numeric : 0;
  const digits = fractionDigits(currency);

  return new Intl.NumberFormat(INTL_LOCALE[locale] ?? "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(convertFromNok(value, currency, rates));
}

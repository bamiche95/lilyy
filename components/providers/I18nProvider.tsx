"use client";

import { createContext, useContext } from "react";

import { formatPrice, type Currency, type CurrencyRates } from "@/lib/currency";
import type { Locale } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  currency: Currency;
  rates: CurrencyRates;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  currency,
  rates,
  children,
}: I18nContextValue & { children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, currency, rates }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }

  return context;
}

/**
 * Currency formatter for client components. The server serialises its rate
 * table into `I18nProvider`, so client prices always match server prices even
 * when `CURRENCY_RATES` overrides the built-in defaults.
 */
export function usePrice() {
  const { locale, currency, rates } = useI18n();

  return (amountNok: number) => formatPrice(amountNok, currency, locale, rates);
}


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { useI18n, usePrice } from "@/components/providers/I18nProvider";
import { placeOrder, quoteCheckout, type CheckoutActionState } from "@/lib/actions/checkout";
import type { Dictionary } from "@/lib/dictionaries";
import { LOCALE_META, localised } from "@/lib/i18n";
import {
  FREE_DELIVERY_FROM_NOK,
  MAX_ADVANCE_DAYS,
  orderTotals,
  PICKUP_POINT,
} from "@/lib/orders";
import { shopHref } from "@/lib/shop";

type Labels = Dictionary["checkout"];
type Fulfilment = "DELIVERY" | "PICKUP";

const initialState: CheckoutActionState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-berry">{message}</p>;
}

/** `2026-11-19` → `Thu 19 Nov 2026`; noon UTC keeps the day stable in every zone. */
function formatDay(value: string, dateLocale: string): string {
  const date = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Oslo",
  }).format(date);
}

export function CheckoutView({ labels }: { labels: Labels }) {
  const { lines, hydrated, subtotalNok, clear } = useCart();
  const { locale } = useI18n();
  const price = usePrice();
  const router = useRouter();

  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const [fulfilment, setFulfilment] = useState<Fulfilment>("DELIVERY");
  const [preferredDate, setPreferredDate] = useState("");
  const [earliestDate, setEarliestDate] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const quotedFor = useRef("");

  // Quantities do not change the bake date, so one quote per basket is enough.
  const productKey = lines.map((line) => line.productId).join(",");

  useEffect(() => {
    if (!hydrated || productKey === "" || quotedFor.current === productKey) return;

    quotedFor.current = productKey;
    let cancelled = false;

    quoteCheckout(productKey.split(","))
      .then((quote) => {
        if (cancelled) return;
        setUnavailable(quote.unavailable);
        setEarliestDate(quote.earliestDate);
        setLatestDate(quote.latestDate);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [hydrated, productKey]);

  // The order is placed: empty the basket and hand over to the confirmation page.
  useEffect(() => {
    if (!state.ok || !state.order) return;

    clear();
    router.push(`/${locale}/orders/${state.order.accessToken}`);
  }, [state, clear, router, locale]);

  const errorCopy: Record<NonNullable<CheckoutActionState["message"]>, string> = {
    invalid: labels.errorInvalid,
    unavailable: labels.errorUnavailable,
    dateTooSoon: labels.errorDate,
    empty: labels.errorEmpty,
    error: labels.errorGeneric,
  };

  const errors = state.fieldErrors ?? {};
  const errorText = !state.ok && state.message ? errorCopy[state.message] : null;
  const totals = orderTotals(subtotalNok, fulfilment);
  const itemsJson = JSON.stringify(
    lines.map(({ productId, quantity }) => ({ productId, quantity })),
  );
  const isDelivery = fulfilment === "DELIVERY";

  if (!hydrated) {
    return <p className="mt-8 text-sm text-mocha">{labels.loading}</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="card mt-8 p-10 text-center">
        <h2 className="text-xl">{labels.empty}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">{labels.emptyBody}</p>
        <Link href={shopHref(locale)} className="btn btn-primary mt-6">
          {labels.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <form id="checkout-form" action={formAction} className="card p-6">
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="items" value={itemsJson} />

        {errorText ? (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-berry/30 bg-berry/5 p-3 text-sm text-berry"
          >
            {errorText}
          </p>
        ) : null}

        <fieldset>
          <legend className="eyebrow">{labels.contact}</legend>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="customerName" className="label">
                {labels.name}
              </label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                autoComplete="name"
                required
                aria-invalid={errors.customerName ? true : undefined}
                className="field"
              />
              <FieldError message={errors.customerName} />
            </div>

            <div>
              <label htmlFor="customerEmail" className="label">
                {labels.email}
              </label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                autoComplete="email"
                required
                aria-invalid={errors.customerEmail ? true : undefined}
                className="field"
              />
              <FieldError message={errors.customerEmail} />
            </div>

            <div>
              <label htmlFor="customerPhone" className="label">
                {labels.phone}
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                aria-invalid={errors.customerPhone ? true : undefined}
                className="field"
              />
              <FieldError message={errors.customerPhone} />
            </div>
          </div>
        </fieldset>
        <fieldset className="mt-8 border-t border-cocoa/10 pt-6">
          <legend className="eyebrow">{labels.fulfilment}</legend>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                isDelivery ? "border-gold bg-gold/10" : "border-cocoa/15 hover:border-cocoa/30"
              }`}
            >
              <input
                type="radio"
                name="fulfilment"
                value="DELIVERY"
                checked={isDelivery}
                onChange={() => setFulfilment("DELIVERY")}
                className="mt-0.5 accent-cocoa"
              />
              <span>
                <span className="block font-medium">{labels.delivery}</span>
                <span className="mt-1 block text-xs text-mocha">
                  {labels.freeFrom.replace("{amount}", price(FREE_DELIVERY_FROM_NOK))}
                </span>
              </span>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                isDelivery ? "border-cocoa/15 hover:border-cocoa/30" : "border-gold bg-gold/10"
              }`}
            >
              <input
                type="radio"
                name="fulfilment"
                value="PICKUP"
                checked={!isDelivery}
                onChange={() => setFulfilment("PICKUP")}
                className="mt-0.5 accent-cocoa"
              />
              <span>
                <span className="block font-medium">{labels.pickup}</span>
                <span className="mt-1 block text-xs text-mocha">{PICKUP_POINT[locale]}</span>
              </span>
            </label>
          </div>

          {isDelivery ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="deliveryAddress" className="label">
                  {labels.address}
                </label>
                <input
                  id="deliveryAddress"
                  name="deliveryAddress"
                  type="text"
                  autoComplete="street-address"
                  aria-invalid={errors.deliveryAddress ? true : undefined}
                  className="field"
                />
                <FieldError message={errors.deliveryAddress} />
              </div>

              <div>
                <label htmlFor="deliveryPostalCode" className="label">
                  {labels.postalCode}
                </label>
                <input
                  id="deliveryPostalCode"
                  name="deliveryPostalCode"
                  type="text"
                  autoComplete="postal-code"
                  aria-invalid={errors.deliveryPostalCode ? true : undefined}
                  className="field"
                />
                <FieldError message={errors.deliveryPostalCode} />
              </div>

              <div>
                <label htmlFor="deliveryCity" className="label">
                  {labels.city}
                </label>
                <input
                  id="deliveryCity"
                  name="deliveryCity"
                  type="text"
                  autoComplete="address-level2"
                  aria-invalid={errors.deliveryCity ? true : undefined}
                  className="field"
                />
                <FieldError message={errors.deliveryCity} />
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="label">{labels.pickupLabel}</p>
              <p className="text-sm">{PICKUP_POINT[locale]}</p>
            </div>
          )}
        </fieldset>

        <fieldset className="mt-8 border-t border-cocoa/10 pt-6">
          <legend className="eyebrow">{labels.date}</legend>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="preferredDate" className="label">
                {labels.date}
              </label>
              <input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={preferredDate || earliestDate || ""}
                min={earliestDate ?? undefined}
                max={latestDate ?? undefined}
                onChange={(event) => setPreferredDate(event.target.value)}
                aria-invalid={errors.preferredDate ? true : undefined}
                className="field"
              />
              <FieldError message={errors.preferredDate} />
              {earliestDate ? (
                <p className="mt-1 text-xs text-mocha">
                  {labels.dateHint
                    .replace("{date}", formatDay(earliestDate, LOCALE_META[locale].dateLocale))
                    .replace("{days}", String(MAX_ADVANCE_DAYS))}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="deliveryNotes" className="label">
                {labels.notes}
              </label>
              <input
                id="deliveryNotes"
                name="deliveryNotes"
                type="text"
                maxLength={1000}
                placeholder={labels.notesHint}
                aria-invalid={errors.deliveryNotes ? true : undefined}
                className="field"
              />
              <FieldError message={errors.deliveryNotes} />
            </div>
          </div>
        </fieldset>
      </form>

      <aside className="card h-fit p-5">
        <h2 className="eyebrow">{labels.summary}</h2>

        <ul className="mt-4 space-y-2 border-b border-cocoa/10 pb-4 text-sm">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3">
              <span className="text-mocha">
                {line.quantity} × {localised(locale, line.nameEn, line.nameNo)}
              </span>
              <span className="shrink-0 font-medium">{price(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-mocha">{labels.subtotal}</dt>
            <dd className="font-semibold">{price(totals.subtotalNok)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-mocha">{labels.deliveryFee}</dt>
            <dd className="text-xs text-mocha">
              {totals.deliveryFeeNok > 0 ? price(totals.deliveryFeeNok) : labels.free}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-cocoa/10 pt-3 text-base">
            <dt className="font-semibold">{labels.total}</dt>
            <dd className="font-semibold">{price(totals.totalNok)}</dd>
          </div>
        </dl>

        {unavailable ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-berry/30 bg-berry/5 p-3 text-xs text-berry"
          >
            {labels.errorUnavailable}{" "}
            <Link href={`/${locale}/cart`} className="underline underline-offset-2">
              {labels.backToCart}
            </Link>
          </p>
        ) : null}

        <button
          type="submit"
          form="checkout-form"
          disabled={pending}
          className="btn btn-primary mt-5 w-full disabled:opacity-60"
        >
          {pending ? labels.submitting : labels.submit}
        </button>
        <p className="mt-2 text-center text-xs text-mocha">{labels.payment}</p>

        <Link
          href={`/${locale}/cart`}
          className="mt-5 block text-center text-xs text-mocha underline-offset-2 transition hover:text-berry hover:underline"
        >
          {labels.backToCart}
        </Link>
      </aside>
    </div>
  );
}

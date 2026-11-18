"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useI18n, usePrice } from "@/components/providers/I18nProvider";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import type { Dictionary } from "@/lib/dictionaries";
import { localised } from "@/lib/i18n";
import { shopHref } from "@/lib/shop";

import { useCart } from "./CartProvider";

export function CartView({ labels }: { labels: Dictionary["cart"] }) {
  const {
    lines,
    hydrated,
    subtotalNok,
    unavailable,
    setQuantity,
    remove,
    clear,
    sync,
    dismissUnavailable,
  } = useCart();
  const { locale } = useI18n();
  const price = usePrice();
  const synced = useRef(false);

  // Re-price the basket against the live menu once per visit.
  useEffect(() => {
    if (!hydrated || synced.current) return;
    synced.current = true;
    void sync();
  }, [hydrated, sync]);

  if (!hydrated) {
    return <p className="mt-8 text-sm text-mocha">{labels.loading}</p>;
  }

  return (
    <>
      {unavailable.length > 0 ? (
        <div
          role="status"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-berry/30 bg-berry/5 p-4 text-sm text-berry sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold">{labels.unavailableTitle}</p>
            <p className="mt-1">{labels.unavailableBody}</p>
            <ul className="mt-1 list-disc pl-5">
              {unavailable.map((line) => (
                <li key={line.productId}>
                  {localised(locale, line.nameEn, line.nameNo)}
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={dismissUnavailable} className="btn btn-outline shrink-0">
            {labels.dismiss}
          </button>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <h2 className="text-xl">{labels.empty}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">{labels.emptyBody}</p>
          <Link href={shopHref(locale)} className="btn btn-primary mt-6">
            {labels.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-y divide-cocoa/10 border-y border-cocoa/10">
            {lines.map((line) => {
              const name = localised(locale, line.nameEn, line.nameNo);

              return (
                <li key={line.productId} className="flex gap-4 py-4">
                  <Link
                    href={`/${locale}/shop/${line.slug}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-crust"
                  >
                    {line.image ? (
                      <Image src={line.image} alt={name} fill sizes="5rem" className="object-cover" />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-full items-center justify-center font-serif text-xs text-cocoa/30"
                      >
                        Lilyy
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        href={`/${locale}/shop/${line.slug}`}
                        className="text-sm font-medium hover:text-mocha"
                      >
                        {name}
                      </Link>
                      <p className="text-sm font-semibold">{price(line.price * line.quantity)}</p>
                    </div>

                    <p className="text-xs text-mocha">{price(line.price)}</p>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center rounded-full border border-cocoa/20 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          aria-label={`${labels.quantity} − ${name}`}
                          className="h-8 w-8 rounded-l-full text-cocoa transition hover:bg-crust"
                        >
                          −
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-8 text-center text-sm font-semibold"
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              line.productId,
                              Math.min(MAX_QUANTITY_PER_LINE, line.quantity + 1),
                            )
                          }
                          disabled={line.quantity >= MAX_QUANTITY_PER_LINE}
                          aria-label={`${labels.quantity} + ${name}`}
                          className="h-8 w-8 rounded-r-full text-cocoa transition hover:bg-crust disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(line.productId)}
                        className="text-xs text-mocha underline-offset-2 transition hover:text-berry hover:underline"
                      >
                        {labels.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="card h-fit p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-mocha">{labels.subtotal}</dt>
                <dd className="font-semibold">{price(subtotalNok)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-mocha">{labels.delivery}</dt>
                <dd className="text-xs text-mocha">{labels.deliveryAtCheckout}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-cocoa/10 pt-3 text-base">
                <dt className="font-semibold">{labels.total}</dt>
                <dd className="font-semibold">{price(subtotalNok)}</dd>
              </div>
            </dl>

            <Link href={`/${locale}/checkout`} className="btn btn-primary mt-5 w-full">
              {labels.checkout}
            </Link>

            <div className="mt-5 flex flex-col items-center gap-3">
              <Link href={shopHref(locale)} className="btn btn-outline w-full">
                {labels.continueShopping}
              </Link>
              <button
                type="button"
                onClick={clear}
                className="text-xs text-mocha underline-offset-2 transition hover:text-berry hover:underline"
              >
                {labels.clear}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

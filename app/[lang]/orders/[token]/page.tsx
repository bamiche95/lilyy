import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { DEFAULT_CURRENCY, formatPrice, isCurrency } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { serverEnv } from "@/lib/env";
import { isLocale, localised } from "@/lib/i18n";
import { formatOrderDay } from "@/lib/order-links";
import { prisma } from "@/lib/prisma";
import { shopHref } from "@/lib/shop";

type PageProps = { params: Promise<{ lang: string; token: string }> };

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { lang, token } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const labels = dict.order;

  // The token is the secret; a wrong one must not confirm whether an order
  // number exists, so the lookup is by token only.
  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: { items: { orderBy: { id: "asc" } } },
  });

  if (!order) {
    return (
      <section className="container-page py-10 sm:py-14">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <h1 className="text-2xl">{labels.notFound}</h1>
          <p className="mt-3 text-sm text-mocha">{labels.notFoundBody}</p>
          <Link href={shopHref(lang)} className="btn btn-primary mt-6">
            {labels.backToShop}
          </Link>
        </div>
      </section>
    );
  }

  const currency = isCurrency(order.currency) ? order.currency : DEFAULT_CURRENCY;
  const money = (value: number | { toString(): string }) => formatPrice(value, currency, lang);
  const isDelivery = order.fulfilment === "DELIVERY";
  const address = [
    order.deliveryAddress,
    [order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="container-page py-10 sm:py-14">
      <p className="eyebrow">
        {labels.number} {order.orderNumber}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{labels.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-mocha">{labels.thanks}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-mocha">
        <OrderStatusBadge status={order.status} labels={dict.orderStatus} />
        <span>
          {labels.placed}: {formatOrderDay(order.createdAt, lang)}
        </span>
        <span>
          {labels.payment}: {dict.paymentStatus[order.paymentStatus]}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
                <th scope="col" className="p-3 font-medium">
                  {labels.items}
                </th>
                <th scope="col" className="p-3 text-center font-medium">
                  {labels.quantity}
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  {labels.lineTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-cocoa/5 last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{localised(lang, item.nameEn, item.nameNo)}</p>
                    <p className="text-xs text-mocha">{money(item.unitPrice)}</p>
                  </td>
                  <td className="p-3 text-center text-mocha">{item.quantity}</td>
                  <td className="p-3 text-right font-medium">{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="card h-fit p-5">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-mocha">{labels.subtotal}</dt>
              <dd className="font-semibold">{money(order.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-mocha">{labels.deliveryFee}</dt>
              <dd className="text-xs text-mocha">
                {Number(order.deliveryFee) > 0 ? money(order.deliveryFee) : dict.checkout.free}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-cocoa/10 pt-3 text-base">
              <dt className="font-semibold">{labels.total}</dt>
              <dd className="font-semibold">{money(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-cocoa/10 pt-4 text-sm">
            <p className="eyebrow">{isDelivery ? labels.address : labels.pickupAt}</p>
            <p className="mt-2">
              {isDelivery ? address || "—" : (order.pickupLocation ?? dict.checkout.pickup)}
            </p>
            {order.preferredDate ? (
              <p className="mt-3 text-xs text-mocha">
                {labels.date}: {formatOrderDay(order.preferredDate, lang)}
              </p>
            ) : null}
          </div>

          <div className="mt-5 border-t border-cocoa/10 pt-4 text-sm">
            <p className="eyebrow">{labels.contact}</p>
            <p className="mt-2">{order.customerName}</p>
            <p className="text-xs text-mocha">{order.customerEmail}</p>
            <p className="text-xs text-mocha">{order.customerPhone}</p>
          </div>
        </aside>
      </div>
      {order.deliveryNotes ? (
        <div className="card mt-6 p-5 text-sm">
          <p className="eyebrow">{labels.notes}</p>
          <p className="mt-2 whitespace-pre-line">{order.deliveryNotes}</p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <Link href={shopHref(lang)} className="btn btn-outline">
          {labels.backToShop}
        </Link>
        <p className="text-mocha">
          {labels.help}{" "}
          <a
            href={`mailto:${serverEnv().ORDERS_EMAIL}?subject=${encodeURIComponent(order.orderNumber)}`}
            className="underline underline-offset-2 hover:text-berry"
          >
            {serverEnv().ORDERS_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}

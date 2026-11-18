import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { DEFAULT_CURRENCY, formatPrice, isCurrency } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localised } from "@/lib/i18n";
import { formatOrderDay } from "@/lib/order-links";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string; id: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { lang, id } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });

  if (!order) notFound();

  const dict = await getDictionary(lang);
  const labels = dict.adminOrders;
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
      <Link
        href={`/${lang}/admin/orders`}
        className="text-xs text-mocha underline-offset-2 hover:text-berry hover:underline"
      >
        ← {labels.backToOrders}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{labels.detailTitle}</p>
          <h1 className="mt-2 text-3xl">{order.orderNumber}</h1>
        </div>
        <Link
          href={`/${lang}/orders/${order.accessToken}`}
          className="btn btn-outline"
          target="_blank"
          rel="noreferrer"
        >
          {labels.publicLink}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-mocha">
        <OrderStatusBadge status={order.status} labels={dict.orderStatus} />
        <span>
          {labels.placed}: {formatOrderDay(order.createdAt, lang)}
        </span>
        {order.preferredDate ? (
          <span>
            {labels.bakeDate}: {formatOrderDay(order.preferredDate, lang)}
          </span>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
                  <th scope="col" className="p-3 font-medium">
                    {labels.itemsTitle}
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
                      {item.notes ? <p className="mt-1 text-xs text-mocha">{item.notes}</p> : null}
                    </td>
                    <td className="p-3 text-center text-mocha">{item.quantity}</td>
                    <td className="p-3 text-right font-medium">{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="space-y-2 border-t border-cocoa/10 p-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-mocha">{labels.subtotal}</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-mocha">{labels.deliveryFee}</dt>
                <dd>{Number(order.deliveryFee) > 0 ? money(order.deliveryFee) : dict.checkout.free}</dd>
              </div>
              <div className="flex items-center justify-between text-base">
                <dt className="font-semibold">{labels.total}</dt>
                <dd className="font-semibold">{money(order.total)}</dd>
              </div>
            </dl>
          </div>

          {order.deliveryNotes ? (
            <div className="card p-5 text-sm">
              <p className="eyebrow">{labels.notes}</p>
              <p className="mt-2 whitespace-pre-line">{order.deliveryNotes}</p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <OrderStatusForm
              orderId={order.id}
              currentStatus={order.status}
              labels={labels}
              statusLabels={dict.orderStatus}
            />
          </div>

          <div className="card p-5 text-sm">
            <p className="eyebrow">{labels.customerTitle}</p>
            <p className="mt-2 font-medium">{order.customerName}</p>
            <p className="text-mocha">
              <a href={`mailto:${order.customerEmail}`} className="hover:text-berry hover:underline">
                {order.customerEmail}
              </a>
            </p>
            <p className="text-mocha">
              <a href={`tel:${order.customerPhone}`} className="hover:text-berry hover:underline">
                {order.customerPhone}
              </a>
            </p>
          </div>

          <div className="card p-5 text-sm">
            <p className="eyebrow">{labels.paymentTitle}</p>
            <p className="mt-2">
              {labels.paymentStatus}: {dict.paymentStatus[order.paymentStatus]}
            </p>
            <p className="text-mocha">
              {labels.paymentMethod}: {dict.paymentMethod[order.paymentMethod]}
            </p>
          </div>

          <div className="card p-5 text-sm">
            <p className="eyebrow">{labels.fulfilmentTitle}</p>
            <p className="mt-2 font-medium">
              {isDelivery ? dict.order.delivery : dict.order.pickup}
            </p>
            <p className="text-mocha">
              {isDelivery ? address || "—" : (order.pickupLocation ?? dict.checkout.pickup)}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

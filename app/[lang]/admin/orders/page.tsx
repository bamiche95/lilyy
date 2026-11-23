import type { OrderStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { DEFAULT_CURRENCY, formatPrice, isCurrency } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { formatOrderDay } from "@/lib/order-links";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

function isOrderStatus(value: unknown): value is OrderStatusValue {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatusValue);
}

export default async function AdminOrdersPage({ params, searchParams }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const { status } = await searchParams;
  const filter = isOrderStatus(status) ? status : undefined;

  const [dict, orders] = await Promise.all([
    getDictionary(lang),
    prisma.order.findMany({
      where: filter ? { status: filter as OrderStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        fulfilment: true,
        status: true,
        total: true,
        currency: true,
        preferredDate: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const labels = dict.adminOrders;

  return (
    <section>
      <div>
        <p className="eyebrow">{labels.title}</p>
        <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
        <p className="mt-2 text-sm text-mocha">
          {orders.length} {orders.length === 1 ? dict.cart.itemOne : dict.cart.itemMany}
        </p>
      </div>

      <nav aria-label={labels.filter} className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link
          href={`/${lang}/admin/orders`}
          aria-current={filter ? undefined : "page"}
          className={`rounded-full border px-3 py-1 transition ${
            filter ? "border-cocoa/15 hover:border-cocoa/30" : "border-cocoa bg-cocoa text-white"
          }`}
        >
          {labels.allStatuses}
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/${lang}/admin/orders?status=${value}`}
            aria-current={filter === value ? "page" : undefined}
            className={`rounded-full border px-3 py-1 transition ${
              filter === value
                ? "border-cocoa bg-cocoa text-white"
                : "border-cocoa/15 hover:border-cocoa/30"
            }`}
          >
            {dict.orderStatus[value]}
          </Link>
        ))}
      </nav>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
              <th scope="col" className="p-3 font-medium">
                {labels.orderNumber}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.customer}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.placed}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.bakeDate}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.fulfilment}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.status}
              </th>
              <th scope="col" className="p-3 text-right font-medium">
                {labels.total}
              </th>
              <th scope="col" className="p-3 font-medium">
                <span className="sr-only">{labels.view}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-mocha">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const currency = isCurrency(order.currency) ? order.currency : DEFAULT_CURRENCY;
                const itemLabel =
                  order._count.items === 1 ? dict.cart.itemOne : dict.cart.itemMany;

                return (
                  <tr key={order.id} className="border-b border-cocoa/5 last:border-0">
                    <td className="p-3">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-mocha">
                        {order._count.items} {itemLabel}
                      </p>
                    </td>
                    <td className="p-3">
                      <p>{order.customerName}</p>
                      <p className="text-xs text-mocha">{order.customerEmail}</p>
                    </td>
                    <td className="p-3 text-mocha">{formatOrderDay(order.createdAt, lang)}</td>
                    <td className="p-3 text-mocha">
                      {order.preferredDate ? formatOrderDay(order.preferredDate, lang) : "—"}
                    </td>
                    <td className="p-3 text-mocha">
                      {order.fulfilment === "DELIVERY" ? dict.order.delivery : dict.order.pickup}
                    </td>
                    <td className="p-3">
                      <OrderStatusBadge status={order.status} labels={dict.orderStatus} />
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatPrice(order.total, currency, lang)}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/${lang}/admin/orders/${order.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {labels.view}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

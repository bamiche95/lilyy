import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { DEFAULT_CURRENCY, formatPrice, isCurrency } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { serverEnv } from "@/lib/env";
import { isLocale } from "@/lib/i18n";
import { formatOrderDay } from "@/lib/order-links";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return { title: "Lilyy Bakers" };

  const dict = await getDictionary(lang);

  return {
    title: dict.account.ordersTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account/orders` },
  };
}

export default async function AccountOrdersPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const session = await requireUser(`/${lang}/auth/sign-in`, `/${lang}/account/orders`);
  const labels = dict.account;
  const ordersEmail = serverEnv().ORDERS_EMAIL;

  // Guest orders carry no userId, so they intentionally stay out of this list;
  // the page copy points the shopper at the confirmation email instead.
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      accessToken: true,
      status: true,
      paymentStatus: true,
      total: true,
      currency: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <h2 className="text-2xl">{labels.ordersTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-mocha">{labels.ordersBody}</p>

      {orders.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-medium">{labels.ordersEmpty}</p>
          <p className="mt-1 text-sm text-mocha">{labels.ordersEmptyBody}</p>
          <Link href={`/${lang}/shop`} className="btn btn-primary mt-5">
            {labels.startShopping}
          </Link>
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
                <th scope="col" className="p-3 font-medium">
                  {labels.order}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.status}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.payment}
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  {labels.total}
                </th>
                <th scope="col" className="p-3">
                  <span className="sr-only">{labels.view}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const currency = isCurrency(order.currency) ? order.currency : DEFAULT_CURRENCY;

                return (
                  <tr key={order.id} className="border-b border-cocoa/5 last:border-0">
                    <td className="p-3">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-mocha">
                        {formatOrderDay(order.createdAt, lang)} · {order._count.items}{" "}
                        {dict.order.items.toLowerCase()}
                      </p>
                    </td>
                    <td className="p-3">
                      <OrderStatusBadge status={order.status} labels={dict.orderStatus} />
                    </td>
                    <td className="p-3 text-mocha">{dict.paymentStatus[order.paymentStatus]}</td>
                    <td className="p-3 text-right font-medium whitespace-nowrap">
                      {formatPrice(order.total, currency, lang)}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/${lang}/orders/${order.accessToken}`}
                        className="text-xs font-medium whitespace-nowrap text-cocoa underline underline-offset-4 hover:text-berry"
                      >
                        {labels.view}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-mocha">
        {dict.order.help}{" "}
        <a
          href={`mailto:${ordersEmail}`}
          className="underline underline-offset-2 hover:text-berry"
        >
          {ordersEmail}
        </a>
      </p>
    </div>
  );
}

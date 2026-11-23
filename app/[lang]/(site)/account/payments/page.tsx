import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DEFAULT_CURRENCY, formatPrice, isCurrency } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { serverEnv } from "@/lib/env";
import { isLocale } from "@/lib/i18n";
import { formatOrderDay } from "@/lib/order-links";
import { prisma } from "@/lib/prisma";
import { getRequestCurrency } from "@/lib/request";
import { requireUser } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return { title: "Lilyy Bakers" };

  const dict = await getDictionary(lang);

  return {
    title: dict.account.paymentsTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account/payments` },
  };
}

export default async function AccountPaymentsPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const session = await requireUser(`/${lang}/auth/sign-in`, `/${lang}/account/payments`);
  const labels = dict.account;
  const ordersEmail = serverEnv().ORDERS_EMAIL;
  const userId = session.user.id;

  const [orders, paid, outstanding, displayCurrency] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        accessToken: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        currency: true,
        createdAt: true,
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { userId, paymentStatus: "PAID" },
    }),
    // A cancelled or refunded order never becomes money owed, even when it is
    // still flagged UNPAID.
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        userId,
        paymentStatus: "UNPAID",
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    }),
    getRequestCurrency(),
  ]);

  const paidTotal = Number(paid._sum.total ?? 0);
  const openTotal = Number(outstanding._sum.total ?? 0);

  return (
    <div>
      <h2 className="text-2xl">{labels.paymentsTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-mocha">{labels.paymentsBody}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow">{labels.paidToDate}</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPrice(paidTotal, displayCurrency, lang)}
          </p>
        </div>
        <div className="card p-5">
          <p className="eyebrow">{labels.openBalance}</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPrice(openTotal, displayCurrency, lang)}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-mocha">
          {labels.paymentsEmpty}
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
                <th scope="col" className="p-3 font-medium">
                  {labels.order}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.paymentMethod}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {labels.paymentStatus}
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
                      <p className="text-xs text-mocha">{formatOrderDay(order.createdAt, lang)}</p>
                    </td>
                    <td className="p-3 text-mocha">{dict.paymentMethod[order.paymentMethod]}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${
                          order.paymentStatus === "PAID"
                            ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                            : order.paymentStatus === "FAILED"
                              ? "border-berry/40 bg-berry/10 text-berry"
                              : "border-cocoa/20 bg-crust text-cocoa"
                        }`}
                      >
                        {dict.paymentStatus[order.paymentStatus]}
                      </span>
                    </td>
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

      <div className="card mt-6 p-5 text-sm">
        <p className="eyebrow">{labels.paymentsTitle}</p>
        <p className="mt-2 text-mocha">{labels.paymentsNote}</p>
        <p className="mt-3 text-mocha">
          {labels.refundHelp}{" "}
          <a
            href={`mailto:${ordersEmail}`}
            className="font-medium text-cocoa underline underline-offset-2 hover:text-berry"
          >
            {labels.contactUs} — {ordersEmail}
          </a>
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import {
  Ban,
  Banknote,
  CakeSlice,
  ChartLine,
  Package,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MetricCard } from "@/components/admin/MetricCard";
import { SalesTrendChart } from "@/components/admin/SalesTrendChart";
import { StatusBreakdown } from "@/components/admin/StatusBreakdown";
import { TopProducts } from "@/components/admin/TopProducts";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { formatPrice } from "@/lib/currency";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { formatOrderDay } from "@/lib/order-links";
import { requireAdmin } from "@/lib/session";

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The bakery's command centre. The same page is what admins open from the
 * installed PWA, so it leads with the phone-sized KPI stack and only fans out
 * into columns on wider screens.
 */
export default async function AdminOverviewPage({ params }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const [dict, metrics] = await Promise.all([getDictionary(lang), getAdminMetrics()]);

  const labels = dict.adminOverview;
  const money = (value: number) => formatPrice(value, "NOK", lang);

  return (
    <section>
      <div>
        <p className="eyebrow">{dict.nav.admin}</p>
        <h1 className="mt-2 text-3xl">{labels.title}</h1>
        <p className="mt-1 text-sm text-mocha">{labels.subtitle}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={labels.sales}
          value={money(metrics.sales.current)}
          hint={labels.salesHint}
          delta={metrics.sales.change}
          deltaLabel={labels.vsLastMonth}
          tone="success"
          icon={<Banknote className="h-4 w-4" />}
        />
        <MetricCard
          label={labels.orders}
          value={String(metrics.orders.current)}
          hint={labels.ordersHint}
          delta={metrics.orders.change}
          deltaLabel={labels.vsLastMonth}
          href={`/${lang}/admin/orders`}
          icon={<ReceiptText className="h-4 w-4" />}
        />
        <MetricCard
          label={labels.averageOrder}
          value={money(metrics.averageOrderNok)}
          hint={labels.averageOrderHint}
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label={labels.customers}
          value={String(metrics.customers.total)}
          hint={`${metrics.customers.newThisMonth} ${labels.newThisMonth}`}
          href={`/${lang}/admin/users`}
          icon={<Users className="h-4 w-4" />}
        />

        <MetricCard
          label={labels.cancelled}
          value={String(metrics.cancelled.total)}
          hint={`${metrics.cancelled.thisMonth} ${labels.cancelledHint.toLowerCase()}`}
          tone="danger"
          positiveIsGood={false}
          icon={<Ban className="h-4 w-4" />}
        />
        <MetricCard
          label={labels.openOrders}
          value={String(metrics.openOrders)}
          hint={labels.openOrdersHint}
          href={`/${lang}/admin/orders`}
          tone="warning"
          icon={<CakeSlice className="h-4 w-4" />}
        />
        <MetricCard
          label={labels.revenue}
          value={money(metrics.paidRevenueNok)}
          hint={`${metrics.paidOrders} ${labels.paidOrders}`}
          icon={<ChartLine className="h-4 w-4" />}
        />
        <MetricCard
          label={labels.products}
          value={String(metrics.products.total)}
          hint={`${metrics.products.available} ${labels.available.toLowerCase()}`}
          href={`/${lang}/admin/products`}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesTrendChart
            points={metrics.daily}
            lang={lang}
            labels={{
              title: labels.trendTitle,
              subtitle: labels.trendSubtitle,
              empty: labels.trendEmpty,
              total: labels.total,
              orders: labels.ordersUnit,
            }}
          />
        </div>
        <StatusBreakdown
          counts={metrics.statusCounts}
          labels={dict.orderStatus}
          title={labels.statusTitle}
          empty={labels.statusEmpty}
          totalLabel={labels.statusUnit}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cocoa/10 p-4">
            <h2 className="text-lg">{labels.latestOrders}</h2>
            <Link
              href={`/${lang}/admin/orders`}
              className="text-xs underline-offset-2 hover:text-berry hover:underline"
            >
              {labels.viewAll}
            </Link>
          </div>

          {metrics.recentOrders.length === 0 ? (
            <p className="p-6 text-center text-sm text-mocha">{labels.latestOrdersEmpty}</p>
          ) : (
            <>
              {/* Phones get tappable cards; the table only appears with room. */}
              <ul className="divide-y divide-cocoa/5 sm:hidden">
                {metrics.recentOrders.map((order) => (
                  <li key={order.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/${lang}/admin/orders/${order.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="truncate text-xs text-mocha">{order.customerName}</p>
                      <div className="mt-1.5">
                        <OrderStatusBadge status={order.status} labels={dict.orderStatus} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">{money(order.totalNok)}</p>
                      <p className="mt-0.5 text-[11px] text-mocha">
                        {formatOrderDay(order.createdAt, lang)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-cocoa/10 text-left text-xs tracking-wider text-mocha uppercase">
                      <th scope="col" className="p-3 font-medium">
                        {dict.adminOrders.orderNumber}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {dict.adminOrders.customer}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {dict.adminOrders.placed}
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        {dict.adminOrders.status}
                      </th>
                      <th scope="col" className="p-3 text-right font-medium">
                        {dict.adminOrders.total}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-cocoa/5 last:border-0">
                        <td className="p-3">
                          <Link
                            href={`/${lang}/admin/orders/${order.id}`}
                            className="font-medium underline-offset-2 hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="p-3">{order.customerName}</td>
                        <td className="p-3 text-mocha">
                          {formatOrderDay(order.createdAt, lang)}
                        </td>
                        <td className="p-3">
                          <OrderStatusBadge status={order.status} labels={dict.orderStatus} />
                        </td>
                        <td className="p-3 text-right font-medium">{money(order.totalNok)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <TopProducts
          products={metrics.topProducts}
          lang={lang}
          labels={{
            title: labels.topProducts,
            empty: labels.topProductsEmpty,
            units: labels.units,
          }}
        />
      </div>
    </section>
  );
}


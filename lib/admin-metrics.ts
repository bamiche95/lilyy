import "server-only";

import type { OrderStatus } from "@prisma/client";

import { ORDER_STATUSES, roundNok, startOfDay, type OrderStatusValue } from "./orders";
import { prisma } from "./prisma";

/**
 * Numbers behind the admin dashboard.
 *
 * `orders.total` is always stored in NOK by `placeOrder` (even when the shopper
 * browsed in another currency), so every amount here is already NOK and needs
 * no FX conversion before `formatPrice(..., "NOK")`.
 *
 * "Sales" is booked order value — everything except cancelled/refunded orders —
 * because checkout does not collect money yet. The "paid" figures separately
 * track orders that actually settled, so both views stay honest.
 */

const TREND_DAYS = 14;

/** Orders the bakery still has to act on. */
const SETTLED_STATUSES: readonly OrderStatusValue[] = ["DELIVERED", "CANCELLED", "REFUNDED"];

export type Trend = {
  current: number;
  previous: number;
  /** Percentage change vs the previous month; null when there is no baseline. */
  change: number | null;
};

export type DailyPoint = {
  date: Date;
  revenueNok: number;
  orders: number;
};

export type TopProduct = {
  nameEn: string;
  nameNo: string;
  quantity: number;
  revenueNok: number;
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalNok: number;
  createdAt: Date;
};

export type AdminMetrics = {
  sales: Trend;
  orders: Trend;
  averageOrderNok: number;
  cancelled: { total: number; thisMonth: number };
  refunded: number;
  openOrders: number;
  customers: { total: number; newThisMonth: number };
  paidOrders: number;
  paidRevenueNok: number;
  products: { total: number; available: number };
  daily: DailyPoint[];
  statusCounts: Record<OrderStatusValue, number>;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
};

/**
 * Rounded percentage change. A zero baseline has nothing to compare against, so
 * the caller hides the pill instead of printing "+100 %" out of thin air.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function toTrend(current: number, previous: number): Trend {
  return { current, previous, change: percentChange(current, previous) };
}

/** Local calendar key — the dashboard's days must match the bakery's clock. */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function emptyStatusCounts(): Record<OrderStatusValue, number> {
  return Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<
    OrderStatusValue,
    number
  >;
}

export async function getAdminMetrics(now = new Date()): Promise<AdminMetrics> {
  const today = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const trendStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - (TREND_DAYS - 1),
  );

  const [
    statusAllTime,
    statusThisMonth,
    paymentAllTime,
    bookedThisMonth,
    bookedPreviousMonth,
    ordersPreviousMonth,
    customersTotal,
    customersThisMonth,
    products,
    recentOrders,
    trendOrders,
    topItems,
  ] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { createdAt: { gte: monthStart, lt: nextMonthStart } },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        createdAt: { gte: monthStart, lt: nextMonthStart },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        createdAt: { gte: previousMonthStart, lt: monthStart },
      },
    }),
    prisma.order.count({ where: { createdAt: { gte: previousMonthStart, lt: monthStart } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart, lt: nextMonthStart } } }),
    prisma.product.findMany({ select: { isAvailable: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true, total: true, status: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "nameEn", "nameNo"],
      _sum: { quantity: true, lineTotal: true },
      where: { order: { paymentStatus: "PAID", status: { not: "CANCELLED" } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const statusCounts = emptyStatusCounts();
  for (const row of statusAllTime) {
    statusCounts[row.status] = row._count._all;
  }

  const thisMonthCounts = emptyStatusCounts();
  for (const row of statusThisMonth) {
    thisMonthCounts[row.status] = row._count._all;
  }

  const ordersThisMonth = Object.values(thisMonthCounts).reduce((sum, value) => sum + value, 0);

  const openOrders = ORDER_STATUSES.filter(
    (status) => !SETTLED_STATUSES.includes(status),
  ).reduce((sum, status) => sum + statusCounts[status], 0);

  /** Paid revenue and paid-order count across every month. */
  const paidAllTime = paymentAllTime.find((row) => row.paymentStatus === "PAID");
  const paidOrders = paidAllTime?._count._all ?? 0;
  const paidRevenueNok = roundNok(Number(paidAllTime?._sum.total ?? 0));

  const billableOrdersThisMonth = bookedThisMonth._count._all;
  const salesThisMonth = roundNok(Number(bookedThisMonth._sum.total ?? 0));
  const salesPreviousMonth = roundNok(Number(bookedPreviousMonth._sum.total ?? 0));

  const daily: DailyPoint[] = Array.from({ length: TREND_DAYS }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    return { date, revenueNok: 0, orders: 0 };
  });

  const dayIndex = new Map(daily.map((point, index) => [dayKey(point.date), index]));

  for (const order of trendOrders) {
    const index = dayIndex.get(dayKey(order.createdAt));
    if (index === undefined) continue;

    daily[index].orders += 1;

    if (order.status !== "CANCELLED" && order.status !== "REFUNDED") {
      daily[index].revenueNok = roundNok(daily[index].revenueNok + Number(order.total));
    }
  }

  return {
    sales: toTrend(salesThisMonth, salesPreviousMonth),
    orders: toTrend(ordersThisMonth, ordersPreviousMonth),
    averageOrderNok:
      billableOrdersThisMonth > 0 ? roundNok(salesThisMonth / billableOrdersThisMonth) : 0,
    cancelled: {
      total: statusCounts.CANCELLED,
      thisMonth: thisMonthCounts.CANCELLED,
    },
    refunded: statusCounts.REFUNDED,
    openOrders,
    customers: { total: customersTotal, newThisMonth: customersThisMonth },
    paidOrders,
    paidRevenueNok,
    products: {
      total: products.length,
      available: products.filter((product) => product.isAvailable).length,
    },
    daily,
    statusCounts,
    topProducts: topItems.map((item) => ({
      nameEn: item.nameEn,
      nameNo: item.nameNo,
      quantity: item._sum.quantity ?? 0,
      revenueNok: roundNok(Number(item._sum.lineTotal ?? 0)),
    })),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      totalNok: Number(order.total),
      createdAt: order.createdAt,
    })),
  };
}


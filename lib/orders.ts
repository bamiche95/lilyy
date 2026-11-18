import type { FulfilmentType, OrderStatus } from "@prisma/client";

import type { Locale } from "./i18n";

/**
 * Order rules shared by the checkout form (client) and the Server Actions.
 * Keep this module free of Prisma runtime imports and `server-only` so the
 * basket summary can price delivery before the order is submitted.
 */

/** Flat delivery fee in NOK, waived above the free-delivery threshold. */
export const DELIVERY_FEE_NOK = 79;
export const FREE_DELIVERY_FROM_NOK = 500;

/** How far ahead a customer may request a bake date. */
export const MAX_ADVANCE_DAYS = 90;

/** Collection point shown in the checkout and stored on pickup orders. */
export const PICKUP_POINT: Record<Locale, string> = {
  en: "Lilyy Bakers counter, Oslo",
  no: "Lilyy Bakers disken, Oslo",
};

/** Mirrors `enum OrderStatus` in prisma/schema.prisma. */
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "BAKING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/**
 * The bakery workflow. Admins may only move an order forward along these
 * edges, so a delivered order cannot silently drop back to pending.
 */
export const ORDER_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["BAKING", "CANCELLED"],
  BAKING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransitionOrder(from: OrderStatusValue, to: OrderStatusValue): boolean {
  if (from === to) return false;
  return ORDER_TRANSITIONS[from].includes(to);
}

export function nextOrderStatuses(from: OrderStatusValue): readonly OrderStatusValue[] {
  return ORDER_TRANSITIONS[from];
}

/** Prices are stored as Decimal(10, 2); never leak float noise into totals. */
export function roundNok(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type OrderTotals = {
  subtotalNok: number;
  deliveryFeeNok: number;
  totalNok: number;
};

export function orderTotals(subtotalNok: number, fulfilment: FulfilmentType): OrderTotals {
  const subtotal = roundNok(subtotalNok);
  const deliveryFeeNok =
    fulfilment === "DELIVERY" && subtotal > 0 && subtotal < FREE_DELIVERY_FROM_NOK
      ? DELIVERY_FEE_NOK
      : 0;

  return {
    subtotalNok: subtotal,
    deliveryFeeNok,
    totalNok: roundNok(subtotal + deliveryFeeNok),
  };
}

/** Local midnight, so bake dates compare day-to-day rather than by clock time. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The first calendar day the whole basket can be ready: now + the longest lead
 * time, floored to midnight (a 24h cake ordered at 15:00 is ready tomorrow).
 */
export function earliestFulfilmentDate(leadTimeHours: number, now: Date = new Date()): Date {
  const hours = Number.isFinite(leadTimeHours) && leadTimeHours > 0 ? leadTimeHours : 0;
  return startOfDay(new Date(now.getTime() + hours * 60 * 60 * 1000));
}

export function isPreferredDateAllowed(
  preferredDate: Date,
  earliest: Date,
  now: Date = new Date(),
): boolean {
  if (Number.isNaN(preferredDate.getTime())) return false;

  const day = startOfDay(preferredDate);
  const latest = startOfDay(new Date(now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000));

  return day.getTime() >= earliest.getTime() && day.getTime() <= latest.getTime();
}

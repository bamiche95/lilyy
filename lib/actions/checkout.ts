"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";

import { formatPrice } from "@/lib/currency";
import { serverEnv } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { orderConfirmationTemplate, orderNotificationTemplate } from "@/lib/mail-templates";
import {
  earliestFulfilmentDate,
  isPreferredDateAllowed,
  MAX_ADVANCE_DAYS,
  orderTotals,
  PICKUP_POINT,
  roundNok,
  startOfDay,
} from "@/lib/orders";
import { formatOrderDay, orderLink, siteUrl } from "@/lib/order-links";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { checkoutSchema, fieldErrors } from "@/lib/validation";

export type CheckoutActionState = {
  ok: boolean;
  message?: "invalid" | "unavailable" | "dateTooSoon" | "empty" | "error";
  fieldErrors?: Record<string, string>;
  /** Only the public confirmation key travels back to the browser. */
  order?: { orderNumber: string; accessToken: string };
};

/** No 0/O/1/I — these codes get read aloud over the phone. */
const CODE_ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 4): string {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/** `LY-261117-K7Q2` — sortable by day, unique enough for a bakery counter. */
function newOrderNumber(now = new Date()): string {
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `LY-${year}${month}${day}-${randomCode()}`;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/** Store bake dates at midday UTC so no timezone shifts them to another day. */
function toBakeDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
}

function readForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const rawItems = text("items");

  let items: unknown = [];
  try {
    const parsed: unknown = JSON.parse(rawItems || "[]");
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }

  return {
    lang: text("lang") === "no" ? ("no" as const) : ("en" as const),
    customerName: text("customerName"),
    customerEmail: text("customerEmail"),
    customerPhone: text("customerPhone"),
    fulfilment: text("fulfilment") === "PICKUP" ? "PICKUP" : "DELIVERY",
    deliveryAddress: text("deliveryAddress"),
    deliveryCity: text("deliveryCity"),
    deliveryPostalCode: text("deliveryPostalCode"),
    deliveryNotes: text("deliveryNotes"),
    preferredDate: text("preferredDate"),
    items,
  };
}

export async function placeOrder(
  _previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const raw = readForm(formData);
  const lang = raw.lang;

  const parsed = checkoutSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: Object.keys(fieldErrors(parsed.error)).length === 0 ? "empty" : "invalid",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const session = await getSessionUser();

  // Never trust client quantities: merge duplicates and cap per line.
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    const total = (quantities.get(item.productId) ?? 0) + item.quantity;
    quantities.set(item.productId, Math.min(50, total));
  }

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] } },
      select: {
        id: true,
        nameEn: true,
        nameNo: true,
        price: true,
        isAvailable: true,
        leadTimeHours: true,
      },
    });

    if (products.length !== quantities.size || products.some((product) => !product.isAvailable)) {
      return { ok: false, message: "unavailable" };
    }

    const leadTimeHours = Math.max(0, ...products.map((product) => product.leadTimeHours ?? 0));
    const earliestDate = earliestFulfilmentDate(leadTimeHours);

    if (input.preferredDate && !isPreferredDateAllowed(input.preferredDate, earliestDate)) {
      return { ok: false, message: "dateTooSoon" };
    }

    const lines = products.map((product) => {
      const quantity = quantities.get(product.id) ?? 1;
      const unitPrice = roundNok(Number(product.price));
      return {
        productId: product.id,
        nameEn: product.nameEn,
        nameNo: product.nameNo,
        quantity,
        unitPrice,
        lineTotal: roundNok(unitPrice * quantity),
      };
    });

    const subtotal = roundNok(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    const totals = orderTotals(subtotal, input.fulfilment);
    const isDelivery = input.fulfilment === "DELIVERY";

    const data: Omit<Prisma.OrderUncheckedCreateInput, "orderNumber"> = {
      userId: session?.id ?? null,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      fulfilment: input.fulfilment,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "CASH_ON_DELIVERY",
      subtotal: totals.subtotalNok,
      deliveryFee: totals.deliveryFeeNok,
      total: totals.totalNok,
      currency: "NOK",
      locale: lang,
      deliveryAddress: isDelivery ? input.deliveryAddress || null : null,
      deliveryCity: isDelivery ? input.deliveryCity || null : null,
      deliveryPostalCode: isDelivery ? input.deliveryPostalCode || null : null,
      deliveryNotes: input.deliveryNotes || null,
      preferredDate: input.preferredDate ? toBakeDate(input.preferredDate) : null,
      pickupLocation: isDelivery ? null : PICKUP_POINT[lang],
      items: { create: lines },
    };

    let order: Prisma.OrderGetPayload<{ include: { items: true } }> | null = null;

    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      try {
        order = await prisma.order.create({
          data: { ...data, orderNumber: newOrderNumber() },
          include: { items: true },
        });
      } catch (error) {
        // A birthday-paradox collision on `orderNumber` is recoverable; anything
        // else is not, so rethrow on the last attempt.
        if (!isUniqueViolation(error) || attempt === 4) throw error;
      }
    }

    if (!order) return { ok: false, message: "error" };

    await sendOrderEmails(order, lang);
    revalidateAdminOrders();

    return {
      ok: true,
      order: { orderNumber: order.orderNumber, accessToken: order.accessToken },
    };
  } catch (error) {
    console.error("placeOrder failed", error);
    return { ok: false, message: "error" };
  }
}

/** Mail failures must never roll back a paid-for order — log and move on. */
async function sendOrderEmails(
  order: Prisma.OrderGetPayload<{ include: { items: true } }>,
  lang: "en" | "no",
) {
  try {
    const env = serverEnv();
    const money = (value: number | { toString(): string }) => formatPrice(value, "NOK", lang);

    const shared = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      fulfilment: order.fulfilment,
      preferredDate: order.preferredDate ? formatOrderDay(order.preferredDate, lang) : undefined,
      deliveryAddress:
        [order.deliveryAddress, [order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ") || undefined,
      pickupLocation: order.pickupLocation ?? undefined,
      deliveryNotes: order.deliveryNotes ?? undefined,
      items: order.items.map((item) => ({
        nameEn: item.nameEn,
        nameNo: item.nameNo,
        quantity: item.quantity,
        lineTotal: money(item.lineTotal),
      })),
      subtotal: money(order.subtotal),
      deliveryFee: Number(order.deliveryFee) === 0 ? (lang === "no" ? "Gratis" : "Free") : money(order.deliveryFee),
      total: money(order.total),
    };

    const customer = orderConfirmationTemplate({
      ...shared,
      orderUrl: orderLink(order.accessToken, lang),
      locale: lang,
    });

    const internal = orderNotificationTemplate({
      ...shared,
      adminUrl: `${siteUrl()}/en/admin/orders/${order.id}`,
      locale: "en",
    });

    const metadata = { orderId: order.id, orderNumber: order.orderNumber };

    const results = await Promise.all([
      sendMail({
        to: order.customerEmail,
        subject: customer.subject,
        html: customer.html,
        text: customer.text,
        replyTo: env.ORDERS_EMAIL,
        type: "ORDER_CONFIRMATION",
        userId: order.userId,
        metadata,
      }),
      sendMail({
        to: env.ORDERS_EMAIL,
        subject: internal.subject,
        html: internal.html,
        text: internal.text,
        replyTo: order.customerEmail,
        // The enum has no internal-notice value; metadata.kind distinguishes it.
        type: "ORDER_STATUS",
        metadata,
      }),
    ]);

    for (const result of results) {
      if (!result.ok) console.error("order email failed", result.error);
    }
  } catch (error) {
    console.error("order emails failed", error);
  }
}

function revalidateAdminOrders() {
  for (const locale of ["en", "no"] as const) {
    revalidatePath(`/${locale}/admin/orders`);
  }
}

export type CheckoutQuote = {
  ok: boolean;
  /** A basket line left the menu since it was added to the cart. */
  unavailable: boolean;
  /** `YYYY-MM-DD` bounds for the date input, in the bakery's local time. */
  earliestDate: string;
  latestDate: string;
};

/** `2026-11-19` — the wire format `<input type="date">` expects. */
function dateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Prices and availability are re-checked in `placeOrder`; this only tells the
 * form which bake dates the server will accept, so the picker and the action
 * never disagree about lead times.
 */
export async function quoteCheckout(productIds: string[]): Promise<CheckoutQuote> {
  const now = new Date();
  const latestDate = dateInputValue(
    startOfDay(new Date(now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000)),
  );
  const fallback = {
    ok: true,
    unavailable: false,
    earliestDate: dateInputValue(startOfDay(now)),
    latestDate,
  };

  const ids = Array.isArray(productIds)
    ? [...new Set(productIds.filter((id) => typeof id === "string" && id.length > 0))].slice(0, 40)
    : [];

  if (ids.length === 0) return fallback;

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isAvailable: true },
      select: { id: true, leadTimeHours: true },
    });

    const leadTimeHours = Math.max(0, ...products.map((product) => product.leadTimeHours ?? 0));

    return {
      ok: true,
      unavailable: products.length !== ids.length,
      earliestDate: dateInputValue(earliestFulfilmentDate(leadTimeHours, now)),
      latestDate,
    };
  } catch (error) {
    console.error("quoteCheckout failed", error);
    return { ...fallback, ok: false };
  }
}

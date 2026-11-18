"use server";

import { revalidatePath } from "next/cache";

import type { Order } from "@prisma/client";

import { formatPrice } from "@/lib/currency";
import { sendMail } from "@/lib/mail";
import { orderStatusTemplate } from "@/lib/mail-templates";
import { formatOrderDay, orderLink } from "@/lib/order-links";
import { canTransitionOrder, type OrderStatusValue } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { updateOrderStatusSchema } from "@/lib/validation";

export type UpdateOrderStatusState = {
  ok: boolean;
  message?: "forbidden" | "invalid" | "notFound" | "illegalTransition" | "error";
  status?: OrderStatusValue;
};

/**
 * Admin-only workflow move. The transition graph is enforced twice: here (so
 * a tampered form cannot skip steps) and in the UI (so it is not offered).
 */
export async function updateOrderStatus(
  _previous: UpdateOrderStatusState,
  formData: FormData,
): Promise<UpdateOrderStatusState> {
  const user = await getSessionUser();

  if (!isAdmin(user)) {
    return { ok: false, message: "forbidden" };
  }

  const parsed = updateOrderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { ok: false, message: "invalid" };
  }

  const { orderId, status } = parsed.data;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { ok: false, message: "notFound" };
    }

    if (!canTransitionOrder(order.status, status)) {
      return { ok: false, message: "illegalTransition", status: order.status };
    }

    const data = status === "CANCELLED" ? { status, cancelledAt: new Date() } : { status };

    const updated = await prisma.order.update({
      where: { id: order.id },
      data,
    });

    for (const locale of ["en", "no"] as const) {
      revalidatePath(`/${locale}/admin/orders`);
      revalidatePath(`/${locale}/admin/orders/${order.id}`);
      revalidatePath(`/${locale}/orders/${order.accessToken}`);
    }

    await sendStatusEmail(updated, order.accessToken);

    return { ok: true, status };
  } catch (error) {
    console.error("updateOrderStatus failed", error);
    return { ok: false, message: "error" };
  }
}

/** Status mails are a courtesy: a bounced SMTP server must not undo the update. */
async function sendStatusEmail(order: Order, accessToken: string) {
  try {
    const lang = order.locale === "no" ? ("no" as const) : ("en" as const);
    const money = (value: number | { toString(): string }) => formatPrice(value, "NOK", lang);

    const message = orderStatusTemplate({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      total: money(order.total),
      fulfilment: order.fulfilment,
      preferredDate: order.preferredDate ? formatOrderDay(order.preferredDate, lang) : undefined,
      deliveryAddress:
        [order.deliveryAddress, [order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ") || undefined,
      pickupLocation: order.pickupLocation ?? undefined,
      orderUrl: orderLink(accessToken, lang),
      locale: lang,
    });

    const result = await sendMail({
      to: order.customerEmail,
      subject: message.subject,
      html: message.html,
      text: message.text,
      type: "ORDER_STATUS",
      userId: order.userId,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, status: order.status },
    });

    if (!result.ok) console.error("status email failed", result.error);
  } catch (error) {
    console.error("status email failed", error);
  }
}

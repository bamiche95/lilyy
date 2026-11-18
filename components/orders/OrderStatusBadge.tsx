import type { OrderStatus } from "@prisma/client";

import type { Dictionary } from "@/lib/dictionaries";

/** Shared palette so the customer page and the admin list agree on colour. */
const TONES: Record<OrderStatus, string> = {
  PENDING: "border-cocoa/20 bg-crust text-cocoa",
  CONFIRMED: "border-gold/50 bg-gold/15 text-cocoa",
  BAKING: "border-gold/60 bg-gold/30 text-cocoa",
  READY: "border-emerald-600/30 bg-emerald-50 text-emerald-800",
  OUT_FOR_DELIVERY: "border-sky-600/30 bg-sky-50 text-sky-800",
  DELIVERED: "border-emerald-700/30 bg-emerald-100 text-emerald-900",
  CANCELLED: "border-berry/40 bg-berry/10 text-berry",
  REFUNDED: "border-mocha/40 bg-crust text-mocha",
};

export function OrderStatusBadge({
  status,
  labels,
}: {
  status: OrderStatus;
  labels: Dictionary["orderStatus"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[status]}`}
    >
      {labels[status]}
    </span>
  );
}

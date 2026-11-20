import type { EmailStatus } from "@prisma/client";

import type { Dictionary } from "@/lib/dictionaries";

/** Mirrors `OrderStatusBadge` so admin tables share one visual language. */
const TONES: Record<EmailStatus, string> = {
  PENDING: "border-gold/50 bg-gold/15 text-cocoa",
  SENT: "border-emerald-600/30 bg-emerald-50 text-emerald-800",
  FAILED: "border-berry/40 bg-berry/10 text-berry",
};

export function EmailStatusBadge({
  status,
  labels,
}: {
  status: EmailStatus;
  labels: Dictionary["adminEmail"]["statusLabels"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[status]}`}
    >
      {labels[status]}
    </span>
  );
}
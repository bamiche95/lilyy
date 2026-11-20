import type { Dictionary } from "@/lib/dictionaries";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/orders";

const BARS: Record<OrderStatusValue, string> = {
  PENDING: "bg-gold/45",
  CONFIRMED: "bg-gold",
  BAKING: "bg-gold/80",
  READY: "bg-emerald-500/80",
  OUT_FOR_DELIVERY: "bg-sky-500/70",
  DELIVERED: "bg-emerald-700/75",
  CANCELLED: "bg-berry",
  REFUNDED: "bg-mocha/70",
};

/** Where the orders are sitting right now — one glance at the pipeline. */
export function StatusBreakdown({
  counts,
  labels,
  title,
  empty,
  totalLabel,
}: {
  counts: Record<OrderStatusValue, number>;
  labels: Dictionary["orderStatus"];
  title: string;
  empty: string;
  totalLabel: string;
}) {
  const rows = ORDER_STATUSES.map((status) => ({ status, count: counts[status] })).filter(
    (row) => row.count > 0,
  );
  const max = Math.max(1, ...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="card flex h-full flex-col p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        <p className="text-xs text-mocha">
          {total} {totalLabel}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-cocoa/15 px-4 py-8 text-center text-sm text-mocha">
          {empty}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map(({ status, count }) => (
            <li key={status}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-cocoa">{labels[status]}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-crust"
                role="presentation"
              >
                <div
                  className={`h-full rounded-full ${BARS[status]}`}
                  style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

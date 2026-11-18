"use client";

import { useActionState } from "react";

import { updateOrderStatus, type UpdateOrderStatusState } from "@/lib/actions/orders";
import type { Dictionary } from "@/lib/dictionaries";
import { nextOrderStatuses, type OrderStatusValue } from "@/lib/orders";

const INITIAL_STATE: UpdateOrderStatusState = { ok: false };

export function OrderStatusForm({
  orderId,
  currentStatus,
  labels,
  statusLabels,
}: {
  orderId: string;
  currentStatus: OrderStatusValue;
  labels: Dictionary["adminOrders"];
  statusLabels: Dictionary["orderStatus"];
}) {
  const [state, formAction, pending] = useActionState(updateOrderStatus, INITIAL_STATE);
  const nextStatuses = nextOrderStatuses(currentStatus);
  const problem =
    state.ok || !state.message
      ? null
      : state.message === "invalid"
        ? labels.error
        : labels[state.message];

  return (
    <div>
      <h2 className="text-lg">{labels.statusTitle}</h2>

      {nextStatuses.length === 0 ? (
        <p className="mt-2 text-sm text-mocha">{labels.noTransitions}</p>
      ) : (
        <form action={formAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="submit"
              name="status"
              value={status}
              disabled={pending}
              className="btn btn-outline disabled:opacity-60"
            >
              {statusLabels[status]}
            </button>
          ))}
          {pending ? <span className="self-center text-xs text-mocha">{labels.updating}</span> : null}
        </form>
      )}

      <p className="mt-3 text-xs text-mocha">{labels.emailNote}</p>

      {state.ok ? (
        <p role="status" className="mt-3 text-sm font-medium text-emerald-700">
          {labels.statusUpdated}
        </p>
      ) : null}

      {problem ? (
        <p role="alert" className="mt-3 text-sm font-medium text-berry">
          {problem}
        </p>
      ) : null}
    </div>
  );
}

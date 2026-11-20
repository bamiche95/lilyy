"use client";

import { useActionState } from "react";

import { updateUserRole, type UpdateUserRoleState } from "@/lib/actions/users";
import type { Dictionary } from "@/lib/dictionaries";
import type { UserRole } from "@/lib/session";

const INITIAL_STATE: UpdateUserRoleState = { ok: false };

export function UserRoleForm({
  userId,
  role,
  isSelf,
  labels,
}: {
  userId: string;
  role: UserRole;
  isSelf: boolean;
  labels: Dictionary["adminUsers"];
}) {
  const [state, formAction, pending] = useActionState(updateUserRole, INITIAL_STATE);
  const problem = state.ok || !state.message ? null : labels[state.message];
  const options: { value: UserRole; label: string }[] = [
    { value: "customer", label: labels.customer },
    { value: "admin", label: labels.admin },
  ];

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={pending || isSelf}
        aria-label={labels.role}
        className="rounded-lg border border-cocoa/20 bg-white px-2 py-1 text-xs disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending || isSelf} className="btn btn-outline disabled:opacity-60">
        {pending ? labels.saving : labels.save}
      </button>

      {isSelf ? <span className="text-xs text-mocha">{labels.selfRole}</span> : null}

      {state.ok ? (
        <span role="status" className="text-xs font-medium text-emerald-700">
          {labels.saved}
        </span>
      ) : null}

      {problem ? (
        <span role="alert" className="text-xs font-medium text-berry">
          {problem}
        </span>
      ) : null}
    </form>
  );
}
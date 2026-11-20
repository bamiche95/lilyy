"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin, USER_ROLES, type UserRole } from "@/lib/session";

export type UpdateUserRoleState = {
  ok: boolean;
  /** Dictionary key under `adminUsers`, except `saved`/`error` which are also there. */
  message?: "forbidden" | "invalid" | "notFound" | "selfRole" | "lastAdmin" | "saved" | "error";
  role?: UserRole;
};

const inputSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(USER_ROLES),
});

/**
 * The only write the users table offers. Deliberately narrow: no delete, no
 * ban, and the bakery can never lock itself out (last-admin guard).
 */
export async function updateUserRole(
  _previous: UpdateUserRoleState,
  formData: FormData,
): Promise<UpdateUserRoleState> {
  const actor = await getSessionUser();

  if (!actor || !isAdmin(actor)) {
    return { ok: false, message: "forbidden" };
  }

  const parsed = inputSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { ok: false, message: "invalid" };
  }

  const { userId, role } = parsed.data;

  if (userId === actor.id && actor.role !== role) {
    return { ok: false, message: "selfRole" };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      return { ok: false, message: "notFound" };
    }

    if (target.role === role) {
      return { ok: true, message: "saved", role };
    }

    // Count-then-update is not atomic, but two admins demoting each other in
    // the same second is a smaller risk than serialising every role change.
    if (role === "customer") {
      const admins = await prisma.user.count({ where: { role: "admin" } });
      if (admins <= 1) {
        return { ok: false, message: "lastAdmin" };
      }
    }

    await prisma.user.update({ where: { id: target.id }, data: { role } });

    for (const locale of ["en", "no"] as const) {
      revalidatePath(`/${locale}/admin/users`);
      revalidatePath(`/${locale}/admin`);
    }

    return { ok: true, message: "saved", role };
  } catch (error) {
    console.error("updateUserRole failed", error);
    return { ok: false, message: "error" };
  }
}
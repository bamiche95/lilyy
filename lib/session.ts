import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export type AppSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type SessionUser = AppSession["user"];

export const USER_ROLES = ["admin", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Current session, or null. Safe in Server Components, Server Actions and
 * Route Handlers — no redirects.
 */
export async function getSession(): Promise<AppSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return (await getSession())?.user ?? null;
}

export function isAdmin(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === "admin";
}

/**
 * Redirects to sign-in when there is no session, then back to `next` so an
 * account deep link survives the round trip.
 */
export async function requireUser(
  redirectTo = "/en/auth/sign-in",
  next = "/en/account",
): Promise<AppSession> {
  const session = await getSession();

  if (!session?.user) {
    redirect(`${redirectTo}?next=${encodeURIComponent(next)}`);
  }

  return session;
}

/** Redirects non-admins away — use in pages and Server Actions, not route handlers. */
export async function requireAdmin(redirectTo = "/en"): Promise<AppSession> {
  const session = await getSession();

  if (!session?.user) {
    redirect("/en/auth/sign-in");
  }

  if (!isAdmin(session.user)) {
    redirect(redirectTo);
  }

  return session;
}

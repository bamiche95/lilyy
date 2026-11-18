import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton.
 *
 * Next.js dev server re-evaluates modules on every hot reload, so the client is
 * cached on `globalThis` outside production to avoid exhausting the pooled
 * connection limit on Neon.
 *
 * NOTE: this module intentionally does NOT import "server-only" — `lib/auth.ts`
 * imports it, and the `auth` CLI loads that file in plain Node where
 * "server-only" throws.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { Prisma } from "@prisma/client";

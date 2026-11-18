"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { isCurrency } from "@/lib/currency";
import { CURRENCY_COOKIE, LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const inputSchema = z.object({
  locale: z.string().optional(),
  currency: z.string().optional(),
  pathname: z.string().startsWith("/").max(300).optional(),
});

/**
 * Persists the shopper's locale/currency in cookies and mirrors it onto the user
 * record when signed in.
 */
export async function setPreferences(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = inputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Invalid preferences" };
  }

  const { locale, currency, pathname } = parsed.data;
  const nextLocale = isLocale(locale) ? locale : undefined;
  const nextCurrency = isCurrency(currency) ? currency : undefined;

  if (!nextLocale && !nextCurrency) {
    return { ok: false, error: "Nothing to update" };
  }

  const jar = await cookies();
  const attributes = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };

  if (nextLocale) jar.set(LOCALE_COOKIE, nextLocale, attributes);
  if (nextCurrency) jar.set(CURRENCY_COOKIE, nextCurrency, attributes);

  const session = await getSession();

  if (session?.user) {
    await prisma.user
      .update({
        where: { id: session.user.id },
        data: {
          ...(nextLocale ? { locale: nextLocale } : {}),
          ...(nextCurrency ? { currency: nextCurrency } : {}),
        },
      })
      .catch(() => undefined);
  }

  if (pathname) {
    revalidatePath(pathname);
  } else {
    revalidatePath("/", "layout");
  }

  return { ok: true };
}

import "server-only";

import { serverEnv } from "./env";

/** Public site origin for links inside emails (no `"use server"` here: the
 * checkout action module may only export async functions). */
export function siteUrl(): string {
  const env = serverEnv();
  return (process.env.NEXT_PUBLIC_SITE_URL ?? env.BETTER_AUTH_URL).replace(/\/+$/, "");
}

export function formatOrderDay(date: Date, lang: "en" | "no"): string {
  return new Intl.DateTimeFormat(lang === "no" ? "nb-NO" : "en-GB", {
    dateStyle: "long",
    timeZone: "Europe/Oslo",
  }).format(date);
}

/** Public, unguessable confirmation URL for one order. */
export function orderLink(accessToken: string, lang: "en" | "no"): string {
  return `${siteUrl()}/${lang}/orders/${accessToken}`;
}

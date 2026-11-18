import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths inside a locale (e.g. `/en/does-not-exist`).
 * Unprefixed URLs are redirected to a locale by `proxy.ts` first, so they land
 * here too.
 */
export default async function CatchAllPage() {
  notFound();
}

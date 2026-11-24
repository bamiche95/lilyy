import { NextResponse } from "next/server";

/**
 * Deployment health probe.
 *
 * Reports *presence* of the environment variables each subsystem needs, plus the
 * result of one database ping and one Better Auth initialisation. No secret
 * values are returned — only booleans, public host names and error
 * names/codes — so the endpoint is safe to hit in production and answers the
 * "why is every route a 500?" question. `warnings` carries misconfigurations
 * that do not fail the request but break a feature, such as a production
 * `BETTER_AUTH_URL` pointing at localhost.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const present = (key: string) => Boolean(process.env[key]?.trim());

const REQUIRED_ENV = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_SITE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "ORDERS_EMAIL",
  "SUPPORT_EMAIL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

function describe(error: unknown) {
  const err = error as { name?: string; message?: string; code?: string; errorCode?: string };
  return {
    name: err?.name ?? "Error",
    code: err?.code ?? err?.errorCode ?? null,
    message: err?.message?.slice(0, 300) ?? null,
  };
}

export async function GET() {
  const env: Record<string, boolean> = {};
  for (const key of REQUIRED_ENV) {
    env[key] = present(key);
  }

  const missingEnv = REQUIRED_ENV.filter((key) => !env[key]);
  const warnings: string[] = [];
  const report: Record<string, unknown> = {
    ok: true,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    missingEnv,
    warnings,
    env,
    db: null,
    auth: null,
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    const products = await prisma.product.count();
    report.db = { ok: true, products };
  } catch (error) {
    report.ok = false;
    report.db = { ok: false, ...describe(error) };
  }

  try {
    const { auth, baseURL, trustedOrigins, isGoogleConfigured, isLocalOrigin } =
      await import("@/lib/auth");
    // Hosts and booleans only — never secrets. A local baseURL in production is
    // the classic cause of 403 INVALID_ORIGIN on every cookie-bearing auth POST.
    report.auth = {
      ok: Boolean(auth),
      baseURL,
      trustedOrigins,
      googleConfigured: isGoogleConfigured(),
    };
    if (process.env.NODE_ENV === "production" && isLocalOrigin(baseURL)) {
      warnings.push(
        "BETTER_AUTH_URL points at a local address in production: cookie-bearing POSTs to /api/auth/* will fail with 403 INVALID_ORIGIN.",
      );
    }
    if (process.env.NODE_ENV === "production" && !isGoogleConfigured()) {
      warnings.push(
        "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are empty or still placeholders: Google sign-in will fail even once the origin is correct.",
      );
    }
  } catch (error) {
    report.ok = false;
    report.auth = { ok: false, ...describe(error) };
  }

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}

import { NextResponse } from "next/server";

/**
 * Deployment health probe.
 *
 * Reports *presence* of the environment variables each subsystem needs, plus the
 * result of one database ping and one Better Auth initialisation. Values are
 * never returned — only booleans and error names/codes — so the endpoint is
 * safe to hit in production and answers the "why is every route a 500?"
 * question without exposing secrets.
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
  const report: Record<string, unknown> = {
    ok: true,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    missingEnv,
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
    const { auth } = await import("@/lib/auth");
    report.auth = { ok: Boolean(auth), baseURL: process.env.BETTER_AUTH_URL ?? null };
  } catch (error) {
    report.ok = false;
    report.auth = { ok: false, ...describe(error) };
  }

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}

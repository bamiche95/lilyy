import "server-only";

import { z } from "zod";

/**
 * Server-only environment contract.
 *
 * `lib/auth.ts` deliberately reads `process.env` directly instead of importing
 * this module: the `auth` CLI loads that file in plain Node, where the
 * "server-only" guard would throw.
 *
 * Validation is lazy (on first call) so `next build` never needs production
 * secrets to compile a page that does not use them.
 */
const booleanFlag = (defaultValue = true) =>
  z
    .string()
    .optional()
    .transform((value) =>
      value === undefined ? defaultValue : value.trim().toLowerCase() !== "false",
    );

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: z.string().min(1),

  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be 32+ chars"),
  BETTER_AUTH_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
  SMTP_SECURE: booleanFlag(true),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM_NAME: z.string().default("Lilyy Bakers"),
  ORDERS_EMAIL: z.email(),
  SUPPORT_EMAIL: z.email(),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.url(),

  DEFAULT_LOCALE: z.enum(["en", "no"]).default("no"),
  CURRENCY_RATES: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    console.error(`❌ Invalid environment variables:\n${details}`);
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  cached = parsed.data;
  return cached;
}

/** `"Lilyy Bakers" <orders@lilyybakers.com>` */
export function mailFrom(env: ServerEnv = serverEnv()): string {
  return `"${env.SMTP_FROM_NAME}" <${env.ORDERS_EMAIL}>`;
}

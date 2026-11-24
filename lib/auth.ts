import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "./prisma";

const stripTrailingSlashes = (value?: string | null) =>
  value?.trim().replace(/\/+$/, "") || undefined;

/** `example.com` → `https://example.com`; Vercel exposes its hosts without a scheme. */
const asOrigin = (value?: string | null) => {
  const trimmed = stripTrailingSlashes(value);
  if (!trimmed) return undefined;
  return trimmed.includes("://") ? trimmed : `https://${trimmed}`;
};

export const isLocalOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

export const baseURL =
  stripTrailingSlashes(process.env.BETTER_AUTH_URL) ?? "http://localhost:3000";

/**
 * Origins allowed to POST to `/api/auth/*`.
 *
 * Better Auth compares these exactly (see `dist/auth/trusted-origins.mjs`), so
 * every entry must be a bare `scheme://host[:port]` with no trailing slash. A
 * missing production origin silently breaks the whole auth surface: any request
 * that carries a cookie is rejected with `403 INVALID_ORIGIN`, while a request
 * without cookies passes — which makes the failure look intermittent.
 *
 * The Vercel-provided hosts keep preview deployments working without edits.
 */
export const trustedOrigins = Array.from(
  new Set(
    [
      baseURL,
      asOrigin(process.env.NEXT_PUBLIC_SITE_URL),
      asOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
      asOrigin(process.env.VERCEL_BRANCH_URL),
      asOrigin(process.env.VERCEL_URL),
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

if (process.env.NODE_ENV === "production" && isLocalOrigin(baseURL)) {
  console.error(
    "[auth] BETTER_AUTH_URL points at a local address in production. Every " +
      "cookie-bearing POST to /api/auth/* will fail with 403 INVALID_ORIGIN. " +
      "Set BETTER_AUTH_URL to the public HTTPS origin and redeploy.",
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

/** True once real Google OAuth credentials are in place. */
export function isGoogleConfigured(): boolean {
  return (
    googleClientId.length > 0 &&
    googleClientSecret.length > 0 &&
    !googleClientId.includes("placeholder") &&
    !googleClientSecret.includes("placeholder")
  );
}

export const auth = betterAuth({
  appName: "Lilyy Bakers",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    requireEmailVerification: false,
  },

  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      prompt: "select_account",
    },
  },

  // Google is trusted, so a verified Google email may attach to an existing
  // password account instead of creating a duplicate user.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: false,
      disableImplicitLinking: false,
    },
  },

  user: {
    additionalFields: {
      // `input: false` — clients can never set their own role.
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      locale: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
      currency: {
        type: "string",
        required: false,
        defaultValue: "NOK",
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: { enabled: false }, // revocation stays instant
  },

  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
  },

  advanced: {
    cookiePrefix: "lilyy",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Must stay last: it forwards Set-Cookie headers when called from Server Actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./auth";

/**
 * Browser auth client. No `baseURL` is passed on purpose: the client defaults to
 * the current origin + `/api/auth`, which keeps preview deployments working.
 *
 * `inferAdditionalFields` is a type-only bridge — `import type` is erased at
 * compile time, so no server code reaches the bundle.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession, updateUser } = authClient;

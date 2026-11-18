import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "@/lib/env";
import { sendMail, verifyMailConnection } from "@/lib/mail";
import { testEmailTemplate } from "@/lib/mail-templates";
import { getSessionUser, isAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  to: z.email().optional(),
});

async function authorise() {
  const user = await getSessionUser();

  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isAdmin(user)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

/** SMTP health check: verifies the transport without sending anything. */
export async function GET() {
  const auth = await authorise();
  if ("response" in auth) return auth.response;

  const result = await verifyMailConnection();

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

/** Sends a live test email and journals it in `email_logs`. */
export async function POST(request: Request) {
  const auth = await authorise();
  if ("response" in auth) return auth.response;

  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const env = serverEnv();
  const to = parsed.data.to ?? env.ORDERS_EMAIL;
  const template = testEmailTemplate({ to, mailHost: env.SMTP_HOST });

  const result = await sendMail({
    ...template,
    to,
    type: "TEST",
    userId: auth.user.id,
    metadata: { requestedBy: auth.user.email, mailHost: env.SMTP_HOST },
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, logId: result.logId },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    to,
    logId: result.logId,
    messageId: result.messageId,
  });
}

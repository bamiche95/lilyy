import "server-only";

import type { EmailStatus, EmailType } from "@prisma/client";
import nodemailer, { type Transporter } from "nodemailer";

import { mailFrom, serverEnv } from "./env";
import { prisma } from "./prisma";
import type { Prisma } from "./prisma";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const env = serverEnv();

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  type?: EmailType;
  userId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export type SendMailResult =
  | { ok: true; logId: string; messageId: string }
  | { ok: false; logId: string; error: string };

/**
 * Every outbound message is journalled in `email_logs` first (PENDING), then
 * flipped to SENT/FAILED — so the admin panel can always show what happened.
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const from = mailFrom();
  const { to, subject, html, text, replyTo, userId = null, metadata } = options;

  const log = await prisma.emailLog.create({
    data: {
      to,
      from,
      subject,
      type: options.type ?? "TEST",
      userId,
      status: "PENDING" satisfies EmailStatus,
      metadata,
    },
  });

  try {
    const info = await getTransporter().sendMail({ from, to, subject, html, text, replyTo });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerId: info.messageId },
    });

    return { ok: true, logId: log.id, messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 2000) },
    });

    return { ok: false, logId: log.id, error: message };
  }
}

/** Health check used by the admin test endpoint. */
export async function verifyMailConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

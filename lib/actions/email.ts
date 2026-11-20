"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { serverEnv } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import {
  getMailTemplate,
  MAIL_LOCALES,
  MAIL_TEMPLATE_KEYS,
} from "@/lib/mail-catalog";
import { getSessionUser, isAdmin } from "@/lib/session";

export type SendTestEmailState = {
  ok: boolean;
  message?: "forbidden" | "invalid" | "notFound" | "sent" | "failed";
};

const inputSchema = z.object({
  key: z.enum(MAIL_TEMPLATE_KEYS),
  locale: z.enum(MAIL_LOCALES),
});

/**
 * Sends one template to the signed-in admin's own address. There is no
 * recipient field on purpose: this page must never become an open relay.
 */
export async function sendTemplateTest(
  _previous: SendTestEmailState,
  formData: FormData,
): Promise<SendTestEmailState> {
  const actor = await getSessionUser();

  if (!isAdmin(actor) || !actor) {
    return { ok: false, message: "forbidden" };
  }

  const parsed = inputSchema.safeParse({
    key: formData.get("key"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return { ok: false, message: "invalid" };
  }

  const { key, locale } = parsed.data;
  const template = getMailTemplate(key);

  if (!template) {
    return { ok: false, message: "notFound" };
  }

  try {
    const message = template.render(locale, {
      to: actor.email,
      mailHost: serverEnv().SMTP_HOST,
    });

    const result = await sendMail({
      to: actor.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      type: "TEST",
      userId: actor.id,
      metadata: { template: template.key, locale, requestedBy: actor.email },
    });

    for (const language of MAIL_LOCALES) {
      revalidatePath(`/${language}/admin/email`);
    }

    return result.ok ? { ok: true, message: "sent" } : { ok: false, message: "failed" };
  } catch (error) {
    console.error("sendTemplateTest failed", error);
    return { ok: false, message: "failed" };
  }
}
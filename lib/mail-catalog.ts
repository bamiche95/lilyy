import "server-only";

import type { EmailType } from "@prisma/client";

import { formatPrice } from "./currency";
import {
  orderConfirmationTemplate,
  orderNotificationTemplate,
  orderStatusTemplate,
  supportAckTemplate,
  testEmailTemplate,
  type OrderEmailData,
  type OrderEmailItem,
  type OrderNotificationData,
  type OrderStatusEmailData,
  type SupportAckData,
} from "./mail-templates";
import { formatOrderDay } from "./order-links";

/**
 * Catalogue of the transactional mails the shop actually sends. This module is
 * the single place that knows how to build sample data for each template, so
 * the admin preview can never drift from the real send path.
 */
export const MAIL_LOCALES = ["en", "no"] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];

export const MAIL_TEMPLATE_KEYS = [
  "orderConfirmation",
  "orderNotification",
  "orderStatus",
  "supportAck",
  "test",
] as const;
export type MailTemplateKey = (typeof MAIL_TEMPLATE_KEYS)[number];

export function isMailTemplateKey(value: unknown): value is MailTemplateKey {
  return typeof value === "string" && (MAIL_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export type RenderedMail = { subject: string; html: string; text: string };

export type MailTemplateAudience = "customer" | "bakery";

/** `test` targets the signed-in admin, so the preview can borrow their address. */
export type RenderOverrides = { to?: string; mailHost?: string };

export type MailTemplateDefinition = {
  key: MailTemplateKey;
  /** Value written to `email_logs.type` when this mail goes out for real. */
  type: EmailType;
  audience: MailTemplateAudience;
  /** Locales this template has copy for. */
  locales: readonly MailLocale[];
  render: (locale: MailLocale, overrides?: RenderOverrides) => RenderedMail;
};

const money = (amountNok: number, locale: MailLocale) => formatPrice(amountNok, "NOK", locale);

const sampleDate = (locale: MailLocale) =>
  formatOrderDay(new Date("2026-12-05T09:00:00Z"), locale);

/** 2 × 89 + 6 × 32 + 79 = 449, plus 40 delivery = 489. */
const sampleItems = (locale: MailLocale): OrderEmailItem[] => [
  {
    nameEn: "Country sourdough",
    nameNo: "Landbrød surdeig",
    quantity: 2,
    lineTotal: money(178, locale),
  },
  {
    nameEn: "Cardamom knots",
    nameNo: "Kardemommeknuter",
    quantity: 6,
    lineTotal: money(192, locale),
  },
  {
    nameEn: "Cinnamon celebration cake",
    nameNo: "Kanelkake til feiring",
    quantity: 1,
    lineTotal: money(79, locale),
  },
];

const sampleOrder = (locale: MailLocale): OrderEmailData => ({
  orderNumber: "LB-261205-A7Q2",
  customerName: locale === "no" ? "Ingrid Hansen" : "Amelia Clarke",
  total: money(489, locale),
  fulfilment: "DELIVERY",
  preferredDate: sampleDate(locale),
  deliveryAddress: "Storgata 14, 0184 Oslo",
  pickupLocation: "Lilyy Bakers, Markveien 32, Oslo",
  items: sampleItems(locale),
  orderUrl: "https://lilyybakers.com/en/orders/sample",
  locale,
});

const sampleNotification = (locale: MailLocale): OrderNotificationData => ({
  orderNumber: "LB-261205-A7Q2",
  customerName: locale === "no" ? "Ingrid Hansen" : "Amelia Clarke",
  customerEmail: "amelia@example.com",
  customerPhone: "+47 912 34 567",
  fulfilment: "DELIVERY",
  preferredDate: sampleDate(locale),
  deliveryAddress: "Storgata 14, 0184 Oslo",
  deliveryNotes: locale === "no" ? "Ring på når dere er fremme." : "Please ring the bell on arrival.",
  items: sampleItems(locale),
  subtotal: money(449, locale),
  deliveryFee: money(40, locale),
  total: money(489, locale),
  adminUrl: "https://lilyybakers.com/en/admin/orders",
  locale,
});

const sampleStatus = (locale: MailLocale): OrderStatusEmailData => ({
  orderNumber: "LB-261205-A7Q2",
  customerName: locale === "no" ? "Ingrid Hansen" : "Amelia Clarke",
  status: "READY",
  total: money(489, locale),
  fulfilment: "PICKUP",
  preferredDate: sampleDate(locale),
  pickupLocation: "Lilyy Bakers, Markveien 32, Oslo",
  orderUrl: "https://lilyybakers.com/en/orders/sample",
  locale,
});

const sampleSupport = (locale: MailLocale): SupportAckData => ({
  name: locale === "no" ? "Ingrid Hansen" : "Amelia Clarke",
  subject: locale === "no" ? "Kanelkake til konfirmasjon" : "Cinnamon cake for a confirmation",
  message:
    locale === "no"
      ? "Hei! Kan dere lage en større versjon til 20 personer? Vi trenger den lørdag morgen."
      : "Hello! Could you bake a larger version for 20 people? We would need it on Saturday morning.",
  locale,
  kind: "support",
});

export const MAIL_TEMPLATES: readonly MailTemplateDefinition[] = [
  {
    key: "orderConfirmation",
    type: "ORDER_CONFIRMATION",
    audience: "customer",
    locales: MAIL_LOCALES,
    render: (locale) => orderConfirmationTemplate(sampleOrder(locale)),
  },
  {
    key: "orderNotification",
    type: "ORDER_STATUS",
    audience: "bakery",
    locales: MAIL_LOCALES,
    render: (locale) => orderNotificationTemplate(sampleNotification(locale)),
  },
  {
    key: "orderStatus",
    type: "ORDER_STATUS",
    audience: "customer",
    locales: MAIL_LOCALES,
    render: (locale) => orderStatusTemplate(sampleStatus(locale)),
  },
  {
    key: "supportAck",
    type: "SUPPORT_ACK",
    audience: "customer",
    locales: MAIL_LOCALES,
    render: (locale) => supportAckTemplate(sampleSupport(locale)),
  },
  {
    key: "test",
    type: "TEST",
    audience: "bakery",
    locales: ["en"],
    render: (_locale, overrides) =>
      testEmailTemplate({
        to: overrides?.to ?? "owner@lilyybakers.com",
        mailHost: overrides?.mailHost ?? "smtp.lilyybakers.com",
        sentAt: new Date("2026-12-05T09:00:00Z"),
      }),
  },
];

export function getMailTemplate(key: MailTemplateKey): MailTemplateDefinition | undefined {
  return MAIL_TEMPLATES.find((template) => template.key === key);
}

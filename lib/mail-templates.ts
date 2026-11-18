import type { OrderStatusValue } from "./orders";

/**
 * Transactional email templates. Inline styles only — mail clients strip
 * stylesheets, and we keep a single shared layout for brand consistency.
 */
const BRAND = {
  brown: "#3B2A20",
  gold: "#C9A227",
  cream: "#FBF7EF",
  muted: "#7A6A5F",
  border: "#E7DCCB",
};

const SANS = "Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderLayout(options: {
  preheader: string;
  heading: string;
  body: string;
}): string {
  const { preheader, heading, body } = options;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:24px;background:${BRAND.cream};font-family:${SERIF};color:${BRAND.brown};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid ${BRAND.border};overflow:hidden;">
      <tr>
        <td style="padding:26px 32px 14px 32px;border-bottom:3px solid ${BRAND.gold};">
          <p style="margin:0;font-family:${SANS};font-size:15px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.brown};">Lilyy Bakers</p>
          <p style="margin:6px 0 0 0;font-family:${SANS};font-size:12px;color:${BRAND.muted};">Baked fresh in Norway</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 16px 0;font-size:23px;line-height:1.3;">${escapeHtml(heading)}</h1>
          ${body}
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px 26px 32px;background:${BRAND.cream};border-top:1px solid ${BRAND.border};font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.muted};">
          <p style="margin:0;">Lilyy Bakers · orders@lilyybakers.com</p>
          <p style="margin:4px 0 0 0;">Tue–Sat, 07:00–17:00 · Norway</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function button(label: string, href: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 24px;background:${BRAND.brown};color:#ffffff;font-family:${SANS};font-size:14px;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a></p>`;
}

type MailLocale = "en" | "no";

export type OrderEmailItem = {
  nameEn: string;
  nameNo: string;
  quantity: number;
  lineTotal: string;
};

export type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  total: string;
  fulfilment: "DELIVERY" | "PICKUP";
  preferredDate?: string;
  deliveryAddress?: string;
  pickupLocation?: string;
  items: OrderEmailItem[];
  /** Public confirmation page for this order, when available. */
  orderUrl?: string;
  locale?: MailLocale;
};

const COPY = {
  en: {
    greeting: (name: string) => `Hi ${name},`,
    thanks: "Thank you for your order — we have started planning your bake.",
    orderLabel: "Order",
    itemsLabel: "Your order",
    totalLabel: "Total",
    fulfilmentLabel: "Fulfilment",
    delivery: "Delivery",
    pickup: "Collection",
    deliveryTo: "Delivering to",
    collectFrom: "Collection point",
    readyLabel: "Requested date",
    cta: "View your order",
    closing: "We will email you again the moment your order goes into the oven.",
    signOff: "— The Lilyy Bakers team",
  },
  no: {
    greeting: (name: string) => `Hei ${name},`,
    thanks: "Takk for bestillingen — vi har begynt å planlegge bakingen din.",
    orderLabel: "Ordre",
    itemsLabel: "Din bestilling",
    totalLabel: "Totalt",
    fulfilmentLabel: "Levering",
    delivery: "Levering",
    pickup: "Henting",
    deliveryTo: "Leveres til",
    collectFrom: "Hentested",
    readyLabel: "Ønsket dato",
    cta: "Se bestillingen",
    closing: "Vi sender deg en ny e-post i det ordren går i ovnen.",
    signOff: "— Lilyy Bakers",
  },
} as const;

const cell = `padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;`;

export function orderConfirmationTemplate(data: OrderEmailData) {
  const copy = COPY[data.locale ?? "en"];
  const itemName = (item: OrderEmailItem) => (data.locale === "no" ? item.nameNo : item.nameEn);

  const rows = data.items
    .map(
      (item) => `<tr>
        <td style="${cell}">${escapeHtml(itemName(item))} × ${item.quantity}</td>
        <td style="${cell}text-align:right;white-space:nowrap;">${escapeHtml(item.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const fulfilmentDetail =
    data.fulfilment === "DELIVERY"
      ? data.deliveryAddress
        ? `<p style="margin:4px 0 0 0;color:${BRAND.muted};font-size:13px;">${escapeHtml(copy.deliveryTo)}: ${escapeHtml(data.deliveryAddress)}</p>`
        : ""
      : data.pickupLocation
        ? `<p style="margin:4px 0 0 0;color:${BRAND.muted};font-size:13px;">${escapeHtml(copy.collectFrom)}: ${escapeHtml(data.pickupLocation)}</p>`
        : "";

  const body = `
    <p style="margin:0 0 14px 0;">${escapeHtml(copy.greeting(data.customerName))}</p>
    <p style="margin:0 0 18px 0;">${escapeHtml(copy.thanks)}</p>
    <p style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(copy.orderLabel)}</p>
    <p style="margin:0 0 18px 0;font-size:18px;">${escapeHtml(data.orderNumber)}</p>
    <p style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(copy.itemsLabel)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
      <tr>
        <td style="padding:14px 0 0 0;font-size:15px;font-weight:bold;">${escapeHtml(copy.totalLabel)}</td>
        <td style="padding:14px 0 0 0;text-align:right;font-size:15px;font-weight:bold;white-space:nowrap;">${escapeHtml(data.total)}</td>
      </tr>
    </table>
    <p style="margin:22px 0 4px 0;font-size:14px;"><strong>${escapeHtml(copy.fulfilmentLabel)}:</strong> ${escapeHtml(
      data.fulfilment === "DELIVERY" ? copy.delivery : copy.pickup,
    )}</p>
    ${fulfilmentDetail}
    ${
      data.preferredDate
        ? `<p style="margin:4px 0 0 0;font-size:14px;"><strong>${escapeHtml(copy.readyLabel)}:</strong> ${escapeHtml(data.preferredDate)}</p>`
        : ""
    }
    <p style="margin:22px 0 0 0;">${escapeHtml(copy.closing)}</p>
    ${data.orderUrl ? button(copy.cta, data.orderUrl) : ""}
    <p style="margin:16px 0 0 0;color:${BRAND.muted};">${escapeHtml(copy.signOff)}</p>`;

  return {
    subject:
      data.locale === "no"
        ? `Ordrebekreftelse ${data.orderNumber} — Lilyy Bakers`
        : `Order confirmation ${data.orderNumber} — Lilyy Bakers`,
    html: renderLayout({
      preheader: `${copy.orderLabel} ${data.orderNumber}`,
      heading:
        data.locale === "no" ? `Takk for bestillingen, ${data.customerName}!` : `Thank you, ${data.customerName}!`,
      body,
    }),
    text: [
      copy.greeting(data.customerName),
      copy.thanks,
      "",
      `${copy.orderLabel}: ${data.orderNumber}`,
      ...data.items.map((item) => `${itemName(item)} x${item.quantity} — ${item.lineTotal}`),
      "",
      `${copy.totalLabel}: ${data.total}`,
      `${copy.fulfilmentLabel}: ${data.fulfilment === "DELIVERY" ? copy.delivery : copy.pickup}`,
      data.fulfilment === "DELIVERY"
        ? data.deliveryAddress
          ? `${copy.deliveryTo}: ${data.deliveryAddress}`
          : ""
        : data.pickupLocation
          ? `${copy.collectFrom}: ${data.pickupLocation}`
          : "",
      data.preferredDate ? `${copy.readyLabel}: ${data.preferredDate}` : "",
      data.orderUrl ? data.orderUrl : "",
      copy.closing,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  };
}

export type OrderNotificationData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfilment: "DELIVERY" | "PICKUP";
  preferredDate?: string;
  deliveryAddress?: string;
  pickupLocation?: string;
  deliveryNotes?: string;
  items: OrderEmailItem[];
  subtotal: string;
  deliveryFee: string;
  total: string;
  adminUrl: string;
  locale?: MailLocale;
};

/** Internal "new order" mail — sent to the bakery inbox, always in English. */
export function orderNotificationTemplate(data: OrderNotificationData) {
  const itemName = (item: OrderEmailItem) => (data.locale === "no" ? item.nameNo : item.nameEn);

  const rows = data.items
    .map(
      (item) => `<tr>
        <td style="${cell}">${escapeHtml(itemName(item))} × ${item.quantity}</td>
        <td style="${cell}text-align:right;white-space:nowrap;">${escapeHtml(item.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const detail = [
    ["Customer", data.customerName],
    ["Email", data.customerEmail],
    ["Phone", data.customerPhone],
    ["Fulfilment", data.fulfilment === "DELIVERY" ? "Delivery" : "Collection"],
    data.preferredDate ? ["Requested date", data.preferredDate] : null,
    data.fulfilment === "DELIVERY"
      ? ["Address", data.deliveryAddress ?? "—"]
      : ["Collection point", data.pickupLocation ?? "—"],
  ]
    .filter((entry): entry is [string, string] => Array.isArray(entry))
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:${BRAND.muted};font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0;font-size:13px;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const body = `
    <p style="margin:0 0 16px 0;">A new order just came through the shop.</p>
    <p style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">Order</p>
    <p style="margin:0 0 16px 0;font-size:19px;">${escapeHtml(data.orderNumber)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">${detail}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
      <tr>
        <td style="${cell}color:${BRAND.muted};">Subtotal</td>
        <td style="${cell}text-align:right;white-space:nowrap;color:${BRAND.muted};">${escapeHtml(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="${cell}color:${BRAND.muted};">Delivery</td>
        <td style="${cell}text-align:right;white-space:nowrap;color:${BRAND.muted};">${escapeHtml(data.deliveryFee)}</td>
      </tr>
      <tr>
        <td style="padding:14px 0 0 0;font-size:15px;font-weight:bold;">Total</td>
        <td style="padding:14px 0 0 0;text-align:right;font-size:15px;font-weight:bold;white-space:nowrap;">${escapeHtml(data.total)}</td>
      </tr>
    </table>
    ${
      data.deliveryNotes
        ? `<p style="margin:20px 0 0 0;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(data.deliveryNotes)}</p>`
        : ""
    }
    ${button("Open in the admin panel", data.adminUrl)}`;

  return {
    subject: `New order ${data.orderNumber} — ${data.total}`,
    html: renderLayout({
      preheader: `${data.customerName} · ${data.fulfilment === "DELIVERY" ? "delivery" : "collection"}`,
      heading: "New order received",
      body,
    }),
    text: [
      `New order ${data.orderNumber}`,
      "",
      `Customer: ${data.customerName}`,
      `Email: ${data.customerEmail}`,
      `Phone: ${data.customerPhone}`,
      `Fulfilment: ${data.fulfilment === "DELIVERY" ? "Delivery" : "Collection"}`,
      data.preferredDate ? `Requested date: ${data.preferredDate}` : "",
      data.fulfilment === "DELIVERY"
        ? `Address: ${data.deliveryAddress ?? "—"}`
        : `Collection point: ${data.pickupLocation ?? "—"}`,
      "",
      ...data.items.map((item) => `${itemName(item)} x${item.quantity} — ${item.lineTotal}`),
      "",
      `Subtotal: ${data.subtotal}`,
      `Delivery: ${data.deliveryFee}`,
      `Total: ${data.total}`,
      data.deliveryNotes ? `Notes: ${data.deliveryNotes}` : "",
      "",
      data.adminUrl,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  };
}

const STATUS_COPY: Record<
  OrderStatusValue,
  { en: { label: string; line: string }; no: { label: string; line: string } }
> = {
  PENDING: {
    en: { label: "Order received", line: "We have your order and will confirm it shortly." },
    no: { label: "Ordre mottatt", line: "Vi har mottatt ordren og bekrefter den snart." },
  },
  CONFIRMED: {
    en: {
      label: "Order confirmed",
      line: "We have confirmed your order and reserved time in the bakery.",
    },
    no: { label: "Ordre bekreftet", line: "Vi har bekreftet ordren og satt av tid i bakeriet." },
  },
  BAKING: {
    en: { label: "In the oven", line: "Your order is baking right now — the kitchen smells wonderful." },
    no: { label: "I ovnen", line: "Ordren din står i ovnen nå — det lukter nydelig i bakeriet." },
  },
  READY: {
    en: { label: "Ready", line: "Your order is packed and ready for handover." },
    no: { label: "Klar", line: "Ordren din er pakket og klar for overlevering." },
  },
  OUT_FOR_DELIVERY: {
    en: { label: "On its way", line: "Our driver has left the bakery with your order." },
    no: { label: "På vei", line: "Sjåføren vår har forlatt bakeriet med ordren din." },
  },
  DELIVERED: {
    en: { label: "Delivered", line: "Your order has been delivered. We hope every bite is lovely." },
    no: { label: "Levert", line: "Ordren din er levert. Vi håper hver bit smaker." },
  },
  CANCELLED: {
    en: { label: "Cancelled", line: "We have cancelled this order. If you already paid, a refund follows." },
    no: { label: "Kansellert", line: "Vi har kansellert ordren. Har du betalt, kommer refusjonen." },
  },
  REFUNDED: {
    en: { label: "Refunded", line: "This order has been refunded to your original payment method." },
    no: { label: "Refundert", line: "Ordren er refundert til den opprinnelige betalingsmåten din." },
  },
};

export type OrderStatusEmailData = {
  orderNumber: string;
  customerName: string;
  status: OrderStatusValue;
  total: string;
  fulfilment: "DELIVERY" | "PICKUP";
  preferredDate?: string;
  deliveryAddress?: string;
  pickupLocation?: string;
  orderUrl: string;
  locale?: MailLocale;
};

/** Customer-facing "your order moved" mail for every workflow step. */
export function orderStatusTemplate(data: OrderStatusEmailData) {
  const locale = data.locale ?? "en";
  const isNo = locale === "no";
  const copy = STATUS_COPY[data.status][locale];

  const labels = {
    greeting: isNo ? `Hei ${data.customerName},` : `Hi ${data.customerName},`,
    order: isNo ? "Ordre" : "Order",
    total: isNo ? "Totalt" : "Total",
    date: isNo ? "Ønsket dato" : "Requested date",
    fulfilment: isNo ? "Levering" : "Fulfilment",
    delivery: isNo ? "Levering" : "Delivery",
    pickup: isNo ? "Henting" : "Collection",
    address: data.fulfilment === "DELIVERY" ? (isNo ? "Leveres til" : "Delivering to") : isNo ? "Hentested" : "Collection point",
    cta: isNo ? "Se bestillingen" : "View your order",
    help: isNo ? "Svar på denne e-posten hvis du lurer på noe." : "Reply to this email if you have any questions.",
  };

  const address = data.fulfilment === "DELIVERY" ? data.deliveryAddress : data.pickupLocation;

  const body = `
    <p style="margin:0 0 14px 0;">${escapeHtml(labels.greeting)}</p>
    <p style="margin:0 0 18px 0;">${escapeHtml(copy.line)}</p>
    <p style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(labels.order)}</p>
    <p style="margin:0 0 14px 0;font-size:18px;">${escapeHtml(data.orderNumber)}</p>
    <p style="margin:0 0 4px 0;font-size:14px;"><strong>${escapeHtml(labels.total)}:</strong> ${escapeHtml(data.total)}</p>
    <p style="margin:0;font-size:14px;"><strong>${escapeHtml(labels.fulfilment)}:</strong> ${escapeHtml(
      data.fulfilment === "DELIVERY" ? labels.delivery : labels.pickup,
    )}</p>
    ${
      address
        ? `<p style="margin:4px 0 0 0;color:${BRAND.muted};font-size:13px;">${escapeHtml(labels.address)}: ${escapeHtml(address)}</p>`
        : ""
    }
    ${
      data.preferredDate
        ? `<p style="margin:4px 0 0 0;font-size:14px;"><strong>${escapeHtml(labels.date)}:</strong> ${escapeHtml(data.preferredDate)}</p>`
        : ""
    }
    ${button(labels.cta, data.orderUrl)}
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">${escapeHtml(labels.help)}</p>`;

  return {
    subject: `${labels.order} ${data.orderNumber} — ${copy.label}`,
    html: renderLayout({ preheader: copy.line, heading: copy.label, body }),
    text: [
      labels.greeting,
      copy.line,
      "",
      `${labels.order}: ${data.orderNumber}`,
      `${labels.total}: ${data.total}`,
      data.preferredDate ? `${labels.date}: ${data.preferredDate}` : "",
      data.orderUrl,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  };
}

export type TestEmailData = {
  to: string;
  mailHost: string;
  sentAt?: Date;
};

export function testEmailTemplate(data: TestEmailData) {
  const sentAt = data.sentAt ?? new Date();
  const rows = [
    ["Recipient", data.to],
    ["SMTP host", data.mailHost],
    ["Sent at", sentAt.toISOString()],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="${cell}color:${BRAND.muted};width:40%;">${escapeHtml(label)}</td><td style="${cell}">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    subject: "Email delivery test — Lilyy Bakers",
    html: renderLayout({
      preheader: "Your Lilyy Bakers mail transport is working.",
      heading: "Email delivery test",
      body: `<p style="margin:0 0 16px 0;">This message confirms that the bakery can reach its SMTP server and send mail.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <p style="margin:18px 0 0 0;color:${BRAND.muted};font-size:13px;">If you did not trigger this test, you can safely ignore it.</p>`,
    }),
    text: [
      "Lilyy Bakers — email delivery test",
      `Recipient: ${data.to}`,
      `SMTP host: ${data.mailHost}`,
      `Sent at: ${sentAt.toISOString()}`,
    ].join("\n"),
  };
}

export type SupportAckData = {
  name: string;
  subject: string;
  message: string;
  locale?: MailLocale;
  kind?: "support" | "contact";
};

export function supportAckTemplate(data: SupportAckData) {
  const isNo = data.locale === "no";
  const isContact = data.kind === "contact";

  const heading = isNo
    ? isContact
      ? "Takk for meldingen"
      : "Vi har mottatt henvendelsen din"
    : isContact
      ? "Thanks for getting in touch"
      : "We have received your message";

  const intro = isNo
    ? `Hei ${data.name}, takk for at du kontaktet oss. Vi svarer vanligvis innen én virkedag.`
    : `Hi ${data.name}, thanks for reaching out. We usually reply within one business day.`;

  const quotedLabel = isNo ? "Din melding" : "Your message";

  const body = `
    <p style="margin:0 0 16px 0;">${escapeHtml(intro)}</p>
    <p style="margin:0 0 4px 0;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(quotedLabel)}</p>
    <p style="margin:0 0 8px 0;font-size:14px;"><strong>${escapeHtml(data.subject)}</strong></p>
    <div style="margin:0;padding:14px 16px;background:${BRAND.cream};border-left:3px solid ${BRAND.gold};font-size:14px;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
    <p style="margin:20px 0 0 0;color:${BRAND.muted};font-size:13px;">${escapeHtml(
      isNo
        ? "Du kan svare direkte på denne e-posten for å legge til mer informasjon."
        : "You can reply directly to this email to add anything else.",
    )}</p>`;

  return {
    subject: isNo ? `Vi har mottatt meldingen din — ${data.subject}` : `We have received your message — ${data.subject}`,
    html: renderLayout({ preheader: intro, heading, body }),
    text: [intro, "", `${quotedLabel}: ${data.subject}`, data.message].join("\n"),
  };
}



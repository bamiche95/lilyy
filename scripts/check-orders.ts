import { readFileSync } from "node:fs";

import { orderStatusTemplate, orderConfirmationTemplate, orderNotificationTemplate } from "../lib/mail-templates";
import {
  ORDER_STATUSES,
  canTransitionOrder,
  earliestFulfilmentDate,
  isPreferredDateAllowed,
  nextOrderStatuses,
  orderTotals,
  PICKUP_POINT,
  startOfDay,
  type OrderStatusValue,
} from "../lib/orders";
import { checkoutItemSchema, checkoutSchema, fieldErrors } from "../lib/validation";

const results: [string, boolean, string][] = [];
const check = (label: string, ok: boolean, detail = "") => results.push([label, ok, detail]);

// --- workflow graph --------------------------------------------------------
check("pending may be confirmed", canTransitionOrder("PENDING", "CONFIRMED"));
check("pending may be cancelled", canTransitionOrder("PENDING", "CANCELLED"));
check("pending may not jump to delivered", !canTransitionOrder("PENDING", "DELIVERED"));
check("no status moves backwards", !canTransitionOrder("DELIVERED", "BAKING"));
check("no self transition", !canTransitionOrder("READY", "READY"));
check("refunded is terminal", nextOrderStatuses("REFUNDED").length === 0);

const known = new Set<string>(ORDER_STATUSES);
const danglingEdges = ORDER_STATUSES.flatMap((from) =>
  nextOrderStatuses(from).filter((to) => !known.has(to)),
);
check("every transition points at a real status", danglingEdges.length === 0, danglingEdges.join(","));

const reachable = new Set(ORDER_STATUSES.flatMap((from) => nextOrderStatuses(from)));
const unreachable = ORDER_STATUSES.filter((status) => status !== "PENDING" && !reachable.has(status));
check("every status is reachable from pending", unreachable.length === 0, unreachable.join(","));

// --- money -----------------------------------------------------------------
const delivery = orderTotals(130, "DELIVERY");
check(
  "delivery under the threshold adds the fee",
  delivery.deliveryFeeNok === 79 && delivery.totalNok === 209,
  JSON.stringify(delivery),
);

const freeDelivery = orderTotals(500, "DELIVERY");
check("free delivery from the threshold", freeDelivery.deliveryFeeNok === 0, JSON.stringify(freeDelivery));

const pickup = orderTotals(130, "PICKUP");
check("pickup never pays delivery", pickup.deliveryFeeNok === 0 && pickup.totalNok === 130);

check("empty baskets are not charged delivery", orderTotals(0, "DELIVERY").deliveryFeeNok === 0);
check("totals round to øre", orderTotals(0.1 + 0.2, "PICKUP").totalNok === 0.3);

// --- bake dates ------------------------------------------------------------
const now = new Date(2026, 10, 17, 15, 0, 0); // Tue 17 Nov 2026, 15:00 local
const tomorrow = earliestFulfilmentDate(24, now);
check(
  "a 24h cake ordered at 15:00 is ready tomorrow",
  tomorrow.getTime() === startOfDay(new Date(2026, 10, 18)).getTime(),
  tomorrow.toDateString(),
);
check(
  "a same-day bake is ready today",
  earliestFulfilmentDate(0, now).getTime() === startOfDay(now).getTime(),
);
check(
  "garbage lead times fall back to today",
  earliestFulfilmentDate(Number.NaN, now).getTime() === startOfDay(now).getTime(),
);

check("a later date is allowed", isPreferredDateAllowed(new Date(2026, 10, 19, 12), tomorrow, now));
check(
  "a date before the lead time is refused",
  !isPreferredDateAllowed(new Date(2026, 10, 17, 9), tomorrow, now),
);
check(
  "beyond the booking window is refused",
  !isPreferredDateAllowed(new Date(2026, 10, 17 + 91), tomorrow, now),
);
check(
  "the last day inside the window is allowed",
  isPreferredDateAllowed(new Date(2026, 10, 17 + 90), tomorrow, now),
);
check("an invalid date is refused", !isPreferredDateAllowed(new Date("nope"), tomorrow, now));

// --- checkout form validation ----------------------------------------------
// `placeOrder` trusts nothing the browser posts; these are the guards it leans
// on, so a tampered basket or a half-filled address never reaches the database.
const validCheckout = {
  customerName: "Ingrid Hansen",
  customerEmail: "ingrid@example.com",
  customerPhone: "+47 912 34 567",
  fulfilment: "DELIVERY" as const,
  deliveryAddress: "Prøvegata 1",
  deliveryCity: "Oslo",
  deliveryPostalCode: "0150",
  items: [{ productId: "prod_1", quantity: 2 }],
};

const checkoutIssues = (input: unknown) => {
  const result = checkoutSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

const completeCheckout = checkoutSchema.safeParse(validCheckout);
check("a complete delivery order validates", completeCheckout.success);
check(
  "delivery without a street address is refused",
  checkoutIssues({ ...validCheckout, deliveryAddress: undefined }).includes("deliveryAddress"),
);
check(
  "delivery without a city is refused",
  checkoutIssues({ ...validCheckout, deliveryCity: "  " }).includes("deliveryCity"),
);
check(
  "delivery without a postal code is refused",
  checkoutIssues({ ...validCheckout, deliveryPostalCode: undefined }).includes("deliveryPostalCode"),
);
check(
  "pickup needs no address",
  checkoutSchema.safeParse({
    ...validCheckout,
    fulfilment: "PICKUP",
    deliveryAddress: undefined,
    deliveryCity: undefined,
    deliveryPostalCode: undefined,
  }).success,
);

check("an empty basket is refused", !checkoutSchema.safeParse({ ...validCheckout, items: [] }).success);
check(
  "more than 40 lines is refused",
  !checkoutSchema.safeParse({
    ...validCheckout,
    items: Array.from({ length: 41 }, (_, index) => ({ productId: `prod_${index}`, quantity: 1 })),
  }).success,
);
check(
  "a line needs at least one item",
  !checkoutItemSchema.safeParse({ productId: "prod_1", quantity: 0 }).success,
);
check(
  "a line is capped at 50",
  checkoutItemSchema.safeParse({ productId: "prod_1", quantity: 50 }).success &&
    !checkoutItemSchema.safeParse({ productId: "prod_1", quantity: 51 }).success,
);
check(
  "a line needs a product",
  !checkoutItemSchema.safeParse({ productId: "", quantity: 1 }).success,
);
check(
  "a malformed email is refused",
  checkoutIssues({ ...validCheckout, customerEmail: "not-an-email" }).includes("customerEmail"),
);
check(
  "a too-short phone number is refused",
  checkoutIssues({ ...validCheckout, customerPhone: "12" }).includes("customerPhone"),
);
check(
  "a one-letter name is refused",
  checkoutIssues({ ...validCheckout, customerName: "X" }).includes("customerName"),
);

const datedCheckout = checkoutSchema.safeParse({ ...validCheckout, preferredDate: "2026-11-20" });
check(
  "a bake date arrives as a Date",
  datedCheckout.success && datedCheckout.data.preferredDate?.toISOString().startsWith("2026-11-20") === true,
);
const blankDate = checkoutSchema.safeParse({ ...validCheckout, preferredDate: "" });
check(
  "a blank bake date is simply absent",
  blankDate.success && blankDate.data.preferredDate === undefined,
);

// The action turns Zod issues into a `{ field: message }` map the form renders
// inline, so each complaint has to land on the input the customer must fix.
const checkoutErrorMap = (input: unknown) => {
  const result = checkoutSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
};

const addressErrors = checkoutErrorMap({
  ...validCheckout,
  deliveryAddress: undefined,
  deliveryCity: undefined,
  deliveryPostalCode: undefined,
});
check(
  "every missing address part gets its own message",
  ["deliveryAddress", "deliveryCity", "deliveryPostalCode"].every((field) => addressErrors[field]),
  Object.keys(addressErrors).join(","),
);
check(
  "an email complaint lands on the email input",
  Object.keys(checkoutErrorMap({ ...validCheckout, customerEmail: "nope" })).join(",") === "customerEmail",
);
check(
  "one message per field, not one per rule",
  [...Object.values(checkoutErrorMap({ ...validCheckout, customerName: "X" }))].length === 1,
);
check(
  "a broken basket points at the basket",
  Object.keys(checkoutErrorMap({ ...validCheckout, items: "nope" })).includes("items"),
);

// --- checkout mails --------------------------------------------------------
// These two mails leave the building the moment an order is stored, so every
// fact the customer and the bakery need must survive both the html and text
// parts — and hostile input must not become markup.
const mailItems = [
  { nameEn: "Cinnamon bun", nameNo: "Kanelbolle", quantity: 2, lineTotal: "NOK 130.00" },
  { nameEn: "Cardamom cake", nameNo: "Kardemummekake", quantity: 1, lineTotal: "NOK 420.00" },
];

const confirmationFor = (locale: "en" | "no", fulfilment: "DELIVERY" | "PICKUP") =>
  orderConfirmationTemplate({
    orderNumber: "LY-261117-K7Q2",
    customerName: "Ingrid <b>Hansen</b>",
    total: "NOK 629.00",
    fulfilment,
    preferredDate: "20 November 2026",
    deliveryAddress: fulfilment === "DELIVERY" ? "Prøvegata 1, 0150 Oslo" : undefined,
    pickupLocation: fulfilment === "PICKUP" ? PICKUP_POINT[locale] : undefined,
    items: mailItems,
    orderUrl: `https://lilyy.no/${locale}/orders/tok123`,
    locale,
  });

const notificationFor = (options: { fulfilment?: "DELIVERY" | "PICKUP"; notes?: string } = {}) => {
  const fulfilment = options.fulfilment ?? "DELIVERY";
  return orderNotificationTemplate({
    orderNumber: "LY-261117-K7Q2",
    customerName: "Ingrid Hansen",
    customerEmail: "ingrid@example.com",
    customerPhone: "+47 912 34 567",
    fulfilment,
    preferredDate: "20 November 2026",
    deliveryAddress: fulfilment === "DELIVERY" ? "Prøvegata 1, 0150 Oslo" : undefined,
    pickupLocation: fulfilment === "PICKUP" ? PICKUP_POINT.en : undefined,
    deliveryNotes: options.notes,
    items: mailItems,
    subtotal: "NOK 550.00",
    deliveryFee: "NOK 79.00",
    total: "NOK 629.00",
    adminUrl: "https://lilyy.no/en/admin/orders/ord_1",
    locale: "en",
  });
};

const confirmationChecks: [string, boolean, string][] = [];

for (const locale of ["en", "no"] as const) {
  const confirmDelivery = confirmationFor(locale, "DELIVERY");
  const confirmPickup = confirmationFor(locale, "PICKUP");
  const greeting = locale === "no" ? "Hei Ingrid" : "Hi Ingrid";
  const itemName = (item: (typeof mailItems)[number]) => (locale === "no" ? item.nameNo : item.nameEn);
  const deliveryLabel = locale === "no" ? "Leveres til" : "Delivering to";
  const collectLabel = locale === "no" ? "Hentested" : "Collection point";
  const orderUrl = `https://lilyy.no/${locale}/orders/tok123`;

  confirmationChecks.push([
    `${locale} confirmation names the order in the subject`,
    confirmDelivery.subject.includes("LY-261117-K7Q2"),
    confirmDelivery.subject,
  ]);
  confirmationChecks.push([
    `${locale} confirmation greets the customer`,
    confirmDelivery.html.includes(greeting) && confirmDelivery.text.startsWith(greeting),
    "",
  ]);
  confirmationChecks.push([
    `${locale} confirmation escapes the customer name`,
    confirmDelivery.html.includes("Ingrid &lt;b&gt;Hansen&lt;/b&gt;") &&
      !confirmDelivery.html.includes("Ingrid <b>Hansen</b>"),
    "",
  ]);
  confirmationChecks.push([
    `${locale} confirmation lists every line with quantity and total`,
    mailItems.every(
      (item) =>
        confirmDelivery.html.includes(`${itemName(item)} × ${item.quantity}`) &&
        confirmDelivery.text.includes(`${itemName(item)} x${item.quantity} — ${item.lineTotal}`),
    ),
    "",
  ]);
  confirmationChecks.push([
    `${locale} confirmation states the order total`,
    confirmDelivery.html.includes("NOK 629.00") && confirmDelivery.text.includes("NOK 629.00"),
    "",
  ]);
  confirmationChecks.push([
    `${locale} confirmation carries the order link in both parts`,
    confirmDelivery.html.includes(orderUrl) && confirmDelivery.text.includes(orderUrl),
    "",
  ]);
  confirmationChecks.push([
    `${locale} confirmation shows the requested bake date`,
    confirmDelivery.html.includes("20 November 2026") && confirmDelivery.text.includes("20 November 2026"),
    "",
  ]);
  confirmationChecks.push([
    `${locale} delivery confirmation shows the address`,
    confirmDelivery.html.includes(deliveryLabel) && confirmDelivery.html.includes("Prøvegata 1, 0150 Oslo"),
    "",
  ]);
  confirmationChecks.push([
    `${locale} pickup confirmation shows the counter instead of an address`,
    confirmPickup.html.includes(collectLabel) &&
      confirmPickup.html.includes(PICKUP_POINT[locale]) &&
      !confirmPickup.html.includes(deliveryLabel),
    "",
  ]);
  confirmationChecks.push([
    `${locale} confirmation has no blank or broken placeholders`,
    [confirmDelivery.html, confirmDelivery.text, confirmPickup.html, confirmPickup.text].every(
      (part) => !part.includes("undefined") && !part.includes("NaN") && !part.includes("[object Object]"),
    ),
    "",
  ]);
}

const confirmationFailures = confirmationChecks.filter(([, ok]) => !ok);
check(
  "the confirmation mail is complete in both languages and both fulfilments",
  confirmationFailures.length === 0,
  confirmationFailures.map(([label]) => label).join(" | "),
);

const notification = notificationFor();
const notificationWithNotes = notificationFor({ notes: "Leave at the side door" });
const notificationPickup = notificationFor({ fulfilment: "PICKUP" });

check(
  "the bakery notice names the order and total in the subject",
  notification.subject.includes("LY-261117-K7Q2") && notification.subject.includes("NOK 629.00"),
  notification.subject,
);
check(
  "the bakery notice carries the customer's contact details",
  ["Ingrid Hansen", "ingrid@example.com", "+47 912 34 567"].every(
    (value) => notification.html.includes(value) && notification.text.includes(value),
  ),
);
check(
  "the bakery notice splits subtotal, delivery and total in both parts",
  ["NOK 550.00", "NOK 79.00", "NOK 629.00"].every(
    (value) => notification.html.includes(value) && notification.text.includes(value),
  ),
);
check(
  "the bakery notice links straight to the order in the admin panel",
  notification.html.includes("/en/admin/orders/ord_1") &&
    notification.text.includes("/en/admin/orders/ord_1") &&
    notification.html.includes("Open in the admin panel"),
);
check(
  "kitchen notes reach the bakery only when the customer left them",
  notificationWithNotes.html.includes("Leave at the side door") &&
    notificationWithNotes.text.includes("Notes: Leave at the side door") &&
    !notification.text.includes("Notes:"),
);
check(
  "a pickup notice shows the counter, never a delivery address",
  notificationPickup.html.includes("Collection point") &&
    notificationPickup.html.includes(PICKUP_POINT.en) &&
    !notificationPickup.html.includes("Address"),
);
check(
  "the bakery notice has no blank or broken placeholders",
  [notification, notificationWithNotes, notificationPickup].every(
    (message) =>
      ![message.html, message.text].some(
        (part) => part.includes("undefined") || part.includes("NaN") || part.includes("[object Object]"),
      ),
  ),
);

// --- status mail -----------------------------------------------------------
const mailChecks: [string, boolean, string][] = [];

for (const status of ORDER_STATUSES) {
  for (const locale of ["en", "no"] as const) {
    const message = orderStatusTemplate({
      orderNumber: "LB-2026-0042",
      customerName: "Ingrid",
      status: status as OrderStatusValue,
      total: "NOK 209.00",
      fulfilment: "DELIVERY",
      preferredDate: "20.11.2026",
      deliveryAddress: "Gate Street 1, 0150 Oslo",
      orderUrl: `https://lilyy.no/${locale}/orders/tok123`,
      locale,
    });

    const greeting = locale === "no" ? "Hei Ingrid" : "Hi Ingrid";

    mailChecks.push([
      `${locale} ${status}: subject names the order`,
      message.subject.includes("LB-2026-0042"),
      message.subject,
    ]);
    mailChecks.push([
      `${locale} ${status}: html greets and addresses`,
      message.html.includes(greeting) && message.html.includes("Gate Street 1"),
      "",
    ]);
    mailChecks.push([
      `${locale} ${status}: both parts carry the order link`,
      message.html.includes(`/${locale}/orders/tok123`) &&
        message.text.includes(`/${locale}/orders/tok123`),
      "",
    ]);
    mailChecks.push([
      `${locale} ${status}: no undefined placeholders`,
      !message.text.includes("undefined") && !message.html.includes("undefined"),
      "",
    ]);
  }
}

const pickupMail = orderStatusTemplate({
  orderNumber: "LB-2026-0043",
  customerName: "Ingrid",
  status: "READY",
  total: "NOK 130.00",
  fulfilment: "PICKUP",
  pickupLocation: "Lilyy Bakers counter, Oslo",
  orderUrl: "https://lilyy.no/en/orders/tok456",
  locale: "en",
});
check(
  "pickup mail shows the collection point",
  pickupMail.html.includes("Lilyy Bakers counter, Oslo") && !pickupMail.html.includes("Delivering to"),
);

const mailFailures = mailChecks.filter(([, ok]) => !ok);
check(
  "every status sends a well-formed mail in both languages",
  mailFailures.length === 0,
  mailFailures.map(([label]) => label).join(" | "),
);

// --- dictionary parity -----------------------------------------------------
type Dictionary = {
  orderStatus: Record<string, string>;
  order: Record<string, unknown>;
  adminOrders: Record<string, unknown>;
};

const dictionary = (locale: string) =>
  JSON.parse(readFileSync(new URL(`../dictionaries/${locale}.json`, import.meta.url), "utf8")) as Dictionary;

const dictionaries = { en: dictionary("en"), no: dictionary("no") };
const locales = ["en", "no"] as const;

const missingStatusLabels = ORDER_STATUSES.flatMap((status) =>
  locales.filter((locale) => !dictionaries[locale].orderStatus[status]).map((locale) => `${locale}:${status}`),
);
check("both dictionaries label every status", missingStatusLabels.length === 0, missingStatusLabels.join(","));

const requiredKeys: [keyof Dictionary, string][] = [
  ["order", "notFound"],
  ["order", "notFoundBody"],
  ["adminOrders", "title"],
  ["adminOrders", "forbidden"],
  ["adminOrders", "notFound"],
  ["adminOrders", "illegalTransition"],
  ["adminOrders", "error"],
  ["adminOrders", "statusTitle"],
  ["adminOrders", "publicLink"],
];

const missingKeys = requiredKeys.flatMap(([section, key]) =>
  locales
    .filter((locale) => !dictionaries[locale][section][key])
    .map((locale) => `${locale}:${section}.${key}`),
);
check("order pages have their dictionary keys", missingKeys.length === 0, missingKeys.join(","));

const passed = results.filter(([, ok]) => ok).length;
for (const [label, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}
console.log(`\n${passed}/${results.length} order checks passed`);
if (passed !== results.length) process.exitCode = 1;

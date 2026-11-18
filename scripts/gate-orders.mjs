/**
 * Runtime gate for Phase 3 — checkout, order confirmation and admin orders.
 *
 *   npm run gate:orders
 *
 * Run against a running server (default http://localhost:3000) and the same
 * database it talks to. The basket only exists in the browser, so the gate
 * plants one throwaway PENDING order as a fixture and deletes it again; the
 * throwaway customer is created through the auth API, like gate:shop does.
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.GATE_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

const prisma = new PrismaClient();

function createJar() {
  const cookies = new Map();

  return {
    header: () => [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
    absorb(response) {
      const raw =
        typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];

      for (const cookie of raw) {
        const [pair] = cookie.split(";");
        const index = pair.indexOf("=");
        if (index < 0) continue;

        const name = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();

        if (value === "") cookies.delete(name);
        else cookies.set(name, value);
      }
    },
  };
}

async function call(path, options = {}) {
  const { method = "GET", body, jar, headers: extra = {} } = options;

  const headers = { origin: BASE, ...extra };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar && jar.header()) headers.cookie = jar.header();

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });

  jar?.absorb(response);

  const text = await response.text();

  return { status: response.status, text, location: response.headers.get("location") ?? "" };
}

const results = [];
const check = (label, ok, detail = "") => {
  results.push([label, Boolean(ok)]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

async function signIn(jar, email, password) {
  return call("/api/auth/sign-in/email", { method: "POST", body: { email, password }, jar });
}

/** A PENDING delivery order with one line, deleted again at the end. */
async function plantFixture() {
  const preferredDate = new Date();
  preferredDate.setDate(preferredDate.getDate() + 3);

  return prisma.order.create({
    data: {
      orderNumber: `GATE-ORDERS-${Date.now()}`,
      customerName: "Gate Orders Customer",
      customerEmail: "gate-orders@example.com",
      customerPhone: "+47 400 00 000",
      fulfilment: "DELIVERY",
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "CARD",
      subtotal: 130,
      deliveryFee: 79,
      total: 209,
      currency: "NOK",
      locale: "en",
      deliveryAddress: "Gate Street 1",
      deliveryCity: "Oslo",
      deliveryPostalCode: "0150",
      deliveryNotes: "Gate fixture — safe to ignore.",
      preferredDate,
      items: {
        create: [
          {
            nameEn: "Gate Cinnamon Bun",
            nameNo: "Gate kanelbolle",
            unitPrice: 65,
            quantity: 2,
            lineTotal: 130,
          },
        ],
      },
    },
  });
}

let fixture = null;
// The throwaway customer this run signs up, deleted again in `finally` so
// repeated runs don't litter the auth tables.
let gateCustomerEmail = null;

try {
  console.log(`Orders gate target: ${BASE}\n`);
  fixture = await plantFixture();

  // --- Authorisation --------------------------------------------------------
  const anonAdmin = await call("/en/admin/orders");
  check(
    "anonymous admin orders → sign-in redirect",
    anonAdmin.status === 307 && anonAdmin.location.includes("/auth/sign-in"),
    `status ${anonAdmin.status} → ${anonAdmin.location}`,
  );

  const customerJar = createJar();
  gateCustomerEmail = `gate-orders-${Date.now()}@example.com`;
  const customer = await call("/api/auth/sign-up/email", {
    method: "POST",
    body: {
      name: "Gate Orders Customer",
      email: gateCustomerEmail,
      password: "Gate-Customer-Pass-2026",
    },
    jar: customerJar,
  });
  check("customer sign-up succeeds", customer.status === 200, `status ${customer.status}`);

  const customerAdmin = await call("/en/admin/orders", { jar: customerJar });
  check(
    "customer cannot open admin orders",
    customerAdmin.status === 307 && !customerAdmin.location.includes("/auth/"),
    `status ${customerAdmin.status} → ${customerAdmin.location}`,
  );

  const adminJar = createJar();
  const adminSession = await signIn(adminJar, ADMIN_EMAIL, ADMIN_PASSWORD);
  check("admin sign-in succeeds", adminSession.status === 200, `status ${adminSession.status}`);

  // --- Admin list -----------------------------------------------------------
  const adminList = await call("/en/admin/orders", { jar: adminJar });
  check(
    "admin order list → 200 with the fixture order",
    adminList.status === 200 && adminList.text.includes(fixture.orderNumber),
    `status ${adminList.status}`,
  );
  check(
    "order list renders the status filter",
    adminList.text.includes("/en/admin/orders?status=PENDING") &&
      adminList.text.includes("All statuses"),
  );
  check(
    "admin nav links the two wings",
    adminList.text.includes('href="/en/admin/products"') &&
      adminList.text.includes('href="/en/admin/orders"'),
  );

  const filtered = await call("/en/admin/orders?status=CANCELLED", { jar: adminJar });
  check(
    "status filter narrows the table",
    filtered.status === 200 && !filtered.text.includes(fixture.orderNumber),
    `status ${filtered.status}`,
  );

  const bogusFilter = await call("/en/admin/orders?status=NOT_A_STATUS", { jar: adminJar });
  check(
    "unknown status filter falls back to all orders",
    bogusFilter.status === 200 && bogusFilter.text.includes(fixture.orderNumber),
    `status ${bogusFilter.status}`,
  );

  const adminListNo = await call("/no/admin/orders", { jar: adminJar });
  check(
    "Norwegian order list → 200",
    adminListNo.status === 200 && adminListNo.text.includes("Bestillinger"),
    `status ${adminListNo.status}`,
  );

  // --- Admin detail ---------------------------------------------------------
  const detail = await call(`/en/admin/orders/${fixture.id}`, { jar: adminJar });
  check(
    "admin order detail → 200",
    detail.status === 200 && detail.text.includes(fixture.orderNumber),
    `status ${detail.status}`,
  );
  check(
    "detail shows the next statuses only",
    detail.text.includes('name="orderId"') &&
      detail.text.includes('value="CONFIRMED"') &&
      detail.text.includes('value="CANCELLED"') &&
      !detail.text.includes('value="DELIVERED"'),
  );
  check(
    "detail carries customer, payment and fulfilment cards",
    detail.text.includes("Gate Orders Customer") &&
      detail.text.includes("Gate Street 1") &&
      detail.text.includes("Card") &&
      detail.text.includes("Gate fixture — safe to ignore."),
  );

  const tokenMatch = detail.text.match(/\/[a-z]{2}\/orders\/([a-z0-9]{10,})/);
  const token = tokenMatch ? tokenMatch[1] : "";
  check("detail links the public confirmation page", token.length > 0, token);

  const missingOrder = await call("/en/admin/orders/does-not-exist", { jar: adminJar });
  check("unknown order id → 404", missingOrder.status === 404, `status ${missingOrder.status}`);

  // --- Public confirmation --------------------------------------------------
  const publicEn = await call(`/en/orders/${token}`);
  check(
    "public confirmation → 200",
    publicEn.status === 200 && publicEn.text.includes(fixture.orderNumber),
    `status ${publicEn.status}`,
  );
  check(
    "confirmation page is noindex",
    publicEn.text.includes("noindex"),
  );
  check(
    "confirmation shows items, totals and contact details",
    publicEn.text.includes("Gate Cinnamon Bun") &&
      publicEn.text.includes("Gate Orders Customer") &&
      publicEn.text.includes("Gate fixture — safe to ignore."),
  );
  check(
    "confirmation page leaks no admin links",
    publicEn.status === 200 && !publicEn.text.includes("/admin/"),
  );

  const publicNo = await call(`/no/orders/${token}`);
  check(
    "Norwegian confirmation → 200",
    publicNo.status === 200 && publicNo.text.includes("Bestillingen din"),
    `status ${publicNo.status}`,
  );

  const badToken = await call("/en/orders/not-a-real-token");
  check(
    "unknown token → friendly card, not a 500",
    badToken.status === 200 && badToken.text.includes("We could not find that order"),
    `status ${badToken.status}`,
  );

  // --- Checkout page --------------------------------------------------------
  const checkout = await call("/en/checkout");
  check(
    "checkout page → 200 with an empty basket",
    checkout.status === 200,
    `status ${checkout.status}`,
  );

  const checkoutNo = await call("/no/checkout");
  check(
    "Norwegian checkout → 200",
    checkoutNo.status === 200 && checkoutNo.text.includes("Kasse"),
    `status ${checkoutNo.status}`,
  );
} finally {
  if (fixture) {
    await prisma.order.delete({ where: { id: fixture.id } }).catch((error) => {
      console.error("could not remove the gate fixture", error);
    });
  }

  // Sessions and accounts cascade; the fixture order above holds no user link.
  if (gateCustomerEmail) {
    await prisma.user.delete({ where: { email: gateCustomerEmail } }).catch((error) => {
      console.error("could not remove the gate customer", error);
    });
  }

  await prisma.$disconnect();

  const passed = results.filter(([, ok]) => ok).length;
  const failed = results.length - passed;

  console.log(`\n${passed}/${results.length} checks passed`);

  if (failed > 0) {
    for (const [label] of results.filter(([, ok]) => !ok)) console.log(`  ✗ ${label}`);
    process.exitCode = 1;
  }
}

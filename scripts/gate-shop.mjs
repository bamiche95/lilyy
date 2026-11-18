/**
 * Runtime gate for Phase 2 — catalogue, cart and admin product management.
 *
 *   npm run gate:shop
 *
 * Run against a running server (default http://localhost:3000). It creates a
 * throwaway customer account and reuses ADMIN_EMAIL/ADMIN_PASSWORD.
 */
const BASE = process.env.GATE_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

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

/** Product slugs linked from a shop page, in render order. */
function productSlugs(html) {
  const slugs = [...html.matchAll(/\/[a-z]{2}\/shop\/([a-z0-9-]+)"/g)].map((match) => match[1]);
  return [...new Set(slugs)].filter((slug) => slug !== "shop");
}

async function signIn(jar, email, password) {
  return call("/api/auth/sign-in/email", { method: "POST", body: { email, password }, jar });
}

console.log(`Shop gate target: ${BASE}\n`);

// --- Public catalogue -------------------------------------------------------
const shopEn = await call("/en/shop");
check("GET /en/shop → 200", shopEn.status === 200, `status ${shopEn.status}`);
check("shop lists seeded products", shopEn.text.includes("Cinnamon Buns"));

const shopNo = await call("/no/shop");
check("GET /no/shop → 200", shopNo.status === 200, `status ${shopNo.status}`);
check("Norwegian listing copy", shopNo.text.includes("Kanelboller"));
check("NOK prices in nb-NO", /65\u00a0kr/.test(shopNo.text) || shopNo.text.includes("65 kr"));

const cakes = await call("/en/shop?category=CAKE");
const cakeSlugs = productSlugs(cakes.text);
check(
  "category filter returns cakes only",
  cakes.status === 200 && cakeSlugs.length > 0 && !cakeSlugs.includes("surdeigsbrod"),
  cakeSlugs.join(", "),
);

const search = await call("/en/shop?q=kringle");
const searchSlugs = productSlugs(search.text);
check("search narrows to one product", searchSlugs.length === 1, searchSlugs.join(", "));

const sorted = await call("/en/shop?sort=price-asc");
const prices = [...sorted.text.matchAll(/text-sm font-semibold">([^<]*\d[^<]*)</g)].map((match) =>
  Number(match[1].replace(/[^\d.]/g, "")),
);
const ascending = prices.every((price, index) => index === 0 || prices[index - 1] <= price);
check("price-asc sort is monotonic", prices.length > 1 && ascending, prices.join(" < "));

const detail = await call("/en/shop/kanelboller");
check("GET product page → 200", detail.status === 200, `status ${detail.status}`);
check(
  "product page shows ingredients, allergens and add-to-cart",
  detail.text.includes("Ingredients") &&
    detail.text.includes("gluten") &&
    detail.text.includes("Add to basket"),
);

const missing = await call("/en/shop/not-a-real-cake");
check("unknown product → 404", missing.status === 404, `status ${missing.status}`);

const cart = await call("/en/cart");
check("GET /en/cart → 200", cart.status === 200 && cart.text.includes("Your basket is empty"));

// --- Authorisation ----------------------------------------------------------
const anonUpload = await call("/api/admin/uploads", {
  method: "POST",
  body: { slug: "test", contentType: "image/jpeg" },
});
check("anonymous upload → 401", anonUpload.status === 401, `status ${anonUpload.status}`);

const anonAdmin = await call("/en/admin/products");
check(
  "anonymous admin page → sign-in redirect",
  anonAdmin.status === 307 && anonAdmin.location.includes("/auth/sign-in"),
  `status ${anonAdmin.status} → ${anonAdmin.location}`,
);

const customerJar = createJar();
const customer = await call("/api/auth/sign-up/email", {
  method: "POST",
  body: {
    name: "Gate Customer",
    email: `gate-customer-${Date.now()}@example.com`,
    password: "Gate-Customer-Pass-2026",
  },
  jar: customerJar,
});
check("customer sign-up succeeds", customer.status === 200, `status ${customer.status}`);

const customerAdmin = await call("/en/admin/products", { jar: customerJar });
check(
  "customer admin page is redirected",
  customerAdmin.status === 307 && !customerAdmin.location.includes("/auth/"),
  `status ${customerAdmin.status} → ${customerAdmin.location}`,
);

const customerUpload = await call("/api/admin/uploads", {
  method: "POST",
  body: { slug: "test", contentType: "image/jpeg" },
  jar: customerJar,
});
check("customer upload → 403", customerUpload.status === 403, `status ${customerUpload.status}`);

// --- Admin product management ----------------------------------------------
const adminJar = createJar();
const adminSession = await signIn(adminJar, ADMIN_EMAIL, ADMIN_PASSWORD);
check("admin sign-in succeeds", adminSession.status === 200, `status ${adminSession.status}`);

const adminList = await call("/en/admin/products", { jar: adminJar });
check(
  "admin product list → 200",
  adminList.status === 200 && adminList.text.includes("Cinnamon Buns"),
  `status ${adminList.status}`,
);

const productId =
  [...adminList.text.matchAll(/\/[a-z]{2}\/admin\/products\/([a-z0-9]{10,})"/g)].map(
    (match) => match[1],
  )[0] ?? "";
check("admin list links to the edit form", productId.length > 0, productId);

const editPage = await call(`/en/admin/products/${productId}`, { jar: adminJar });
check(
  "admin edit page → 200 with photo manager",
  editPage.status === 200 &&
    editPage.text.includes('name="id"') &&
    editPage.text.includes('name="images"') === false &&
    editPage.text.includes("Photos"),
  `status ${editPage.status}`,
);

const newPage = await call("/en/admin/products/new", { jar: adminJar });
check(
  "admin new-product page → 200",
  newPage.status === 200 && newPage.text.includes("Create product"),
  `status ${newPage.status}`,
);

const badUpload = await call("/api/admin/uploads", {
  method: "POST",
  body: { slug: "test", contentType: "text/plain" },
  jar: adminJar,
});
check("upload rejects non-image types", badUpload.status === 400, `status ${badUpload.status}`);

const crossOrigin = await call("/api/admin/uploads", {
  method: "POST",
  body: { slug: "test", contentType: "image/jpeg" },
  jar: adminJar,
  headers: { origin: "https://evil.example" },
});
check("upload rejects cross-origin requests", crossOrigin.status === 403, `status ${crossOrigin.status}`);

const signedUpload = await call("/api/admin/uploads", {
  method: "POST",
  body: { slug: "kanelboller", contentType: "image/jpeg" },
  jar: adminJar,
});
check(
  "admin upload is signed (or storage reports unavailable)",
  signedUpload.status === 200 || signedUpload.status === 503,
  `status ${signedUpload.status}`,
);
if (signedUpload.status === 200) {
  const ticket = JSON.parse(signedUpload.text);
  check(
    "signed URL points at the products prefix",
    typeof ticket.key === "string" && ticket.key.startsWith("products/"),
    ticket.key,
  );
}

// --- Summary ----------------------------------------------------------------
const passed = results.filter(([, ok]) => ok).length;
const failed = results.length - passed;

console.log(`\n${passed}/${results.length} checks passed`);

if (failed > 0) {
  for (const [label] of results.filter(([, ok]) => !ok)) console.log(`  ✗ ${label}`);
  process.exitCode = 1;
}


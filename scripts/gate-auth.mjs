/**
 * Runtime gate for Phase 1.
 *
 *   npx dotenv -e .env.local -- node scripts/gate-auth.mjs
 *
 * Exercises the Better Auth lifecycle, admin authorisation and the SMTP test
 * endpoint against a running server (default http://localhost:3000).
 */
const BASE = process.env.GATE_BASE_URL ?? "http://localhost:3000";

function createJar() {
  const cookies = new Map();

  return {
    header: () =>
      [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
    absorb(response) {
      const raw =
        typeof response.headers.getSetCookie === "function"
          ? response.headers.getSetCookie()
          : [];

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
  const { method = "GET", body, jar } = options;

  const headers = { origin: BASE };
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
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    payload = text.slice(0, 300);
  }

  return { status: response.status, payload };
}

function line(label, result) {
  const body = JSON.stringify(result.payload);
  console.log(`${label} → ${result.status} ${body.length > 200 ? body.slice(0, 200) + "…" : body}`);
  return result;
}

const results = [];
const check = (label, ok) => results.push([label, Boolean(ok)]);

console.log(`Gate target: ${BASE}\n`);

const customer = createJar();
/** Unique per run so the gate is repeatable against a persistent database. */
const gateEmail = process.env.GATE_EMAIL ?? `gate.user+${Date.now()}@lilyy.test`;

const signUp = line(
  "1  sign-up/email",
  await call("/api/auth/sign-up/email", {
    method: "POST",
    jar: customer,
    body: {
      email: gateEmail,
      password: "Password!123",
      name: "Gate User",
    },
  }),
);
check("sign-up returns 200", signUp.status === 200);

const afterSignUp = line("2  get-session", await call("/api/auth/get-session", { jar: customer }));
check("session present after sign-up", afterSignUp.payload?.user?.email === gateEmail);

const signOut = line(
  "3  sign-out",
  await call("/api/auth/sign-out", { method: "POST", jar: customer, body: {} }),
);
check("sign-out returns 200", signOut.status === 200);

const afterSignOut = line(
  "4  get-session (signed out)",
  await call("/api/auth/get-session", { jar: customer }),
);
check("session cleared after sign-out", afterSignOut.payload === null);

const signIn = line(
  "5  sign-in/email",
  await call("/api/auth/sign-in/email", {
    method: "POST",
    jar: customer,
    body: { email: gateEmail, password: "Password!123" },
  }),
);
check("sign-in returns 200", signIn.status === 200);

// 6. Role guard — anonymous -----------------------------------------------
const anonymous = line(
  "6  email/test (anonymous)",
  await call("/api/admin/email/test", { method: "POST", jar: createJar(), body: {} }),
);
check("email/test 401 for anonymous", anonymous.status === 401);

// 7. Role guard — ordinary customer ---------------------------------------
const asCustomer = line(
  "7  email/test (customer)",
  await call("/api/admin/email/test", { method: "POST", jar: customer, body: {} }),
);
check("email/test 403 for customer", asCustomer.status === 403);

// 8. Google OAuth hand-off ------------------------------------------------
const social = line(
  "8  sign-in/social (google)",
  await call("/api/auth/sign-in/social", {
    method: "POST",
    jar: createJar(),
    body: { provider: "google", callbackURL: "/en" },
  }),
);

let socialHost = "n/a";
try {
  socialHost = new URL(social.payload.url).hostname;
} catch {
  socialHost = "n/a";
}
console.log(`   provider url host → ${socialHost}`);
check("google oauth url points at Google", socialHost === "accounts.google.com");

// 9. Admin session + live SMTP test ---------------------------------------
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (adminEmail && adminPassword) {
  const admin = createJar();

  const adminSignIn = line(
    "9a sign-in/email (admin)",
    await call("/api/auth/sign-in/email", {
      method: "POST",
      jar: admin,
      body: { email: adminEmail, password: adminPassword },
    }),
  );
  check("admin sign-in returns 200", adminSignIn.status === 200);

  const adminSession = await call("/api/auth/get-session", { jar: admin });
  console.log(`   admin role → ${adminSession.payload?.user?.role}`);
  check("admin role is 'admin'", adminSession.payload?.user?.role === "admin");

  const verify = line("9b email/test (GET verify)", await call("/api/admin/email/test", { jar: admin }));
  check("smtp transport verifies", verify.status === 200);

  const emailTest = line(
    "9c email/test (POST)",
    await call("/api/admin/email/test", { method: "POST", jar: admin, body: { to: adminEmail } }),
  );
  check("email/test sends for admin", emailTest.status === 200);
} else {
  console.log("9  skipped — ADMIN_EMAIL/ADMIN_PASSWORD not set");
}

console.log("\n— summary —");
let failures = 0;
for (const [label, ok] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
}

console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures === 0 ? 0 : 1);


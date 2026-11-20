This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

`master` deploys through Vercel's Git integration, and the site is served from
`https://www.lilyybakers.com` — the apex domain `lilyybakers.com` 308-redirects
to `www`, so always use the `www` origin for auth and absolute links.

### Required environment variables (Production)

Vercel never reads `.env.local`, so every variable below must be added under
Project → Settings → Environment Variables. If they are missing the build still
succeeds, but every dynamic route returns 500
(`Environment variable not found: DATABASE_URL`) while static assets keep
serving 200.

| Group    | Variables                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Database | `DATABASE_URL` (pooled, `?sslmode=require&pgbouncer=true&connection_limit=1`), `DATABASE_URL_UNPOOLED` (direct — used by `prisma migrate`)                                 |
| Auth     | `BETTER_AUTH_SECRET` (32+ chars, `openssl rand -base64 32`), `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                        |
| Mail     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`, `ORDERS_EMAIL`, `SUPPORT_EMAIL`                                                   |
| Storage  | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`                                                                            |
| Locale   | `DEFAULT_LOCALE`, `CURRENCY_RATES`                                                                                                                                       |
| Stripe   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (optional, only when card payment is enabled)                                                                                |

Production values differ from the local ones:

- `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` → `https://www.lilyybakers.com`
- Google Cloud Console needs the redirect URI
  `https://www.lilyybakers.com/api/auth/callback/google`
- `NEXT_PUBLIC_*` values are inlined at build time, so **redeploy** after
  changing them.

`lib/env.ts` validates the whole contract on first use and throws with a list of
the offending keys, so a missing variable fails loudly instead of silently.

### Database migrations

Migrations are applied manually; Vercel does not run them on deploy:

```bash
# point DATABASE_URL_UNPOOLED at the production branch and run
npx dotenv -e .env.local -- prisma migrate deploy
npm run db:seed   # first deploy only: seeds the catalogue + admin account
```

### Health probe

`GET /api/health` returns JSON containing no secrets: whether each required
variable is present, the result of one product query, and whether Better Auth
initialises.

```json
{
  "ok": true,
  "commit": "4928103",
  "missingEnv": [],
  "db": { "ok": true, "products": 12 },
  "auth": { "ok": true, "baseURL": "https://www.lilyybakers.com" }
}
```

`503` with a non-empty `missingEnv` means the Vercel environment is not
configured; `db.ok: false` points at the pooled connection string or the Neon
compute; `auth.ok: false` points at `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`.

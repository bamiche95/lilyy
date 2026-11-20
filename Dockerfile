# syntax=docker/dockerfile:1
#
# Build image for the DevSecOps pipeline (.github/workflows/devsecops.yml) and
# for any container host. Three stages: dependencies, production build, minimal
# standalone runtime.

# ── Stage 1: dependencies ─────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
# Only the manifests, so this layer stays cached until dependencies change.
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: production build ────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# `next build` prerenders the Prisma-backed routes, so the build needs a real
# connection string. CI supplies a throwaway Postgres service (see the workflow)
# — nothing here is baked into a runtime layer.
ARG DATABASE_URL
ARG DATABASE_URL_UNPOOLED
ENV DATABASE_URL=$DATABASE_URL \
    DATABASE_URL_UNPOOLED=$DATABASE_URL_UNPOOLED \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma's musl engine links against OpenSSL, which node:alpine does not ship.
# Without it `prisma generate` cannot detect the right engine variant.
RUN apk add --no-cache openssl

# Generates the Prisma client together with the linux-musl query engine for this
# stage's platform. `next build` writes .next/standalone (output: "standalone").
RUN npx prisma generate
RUN npm run build

# ── Stage 3: runtime ────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# `output: "standalone"` traces only the modules the server actually imports, so
# the runtime stage needs no package manager and runs as a non-root user.
# `openssl` is the only runtime dependency of the Prisma query engine.
RUN apk add --no-cache openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

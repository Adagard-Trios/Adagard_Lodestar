# syntax=docker/dockerfile:1.7
# =============================================================================
# Waypoint Lodestar — sync service (NestJS, port 3007)
# Build context: backend/   (docker build -f apps/sync/Dockerfile backend)
# Multi-stage: full install + build → production deps only → minimal runtime.
# Runs as uid 1000 (non-root) with a read-only root filesystem: nothing is written at
# runtime (the Prisma engine and the bundle are read-only; logs go to stdout).
# =============================================================================

# ---- 1. build: install everything, generate Prisma client, bundle the app ----
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --fetch-retries=10 --fetch-retry-maxtimeout=600000 --fetch-timeout=600000 --no-audit --no-fund
COPY tsconfig.json nest-cli.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate
COPY libs ./libs
COPY apps/sync ./apps/sync
RUN npx nest build sync

# ---- 2. deps: production dependencies only (no dev tooling in the image) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --fetch-retries=10 --fetch-retry-maxtimeout=600000 --fetch-timeout=600000 --omit=dev --ignore-scripts --no-audit --no-fund

# ---- 3. runtime ----
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production     PORT=3007
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist/apps/sync ./dist
# uid/gid 1000 = the image's "node" user (numeric, so runAsNonRoot can verify it)
USER 1000:1000
EXPOSE 3007
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3   CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3007)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

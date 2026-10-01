# syntax=docker/dockerfile:1.7
# Lodestar desk faces (Store desk, Plan, Admin). Next.js 16 needs Node >= 20.9.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --fetch-retries=10 --fetch-retry-maxtimeout=600000 --fetch-timeout=600000
COPY . .
# Optional build-time overrides (Next inlines NEXT_PUBLIC_* into the bundle). Empty = derive from the page's own
# origin: API /odata/v4, Keycloak /auth/realms/lodestar, Socket.IO /ws/ on the gateway (frontend/lib/config.ts).
# NEXT_PUBLIC_DESIGN_PREVIEW=off disables the ?design=1 prototype switch in production builds.
ARG NEXT_PUBLIC_API_URL="" NEXT_PUBLIC_OIDC_AUTHORITY="" NEXT_PUBLIC_OIDC_CLIENT_ID="" NEXT_PUBLIC_WS_URL="" NEXT_PUBLIC_DESIGN_PREVIEW="" NEXT_PUBLIC_LODESTAR_MODE=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_OIDC_AUTHORITY=$NEXT_PUBLIC_OIDC_AUTHORITY NEXT_PUBLIC_OIDC_CLIENT_ID=$NEXT_PUBLIC_OIDC_CLIENT_ID \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL NEXT_PUBLIC_DESIGN_PREVIEW=$NEXT_PUBLIC_DESIGN_PREVIEW NEXT_PUBLIC_LODESTAR_MODE=$NEXT_PUBLIC_LODESTAR_MODE
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
WORKDIR /app
# run as the unprivileged "node" user; the image filesystem stays read-only at runtime
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["npx", "next", "start", "-p", "3000"]

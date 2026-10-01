# syntax=docker/dockerfile:1.7
# Browser build of the Lodestar field app (Store, Plan phone, Dock, Run), for demos and e2e tests.
# The phones run the same code natively via Expo / EAS builds.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --fetch-retries=10 --fetch-retry-maxtimeout=600000 --fetch-timeout=600000
COPY . .
RUN npx expo export --platform web --output-dir dist

FROM nginxinc/nginx-unprivileged:1.27-alpine
# experiments.baseUrl is /field: the export is served from /field/ (routed there by the gateway)
COPY --from=builder /app/dist /usr/share/nginx/html/field
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:8080/field/ >/dev/null || exit 1

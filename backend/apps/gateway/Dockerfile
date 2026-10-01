# syntax=docker/dockerfile:1.7
# Waypoint Lodestar edge gateway. Build context: backend/apps/gateway
FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root
# openssl: DEV ONLY self-signed cert at start; curl: TLS healthcheck.
# default.conf is removed: nginx.conf below is the complete configuration.
RUN apk add --no-cache openssl curl \
 && rm -f /etc/nginx/conf.d/default.conf \
 && mkdir -p /etc/nginx/certs /usr/share/nginx/odata

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY docker-entrypoint.d/10-dev-cert.sh /docker-entrypoint.d/10-dev-cert.sh
COPY odata/ /usr/share/nginx/odata/
# The commit this image was built from (CI passes GIT_SHA; served at /version).
ARG GIT_SHA=dev
RUN printf '%s' "$GIT_SHA" > /usr/share/nginx/version.txt

# Normalise line endings (Windows checkouts) and make config read-only for uid 101.
RUN sed -i 's/\r$//' /docker-entrypoint.d/10-dev-cert.sh /etc/nginx/nginx.conf /etc/nginx/conf.d/* \
 && chmod 0755 /docker-entrypoint.d/10-dev-cert.sh \
 && chown -R root:root /etc/nginx /usr/share/nginx/odata \
 && chmod -R a+rX,go-w /etc/nginx /usr/share/nginx/odata

USER 101

EXPOSE 8443 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsk -o /dev/null https://127.0.0.1:8443/healthz || exit 1

#!/bin/sh
# Provides /tmp/gateway-certs/tls.{crt,key} for nginx.
#  - A certificate mounted at $GATEWAY_CERT_DIR (default /etc/nginx/certs, may be
#    read-only) wins: it is symlinked, never copied or modified.
#  - Otherwise a DEV ONLY self-signed certificate for localhost is generated.
set -eu

MOUNT_DIR="${GATEWAY_CERT_DIR:-/etc/nginx/certs}"
RUN_DIR=/tmp/gateway-certs
ME="10-dev-cert.sh"

mkdir -p "$RUN_DIR"

if [ -s "$MOUNT_DIR/tls.crt" ] && [ -s "$MOUNT_DIR/tls.key" ]; then
  ln -sf "$MOUNT_DIR/tls.crt" "$RUN_DIR/tls.crt"
  ln -sf "$MOUNT_DIR/tls.key" "$RUN_DIR/tls.key"
  echo "$ME: using mounted TLS certificate from $MOUNT_DIR"
  exit 0
fi

# Reuse a certificate generated earlier in this container's lifetime.
if [ -s "$RUN_DIR/tls.crt" ] && [ -s "$RUN_DIR/tls.key" ] \
   && [ ! -L "$RUN_DIR/tls.crt" ] && [ ! -L "$RUN_DIR/tls.key" ]; then
  echo "$ME: WARNING: reusing DEV ONLY self-signed certificate in $RUN_DIR"
  exit 0
fi

rm -f "$RUN_DIR/tls.crt" "$RUN_DIR/tls.key"
umask 077
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 825 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
  -keyout "$RUN_DIR/tls.key" -out "$RUN_DIR/tls.crt" >/dev/null 2>&1
chmod 0644 "$RUN_DIR/tls.crt"

echo "$ME: WARNING: DEV ONLY self-signed certificate generated for CN=localhost (SAN DNS:localhost, IP:127.0.0.1, 825 days)."
echo "$ME: mount a real tls.crt/tls.key at $MOUNT_DIR for any shared or production environment."

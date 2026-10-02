#!/usr/bin/env bash
# Writes the demo VM's .env with fresh random secrets. Run ON THE VM, once, from the repo root:
#   deploy/azure-demo/make-env.sh <fqdn> <acme-email>
# The file stays on the VM (it is gitignored); nothing here is ever committed.
set -euo pipefail
host=${1:?usage: make-env.sh <fqdn, e.g. waypoint-lodestar.southeastasia.cloudapp.azure.com> <acme-email>}
email=${2:?usage: make-env.sh <fqdn> <acme-email>}
[ -e .env ] && { echo ".env already exists: refusing to overwrite (move it away first)"; exit 1; }
rnd() { openssl rand -base64 33 | tr -d '/+=\n' | cut -c1-32; }
umask 077
{
  echo "# demo VM settings, generated $(date -u +%FT%TZ). Keep private."
  echo "PUBLIC_HOST=$host"
  echo "PUBLIC_ORIGIN=https://$host"
  echo "ACME_EMAIL=$email"
  echo "POSTGRES_PASSWORD=$(rnd)"
  echo "REDIS_PASSWORD=$(rnd)"
  echo "KEYCLOAK_DB_PASSWORD=$(rnd)"
  echo "KEYCLOAK_ADMIN=kcadmin"
  echo "KEYCLOAK_ADMIN_PASSWORD=$(rnd)"
  echo "# The four demo personas sign in with these (published in the README for the judges)"
  echo "LODESTAR_DEMO_PASSWORD=${LODESTAR_DEMO_PASSWORD:-$(rnd)}"
  echo "LODESTAR_ADMIN_PASSWORD=${LODESTAR_ADMIN_PASSWORD:-$(rnd)}"
  for s in AUTH ORDERS PLANNING FLEET OUTLETS TRIPS SYNC NOTIFICATIONS AUDIT AGENT; do
    echo "SVC_${s}_SECRET=$(rnd)"
  done
  echo "DEMO_DATE="
} > .env
echo "wrote .env for https://$host"

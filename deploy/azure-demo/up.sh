#!/usr/bin/env bash
# Starts (or updates) the demo stack on the VM: compose + the production override, after checking .env.
#   deploy/azure-demo/up.sh            build and start
#   deploy/azure-demo/up.sh down       stop (keeps the data)
set -euo pipefail
cd "$(dirname "$0")/../.."
compose=(docker compose -f docker-compose.yml -f deploy/azure-demo/compose.prod.yml --env-file .env)

if [ "${1:-}" = down ]; then exec "${compose[@]}" down; fi

[ -f .env ] || { echo "no .env: run deploy/azure-demo/make-env.sh first"; exit 1; }
required=(PUBLIC_HOST PUBLIC_ORIGIN ACME_EMAIL POSTGRES_PASSWORD REDIS_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN
  KEYCLOAK_ADMIN_PASSWORD LODESTAR_DEMO_PASSWORD LODESTAR_ADMIN_PASSWORD SVC_AUTH_SECRET SVC_ORDERS_SECRET
  SVC_PLANNING_SECRET SVC_FLEET_SECRET SVC_OUTLETS_SECRET SVC_TRIPS_SECRET SVC_SYNC_SECRET SVC_NOTIFICATIONS_SECRET
  SVC_AUDIT_SECRET SVC_AGENT_SECRET)
bad=0
for v in "${required[@]}"; do
  val=$(grep -E "^$v=" .env | tail -1 | cut -d= -f2- || true)
  if [ -z "$val" ]; then echo "missing in .env: $v"; bad=1
  elif [[ "$val" == *dev-only* || "$val" == *localhost* ]]; then echo "dev default in .env: $v"; bad=1
  fi
done
[ $bad = 0 ] || exit 1

# the competition CSVs are optional on the VM (copied by hand into ./data, never baked into an image)
mkdir -p data
"${compose[@]}" up -d --build --remove-orphans
E2E_BASE_URL="$(grep -E '^PUBLIC_ORIGIN=' .env | cut -d= -f2-)" tools/qa/wait-stack.sh 1800

#!/usr/bin/env bash
# Starts (or updates) the demo stack on the VM: compose + the production override, after checking .env.
#   deploy/azure-demo/up.sh            start: pull the CI images when REGISTRY and TAG are set in .env; else use the
#                                      images ship.sh loaded, building here only the ones missing (REBUILD=1: all)
#   deploy/azure-demo/up.sh down       stop (keeps the data)
set -euo pipefail
cd "$(dirname "$0")/../.."
compose=(docker compose -f docker-compose.yml -f deploy/azure-demo/compose.prod.yml --env-file .env)
env_val() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- || true; }

if [ "${1:-}" = down ]; then exec "${compose[@]}" down; fi

[ -f .env ] || { echo "no .env: run deploy/azure-demo/make-env.sh first"; exit 1; }
required=(PUBLIC_HOST PUBLIC_ORIGIN ACME_EMAIL POSTGRES_PASSWORD REDIS_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN
  KEYCLOAK_ADMIN_PASSWORD LODESTAR_DEMO_PASSWORD LODESTAR_ADMIN_PASSWORD SVC_AUTH_SECRET SVC_ORDERS_SECRET
  SVC_PLANNING_SECRET SVC_FLEET_SECRET SVC_OUTLETS_SECRET SVC_TRIPS_SECRET SVC_SYNC_SECRET SVC_NOTIFICATIONS_SECRET
  SVC_AUDIT_SECRET SVC_AGENT_SECRET)
bad=0
for v in "${required[@]}"; do
  val=$(env_val "$v")
  if [ -z "$val" ]; then echo "missing in .env: $v"; bad=1
  elif [[ "$val" == *dev-only* || "$val" == *localhost* ]]; then echo "dev default in .env: $v"; bad=1
  fi
done
[ $bad = 0 ] || exit 1

# the competition CSVs are optional on the VM (copied by hand into ./data, never baked into an image)
mkdir -p data
if [ -n "$(env_val REGISTRY)" ] && [ -n "$(env_val TAG)" ]; then
  # the 14 images CI pushed (deploy/ci/compose.images.yml): nothing is compiled on the VM
  compose+=(-f deploy/ci/compose.images.yml)
  "${compose[@]}" pull --quiet
  "${compose[@]}" up -d --no-build --remove-orphans
else
  # one image at a time: parallel Next.js and Nest builds do not fit in 4 GiB
  for s in $("${compose[@]}" config --format json | jq -r '.services | to_entries[] | select(.value.build) | .key'); do
    if [ "${REBUILD:-}" != 1 ] && docker image inspect "lodestar-$s" >/dev/null 2>&1; then continue; fi
    echo "building $s"; "${compose[@]}" build "$s"
  done
  "${compose[@]}" up -d --no-build --remove-orphans
fi
E2E_BASE_URL="$(env_val PUBLIC_ORIGIN)" tools/qa/wait-stack.sh 1800

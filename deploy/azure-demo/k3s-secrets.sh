#!/usr/bin/env bash
# Creates (or updates) what the k3s demo needs but git must never hold, from the VM's .env (make-env.sh):
#   - the Secrets of deploy/k8s/overlays/demo (same names as overlays/local, real values)
#   - the ConfigMap lodestar-data with the competition CSVs from ./data, if they were copied to the VM
# Run ON THE VM, from the repo root, with kubectl pointing at k3s (deploy/argocd/README.md, "Demo on k3s"):
#   deploy/azure-demo/k3s-secrets.sh
# The values are the compose stack's, so the personas keep the same passwords whichever side serves the URL.
# Postgres takes its passwords only when its volume is first created, and Keycloak imports the realm only on
# its first start: to rotate a value later, delete the postgres PVC (data-postgres-0) and the identity pod too.
set -euo pipefail
cd "$(dirname "$0")/../.."
ns=lodestar
[ -f .env ] || { echo "no .env: run deploy/azure-demo/make-env.sh first"; exit 1; }
env_val() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- || true; }
need() {
  local v; v=$(env_val "$1")
  if [ -z "$v" ]; then echo "missing in .env: $1" >&2; exit 1; fi
  if [[ "$v" == *dev-only* ]]; then echo "dev default in .env: $1" >&2; exit 1; fi
  printf '%s' "$v"
}
secret() { # secret <name> --from-literal=K=V ...
  local name=$1; shift
  kubectl -n "$ns" create secret generic "$name" "$@" --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  echo "secret/$name"
}

kubectl get namespace "$ns" >/dev/null 2>&1 || kubectl create namespace "$ns"

pg=$(need POSTGRES_PASSWORD)
kcdb=$(need KEYCLOAK_DB_PASSWORD)
redis=$(need REDIS_PASSWORD)
db="postgresql://lodestar:${pg}@postgres:5432/lodestar"

secret postgres-credentials \
  --from-literal=POSTGRES_PASSWORD="$pg" \
  --from-literal=KEYCLOAK_DB_PASSWORD="$kcdb" \
  --from-literal=DATABASE_URL="$db"
secret redis-credentials --from-literal=REDIS_PASSWORD="$redis"

identity=(
  --from-literal=KC_DB_PASSWORD="$kcdb"
  --from-literal=KC_BOOTSTRAP_ADMIN_PASSWORD="$(need KEYCLOAK_ADMIN_PASSWORD)"
  --from-literal=LODESTAR_DEMO_PASSWORD="$(need LODESTAR_DEMO_PASSWORD)"
  --from-literal=LODESTAR_ADMIN_PASSWORD="$(need LODESTAR_ADMIN_PASSWORD)"
)
for s in auth orders planning fleet outlets trips sync notifications audit agent; do
  S=$(printf '%s' "$s" | tr '[:lower:]' '[:upper:]')
  identity+=(--from-literal="SVC_${S}_SECRET=$(need "SVC_${S}_SECRET")")
done
secret identity-secrets "${identity[@]}"

for s in auth orders planning fleet outlets trips sync notifications audit agent; do
  S=$(printf '%s' "$s" | tr '[:lower:]' '[:upper:]')
  args=(--from-literal=OIDC_CLIENT_SECRET="$(need "SVC_${S}_SECRET")")
  case $s in
    agent) args+=(--from-literal=DATABASE_URL="$db") ;;   # psycopg: no Prisma pool parameter
    *)     args+=(--from-literal=DATABASE_URL="${db}?connection_limit=5") ;;
  esac
  if [ "$s" = notifications ]; then args+=(--from-literal=REDIS_URL="redis://:${redis}@redis:6379"); fi
  secret "$s-secrets" "${args[@]}"
done

# the competition CSVs (never committed, never in an image); without them the seed uses synthetic data
shopt -s nullglob
csvs=(data/*.csv)
if [ ${#csvs[@]} -gt 0 ]; then
  files=(); for f in "${csvs[@]}"; do files+=(--from-file="$f"); done
  kubectl -n "$ns" create configmap lodestar-data "${files[@]}" --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  echo "configmap/lodestar-data (${#csvs[@]} CSV files)"
else
  echo "no data/*.csv: the seed will use synthetic reference data"
fi

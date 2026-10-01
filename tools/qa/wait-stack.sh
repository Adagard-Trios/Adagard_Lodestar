#!/usr/bin/env bash
# Waits until the compose stack can serve a judge: migrate/seed finished, every service healthy or running,
# and the gateway answers the start page, OData and Keycloak. Usage: tools/qa/wait-stack.sh [timeout-seconds]
set -euo pipefail
timeout=${1:-600}
base=${E2E_BASE_URL:-https://localhost:8443}
deadline=$(( $(date +%s) + timeout ))
ready() {
  [ "$(docker compose ps -a --format '{{.Service}} {{.State}} {{.ExitCode}}' migrate)" = "migrate exited 0" ] || return 1
  ! docker compose ps --format '{{.Health}}' | grep -qE 'starting|unhealthy' || return 1
  curl -ksf -o /dev/null "$base/" &&
  # OData answers through the gateway (401 without a token is an answer; 502/504 is not)
  [[ "$(curl -ks -o /dev/null -w '%{http_code}' "$base/odata/v4/\$metadata")" =~ ^(200|401)$ ]] &&
  curl -ksf -o /dev/null "$base/auth/realms/lodestar/.well-known/openid-configuration"
}
until ready; do
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "stack not ready after ${timeout}s"; docker compose ps -a; exit 1
  fi
  if docker compose ps -a --format '{{.Service}} {{.State}} {{.ExitCode}}' migrate | grep -qE 'exited [1-9]'; then
    echo "migrate/seed failed"; docker compose logs migrate | tail -40; exit 1
  fi
  sleep 3
done
echo "stack ready"; docker compose ps

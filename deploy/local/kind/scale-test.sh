#!/usr/bin/env bash
# HPA demo on the local kind cluster: drives load at the gateway with k6
# (tests/load/gateway-scale.js) and watches `kubectl get hpa -w` while the
# auth (and gateway) pods scale out, then keeps watching after the load stops
# until they scale back in (local overlay: 60 s scale-down window).
#
#   deploy/local/kind/scale-test.sh
#
# Env: VUS (60), RAMP (30s), HOLD (3m), SCALE_IN_WAIT seconds to keep watching
# after the load (240), K6_IMAGE (grafana/k6:latest). Uses a local `k6` when
# installed, otherwise the k6 container on the kind Docker network.
set -euo pipefail

# shellcheck source=deploy/local/kind/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

VUS="${VUS:-60}"
RAMP="${RAMP:-30s}"
HOLD="${HOLD:-3m}"
SCALE_IN_WAIT="${SCALE_IN_WAIT:-240}"
K6_IMAGE="${K6_IMAGE:-grafana/k6:latest}"
SCRIPT="${REPO_ROOT}/tests/load/gateway-scale.js"

require_cluster
kn get hpa auth >/dev/null 2>&1 || die "HPA 'auth' not found in namespace ${NAMESPACE}; run up.sh first"
k top nodes >/dev/null 2>&1 || warn "metrics-server has no data yet; the HPAs show <unknown> for a minute"

watch_pids=()
cleanup() {
  local pid
  for pid in "${watch_pids[@]}"; do kill "${pid}" 2>/dev/null || true; done
}
trap cleanup EXIT INT TERM

log "before the load"
kn get hpa
kn get deployment auth gateway

# Live view: every HPA change (TARGETS = current/target utilisation, REPLICAS).
kn get hpa --watch --output-watch-events &
watch_pids+=($!)

# Pod count per service every 20 s, so scale-out and scale-in are easy to read.
(
  while true; do
    sleep 20
    printf '\n[%s] ready pods: ' "$(date +%H:%M:%S)"
    kn get deployment -o jsonpath='{range .items[*]}{.metadata.name}={.status.readyReplicas} {end}'
    printf '\n'
  done
) &
watch_pids+=($!)

log "k6: ${VUS} VUs, ramp ${RAMP}, hold ${HOLD} against the gateway"
k6_status=0
if command -v k6 >/dev/null 2>&1; then
  k6 run -e BASE_URL=https://localhost:8443 -e VUS="${VUS}" -e RAMP="${RAMP}" -e HOLD="${HOLD}" \
    "$(native_path "${SCRIPT}")" || k6_status=$?
else
  # k6 in a container on kind's Docker network, straight at the gateway NodePort.
  "${DOCKER}" run --rm -i --network kind "${K6_IMAGE}" run \
    -e BASE_URL="https://${CLUSTER_NAME}-control-plane:30443" \
    -e VUS="${VUS}" -e RAMP="${RAMP}" -e HOLD="${HOLD}" - <"${SCRIPT}" || k6_status=$?
fi
((k6_status == 0)) || warn "k6 exited with ${k6_status} (threshold breach or error); still watching scale-in"

log "load stopped; watching scale-in for ${SCALE_IN_WAIT}s"
sleep "${SCALE_IN_WAIT}"

cleanup
watch_pids=()
log "after the load"
kn get hpa
kn get deployment auth gateway

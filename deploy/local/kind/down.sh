#!/usr/bin/env bash
# Deletes the kind cluster named `lodestar`, and only that cluster.
# Takes no arguments on purpose: other kind clusters on this machine
# (hospital-*, hotelmanagement, ...) and other kube contexts are never touched.
set -euo pipefail

# shellcheck source=deploy/local/kind/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

(($# == 0)) || die "down.sh takes no arguments; it only ever deletes the kind cluster '${CLUSTER_NAME}'"
[[ "${CLUSTER_NAME}" == "lodestar" ]] || die "refusing: cluster name is not 'lodestar'"

if ! cluster_exists; then
  log "kind cluster '${CLUSTER_NAME}' does not exist; nothing to do"
  exit 0
fi

log "deleting kind cluster '${CLUSTER_NAME}'"
"${KIND}" delete cluster --name "${CLUSTER_NAME}" --kubeconfig "${KUBECONFIG_ARG}"
rm -f "${LODESTAR_KUBECONFIG}"
log "done. Remaining kind clusters:"
"${KIND}" get clusters || true

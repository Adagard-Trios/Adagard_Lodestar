#!/usr/bin/env bash
# Shared settings for up.sh, down.sh and scale-test.sh (sourced, not run).
#
# Safety: everything here talks to ONE cluster, the kind cluster named
# `lodestar`, through its own kubeconfig file. The default kubeconfig, its
# current-context and every other kind cluster on the machine are never read,
# changed or deleted.

# shellcheck disable=SC2034  # variables are used by the scripts that source this file

CLUSTER_NAME="lodestar"
KUBE_CONTEXT="kind-${CLUSTER_NAME}"
NAMESPACE="lodestar"

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${LIB_DIR}/../../.." && pwd)"
OVERLAY="${REPO_ROOT}/deploy/k8s/overlays/local"
KIND_CONFIG="${LIB_DIR}/kind-config.yaml"

# A kubeconfig file of its own, so `kind create` does not switch the user's
# current context. Use it yourself with: export KUBECONFIG=<this path>
LODESTAR_KUBECONFIG="${LODESTAR_KUBECONFIG:-${HOME}/.kube/kind-${CLUSTER_NAME}.yaml}"

KEDA_VERSION="${KEDA_VERSION:-2.17.2}"

# Images built by `docker compose build` (compose project `lodestar`).
APP_IMAGES=(auth orders planning fleet outlets trips sync notifications audit agent frontend mobile-web gateway migrate)
# Third-party images; loaded from the local Docker cache when present (saves pulls).
INFRA_IMAGES=(postgres:16-alpine redis:7-alpine quay.io/keycloak/keycloak:26.0)

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mWARN:\033[0m %s\n' "$*" >&2; }
die() {
  printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2
  exit 1
}

# Tool lookup: env override, then PATH, then the known Windows install folders.
find_tool() {
  local name="$1" override="$2"
  shift 2
  if [[ -n "${override}" ]]; then
    printf '%s\n' "${override}"
    return 0
  fi
  if command -v "${name}" >/dev/null 2>&1; then
    command -v "${name}"
    return 0
  fi
  local candidate
  for candidate in "$@"; do
    if [[ -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done
  return 1
}

DOCKER_BIN_DIR="/c/Users/${USERNAME:-${USER:-}}/AppData/Local/Programs/DockerDesktop/resources/bin"
if [[ -d "${DOCKER_BIN_DIR}" ]]; then
  PATH="${DOCKER_BIN_DIR}:${PATH}"
fi

DOCKER="$(find_tool docker "${DOCKER:-}" "${DOCKER_BIN_DIR}/docker.exe")" || die "docker not found"
KUBECTL="$(find_tool kubectl "${KUBECTL:-}" "${DOCKER_BIN_DIR}/kubectl.exe")" || die "kubectl not found"
KIND="$(find_tool kind "${KIND:-}" "${HOME}/go/bin/kind" "${HOME}/go/bin/kind.exe")" || die "kind not found (go install sigs.k8s.io/kind@latest)"

# Native Windows binaries want C:/... paths; Git Bash gives /c/...
native_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$1"
  else
    printf '%s\n' "$1"
  fi
}
KUBECONFIG_ARG="$(native_path "${LODESTAR_KUBECONFIG}")"

# kubectl / helm pinned to the lodestar cluster, always.
k() { "${KUBECTL}" --kubeconfig "${KUBECONFIG_ARG}" --context "${KUBE_CONTEXT}" "$@"; }
kn() { k --namespace "${NAMESPACE}" "$@"; }

cluster_exists() {
  "${KIND}" get clusters 2>/dev/null | grep -qx "${CLUSTER_NAME}"
}

require_cluster() {
  cluster_exists || die "kind cluster '${CLUSTER_NAME}' does not exist; run deploy/local/kind/up.sh first"
  [[ -f "${LODESTAR_KUBECONFIG}" ]] || "${KIND}" export kubeconfig --name "${CLUSTER_NAME}" --kubeconfig "${KUBECONFIG_ARG}" >/dev/null
}

# 0 when something already listens on 127.0.0.1:<port>
port_in_use() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

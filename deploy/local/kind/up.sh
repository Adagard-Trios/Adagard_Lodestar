#!/usr/bin/env bash
# Waypoint Lodestar on a local kind cluster named `lodestar` (PLATFORM.md section 9).
#
#   docker compose build          # images lodestar-<service>:latest (or BUILD=1 below)
#   docker compose down           # frees host ports 8443/8082/8180 and Docker memory
#   deploy/local/kind/up.sh
#
# 1. creates the kind cluster `lodestar` (1 control plane + 2 workers, see
#    kind-config.yaml) unless it exists, with its own kubeconfig file
# 2. loads the compose images into the nodes (kind load docker-image)
# 3. installs metrics-server (patched for kind) and KEDA (Helm chart)
# 4. applies deploy/k8s/overlays/local and waits for every rollout
#
# Env: BUILD=1 runs `docker compose build` first; KEDA_VERSION; LODESTAR_KUBECONFIG
# (default ~/.kube/kind-lodestar.yaml); SKIP_LOAD=1 skips the image load.
# Other kind clusters and kube contexts are never touched.
set -euo pipefail

# shellcheck source=deploy/local/kind/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

HELM="$(find_tool helm "${HELM:-}" /c/ProgramData/chocolatey/bin/helm /c/ProgramData/chocolatey/bin/helm.exe)" || die "helm not found"

"${DOCKER}" info >/dev/null 2>&1 || die "Docker is not running"

# ------------------------------------------------------------------ images
if [[ "${BUILD:-0}" == "1" ]]; then
  log "docker compose build"
  (cd "${REPO_ROOT}" && "${DOCKER}" compose build)
fi

missing=()
for svc in "${APP_IMAGES[@]}"; do
  "${DOCKER}" image inspect "lodestar-${svc}:latest" >/dev/null 2>&1 || missing+=("lodestar-${svc}:latest")
done
if ((${#missing[@]} > 0)); then
  die "missing images: ${missing[*]}
       build them with: docker compose build   (or BUILD=1 $0)"
fi

# ------------------------------------------------------------------ cluster
created=0
if cluster_exists; then
  log "kind cluster '${CLUSTER_NAME}' exists, reusing it"
  "${KIND}" export kubeconfig --name "${CLUSTER_NAME}" --kubeconfig "${KUBECONFIG_ARG}" >/dev/null
else
  for port in 8443 8082 8180; do
    if port_in_use "${port}"; then
      die "host port ${port} is in use (docker compose stack?). Stop it first: docker compose down"
    fi
  done
  mkdir -p "$(dirname "${LODESTAR_KUBECONFIG}")"
  log "creating kind cluster '${CLUSTER_NAME}' (kubeconfig: ${LODESTAR_KUBECONFIG})"
  "${KIND}" create cluster --name "${CLUSTER_NAME}" --config "$(native_path "${KIND_CONFIG}")" \
    --kubeconfig "${KUBECONFIG_ARG}" --wait 180s
  created=1
fi

[[ "$(k config current-context)" == "${KUBE_CONTEXT}" ]] || die "unexpected context in ${LODESTAR_KUBECONFIG}"

# ------------------------------------------------------------------ load images
if [[ "${SKIP_LOAD:-0}" != "1" ]]; then
  images=()
  for svc in "${APP_IMAGES[@]}"; do images+=("lodestar-${svc}:latest"); done
  for img in "${INFRA_IMAGES[@]}"; do
    if "${DOCKER}" image inspect "${img}" >/dev/null 2>&1; then images+=("${img}"); fi
  done
  # Docker Desktop's containerd image store keeps multi-platform indexes whose other-platform
  # layers are absent, which breaks `kind load docker-image` (ctr import --all-platforms).
  # Saving a single-platform archive and loading that works with either image store.
  platform="linux/$("${DOCKER}" info --format '{{.Architecture}}' | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
  archive_dir="$(mktemp -d)"
  trap 'rm -rf "${archive_dir}"' EXIT
  log "loading ${#images[@]} images into the nodes (${platform} archives)"
  for img in "${images[@]}"; do
    tar="${archive_dir}/$(echo "${img}" | tr '/:' '__').tar"
    "${DOCKER}" save --platform "${platform}" -o "$(native_path "${tar}")" "${img}"
    "${KIND}" load image-archive --name "${CLUSTER_NAME}" "$(native_path "${tar}")"
    rm -f "${tar}"
  done
fi

# ------------------------------------------------------------------ metrics-server
log "metrics-server (kubelet-insecure-tls for kind)"
k apply -k "$(native_path "${LIB_DIR}/metrics-server")"
k -n kube-system rollout status deployment/metrics-server --timeout=900s

# ------------------------------------------------------------------ KEDA
log "KEDA ${KEDA_VERSION} (Helm chart kedacore/keda)"
"${HELM}" upgrade --install keda keda \
  --repo https://kedacore.github.io/charts \
  --version "${KEDA_VERSION}" \
  --namespace keda --create-namespace \
  --kubeconfig "${KUBECONFIG_ARG}" --kube-context "${KUBE_CONTEXT}" \
  --wait --timeout 20m
k wait --for=condition=Established crd/scaledobjects.keda.sh crd/triggerauthentications.keda.sh --timeout=60s

# ------------------------------------------------------------------ Lodestar
log "applying deploy/k8s/overlays/local"
# The migrate Job's template is immutable: replace it so every `up` migrates (and seeds) again.
kn delete job migrate --ignore-not-found --wait=true
# --load-restrictor: the overlay reads backend/identity/lodestar-realm.json and
# deploy/local/postgres/01-keycloak.sh from outside its folder.
"${KUBECTL}" kustomize --load-restrictor LoadRestrictionsNone "$(native_path "${OVERLAY}")" |
  k apply --server-side --force-conflicts --field-manager=lodestar-up -f -

if ((created == 0)) && [[ "${SKIP_LOAD:-0}" != "1" ]]; then
  # same :latest tags, new image content: restart so pods pick up the reloaded images
  log "restarting workloads to pick up reloaded images"
  kn rollout restart deployment
fi

log "waiting for Postgres, Redis and Keycloak"
kn rollout status statefulset/postgres --timeout=300s
kn rollout status deployment/redis --timeout=180s
kn rollout status deployment/identity --timeout=600s

log "waiting for migrate + seed"
if ! kn wait --for=condition=complete job/migrate --timeout=900s; then
  kn logs job/migrate --tail=50 || true
  die "migrate job did not complete"
fi

log "waiting for the services"
failed=()
for d in $(kn get deployment -o jsonpath='{.items[*].metadata.name}'); do
  kn rollout status "deployment/${d}" --timeout=600s || failed+=("${d}")
done
if ((${#failed[@]} > 0)); then
  warn "not ready: ${failed[*]}  (kubectl -n ${NAMESPACE} describe deployment <name>)"
fi

kn get hpa
kn get scaledobject

cat <<EOF

Waypoint Lodestar is up on kind cluster '${CLUSTER_NAME}'.
  https://localhost:8443          web + OData (/odata/v4/) + Keycloak (/auth) + realtime (/ws/)
  http://localhost:8082           field app
  http://localhost:8180/auth      Keycloak admin (dev only: admin / admin-dev-only)

  export KUBECONFIG="${LODESTAR_KUBECONFIG}"     # kubectl for this cluster only
  deploy/local/kind/scale-test.sh                # k6 load, watch the HPAs scale out and in
  deploy/local/kind/down.sh                      # delete this cluster (and nothing else)
EOF

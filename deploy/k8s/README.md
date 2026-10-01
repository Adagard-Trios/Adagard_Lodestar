# deploy/k8s: Kustomize for AKS (dev, prod) and kind (local)

```
base/                      one copy of every manifest, prod-sized (PLATFORM.md section 9)
  policies/                PriorityClasses (lodestar-api > lodestar-agent > lodestar-batch),
                           ResourceQuota, LimitRange
  services/<svc>/          Deployment, Service, ServiceAccount, ConfigMap, PDB, and either
                           an HPA (CPU + memory) or, for agent and sync, a KEDA ScaledObject
                           + TriggerAuthentication; SecretProviderClass (Key Vault) for DB services
  istio/ ingress/ network-policies/ jobs/   AKS only (mesh, Front Door, Cilium, PreSync migrate)
components/azure-wiring/   fills TENANT_ID, CLIENT_ID_*, hosts, POSTGRES_HOST, ... from azure.env
overlays/dev/              AKS dev: HPAs 1-3, small requests, best-effort zone spread
overlays/prod/             AKS prod: base bounds (min >= 2), ACR images
overlays/local/            kind: no Azure; in-cluster Postgres, Keycloak, Redis, NGINX gateway
```

Argo CD syncs `overlays/dev` and `overlays/prod` (see `deploy/argocd/README.md`). `overlays/local` is only for kind and is applied by `deploy/local/kind/up.sh`.

## Scaling, in short

Full detail: `docs/architecture/PLATFORM.md` section 9.

- **HPAs** scale on app-container CPU and memory. They scale up fast (+100 % or +4 pods per 15 s) and scale down slowly (a 5-minute window, then −20 % per minute).
- **KEDA:**
  - `agent` scales on active LangGraph runs (a Postgres query on `agent.checkpoints`).
  - `sync` scales on OfflineEvent replay (a Postgres query on `sync."OfflineEvent"`).
- **Cluster autoscaler:** the AKS user pools are autoscaled, with one pool per zone in prod. The system pool is small. Prod also has an optional spot pool for the agent.
- **Resilience:**
  - Zone and node topology spread, plus preferred pod anti-affinity.
  - PDBs with `maxUnavailable: 1`.
  - A `preStop` sleep plus a grace period for draining.
  - Startup, liveness and readiness probes (readiness on `/ready`).
  - `maxSurge: 25%` and `maxUnavailable: 0` on rollouts.
- **Socket.IO:** `notifications` uses the Redis adapter when `REDIS_URL` is set (Azure Cache for Redis on AKS, in-cluster Redis on kind), so any replica can emit to any client.

## Local cluster (kind)

What it runs: a kind cluster named **`lodestar`** with 1 control plane and 2 workers. The workers are labelled `lodestar.io/pool=apps` and get one zone each, so node selectors and the zone spread work unchanged. It also runs metrics-server (with `--kubelet-insecure-tls`), KEDA from its Helm chart, and the full platform from the compose images.

Prerequisites: Docker, `kind`, `kubectl`, `helm`, and `k6`. If `k6` is not installed, the `grafana/k6` container is used instead.

```bash
docker compose build              # images lodestar-<service>:latest (compose project "lodestar")
docker compose down               # frees host ports 8443/8082/8180 and Docker memory
bash deploy/local/kind/up.sh      # create cluster, load images, metrics-server, KEDA, apply, wait
export KUBECONFIG=~/.kube/kind-lodestar.yaml
kubectl -n lodestar get hpa,scaledobject,pods

bash deploy/local/kind/scale-test.sh   # k6 at the gateway + `kubectl get hpa -w`: scale out, then in
bash deploy/local/kind/down.sh         # deletes the kind cluster "lodestar" and nothing else
```

| URL | What |
|---|---|
| https://localhost:8443 | gateway: web, OData `/odata/v4/`, Keycloak `/auth`, realtime `/ws/` |
| http://localhost:8082 | field app |
| http://localhost:8180/auth | Keycloak admin (dev only) |

Notes:

- **Isolation.** The scripts use their own kubeconfig file (`~/.kube/kind-lodestar.yaml`, set `LODESTAR_KUBECONFIG` to change it) and always pass `--context kind-lodestar`. Your default kubeconfig, its current context and other kind clusters are never touched. `down.sh` takes no arguments and only deletes `lodestar`.
- **Building the overlay.** It reads `backend/identity/lodestar-realm.json` (Keycloak realm, via a `configMapGenerator`) and `deploy/local/postgres/01-keycloak.sh` from outside its folder, so it needs:
  ```bash
  kubectl kustomize --load-restrictor LoadRestrictionsNone deploy/k8s/overlays/local
  ```
  `up.sh` pipes that output into `kubectl apply --server-side`.
- **Secrets.** They are plain Secrets from a `secretGenerator` with the **dev-only** defaults of `docker-compose.yml`. There is no Key Vault, workload identity, Istio or NetworkPolicy locally.
- **Gateway.** It is the compose NGINX gateway image. An init container points its resolver at kube-dns, uses fully qualified upstream names, and raises the per-IP rate limits so a single-host k6 run can reach the services (see `overlays/local/gateway.yaml`).
- **Load test.** `tests/load/gateway-scale.js` fetches a client-credentials token from Keycloak and then requests the OData service document, which the gateway routes to `auth`. `auth`, and with enough load the gateway, scales out to 4 pods (3 for the gateway). After the load stops, both scale back in to 1 within a few minutes (the local scale-down window is 60 s).
  - Tune it with `VUS`, `RAMP`, `HOLD` and `SCALE_IN_WAIT`.
- **Rebuilt images.** Re-running `up.sh` reloads the images and restarts the Deployments, because the `:latest` tags don't change. Use `SKIP_LOAD=1` to skip that.
- **Resource use.** Expect about 3–4 GB of Docker memory at rest. Stop the compose stack first.

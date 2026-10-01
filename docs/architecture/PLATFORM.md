# Waypoint Lodestar · platform architecture (contract)

This is the single source of truth that the backend, the agent service, infrastructure, CI/CD and tests are built against. Change it first, then the code.

## 1. Runtime pieces

| Service | Tech | Port (container) | Owns |
|---|---|---|---|
| `gateway` | NGINX (TLS, rate limits, routing only; no auth decisions) | 8443 → host 8443, 8080 → redirect | edge |
| `identity` | Keycloak 26 (OIDC). Azure: Microsoft Entra ID | 8080 (host **8180**, dev only) | users, roles, tokens |
| `auth` | NestJS | 3001 | session helpers (`/me`), user directory (reads Keycloak), device registry |
| `orders` | NestJS | 3002 | Orders, OrderLineItems |
| `planning` | NestJS | 3003 | Plans, Deferrals, capacity, ETA; calls `agent` |
| `fleet` | NestJS | 3004 | Vehicles |
| `outlets` | NestJS | 3005 | Outlets, Calendar, DistrictTravel, ServiceAllowance |
| `trips` | NestJS | 3006 | Trips, TripStops, POD, LoadRecords |
| `sync` | NestJS | 3007 | OfflineEvents (offline queue replay, conflict detection) |
| `notifications` | NestJS + Socket.IO | 3008 | Notifications, realtime |
| `audit` | NestJS | 3009 | AuditEntries (append-only, hash chained) |
| `agent` | Python 3.12, FastAPI, **LangGraph**, mock chat model | 8000 | planning-agent runs (drafts only, never publishes) |
| `postgres` | PostgreSQL 16 | 5432 (data network only) | all persistence (one schema per service: `orders`, `planning`, …) |
| `frontend` | Next.js (desk faces: Store desk, Plan, Admin) | 3000 | UI |
| `mobile-web` | Expo web export served by NGINX (browser build of the field app) | 80 → host **8082** | UI |

On Azure (AKS), the Istio internal ingress gateway takes the NGINX `gateway`'s place: it routes the same paths, and `auth` serves the merged OData service document at `/odata/v4/`. The `svc-*` client secrets become Entra workload identities, and each service gets least-privilege app roles on `lodestar-api`.

Local: `docker compose up --build` starts everything above. Open `https://localhost:8443` (web), `http://localhost:8082` (field app in the browser), `http://localhost:8180` (Keycloak admin, dev only).
QA extras: `docker compose --profile qa up sonarqube` (SonarQube at host 9000).

## 2. Zero trust (verify explicitly, least privilege, assume breach)

1. **Identity for every call.** Every request to every service carries an OIDC access token (JWT, RS256) issued by `identity`. Each service verifies it itself using the issuer's JWKS (issuer, audience `lodestar-api`, expiry, signature). The gateway never grants access; there are no "trusted internal" calls.
2. **Service identities.** Service-to-service calls use the OAuth2 client-credentials grant: one confidential client per service (`svc-planning`, `svc-agent`, …), and tokens are cached until 60 s before expiry. Service tokens carry the `svc` role plus only the scopes they need (for example `orders.read`).
3. **Least privilege (RBAC + ABAC).**
   - Realm roles: `store_manager`, `dispatcher`, `loader`, `driver`, `admin`, `svc`.
   - Token claims:
     - `depot`: `PELIYAGODA` or `KANDY`, or both for dispatchers.
     - `outlet_id`: store managers only.
     - `vehicle_id`: drivers, on the day's run.
   - Policies are declared per route with `@Allow(roles…)` and `@Scope('depot'|'outlet'|'vehicle')`. Row filters are applied to OData queries automatically, so a store manager can only ever query their own outlet.
4. **Segmentation.** Docker networks `edge` (gateway, identity, frontend, mobile-web), `app` (gateway + services + agent + identity), `data` (services + postgres). Postgres is only on `data`; nothing but the gateway publishes ports (plus Keycloak admin in dev). On Azure: AKS with the Istio add-on, STRICT mTLS `PeerAuthentication`, per-service `AuthorizationPolicy` (who may call whom), private endpoints for Postgres and Key Vault, and Front Door with WAF at the edge.
5. **Assume breach.**
   - Every write goes to the hash-chained audit log (`audit` service): each entry stores `prevHash` and `hash = sha256(prevHash + canonical JSON)`. `GET /odata/v4/AuditEntries/Lodestar.VerifyChain()` recomputes the chain.
   - Containers run non-root with read-only filesystems and no Linux capabilities.
   - Secrets come from env or files locally and from Key Vault (CSI driver plus workload identity) on Azure. Never bake secrets into images.
6. **Device posture (field apps).** Tokens for the `lodestar-field` client are bound to a registered device (`device_id` claim). A lost phone is revoked from ADM-07, which disables the device in `auth` and revokes its Keycloak sessions.

## 3. API: OData v4 for data, OData actions for commands

- Base path per service behind the gateway: `/odata/v4/` (the gateway routes by entity set). Every service also serves `/odata/v4/$metadata` for its own entity sets. The gateway serves the merged service document at `/odata/v4/`.
- Entity sets (PascalCase plural): `Orders`, `OrderLineItems`, `Plans`, `Deferrals`, `Vehicles`, `Outlets`, `Calendar`, `DistrictTravel`, `ServiceAllowances`, `Trips`, `TripStops`, `PODs`, `LoadRecords`, `OfflineEvents`, `Notifications`, `AuditEntries`, `Users`, `Devices`, `AgentRuns`.
- Supported query options:
  - `$filter`: `eq ne gt ge lt le and or not`, `in`, `contains startswith endswith tolower toupper`, parentheses, null, dates/datetimes, enums as strings.
  - `$select`, `$orderby`, `$top`, `$skip`, `$count=true`, `$expand` (one level, with nested `$select`/`$filter`), `$search` (simple, on configured text fields).
  - Max `$top` is 500; server-driven paging via `@odata.nextLink`.
- Response shape: `{"@odata.context": ".../$metadata#Orders", "@odata.count": 145, "value": [...], "@odata.nextLink": "..."}`; single entity `Orders('ORD0104217')`; errors `{"error": {"code": "...", "message": "...", "target": "...", "details": []}}` with proper HTTP status codes.
- Writes: `POST /Orders`, `PATCH /Orders('id')` with `If-Match` ETags (`@odata.etag` from `updatedAt`). No `DELETE` on business records: cancel with an action.
- Commands are OData actions (namespace `Lodestar`), for example:
  - `POST /odata/v4/Plans('PLG-2026-04-07-v3')/Lodestar.Approve`
  - `POST /odata/v4/Deferrals('…')/Lodestar.Confirm`
  - `POST /odata/v4/Trips('…')/Lodestar.Release`
  - `POST /odata/v4/TripStops('…')/Lodestar.CompleteStop`
  - `POST /odata/v4/OfflineEvents/Lodestar.PushBatch`
  - `POST /odata/v4/AgentRuns` (start a draft)
  - `POST /odata/v4/AgentRuns('…')/Lodestar.Resume` (human decision)
  - `GET /odata/v4/AuditEntries/Lodestar.VerifyChain()`
- Health endpoints stay plain: `GET /health` (liveness), `GET /ready` (DB reachable). Both are unauthenticated and only reachable on the `app` network (the gateway does not route them).

## 4. Planning agent (LangGraph)

The graph (`backend/apps/agent`), one run per depot and run date:

1. `load_context`: reads Orders, Vehicles, Outlets, Calendar and DistrictTravel via OData with its service token.
2. `draft_plan`: uses the capacity and packing heuristics (chilled on reefers, 1 brand + 1 district per trip, max 2 trips per vehicle, windows).
3. `check_rules`: the 7 booklet hard rules. On a violation it loops back to `draft_plan` with constraints, at most 3 times.
4. `rank_deferrals`: protected outlets are never deferred, and each deferral gets a reason code.
5. `explain`: the model writes the "What it did / what it checked" text shown on DSP-02.
6. `await_approval`: a LangGraph interrupt. The run stops at status `NEEDS_APPROVAL`. Only a human `dispatcher` can resume it, with `approve`, `edit` or `reject`. **The agent can never publish a plan.**

- **Model:** a `MockChatModel` that implements LangChain's `BaseChatModel` and returns deterministic, template-based text and tool calls. It is chosen by `AGENT_MODEL=mock`, the default. Swapping in Azure OpenAI later means changing `AGENT_MODEL=azure-openai` plus env vars; the graph doesn't change.
- **Checkpoints** are stored in Postgres (schema `agent`), so a run survives restarts.
- **API:**
  - `POST /runs {depot, runDate}` → `{id, status}`
  - `GET /runs/{id}`
  - `POST /runs/{id}/resume {decision, edits?}`
  - `POST /ask {runId, question}`: the "Ask the planning agent" panel (DSP-39/40); it may propose an edit as a new draft.
- `planning` exposes these to clients as the OData entity set `AgentRuns`.

## 5. Data and seeding

- The competition CSVs are **never committed**. The rules forbid redistributing the datasets.
  - Put them in `./data/` locally; it is gitignored and mounted read-only into the `seed` job.
  - The seed loads them when present. Otherwise it creates a small synthetic demo dataset, clearly marked `synthetic`.
- Scenario values (people, the Tue 7 Apr incidents, the plan versions) are ours and live in `backend/prisma/scenario.ts`.

## 6. Tests and quality

| Layer | Tool | Where |
|---|---|---|
| Unit (TS) | **Jest** + **ts-mockito** (Mockito-style `mock / when / verify`) | `backend/**/*.spec.ts`, `frontend/**/*.test.tsx` |
| Unit (Python) | pytest + **mockito** (the Python port of Mockito) | `backend/apps/agent/tests` |
| UI e2e (web screens) | **Cypress** | `frontend/cypress` |
| Full-stack e2e (API + UI + auth, cross-browser) | **Playwright** | `tests/e2e` |
| Static analysis, coverage gate | **SonarQube** | `sonar-project.properties`, compose profile `qa` |

## 7. CI/CD

- **CircleCI**, pull requests: lint, typecheck, Jest, pytest and Cypress. Fast feedback on every PR.
- **Jenkins**, `main`:
  1. Build.
  2. Run the full `docker compose` stack plus Playwright.
  3. SonarQube analysis with a quality gate.
  4. Build images, run a Trivy scan, sign with cosign, push to ACR.
  5. `terraform plan`, then `apply` after manual approval.
  6. Bump image tags in `deploy/k8s/overlays/*` (a GitOps commit).
- **Argo CD**: continuous delivery from `deploy/k8s` to AKS (app-of-apps, auto-sync with self-heal on `dev`, manual sync on `prod`).

## 8. Azure (Terraform, `infra/terraform`)

- **Network:** VNet with subnets for AKS, Postgres, private endpoints and App Gateway; NSGs.
- **AKS:** Azure CNI overlay, workload identity plus OIDC issuer, Istio add-on, Azure Policy, Defender, Container Insights.
- **ACR:** Premium, private, admin disabled.
- **PostgreSQL Flexible Server:** private access, Entra authentication.
- **Key Vault:** RBAC, private endpoint.
- **Edge:** Front Door Premium with WAF.
- **Monitoring:** Log Analytics.
- **Identity:** Entra ID app registrations (`lodestar-api`, `lodestar-web`, `lodestar-field`, one per service).
- **Delivery:** Argo CD installed with Helm.
- **State:** remote state in a Storage Account.
- **Environments:** `envs/dev`, `envs/prod`.
- **Azure OpenAI:** declared but disabled (`enable_openai = false`) until the real model replaces the mock.

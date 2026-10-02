# Lodestar planning agent (`agent`)

Python 3.12 · FastAPI · **LangGraph** · pydantic v2. Contract: `docs/architecture/PLATFORM.md` §2 (zero trust), §3 (OData), §4 (agent), §6 (tests).

The agent **drafts** a delivery plan for one depot and run date, explains *what it did / what it checked*, ranks deferrals and then **stops**. Only a human `dispatcher` can approve, edit or reject. There is no code path that publishes a plan: the OData client is read-only, and an approved run is just a recorded decision that `planning` acts on with the dispatcher's own token.

## Graph

```
START → load_context → draft_plan → check_rules ─(violations, ≤ 3 redrafts)→ draft_plan
                                       └→ rank_deferrals → explain → await_approval (interrupt)
await_approval ── approve / reject → END
               └─ edit → apply_edits → check_rules → rank_deferrals → explain → await_approval
```

| Node | What it does |
|---|---|
| `load_context` | Tool-calling node: the model picks `fetch_*` tools for missing datasets (Orders, Outlets, Vehicles, Calendar, DistrictTravel, ServiceAllowances). Tools read OData with the agent's service token and refuse any depot/date outside the run's scope. |
| `draft_plan` | Capacity and packing heuristics ported from `backend/apps/planning/src`: chilled on reefers, van_only on vans, dry Fresh off reefers, 1 brand + 1 district per trip, max 2 trips per vehicle, weight/volume, minute budget (270 Fresh / 480 Style-Tech), windows. |
| `check_rules` | The 7 booklet rules (weight, volume, 270 min, 2 trips, fuel, van_only, mall, the mall checked against `mallWindow`) plus every stop arriving before its window closes. Violations become constraints (`prioritise` then `avoid`) and loop back to `draft_plan`, at most `AGENT_MAX_REDRAFTS` (3) times. Human edits are flagged, not redrafted. |
| `rank_deferrals` | Takes leftovers off the plan, keeps protected orders (score ≥ 91 or outlet flag) by bumping the lowest-score order when possible, otherwise sends them to `needsReview`. Ranks the rest, lowest score first, with reason codes `CAP_REEFER, CAP_TIME, ACCESS, WINDOW, FUEL, VEH_DOWN`. |
| `explain` | The model writes the DSP-02 "What it did / What it checked" text from structured facts. |
| `await_approval` | `interrupt()`; resumed with `Command(resume={decision, edits, by, roles})`. A resume without the `dispatcher` role or with a bad value is recorded and ignored (the run keeps waiting). |

"Ask the planning agent" (DSP-39/40) is a second small graph (`agent ⇄ ToolNode`) over a snapshot of the run with lookup tools (`plan_summary`, `rule_checks`, `capacity`, `list_deferrals`, `explain_order`, `lookup_vehicle`, `lookup_outlet`) and `propose_edit`, which previews an edit as a new draft version. It never mutates the run. The dispatcher applies a proposal with `resume {decision: "edit", edits: proposal.edits}`.

## Model

`AGENT_MODEL=mock` (default) uses `MockChatModel`, a deterministic `BaseChatModel` that emits LangChain tool calls, template explanations and answers grounded in tool results. `AGENT_MODEL=azure-openai` raises a clear *not configured yet* error unless `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` and `AZURE_OPENAI_API_VERSION` are set and `langchain-openai` is installed. The graph doesn't change.

## API

All routes except health need `Authorization: Bearer <RS256 JWT>` (issuer `OIDC_ISSUER`, audience `lodestar-api`, verified against the JWKS). Roles come from `realm_access.roles`; the `depot` claim (string or list) limits which runs a user may start or see.

| Method | Path | Roles | Body → response |
|---|---|---|---|
| POST | `/runs` | dispatcher | `{depot, runDate}` → `201 {id, status, version}` (runs to `NEEDS_APPROVAL`) |
| GET | `/runs/{id}` | dispatcher, admin | run view: `plan`, `ruleChecks`, `violations`, `deferrals`, `needsReview`, `explanation`, `decisions`, `history`, `canPublish: false` |
| POST | `/runs/{id}/resume` | dispatcher | `{decision: approve\|edit\|reject, edits?, comment?}`; edits: `{op: "move", orderId, vehicleId, tripNo?}` or `{op: "defer", orderId, reason}` |
| POST | `/ask` | dispatcher | `{runId, question}` → `{answer, toolCalls, proposal}` |
| GET | `/config` | dispatcher, admin | model (`AGENT_MODEL`, configured?, deployment), fallback, max redrafts, hard rules, limits, reason codes, what it reads; no secrets |
| GET | `/health` | none | liveness |
| GET | `/ready` | none | checkpoint DB reachable (503 if not) |

Errors use the OData shape `{"error": {"code", "message"}}`: 401/403 auth, 404 unknown run, 409 not waiting for approval, 422 validation or invalid edit (for example deferring a protected order), 502 upstream OData or service-token failure.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `AGENT_MODEL` | `mock` | `mock` or `azure-openai` |
| `DATABASE_URL` | unset | Postgres checkpoints in schema `agent` (Prisma `?schema=` is ignored). Unset → in-memory `MemorySaver` |
| `AGENT_DB_SCHEMA` | `agent` | checkpoint schema |
| `OIDC_ISSUER` | `http://identity:8080/realms/lodestar` | expected `iss` |
| `OIDC_JWKS_URL` | `<issuer>/protocol/openid-connect/certs` | JWKS to fetch keys from |
| `OIDC_AUDIENCE` | `lodestar-api` | expected `aud` |
| `JWT_LEEWAY_S` | `30` | clock skew |
| `OIDC_TOKEN_URL` | `<issuer>/protocol/openid-connect/token` | client-credentials endpoint |
| `OIDC_CLIENT_ID` | `svc-agent` | service identity |
| `OIDC_CLIENT_SECRET` / `OIDC_CLIENT_SECRET_FILE` | unset | service secret (env or mounted file) |
| `OIDC_SCOPE` | unset | e.g. `orders.read outlets.read fleet.read` |
| `LODESTAR_API_URL` | `http://gateway:8443` | OData base |
| `LODESTAR_SERVICE_URLS` | unset | direct URLs per entity set, e.g. `Orders=http://orders:3002,Vehicles=http://fleet:3004` |
| `ODATA_CA_BUNDLE` | unset | CA bundle for TLS to the gateway |
| `HTTP_TIMEOUT_S` / `ODATA_MAX_PAGES` | `10` / `50` | outbound limits |
| `AGENT_MAX_REDRAFTS` | `3` | rule loop cap |
| `AGENT_FIRST_DEPARTURE` | `03:30` | earliest departure |
| `LOG_LEVEL` | `INFO` | JSON logs to stdout; tokens and secrets are redacted |

## Develop and test

```bash
cd backend/apps/agent
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt     # Windows: .venv\Scripts\pip
.venv/bin/python -m pytest                        # writes coverage.xml
.venv/bin/uvicorn lodestar_agent.main:app --port 8000
```

Tests use pytest + **mockito** (`when / mock / verify / unstub`) with small synthetic fixtures (`tests/fixtures.py`), a locally generated RSA key and a stubbed JWKS. They never call a real LLM, identity provider or API.

## Container

`Dockerfile`: two stages on `python:3.12-slim`, no compilers or pip in the runtime image, runs as uid 10001, `HEALTHCHECK` on `/health`, uvicorn on port 8000. It works with a read-only root filesystem (no bytecode writes).

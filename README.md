# Waypoint Lodestar

**Every order, one thread.** A delivery planning and execution system for Waypoint Group's two depots (Peliyagoda and Kandy), built by Team Adagard for Tech-Triathlon 2026.

One system, five faces on one URL:

| Face | Who | Where | What they do |
|---|---|---|---|
| Lodestar Store | Store manager | Desktop and phone | Order before 4 PM, follow the ETA, count the delivery, report an issue |
| Lodestar Plan | Dispatcher | Desktop (phone on call) | Plan the day with the planning agent, review deferrals, approve, watch it live |
| Lodestar Dock | Loader | Phone (390 px) or bay tablet | Load in reverse stop order, flag a shortfall, release the vehicle |
| Lodestar Run | Driver | Phone (390 px), works offline | Drive the run, arrive, prove each delivery, sync later |
| Lodestar Admin | Admin | Desktop | People, phones, outlets, vehicles, audit log |

## Live demo

**URL:** _to be added once the Azure VM is up_ (`https://<label>.<region>.cloudapp.azure.com`, see [deploy/azure-demo](deploy/azure-demo/README.md)).

| Role | User | Password |
|---|---|---|
| Store manager (OUT106, Nuwara Eliya) | `fathima` | _set when the VM is created_ |
| Dispatcher (both depots) | `nilanthi` | _set when the VM is created_ |
| Loader (Kandy) | `kasun` | _set when the VM is created_ |
| Driver (VEH057, Kandy) | `ruwan` | _set when the VM is created_ |
| Admin | `admin` | _set when the VM is created_ |

On a local install the passwords are `lodestar-dev-only` (personas) and `lodestar-admin-dev-only` (admin).

## Run it locally

Needs Docker Desktop with Compose v2 (about 8 GB of memory for Docker).

```bash
cp .env.example .env          # optional: the dev defaults work as they are
docker compose up --build     # first build takes a while; then open https://localhost:8443
```

| Open | What |
|---|---|
| https://localhost:8443 | Start page: pick a role. The browser warns about the dev certificate once. |
| https://localhost:8443/field/ | Field app (driver, loader, store phone) on the same origin |
| https://localhost:8443/odata/v4/ | OData v4 API (bearer token required) |
| http://localhost:8180/auth | Keycloak admin console (local only) |

- **Data:** with the competition CSVs in `./data/` the seed uses them (120 outlets, 60 vehicles, the calendar); add `task2b_peak_day_scenarios.csv` and `task2b_peak_day_fleet.csv` and the demo day comes from the peak-day scenario. Without them a generated network of the same size is used. The CSVs are never committed. Details: [backend/prisma/DATA.md](backend/prisma/DATA.md).
- **The demo day:** every fresh install has one over-capacity delivery day: 100+ open orders across the three brands and both depots, vehicles in the workshop, outlets skipped yesterday, and no trips yet. It is **today in Sri Lanka** unless `DEMO_DATE=YYYY-MM-DD` is set in `.env`. To start the day again: `docker compose down -v && docker compose up`.
- **Phones:** every phone is bound to its user (zero trust). The four personas' phones are shared demo devices, so they sign in from any browser with no setup; anyone else's phone asks for access and an admin approves it (ADM-05).
- **Public address:** `PUBLIC_ORIGIN` in `.env` is the one setting for the URL people open (Keycloak hostname, issuer, redirect URIs, API).

## Judge walkthrough

Open the start page in a desktop browser. For the driver and the loader, use a phone, or the browser's device toolbar at 390 × 844. Each role signs in from its card on the start page.

**Store manager: order (desktop)**
1. Pick **Store manager** and sign in as `fathima`. SM-01 shows the order form for the next run that is still open, with the 4 PM cut-off countdown.
2. Add a line, change a quantity and press **Submit**. The order appears in the order history with its run date. (After 4 PM it goes to the following run.)
3. Open **Deliveries** (SM-02): today's two orders for OUT106 (chilled and ambient) are waiting to be planned.

**Dispatcher: plan and approve (desktop)**

4. Sign out, pick **Dispatcher** and sign in as `nilanthi`. On the **Cutoff queue** (DSP-01), choose the Kandy depot and today's run, then press **Draft the plan with the agent**. DSP-22 shows the agent working, then the draft opens on the **Plan board** (DSP-02).
5. Read the draft: trips per vehicle with stops in order, ETAs, the rule checks (weight, volume, temperature, access, windows, fuel), and the orders it could not fit, each with a reason code (for example `CAP_REEFER`) on **Review deferrals** (DSP-03). For Peliyagoda, the same step shows an over-capacity day: several deferrals, and any protected outlet (skipped yesterday) is sent for your decision instead of being deferred again.
6. Give the store's orders to Ruwan's van: on **Ask the planning agent** (DSP-39), ask it to move OUT106's orders onto VEH057, and accept its proposal (DSP-40). The draft now shows the move, and any rule it bends (for example the van's working minutes) as a violation.
7. Press **Approve & go live** (DSP-12). If the draft has violations, DSP-12 lists them and asks for an **Override reason**; it is recorded with the plan and in the audit log. The plan is now in effect: trips and stops exist, deferred orders move to the next operating day with their reason, and each affected store gets a notice.

**Loader: load and release (phone)**

8. Open the **Loader** card on a phone and sign in as `kasun`. The dock queue (LD-01) lists today's Kandy trips by bay.
9. Open VEH057's load sheet (LD-02): lines in reverse stop order. Tick them off; on one line, **Flag** a shortfall and **Send flag** (LD-03).
10. **Release** the vehicle (LD-04) with the seal number and reefer temperature. The trip and its orders go en route.

**Driver: deliver with proof (phone)**

11. Open the **Driver** card and sign in as `ruwan`. Today's run (DR-01) shows VEH057's stops. Press **Start trip**.
12. At OUT106: **Arrived**, then **Start delivery** (DR-02), count the units, capture the receiver's name and photo, record any exception, then **Complete stop** (DR-03).
13. Optional, offline (the app must have opened once online on that phone): switch the phone to airplane mode before the next stop, complete it, then reconnect. The outbox sends once and the records reconcile without duplicates.

**Store manager: receipt (desktop or phone)**

14. Sign in as `fathima` again. Deliveries (SM-02) shows the delivery as arrived. Count it, use **Report an issue** for any short or damaged item, and **Confirm receipt**. A short count creates a credit note.

**Dispatcher: the result**

15. As `nilanthi`, **Live operations** (DSP-04) shows the trip's progress and the delivered stops, and the **Deferral log** (DSP-17) lists every deferral with its reason and new date.

## Repository

| Folder | Contents |
|---|---|
| `frontend/` | Desk app (Next.js): start page, Lodestar Store desk, Plan, Admin |
| `mobile/` | Field app (Expo; served in the browser at `/field/`): Run, Dock, Store phone, Plan on call |
| `backend/` | OData v4 services (NestJS + Prisma): auth, orders, planning, fleet, outlets, trips, sync, notifications, audit; NGINX gateway; Keycloak realm; planning agent (`apps/agent`, Python + LangGraph) |
| `tests/` | Playwright full-stack and cross-role flows, design-conformance baselines (`tests/visual`), k6 load test |
| `tools/qa/` | The quality gate (`gate.sh`), stack readiness, Sonar gate, design baselines |
| `deploy/azure-demo/` | The live demo: one VM, Caddy with Let's Encrypt, production compose override |
| `infra/terraform/envs/demo` | Terraform for that VM. `envs/dev`, `envs/prod`, AKS and Istio are target architecture, not applied: see [infra/README.md](infra/README.md) |
| `docs/` | [Architecture](docs/architecture.md), [data model](docs/data-model.md), [platform contract](docs/architecture/PLATFORM.md), [QA and CI](docs/QA.md), [AI disclosure](docs/AI_DISCLOSURE.md) |

## How it is built

- **One origin, zero trust.** An NGINX gateway routes `/`, `/field/`, `/odata/v4/`, `/auth/` and `/ws/`. Every service verifies every token itself against Keycloak; field phones are bound to their user. Services talk to each other with their own client-credentials tokens.
- **OData v4 everywhere.** Each service owns one Postgres schema and exposes it as OData entity sets and bound actions (`Plans('…')/Lodestar.Approve`, `Trips('…')/Lodestar.Release`, `Orders('…')/Lodestar.ConfirmReceipt`).
- **Planning.** A deterministic planner and rule checker (capacity by weight and volume, temperature, van-only access, home depot, every outlet's delivery window, the mall delivery window, the weekly fuel quota and two trips a day; closed days are refused) inside a LangGraph agent with a human approval step; approving a plan that bends a rule needs a stated reason. Fuel used is recorded when a trip completes and resets every Monday. Approving a plan creates the trips and stops, plans the orders, records each deferral with its reason and rolls it to the next operating day, and tells the stores.
- **Offline first.** The field app keeps an outbox; the sync service applies batches idempotently, in the order they were saved, and resolves conflicts (field evidence wins).
- **Quality gate.** Lint, typecheck, unit suites with coverage, integration tests on a real Postgres, Sonar, and the full stack with Playwright (API, both apps, cross-role flows, design conformance). One command: `tools/qa/gate.sh`. CI: CircleCI. See [docs/QA.md](docs/QA.md).

## Departures from the Designathon design

The Day 5 Designathon submission is the specification. Where the build differs:

| Area | Design | Build | Why |
|---|---|---|---|
| Computer-vision auto-fill (scan, temperature, seal, damage) | Camera reads and fills the field; the person confirms | Not built: the person types or confirms the values. The fields work as designed without it. | Time; an on-device model needs training data we do not have. |
| Downloadable voice packs (Sinhala, Tamil) | Voice settings, pack download, voice unavailable (DR-33–35, LD-28–30, SM-37–39) | Not built. Read-aloud uses the phone's own text-to-speech where the build has it. | Time. |
| Screens not yet live | Every screen in P1–P6 | The screens a judge needs are live; the rest still show the generated design mock. The current list is in the design-conformance report (`tests/visual/report`). | Time; tracked by the conformance check, never hidden. |
| Field app on the web | Native phone apps | The same Expo app served in the browser at `/field/` (native builds are possible from the same code) | Judges use a browser; one URL for every role. |
| Persona phones | Every phone enrols and an admin approves it | The four seeded personas' phones are shared demo devices, so judges can sign in from any browser | Judging without a devtools step; every other user still enrols. |

## AI disclosure

[docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md): what AI does inside the product (and what it doesn't), and which tools were used to make it.

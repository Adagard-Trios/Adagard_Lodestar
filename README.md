# Waypoint Lodestar

**Every order, one thread.** A delivery planning system for Waypoint Group, built by Team Adagard for Tech-Triathlon 2026.

One system with four faces:

| Face | User | Platform |
|---|---|---|
| Lodestar Plan | Dispatcher | Web (desktop), on-call phone |
| Lodestar Dock | Loader | Phone, bay tablet |
| Lodestar Run | Driver | Phone (offline-first) |
| Lodestar Store | Store manager | Web, phone |

## Repository layout

| Folder | Contents |
|---|---|
| `frontend/` | Desk faces on the web (Next.js): Lodestar Store desk, Lodestar Plan, Lodestar Admin |
| `mobile/` | Field app (Expo, native iOS/Android plus a browser build): Store, Plan on-call, Dock phone and tablet, Run |
| `backend/` | OData v4 microservices (NestJS + Prisma), gateway (NGINX), Keycloak realm, planning agent (`apps/agent`, Python + LangGraph) |
| `tools/screengen/` | Turns the design boards into the website and app screens |
| `tests/e2e/` | Full-stack Playwright tests |
| `infra/terraform/` | Azure (AKS, Postgres, Key Vault, Front Door, Entra ID) |
| `deploy/` | Kubernetes (Kustomize + Istio) and Argo CD |
| `docs/` | Architecture contract (`docs/architecture/PLATFORM.md`), QA, AI disclosure |

## Setup

Needs Docker Desktop (with Compose v2).

```bash
cp .env.example .env         # optional: dev defaults are built in
docker compose up --build
```

| Open | What |
|---|---|
| https://localhost:8443 | Start page: pick a role (Store, Plan, Dock, Run, Admin). The browser warns about the dev certificate the first time. |
| https://localhost:8443/odata/v4/ | OData service document (send a bearer token) |
| https://localhost:8443/field/ | Field app in the browser (Dock, Run, Store and Plan phone), on the same origin |
| http://localhost:8180/auth | Keycloak admin (dev only) |

- **Sign in** as a persona: `fathima` (store manager), `nilanthi` (dispatcher), `kasun` (loader), `ruwan` (driver) or `admin`. Passwords come from `.env` (`LODESTAR_DEMO_PASSWORD`, `LODESTAR_ADMIN_PASSWORD`).
- **Field app sign-in:** every phone is checked against the user's approved device (zero trust).
  - **Seeded phones:** ruwan `DEV-RB-01`, kasun `DEV-KJ-01`, fathima `DEV-FR-01`, nilanthi `DEV-NP-01`. These four are *shared demo phones* (`Device.sharedDemo`, set by the seed only): after one of these personas signs in, any browser adopts that phone's id, so no setup is needed.
  - **Any other phone** asks for access (SM-32), and an admin approves it on ADM-05.
- **Public origin:** `PUBLIC_ORIGIN` (default `https://localhost:8443`) is the one URL people open. It sets the Keycloak hostname and issuer and the realm's redirect URIs and web origins (placeholders in the realm file, applied on import). The desk website and the field app take their API, WebSocket and sign-in URLs from the page.
- **Realm changes:** Keycloak imports `backend/identity/lodestar-realm.json` only when the realm doesn't exist yet. To apply an edit to a running stack, delete the `lodestar` realm in the admin console (http://localhost:8180/auth) and run `docker compose restart identity`. The users keep their fixed ids, so seeded data still lines up.
- **Competition data** is never committed. To seed with it, put the CSVs in `./data/` (see `backend/prisma/DATA.md`). Without them, a small synthetic dataset is used.
- **Quality stack:** `docker compose --profile qa up sonarqube`. See `docs/QA.md`.
- **Architecture:** read `docs/architecture/PLATFORM.md`. It covers zero trust, OData conventions, the LangGraph planning agent (mock model for now), CI/CD (CircleCI on PRs, Jenkins on main, Argo CD to AKS) and Azure.

## Departures from the Designathon design

The Designathon submission (Day 5) is the implementation specification. Significant departures are recorded here as the build progresses.

_None yet._

## Designed features to build

| # | Feature | Screens | Notes |
|---|---|---|---|
| 1 | **Computer-vision auto-fill** for scan, temperature, seal and damage ("Read from photo · confirm"). The camera reads the barcode/label, reefer display, seal number or visible damage and fills the existing field; the person always confirms, and manual entry is the fallback. | LD-09, LD-10, LD-04, DR-12, DR-03, DR-18, SM-03 | Shown in the Designathon screens. Runs on the device so it works offline; if unavailable, the fields work manually as designed. |
| 2 | **On-device voice read-aloud** in English, Sinhala and Tamil: the phone or tablet reads the stop, the next load line or the ETA aloud. The voice model runs on the device so it works with no network. Output only, not voice commands. | DR-01, DR-02, LD-02, SM-02; voice settings, voice pack download, voice unavailable: DR-33, DR-34, DR-35 (driver), LD-28, LD-29, LD-30 (loader), SM-37, SM-38, SM-39 (store) | Shown in the Designathon screens. If the voice pack is missing, text works as designed. |

## AI tool disclosure

See `docs/` (added in the Hackathon build). Computer-vision and on-device voice read-aloud features will be disclosed there when they are built.

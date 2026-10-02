# QA and CI · Waypoint Lodestar

How the platform is tested and shipped. The binding contract is [architecture/PLATFORM.md](architecture/PLATFORM.md) (§6 tests, §7 CI/CD); tests are written against it, not against a service's current code.

## Which tool covers what

| Layer | Tool | Where | What it proves |
|---|---|---|---|
| Unit, web (TS) | Jest + React Testing Library (`next/jest`) | `frontend/__tests__` | `ScreenShell`: `data-lk` click and keyboard navigation (Enter, Space), `nav` vs `go` (replace vs push), back behaviour (history back only with a same-site referrer), the 1.5 s auto-advance (fake timers), the "Continues in … on the phone" toast. The home page directory matches `frontend/screens` (`FACES`, `FLOWS`). The live layer: the OData client (query options, keys, `@odata.nextLink` paging on the same origin only, If-Match on PATCH, the OData error body, 401 → renew → retry, else sign-in), sign-in (OIDC code + PKCE through `oidc-client-ts`, tokens in sessionStorage only, refresh-token renewal, logout), the route guard and role landing, the hooks (`useEntitySet`, `useEntity`, `useAction`, `useRealtime`), the Socket.IO client, and live screens (DSP-01/02/03/06/12/39, SM-01/27/29, ADM-04/07/16/20) against a mocked API at the HTTP level. |
| Unit, services (TS) | Jest + ts-mockito | `backend/**/*.spec.ts` | owned by the backend team |
| Unit, agent (Python) | pytest + mockito | `backend/apps/agent/tests` | owned by the agent team |
| UI e2e, desk screens | Cypress | `frontend/cypress` | Design preview: every generated desktop screen is visited and every `data-lk` element clicked; it must land on the destination path, or show the cross-device notice for phone-only targets. Auto-advancing screens are checked with a frozen clock. Plus the three demo flows as readable specs. Live mode (`CYPRESS_LIVE=1`, against the stack): signs in through Keycloak per persona (`cy.session`, `cy.origin` when identity is on another origin) and checks the live screens show the seeded scenario. |
| Full stack e2e | Playwright | `tests/e2e` | Zero trust (401, 403, ABAC row filters, expired, tampered and unsigned tokens), OData v4 conformance ($metadata CSDL, query options, paging, errors, ETags), actions (Approve, AgentRuns human-in-the-loop), audit hash chain, and UI smoke on Chromium, Firefox, WebKit and the mobile-web build in a phone viewport. |
| Static analysis, coverage gate | SonarQube | `sonar-project.properties`, compose profile `qa` | Frontend, mobile, backend (TS) and the agent (Python). Generated screens, `node_modules` and migrations are excluded. |

The generated screens (`frontend/screens`, `frontend/app/<face>/<screen>/page.tsx`, `mobile/src/screens`) are design output from `tools/screengen`. They are tested through behaviour (Cypress click-through), never edited by hand, and excluded from coverage and duplication.

### How the Cypress click-through finds its links

`frontend/cypress/plugins/screens.ts` builds the link table when Cypress starts:

1. `tools/screengen/out/screens.json` if it exists. It is the generator's output and is gitignored, so this only happens locally after `npm run screens`.
2. Otherwise, the `const nav = {…}` table in every generated `frontend/app/{store,plan,admin}/*/page.tsx`. This is what CI uses.

Set `SCREENS_SOURCE=pages` to force option 2 locally.

### Test users

The personas come from `backend/identity/lodestar-realm.json`. Their passwords are dev-only defaults.

| Persona | Username | Role | Claims |
|---|---|---|---|
| Nilanthi Perera | `nilanthi` | `dispatcher` | `depot` PELIYAGODA + KANDY |
| Fathima Rizwan | `fathima` | `store_manager` | `outlet_id` OUT106, `depot` KANDY |
| Kasun Jayawardena | `kasun` | `loader` | `depot` KANDY, `device_id` |
| Ruwan Bandara | `ruwan` | `driver` | `vehicle_id` VEH057, `device_id` |
| Admin | `admin` | `admin` | |

Tokens come from `tests/e2e/lib/auth.ts`:
- It tries the password grant first. `lodestar-web` ships with direct access grants off, so the helper then falls back to authorization code + PKCE through Keycloak's login form, over HTTP.
- `loginViaUi(page, persona)` drives the same form in a browser.

## Running locally

### Jest (frontend)

```bash
cd frontend
npm test                # watch: npm run test:watch
npm run test:cov        # coverage in frontend/coverage (lcov.info for Sonar)
npm run typecheck       # app, Jest (tsconfig.jest.json) and Cypress (cypress/tsconfig.json) projects
```

### The website: design preview and live mode

Every desk screen (`frontend/app/<store|plan|admin>/<screen>`) can show two things:

- **Live** (the default): the screen signs in through Keycloak and shows real data. A screen with a hand-written `frontend/live/<screen-key>.tsx` renders it (32 screens; `tools/screengen/gen-web.js` wires them); the others show the design. Every face route sits behind a guard (`app/<face>/layout.tsx`): no session → Keycloak; another role → that role's face. Sign-in, reset-access and session-expired screens stay public.
- **Design preview**: the static, clickable prototype, with no sign-in and no API. `?design=1` turns it on for the tab (sessionStorage `lodestar.design`), `?design=0` turns it off. Cypress `openScreen()` and the untagged Playwright web smoke use it. Build with `NEXT_PUBLIC_DESIGN_PREVIEW=off` to disable the switch, or `NEXT_PUBLIC_LODESTAR_MODE=design` for a prototype-only build.

Endpoints come from the page origin (gateway): API `/odata/v4`, Keycloak `/auth/realms/lodestar` (client `lodestar-web`), Socket.IO `/ws/`. Override them at build time with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_OIDC_AUTHORITY`, `NEXT_PUBLIC_OIDC_CLIENT_ID` and `NEXT_PUBLIC_WS_URL` (Docker build args in `frontend/Dockerfile`).

### Cypress (frontend)

Run it against a production build. The base URL comes from `CYPRESS_BASE_URL` (or `BASE_URL`) and defaults to `http://localhost:3000`.

npm 11 does not run dependency install scripts by default, so `npm ci` doesn't download the Cypress binary. Run `npx cypress install` once, after `npm ci`.

```bash
cd frontend
npx cypress install && npx cypress verify
npm run build && npx next start -p 3200 &
CYPRESS_BASE_URL=http://localhost:3200 npm run cy:run            # headless (Electron)
CYPRESS_BASE_URL=http://localhost:3200 npm run cy:open           # interactive
CYPRESS_SCREENS=dsp-0,adm-07 CYPRESS_BASE_URL=http://localhost:3200 npm run cy:run -- --spec cypress/e2e/clickthrough.cy.ts
npm run e2e:ci          # starts next on :3000, waits, runs Cypress, stops the server

# live mode, against the stack (docker compose up): signs in through Keycloak, checks seeded data
CYPRESS_LIVE=1 CYPRESS_BASE_URL=https://localhost:8443 npm run cy:run -- --spec "cypress/e2e/live/**/*.cy.ts"
```

Live-mode settings: `CYPRESS_KEYCLOAK_ORIGIN` (only when identity is not on the app's origin; then the login runs in `cy.origin`), `CYPRESS_LODESTAR_PASSWORD` and `CYPRESS_LODESTAR_ADMIN_PASSWORD` (default: the realm's dev passwords), `CYPRESS_USER_DISPATCHER`, `CYPRESS_USER_STORE`, `CYPRESS_USER_ADMIN` (default `nilanthi`, `fathima`, `admin`). Without `CYPRESS_LIVE` the live specs are skipped.

If Cypress fails to start with `bad option: --smoke-test`, the shell has `ELECTRON_RUN_AS_NODE=1` set (VS Code terminals do this): `env -u ELECTRON_RUN_AS_NODE npm run cy:run`.

Specs:
- `cypress/e2e/clickthrough.cy.ts`: every screen and every link.
- `cypress/e2e/flows/1-happy-path.cy.ts`: SM-01 → DSP-01 → DSP-22 (auto) → DSP-02 → DSP-03 → DSP-12, then the handover to Lodestar Dock.
- `cypress/e2e/flows/2-dead-zone.cy.ts`: DSP-A1 → DSP-A1b.
- `cypress/e2e/flows/3-reefer-down.cy.ts`: DSP-B1, approve & send, or edit manually.
- `cypress/e2e/live/live-screens.cy.ts` (live mode): dispatcher lands on Plan, plan board shows the seeded trip lanes, cutoff queue, live operations (trip `TRP-VEH057-20260407`), deferral log and outlet profile; the store manager sees only OUT106 orders, deliveries and receipts, and can't open Plan; the admin's audit log shows hash-chained entries, VerifyChain is valid, and people, devices and outlets load.

### Playwright (full stack)

```bash
docker compose up -d --build                     # gateway https://localhost:8443, Keycloak http://localhost:8180, field app https://localhost:8443/field/
cd tests/e2e
npm ci && npx playwright install --with-deps chromium firefox webkit
npm test                 # everything; @stack specs skip if the stack is down
npm run test:stack       # only @stack (API, auth, audit, Keycloak login)
npm run test:smoke       # only what needs no backend (web and mobile-web UI smoke)
npm run report           # opens reports/html
E2E_WEB_URL=http://localhost:3200 npm run test:smoke -- --project=web-chromium    # desk UI against a local next start (design preview)
npm run test:stack -- --project=web-chromium specs/ui/web-live.spec.ts              # desk UI signed in, live data
```

`specs/ui/web-live.spec.ts` (@stack): an anonymous visit goes to Keycloak (code + PKCE S256); the dispatcher signs in on DSP-06, lands on Plan, and the plan board shows the real trips; the dispatcher starts a planning-agent run on DSP-01, DSP-22 follows it to NEEDS_APPROVAL, and DSP-12 approves it (`AgentRuns('…')/Lodestar.Resume`), checked through the API; the store manager sees only their outlet's orders and is sent back from Plan; the admin's audit log has entries and VerifyChain is valid; sign-out ends the Keycloak session. Tokens must be in sessionStorage, never localStorage.

| Env | Default | Meaning |
|---|---|---|
| `E2E_BASE_URL` | `https://localhost:8443` | gateway (OData at `/odata/v4`) |
| `E2E_WEB_URL` | `E2E_BASE_URL` | desk website |
| `E2E_MOBILE_URL` | `<E2E_BASE_URL>/field/` | Expo web export (keep the trailing slash) |
| `E2E_KEYCLOAK_URL`, `E2E_REALM`, `E2E_ISSUER` | `http://localhost:8180`, `lodestar`, `<keycloak>/realms/lodestar` | identity |
| `E2E_CLIENT_ID`, `E2E_CLIENT_SECRET`, `E2E_REDIRECT_URI`, `E2E_AUTH_MODE` | `lodestar-web`, none, `https://localhost:8443/`, `auto` | token acquisition (`password`, `code` or `auto`) |
| `E2E_PASSWORD`, `E2E_PASSWORD_ADMIN`, `E2E_USER_<ROLE>` | realm dev defaults | persona credentials |
| `E2E_AGENT_CLIENT_SECRET` | none | enables the "svc-agent cannot publish" test |
| `E2E_EXPIRED_TOKEN` | none | a genuinely expired Keycloak token, so the test isolates the `exp` check (otherwise `exp` is back-dated, which also breaks the signature) |
| `E2E_ORDER_OUTLET_PROP` | `outletId` | Orders property holding the outlet (ABAC test) |
| `E2E_REQUIRE_STACK` | unset | `1` in CI: a missing stack fails instead of skipping |

Tags: full-stack specs carry `@stack` (`--grep @stack` / `--grep-invert @stack`). Reports go to `tests/e2e/reports/html` (HTML) and `reports/junit.xml`.

### Design conformance

```bash
node tools/qa/design-baselines.mjs                    # 1. baselines from Designing/pages P1–P6 (local only; needs Google Fonts)
cd tests/e2e && npx playwright test --project=visual   # 2. live screens vs baselines (needs the stack); report in tests/visual/report/
```

Step 1 renders every screen frame with Playwright's Chromium and writes `tests/visual/baselines/<ID>.png` + `<ID>.json` (ids drawn twice get a suffix, e.g. `SM-02--deliveries-desktop`): the frame's screen area (phone status bar / home indicator and desktop browser bar cropped, as the apps run under real OS and browser chrome) and its key elements, i.e. every element with its own text (boxed by the text) and every control (button, link, input, ARIA role), keyed by `kind|rendered text#occurrence`, with box and computed styles. `tokens.json` holds the style guide's CSS custom properties per role mode and the design palette. Frames without a screen id (component sheets) are listed in `index.json` and in the report as excluded.

Step 2 opens each screen as its persona (one Keycloak sign-in per app, in the same tab) at the baseline's viewport, with the clock frozen at `E2E_DEMO_DATE` 10:00 Asia/Colombo, and checks:

| Check | Threshold |
|---|---|
| every static key element present, box (x, y, w, h) | within **2 px** |
| token-driven styles: text colour, typeface, weight, size; control background, radius, padding, gap | **exactly equal** |
| screenshot vs baseline, masked | at most **1 %** of unmasked pixels differ (a pixel differs when a channel is off by more than **25/255**) |
| style-guide tokens vs desk CSS (computed in the live app); field app colour literals vs the design palette, its fonts vs the design typefaces | **exactly equal** |

Masks: elements whose text has a digit, a weekday or a month name (times, dates, ids, counts, quantities) on either side are painted out of both images (+2 px) and never position-matched. A screen whose route renders the generated static mock (desk page without `LiveSwitch`, field key not in `LIVE`) is **not implemented** and fails; one that differs is **drifted** (live capture + diff image in the report); one that could not be opened (sign-in or navigation failed) is **error** and fails. Results: `tests/visual/report/index.html` and `report.json`. No retries (verdicts are deterministic); thresholds are not to be raised to get green.

### SonarQube (local)

```bash
docker compose --profile qa up -d sonarqube             # http://localhost:9000, admin/admin on first start
# My Account → Security → generate a token, then:
export SONAR_TOKEN=<token>
SONAR_HOST_URL=http://localhost:9000 tools/qa/sonar-gate.sh   # creates the "Lodestar" gate and selects it
tools/qa/gate.sh --no-stack                             # suites with coverage, then the scan, waiting for the gate
```

Coverage is read from `frontend/coverage/lcov.info`, `mobile/coverage/lcov.info`, `backend/coverage/lcov.info` and `backend/apps/agent/coverage.xml`. Generated screens (`frontend/screens`, the generated `page.tsx` routes, `mobile/src/screens`), `Designing/`, `data/` and every CSV are excluded (`sonar-project.properties`).

## The gate

One command runs everything CI runs, in the same order:

```bash
tools/qa/gate.sh              # lint, typecheck, unit suites, integration, fresh compose stack + Playwright, Sonar
tools/qa/gate.sh --no-stack   # without rebuilding the stack
tools/qa/gate.sh --no-sonar   # without the Sonar stage
```

It prints PASS/FAIL per stage and exits non-zero if any stage failed. The full-stack stage runs `docker compose down -v` first, so the seed is fresh. `tools/qa/wait-stack.sh` waits until the seed has finished, every container is healthy and the gateway serves the start page, `$metadata` and Keycloak.

### Quality gate "Lodestar"

| Condition (new code) | Fails when |
|---|---|
| Bugs | > 0 |
| Vulnerabilities | > 0 |
| Blocker issues | > 0 |
| Critical issues | > 0 |
| Coverage | < 80 % |
| Duplicated lines | > 3 % |

`tools/qa/sonar-gate.sh` creates it on a local SonarQube or on SonarQube Cloud (with `SONAR_ORGANIZATION`).

## CI/CD flow

```
PR ──▶ CircleCI pr-checks: lint · typecheck · unit suites ∥ · integration · Sonar gate · full stack (2 shards)
main ─▶ CircleCI main: the same ─▶ images → ghcr.io (SHA tag) ─▶ tag bump in deploy/k8s/overlays/demo [skip ci]
                                 ─▶ Argo CD syncs the demo VM's k3s ─▶ smoke test of the public URL as the four roles
```

Jenkins (`Jenkinsfile`) is not on the live path any more; it is kept for reference only.

### CircleCI jobs (`.circleci/config.yml`)

| Stage | Jobs |
|---|---|
| Lint and typecheck | `frontend-lint`, `frontend-typecheck`, `backend-lint`, `backend-typecheck`, `mobile-typecheck`, `screengen-check` |
| Unit suites (parallel, with coverage) | `frontend-jest`, `mobile-jest`, `backend-jest`, `agent-pytest`, `frontend-build` → `frontend-cypress` |
| Integration | `backend-integration`: OData endpoints against a Postgres service container (`npm run test:int`) |
| Sonar | `sonar`: SonarQube Cloud scan with every suite's coverage, `sonar.qualitygate.wait=true` |
| Full stack | `full-stack` (machine executor, 2 shards): `docker compose up --build` on synthetic data, `tools/qa/wait-stack.sh`, then Playwright projects `api`, `web-chromium`, `mobile-web`, `flows`, `clicks`, `visual` |
| Deliver (main only) | `images` requires every job above; then `gitops-bump`, then `smoke-public` |

Artifacts: coverage per workspace, the Playwright HTML report, traces and screenshots of failures (`playwright-traces`), the design-conformance report with diff images, and the stack logs when a job fails.

Expected time per run (free plan, 30,000 credits a month): about 90 credit-minutes for a pull request (≈ 900 credits: the two full-stack shards are ~50 of them) and about 110 on `main`, so roughly 25–30 runs a month. Wall-clock time is about 30 minutes, set by the full-stack shards.

Caching: npm per workspace (`circleci/node` orb), pip, the Cypress binary, the Next build cache and the Playwright browsers. Docker layer caching is left off: it costs 200 credits per job, more than the build time it saves here.

### Setting up the credentials (owner only)

1. **SonarQube Cloud**: sign in at sonarcloud.io with GitHub, import the repository (free for public repositories), note the organization key and project key. Run `SONAR_HOST_URL=https://sonarcloud.io SONAR_TOKEN=<token> SONAR_ORGANIZATION=<org> SONAR_PROJECT_KEY=<key> tools/qa/sonar-gate.sh`. Turn off "Automatic Analysis" for the project (CI analysis replaces it).
2. **CircleCI**: set up the project from the GitHub repository using the existing `.circleci/config.yml`. Organization Settings → Contexts:
   - `sonarcloud`: `SONAR_TOKEN`, `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY`
   - `ghcr`: `GHCR_USER` and `GHCR_TOKEN` (a GitHub token with `write:packages`)
   - `smoke`: nothing secret today (the demo personas' passwords are public in the README); kept for later
3. **Deploy key** for the tag bump: `ssh-keygen -t ed25519 -f lodestar-ci -N ""`; add `lodestar-ci.pub` to the GitHub repository as a deploy key **with write access**; add the private key in CircleCI → Project Settings → SSH Keys (host `github.com`); put its fingerprint in the `deploy-key-fingerprint` pipeline parameter.
4. Set the `public-url` pipeline parameter once the demo URL is live.

If SonarQube Cloud is not wanted, the `sonar` job can instead start `sonarqube:community` as a service container and scan against it.

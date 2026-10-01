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
docker compose up -d --build                     # gateway https://localhost:8443, Keycloak http://localhost:8180, mobile-web http://localhost:8082
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
| `E2E_MOBILE_URL` | `http://localhost:8082` | Expo web export |
| `E2E_KEYCLOAK_URL`, `E2E_REALM`, `E2E_ISSUER` | `http://localhost:8180`, `lodestar`, `<keycloak>/realms/lodestar` | identity |
| `E2E_CLIENT_ID`, `E2E_CLIENT_SECRET`, `E2E_REDIRECT_URI`, `E2E_AUTH_MODE` | `lodestar-web`, none, `https://localhost:8443/`, `auto` | token acquisition (`password`, `code` or `auto`) |
| `E2E_PASSWORD`, `E2E_PASSWORD_ADMIN`, `E2E_USER_<ROLE>` | realm dev defaults | persona credentials |
| `E2E_AGENT_CLIENT_SECRET` | none | enables the "svc-agent cannot publish" test |
| `E2E_EXPIRED_TOKEN` | none | a genuinely expired Keycloak token, so the test isolates the `exp` check (otherwise `exp` is back-dated, which also breaks the signature) |
| `E2E_ORDER_OUTLET_PROP` | `outletId` | Orders property holding the outlet (ABAC test) |
| `E2E_REQUIRE_STACK` | unset | `1` in CI: a missing stack fails instead of skipping |

Tags: full-stack specs carry `@stack` (`--grep @stack` / `--grep-invert @stack`). Reports go to `tests/e2e/reports/html` (HTML) and `reports/junit.xml`.

### SonarQube

```bash
docker compose --profile qa up -d sonarqube      # http://localhost:9000 (admin/admin on first start)
# produce coverage first: frontend `npm run test:cov`, backend `npm run test:cov`, agent `pytest` (writes coverage.xml)
docker run --rm --network host -e SONAR_HOST_URL=http://localhost:9000 -e SONAR_TOKEN=<token> \
  -v "$PWD:/usr/src" sonarsource/sonar-scanner-cli
```

Coverage is read from:
- `frontend/coverage/lcov.info`
- `backend/coverage/lcov.info`
- `backend/apps/agent/coverage.xml`

## CI/CD flow

```
feature branch ──PR──▶ CircleCI (pr-checks) ──merge──▶ main ──▶ Jenkins ──GitOps commit──▶ deploy/k8s/overlays/dev ──▶ Argo CD ──▶ AKS dev
```

### CircleCI: pull requests (`.circleci/config.yml`)

The `pr-checks` workflow runs on every branch except `main`. Enable "Only build pull requests" in the project settings.

| Area | Jobs |
|---|---|
| Frontend | `frontend-lint`, `frontend-typecheck`, `frontend-jest` (JUnit and lcov), `frontend-build`, then `frontend-cypress`, which serves the built `.next` with `next start` and runs the whole Cypress suite |
| Mobile | `mobile-typecheck` |
| Backend | `backend-lint`, `backend-typecheck`, `backend-jest` |
| Agent | `agent-pytest` (Python 3.12, JUnit, `coverage.xml`) |
| Tools | `screengen-check` (`node --check` on `tools/screengen/*.js`) |

Caching:
- npm through the `circleci/node` orb.
- pip through the `circleci/python` orb.
- The Cypress binary (`~/.cache/Cypress`) and the Next build cache.

### Jenkins: `main` (`Jenkinsfile`)

1. Checkout. GitOps commits (`[gitops]`) are recognised and not rebuilt.
2. Unit suites in parallel:
   - frontend: lint, typecheck, Jest, build
   - mobile: typecheck
   - backend: lint, typecheck, Jest
   - agent: pytest
   - screengen: syntax check
3. `docker compose up -d --build --wait`, then wait for the gateway and Keycloak.
4. Playwright, with `E2E_REQUIRE_STACK=1`. Publishes the JUnit results and the HTML report.
5. SonarQube scan with `waitForQualityGate abortPipeline: true`.
6. Build an image for every service, tagged `dev-<sha7>`.
7. Trivy scan: HIGH or CRITICAL findings fail the build.
8. Push to ACR, then `cosign sign` on the pushed digest.
9. `terraform plan` for `infra/terraform/envs/dev`, a manual `input` approval, then `apply`.
10. `kustomize edit set image` in `deploy/k8s/overlays/dev`, committed as `[gitops] [skip ci]` and pushed to the branch Argo CD tracks.
11. Always: `docker compose down -v`.

Jenkins credentials are passed as parameters. Every id below is a placeholder to create.

| Parameter (default id) | Kind | Used for |
|---|---|---|
| `ACR_CREDENTIALS_ID` (`acr-push`) | username/password | `docker login` to ACR |
| `AZURE_SP_CREDENTIALS_ID` (`azure-sp-dev`) | Azure service principal | Terraform `ARM_*` |
| `TF_BACKEND_CREDENTIALS_ID` (`tf-backend-dev-hcl`) | secret file | `backend.hcl` |
| `TF_VARS_CREDENTIALS_ID` (`tf-vars-dev`) | secret file | `terraform.tfvars` |
| `COSIGN_KEY_CREDENTIALS_ID` (`cosign-key`) | secret file | cosign private key |
| `COSIGN_PASSWORD_CREDENTIALS_ID` (`cosign-password`) | secret text | cosign key password |
| `GIT_CREDENTIALS_ID` (`github-gitops`) | username/PAT | pushing the GitOps commit |
| `SONARQUBE_SERVER` (`sonarqube`) | Jenkins SonarQube server entry, with its token | scan + quality gate |

### Argo CD: delivery

Argo CD watches `deploy/k8s` (app-of-apps in `deploy/argocd`):
- `dev` auto-syncs with self-heal, so the Jenkins tag bump rolls out without anyone touching the cluster.
- `prod` syncs manually.

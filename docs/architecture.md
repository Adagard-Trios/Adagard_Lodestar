# Architecture

The detailed design (zero trust, OData conventions, offline sync, the planning agent) is in [architecture/PLATFORM.md](architecture/PLATFORM.md). The data model is in [data-model.md](data-model.md). Images: [architecture.svg](architecture.svg), [delivery.svg](delivery.svg), [data-model.svg](data-model.svg).

The images are exported from the Mermaid source on these pages with mermaid-cli, for example `npx @mermaid-js/mermaid-cli -i architecture.mmd -o docs/architecture.svg -b white`. `node tools/docs/erd.mjs` regenerates `data-model.md` from `schema.prisma`, and `--check` fails when it is out of date.

## Runtime: one origin, four roles

Every face is served from one origin. The public demo runs the same `docker compose` stack on one Azure VM behind Caddy ([deploy/azure-demo](../deploy/azure-demo/README.md)); a laptop runs it without Caddy on `https://localhost:8443`.

```mermaid
flowchart LR
  subgraph Browsers["Browsers (desktop and phone)"]
    desk["Desk app<br/>store desk · dispatcher · admin"]
    field["Field app (Expo web)<br/>driver · loader · store phone<br/>offline outbox"]
  end

  caddy["Caddy :443<br/>Let's Encrypt<br/>(demo VM only)"]
  gw["Gateway (NGINX)<br/>TLS · security headers · routing"]

  subgraph Edge["edge network"]
    fe["frontend<br/>Next.js"]
    mw["mobile-web<br/>Expo web build"]
  end

  kc["Keycloak<br/>OIDC + PKCE, device binding"]

  subgraph App["app network: every service verifies every token (JWKS)"]
    auth["auth<br/>users · devices"]
    orders["orders<br/>4 PM cut-off"]
    planning["planning<br/>plans · approval → trips"]
    agent["planning agent<br/>LangGraph · deterministic planner"]
    fleet["fleet"]
    outlets["outlets<br/>calendar · travel"]
    trips["trips<br/>load · release · POD"]
    sync["sync<br/>offline batches · conflicts"]
    notif["notifications<br/>notices · Socket.IO"]
    audit["audit<br/>hash chain of every write"]
  end

  subgraph Data["data network"]
    pg[("Postgres 16<br/>one schema per service")]
    redis[("Redis<br/>socket fan-out")]
  end

  desk --> caddy
  field --> caddy
  caddy --> gw
  gw -- "/" --> fe
  gw -- "/field/" --> mw
  gw -- "/auth/" --> kc
  gw -- "/odata/v4/*" --> App
  gw -- "/ws/" --> notif
  planning -- "drafts (dispatcher's token)" --> agent
  agent -- "reads via OData (service token)" --> orders
  planning -- "notices, plan_published" --> notif
  trips -- "trip_released" --> notif
  App --> pg
  kc --> pg
  notif --> redis
```

| Path | Goes to |
|---|---|
| `/` | Desk app and the start page (pick a role) |
| `/field/` | Field app for driver, loader and the store phone |
| `/odata/v4/<EntitySet>` | The service that owns the entity set (OData v4) |
| `/auth/` | Keycloak (sign-in, tokens) |
| `/ws/` | Realtime events (Socket.IO) |

## Delivery: from a pull request to the demo

```mermaid
flowchart LR
  dev["Pull request"] --> ci["CircleCI pr-checks<br/>lint · typecheck · unit suites<br/>integration (Postgres) · Sonar gate<br/>full stack + Playwright (2 shards)"]
  ci -->|merge| main["CircleCI main<br/>same checks"]
  main --> img["14 images → ghcr.io<br/>tag = commit SHA"]
  img --> bump["kustomize tag bump<br/>deploy/k8s/overlays/demo [skip ci]"]
  bump --> argo["Argo CD on the VM's k3s<br/>(target: built, cut over only when verified)"]
  main --> smoke["Smoke test of the public URL<br/>(waits for /version = SHA)"]
  vm["Demo VM: docker compose + Caddy<br/>(live path today)"]
  argo -.-> vm
```

What is applied and what is target architecture is listed in [infra/README.md](../infra/README.md).

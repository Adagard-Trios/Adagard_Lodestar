# Lodestar desk website (Store desk, Plan, Admin)

Next.js 16 app. Read `node_modules/next/dist/docs` before using Next APIs (see AGENTS.md).

## How a screen is built

| Path | What | Written by |
|---|---|---|
| `screens/<key>.tsx` | The design screen as static markup | `tools/screengen/gen-web.js` (don't edit) |
| `app/<face>/<key>/page.tsx` | The route: `ScreenShell` + the design, or the live screen | `gen-web.js` (don't edit) |
| `live/<key>.tsx` | The live screen: the design's markup and classes, bound to the API | by hand |
| `app/<face>/layout.tsx` | The face's route guard (`components/live/FaceGate.tsx`) | by hand |

When `live/<key>.tsx` exists, `gen-web.js` makes the route render it (through `components/live/LiveSwitch.tsx`) inside the same `ScreenShell`, so the design's `data-lk` links keep working. To start a new live screen, copy the generated JSX of the same key, swap the sidebar or top bar for `PlanSide`, `StoreTop` or `AdminSide` (`components/live/chrome.tsx`), bind lists and figures with the hooks, and run `node tools/screengen/gen-web.js`.

## Layers

- `lib/auth`: OIDC authorization code + PKCE against Keycloak with `oidc-client-ts`. Tokens live in sessionStorage only, and are renewed with the refresh token. `session.ts` maps roles to faces: dispatcher → `/plan`, store_manager → `/store`, admin → `/admin`.
- `lib/odata`: the typed OData v4 client (`client.ts`) and the hooks `useEntitySet`, `useEntity`, `useQuery`, `useAction`, `useRealtime` (`hooks.tsx`).
- `lib/realtime.ts`: the Socket.IO client on `/ws/`, with the access token in the handshake.
- `lib/workday.ts`: the run date (`?runDate=`, else the latest in the user's data), the depot filter, and the record a detail screen shows.
- `lib/mode.ts`: the design preview (`?design=1`), the static prototype the click-through tests use.
- `lib/config.ts`: endpoints from the page origin, overridable with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_OIDC_AUTHORITY`, `NEXT_PUBLIC_OIDC_CLIENT_ID`, `NEXT_PUBLIC_WS_URL`.

## Run and test

```bash
npm run dev                      # http://localhost:3000; live screens need the stack (docker compose up) behind the gateway
npm test                         # Jest
npm run typecheck && npm run lint
npm run build && npx next start -p 3200
```

Cypress, Playwright and the live-mode settings are in `docs/QA.md`.

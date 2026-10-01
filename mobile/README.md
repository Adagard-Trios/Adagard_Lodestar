# Waypoint Lodestar · field app (Store, Plan phone, Dock, Run)

Every phone and tablet design screen is a generated native view (`src/screens`, from `tools/screengen`).
Screens with real data live in `src/live/<key>.tsx`: started from the generated file, same layout and
`Frame`/`Tap` runtime, so prototype links keep working; the registry opens them instead of the generated ones
(`node tools/screengen/gen-mobile.js` regenerates both the screens and the registry).

| Piece | Where |
|---|---|
| Sign-in: Keycloak, auth code + PKCE, client `lodestar-field`, redirect `lodestar://auth/callback` (web: `<origin>/auth/callback`) | `src/auth/use-sign-in.ts`, `src/app/auth/callback.tsx` |
| Session: refresh token in expo-secure-store (memory on web), access token in memory, single-flight refresh, sign-out | `src/auth/session.ts` |
| Role routing (driver → Run, loader → Dock phone / tablet ≥ 900 px, store manager → Store, dispatcher → Plan) | `src/auth/roles.ts` |
| Device posture: per-install id (secure store), sent as `X-Device-Id`; 401 "device revoked" → sign-out + access screen | `src/auth/device.ts`, `src/auth/access-guard.tsx` |
| OData v4 client: bearer, paging, ETags, OData errors | `src/lib/odata.ts` |
| Live data with an offline cache (SQLite on phones, localStorage on web) | `src/model/query.ts`, `src/model/hooks.ts`, `src/model/api.ts` |
| Outbox: every field write saved first (client UUID + time), sent via `OfflineEvents/Lodestar.PushBatch` (driver) or the write's own action | `src/offline/queue.ts`, `src/offline/sync.ts`, `src/model/actions.ts` |
| Realtime notices: Socket.IO on `/ws/` | `src/realtime/notices.ts` |

Configuration (build time): `EXPO_PUBLIC_API_URL` (default `https://localhost:8443` on phones, the page origin on web,
where `nginx.conf` proxies `/odata/` and `/ws/` to the gateway), `EXPO_PUBLIC_OIDC_ISSUER`
(default `https://localhost:8443/auth/realms/lodestar`), `EXPO_PUBLIC_OIDC_CLIENT_ID`, `EXPO_PUBLIC_RUN_DATE` (fixed run day for demos).

Checks: `npx tsc --noEmit`, `npx expo lint`, `npm test` (Jest, jest-expo), `npx expo export --platform web`.

---

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

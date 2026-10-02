# Demo video: shot list (target 7 minutes, hard limit 8)

The video follows the [README judge walkthrough](../README.md#judge-walkthrough) on the live demo URL, then shows how it is built. Record the desktop at 1440 × 900 and the phone roles in the browser's device toolbar at 390 × 844 (or a real phone, mirrored). One take per scene; cut between them.

**Before recording**
- Reset the demo day on the VM so it starts clean: `deploy/azure-demo/up.sh down && docker volume rm lodestar_pgdata && deploy/azure-demo/up.sh`.
- Open the start page once on the phone while online, so the field app works offline later (scene 7).
- Have five browser profiles (or windows) ready, one per role, so sign-ins don't collide.

| # | Time | Screen(s) | What we show | Say (voice-over, short) |
|---|---|---|---|---|
| 1 | 0:00–0:25 | Start page `/` | One URL, five faces; the over-capacity demo day | "Waypoint Lodestar: every order, one thread. One address for every role. Today Peliyagoda has more chilled orders than refrigerated trucks." |
| 2 | 0:25–1:05 | SM-01, SM-27, SM-02 (desktop, `fathima`) | The 4 PM countdown; add a line; Submit; the order in history; today's two orders waiting to be planned | "Fathima orders before the cut-off. After 4 PM the order isn't lost; it moves to the next run, and she sees which." |
| 3 | 1:05–2:20 | DSP-01 → DSP-22 → DSP-02 → DSP-03 (`nilanthi`) | Draft the plan with the agent (Peliyagoda first): trips, ETAs, the eight rule checks, deferrals each with a reason code; the protected outlet skipped yesterday sent for a decision, not deferred again | "The planning agent drafts; a deterministic planner does the maths: weight and volume, temperature, van-only access, delivery and mall windows, fuel, two trips a day. What doesn't fit is deferred with a reason. An outlet skipped yesterday is never skipped twice." |
| 4 | 2:20–3:00 | DSP-39/40 → DSP-12 (Kandy) | Ask the agent to put OUT106 on VEH057; the violation it creates; Approve with an override reason; the plan goes live | "The dispatcher stays in charge. Bending a rule needs a reason, and it is recorded in the audit log. Approval creates the trips and stops, rolls deferrals to the next operating day, and tells each store." |
| 5 | 3:00–3:45 | LD-01 → LD-02 → LD-03 → LD-04 (phone, `kasun`) | Bay queue; load sheet in reverse stop order; flag a shortfall; release with seal and temperature | "Kasun loads in reverse stop order. A short case is flagged once, and dispatch, the store and the driver all hear about it." |
| 6 | 3:45–4:05 | DSP-13 (desktop) | The shortfall in the exceptions inbox; Acknowledge; the loader sees "Acknowledged" | "Nothing is phoned in: the flag lands in Nilanthi's inbox, and her acknowledgement goes back to the dock." |
| 7 | 4:05–5:05 | DR-01 → DR-02 → DR-03, then airplane mode: DR-A1/A2, reload, reconnect, DR-A3 (phone, `ruwan`) | Start trip; arrive; proof of delivery with one item short; next stop with no signal; reload the app offline: it still opens; reconnect: records sync once | "The driver works through the dead zone above Ramboda. The app keeps working offline, even after a reload, and when signal returns every record syncs exactly once." |
| 8 | 5:05–5:40 | SM-02 / SM-A1, SM-03, SM-18 (`fathima`) | The store saw the van was in a low-signal area; counts the delivery; reports a damaged item; confirms receipt; credit note | "The store counts what arrived. A short count raises a credit note, and the issue goes straight to dispatch." |
| 9 | 5:40–6:00 | DSP-04, DSP-17 | Live operations with the delivered stops; the deferral log with reasons and new dates | "One thread from order to receipt, and every deferral explained." |
| 10 | 6:00–6:40 | `docs/architecture.svg`, `docs/data-model.svg` | One origin; gateway; Keycloak; OData services, each owning its schema; the agent; offline sync | "Zero trust: every service checks every token, and phones are bound to their user. Each service owns its own data and speaks OData." |
| 11 | 6:40–7:10 | `docs/delivery.svg`, a green CircleCI run, the Sonar gate, the design-conformance report | Lint, unit, integration on Postgres, Sonar gate, full stack with Playwright across the four roles, then images and GitOps | "Every change runs the same gate: unit and integration tests, a Sonar quality gate, and full cross-role flows in real browsers before anything ships." |
| 12 | 7:10–7:20 | Start page | Team and URL | "Team Adagard. Waypoint Lodestar. Every order, one thread." |

**Checks after recording**
- Every screen shown is a live screen (no generated mock), and no real personal data appears.
- No secrets on screen (no `.env`, no tokens in devtools).
- Captions for every voice-over line; total length under 8 minutes.
- If a scene fails live, re-record it; don't edit around a failure.

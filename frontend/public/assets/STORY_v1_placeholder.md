# Story bible — the ONE scenario every page uses (keep numbers identical everywhere)

> **Placeholder data.** The team will drop the real CSVs into `Designing/data/`. Until then every ID/number
> below is a consistent placeholder. Anything marked ⟨verify⟩ must be checked against the CSVs later.
> Booklet-given facts (not placeholders): 120 outlets (Fresh 80 / Style 25 / Tech 15), 60 vehicles
> (12 reefer trucks, 40 dry-box trucks, 8 vans of which 4 reefer → 16 chilled-capable), depots Peliyagoda + Kandy,
> 4 PM order cutoff for next day, max 2 trips/vehicle/day, Mon–Sat operation, Fresh budget 270 min (3:30–8 AM),
> Style+Tech 480 min, weekly fuel quota per vehicle, trip_minutes = outbound + inter_stop×(n−1) + Σ service_allowance,
> Colombo 24 min / inter-stop 8, Gampaha 37 / 9, Fresh rear_dock 15 min, Fresh street 16 min.

## Product
- **Waypoint Lodestar** — tagline *"Every order, one thread."* Team **Adagard**.
- One system, four faces: **Lodestar Plan** (dispatcher web), **Lodestar Dock** (loader tablet/phone), **Lodestar Run** (driver phone, offline-first PWA), **Lodestar Store** (store manager web + phone).
- URL placeholders: `plan.lodestar.waypoint.lk`, `store.lodestar.waypoint.lk`.

## Calendar / scenario day
- **Run day: Tuesday 13 Oct 2026.** Orders closed **Mon 12 Oct, 4:00 PM**. Plan published Mon 12 Oct ~6:40 PM.
- Calendar flags ⟨verify⟩: not payday; festival in 7 days (`festival_ramp` 0.22, rising); **inter-monsoon month (monsoon = 1)** → slower hill travel, fog above Ramboda.

## Depots & districts ⟨verify all minutes⟩
- **Peliyagoda DC** (serves Colombo, Gampaha, Kalutara, Kurunegala, Puttalam, Galle, Ratnapura) and **Kandy Hub** (serves Kandy, Matale, Nuwara Eliya, Kegalle, Badulla).
- depot→district free-flow / inter-stop: Colombo 24/8 · Gampaha 37/9 · Kalutara 58/10 · Kurunegala 95/12 · Kandy 18/9 · Matale 48/11 · **Nuwara Eliya 112/14 (hill)** · Kegalle 55/12 · Badulla 150/16 (hill).
- service_allowance (min) ⟨verify except Fresh rear 15 / street 16⟩: Fresh rear_dock 15, street 16, mall_bay 20 · Style rear_dock 18, street 22, mall_bay 25 · Tech rear_dock 25, street 30, mall_bay 32.

## Fleet ⟨verify caps⟩
- Reefer trucks VEH001–VEH012 (PLG 001–008, KDY 009–012): 3,500 kg / 18.0 m³, diesel 5.5 km/L, quota 400 L/wk.
- Dry-box trucks VEH013–VEH052 (PLG 013–042, KDY 043–052): 5,000 kg / 28.0 m³, quota 400 L/wk.
- Vans VEH053–VEH060: reefer vans **VEH053–054 (PLG), VEH055–056 (KDY)**: 1,400 kg / 8.0 m³, 9 km/L, 180 L/wk; ambient vans VEH057–058 (PLG), VEH059–060 (KDY): 1,200 kg / 9.0 m³.
- **In workshop on 13 Oct:** VEH004 (reefer, PLG), VEH021, VEH030 (dry, PLG). Peliyagoda available 39/42, Kandy 18/18.

## People (personas)
| Role | Name | Where / device |
|---|---|---|
| Dispatcher | **Nilanthi Perera**, 46, senior dispatcher, 19 yrs | Peliyagoda planning office, 27" monitor + laptop, plans BOTH depots, 12:00–21:00, on-call phone for early runs |
| Loader | **Kasun Jayawardena**, 27, dock team lead | **Kandy Hub** dock, shared rugged tablet at Bay K2 + personal phone, night shift 01:30–09:30, gloves, cold room, noise |
| Driver | **Ruwan Bandara**, 39 | Reefer van **VEH055**, Kandy Hub, hill routes; personal mid-range Android; coverage drops above **Ramboda**; starts 3:30 AM |
| Store manager | **Fathima Rizwan**, 34 | **Waypoint Fresh Nuwara Eliya (OUT071)**, counter desktop + own phone; store opens 8:00, receiving staff start 5:30 |

## Outlets in the story ⟨verify IDs/attributes; Fresh = OUT001–080, Style = OUT081–105, Tech = OUT106–120⟩
| ID | Name | Brand | District / depot | dock_type | parking | window |
|---|---|---|---|---|---|---|
| **OUT071** | Waypoint Fresh Nuwara Eliya | Fresh | Nuwara Eliya / Kandy | street | **van_only** | 05:30–07:45 |
| **OUT073** | Waypoint Fresh Hawa Eliya | Fresh | Nuwara Eliya / Kandy | rear_dock | normal | 05:30–07:45 |
| OUT066 | Waypoint Fresh Peradeniya | Fresh | Kandy / Kandy | rear_dock | normal | 05:00–07:45 |
| OUT007 | Waypoint Fresh Wattala | Fresh | Gampaha / Peliyagoda | rear_dock | normal | 04:30–07:30 |
| OUT012 | Waypoint Fresh Kotahena | Fresh | Colombo / Peliyagoda | street | **van_only** | 05:00–07:45 |
| OUT018 | Waypoint Fresh Nugegoda | Fresh | Colombo / Peliyagoda | street | normal | 05:00–07:45 |
| OUT023 | Waypoint Fresh Kiribathgoda | Fresh | Gampaha / Peliyagoda | street | normal | 04:45–07:30 |
| OUT031 | Waypoint Fresh Negombo | Fresh | Gampaha / Peliyagoda | rear_dock | normal | 04:30–07:30 |
| **OUT047** | Waypoint Fresh Ja-Ela | Fresh | Gampaha / Peliyagoda | street | normal | 04:45–07:30 — **deferred_yesterday = 1, days_since_last_served = 2** |
| OUT058 | Waypoint Fresh Horana | Fresh | Kalutara / Peliyagoda | street | normal | 05:00–07:45 |
| OUT084 | Waypoint Style One Galle Face | Style | Colombo / Peliyagoda | mall_bay | **mall_dock**, mall_window 06:00–09:00 | 06:00–09:00 |
| OUT098 | Waypoint Style Kandy City Centre | Style | Kandy / Kandy | mall_bay | mall_dock, 07:00–09:30 | 07:00–09:30 |
| OUT112 | Waypoint Tech Maharagama | Tech | Colombo / Peliyagoda | rear_dock | normal | 09:00–17:00 |

## THE HERO THREAD (happy path, used across all four roles)
Fathima places two orders for Tue 13 Oct at **Mon 12 Oct 2:38 PM** (1 h 22 m before cutoff):
| Order | Outlet | Temp | Units | kg | m³ |
|---|---|---|---|---|---|
| **ORD0104216** | OUT071 | ambient (dry) | 58 | 452 | 2.2 |
| **ORD0104217** | OUT071 | **chilled** (dairy, yoghurt, chicken) | 34 | 296 | 1.3 |
| ORD0104209 | OUT073 | chilled | 28 | 240 | 1.1 |
- Plan: **VEH055 (reefer van, Kandy Hub) · Trip 1 · Fresh · Nuwara Eliya** — why a van: OUT071 is **van_only**; why reefer: chilled orders.
- Load: 3 orders = **988 kg of 1,400 kg (71%) · 4.6 m³ of 8.0 m³ (58%)**.
- Trip minutes: 112 outbound + 14×(3−1)=28 inter-stop + 16+16 (OUT071 street ×2 orders) + 15 (OUT073 rear_dock) = **187 of 270 Fresh min**.
- Fuel: VEH055 weekly quota 180 L, used 121 L before trip; trip ≈ 154 km ÷ 9 = **17 L** → 138 L after.
- Stop sequence: **Stop 1 OUT071** (ETA 5:32, window 05:30–07:45), **Stop 2 OUT073** (ETA 6:18).
- Timeline: loading done 3:34 → departs Kandy Hub **3:40** → OUT071 arrive **5:32**, done 6:04 → OUT073 arrive **6:18**, done 6:33.
- Datathon hook (ML predictions shown in UI): OUT071 predicted service **29 min** (allowance 32), late risk **12%**; OUT073 late risk **18%** (rises to **61%** during the blackout because no position updates).
- **Loader shortfall:** at **3:21 AM** Kasun flags **ORD0104217 — Yoghurt 80g ×24 (case): 2 of 6 cases short (stock)**. Nilanthi acknowledges 3:24 (auto credit note + follow-up on Wed run). Fathima gets a notice at 3:24: "2 cases yoghurt short — credited, follow-up Wed 14 Oct."
- **Delivery:** at OUT071, Ruwan records ORD0104216 58/58 ✓ and ORD0104217 **31 of 34** units (2 cases short-shipped known + **1 tray chicken damaged**, photo), receiver **"M. Ilyas"** + signature. Fathima confirms receipt **6:05** (matches POD, flags nothing else).

## Peliyagoda planning picture for 13 Oct (dispatcher screens)
- Confirmed orders after cutoff: **168** — Fresh 142 (dry 84 · chilled 58), Style 16, Tech 10. Kandy Hub: 61 orders.
- Chilled demand **71.4 m³** vs reefer capacity usable inside the Fresh window **62.8 m³** → **short 8.6 m³**.
- Auto-plan step 1: moved **11 dry Fresh orders off reefers onto dry trucks** (+6.2 m³ reefer freed). Remaining short **2.4 m³** → 2 suggested deferrals:
  - **ORD0104188 · OUT023 Kiribathgoda · chilled 1.6 m³** — served yesterday, days_since_last_served 1 → score 22 → *suggest defer to Wed*.
  - **ORD0104195 · OUT058 Horana · chilled 0.9 m³** — days_since 1 → score 27 → *suggest defer*.
  - **Protected:** ORD0104173 · OUT047 Ja-Ela — deferred_yesterday = 1, days since 2 → score 91 → **locked: cannot be deferred again without override + reason**.
- Van_only orders 9 · mall-window orders 7 (Style) · vehicles in workshop 3.
- Example trip card: **VEH002 · Trip 1 · Fresh · Colombo** (OUT018 + 3 others, 4 street stops) = 24 + 3×8 + 4×16 = **112 min**; Trip 2 Gampaha = **102 min** → 214 of 270 ✓ (booklet-consistent).
- Deferral reason codes: `CAP-REEFER`, `CAP-TIME` (Fresh window), `ACCESS` (van_only, no van), `WINDOW` (mall window), `FUEL` (weekly quota), `VEH-DOWN`.
- Deferral score (explainable): + deferred_yesterday (+40), + days_since_last_served (×12/day), + perishability (chilled +15), + brand urgency (Fresh before-opening +10), − next scheduled run within 24 h (−10).

## Degradation A (PRIMARY) — "Dead Zone above Ramboda"
- **4:38 AM** VEH055 loses data coverage climbing past Ramboda (monsoon fog). Last GPS ping 4:38.
- The driver app keeps working offline (run downloaded 3:41). Ruwan arrives OUT071 5:32, records both PODs offline (photo + signature) — **"Saved on phone · will sync"**.
- **5:50** Nilanthi's live board: VEH055 "Last seen 4:38 · Ramboda · 3 stops predicted done by 6:33" — shown as **Unknown / predicted** (dashed), never falsely "on time". OUT073 late risk climbs to 61%.
- **6:10** Worried about chilled goods & the 07:45 window, Nilanthi marks **ORD0104209 (OUT073) as deferred → Wed** and re-books Wed capacity. Because VEH055 is offline, the system makes this a **Provisional deferral** ("may already be delivered — confirms when VEH055 syncs") and warns the store as "at risk", not "cancelled". SMS fallback sent to Ruwan (SMS often works where data doesn't) — not delivered either.
- **6:18** Ruwan delivers ORD0104209 at OUT073 offline, POD captured.
- **6:41** Coverage returns descending near Pussellawa → **7 records sync** (2 arrivals, 3 PODs, 2 photos). **Conflict:** ORD0104209 "Deferred (provisional) 6:10 by N. Perera" vs "Delivered 6:18 by R. Bandara, POD + photo + signature".
- Resolution rule: **field evidence wins** (signed POD beats plan edit). One click: accept delivery · undo provisional deferral · release Wed capacity (1.1 m³ on VEH056) · send correction to OUT073 · audit log keeps both. Fathima's OUT071 view shows "Delivered 5:32 · recorded offline · synced 6:41".

## Degradation B (SECONDARY) — "Reefer Down at 3:45"
- Peliyagoda, 13 Oct, **3:45 AM**: **VEH006** (reefer truck) fails pre-departure temperature check (reefer unit reads 9 °C, needs ≤ 4 °C). Loader flags "Vehicle can't depart".
- VEH006 Trip 1 was **Fresh · Gampaha · OUT007 Wattala (chilled 1.8 m³), OUT031 Negombo (1.6 m³), OUT047 Ja-Ela (1.5 m³ — protected)**.
- VEH006 also runs Trip 2 (Fresh · Colombo, 3 orders, 5.4 m³, 88 min) → "6 chilled orders on 2 trips need a home (10.3 m³)".
- Re-plan diff offered to dispatcher (reconciled with the DSP-02 plan board):
  - OUT007 + OUT047 (3.3 m³) **merged into VEH002 Trip 2 · Gampaha** (same brand + district): 102 → **151 min**; VEH002 uses **263 / 270** Fresh min, 7.9 / 18.0 m³. OUT047 protected (deferred yesterday) → prioritised.
  - VEH006 Colombo Trip 2 → moved whole to **VEH008 Trip 2** (Trip 1 Kalutara 150 min → 238 / 270).
  - OUT031 Negombo: **Option A VEH054** (PLG reefer van) Trip 2 → arrives ~7:20, 10 min before close, late risk 48%; **Option B** defer to Wed (VEH-DOWN, days_since 1).
  - Nilanthi chooses A with a note; OUT031 gets "Arriving later than usual: ~7:20". VEH002 reloads at Bay P2 (returns 5:46).

## Problem tags (use exactly these on rationale cards: `<span class="ptag"><b>P1</b> Fragmented planning</span>`)
- **P1 Fragmented planning** — orders arrive by phone/message, re-keyed into spreadsheets; plan lives in one dispatcher's head; stores get no order confirmation.
- **P2 Invisible progress** — once vehicles leave there is no shared view; problems learned only after arrival.
- **P3 Unrecorded deferrals** — decisions made under pressure, no reason recorded, same outlet skipped on consecutive runs.
- **P4 No feedback loop** — no proof of delivery, no way to flag loading shortfall before departure, no receipt confirmation.
- **P5 Demand not anticipated** — can't estimate vehicles/drivers/reefer capacity ahead of paydays & festivals.
- **P6 Lateness not predicted** — service time and late arrival discovered after the fact.
- **P7 Unreliable connectivity** — hill country / Kandy corridor / rural; field work must work offline and reconcile.

## The four handoffs (problem framing spine)
- **H1 Order → Queue** (store manager → dispatcher): P1
- **H2 Plan → Dock** (dispatcher → loader): P1, P3
- **H3 Dock → Road** (loader → driver): P4, P2
- **H4 Road → Store** (driver → store manager): P2, P4, P7
- **F Foresight** (data → dispatcher): P5, P6

## Design principles (reuse wording)
1. **One order, one thread** — every role reads and writes the same record; no re-keying.
2. **Explain every "no"** — any blocked assignment or deferral carries a plain-language reason and a reason code.
3. **Offline is a normal state, not an error** — field screens are designed offline-first; honesty about what is unknown.
4. **Protect the repeatedly skipped** — an outlet deferred yesterday cannot be silently deferred again.
5. **Right density for the context** — dense for the planning desk, huge targets for the dock and the road.

## Screen IDs (fixed)
Store manager: SM-01 Place order · SM-02 Order status & ETA · SM-03 Confirm receipt
Dispatcher: DSP-01 Cutoff queue · DSP-02 Plan board · DSP-03 Deferral decision · DSP-04 Live operations · DSP-05 Capacity outlook
Loader: LD-01 Dock queue · LD-02 Load sheet · LD-03 Flag shortfall · LD-04 Release vehicle
Driver: DR-01 Today's run · DR-02 Stop arrival · DR-03 Proof of delivery · DR-04 Run complete
Degradation A: DR-A1 Offline run · DR-A2 POD saved offline · DR-A3 Sync queue · DSP-A1 Blackout view · DSP-A2 Reconcile conflict · SM-A1 Store: recorded offline
Degradation B: LD-B1 Vehicle can't depart · DSP-B1 Re-plan diff · SM-B1 Store: later arrival notice

## Details added while building pages (now canonical)
- Driver (07): DR-02/DR-03 at OUT071 show "Offline · No service" (inside 4:38–6:41 blackout); "Arrived 5:32 · recorded on phone". DR-04 at 6:42, syncs stamped 6:41. OUT071 POD = 1 photo (damage, 5:57); OUT073 POD = 1 photo → 7 records = 2 arrivals + 3 PODs + 2 photos.
- Order lines: ORD0104217 (34u, 296 kg, 7 lines): milk 8, yoghurt 6 cases, chicken 6 trays, sausages 4, butter 3, cheese 3, flavoured milk 4 → delivered 31 (yoghurt 4/6, chicken 5/6). ORD0104216 (58u, 452 kg, 9 lines): rice 5kg 14 bags, soap 6, dhal 5, coconut oil 6, flour 4, sugar 2, biscuits 10, tea 5, noodles 6. ORD0104209 (28u, 6 lines). Load sheet total 22 lines.
- Loader (06): Kandy queue VEH009 Bay K1 3:30 (Kandy, 6 orders), VEH055 Bay K2 3:40, VEH010 Bay K3 3:50 (Matale, 4 orders), VEH044 Bay K4 5:30 (Style OUT098, mall 07:00–09:30). Plan v3 published 6:40 PM Mon; example change banner "Plan changed 3:52 · v4 · 2 items moved". Reefer reads 3 °C at 3:32. Seal KDY-55-10413. Receiving door on Lawson St side opens 5:30. Trip distance 154 km. Moving-lock above 8 km/h.

- Dispatcher (05): plan board v3 = 159 planned + 2 suggested deferrals + 7 needs review (=168); after review 166 PLG served. DSP-04 "Delivered 38 / 227" (166 PLG + 61 Kandy), 34 active routes. VEH006 Trip 2 Colombo 88 min; VEH053 Trip 1 Colombo 88 + Trip 2 Colombo 64; VEH014 dry Trip 1 Fresh dry Gampaha 153 + Trip 2 Style Colombo (OUT084, 25.8/28 m³); VEH025 Tech Gampaha. Deferral score includes "stock cover" term (OUT023 −5, OUT058 0, OUT047 +12 → 91). Capacity outlook: W43 festival week short 14 reefer trips → hire 2 reefers Mon 19–Sat 24 Oct.

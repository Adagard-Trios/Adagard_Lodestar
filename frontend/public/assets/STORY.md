# Story bible v2 — grounded in the REAL competition data (Designing/data/)

> v1 used placeholders (kept in STORY_v1_placeholder.md for reference). v2 replaces every ID, capacity,
> travel time, window and date with values from `data/General Data/*.csv`. Order sizes/counts are scenario
> values chosen to match the training data (deliveries_train.csv medians). ⟨scenario⟩ marks invented-but-plausible values.

## Product
- **Waypoint Lodestar** — *"Every order, one thread."* Team **Adagard**. Faces: Lodestar Plan (dispatcher web), Lodestar Dock (loader tablet/phone), Lodestar Run (driver phone PWA, offline-first), Lodestar Store (store manager web + phone).

## Scenario day (from calendar.csv)
- **Run day: Tuesday 7 Apr 2026** (ISO 2026-W15, is_operating 1, **not payday**, **monsoon 1** (inter-monsoon: rain + hill fog), **festival_ramp 0.4**).
- Orders closed **Mon 6 Apr 2026, 4:00 PM** (ramp 0.3). Plan published Mon 6 Apr ~6:40 PM. **Next run: Wed 8 Apr 2026**.
- Festival: **Sinhala & Tamil New Year, Mon 13 Apr 2026** (calendar `new_year`) → "New Year in 6 days". 13 Apr and 14 Apr are **non-operating** (holiday); Sun 12 Apr non-operating. So the week before New Year is the peak.
- Other calendar markers in the 10-week outlook (W15–W24): paydays **Sat 25 Apr, Thu 30 Apr, Mon 25 May, Sat 30 May**; **Vesak Fri 1 May (non-operating)**; **Poson Sat 30 May (operating, also payday)**. Calendar ends 28 Jun 2026 (W26).
- Replace old text: "Tue 13 Oct" → "Tue 7 Apr"; "Mon 12 Oct" → "Mon 6 Apr"; "Wed 14 Oct" → "Wed 8 Apr"; "festival in 7 days" → "New Year in 6 days"; "festival_ramp 0.22" → "0.4"; ISO "W42" → "W15"; outlook "W42–W51" → "W15–W24". Dates in URLs/IDs: "2026-10-13" → "2026-04-07"; credit note "CN-2610-…" → "CN-2604-…".

## Depots & districts (district_travel.csv — exact)
| District | Depot | road_class | depot→district min | inter-stop min |
|---|---|---|---|---|
| Colombo | Peliyagoda | urban | 24 | 8 |
| Gampaha | Peliyagoda | suburban | 37 | 9 |
| Kalutara | Peliyagoda | suburban | 64 | 12 |
| Galle | Peliyagoda | highway | 103 | 9 |
| Matara | Peliyagoda | highway | 137 | 10 |
| Kurunegala | Peliyagoda | suburban | 127 | 19 |
| Puttalam | Peliyagoda | suburban | 173 | 24 |
| Kandy | Kandy | urban | 16 | 6 |
| Matale | Kandy | suburban | 35 | 11 |
| **Nuwara Eliya** | Kandy | **hill** | **111** | **20** |
| Badulla | Kandy | hill | 186 | 23 |
| Kegalle | Kandy | suburban | 53 | 13 |
(There is NO Ratnapura district. 12 districts total.) Nuwara Eliya depot→district = 78 km, inter-stop 14 km.

## service_allowance.csv (exact, minutes)
Fresh: rear_dock 15 · street 16 · mall_bay 18 — **Style: rear_dock 38 · street 46 · mall_bay 59** — **Tech: rear_dock 43 · street 55 · mall_bay 55**.

## Outlets (outlets.csv facts)
- 120 outlets. Peliyagoda: Fresh 49, Style 16, Tech 10 (75). Kandy: Fresh 31, Style 9, Tech 5 (45).
- IDs are grouped by district, NOT by brand (e.g. OUT001–014 Colombo Fresh, OUT015–024 Colombo Style/Tech, OUT025–034 Gampaha Fresh…). Never write "Fresh = OUT001–080".
- van_only: Fresh 11 (PLG: OUT001–003 Colombo; KDY: OUT076–083 Kandy city), Style 1 (OUT088), Tech 1 (OUT093).
- mall_dock: Style 9, Tech 3. **Mall windows are all mid-morning: 09:00–11:00, 10:00–12:00 or 10:30–12:30.** Fresh windows range 03:00–08:00; Style/Tech normal windows 09:00–17:00.
- Nuwara Eliya outlets (OUT104–109) are all rear_dock, normal — hill-country, not van_only.

### Outlet ID mapping (v1 placeholder → v2 real). Keep the friendly locality names (they're our labels).
| v1 | v2 real ID | Name we use | Brand | District/Depot | dock_type | parking | window |
|---|---|---|---|---|---|---|---|
| OUT071 (hero) | **OUT106** | Waypoint Fresh Nuwara Eliya | Fresh | Nuwara Eliya / Kandy | **rear_dock** | **normal** | **05:30–08:00** |
| OUT073 | **OUT108** | Waypoint Fresh Hawa Eliya | Fresh | Nuwara Eliya / Kandy | rear_dock | normal | **04:00–07:45** |
| OUT066 | **OUT085** | Waypoint Fresh Peradeniya | Fresh | Kandy / Kandy | rear_dock | normal | 05:00–07:30 |
| OUT007 | **OUT034** | Waypoint Fresh Wattala | Fresh | Gampaha / PLG | rear_dock | normal | 05:00–07:30 |
| OUT012 | **OUT001** | Waypoint Fresh Kotahena | Fresh | Colombo / PLG | street | **van_only** | 05:00–07:30 |
| OUT018 | **OUT004** | Waypoint Fresh Nugegoda | Fresh | Colombo / PLG | street | normal | 05:30–08:00 |
| OUT023 | **OUT027** | Waypoint Fresh Kiribathgoda | Fresh | Gampaha / PLG | street | normal | 05:00–07:30 |
| OUT031 | **OUT031** | Waypoint Fresh Negombo | Fresh | Gampaha / PLG | rear_dock | normal | **03:00–08:00** |
| OUT047 | **OUT028** | Waypoint Fresh Ja-Ela | Fresh | Gampaha / PLG | street | normal | **03:00–08:00** |
| OUT058 | **OUT043** | Waypoint Fresh Horana | Fresh | Kalutara / PLG | street | normal | 05:00–07:30 |
| OUT084 | **OUT015** | Waypoint Style One Galle Face | Style | Colombo / PLG | mall_bay | mall_dock | **mall 09:00–11:00** |
| OUT098 | **OUT089** | Waypoint Style Kandy City Centre | Style | Kandy / Kandy | mall_bay | mall_dock | **mall 10:30–12:30** |
| OUT112 | **OUT024** | Waypoint Tech Maharagama | Tech | Colombo / PLG | rear_dock | normal | 09:00–17:00 |
Other real outlets available for filler rows (use real attributes!): Colombo Fresh OUT002/003 (van_only street 05:30–08:00 / 05:00–07:30), OUT005 rear 04:00–07:45, OUT006 street 03:00–08:00, OUT007 street 05:30–08:00, OUT008 rear 05:00–07:30, OUT009 rear 04:00–07:45, OUT010 rear 05:00–07:30, OUT011 rear 03:00–08:00, OUT012 rear 05:30–08:00, OUT013 rear 05:00–07:30, OUT014 street 05:30–08:00; Gampaha Fresh OUT025 rear 05:30–08:00, OUT026 rear 03:00–08:00, OUT029 rear 05:30–08:00, OUT030 rear 03:00–08:00, OUT032 rear 04:00–07:45, OUT033 rear 05:30–08:00; Kalutara Fresh OUT040 street 03:00–08:00, OUT041 rear 05:00–07:30, OUT042 rear 03:00–08:00, OUT044–045 rear 03:00–08:00, OUT046 rear 05:00–07:30; Kurunegala Fresh OUT065–069 rear; Galle Fresh OUT050–055; Style Colombo OUT016 mall 09:00–11:00, OUT017/018 mall 10:30–12:30, OUT019 rear 09:00–17:00, OUT020 street 09:00–17:00; Tech Colombo OUT021 mall 10:30–12:30, OUT022 mall 10:00–12:00, OUT023 street. Kandy Fresh OUT084 rear 05:30–08:00, OUT086/087 rear 03:00–08:00, OUT076–083 van_only street; Matale Fresh OUT096–101; Kegalle Fresh OUT116–119. Full list: data/General Data/outlets.csv.

## Fleet (vehicles.csv — exact)
- **Peliyagoda 38**: reefer trucks **VEH001–007** (7), dry-box trucks **VEH008–034** (27), reefer vans **VEH035, VEH036**, ambient vans **VEH037, VEH038**.
- **Kandy 22**: reefer trucks **VEH039–043** (5), dry-box trucks **VEH044–056** (13), reefer vans **VEH057, VEH058**, ambient vans **VEH059, VEH060**.
- Chilled-capable: Peliyagoda 9 (7 trucks + 2 vans), Kandy 7 (5 + 2) = 16 ✓.
- In workshop on Tue 7 Apr ⟨scenario⟩: **VEH004** (reefer), **VEH021**, **VEH030** (dry) → **Peliyagoda available 35 / 38**; Kandy 22 / 22.
### Vehicle ID mapping (v1 → v2) + real specs (type · temp · kg · m³ · km/L · weekly L)
| v1 | v2 | spec |
|---|---|---|
| VEH055 (hero reefer van, Kandy) | **VEH057** | van · reefer · **1,040 kg · 7.0 m³** · 10.3 km/L · **450 L** |
| VEH056 (Kandy reefer van) | **VEH058** | van · reefer · 1,040 · 7.0 · 10.3 · 550 |
| VEH009 (Kandy reefer truck, Bay K1, Kandy) | **VEH039** | truck · reefer · 6,180 · 29.9 · 5.0 · 370 |
| VEH010 (Kandy reefer truck, Bay K3, Matale) | **VEH040** | truck · reefer · 5,510 · 26.4 · 4.7 · 380 |
| VEH011 (Kandy reefer, Kegalle) | **VEH041** | truck · reefer · 3,610 · 19.4 · 6.4 · 600 |
| VEH044 (Kandy dry truck, Style) | **VEH044** | truck · ambient · 4,200 · 24.0 · 6.8 · 340 |
| VEH043 / other Kandy rows | VEH042 / VEH043 are Kandy reefer trucks (6,180/29.9 and 5,510/26.4); Kandy dry trucks are VEH044–056 |
| VEH002 (PLG reefer truck) | **VEH002** | truck · reefer · **3,990 · 21.1** · 6.1 · **610** |
| VEH006 (PLG reefer truck) | **VEH006** | truck · reefer · **6,840 · 33.4** · 4.4 · **380** |
| VEH004 (workshop) | VEH004 | truck · reefer · 6,840 · 33.4 |
| VEH053 (PLG reefer van) | **VEH035** | van · reefer · 1,040 · 7.0 · 10.3 · 480 |
| VEH054 (PLG reefer van) | **VEH036** | van · reefer · 1,040 · 7.0 · 10.3 · 480 |
| VEH057 (PLG ambient van, suggested for van_only ambient) | **VEH037** | van · ambient · 1,100 · 8.0 · 11.5 · 340 |
| VEH008 (deg B, took Colombo trip) | **VEH005** | truck · reefer · 6,840 · 33.4 · 4.4 · 490 |
| VEH014 (PLG dry truck) | VEH014 | truck · ambient · **7,200 · 38.0** · 4.9 · 530 |
| VEH025 (PLG dry truck) | VEH025 | truck · ambient · **3,800 · 22.0** · 7.1 · 580 |
| VEH019 (PLG) | VEH019 | truck · **ambient** · 7,200 · 38.0 — may only carry ambient/dry/Style/Tech |
| VEH021 / VEH030 (workshop) | same | dry trucks 4,200/24.0 and 6,500/34.0 |
**ID-mapping hazard:** v1 VEH057 → VEH037 while v1 VEH055 → VEH057. Replace by meaning (context), never by blind global find-replace.

## People (unchanged)
Nilanthi Perera 46 (dispatcher, Peliyagoda office, plans both depots) · Kasun Jayawardena 27 (loader lead, **Kandy Hub Bay K2**) · Ruwan Bandara 39 (driver, **reefer van VEH057**, Kandy Hub, hill routes; coverage drops above Ramboda) · Fathima Rizwan 34 (store manager, **OUT106 Waypoint Fresh Nuwara Eliya**; receiving staff from 5:30, store opens 8:00).

## HERO THREAD (recomputed with real data)
Fathima orders for Tue 7 Apr at **Mon 6 Apr 2:38 PM** (1 h 22 m before cutoff):
| Order | Outlet | Temp | Units | kg | m³ |
|---|---|---|---|---|---|
| **ORD0104216** | OUT106 | ambient (dry) | 58 | 452 | 2.2 |
| **ORD0104217** | OUT106 | **chilled** | 34 | 296 | 1.3 |
| ORD0104209 | OUT108 | chilled | 28 | 240 | 1.1 |
- Line items (canonical): ORD0104216 9 lines: Samba rice 5 kg ×14 (70 kg), soap bars ×6 (30), red dhal ×5 (100), coconut oil ×6 (66), wheat flour ×4 (80), sugar ×2 (40), biscuits ×10 (36), tea ×5 (15), noodles ×6 (15). ORD0104217 7 lines: yoghurt 80 g ×6 cases, fresh milk ×8, whole chicken 1 kg tray ×6, chicken sausages ×4, butter ×3, cheese slices ×3, flavoured milk ×4. ORD0104209 6 lines. Load sheet 22 lines.
- Plan: **VEH057 (reefer van, Kandy Hub) · Trip 1 · Fresh · Nuwara Eliya**. Why a van: a light 3-order hill run on narrow hill roads, reefer-capable; the big Kandy reefer trucks carry the Kandy-city and Matale volume. (NOT van_only — OUT106 is normal access.)
- Load: 988 kg of **1,040 kg (95% — weight is the binding limit)** · 4.6 m³ of **7.0 m³ (66%)**.
- Trip minutes: **111** outbound + **20×(3−1)=40** inter-stop + 15 + 15 (OUT106 rear_dock × 2 orders) + 15 (OUT108 rear_dock) = **196 of 270** Fresh minutes.
- Fuel: VEH057 quota **450 L/wk**, used **298 L** before; trip ≈ **170 km** (78 + 14 + 78) ÷ 10.3 ≈ **17 L** → **315 / 450 L**.
- Stops: **Stop 1 OUT106** (ETA **5:31**, window 05:30–08:00, rear dock), **Stop 2 OUT108** (ETA **6:21**, window 04:00–07:45, rear dock).
- Timeline: loading done 3:34 → departs Kandy Hub **3:40** → OUT106 arrive **5:31**, done **6:01** → OUT108 arrive **6:21**, done **6:36**. (v1 times 5:32 / 6:04 / 6:18 / 6:33 are replaced by 5:31 / 6:01 / 6:21 / 6:36.)
- ML chips: OUT106 predicted service **29 min** (allowance 30), late risk **12%**; OUT108 late risk **18%** (→ **61%** during blackout).
- Loader shortfall **3:21 AM**: ORD0104217 yoghurt 80 g ×24 — **2 of 6 cases short (stock)**; ack 3:24, credit + follow-up **Wed 8 Apr**.
- Delivery at OUT106: ORD0104216 58/58 ✓; ORD0104217 **31 of 34** (2 yoghurt cases known short + 1 chicken tray damaged, photo 5:57), receiver **M. Ilyas** + signature. DR-02 access card: **"Rear dock · normal access · enter via the Lawson St service lane; dock door opens 5:30"** (not street/curb, not van_only).
- Fathima confirms her own count **6:05** (store Wi-Fi); matched to the POD at sync **6:41**. Credit note **CN-2604-0441** for 3 units.
- Loader queue at Kandy Hub (2:55 AM): VEH039 Bay K1 3:30 Fresh·Kandy · VEH057 Bay K2 3:40 Fresh·Nuwara Eliya · VEH040 Bay K3 3:50 Fresh·Matale · VEH044 Bay K4 Style·Kandy (OUT089 **mall 10:30–12:30**) loads now, **departs 10:05**. Reefer 3 °C at 3:32; seal **KDY-57-10413**; plan v3 6:40 PM Mon; example change "Plan changed 3:52 · v4".

## Peliyagoda planning picture, Tue 7 Apr (matches training-data scale: median 85 orders/day)
- Confirmed after cutoff: **90 orders** — Fresh 80 (dry 48 · chilled 32), Style 6, Tech 4. Kandy Hub: **55 orders**.
- **Chilled demand 118.4 m³** (≈2× the training median of 58 m³/day: pre-New Year peak; the Task 2B peak day has 181.6 m³) vs reefer capacity usable inside the 3:30–8:00 window **109.8 m³** → **short 8.6 m³**. Why short despite big trucks: VEH004 in workshop; one brand + one district per trip; far districts eat a vehicle's whole morning (Puttalam 173 min, Matara 137, Kurunegala 127 one way), so each reefer only makes 1–2 trips.
- Auto-plan step 1: moved **11 dry Fresh orders off reefers onto dry trucks** (+6.2 m³ reefer freed). Remaining short **2.4 m³** → 2 suggested deferrals:
  - **ORD0104188 · OUT027 Kiribathgoda (Gampaha, street) · chilled 1.6 m³** — served yesterday, days_since 1 → score 22.
  - **ORD0104195 · OUT043 Horana (Kalutara, street) · chilled 0.9 m³** — days_since 1 → score 27.
  - **Protected:** ORD0104173 · **OUT028 Ja-Ela** — deferred_yesterday 1, days_since 2 → score 91, locked.
- Plan v3: **81 planned · 2 suggested deferrals · 7 needs review = 90**; served after review **88**. Van_only orders **5** (OUT001–003); mall-window orders **3** (OUT015 + 2); vehicles in workshop 3.
- Live ops: delivered **38 / 143** (88 PLG + 55 KDY).
- Reason codes: CAP-REEFER, CAP-TIME, ACCESS, WINDOW, FUEL, VEH-DOWN. Deferral score: deferred_yesterday +40, days_since ×12/day, chilled +15, Fresh before-opening +10, next run within 24 h −10, stock cover term.
- **Plan board trips (real specs):**
  - **VEH002** (3,990 kg / 21.1 m³, 610 L): Trip 1 Fresh·Colombo 4 early-window stops (OUT011 rear 03:00, OUT006 street 03:00, OUT005 rear 04:00, OUT009 rear 04:00 "Borella") = 24 + 3×8 + 16 + 3×15 = **109** (depart 3:30, done 5:19, back ~5:43; 5:12 live: 3/4, OUT009 rear dock blocked by a lorry, ETA 5:14); Trip 2 Fresh·Gampaha 3 rear-dock stops (OUT025, OUT029, OUT033, all 05:30–08:00) = 37 + 2×9 + 3×15 = **100** → **209 / 270**. (Clock-checked: every stop opens before arrival.)
  - **VEH006** (6,840 / 33.4, 380 L): Trip 1 Fresh·Gampaha **OUT034 Wattala (rear), OUT031 Negombo (rear), OUT028 Ja-Ela (street, protected)** = 37 + 18 + 15 + 15 + 16 = **101** (the booklet's example); Trip 2 Fresh·Colombo 3 rear-dock stops (OUT008, OUT009, OUT010) = 24 + 16 + 45 = **85** → **186 / 270**.
  - **VEH035** (reefer van 1,040 / 7.0): Trip 1 Fresh·Colombo van_only **OUT001 Kotahena** + OUT002 + OUT003 (street) = 24 + 16 + 48 = **88**.
  - **VEH014** (dry 7,200 / 38.0): Trip 1 Fresh dry·Gampaha (moved off reefers); Trip 2 **Style·Colombo** OUT015 (mall_bay 59, mall 09:00–11:00) + OUT019 (rear 38) + OUT020 (street 46) = 24 + 16 + 143 = **183 / 480** Style/Tech min; volume ~25.8 / 38.0 m³ (garments cube out), weight ~1,560 / 7,200 kg.
  - **VEH025** (dry 3,800 / 22.0): Tech·Colombo OUT024 (rear 43) 1 stop = 24 + 43 = **67 / 480**.
  - VEH004 in workshop (VEH-DOWN). Blocked drop: "Can't add OUT001 to VEH014 — OUT001 is van_only. Vans with space: VEH037 (ambient), VEH036 (reefer)".

## Degradation A — "Dead Zone above Ramboda" (times updated)
- 3:41 run downloaded · **4:38** signal lost above Ramboda (VEH057) · **5:31** arrives OUT106 · POD saved offline 5:58 (photo 5:57) · **5:50** dispatcher sees "Last seen 4:38 · predicted" · **6:10** provisional deferral of ORD0104209 (OUT108) to Wed 8 Apr (holds 1.1 m³ on **VEH058**) · **6:21** OUT108 delivered offline (photo 6:22) · **6:41** signal back near Pussellawa → **7 records** sync (2 arrivals, 3 PODs, 2 photos) → conflict → 6:44 resolved (field evidence wins; correction to OUT108).
- DR-A2 at 5:58: 4 records waiting (arrival, 2 PODs, 1 photo).

## Degradation B — "Reefer Down at 3:45" (Peliyagoda, recomputed)
- **VEH006** fails pre-departure temp check (9 °C, needs ≤ 4 °C) at Bay P5, 3:45. Both trips need a home: Trip 1 Gampaha (OUT034 1.8 m³, OUT031 1.6 m³, OUT028 1.5 m³) + Trip 2 Colombo (3 orders, 5.4 m³) = **6 chilled orders, 10.3 m³**.
- Re-plan:
  - OUT034 + OUT028 (3.3 m³) **merged into VEH002 Trip 2 · Gampaha** (same brand + district): 100 → **37 + 9×4 + 45 + 15 + 16 = 149 min**; VEH002 **258 / 270**; volume ~7.9 / 21.1 m³. OUT028 protected → first stop (~6:40, window to 08:00).
  - VEH006 Colombo Trip 2 → moved whole to **VEH005 Trip 2** (VEH005 Trip 1 Kalutara 162 min → **247 / 270**).
  - OUT031 Negombo: **Option A VEH036** (PLG reefer van) Trip 2 → arrives ~7:20 (window closes **8:00**, late risk 22%); Option B defer to Wed 8 Apr (VEH-DOWN, days_since 1). Nilanthi chooses A.
  - VEH002 returns ~5:43, reloads at Bay P2.

## Problem tags, handoffs, principles, screen IDs — unchanged from v1
P1 Fragmented planning · P2 Invisible progress · P3 Unrecorded deferrals · P4 No feedback loop · P5 Demand not anticipated · P6 Lateness not predicted · P7 Unreliable connectivity. Handoffs H1 Order→Queue, H2 Plan→Dock, H3 Dock→Road, H4 Road→Store, F Foresight. Screen IDs: SM-01..03, DSP-01..05, LD-01..04, DR-01..04; degradation DR-A1, DR-A2, DR-A3, DSP-A1, DSP-A1b, DSP-A2, SM-A1 (A) and LD-B1, DSP-B1, SM-B1 (B). 16 core + 10 degradation screens. No em dashes (—) anywhere in page text.

## Capacity outlook (DSP-05) guidance
- Horizon **W15–W24 2026** (6 Apr – 14 Jun). Base weekly volumes on the training data (Peliyagoda median ≈ 183 m³/day total, ≈ 58 m³/day chilled; Kandy ≈ 100 / 30). Operating days per week from calendar (W16 has New Year 13–14 Apr non-operating; W18 has Vesak Fri 1 May non-operating). Mark paydays and festivals from calendar.csv. Reefer trips available per week = chilled-capable vehicles × 2 × operating days (PLG 9, KDY 7; minus workshop).

## ML facts from the training data (for Intelligence screens; computed from deliveries_train + route_legs_train)
- Training set: **92,307 deliveries, 2024-01-01 → 2026-02-14**; 91,890 with usable arrival/leave times.
- Label definitions: service_min = leave_outlet_time − max(arrival_time, window_open_time); late = arrival_time > window_close_time.
- Network: median service **15 min per order**, late rate **19.6%**. Nuwara Eliya district late rate **36.6%** (5,595 deliveries).
- OUT106: **1,096** past deliveries, median service **12 min per order**, historical late **55%**. By planned arrival: before 6:00 → **16%** late (101 runs); 6–7 → 53%; 7–8 → 76%. Monsoon months: 68% late vs 43% dry months; median delay vs plan 122 min vs 66 min.
- Early (planned < 6:00) monsoon runs to OUT106: 51 runs, **20%** late, median delay **+80 min** vs free-flow plan; only 2 of 51 arrived within 15 min of plan.
- traffic_speed.csv Nuwara Eliya monsoon speed index: 3 AM 75 · 4 AM 70 · 5 AM 64 · 6 AM 58 · 7 AM 48. road_conditions.csv disruption_index Nuwara Eliya 6–8 Apr 2026 = 100 (clear).
- ⚠ Realism note: the hero story shows arrival exactly on plan (5:31). The data says free-flow plans on the monsoon hill road usually run ~80 min late; a model-based ETA would be ~6:20–6:50 (still inside the 08:00 window). Pending decision with the user whether to make the hero timeline data-realistic.

## ★ v3 HERO TIMELINE (data-realistic ETA) — SUPERSEDES earlier hero times
Decision (user, 26 Sep): make the hero day match the training data. The PLAN stays free-flow (booklet budget maths unchanged: 196 / 270 min, planned ETAs 5:31 / 6:21). The MODEL ETA is what users see for arrival; the van arrives when the model said.
| Event | Old time | NEW time |
|---|---|---|
| Plan: OUT106 arrival (free-flow) | 5:31 | **5:31 (plan)**, shown only as "plan 5:31" on plan board / trip drawer / explainers |
| Model ETA OUT106 (shown to driver, store, live ops) | 5:31 | **~6:35**, band **6:15–6:55** |
| Store arrival window (SM-02 etc.) | 5:25–5:45 | **6:15–6:55** |
| Fathima's receiving staff | from 5:30 | **from 6:15** (model insight: "staff from 6:15, not 5:30") |
| Actual arrival OUT106 | 5:31 | **6:33** |
| POD photo / saved at OUT106 | 5:57 / 5:58 | **6:57 / 6:58** |
| OUT106 done (leave) | 6:01 (6:04) | **7:02** |
| Fathima counts / confirms receipt | 6:04 / 6:05 | **7:08 / 7:10** |
| Plan: OUT108 arrival | 6:21 | **6:21 (plan)** |
| Model ETA OUT108 | 6:21 | **~7:25** (window closes 07:45) |
| Actual arrival OUT108 | 6:21 | **7:26** |
| OUT108 photo / signed | 6:22 / 6:34 | **7:27 / 7:38** |
| Trip done (last stop) | 6:33 / 6:36 | **7:41** (actual trip 241 min vs plan 196 min, still under 270) |
| Signal lost | 4:38 above Ramboda | **4:38** (unchanged) |
| Dispatcher blackout view | 5:50 | 5:50 (predicted OUT106 ~6:35, OUT108 ~7:28, OUT108 late risk **61%**) |
| Provisional deferral | 6:10 | 6:10 (unchanged) |
| Signal back near Pussellawa (descent) | 6:41 | **8:40** |
| 7 records sync | 6:41–6:43 | **8:40–8:42** |
| Conflict resolved | 6:44 | **8:43** |
| DR-04 run complete screen | 6:42, "Synced 6:41" | **8:41, "Synced 8:40"** |
| SMS sent 6:10 delivered | 6:41 | **8:40** |
| Receipt ↔ POD match notification | 6:41 | **8:40** |
| Back at Kandy Hub | ~8:30 | **~9:32** |
| Offline duration | 2 h 03 m | **4 h 02 m** |
- Unchanged: 3:21 shortfall, 3:24 ack, 3:34 release, 3:40 depart, 3:41 run saved, late risk OUT106 **12%**, predicted service OUT106 **29 min**, 31 of 34, 7 records, CN-2604-0441, 988/1,040 kg, 4.6/7.0 m³, plan 196/270 min, 170 km, 17 L.
- Rule: plan board, trip drawer and booklet-formula maths keep the free-flow plan (5:31 / 6:21 / 196 min). Anything a person uses to act (driver ETA, store arrival window, live ops, alerts) shows the MODEL ETA. Explainers can show both ("plan 5:31 · model 6:35, hill road in monsoon runs ~80 min behind free-flow on early runs").

# Reference data and seeding

The seed (`prisma/seed.ts`) fills the database in three layers:

1. **Reference tables**: districts, service allowances, calendar, outlets and vehicles. They load at runtime from CSV files in `DATA_DIR`. When a file is missing, the seed generates a small **synthetic** dataset for that table.
2. **Scenario**: our demo story from `prisma/scenario.ts`. It covers the people, devices, plan versions, the Tue 7 Apr 2026 hero trip and the incidents. It is applied on top of the reference tables and works with either source. That day is history: the completed run behind the receipts, credit note and offline sync screens.
3. **Demo day**: one over-capacity delivery day from `prisma/seed/demo-day.ts`, on the date the demo clock sets. It has 100+ open orders across the three brands and both depots, vehicles in the workshop, outlets skipped yesterday (protected today), and **no trips**: the day starts at planning. See [The demo day](#the-demo-day-and-the-demo-clock).

No competition dataset values live in this repository, in code, tests or docs.

## Never commit the CSVs

The competition terms forbid redistributing the datasets. `data/` and `*.csv` are gitignored at the repo root. Keep the files in `./data/` locally; docker compose mounts that folder read-only into the `seed` job at `/data`. Tests use made-up CSV snippets only.

## Running

```bash
# default: DATA_DIR=/data (the compose mount)
npm run db:seed

# local files
DATA_DIR=../data npm run db:seed

# no files at all -> fully synthetic demo
DATA_DIR=/nonexistent npm run db:seed
```

| Env | Default | Meaning |
|---|---|---|
| `DATA_DIR` | `/data` | Folder holding the CSVs. If the folder doesn't exist, every table is synthetic. |
| `SYNTHETIC_SEED` | `20260407` | PRNG seed for generated rows. The same seed always gives the same rows. |
| `DEMO_DATE` | today in Sri Lanka | The demo clock: the demo day's run date, `YYYY-MM-DD`. Empty means today (Asia/Colombo), moved to the next operating day when today is closed. Set it in `.env` or the shell before `docker compose up`. |
| `DATABASE_URL` | (required) | Postgres connection. |

The seed prints the source of each table (`csv <file>` or `synthetic`), row counts, skipped rows with the first few reasons, and any rows added to fill a gap. It exits non-zero on failure.

## Files and columns

Each file is optional. Headers are matched case-insensitively. The seed strips the BOM, trims whitespace, splits camelCase and turns spaces, dashes and dots into `_`, so `Road Class`, `roadClass` and `road-class` all mean `road_class`. Extra columns are ignored. The first name listed for each column is the header used in the competition file; the other names are also accepted.

### `district_travel.csv` → `DistrictTravel`

| Field | Required | Accepted headers | Format |
|---|---|---|---|
| district | yes | `district`, `district_name` | text (primary key) |
| depot | yes | `depot` | `Peliyagoda` / `Kandy` (any case; a value containing the name works, e.g. `Kandy Hub`) |
| roadClass | no (default `urban`) | `road_class` | text, stored lowercase |
| depotToDistMin | yes | `depot_to_district_freeflow_min`, `depot_to_dist_min`, `depot_to_district_min` | number, rounded to whole minutes |
| interStopMin | yes | `inter_stop_freeflow_min`, `inter_stop_min` | number, rounded |
| distKm | no | `depot_to_district_km`, `dist_km`, `distance_km` | number |

`free_flow_kmh` and `inter_stop_km` are read by nothing and ignored.

### `service_allowance.csv` → `ServiceAllowance`

| Field | Required | Accepted headers | Format |
|---|---|---|---|
| brand | yes | `brand` | `Fresh` / `Style` / `Tech` |
| dockType | yes | `dock_type`, `dock` | `rear_dock`, `rear dock`, `mall_bay`, `street` (any case, spaces or dashes) |
| minutes | yes | `service_allowance_min`, `minutes`, `allowance_min`, `service_min` | number, rounded |

Any brand × dock combination missing from the file gets a generated value, and the seed log lists those combinations.

### `calendar.csv` → `Calendar`

| Field | Required | Accepted headers | Format |
|---|---|---|---|
| date | yes | `date`, `calendar_date`, `day` | `YYYY-MM-DD` or `YYYY/MM/DD` (stored as UTC midnight) |
| isOperating | yes* | `is_operating`, `operating` | boolean |
| isPayday | no (false) | `is_payday`, `payday` | boolean |
| festivalRamp | no (0) | `festival_ramp` | number |
| monsoon | no (0) | `monsoon`, `is_monsoon` | `0`/`1` or boolean |
| festivalName | no | `festival`, `festival_name` | text; blank or `none` → null |

\* If `is_operating` is absent, it is derived as "not `is_weekend` and not `is_holiday`". `dow`, `dow_name`, `iso_year` and `iso_week` are ignored. `note` is never loaded from the CSV; it belongs to the scenario.

### `outlets.csv` → `Outlet`

| Field | Required | Accepted headers | Format |
|---|---|---|---|
| id | yes | `outlet_id`, `id` | text, uppercased |
| name | no | `name`, `outlet_name` | If absent, derived as `Waypoint <Brand> <district> <numeric id suffix>` |
| brand | yes | `brand` | as above |
| district | yes | `district` | text |
| depot | yes | `depot` | as above |
| dockType | yes | `dock_type`, `dock` | as above |
| parking | no (NORMAL) | `parking_constraint`, `parking` | `normal`, `van_only`, `mall_dock`; blank → NORMAL |
| windowOpen | yes | `window_open_time`, `window_open` | `H:mm`, `HH:mm`, `HH:mm:ss` or `HHmm` → stored `HH:mm` |
| windowClose | yes | `window_close_time`, `window_close` | same |

`mall_window` is ignored.

### `vehicles.csv` → `Vehicle`

| Field | Required | Accepted headers | Format |
|---|---|---|---|
| id | yes | `vehicle_id`, `id` | text, uppercased |
| type | yes | `type`, `vehicle_type` | `truck` (or `lorry`) / `van` |
| tempClass | yes | `temp`, `temp_class`, `temperature` | `reefer`/`chilled` → CHILLED; `dry`/`ambient` → AMBIENT |
| capacityKg | yes | `weight_cap_kg`, `capacity_kg` | number |
| capacityM3 | yes | `volume_cap_m3`, `capacity_m3` | number |
| kmPerLitre | yes | `km_per_l`, `km_per_litre`, `km_per_liter` | number |
| weeklyLFuel | yes | `weekly_fuel_quota_l`, `weekly_l_fuel`, `weekly_fuel_l` | number, rounded |
| depot | yes | `depot` | as above |

`fuel_type` is ignored. New vehicles get status `AVAILABLE`.

### General value rules

- **Booleans:** `1/0`, `true/false`, `yes/no`, `y/n` and `t/f` are accepted, in any case.
- **Blanks:** an empty cell, `null`, `n/a`, `na`, `none` or `-` is read as blank. A blank optional field takes its default; a blank required field skips the row.
- **Numbers:** thousands separators (`1,234`) are allowed.
- **Bad rows:** a row with an unknown enum value, a malformed value or a missing required field is **skipped with a warning** and counted. The seed does not stop.
- **Duplicate keys:** if a key appears twice in one file, the last row wins.
- **Unusable files:** a file that exists but yields no usable rows is replaced by synthetic rows for that table, and the log says why.

## The demo day and the demo clock

The judged cycle (order → plan → load → deliver → receipt) needs a day that has not happened yet, whatever the real date is. The seed builds one on `DEMO_DATE`, by default **today in Sri Lanka**, so the driver and loader apps, which show today's run, open on it.

| Part | From the peak-day files (when present) | Without them (clean clone) |
|---|---|---|
| Peliyagoda orders | `task2b_peak_day_scenarios.csv`, scenario `S1`: outlet, temperature, units, kg, m³, deferred yesterday, days since last served. The brand comes from the outlet. | ~85 generated orders, mostly chilled, for Peliyagoda outlets; ten of them deferred yesterday |
| Workshop | `task2b_peak_day_fleet.csv`, scenario `S1`, rows `in_workshop` | the larger Peliyagoda reefers (two small ones run) plus dry trucks, ten in all |
| Kandy orders | always generated: Fathima's store OUT106 (chilled and ambient), OUT108 (deferred yesterday) and ~23 more | same |

To use the peak-day files, copy them next to the other CSVs (they are gitignored like the rest):

```bash
cp "Designing/data/Test Data/task2b_peak_day_scenarios.csv" "Designing/data/Test Data/task2b_peak_day_fleet.csv" data/
```

- Order ids are `ORD` + `yymmdd` of the demo day + a 3-digit number, for example `ORD261002001`. Orders were placed the afternoon before, before the 4:00 PM cut-off.
- Each order skipped yesterday has a confirmed `DeferralLog` (reason `CAP_REEFER`, rescheduled to the demo day) so the store sees why.
- Every vehicle gets a roster driver (`drv-veh001` …, no sign-in) so every planned trip has a driver; Ruwan drives VEH057, which is never in the workshop.
- The calendar gets rows from a week before the demo day to four weeks after when the loaded calendar lacks them (Sundays closed), so deferrals roll to a real next operating day.
- **Re-running the seed never resets the day.** Orders are created once; the workshop list is applied only when the day is first seeded. To start the day again, run `docker compose down -v` then `up`, or seed with another `DEMO_DATE`.

## Synthetic mode

The generator is deterministic. It uses a seeded PRNG and never calls `Math.random`, and it creates:

- 12 districts split across both depots. The names are real place names, but every minute and distance is generated.
- An allowance for every brand × dock combination.
- A calendar for 2026-03-30 to 2026-06-30. Sundays are closed, and it has one generated "Synthetic festival" with a ramp, a generated payday and a monsoon band.
- 120 outlets (anchors included) named `Synthetic <Brand> NN`, with `address = "synthetic"`.
- 60 vehicles (anchors included), mostly trucks with a few vans, about a quarter refrigerated.

Calendar rows carry `note = "synthetic"`. District, allowance and vehicle rows have no free-text column, so the seed summary is what identifies them as synthetic.

The generator also creates the **scenario anchors** when they are missing: outlets OUT106, OUT108, OUT027, OUT043, OUT028 and OUT009, and vehicles VEH057, VEH004 and VEH021. Their minimum story attributes are defined in `scenario.ts`. The same fill runs in CSV mode, so the story still works if a file lacks one of these ids. Every district used by an outlet also gets a travel row, with generated minutes if needed.

Files can be mixed. For example, `outlets.csv` can be present while the vehicles are synthetic. When `district_travel.csv` is loaded, synthetic outlets are placed in its districts.

## Idempotency

The seed is safe to run again.

- **Reference rows** are upserted by key: `district`, `(brand, dockType)`, `date`, or `id`. A re-run with new CSVs refreshes every CSV-derived column. Columns owned by the scenario or the live system are set only on create and are never overwritten: `Calendar.note`, `Outlet.accessNote`, `Vehicle.status`, `Vehicle.workshopNote` and `Vehicle.usedLThisWeek`.
- **The scenario** upserts by deterministic ids, for example `PLG-2026-04-07-v3`, `TRP-VEH057-20260407`, `STP-ORD0104216`, `POD-ORD0104216`, `LR-TRP-VEH057-20260407`, `OFE-VEH057-01`, `OLI-ORD0104216-01` and `DFL-ORD0104188`. Each run resets the story rows to the story. The hero trip is found by (VEH057, 2026-04-07), so a trip created by the old seed is reused. Legacy duplicate line items and offline events from the old seed are removed.
- **Users** use the fixed Keycloak subject ids from `scenario.ts`, and `passwordHash` is cleared because credentials live in Keycloak. If a user row from the old seed has the same email but a cuid id, the seed changes its id to the Keycloak id. The foreign keys are `ON UPDATE CASCADE`, so related rows follow. If that fails, the seed keeps the legacy id and prints a warning; resetting the database fixes it.
- **Switching sources** (synthetic → CSV) on the same database leaves the synthetic outlets and vehicles in place, because nothing is deleted. Run `prisma migrate reset` for a clean switch.

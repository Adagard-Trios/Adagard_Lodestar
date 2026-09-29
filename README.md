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
| `frontend/` | Web app (Next.js) |
| `mobile/` | Mobile app (Expo) |
| `backend/` | API (NestJS, planned) |

## Setup

_To be completed in the Hackathon build: `docker compose up`, `.env.example`, seeded accounts, and the judge walkthrough._

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

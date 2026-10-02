# AI disclosure · Waypoint Lodestar (Team Adagard)

This page separates two things: **AI inside the product** and **AI used to make it**. Everything stated as fact is verified from this repository or from our Designathon disclosure (board 11). Items marked **[team to confirm]** are not yet verified; they will be filled in before submission, and nothing is guessed.

## 1. AI inside the product

| Feature | What actually runs | Where in the code |
|---|---|---|
| **Planning agent** (drafts the day's plan, explains it, answers the dispatcher's questions) | A LangGraph graph around a **deterministic planner and rule checker**. The plan itself (vehicles, trips, stop order, deferrals with reason codes) comes from that deterministic code, not from a language model. The chat model is configurable: the default and the deployed setting is `mock`, a deterministic stand-in that emits tool calls and template explanations from tool results. `azure-openai` is wired but not configured, so no external model is called. | `backend/apps/agent` (`lodestar_agent/domain` planner and rules, `lodestar_agent/llm`, `AGENT_MODEL`) |
| **Human approval** | The agent can never publish. A dispatcher approves, edits or rejects every draft, and approval is an audited write by that person. | `backend/apps/planning/src/planning.sets.ts` (`AgentRuns … Resume`), `plan-execution.ts` |
| **Read-aloud** (driver and loader) | The phone's own text-to-speech through `expo-speech`. No model ships with the app, and nothing is sent anywhere. | `mobile/src/lodestar/runtime.tsx` |
| **Computer-vision auto-fill** (scan, temperature, seal, damage) | **Not built.** It is designed into the boards; in the app the person types or confirms the values. A leftover prototype route simulates it with a fixed value: see "Departures" in the README. | `mobile/src/app/stop/[id]/pod/index.tsx` (legacy) |
| **Downloadable voice packs** (Sinhala, Tamil) | **Not built**; designed only. | none |

## 2. AI used to make it

### Designathon (design boards), from our board 11

| Tool | Used for |
|---|---|
| Claude Code (Anthropic) | Analysing the challenge booklet with us, generating the HTML/CSS for the design boards and screen layouts from our specifications, drafting rationale copy for us to edit, checking data consistency across pages, and desk research with summarising (sources on board 02). |
| html.to.design (Figma plugin) | Converting the HTML boards into editable Figma layers (conversion, not AI design). |
| Figma | Final polish and wiring the prototype flows, by hand. |

Board 11 records the level per deliverable (human / AI-assisted / AI-generated and human-directed) and how the team reviewed each one.

### Hackathon (this codebase)

**[team to confirm]** Which AI tools were used to write the code, tests, infrastructure and documentation in this repository, for what, and by whom. See question 1.

## 3. Data and AI tools

- The competition datasets are never in this repository. `data/` and every `*.csv` are gitignored. The seed reads the CSVs at runtime from a mounted folder, and a clean clone uses generated synthetic data instead (`backend/prisma/DATA.md`).
- **[team to confirm]** Whether competition data was shared with any AI tool, and that this was within the data-sharing terms. See question 4.

## Open questions for the team

1. Hackathon build: which AI coding tools were used (for example Claude Code or others), on which parts, and was any code accepted without review? An earlier draft of this page named Google Gemini; nothing in the repository confirms or refutes that. Was it used, and for what?
2. Board 11 has placeholders still to fill: how the framing was challenged and approved, persona realism checks, screen changes, scenario changes, edited rationale paragraphs, and the demo video tools. Are they now filled in the submitted design?
3. Demo video: which tools record and edit it, and is any AI voice, captioning or script generation used?
4. Data: were competition CSV values pasted into or uploaded to any AI tool? If so, which tool, and does that fit the booklet's data-sharing terms?
5. Read-aloud: were the Sinhala and Tamil prompt texts checked by a native speaker (board 11 asks this)?
6. Desk research (board 02): have the source links been checked by a team member?

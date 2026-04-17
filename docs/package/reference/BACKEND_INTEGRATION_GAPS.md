# Backend Integration Gaps

**Version:** 1.1.0  
**Purpose:** Single authoritative reference for everything a backend developer needs to build or provide before any page can go to production. Covers missing endpoints, missing services, missing content, and the distinction between them.

---

## How to read this document

Items are grouped into three categories:

| Category | Meaning |
|---|---|
| **Missing content** | Data that needs to be created/authored — questions, exercises, test cases. No amount of code solves this. |
| **Missing service** | An interface or capability that needs to be designed and built — a code runner, a feedback calculator. |
| **Missing wiring** | An endpoint stub or DB call that is already specified and just needs implementation against an existing interface. |

The most important distinction: the scoring engine, adaptive engine, dashboard payload adapter, and MCQ endpoint parameter handling are **all complete**. The blockers are content, one new service (the code runner), and DB-layer wiring.

---

## Page-by-page gap map

### Dashboard — `codivium_insights_embedded.html`

**Status: Blocked on DB wiring only.**

| Gap | Category | Detail |
|---|---|---|
| `IRawDataProvider` DB implementation | Missing wiring | `DemoRawDataProvider` (in `backend/api/Services/DemoRawDataProvider.cs`) returns empty data. Replace with a DB-backed implementation that queries your session, MCQ attempt, and user tables. Interface: `IRawDataProvider.GetRawDataAsync(userId, from, to)`. Full data schema: `contracts/raw-data-v1.schema.json`. |
| `POST /api/sessions/start` — exercise selection | Missing wiring | Endpoint exists and returns a valid response shape. Currently generates a random sessionId and a redirect URL that leads nowhere (`/practice/start?sessionId=...`). Needs to query the exercise database, select the next appropriate exercise, and return a redirect URL that resolves. Blocked on exercise bank existing first. |

Everything else for the dashboard is complete: scoring engine, payload adapter, heatmap, allocation, depth, time-on-platform, convergence, recommendations, UI prefs store.

---

### Adaptive Practice — `adaptive-practice.html`

**Status: Blocked on DB wiring and one field population.**

| Gap | Category | Detail |
|---|---|---|
| `IRawDataProvider` DB implementation | Missing wiring | Same as dashboard. The adaptive engine (`backend/CodiviumAdaptiveEngine.cs`) is fully implemented and calls `GetRawDataAsync`. It needs the same DB-backed provider. |
| `CodingSession.SubCategory` population | Missing wiring | When a coding session is stored, the `SubCategory` field must be set from the exercise's metadata in your DB. The adaptive engine uses this field for stretch-recommendation adjacency. If absent, stretch falls back to overall category overlap. |
| `POST /api/user/adaptive-state` — persistence | Missing wiring | Endpoint is registered. Needs to write onboarding answers and recommendation choice records to your DB. DTOs are defined in `CodiviumAdaptiveEndpoints.cs`. No computation required — pure write. |

The adaptive engine's 14 recommendation types (recovery, abandonment_spotlight, re_entry, spaced_review, weakness_spotlight, coding_depth_gap, difficulty_progression, coding_fluency, coding_near_complete, coding_next_level, mode_switch, stretch, difficulty_calibration, building_continue), all ring fill/drain calculations, milestone detection, and the template system are complete. All rules are evaluated server-side — no client-side rule evaluation is needed.

---

### MCQ — `mcq-parent.html` and `mcq-quiz.html`

**Status: Blocked on content and DB wiring.**

| Gap | Category | Detail |
|---|---|---|
| **MCQ question bank** | **Missing content** | No questions exist anywhere in the package. `GET /api/mcq/questions` must return actual questions. Each question requires: `id`, `category`, `difficulty`, `question` text (supports ` ```python ` fenced blocks), `options` (array of exactly 6 strings), `correctIndices` (array of one or more indices into `options`), `explanation` (shown in results review), `nanoTutorial` (optional, shown as Tutorial button). Full schema: `contracts/mcq-quiz-api.contract.md`. |
| `IQuestionRepository` | Missing service | Interface does not exist. Must support: query by category list, difficulty, count, and optionally exclude question IDs the user has already answered correctly. Referenced in `backend/CodiviumMcqApiEndpoints.cs` as `// TODO: inject IQuestionRepository`. |
| `GET /api/mcq/questions` — full implementation | Missing wiring | Parameter parsing and sessionId generation are complete. Needs `IQuestionRepository` injected, server-side option shuffling (so `correctIndices` reflect the shuffled order), sessionId persistence to DB. |
| `POST /api/mcq/results` — full implementation | Missing wiring | Payload validation is complete. Needs: sessionId validation against DB, correctIndices anti-tamper check, session record persistence, per-question answer persistence, user correct-question-set update (for `skipCorrect` filtering), `McqAttempt` record creation per category (feeds the scoring engine). |
| Auth guard on all three MCQ endpoints | Missing wiring | JWT middleware must be registered in `Program.cs` first. Auth guard lines are commented in `CodiviumMcqApiEndpoints.cs` with `// TODO BE-04` — uncomment after JWT wiring. |

`GET /api/mcq/categories` is **complete** — it reads from `config/scoring-config.v1.json` which defines `available_by_track.mcq`. No changes needed there.

---

### Exercise Workspace — `editor.html`

**Status: Blocked on content, two new services, and two missing endpoints.**

| Gap | Category | Detail |
|---|---|---|
| **Coding exercise bank** | **Missing content** | No exercises exist. Each exercise requires: `id`, `name`, `category`, `difficulty`, `problemStatement`, `constraints`, `examples`, `testsTotal`, `codeScaffold`, `hints` (shown after lock threshold), `miniTutorial` (optional), `unitTests` (markdown/text, shown after lock threshold), `suggestedSolution` (shown after submission), test cases (for the code runner). Full schema: `contracts/exercise-workspace-api.contract.md`. |
| `ICodeRunner` | **Missing service** | No interface definition, no contract, no stub anywhere in the package. This is the service that executes submitted Python code against a set of test cases and returns pass/fail per test. Must return the shape expected by `POST /api/exercise/submit`: `{ accepted, testsPassed, testsTotal, failedTests[{ input, expected, got }] }`. Security requirements: sandboxed execution, resource limits (CPU, memory, wall-clock time). |
| `IFeedbackBuilder` | **Missing service** | Interface is defined and fully specified in `contracts/IFeedbackBuilder.contract.md`. No implementation exists. Called after `ICodeRunner` confirms all tests pass. Computes insight text, performance tier, chips, and trend deltas from submission history. The full specification — formulas, tier rules, worked example — is in the contract. |
| `GET /api/exercise?id=` | Missing wiring | No handler registered anywhere. Needs an exercise database query by ID. Response shape: `contracts/exercise-workspace-api.contract.md`. Must include per-user fields: `priorAttempts`, `bestPriorScore`, `lastSolvedAt`. |
| `POST /api/exercise/submit` | Missing wiring | No handler registered anywhere. Needs to: validate request, call `ICodeRunner`, persist submission record, call `IFeedbackBuilder` if accepted, return result. Full spec: `contracts/exercise-workspace-api.contract.md`. |

`editor-page.js` is complete against both contracts. All DOM wiring, CodeMirror integration, lock/unlock milestones, REPL, session timer, and analytics events work. The frontend needs no changes.

---

### Exercise Menu — `menu-page.html`

**Status: Blocked on exercise bank and one endpoint.**

| Gap | Category | Detail |
|---|---|---|
| `GET /api/menu/payload?track=` | Missing wiring | No handler registered. Requires: query exercise DB by track, join with user completion data to populate `completionStatus` and `completedAt` per exercise per user. Response shape: `contracts/exercise-menu-api.contract.md`. The SSR embedding pattern (setting `window.__CODIVIUM_MENU_DATA__` before the script loads) is supported and recommended for performance. |

`menu-data.js` and `drawer-and-filters.js` are complete. The demo data in `menu-demo-data.js` must be removed from the production `menu-page.html` script list before deployment.

---

## Dependency order

The gaps above have dependencies. The correct build order is:

```
1. JWT middleware in Program.cs
   └─ Unblocks: auth guards on all endpoints

2. IRawDataProvider (DB-backed)
   └─ Unblocks: dashboard, adaptive practice

3. MCQ question bank (content)
   + IQuestionRepository
   └─ Unblocks: GET /api/mcq/questions
               POST /api/mcq/results
               GET /api/mcq/categories (already done)

4. Coding exercise bank (content)
   └─ Unblocks: GET /api/exercise?id=
               GET /api/menu/payload
               POST /api/sessions/start

5. ICodeRunner
   └─ Unblocks: POST /api/exercise/submit

6. IFeedbackBuilder implementation
   └─ Unblocks: full POST /api/exercise/submit response
```

Steps 3 and 4 are content work and can proceed in parallel with steps 1 and 2. Step 5 is independent of content but typically developed alongside the exercise bank so it can be tested.

---

## What is complete and does not need to be built

To avoid confusion, the following are **fully implemented** and require no additional backend code:

- Scoring engine — `CodiviumScoringEngine.cs`, `CodiviumKatexScoring.v1.cs`
- Dashboard payload adapter — `CodiviumDashboardPayloadV2Adapter.v1.cs` (all panels, all chart data, info text)
- Adaptive recommendation engine — `CodiviumAdaptiveEngine.cs` (all 14 recommendation types in priority order P1–P14, all ring calculations including RawFill and per-exercise Attempts, AP-05 session quality model, all milestones)
- Heatmap builder — `CodiviumConvergenceHeatmap.cs`
- Allocation and depth calculators — `CodiviumAllocation.cs`, `CodiviumDepthByCategory.cs`
- Time-on-platform builder — `CodiviumTimeOnPlatform.cs`
- MCQ chart payload — `CodiviumMcq.cs`
- Dashboard UI prefs — `CodiviumDashboardUiPrefs.v1.cs`
- All C# unit tests (49 passing)
- `GET /api/mcq/categories` endpoint
- `GET /api/dashboard/payload` endpoint
- `POST /api/dashboard/ui-prefs` endpoint
- `IFeedbackBuilder` interface and full specification

---

## Cross-references

| Item | Where to look |
|---|---|
| MCQ endpoint specs | `contracts/mcq-quiz-api.contract.md` |
| Exercise workspace endpoint specs | `contracts/exercise-workspace-api.contract.md` |
| `IFeedbackBuilder` full spec | `contracts/IFeedbackBuilder.contract.md` |
| Adaptive state API spec | `contracts/adaptive-state-api.contract.md` |
| Exercise menu API spec | `contracts/exercise-menu-api.contract.md` |
| Raw data schema | `contracts/raw-data-v1.schema.json` |
| Per-limitation workarounds | `../../../docs/package/operations/KNOWN_LIMITATIONS.md` |
| Production deployment checklist | `../../../docs/package/operations/DEPLOYMENT_GUIDE.md`, `../../../docs/package/operations/OPERATIONAL_READINESS_CHECKLIST.md` |

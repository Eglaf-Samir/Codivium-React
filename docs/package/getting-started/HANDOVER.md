# Codivium Performance Insights — Handover Reference

**Version:** 1.1.0 (CVU-2026-03-AH)  
**Date:** 2026-03-16  
**Status:** This is the single, current handover document. All previous versions are superseded.

---

## Current package status

### What is fixed (as of this version)
- Security gate passes cleanly — all inline `onclick` handlers removed, replaced with delegated listeners
- Split CSS strategy is live — 8 authoritative CSS files, `dashboard.css` removed (superseded by 8 split CSS files)
- Resize system is fully live — 6 splitters, persisted to localStorage, owned by `dashboard.00.core.js`
- JS public API fully documented in `docs/JAVASCRIPT_API.md`
- Payload contract consistent end-to-end — `dashboard-payload-v2` only, no v3
- `dashboard.css` removed from `assets/components/dashboard/` — no ambiguity
- `codivium_insights_embedded.html` does not load demo data unconditionally
- `selectedTrack` is server-persisted and correctly flows through the full pipeline
- Deployment boundary is explicit — see `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` and `deployment-manifest.json`

### What is deployable now
- All files marked **DEPLOY** in `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md`
- Run `scripts/fetch_vendor_deps.sh` to vendor Chart.js and KaTeX before deployment

### What still requires manual QA before production
- Browser rendering of all 6 layout presets (no automated browser test)
- Heatmap `cell.style.setProperty` error under the Node test shim (cosmetic under test; works in browser)
- C# backend compilation — requires `dotnet build` against your project
- `granularity` param (week/month) — accepted but only `day` is implemented; do not advertise week/month

### What is demo/test facility only
- `demo/` — all pages and payload fixtures
- Root stubs: `join.html`, `login.html` (replace with real app pages in production)
- MCQ pages: `mcq-parent.html`, `mcq-quiz.html` — prototype stage, see §"MCQ Pages" below
- Adaptive page: `adaptive-practice.html`, `assets/components/adaptive/` — Phase B prototype, see §"Adaptive Practice Page" below

### What is inactive
- `backend/CodiviumPoints.v1.cs` — tombstone; superseded by `CodiviumKatexScoring.v1.cs`

---


---

## Editor / Workspace pages (added v1.1.0)

### What these pages are
`editor.html` implements the Codivium exercise workspace — the page a student lands on when working
through a coding exercise. It provides:

- 4-pane resizable workspace (A1: instructions/hints/tests/tutorial, B1: code editor/solution,
  A2: REPL input, B2: REPL output)
- CodeMirror 5 code editor with 10 syntax themes
- 10 workspace colour themes
- Tab lock system (hints/tests/tutorial unlock after submission milestones)
- Session timer (analog + digital, smooth sweep)
- Focus modes (Default / Code / Read)
- Settings palette (font, theme, typography)
- Exercise data loader (GET `/api/exercise?id=`) with demo fallback
- Guided tour
- Submit button (currently stubbed — see below)

### Current maturity level
**Prototype / integration stage.** The UI is complete and layout-aligned with the dashboard shell.
Most interactive features are working. It is **not yet production-deployable.**

### What the editor/workspace assets are
| File | Purpose |
|---|---|
| `editor.html` | Page HTML (570 lines — JS and CSS extracted) |
| `assets/components/editor/editor-page.js` | All workspace JS — the active page runtime |
| `assets/components/editor/editor-page.css` | All workspace CSS |
| `assets/components/editor/editor-page.js` | **Active runtime** — loaded by editor.html. Owns all workspace UI and the full load/submit API integration. |
| `feedback-demo.html` | Feedback modal demonstration page (UI reference) |

### Prototype-to-production gap (what remains before production)

| Item | Status |
|---|---|
| POST `/api/exercise/submit` wired | ✗ Stub only |
| Session ID created and sent | ✗ Missing |
| Test results DOM element | ✗ Missing |
| `feedback.js` / `feedback.css` loaded | ✓ Loaded in editor.html (v1.1.0) |
| `CodiviumFeedback.show()` called on submit | ✓ Called in the submit module on success |
| Analytics/instrumentation hooks | ✗ Missing |
| Responsive policy defined | ✗ Desktop-first only (undeclared) |
| CSP strategy finalised | ✗ Pending full JS extraction to modules |
| SRI hashes on CDN resources | ✗ Missing on 3 of 4 (CodeMirror, marked) |
| JS modularisation (A09) | ✗ Still one large file — Phase 3 |

See `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` §"Editor / Workspace pages" and
`docs/EDITOR_ARCHITECTURE.md` for full details.

### Shared shell dependency
The editor/workspace page loads the same shared shell CSS as the dashboard:
`base.css`, `logo.css`, `topbar.css`, `sidebar.css`, `menu-overrides.css`.
Changes to these files affect both the dashboard and the editor page.


---

## MCQ Pages (added post-v1.1.0)

### What these pages are
`mcq-parent.html` is the quiz setup page — the student selects categories, difficulty level,
and number of questions before starting a quiz. `mcq-quiz.html` is the question page — it
presents one question at a time, records answers, and shows a full review at the end.

### Current maturity
**Prototype / integration stage.** The UI is complete. It is **not yet production-deployable.**

| File | Purpose |
|---|---|
| `mcq-parent.html` | MCQ setup/filter page |
| `mcq-quiz.html` | Quiz question and results page |
| `assets/components/mcq/mcq-parent.js` | Setup page JS |
| `assets/components/mcq/mcq-quiz.js` | Quiz runtime JS (includes demo question bank) |
| `assets/components/mcq/mcq-tour.js` | Cross-page guided tour |

### Prototype-to-production gap

| Item | Status |
|---|---|
| Backend question bank API | ✗ Not implemented — demo bank in `mcq-quiz.js` |
| Category list from API | ✗ Hardcoded in `mcq-parent.js` |
| Score persistence to backend | ✗ localStorage only |
| Auth/session integration | ✗ Missing |
| Real MCQ payload contract wired | ✗ See `backend/CodiviumMcq.cs` for C# model |

## Architecture overview

### Frontend entry point
`codivium_insights_embedded.html` → loads 8 split CSS files + `dashboard.bundle.js` via `polyfill-loader.js`.

### JS module chain (source order, concat into bundle)
```
dashboard.00.config.js      — config object, layout presets, INFO_CONTENT
dashboard.00.core.js        — state, layout engine, resizers, dock, info pane toggle
dashboard.01.scoreinfo.js   — score key registry, INFO_CONTENT/INFO_DETAIL index
dashboard.02.heatmap-analysis.js
dashboard.03.time-analysis.js
dashboard.04.exercise-analysis.js
dashboard.05.overview-analysis.js
dashboard.06.mcq-and-render.js — chart rendering, CTA buttons, scores expanded view
dashboard.06b.refresh.js    — CodiviumInsights public API (init/update/refresh/destroy/setUiPrefs)
dashboard.07.tour.js        — guided tour
dashboard.08.help-and-init.js — FAQ/Glossary modals, event delegation, boot
```

### CSS ownership (all 8 files deployed)
| File | Owns |
|---|---|
| `dashboard.base.css` | Design tokens, typography, shared surfaces |
| `dashboard.shell.css` | Stage, form-head, page-level chrome |
| `dashboard.resizers.css` | Splitter drag visuals |
| `dashboard.layout.css` | Grid geometry, mode/panel visibility |
| `dashboard.panels.css` | Panel internals (charts, scores, controls) |
| `dashboard.chrome.css` | Layout preset dock, info pane toggle |
| `dashboard.modals.css` | FAQ/Glossary modals |
| `dashboard.math.css` | KaTeX formula rendering |

### State model (`__cvState` in `dashboard.00.core.js`)
```js
__cvState = {
  __uiMode,              // "full" | "info_only"
  __uiPanels,            // { scores, depth, heatmap, time, allocation, mcq, infoPane }
  __uiEffectiveMode,
  __uiForcedSmallScreen,
  __allowedModes,        // null or string[]
  __selectedCodingTrack, // "combined" | "micro" | "interview"
  __sessionStartEndpoint,
  __recommendedActions,
  __metricsOverride,     // optional override injected by integrator
  __infoContentOverrides,
  __analysisOverrides,
}
```
Debug access: set `window.CodiviumInsightsConfig = { debug: true }` before bundle loads.

---

## Contract chain

```
raw-data-v1 → CodiviumDashboardPayloadV2Adapter → dashboard-payload-v2 → browser
```

See `contracts/CONTRACT_STORY.md` for the full canonical contract story.  
See `docs/FIELD_CONSISTENCY_MATRIX.md` for field-by-field mapping.

---

## Layout presets vs mode/panels

Presets are **frontend macros** only. They serialize to `mode + panels` in `DashboardUiPrefs`.
No `preset` field exists in any contract or backend model.

| Preset | mode | key panels |
|---|---|---|
| Full Dashboard | `full` | all true |
| Coding Core | `full` | scores+depth+heatmap+time+allocation, mcq=false |
| Heatmap Focus | `full` | heatmap only |
| Scores Only | `full` | scores only |
| Summary View | `info_only` | (pane is full view) |
| MCQ Only | `full` | mcq only |

---

## Resizer system

Six live splitters owned by `__cvInitSplitters()` in `dashboard.00.core.js`.
Positions persisted to `localStorage` key `cv.dashboard.resizers`.

| Splitter | Direction | Context |
|---|---|---|
| `#cvSplitterInfoPane` | Vertical | `.insights-layout` flex |
| `#cvSplitterMcq` | Horizontal | `.form-body` (MCQ row height) |
| `#cvSplitterHeatL` | Vertical | Wide breakpoint only |
| `#cvSplitterHeatR` | Vertical | Wide breakpoint only |
| `#cvSplitterScoresDep` | Horizontal | `.colLeft` (scores vs depth) |
| `#cvSplitterTimeDon` | Horizontal | `.colRight` (time vs allocation) |

---

## Info pane toggle (added CVU-2026-03-AF)

`#cvInfoPaneToggleBtn` is injected into `.form-head-right` by `__cvSyncInfoPaneToggle(state)`.
- Visible when `mode=full` (hidden in `info_only`)
- Calls `CodiviumInsights.toggleInfoPane()` on click
- Delegated listener in `dashboard.08.help-and-init.js` (no inline handler)
- Gold when pane is open; grey when closed

---

## Grid geometry

```css
grid-template-columns: 26.7fr 23.1fr 48.4fr;   /* left | heatmap | right */
grid-template-rows: minmax(0,2.73fr) minmax(0,1.3fr);
```
JS constants: `colTemplate`, `TOP_FR=2.73`, `MCQ_FR=1.3` in `dashboard.00.core.js`.

---

## Key localStorage keys

| Key | Content |
|---|---|
| `cv.dashboard.ui` | `DashboardUiPrefs` JSON |
| `cv.dashboard.resizers` | Splitter positions |

---

## Build and test

```bash
# Build bundle
bash scripts/build_dashboard_bundle.sh

# Run JS unit tests (49 tests)
node --test tests/dashboard.test.js

# Run all checks (build + tests + security + smoke + links)
bash scripts/run_checks.sh

# Smoke test only
node scripts/smoke_test.js
```

---

## Deployment checklist (summary)

1. Run `scripts/fetch_vendor_deps.sh` to vendor Chart.js and KaTeX
2. Run `bash scripts/build_dashboard_bundle.sh`
3. Run `bash scripts/run_checks.sh` — all checks must pass
4. Deploy files listed in `deployment-manifest.json` under `"deploy"`
5. Replace `backend/api/Services/DemoRawDataProvider.cs` with DB-backed provider
6. Replace `join.html`, `login.html` stubs with real app pages
7. Do NOT deploy anything in `demo/`, `tests/`, `scripts/`
8. Verify manually in browser: all 6 layout presets, resizers, info pane toggle, tour

---


## Deployable-package map

See `../../../docs/package/reference/DEPLOY_WHITELIST.txt` for the explicit file list. Summary:

| Category | What to integrate/deploy |
|---|---|
| Frontend JS | `assets/components/dashboard/js/dashboard.bundle.js` (+ `dashboard_settings.js`) |
| Frontend CSS | All 8 `dashboard.*.css` split files + `dashboard_settings.css` |
| Core assets | `assets/components/core/`, `logo/`, `sidebar/`, `topbar/` |
| Vendor | `assets/vendor/` (run `fetch_vendor_deps.sh` first) |
| Static assets | `assets/favicons/`, `assets/img/`, `assets/docs/` |
| Entry HTML | `codivium_insights_embedded.html`, `dashboard_view_settings.html` |
| Config | `config/scoring-config.*.json` |
| CSP | `csp/nginx.conf` or `csp/cloudflare.txt` (choose one) |
| Backend | All `backend/CodiviumDashboard*.cs` + `CodiviumKatex*.cs` etc. (not `api/` verbatim — adapt) |

What NOT to deploy: `demo/`, `tests/`, `scripts/`, `backend/api/` as-is.

## Key files quick reference

For a consolidated map of all missing backend code and content across every page, see **`../../../docs/package/reference/BACKEND_INTEGRATION_GAPS.md`**.


| Purpose | File |
|---|---|
| Production entry HTML | `codivium_insights_embedded.html` |
| Deploy this JS | `assets/components/dashboard/js/dashboard.bundle.js` |
| Public JS API | `docs/JAVASCRIPT_API.md` |
| Deployment boundary | `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` |
| Deployment manifest | `deployment-manifest.json` |
| Contract story | `contracts/CONTRACT_STORY.md` |
| Field consistency matrix | `docs/FIELD_CONSISTENCY_MATRIX.md` |
| Backend scoring engine | `backend/reference/CodiviumScoringEngine.cs` (COMPILED despite path — provides `CodiviumScoring`, `ComputeScoreBundle`) |
| Backend DTO definitions | `backend/CodiviumPayloadDtos.cs` (payload DTO classes) |
| Backend adapter | `backend/CodiviumDashboardPayloadV2Adapter.v1.cs` |
| UI prefs model | `backend/CodiviumDashboardUiPrefs.v1.cs` |

## Remaining open items (post CVU-2026-03-AI)

These are the genuinely unresolved items requiring action before production deployment.
Every other previously-listed issue is now resolved.

### Must action before production

| Item | Notes |
|---|---|
| Replace `DemoRawDataProvider` | `backend/api/Services/` — replace with a DB-backed `IRawDataProvider` |
| Replace root stub pages | `join.html`, `login.html` — replace with your real app pages |
| Run `scripts/fetch_vendor_deps.sh` | Vendors Chart.js + KaTeX into `assets/vendor/` before deploying |

### Requires manual QA (no automated browser tests)

| Item | Notes |
|---|---|
| Browser rendering | Validate all 6 layout presets, resizers, info pane toggle, tour in a real browser |
| C# backend compilation | Run `dotnet build` + `dotnet test backend/tests/` in your project |

### Known implementation gap (intentional — not a blocker)

| Item | Notes |
|---|---|
| `granularity` week/month | API accepts the param; adapter implements `day` only. Documented in `backend/api/README_API.md`. |

### Resolved (listed for handoff clarity)

| Item | Resolution |
|---|---|
| Security gate | ✅ Passes — all inline handlers removed; delegated listeners in `08.help-and-init.js` |
| Test suite | ✅ 49/49 — runtime cleanliness (T25), debug flag (T23/T24), selectedTrack (T22) |
| `selectedTrack` persistence | ✅ Server + localStorage + payload — fully consistent end-to-end |
| `allowedModes` enforcement | ✅ Implemented in v38 DTOs + frontend; tested in T21 |
| Heatmap runtime errors | ✅ Fixed — `style.setProperty` added to test shim; clean in browser |
| Inline onclick handlers | ✅ Removed from all HTML pages; replaced with delegated listeners |
| Orphaned `dashboard.css` | ✅ Removed — superseded by 8 split CSS files |
| `selectedTrack` docs | ✅ All docs corrected — server persistence accurately documented everywhere |
| v37/v38 role clarity | ✅ Documented in DEPLOYMENT_GUIDE, LIVE_VS_LEGACY, DEPLOYMENT_BOUNDARY |
| Demo data in embedded page | ✅ Script commented out; integration instructions in place |
| Deployment boundary | ✅ `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` + `deployment-manifest.json` + `../../../docs/package/reference/DEPLOY_WHITELIST.txt` |

## Definition of done — package handoff status

This section confirms the package satisfies its stated handoff criteria.

| Criterion | Status | Evidence |
|---|---|---|
| **Docs truthfulness** | ✅ | All stale claims removed; automated sweep finds zero stale patterns |
| **Deployment boundary clarity** | ✅ | `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md`, `deployment-manifest.json`, `../../../docs/package/reference/DEPLOY_WHITELIST.txt` |
| **Contract consistency** | ✅ | `contracts/CONTRACT_STORY.md`, `docs/FIELD_CONSISTENCY_MATRIX.md` |
| **`selectedTrack` doc correctness** | ✅ | Corrected in all 6 relevant docs; server-persistence confirmed in model + adapter |
| **Granularity story (honest)** | ✅ | `day`-only documented in API README; gap recorded in DEPLOYMENT_GUIDE and open items |
| **Security gate clean** | ✅ | `npm run security` passes — zero inline event handlers |
| **Runtime tests clean** | ✅ | 49/49 passing; T25 asserts zero `console.error` during normal operation |
| **Offline/vendor story honest** | ✅ | `../../../docs/package/operations/OFFLINE_VENDOR.md` documents vendor fetch as required pre-deploy step |
| **Real package workflow** | ✅ | `npm run verify` runs full pipeline; `package.json` exposes all commands |
| **Demo/test facility acceptable** | ✅ | No inline handlers; correct asset paths; marked clearly as non-production |
| **Single current handover doc** | ✅ | This file (`../../../docs/package/getting-started/HANDOVER.md`) is the one current-truth document |
| **v37/v38 scoring engine roles** | ✅ | Documented in DEPLOYMENT_GUIDE, LIVE_VS_LEGACY, DEPLOYMENT_BOUNDARY |
| **`allowedModes` implemented** | ✅ | `DashboardMeta.AllowedModes` in v38; enforced by frontend; tested (T21) |
| **Heatmap runtime cleanliness** | ✅ | `style.setProperty` in test shim; no runtime errors during tests |

### What is deliberately left open

Three items require integrator action before production — they are not package defects:

1. Replace `DemoRawDataProvider` with a DB-backed implementation
2. Replace root stub pages (`join.html`, `login.html`) with real app-shell pages
3. Run `scripts/fetch_vendor_deps.sh` to vendor Chart.js and KaTeX

One known implementation gap exists in the adapter (`granularity` week/month) but does not block deployment.


---

## Known limitations

See `../../../docs/package/operations/KNOWN_LIMITATIONS.md` for the current truthful list of limitations.  
Key items:
- Dashboard: `granularity` week/month not implemented (D1)
- Editor: submit stub not wired (E1), SRI pending (E3) — see ../../../docs/package/operations/KNOWN_LIMITATIONS.md
- Editor: CodeMirror 5 a11y partial (E4), REPL output not in live region (E5)

---

## Governance and edit guidance

- `../../../docs/package/policies/GOVERNANCE.md` — package owner, review checklist, release criteria, naming conventions
- `../../../docs/package/reference/EDIT_GUIDANCE.md` — which files to edit, which to leave alone, build workflow
- `docs/adr/` — 6 Architectural Decision Records (ADRs) for key choices

---

## Quick-start for a new developer

> For full integration steps see `../../../docs/package/getting-started/INTEGRATION_QUICKSTART.md`

```bash
# 1. Install (no runtime deps — devDependencies only for test runner)
node --version   # requires 18+

# 2. Run all checks
bash scripts/run_checks.sh

# 3. Run editor smoke test
node scripts/editor_smoke_test.js

# 4. View the dashboard
open codivium_insights_embedded.html   # use a demo payload from demo/

# 5. View the editor (demo mode)
# Open editor.html in browser, then in console: window.__CODIVIUM_DEMO__ = true; location.reload()

# 6. Deploy
bash scripts/fetch_vendor_deps.sh     # vendor Chart.js, KaTeX, CodeMirror, marked
bash scripts/verify_sri.sh            # get SRI hashes for editor CDN assets
# Then deploy files listed in deployment-manifest.json["deploy"]
```

**Which pages are production-ready?**
- `codivium_insights_embedded.html` — YES
- `dashboard_view_settings.html` — YES
- `editor.html` — NO (prototype, see prototype-to-production gap above)

---

# Codivium Performance Insights — Deployment Boundary

> **Current package status:** See `../../../docs/package/getting-started/HANDOVER.md` (project root).


**Version:** 1.0.22 (CVU-2026-03-AH)  
**Principle:** One truthful package map. Every file classified exactly once.

---

## Classification key

| Label | Meaning |
|---|---|
| **DEPLOY** | Must be deployed / integrated by the dev team |
| **DEMO** | Dev/test facility only — do not deploy to production |
| **REFERENCE** | Backend example code — adapt and replace, do not deploy verbatim |
| **SCRIPTS** | Developer tooling — not deployed |
| **DOCS** | Documentation / handover — not deployed |
| **GENERATED** | Built artifact — deploy the output, not the input |

---

## Live / Integration files — DEPLOY these

### Frontend JS (deploy `dashboard.bundle.js` only)
```
assets/components/dashboard/js/
  dashboard.bundle.js              DEPLOY — built artifact, single file to integrate
  dashboard.00.config.js           SCRIPTS (source) — edit to rebuild bundle
  dashboard.00.core.js             SCRIPTS (source)
  dashboard.01.scoreinfo.js        SCRIPTS (source)
  dashboard.02.heatmap-analysis.js SCRIPTS (source)
  dashboard.03.time-analysis.js    SCRIPTS (source)
  dashboard.04.exercise-analysis.js SCRIPTS (source)
  dashboard.05.overview-analysis.js SCRIPTS (source)
  dashboard.06.mcq-and-render.js   SCRIPTS (source)
  dashboard.06b.refresh.js         SCRIPTS (source)
  dashboard.07.tour.js             SCRIPTS (source)
  dashboard.08.help-and-init.js    SCRIPTS (source)
  dashboard_settings.js            DEPLOY — settings page JS
```

### Frontend CSS (deploy all 8 split files)
```
assets/components/dashboard/
  dashboard.base.css               DEPLOY
  dashboard.shell.css              DEPLOY
  dashboard.resizers.css           DEPLOY
  dashboard.layout.css             DEPLOY
  dashboard.panels.css             DEPLOY
  dashboard.chrome.css             DEPLOY
  dashboard.modals.css             DEPLOY
  dashboard.math.css               DEPLOY
  dashboard_settings.css           DEPLOY
```

### Core / shell components
```
assets/components/core/
  base.css                         DEPLOY
  global.js                        DEPLOY
  polyfill-loader.js               DEPLOY
  polyfills.js                     DEPLOY
  stub-page.css                    DEPLOY (for stubs; replace stubs in production)
  telemetry.js                     DEPLOY

assets/components/logo/            DEPLOY (all files)
assets/components/sidebar/         DEPLOY (all files)
assets/components/topbar/          DEPLOY (all files)
```

### Vendor dependencies (deploy after fetch_vendor_deps.sh)
```
assets/vendor/chartjs/             DEPLOY (run scripts/fetch_vendor_deps.sh first)
assets/vendor/katex/               DEPLOY (run scripts/fetch_vendor_deps.sh first)
```

### Favicons / assets
```
assets/favicons/                   DEPLOY
assets/img/                        DEPLOY
assets/docs/                       DEPLOY (KaTeX scoring docs)
```

### Entry HTML
```
codivium_insights_embedded.html    DEPLOY — production integration entry point
dashboard_view_settings.html       DEPLOY — UI settings page
join.html / login.html / mcq-parent.html
                                   DEMO STUBS — replace with real app pages in production
```

### Backend (adapt for your stack — do not deploy reference/demo code verbatim)
```
backend/CodiviumPayloadDtos.cs     DEPLOY (scoring engine)
backend/CodiviumDashboardPayloadV2Adapter.v1.cs      DEPLOY (payload builder)
backend/CodiviumDashboardUiPrefs.v1.cs               DEPLOY (UI prefs model)
backend/CodiviumHeatmapFocusBuilder.v1.cs            DEPLOY (heatmap rankings)
backend/CodiviumInsights.v1.cs                       DEPLOY (insights text)
backend/CodiviumKatexScoring.v1.cs                   DEPLOY (scoring config)
backend/CodiviumKatexConfig.v1.cs                    DEPLOY (config loading)
backend/CodiviumRecommendedActions.v1.cs             DEPLOY (CTA generation)
backend/CodiviumRawDataBuilder.v1.cs                 DEPLOY (raw data builder)
backend/CodiviumClock.v1.cs                          DEPLOY (clock abstraction)
backend/CodiviumConfigValidation.v1.cs               DEPLOY (config validation)
backend/CodiviumJsonConverters.v1.cs                 DEPLOY (JSON serialisation)
backend/api/                                         REFERENCE — replace DemoRawDataProvider
backend/Codivium.Dashboard.csproj                    DEPLOY (project file)
```

### Config
```
config/scoring-config.v1.json                        DEPLOY
config/scoring-config.katex.v1.json                  DEPLOY
```

### Contracts (keep for integration reference — not deployed to production server)
```
contracts/dashboard-payload-v2.contract.md           DOCS
contracts/dashboard-payload-v2.schema.json           DOCS / SCRIPTS (validation)
contracts/dashboard-ui-prefs-v1.contract.md          DOCS
contracts/raw-data-v1.contract.md                    DOCS
contracts/raw-data-v1.schema.json                    DOCS / SCRIPTS (validation)
```

### CSP configs (use the one matching your server)
```
csp/nginx.conf                                       DEPLOY (nginx deployments)
csp/cloudflare.txt                                   DEPLOY (Cloudflare deployments)
csp/README.md                                        DOCS
```

---


---

## Editor / Workspace pages — PROTOTYPE stage (DO NOT deploy to production yet)

These pages were added in v1.1.0. They implement the exercise workspace UI.
They are at **integration/prototype stage** — not production-ready.

See `docs/EDITOR_ARCHITECTURE.md` for architecture details and the prototype-to-production gap.

```
editor.html                              DEMO/PROTOTYPE — exercise workspace UI
assets/components/editor/
  editor-page.js                         DEMO/PROTOTYPE — all workspace JS
  editor-page.css                        DEMO/PROTOTYPE — all workspace CSS
feedback-demo.html                       DEMO — feedback modal demonstration
```

### Current maturity
- UI complete and layout-aligned with dashboard shell geometry
- Interactive features: tabs, locks, splitters, timer, focus modes, REPL, settings palette, tour
- Demo exercise data loads (DEMO_EXERCISE fallback)

### Not yet production-ready (prototype-to-production gap)
- Submit endpoint is a stub — POST `/api/exercise/submit` not wired
- `feedback.js` / `feedback.css` loaded ✓ — CodiviumFeedback.show() called on submit success
- No session ID created or sent with submissions
- No test results DOM element for displaying per-test pass/fail
- No CSP strategy finalised for the page
- No analytics/instrumentation hooks
- Responsive policy not defined (currently desktop-first only)
- See `docs/EDITOR_ARCHITECTURE.md` for the full gap list and completion criteria

---

## MCQ Pages — PROTOTYPE stage (DO NOT deploy to production yet)

These pages implement the Multiple Choice Quiz feature. They are at **prototype/integration stage**.

```
mcq-parent.html                          DEMO/PROTOTYPE — MCQ setup and filter page
mcq-quiz.html                            DEMO/PROTOTYPE — Single quiz question page
assets/components/mcq/
  mcq-parent.js                          DEMO/PROTOTYPE — MCQ setup page JS
  mcq-parent.css                         DEMO/PROTOTYPE — MCQ setup page CSS
  mcq-quiz.js                            DEMO/PROTOTYPE — Quiz runtime JS
  mcq-quiz.css                           DEMO/PROTOTYPE — Quiz runtime CSS
  mcq-forms.css                          DEMO/PROTOTYPE — Shared MCQ form styles
  mcq-setup-overrides.css               DEMO/PROTOTYPE — MCQ layout overrides
  mcq-tour.js                            DEMO/PROTOTYPE — Cross-page guided tour
```

### Current maturity
- MCQ setup page: category filters, difficulty, question count, exclude-correct, info panels, tour
- Quiz page: 6-option grid (2×3), multi-select, code rendering, peek/reveal, segmented progress, timer
- Demo data bank: 12 questions with 6 options each, tutorials, varied categories and difficulties

### Not yet production-ready (MCQ prototype-to-production gap)
- No backend API endpoint — questions come from a hardcoded demo bank in `mcq-quiz.js`
- No auth/session integration
- No persistent score storage to backend (localStorage only)
- No real category data from API — `mcq-parent.js` renders hardcoded category list
- See `contracts/exercise-workspace-api.contract.md` for API shape reference


---

## Exercise Menu page — PROTOTYPE stage (DO NOT deploy to production yet)

Added in v1.1.0. The exercise browser page — lists exercises with search and filtering.

```
menu-page.html                               DEMO/PROTOTYPE
assets/components/exercise-menu/
  exercise-menu.css                          DEMO/PROTOTYPE
  menu-data.js                               DEMO/PROTOTYPE
  drawer-and-filters.js                      DEMO/PROTOTYPE
  menu-demo-data.js                          DEMO (local dev fallback only)
```

### Current maturity
- Full UI complete: search, filters, category checkboxes, sort, scroll
- Exercise cards link correctly to `editor.html?id=...&from=...`
- Demo data provided via `menu-demo-data.js` for standalone use
- Route config aware: `menu` key in `route-config.js`

### Not yet production-ready
- `GET /api/menu/payload` endpoint not implemented (see `contracts/exercise-menu-api.contract.md`)
- No session/auth integration
- No analytics hooks beyond `cvMenuReady` event
- `menu-demo-data.js` must be removed or guarded in production


---

## Site-level route stubs — LOCAL DEV ONLY (DO NOT deploy)

These stub files exist solely to satisfy `link_check.js` during local development.
The real pages are served by the application server at the corresponding routes.

```
landing.html          STUB → application root /
articles.html         STUB → /articles
pricing.html          STUB → /pricing
contact.html          STUB → /contact
faq.html              STUB → /faq
```

## Demo / test facility — DO NOT deploy to production

```
demo/                              DEMO — dev/test harness only
  codivium_insights_demo_*.html    DEMO — preset-specific demo pages
  demo_data_*.js                   DEMO — static payload fixtures
  payload_example1.json            DEMO — example payload shape
  join.html / login.html / mcq-parent.html  DEMO — nav stubs for demo context
  README_DEMOS.txt                 DOCS
```

---

## Reference / example code — adapt before use

```
backend/api/                       REFERENCE
  Services/DemoRawDataProvider.cs  REFERENCE — replace with DB-backed provider
  Program.cs                       REFERENCE — adapt for your host
  README_API.md                    DOCS
backend/tests/                     SCRIPTS (C# unit tests)
backend/McqPayloadCallExample.v1.cs REFERENCE — usage example
```

---

---

## Scripts / tooling — not deployed

```
scripts/
  build_dashboard_bundle.sh        SCRIPTS
  fetch_vendor_deps.sh             SCRIPTS
  generate_manifest.js             SCRIPTS
  link_check.js                    SCRIPTS
  run_checks.sh                    SCRIPTS
  security_gates.sh                SCRIPTS
  smoke_test.js                    SCRIPTS
  validate_payload_contract.js     SCRIPTS

tests/                             SCRIPTS (JS unit tests)
.github/workflows/                 SCRIPTS (CI config)
package.json                       SCRIPTS
```

---

## Documentation — not deployed

```
../../../docs/package/getting-started/HANDOVER.md                        DOCS
../../../docs/package/operations/DEPLOYMENT_GUIDE.md                DOCS
../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md             DOCS (this file)
docs/LIVE_VS_LEGACY_FILES.md       DOCS
docs/DB_TO_RAW_DATA_MAPPING.md     DOCS
docs/JAVASCRIPT_API.md             DOCS
docs/CTA_ACTIONS_AND_SESSIONS.md   DOCS
README.txt                         DOCS
VERSION                            DOCS
../../../docs/package/history/CHANGELOG.md                       DOCS
RELEASE_MANIFEST.json              DOCS / SCRIPTS
../../../docs/package/history/RELEASE_NOTES.md                   DOCS
../../../docs/package/operations/BROWSER_SUPPORT.md                 DOCS
../../../docs/package/operations/PERFORMANCE_GUIDE.md               DOCS
../../../docs/package/security/SECURITY_HARDENING.md              DOCS
../../../docs/package/security/THREAT_MODEL_DASHBOARD.md          DOCS
../../../docs/package/operations/OPERATIONAL_READINESS_CHECKLIST.md DOCS
../../../docs/package/history/KATEX_ALIGNMENT_LOG.md             DOCS
../../../docs/package/history/KATEX_IMPLEMENTATION_LOG.md        DOCS
../../../docs/package/policies/THIRD_PARTY_NOTICES.md             DOCS
```

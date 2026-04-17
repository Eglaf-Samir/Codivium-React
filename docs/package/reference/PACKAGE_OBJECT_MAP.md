# Codivium — Package Object Map

**Version:** 1.1.0  
**Status:** Combined package — dashboard runtime + editor/workspace (prototype stage)  
**Authoritative classification:** `deployment-manifest.json` (machine-readable), `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` (human-readable)

---

## Object inventory

### 1. Dashboard runtime — DEPLOY
The production-ready, deployable dashboard. Entry point is `codivium_insights_embedded.html`.

| Object | Classification | Notes |
|---|---|---|
| `codivium_insights_embedded.html` | DEPLOY | Production entry point |
| `dashboard_view_settings.html` | DEPLOY | UI settings page |
| `assets/components/dashboard/js/dashboard.bundle.js` | DEPLOY | Single built artifact |
| `assets/components/dashboard/*.css` (8 files) | DEPLOY | Split CSS strategy |
| `assets/components/core/` | DEPLOY | Shell: base.css, polyfills, global.js |
| `assets/components/logo/` | DEPLOY | Brand cube + logo CSS |
| `assets/components/sidebar/` | DEPLOY | Sidebar + menu-overrides |
| `assets/components/topbar/` | DEPLOY | Topbar CSS |
| `assets/vendor/` | DEPLOY | Chart.js + KaTeX (run fetch_vendor_deps.sh) |
| `assets/favicons/` | DEPLOY | Icons |
| `assets/img/` | DEPLOY | Images |
| `config/` | DEPLOY | Scoring config JSON |
| `csp/` | DEPLOY | Nginx/Cloudflare CSP headers |
| `backend/*.cs` (non-reference) | DEPLOY | C# backend — adapt for your stack |

---

### 2. Dashboard demos — DEMO / TEST ONLY
Do not deploy to production. Use for development and client demos only.

| Object | Classification | Notes |
|---|---|---|
| `demo/codivium_insights_demo_*.html` | DEMO | Preset-specific demo pages |
| `demo/demo_data_*.js` | DEMO | Static payload fixtures |
| `demo/payload_example1.json` | DEMO | Example payload shape |
| `join.html` / `login.html` / `mcq-parent.html` | DEMO | Nav stubs — replace in production |

---

### 3. Editor / workspace pages — PROTOTYPE (not production-ready)
These pages implement the exercise workspace UI. They are at integration/prototype stage.
See `docs/EDITOR_ARCHITECTURE.md` for architecture details and prototype-to-production gap.

| Object | Classification | Notes |
|---|---|---|
| `editor.html` | DEMO / PROTOTYPE | Exercise workspace entry point |
| `assets/components/editor/editor-page.js` | DEMO / PROTOTYPE | All workspace JS (extracted from inline) |
| `assets/components/editor/editor-page.css` | DEMO / PROTOTYPE | All workspace CSS (extracted from inline) |
| `feedback-demo.html` | DEMO | Feedback modal demo page |

**Current maturity:** UI complete, layout aligned, most interactive features working.  
**Not yet production-ready because:** submit endpoint is stubbed (editor); menu-page.html static cards replaced with demo data; menu API not implemented;, feedback.js not loaded,
no session ID, no test results DOM, inline JS/CSS partially extracted, no CSP strategy finalised.  
See `docs/EDITOR_ARCHITECTURE.md` §"Prototype-to-production gap" for the full list.

---

---

### 3b. MCQ Pages — PROTOTYPE (not production-ready)

| Object | Classification | Notes |
|---|---|---|
| `mcq-parent.html` | DEMO / PROTOTYPE | MCQ quiz setup and filter page |
| `mcq-quiz.html` | DEMO / PROTOTYPE | Quiz question, answer, and results page |
| `assets/components/mcq/mcq-parent.js` | DEMO / PROTOTYPE | Setup page JS |
| `assets/components/mcq/mcq-quiz.js` | DEMO / PROTOTYPE | Quiz runtime (includes demo question bank) |
| `assets/components/mcq/mcq-tour.js` | DEMO / PROTOTYPE | Cross-page guided tour |
| `assets/components/mcq/mcq-forms.css` | DEMO / PROTOTYPE | Shared MCQ form styles |
| `assets/components/mcq/mcq-parent.css` | DEMO / PROTOTYPE | Setup page CSS |
| `assets/components/mcq/mcq-quiz.css` | DEMO / PROTOTYPE | Quiz page CSS |
| `assets/components/mcq/mcq-setup-overrides.css` | DEMO / PROTOTYPE | Layout overrides |

**Not production-ready because:** no backend question bank, no category API, no auth, localStorage-only persistence.

---

### 3c. Adaptive Practice Page — PROTOTYPE (not production-ready)

| Object | Classification | Notes |
|---|---|---|
| `adaptive-practice.html` | DEMO / PROTOTYPE | Post-login adaptive guidance page — Phase B |
| `assets/components/adaptive/adaptive-practice.css` | DEMO / PROTOTYPE | Adaptive page styles |
| `assets/components/adaptive/adaptive-practice.js` | DEMO / PROTOTYPE | Rendering logic + fixture data |
| `docs/ADAPTIVE_PRACTICE_VOCABULARY.md` | DOCS | Complete design spec: templates, thresholds, copy |
| `demo/adaptive_new_user.html` | DEMO | Orientation mode demo |
| `demo/adaptive_returning_user.html` | DEMO | Re-entry recommendation demo |

**Not production-ready because:** page uses hardcoded fixture data instead of `GET /api/user/adaptive-state`;
only `weakness_spotlight` templates are in code (all 9 types documented in vocabulary doc);
auth (R1) not confirmed; `selectedRecommendationType` recording not wired.

### 4. Site-level route stubs — LOCAL DEV ONLY
These stubs exist solely to pass `link_check.js` during local development.
They are **not** part of the deployable package — the real pages are served by the application server.

| Object | Notes |
|---|---|
| `landing.html` | Stub → application root `/` |
| `articles.html` | Stub → `/articles` |
| `pricing.html` | Stub → `/pricing` |
| `contact.html` | Stub → `/contact` |
| `faq.html` | Stub → `/faq` |

---

### 5. Backend reference files — REFERENCE (adapt before use)
C# source code that must be adapted for your stack. Do not deploy verbatim.

| Object | Classification |
|---|---|
| `backend/api/` | REFERENCE — replace DemoRawDataProvider with DB-backed provider |
| `backend/tests/` | SCRIPTS — C# unit tests |
| `backend/McqPayloadCallExample.v1.cs` | REFERENCE — usage example |

---

### 6. Legacy files — DO NOT USE
Retired/superseded. Kept for historical reference only.

| Object | Notes |
|---|---|
| `backend/CodiviumPoints.v1.cs` | Tombstone — superseded by CodiviumKatexScoring.v1.cs |

---

### 7. Backup files — DO NOT USE
Point-in-time snapshot copies. Not authoritative.

| Object | Notes |
|---|---|

---

### 8. Scripts / tooling — NOT DEPLOYED
Developer tooling. Run locally or in CI. Not part of any deployment.

| Object | Purpose |
|---|---|
| `scripts/run_checks.sh` | Full check suite gate |
| `scripts/security_gates.sh` | CSP/inline check |
| `scripts/link_check.js` | Broken link detection |
| `scripts/smoke_test.js` | Integration smoke test |
| `scripts/validate_payload_contract.js` | Payload schema validation |
| `scripts/generate_manifest.js` | Manifest generation |
| `scripts/fetch_vendor_deps.sh` | Vendor dependency download |
| `scripts/build_dashboard_bundle.sh` | Dashboard JS bundle build |
| `tests/` | JS unit test suite |
| `package.json` | npm scripts |

---

### 9. Documentation — NOT DEPLOYED

| Object | Purpose |
|---|---|
| `../../../docs/package/getting-started/HANDOVER.md` | Combined handover reference |
| `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` | Full classification with rationale |
| `../../../docs/package/operations/DEPLOYMENT_GUIDE.md` | Deployment steps |
| `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md` | This file — package inventory |
| `contracts/` | API and payload contracts |
| `docs/` | Architecture, field mappings, JS API |
| `csp/README.md` | CSP deployment guidance |
| `README.txt` | Package overview |
| `../../../docs/package/history/CHANGELOG.md` / `../../../docs/package/history/RELEASE_NOTES.md` | Version history |

---

## Quick classification lookup

**"Should I deploy this file?"**
→ Check `../../../docs/package/reference/DEPLOY_WHITELIST.txt` or `deployment-manifest.json` → `deploy` array.

**"What is this file for?"**
→ Check `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` for rationale, or this file for the summary.

**"Is the editor page production-ready?"**
→ No. See `docs/EDITOR_ARCHITECTURE.md` §"Prototype-to-production gap".

**"Which dashboard page do I integrate?"**
→ `codivium_insights_embedded.html` only.

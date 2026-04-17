## 1.0.20
- Summary View: collapsed main pane is now hard-stabilized (inline !important overrides) so it cannot reserve vertical space and mask the info pane.
- Summary View: summary rendering uses a direct structured render fallback to avoid blank panes when refresh short-circuits.
- Summary View: shifted the layout preset dock an additional 1px to the right in info-only mode.

## Version 1.1.0 — 2026-03-16

### New
- Editor / workspace page (`editor.html`) added to package
- `assets/components/editor/editor-page.js` — full workspace JS runtime (17 modules)
- `assets/components/editor/editor-page.css` — full workspace CSS (6 modules)
- `assets/components/editor/editor-page.js` — live workspace runtime (UI, load, and submit)
- Split JS modules: 11 `editor-page.*.js` files (source for future modularisation)
- Split CSS modules: 6 `editor-page.*.css` files
- `assets/components/editor/editor-page.state-model.js` — state layer documentation
- Site-level route stubs: `landing.html`, `articles.html`, `pricing.html`, `contact.html`, `faq.html`
- `feedback-demo.html` — feedback modal demonstration page

### Security
- All inline `<script>` blocks extracted from `editor.html` to `editor-page.js`
- Inline `<style>` block extracted from `editor.html` to `editor-page.css`
- Zero inline `style=` attributes in any HTML file (security gate verified)
- `renderMd()` fallback changed from no-op to tag-stripping (prevents raw HTML injection)
- `buildInstructions()` style= in generated HTML replaced with CSS classes

### Accessibility (Phase 7)
- `#cvd-unsupported-screen`: graceful notice for viewports below 1024px
- `@media (prefers-reduced-motion: reduce)`: all transitions suppressed
- 18 `:focus-visible` rules: tabs, buttons, splitters, lock tooltip, tour
- Tour card: `role="dialog"`, `aria-modal="true"`, focus trap, focus management
- `aria-busy` on submit button during pending state
- `role="status"` + `aria-live="polite"` on editorStatus

### Architecture
- Phase 2: `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md`, `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` updated for combined package
- Phase 3: JS and CSS modularised into split files with ownership headers
- Phase 4: Real submit flow (POST /api/exercise/submit), validation, analytics (7 events)
- Phase 5: CSP guidance doc, verify_sri.sh, fetch_vendor_deps.sh updated
- Phase 7: Design system doc, a11y checklist, desktop-first policy documented

### Docs added
- `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md`, `../../../docs/package/reference/EDIT_GUIDANCE.md`, `../../../docs/package/policies/GOVERNANCE.md`, `../../../docs/package/operations/KNOWN_LIMITATIONS.md`
- `docs/EDITOR_ARCHITECTURE.md`, `docs/EDITOR_DESIGN_SYSTEM.md`
- `docs/EDITOR_A11Y_CHECKLIST.md`, `docs/EDITOR_CSP_GUIDE.md`
- `docs/REGRESSION_RISK_AUDIT.md`
- `docs/adr/` — 6 ADRs (ADR-001 through ADR-006)
- `contracts/exercise-workspace-api.contract.md`

### Package checks
- `scripts/editor_smoke_test.js` — 15-check dedicated editor smoke test
- `scripts/verify_sri.sh` — SRI hash generation for editor CDN assets
- `scripts/run_checks.sh` — updated to include editor smoke test

### Known limitations
- Editor submit is wired but backend not implemented (E1)
- SRI hashes pending on 4 CDN assets — run `verify_sri.sh` at deploy (E3)
- `editor.html` remains `demo_test_only` in deployment-manifest.json

## Post-v1.1.0 MCQ development (unreleased)

### New pages added
- `mcq-parent.html` — MCQ quiz setup page (category filters, difficulty, question count, guided tour)
- `mcq-quiz.html` — Quiz question page (6-option 2×3 grid, multi-select, code rendering, peek/reveal, segmented progress bar, timer)

### Features
- Multi-select answer support with correctIndices array schema
- Code-aware content renderer (fenced code blocks + inline code in questions/options/explanations)
- Nano-tutorial side panel per question (optional; shown only when question has content)
- View Answer (peek) flow with performance-statistics warning and amber Next button
- Cross-page tour: mcq-parent → mcq-quiz with sessionStorage handoff
- Segmented progress bar with per-question colour coding (correct/wrong/peeked)
- Analog + digital session timer matching editor page
- Results page with full per-question review, correct-answer highlighting, and explanations
- Demo bank: 12 questions, 6 options each, 4 categories, 3 difficulty levels, 8 with nano-tutorials

### Security
- All MCQ pages: no inline scripts, no inline styles, no on* handlers (security gate verified)
- `mcq_smoke_test.js` added: 18 structural checks across both pages

### Docs
- `deployment-manifest.json`: MCQ pages classified as demo_test_only
- `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md`: MCQ section added
- `../../../docs/package/getting-started/HANDOVER.md`: MCQ pages section added; stub label corrected
- `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md`: MCQ section added
- `../../../docs/package/operations/KNOWN_LIMITATIONS.md`: MCQ limitations section added (MCQ1–MCQ5)

### Known limitations
- No backend question bank (MCQ1) — demo data hardcoded
- No category API (MCQ2) — hardcoded list
- localStorage-only score persistence (MCQ3)
- No auth integration (MCQ4)




## 1.0.19
- Summary View: fixed missing summary text by rendering into the proven interpretation container in info-only mode.
- Summary View: shifted the layout preset dock an additional 1px to the right in info-only mode.

## 1.0.18
- Summary View: ensured summary text renders reliably even when localStorage access is blocked (render target chosen via the mount mode class).
- Summary View: shifted the layout preset dock an additional ~0.5mm to the right in info-only mode.
- Summary View: keeps the Info pane starting immediately under the header (no vertical masking).

## 1.0.16
- Layout preset dock: fixed horizontal drift between Full and Summary modes (dock stays locked to the same header geometry).
- Summary View: main dashboard window collapses to header-only (no empty panel); Info pane remains visible; Tour is disabled/hidden.
- Desktop layouts: Info pane height nudged slightly to align bottom edges.
- Sidebar: restored bordered silhouette for side menu buttons (subtle rounding + border).

# Release Notes

## 1.0.15
- Summary View: removed the empty "main panel" wrapper by using `display: contents` so the header and Info pane read as one window.
- Summary View: visually merged the header bar with the Info pane (shared border seam) to avoid a blank window above the summary.
- Desktop layouts: aligned Info pane height to the main dashboard form so they stay equal-height when both are visible.
- Sidebar: restored the original rounded silhouette for side menu buttons (subtle corner radius).

## 1.0.14
- Summary View (info-only) reliably shows the info pane while keeping the header fixed.
- Layout preset buttons reordered so **Full Dashboard** is on the far left.
- Pressed state improved with stronger curvature and a clearer raised border rim.

## 1.0.13
- Summary View now keeps the dashboard header visible (title + FAQ/Glossary links + layout toggles).
- Layout preset toggle dock no longer moves into the info pane; it stays pinned in the header.
- Layout preset buttons updated: sharp corners, flush edges, and a deeper pressed active state.
- Layout preset icons corrected so each preset shows a distinct layout.


## 1.0.12
- Fixed demo presets so each preset page loads a preset-specific payload (meta.ui.mode/panels) and shows data reliably.
- Removed demo_preset_apply.js and legacy demo_data_example1.js from /demo; added demo_data_<preset>.js files.
## 1.0.9
This release adds backend-driven Focus rankings + CTAs, a reference API surface, and a starter C# test suite. (1.0.8)


- Added backend reference **v2 payload adapter** (raw → dashboard-payload-v2) including per-track micro/interview blocks.
- Implemented backend reference **Points (all + 30d)** and **Efficiency (pts/hr)** metrics.
- Added contract validation in checks/CI: demo payload fixtures are validated against the shipped v2 schema.

---

## 1.0.10
- Demo folder cleanup: removed Example 2/3 dashboards and their payload fixtures.
- Added one dashboard demo HTML per **panel preset** (Summary → Scores-only → Heatmap focus → Coding core → Full).
- Demo presets are driven by a single non-inline script (`demo/demo_preset_apply.js`) that writes UI prefs to localStorage.

---


## Changes in 1.0.8
- Backend reference: `CodiviumDashboardPayloadV2Adapter.BuildFromRaw(...)` composes v37 calculators into the canonical v2 payload shape.
- Backend reference: `CodiviumPoints.ComputeCodingPoints(...)` adds Points + Efficiency KPI support.
- Checks: `scripts/run_checks.sh` now runs `scripts/validate_payload_contract.js`.

## Changes in 1.0.7
- Added backend reference components for UI prefs persistence (G06), correctness foundations (G07), and DB→Raw builder (G08).
- Updated v37/v38 reference code to reduce silent data loss risks due to track-id canonicalization mismatches and to support deterministic time calculations via an injected clock.

## Changes in 1.0.6
- Added desktop-first **dynamic grid layout** so hidden panels do not leave empty holes.
- Implemented **Summary View** (`meta.ui.mode = "info_only"`) that hides all charts and shows only the Info pane (full-width).
- Added **auto-switch to Summary View** for narrow screens (default threshold: 900px) with a subtle banner.
- Added **Info pane tab navigator** (Overview/Scores/Heatmap/Depth/Time/Allocation/MCQ) for summary click-through.
- Updated tour logic to **skip hidden panels** and disable tour in Summary View.
- Added a client-side **Dashboard View Settings** page (`dashboard_view_settings.html`) that writes UI prefs to localStorage.

## Changes in 1.0.5
- Added dashboard UI preferences loader: reads `payload.meta.ui` and falls back to client-side prefs stored at `localStorage["cv.dashboard.ui"]`.
- Implemented panel visibility toggles (per panel + empty column wrappers).
- Exposed `CodiviumInsights.getUiPrefs()` / `CodiviumInsights.setUiPrefs()` for future Settings page integration.



## Changes in 1.0.4
- Desktop-first responsive stabilization: canonical breakpoints and clamp-based chart heights to prevent clipping in laptop / split-screen layouts.
- Added dashboard-payload-v2 contract + JSON Schema (including optional meta.ui.mode and meta.ui.panels for panel visibility and Summary View).

## Changes in 1.0.1
- Reduced visible multi-refresh on initial page load (exercise time-by-category chart no longer rebuilds during follow-up refresh passes).
- Brand cube hover animation restart reliability improved.
- FAQ: added “Getting started” section with deliberate-practice guidance.
- CTA buttons now use sharp corners.
- Time-on-platform chart label spacing improvements.

This package is intended to be deployed as part of a cloud-hosted website. The dashboard is a single page that loads shared assets and renders metrics from either:
- data injected by your application (recommended), or
- demo payloads (for development preview only).

## Quick start
- Open `codivium_insights_embedded.html` to view the embedded dashboard shell.
- For demos: open `demo/codivium_insights_demo_full.html`.

## Production recommendations
- Self-host third-party vendor libraries under `assets/vendor/`:
  - Chart.js: `assets/vendor/chartjs/chart.umd.min.js`
  - KaTeX: `assets/vendor/katex/...`
  Use `scripts/fetch_vendor_deps.sh` as a starting point.
- Enforce strict CSP (see `../../../docs/package/security/SECURITY_HARDENING.md` + `csp/` templates).
- Use long-cache headers for versioned assets (recommended: fingerprinted assets in your build pipeline).

## Verification
Run:
- `./scripts/run_checks.sh`

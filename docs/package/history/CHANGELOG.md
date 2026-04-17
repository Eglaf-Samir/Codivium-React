## [post-1.1.0] — MCQ pages (unreleased)

### Added
- `mcq-parent.html` — quiz setup page (category filters, difficulty, question count, guided tour)
- `mcq-quiz.html` — quiz question page (6-option grid, multi-select, code rendering, peek/reveal, timer, results review)
- `assets/components/mcq/mcq-quiz.js` — quiz runtime with demo question bank (12 questions)
- `assets/components/mcq/mcq-tour.js` — cross-page guided tour
- `scripts/mcq_smoke_test.js` — 18-check structural smoke test

### Docs
- MCQ classified in `deployment-manifest.json`, `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md`, `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md`
- `../../../docs/package/operations/KNOWN_LIMITATIONS.md`: MCQ1–MCQ5 added
- `../../../docs/package/history/RELEASE_NOTES.md`: MCQ section added

---
# 1.0.20
- Summary View: hard-stabilized the collapsed main pane (inline !important overrides) so it never reserves vertical space and cannot "mask" the info pane.
- Summary View: ensured summary content renders even when refresh paths short-circuit (direct structured render fallback).
- Summary View: nudged the layout preset dock an additional 1px to the right in info-only mode.

# 1.0.19
- Summary View: fixed missing summary text by rendering into the proven interpretation container (and keeping that container visible in info-only mode).
- Summary View: nudged the layout preset dock an additional 1px to the right in info-only mode.

# 1.0.18
- Summary View: ensured summary text renders reliably even if localStorage access is blocked (render target chosen via the mount mode class).
- Summary View: nudged the layout preset dock an additional ~0.5mm to the right in info-only mode.
- Summary View: ensured the Info pane starts immediately under the header (removes the vertical "masking" effect).

# Changelog
## 1.0.22 — KaTeX Step 3.1 (Demo + Payload Audit)
- Demo payload metrics updated to match KaTeX composition rules (overall breadth weights + mastery harmonic mean).
- Demo fixtures regenerated from a single canonical payload (payload_example1.json) for consistency.
- Added meta.anchorDate to demo payload.
- Strengthened scripts/validate_payload_contract.js with a dashboard renderability audit (required KPI keys + core panel blocks).

## 1.0.21 — KaTeX Step 1A (Raw Contract Strictness)
- Enforced presence of MCQ U_all (UniqueCorrectMcqAllTime (legacy: mcqDistinctCorrectAllTime)) via sentinel validation.
- Made recency timestamps strict in KaTeX scorer (no StartedAt/asOf fallback).
- Fixed time-on-platform adapter nullability + MinutesSpent conversion.
- Published raw data contract + schema (contracts/raw-data-v1.*).

## 1.0.16 - 2026-03-04

### Fixed
- Layout preset dock: prevented horizontal drift between Full and Summary modes by keeping the header container geometry stable.
- Summary View: collapsed the main dashboard window to header-only (no blank panel), while keeping the Info pane visible and the Tour button disabled.
- Desktop layouts: nudged Info pane height to eliminate small bottom-edge mismatch vs the main panel.
- Sidebar menu buttons: restored bordered silhouette (border + subtle rounding) to match the original demo look.

## 1.0.15 - 2026-03-04

### Fixed
- Summary View: removed the empty main "window" wrapper so only the header bar and the Info pane remain visible.
- Summary View: merged header bar styling with the Info pane to eliminate the blank panel look.
- Desktop layouts: Info pane height now matches the main dashboard form when both are visible.

### Changed
- Sidebar menu buttons: restored a subtly rounded silhouette (corner radius) to match the original uploaded demo look.

## 1.0.14 - 2026-03-04

### Fixed
- Summary View (info-only preset) now reliably shows the info pane (and keeps the dashboard header stable).
- Prevented horizontal "jump" when switching into Summary View by keeping the insights layout flex geometry stable.

### Changed
- Layout preset buttons reordered so **Full Dashboard** is on the far left.
- Layout preset button visuals: stronger pressed curvature and a clearer raised border rim.

## 1.0.13 - 2026-03-04

### Fixed
- Layout preset toggle dock now remains in the dashboard header for Summary View (info-only) and no longer moves into the info pane.
- Summary View no longer hides the dashboard header, so the title and FAQ/Glossary links remain visible.

### Changed
- Layout preset button styling: sharp corners, flush edges (no gaps), and a deeper pressed/depressed active state.
- Layout preset icons updated to reflect distinct layouts (Summary info-pane-only icon, Heatmap top-half icon, Coding-core two-column icon).

## 1.0.10 - 2026-03-03


## 1.0.12
- Fixed demo presets so each preset page loads a preset-specific payload (meta.ui.mode/panels) and shows data reliably.
- Removed demo_preset_apply.js and legacy demo_data_example1.js from /demo; added demo_data_<preset>.js files.
### Changed
- Demo folder: replaced the three Example dashboards with a single set of **panel preset** dashboards (Summary → Full), each as its own HTML file.
- Checks: `scripts/smoke_test.js` and `scripts/validate_payload_contract.js` now discover demo fixtures dynamically (no hard-coded example2/3 paths).

## 1.0.8 - 2026-03-03

### Added
- Backend reference: v2 payload adapter from raw data (`backend/CodiviumDashboardPayloadV2Adapter.v1.cs`).
- Backend reference: Points + Efficiency calculator (`backend/CodiviumPoints.v1.cs`).
- CI/Checks: contract validation step for demo payload fixtures (`scripts/validate_payload_contract.js`).

### Changed
- v37 heatmap + allocation: aligned coding-only aggregators to the coding universe (micro+interview) to avoid MCQ-only categories leaking into coding charts.
- `scripts/run_checks.sh`: now validates demo payloads against the shipped v2 schema.

## 1.0.7 - 2026-03-03

### Added
- Backend reference: UI prefs store and payload meta.ui DTO (`backend/CodiviumDashboardUiPrefs.v1.cs`).
- Backend reference: determinism clock abstraction (`backend/CodiviumClock.v1.cs`).
- Backend reference: config validation helper (`backend/CodiviumConfigValidation.v1.cs`).
- Backend reference: DB→Raw builder skeleton with timestamps and difficulty mapping (`backend/CodiviumRawDataBuilder.v1.cs`).

### Changed
- v37 calculators: canonicalize track-keyed dictionaries once per build to avoid silent drops when keys are non-canonical.
- v37 time-on-platform: accepts injected clock; no direct DateTime.UtcNow usage in calculations.
- v38 payload DTO: meta now optionally includes Ui prefs and Build(...) accepts uiPrefs.



## 1.0.6
- Dynamic grid layout (desktop-first): hidden panels no longer leave empty holes.
- Summary View (info-only mode): hides charts and shows only the Info pane (full-width).
- Auto-switch to Summary View on narrow screens (default threshold 900px) with a subtle banner.
- Info pane tab navigator for summary click-through (Overview/Scores/Heatmap/Depth/Time/Allocation/MCQ).
- Tour: skips hidden panels; disabled in Summary View.
- Added Dashboard View Settings page (client-side, localStorage-based).

## 1.0.5
- Added dashboard UI prefs loader (payload.meta.ui + localStorage fallback) and panel visibility toggles (hide/show panels and empty column wrappers).
- Exposed CodiviumInsights.getUiPrefs() and CodiviumInsights.setUiPrefs() for future Settings-page integration.
- Updated V2 contract doc with localStorage fallback notes.

## 1.0.4
- Desktop-first responsive stabilization: canonical breakpoints (3-col / 2-col / stacked), clamp-based chart sizing, and responsive tick density to prevent clipped axes.
- Added dashboard-payload-v2 contract documentation and JSON Schema (including optional meta.ui.mode and meta.ui.panels).

## 1.0.0
- Production hardening: strict-CSP compatible embedding (no inline handlers/scripts/styles).
- Local-first dependency loading (Chart.js + KaTeX) with optional CDN fallback for demos/dev.
- CSS cascade layers for predictable overrides; reduced masking risk.
- Dashboard JS bundled into a single module-scope file to avoid global collisions.
- Performance controls: reduced-motion support + low-effects mode.
- Accessibility improvements: skip link, focus-visible enhancements, modal focus trap, contrast hooks.
- Release tooling: smoke tests, security gates, link check, manifest generator, CI workflow templates.
- Documentation pack: deployment, security hardening, browser support, threat model, ops readiness.

## 1.0.1
- Exercise time-by-category chart now avoids visible multi-pass redraws on page refresh (refresh only when the mount size actually changes).
- Brand cube hover animation now reliably restarts on every hover.
- FAQ: added a new “Getting started” section (dashboard purpose, how to use it, and how to use Codivium without it), with deliberate-practice framing.
- CTA buttons now have sharp corners.
- Time-on-platform line chart: compact y-axis label (“Minutes”), improved x-axis label visibility.

## 1.0.2
- Time-on-platform line chart: restored x-axis tick labels and raised them within the canvas to prevent clipping.
- Resilience refresh: removed non-bfcache `pageshow` hard refresh and added a short boot “settle window” to prevent quick chart flicker on page refresh.
- Brand cube: switched to fully CSS-driven hover/return behavior matching the reference cube (deterministic axis-by-axis rotation, exact rest pose).

## 1.0.3
- Brand cube hover: rotation now switches axes every ~500ms (including combined axes), with randomised axis ordering and ~40% slower rotation speed.
- Brand cube mouseleave: now decelerates smoothly while continuing to rotate, and stops only when landing exactly on the original rest orientation.
- Resilience refresh: delayed arming of focus/resize/observer triggers to eliminate the remaining “mini refresh” flicker on initial page load.

## [1.1.0] — 2026-03-16
### Added
- Editor/workspace page and all associated assets (Phase 2–7 remediation)
- Package governance docs: ../../../docs/package/policies/GOVERNANCE.md, ../../../docs/package/operations/KNOWN_LIMITATIONS.md, ../../../docs/package/reference/EDIT_GUIDANCE.md
- 6 ADRs in docs/adr/
- Editor smoke test (scripts/editor_smoke_test.js)
- verify_sri.sh for SRI hash generation
### Changed
- ../../../docs/package/getting-started/HANDOVER.md, ../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md, deployment-manifest.json updated for combined package
- editor-page.js: real submit flow, session ID, analytics (replaces stub toast)
- editor-page.css: +prefers-reduced-motion, +focus-visible, +unsupported viewport
### Security
- All inline scripts/styles extracted from editor.html
- renderMd() fallback: no-op → tag-stripping
- buildInstructions(): style= attrs replaced with CSS classes


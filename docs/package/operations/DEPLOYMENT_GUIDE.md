# Deployment Guide

**Last updated:** 2026-03-13  
**Pass:** CVU-2026-03-AH

---

## Overview

## Developer verification workflow

```bash
# Full verification (build + tests + security + smoke + links)
npm run verify
# or: bash scripts/run_checks.sh

# Individual commands
npm run build      # rebuild dashboard.bundle.js
npm test           # 49 JS unit tests
npm run smoke      # file presence, API surface, CSP guard
npm run security   # security gates (no inline handlers)
npm run validate   # payload contract validation
npm run vendor     # fetch Chart.js + KaTeX (required before deploy)
```

All checks must pass before deployment.



The Codivium Performance Insights Dashboard is a self-contained frontend widget backed by an ASP.NET Core API. This document covers production deployment from end to end.

---

## Project structure (what to deploy)

```
assets/
  components/dashboard/
    js/
      dashboard.bundle.js        ← deploy this (built artifact)
      dashboard.00.config.js     ← source (do not deploy)
      dashboard.00.core.js       ← source (do not deploy)
      dashboard.06b.refresh.js ← source (CodiviumInsights public API)
      ... (other dashboard.0X.*.js sources)
    ← CSS: 8 split files (NOT dashboard.css — that file is orphaned/legacy)
    dashboard.base.css           ← dashboard tokens + typography
    dashboard.shell.css          ← stage, insights-layout
    dashboard.resizers.css       ← splitter visuals
    dashboard.layout.css         ← grid geometry, mode visibility
    dashboard.panels.css         ← panel internals, chart controls
    dashboard.chrome.css         ← preset dock, toolbar buttons
    dashboard.modals.css         ← modals
    dashboard.math.css           ← KaTeX styling
    dashboard_settings.css       ← settings page only (not main dashboard)
    (dashboard.css removed — superseded by 8 split CSS files)

codivium_insights_embedded.html  ← production integration entry point
dashboard_view_settings.html     ← settings page (reads/writes localStorage)
```

**Key rule:** deploy `dashboard.bundle.js`, not the numbered source files. Never hand-edit the bundle.

---

## Building the JS bundle

```bash
cd <project root>
bash scripts/build_dashboard_bundle.sh
```

The script concatenates the numbered sources and validates syntax. When [esbuild](https://esbuild.github.io/) is installed, it also generates source maps and runs stricter validation.

### Install esbuild (recommended)

```bash
npm install --save-dev esbuild
```

Once installed, `build_dashboard_bundle.sh` automatically detects and uses it. Output path (`dashboard.bundle.js`) does not change. Source map is written alongside as `dashboard.bundle.js.map`.

### Without esbuild

The script falls back to plain concatenation plus `node --check` — same as the original build behaviour. Fully functional; just no source map.

---

## Backend API

The reference implementation is in `backend/api/`. It is an ASP.NET Core minimal API.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/payload` | Returns a `dashboard-payload-v2` JSON payload |
| `POST` | `/api/sessions/start` | Creates a practice session from a dashboard CTA click |
| `POST` | `/api/dashboard/ui-prefs` | Persists UI preferences (mode + panel visibility) |

### `GET /api/dashboard/payload`

Query parameters:

| Parameter | Format | Default | Description |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | 120 days before `to` | Window start (UTC) |
| `to` | `YYYY-MM-DD` | today | Window end (UTC) |
| `granularity` | `day` | `day` | Time series granularity (`day` only in current reference) |

Response: `application/json` — `DashboardPayloadV2` shape (version field: `"dashboard-payload-v2"`).

Caching: responses are cached in-process per user × date range. Cache key: `dash:v2:{userId}:{from}:{to}:{granularity}`.

### `POST /api/sessions/start`

Called by dashboard CTAs. Request body:

```json
{
  "actionId": "cta_depth_deepen",
  "panelId": "depth",
  "track": "micro",
  "category": "Tries",
  "difficulty": null,
  "params": { ... },
  "source": "dashboard"
}
```

Full contract: `docs/CTA_ACTIONS_AND_SESSIONS.md`.

### `POST /api/dashboard/ui-prefs`

Persists the user's panel layout preferences. Shape: `{ mode, panels, selectedTrack }`. All three fields are server-persisted. See `contracts/dashboard-ui-prefs-v1.contract.md` and `../../../docs/package/getting-started/HANDOVER.md → UI prefs model`.

---

## Integrating into your app shell

### Option A — iframe (recommended for isolation)

```html
<iframe
  src="/codivium_insights_embedded.html"
  style="width:100%; border:none; height:900px;"
  allow="scripts"
></iframe>
```

Restrict with CSP `frame-ancestors 'self'` in your shell headers.

### Option B — direct embed

Copy the `<link>` and `<script>` tags from `codivium_insights_embedded.html` into your app shell. Ensure your global CSS does not collide with `.cv-*` selectors.

### Passing data from your backend

The dashboard does **not** self-fetch the payload. You must push data to it using one of two methods:

**Option 1 — Pre-load before boot (server-side rendering):**
```html
<script>
  window.__CODIVIUM_DASHBOARD_DATA__ = { /* your payload object */ };
</script>
<script src="assets/components/core/polyfill-loader.js"></script>
```

**Option 2 — Push after boot (SPA/async):**
```js
const payload = await fetch('/api/dashboard/payload').then(r => r.json());
window.CodiviumInsights.update(payload);
```

See `docs/JAVASCRIPT_API.md` for the full public API surface.

---

## Serving assets

### Asset paths

All runtime assets are referenced relative to the HTML entry point. No rewriting is needed if assets are served from the same origin under the same subpath.

### Caching headers

```
Cache-Control: public, max-age=31536000, immutable
```

Apply to `dashboard.bundle.js`, all `.css` files, and other versioned static assets. Use short caching (`no-cache` or short max-age) for HTML entry points.

Prefer content-hashed filenames (`dashboard.bundle.abc123.js`) over long-lived headers for zero-downtime deploys.

### Compression

Enable gzip/brotli for all text assets. The reference API (`Program.cs`) includes `ResponseCompression` middleware for the JSON payload.

---

## Security headers

See `csp/` for ready-to-use CSP templates (nginx, Cloudflare). Key directives:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  frame-ancestors 'self';
```

If embedding in an iframe: set `frame-ancestors` to the parent origin, not `'self'`.

---

## Database integration

The reference implementation uses `DemoRawDataProvider` (returns empty data). Replace it with a real `IRawDataProvider` that queries your database.

The canonical input model is `CodiviumScoring.CodiviumRawData`. See `backend/CodiviumRawDataBuilder.v1.cs` and `docs/DB_TO_RAW_DATA_MAPPING.md` for the DB → raw mapping.

Key requirements:
- `CompletedAtUtc` is required on accepted coding sessions (used for recency decay and date filtering).
- `ExerciseId` is required for points calculations.
- `UniqueCorrectMcqAllTime` is required for MCQ points.
- Difficulty values should be `basic` / `intermediate` / `advanced`; numeric `1`/`2`/`3` are normalized automatically.

---

## Scoring engine

The package uses **two complementary backend files** with a deliberate split of responsibilities:

| File | Status | Provides |
|---|---|---|
| `backend/CodiviumScoringEngine.cs` | **COMPILED — active scoring engine** | `CodiviumScoring`, `CodiviumRawData`, `CodiviumCatalog`, `CodiviumAllocation`, `ComputeScoreBundle()` |
| `backend/CodiviumDashboardBackend_AllInOne_v38.cs` | **COMPILED — DTO definitions** | `DashboardPayloadV2`, all payload DTO classes (`MetricsDto`, `ConvergenceHeatmapDto`, etc.) |

Despite the `CodiviumScoringEngine` filename, this file **is not excluded from compilation** — the `.csproj` only excludes `api/` and `tests/`. The file header confirms it is the active scoring engine. The "legacy" label means it should not receive new feature additions; new scoring logic goes in `CodiviumKatexScoring.v1.cs`.

The live call chain:

```
Program.cs
  → DashboardPayloadV2Adapter.BuildFromRaw()
      → CodiviumScoring.ComputeScoreBundle()      (CodiviumScoringEngine — scoring engine)
          → CodiviumKatexScoring.ComputeAll()     (KaTeX evidence, breadth, depth, points)
      → CodiviumHeatmapFocusBuilder.BuildFocus()
      → CodiviumInsights.BuildAll()
      → CodiviumRecommendedActions.BuildFromKatex()
```

---

## Running tests

```bash
# JS tests (49 passing)
node --test tests/dashboard.test.js

# Backend C# tests
cd backend
dotnet test tests/
```

---

## Regression checklist (after every bundle build)

- [ ] `node --check assets/components/dashboard/js/dashboard.bundle.js`
- [ ] Dock created once: `grep -c '__cvEnsureLayoutPresetDock' dashboard.bundle.js` → 1
- [ ] CTA params not spread: body contains `params: params,` not `Object.assign({}`
- [ ] `window.CodiviumInsights.toggleInfoPane` exists in bundle
- [ ] `__selectedCodingTrack` declared in bundle
- [ ] `setupHeatmapControls` present in bundle
- [ ] Resize splitters live: `grep "__cvInitSplitters" assets/components/dashboard/js/dashboard.bundle.js` → present
- [ ] `<title>Codivium Performance Insights Dashboard</title>` in `codivium_insights_embedded.html`
- [ ] No `dashboard.bundle.js` at project root (authoritative copy is `assets/components/dashboard/js/dashboard.bundle.js`)
- [ ] `assets/components/dashboard/dashboard.css` does not exist (it was retired to `legacy/`)

---

## Known deferred items

These are intentionally not implemented:

| Feature | Status |
|---|---|
| Panel resizer drag handles | **LIVE** — fully implemented in `dashboard.00.core.js` → `__cvInitSplitters` |
| Server-side selectedTrack persistence | ✅ **Implemented** — `DashboardUiPrefs.SelectedTrack` persisted via `POST /api/dashboard/ui-prefs`; flows through adapter to `meta.ui.selectedTrack` in payload |
| `allowedModes` enforcement | ✅ **Implemented** — `DashboardMeta.AllowedModes` field exists in v38; frontend enforces it; tested in T21 |

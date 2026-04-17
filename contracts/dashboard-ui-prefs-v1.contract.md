# Codivium Dashboard UI Preferences Contract — v1

This document describes the shape, defaults, persistence model, and API for dashboard UI preferences.

**Last updated:** 2026-03-13 (CVU-2026-03-AD)

---

## Purpose

UI prefs control which panels are shown and which layout mode is active. They are:
- stored per-user on the backend (via `POST /api/dashboard/ui-prefs`)
- optionally embedded in the payload at `meta.ui`
- mirrored to `localStorage` on the client under key `cv.dashboard.ui`
- settable programmatically via `window.CodiviumInsights.setUiPrefs({mode, panels})`
- editable by the user via `dashboard_view_settings.html`

---

## Shape (camelCase JSON)

```json
{
  "mode": "full",
  "panels": {
    "scores":     true,
    "depth":      true,
    "heatmap":    true,
    "time":       true,
    "allocation": true,
    "mcq":        true,
    "infoPane":   true
  },
  "selectedTrack": "combined"
}
```

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `mode` | `"full"` \| `"info_only"` | Yes | `"full"` | `"full"` = multi-panel dashboard; `"info_only"` = summary/info pane only |
| `panels` | object | Yes | all `true` | Keys must be the exact strings shown above |
| `panels.scores` | boolean | No | `true` | Scores panel |
| `panels.depth` | boolean | No | `true` | Depth by category chart |
| `panels.heatmap` | boolean | No | `true` | Convergence heatmap |
| `panels.time` | boolean | No | `true` | Time on platform chart |
| `panels.allocation` | boolean | No | `true` | Allocation by category chart |
| `panels.mcq` | boolean | No | `true` | MCQ performance chart |
| `panels.infoPane` | boolean | No | `true` | Info / detail pane (right side) |
| `selectedTrack` | `"combined"` \| `"micro"` \| `"interview"` | No | `"combined"` | Active coding track filter for depth/allocation/heatmap panels |

---

## Defaults

If no prefs are stored or `meta.ui` is absent from the payload, the dashboard uses:

```json
{ "mode": "full", "panels": { "scores": true, "depth": true, "heatmap": true, "time": true, "allocation": true, "mcq": true, "infoPane": true }, "selectedTrack": "combined" }
```

This shows all panels in full-dashboard mode with the combined track selected.

---

## Persistence model

### Server-side (recommended)
- Endpoint: `POST /api/dashboard/ui-prefs`
- Body: the prefs object (JSON, camelCase)
- Persist per `userId` in your database
- Reference implementation: `backend/CodiviumDashboardUiPrefs.v1.cs` + `backend/api/Program.cs`

### Payload inclusion (recommended)
Include the user's saved prefs at `meta.ui` in the `GET /api/dashboard/payload` response. The frontend applies them on load. This avoids a separate prefs fetch round-trip.

### Client-side mirror
The frontend mirrors the active prefs to `localStorage` under key `cv.dashboard.ui` on every change. On next load, if `meta.ui` is absent from the payload, the client falls back to this localStorage copy.

### Settings page
`dashboard_view_settings.html` (uses `assets/components/dashboard/js/dashboard_settings.js`) reads and writes the same `cv.dashboard.ui` key.

---

## API

### `POST /api/dashboard/ui-prefs`

Request body:
```json
{ "mode": "full", "panels": { "scores": true, "depth": false, ... }, "selectedTrack": "micro" }
```
Response: `200 OK` (no body required, or echo the saved object).

### Frontend JavaScript API

```js
// Read current prefs
const prefs = window.CodiviumInsights.getUiPrefs();
// → { mode, panels, selectedTrack }

// Apply new prefs (also persists to localStorage + calls backend if sessionStartEndpoint set)
window.CodiviumInsights.setUiPrefs({ mode: 'info_only', panels: { ...prefs.panels } });

// Toggle info pane open/closed
window.CodiviumInsights.toggleInfoPane();
```

---

## Layout presets (built-in)

The preset dock lets users switch between these named configurations:

| Preset | mode | panels visible |
|---|---|---|
| `coding_core` | `full` | scores, depth, heatmap, time, allocation |
| `heatmap_focus` | `full` | heatmap only |
| `scores_only` | `full` | scores only |
| `info_only` | `info_only` | (info pane only) |
| `mcq_only` | `full` | mcq only |

These are defined in `dashboard.00.config.js`. They call `setUiPrefs` with the appropriate mode/panels.

---

## What `selectedTrack` controls

`selectedTrack` filters the depth, allocation, and heatmap charts to show data for one coding track:

| Value | Shows |
|---|---|
| `"combined"` | Combined micro + interview data |
| `"micro"` | Micro-challenge data only |
| `"interview"` | Interview-style problem data only |

`selectedTrack` is persisted both server-side (via `POST /api/dashboard/ui-prefs` — the `DashboardUiPrefs.SelectedTrack` field) and client-side (via `localStorage` under key `cv.dashboard.ui`). The backend returns it at `meta.ui.selectedTrack` in the payload, and the frontend restores it on load. Payload value takes precedence over localStorage.

---

## Backend class reference

`CodiviumDashboardUiPrefs` in `backend/CodiviumDashboardUiPrefs.v1.cs`:

```csharp
public sealed class DashboardUiPrefs {
    public string Mode { get; set; } = "full";
    public Dictionary<string, bool> Panels { get; set; } = new();
    public string SelectedTrack { get; set; } = "combined";
    public static DashboardUiPrefs DefaultFull() { ... }
}
```

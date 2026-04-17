# Codivium Dashboard Payload Contract — dashboard-payload-v2

This document defines the **canonical JSON payload** consumed by the Codivium Performance Insights dashboard.

## Goals
- Provide a **stable interface** between backend aggregation and the dashboard UI.
- Prevent silent rendering failures caused by casing mismatches or shape drift.
- Allow forward-compatible expansion (unknown fields should be ignored by the UI).

## Serialization rules (critical)
1) **JSON property naming MUST be camelCase.**
   - Example: `overall.metrics.codiviumScore` (not `Overall.Metrics.CodiviumScore`).
   - Reason: the current dashboard code only supports PascalCase in a few places and is not consistent.

2) Dates:
   - `YYYY-MM-DD` for daily buckets (e.g., `overall.timeOnPlatform.daily[].date`).
   - If you include timestamps, use ISO 8601 with timezone (recommended: `DateTimeOffset` on the backend).

3) Numbers:
   - Prefer raw numeric values (do not pre-format as strings).
   - Avoid early rounding in calculators; round at presentation/serialization if desired.

---

## Root object

Required keys:
- `version`: string (must be `"dashboard-payload-v2"`)
- `meta`: object
- `overall`: object
- `combinedCoding`: object
- `micro`: object
- `interview`: object
- `mcq`: object

Optional keys:
- `_demoName`: string (used only by demo fixtures)

---

## meta

### meta.sessionStartEndpoint (optional)
String URL path used by CTAs (e.g., `"/api/sessions/start"`).

### meta.anchorDate (optional)
A reference date for “as of” / recency framing.

### meta.ui (optional but recommended)
Per-user dashboard UI preferences.

**Frontend fallback / persistence (optional):**
- If `meta.ui` is not present, the dashboard may fall back to client-side preferences stored in `localStorage` under the key `"cv.dashboard.ui"`.
- When `meta.ui` is present, the dashboard may persist it to the same key for continuity across page loads.

```json
{
  "meta": {
    "ui": {
      "mode": "full",
      "panels": {
        "scores": true,
        "depth": true,
        "heatmap": true,
        "time": true,
        "allocation": true,
        "mcq": true,
        "infoPane": true
      }
    }
  }
}
```

#### meta.ui.mode
- `"full"`: normal dashboard grid + optional side info pane.
- `"info_only"`: **Summary View** (shows only the info pane, full-width). This is intended for narrow screens (e.g., phones) without attempting to render charts.

#### meta.ui.panels
Only used when `mode="full"`. Each boolean enables/disables a panel.

Panel IDs:
- `scores`, `depth`, `heatmap`, `time`, `allocation`, `mcq`, `infoPane`

---

## overall

### overall.metrics
Object containing headline KPIs and supporting metrics (numbers).
Common fields include (not exhaustive):
- `codiviumScore`
- `breadthOverall`, `breadthMicro`, `breadthInterview`, `breadthMcq`
- `weightedMcqScore`
- `codiviumPointsAll`, `codiviumPoints30`
- `efficiencyPtsPerHr`
- `depthOverall`, `depthMicro`, `depthInterview`
- `firstTryPassRate`, `avgAttemptsToAC`, `medianTimeToACMinutes`

### overall.timeOnPlatform.daily
Array of daily time buckets:
```json
{ "date": "YYYY-MM-DD", "minutes": 0 }
```

### overall.insights
Structured content used by the info pane.

To support **Summary View** (info-only), provide these keys when possible:
- `overview`
- `panel_scores`
- `panel_heatmap`
- `panel_depth`
- `panel_time`
- `panel_exercise` (allocation)
- `panel_mcq`

Each value can be any structured object your renderer understands (e.g., `{title, bullets, cta}`), but should be deterministic and stable.

### overall.recommendedActions (optional)
Array of CTAs for panels.
Each item should include at least:
- `panelId`: `"scores"|"depth"|"heatmap"|"time"|"allocation"|"mcq"`
- `label`: string
- `actionType`: `"start_session"|"link"`
- plus either `url` (for `link`) or `{track, params}` (for `start_session`).

---

## combinedCoding
This block represents merged coding activity (micro + interview).

### combinedCoding.allocation
Array:
```json
{ "category": "Arrays", "minutes": 0, "solved": 0 }
```

### combinedCoding.depthByCategory + combinedCoding.depthAvg (IMPORTANT SHAPE)
The current dashboard expects **flat fields**:
- `combinedCoding.depthByCategory` (array or map)
- `combinedCoding.depthAvg` (number)

✅ Correct (flat):
```json
{
  "combinedCoding": {
    "depthByCategory": [ {"category":"Arrays","depth": 71} ],
    "depthAvg": 54
  }
}
```

❌ Not supported by current UI without frontend changes:
```json
{ "combinedCoding": { "depth": { "depthByCategory": [...], "depthAvg": 54 } } }
```

### combinedCoding.convergenceHeatmap
```json
{
  "categories": ["Arrays", "Strings"],
  "buckets": ["A1","A2","A3","A4","A5"],
  "values": [[0,0,1,0,0], [1,0,0,0,0]],
  "counts": [[0,0,2,0,0], [3,0,0,0,0]],
  "focus": {
    "modes": [{"id":"impact","label":"Impact","description":"...","isDefault":true}],
    "defaultModeId": "impact",
    "rankings": { "impact": ["Arrays","Strings"] },
    "topNDefault": 12,
    "topNOptions": [8,10,12,14,16]
  }
}
```

---

## micro / interview
Per-track blocks. At minimum, the dashboard uses per-track heatmaps for tabbed views:
- `micro.convergenceHeatmap`
- `interview.convergenceHeatmap`

Other fields (metrics/allocation/depthByCategory/depthAvg) may be included for future UI extensions.

---

## mcq
The dashboard expects the MCQ block nested as `mcq.mcq`.

```json
{
  "mcq": {
    "mcq": {
      "byDifficulty": {
        "basic": { "Arrays": 65 },
        "intermediate": { "Arrays": 52 },
        "advanced": { "Arrays": 31 }
      },
      "byDifficultyEvidence": {
        "basic": { "Arrays": { "attempts": 10, "questions": 8 } }
      },
      "overallCorrect": { "correct": 217, "total": 320 }
    }
  }
}
```

---

## Forward compatibility
- The UI should ignore unknown fields.
- The backend may add new fields without breaking older dashboards.
- Breaking changes require a new payload `version` and a separate schema.

---

## Frontend state not in payload

The following UI state is managed client-side only and is NOT part of the payload:

| State | Storage | Notes |
|---|---|---|
| `selectedCodingTrack` | In-memory only | `"combined"` \| `"micro"` \| `"interview"`. Set via track selector pills above depth/allocation charts. |
| `heatmapView` | In-memory only | `"focus"` \| `"all"` \| `"micro"` \| `"interview"`. Set via heatmap view tabs. |
| `heatmapFocusModeId` | In-memory only | Ranking mode. Set via "Rank by" dropdown in the heatmap focus controls. |

`infoPaneOpen` is not a separate state field — it is `meta.ui.panels.infoPane`. The collapse button in the info pane header calls `window.CodiviumInsights.toggleInfoPane()` which flips this value and persists to `localStorage`.

---

## How to produce this payload (backend)

The backend entry point is `CodiviumDashboardPayloadV2Adapter.BuildFromRaw(rawData, uiPrefs)` in `backend/CodiviumDashboardPayloadV2Adapter.v1.cs`.

1. Build a `CodiviumRawData` object from your database (see `contracts/raw-data-v1.contract.md` and `docs/DB_TO_RAW_DATA_MAPPING.md`).
2. Optionally load the user's saved UI prefs from `POST /api/dashboard/ui-prefs` storage.
3. Call `BuildFromRaw(rawData, uiPrefs?)` — returns the complete payload object.
4. Serialize to camelCase JSON and return from `GET /api/dashboard/payload`.

---

## Minimum viable payload (all fields optional except those marked required)

The smallest valid payload that will render the dashboard without errors:

```json
{
  "version": "dashboard-payload-v2",
  "meta": {},
  "overall": {
    "metrics": {
      "codiviumScore": 0,
      "breadthOverall": 0,
      "breadthMicro": 0,
      "breadthInterview": 0,
      "breadthMcq": 0,
      "weightedMcqScore": 0,
      "codiviumPointsAll": 0,
      "codiviumPoints30": 0,
      "efficiencyPtsPerHr": 0,
      "depthOverall": 0,
      "depthMicro": 0,
      "depthInterview": 0
    }
  },
  "combinedCoding": {
    "allocation": [],
    "depthByCategory": [],
    "depthAvg": 0,
    "convergenceHeatmap": {
      "categories": [], "buckets": [], "values": [], "counts": []
    }
  },
  "micro": { "metrics": { "breadth": 0 }, "allocation": [], "depthByCategory": [], "convergenceHeatmap": { "categories": [], "buckets": [], "values": [], "counts": [] } },
  "interview": { "metrics": { "breadth": 0 }, "allocation": [], "depthByCategory": [], "convergenceHeatmap": { "categories": [], "buckets": [], "values": [], "counts": [] } },
  "mcq": { "metrics": { "breadth": 0, "weightedMcqScore": 0 }, "mcq": { "byDifficulty": {}, "overallCorrect": { "correct": 0, "total": 0 } } }
}
```

Panels that depend on missing data render empty/placeholder states gracefully.

---

## What each top-level section drives

| Section | Dashboard panel(s) | Notes |
|---|---|---|
| `overall.metrics` | Scores panel (all KPIs) | All metric keys required for full display |
| `overall.timeOnPlatform.daily` | Time on platform chart | Array of `{date, minutes}` |
| `overall.insights` | Info pane content | Pre-computed interpretation blobs |
| `overall.recommendedActions` | CTA buttons on panels | Optional; panels hide CTAs if absent |
| `combinedCoding.*` | Depth, heatmap, allocation (combined track) | Used when track selector = "combined" |
| `micro.*` | Depth, heatmap, allocation (micro track) | Used when track selector = "micro" |
| `interview.*` | Depth, heatmap, allocation (interview track) | Used when track selector = "interview" |
| `mcq.mcq` | MCQ performance chart | `byDifficulty` keys drive category columns |

# Codivium Dashboard API (Reference)

This folder contains a **minimal ASP.NET Core** reference API that serves the Codivium dashboard payload and supports dashboard CTAs.

## Endpoints

### GET `/api/dashboard/payload`
Query:
- `from=YYYY-MM-DD` (optional; default: last 120 days)
- `to=YYYY-MM-DD` (optional; default: today)
- `granularity=day` (only supported value; `week`/`month` are accepted but currently treated as `day`)

> **Note:** The adapter implements only the `day` granularity path. The `granularity` parameter is
> accepted for forward-compatibility but produces daily series regardless of value. Do not document
> `week`/`month` as supported until the adapter is extended.

Returns: `dashboard-payload-v2` JSON.

Auth (reference):
- Prefer JWT claim `sub` (or `nameidentifier`).
- Dev fallback: header `X-Codivium-UserId`.

### POST `/api/sessions/start`
Body (JSON, camelCase):
- `actionId` — CTA id from payload (for analytics)
- `panelId` — panel that triggered the CTA
- `track` — `micro | interview | mcq`
- `category` — primary category hint (also in params)
- `difficulty` — difficulty hint (also in params, MCQ-only)
- `params` — full params dict: `intent`, `count`, `timeboxMinutes`, `difficultyMix`, `categoryId`, etc.
- `source` — always `"dashboard"` when from the UI

Returns:
- `sessionId`, `redirectUrl`

### POST `/api/dashboard/ui-prefs`
Body: `DashboardUiPrefs` (mode + panels + selectedTrack):
```json
{
  "mode": "full",
  "panels": { "scores": true, "depth": true, "heatmap": true, "time": true,
              "allocation": true, "mcq": true, "infoPane": true },
  "selectedTrack": "combined"
}
```
`selectedTrack` accepted values: `"combined"` | `"micro"` | `"interview"`. Defaults to `"combined"` if absent.

## Production notes
- Replace `DemoRawDataProvider` with a DB-backed provider.
- Replace header-based user id with your real authentication.
- Add multi-tenant scoping if userId alone is not sufficient.

## Layout presets vs mode/panels

The frontend exposes named layout presets (e.g. "Full Dashboard", "Scores Only", "MCQ Only").
These are **frontend macros** — they serialize to `mode` + a specific `panels` map, which
is what the API and backend store. There is no `preset` field in `DashboardUiPrefs`.

| Preset label | mode | panels summary |
|---|---|---|
| Full Dashboard | `full` | all panels true |
| Coding Core | `full` | scores+depth+heatmap+time+allocation, mcq=false |
| Heatmap Focus | `full` | heatmap only |
| Scores Only | `full` | scores only |
| Summary View | `info_only` | (info pane is main view) |
| MCQ Only | `full` | mcq only |

The backend never needs to know which preset was selected — it stores and restores
`mode + panels + selectedTrack` and the frontend highlights the matching preset button.

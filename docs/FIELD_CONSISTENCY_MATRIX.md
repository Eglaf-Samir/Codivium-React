# Field Consistency Matrix — Raw Data → Backend → Payload → Frontend

**Version:** 1.0.22 (CVU-2026-03-AH)  
Last verified: 2026-03-13

This matrix maps every significant data field through the full pipeline:
raw-data-v1 → backend scoring → payload adapter output → frontend consumer.

---

## 1. Top-level payload namespaces

| Payload field | Backend DTO | Frontend consumer | Contract |
|---|---|---|---|
| `version` | `DashboardPayloadV2.Version` | Boot validation in `06b` | must equal `"dashboard-payload-v2"` |
| `meta` | `DashboardMeta` | `applyDashboardData` in `06b` | see §2 |
| `overall` | `OverallNamespace` | `renderAll` in `06` | see §3 |
| `micro` | `TrackNamespace` | Track selector, depth/heatmap/alloc charts | see §4 |
| `interview` | `TrackNamespace` | Track selector, depth/heatmap/alloc charts | see §4 |
| `combinedCoding` | `TrackNamespace` | Default track for depth/heatmap/alloc charts | see §4 |
| `mcq` | `McqNamespace` | MCQ panel charts | see §5 |

---

## 2. Meta fields

| Payload field | Backend DTO field | Frontend consumer | Notes |
|---|---|---|---|
| `meta.sessionStartEndpoint` | `DashboardMeta.SessionStartEndpoint` | `__cvState.__sessionStartEndpoint` | Default: `"/api/sessions/start"` |
| `meta.anchorDate` | `DashboardMeta.AnchorDate` | `#anchorDate` element tagline | Optional, `YYYY-MM-DD` |
| `meta.ui.mode` | `DashboardUiPrefs.Mode` | `__cvState.__uiMode` | `"full"` or `"info_only"` |
| `meta.ui.panels.*` | `DashboardUiPrefs.Panels` | `__cvState.__uiPanels` | All 7 panel keys |
| `meta.ui.selectedTrack` | `DashboardUiPrefs.SelectedTrack` | `__cvState.__selectedCodingTrack` | `"combined"/"micro"/"interview"` — server-persisted |
| `meta.allowedModes` | `DashboardMeta.AllowedModes` | `__cvState.__allowedModes` | Optional; restricts mode toggle |

---

## 3. overall.metrics fields

| Payload camelCase field | Backend C# field | Frontend JS key | Raw input |
|---|---|---|---|
| `codiviumScore` | `MetricsDto.CodiviumScore` | `numFromEl("codiviumScore")` | Computed from B+D harmonic mean |
| `breadthOverall` | `MetricsDto.BreadthOverall` | `numFromEl("breadthScore")` | Weighted breadth across tracks |
| `breadthMicro` | `MetricsDto.BreadthMicro` | Scores expanded view | `codingSessionsByTrack["micro"]` |
| `breadthInterview` | `MetricsDto.BreadthInterview` | Scores expanded view | `codingSessionsByTrack["interview"]` |
| `breadthMcq` | `MetricsDto.BreadthMcq` | Scores expanded view | `mcqAttemptsByTrack["mcq"]` |
| `weightedMcqScore` | `MetricsDto.WeightedMcqScore` | `numFromEl("weightedMcqScore")` | Difficulty-weighted MCQ % |
| `codiviumPointsAll` | `MetricsDto.CodiviumPointsAll` | `numFromEl("codiviumPointsAll")` | KaTeX all-time points |
| `codiviumPoints30` | `MetricsDto.CodiviumPoints30` | `numFromEl("codiviumPoints30")` | KaTeX rolling-30-day points |
| `efficiencyPtsPerHr` | `MetricsDto.EfficiencyPtsPerHr` | `numFromEl("efficiencyPtsPerHr")` | pts per hour |
| `depthOverall` | `MetricsDto.DepthOverall` | `numFromEl("depthOverallScore")` | Weighted depth across tracks |
| `depthMicro` | `MetricsDto.DepthMicro` | Scores expanded view | Micro depth avg |
| `depthInterview` | `MetricsDto.DepthInterview` | Scores expanded view | Interview depth avg |
| `firstTryPassRate` | `MetricsDto.FirstTryPassRate` | `numFromEl("firstTryPassRate")` | `codingSessionsByTrack` attempt count |
| `avgAttemptsToAC` | `MetricsDto.AvgAttemptsToAC` | `numFromEl("avgAttemptsToAC")` | Average attempts |
| `medianTimeToACMinutes` | `MetricsDto.MedianTimeToACMinutes` | `numFromEl("medianTimeToAC")` | `TimeToACMinutes` per session |

> **Note on aliases:** `DepthOverallScore`, `MicroDepthScore`, `InterviewDepthScore` exist as alias
> fields on the backend DTO for frontend convenience. They carry the same values as `DepthOverall`,
> `DepthMicro`, `DepthInterview` respectively.

---

## 4. Track namespace fields (overall, micro, interview, combinedCoding)

| Payload field | Backend DTO | Frontend consumer | Notes |
|---|---|---|---|
| `*.metrics.breadth` | `TrackNamespace.Metrics.BreadthOverall` | Scores panel | Track-specific breadth |
| `*.allocation` | `TrackNamespace.Allocation` (List\<AllocationRow\>) | Allocation chart | `[{category, minutes, solved}]` |
| `*.depthByCategory` | `TrackNamespace.DepthByCategory` (List\<DepthRow\>) | Depth chart | `[{category, depth}]` |
| `*.depthAvg` | `TrackNamespace.DepthAvg` | Depth chart header | Weighted avg depth |
| `*.convergenceHeatmap.categories` | `ConvergenceHeatmapDto.Categories` | Heatmap rows | string[] |
| `*.convergenceHeatmap.buckets` | `ConvergenceHeatmapDto.Buckets` | Heatmap column headers | string[] e.g. `["A1","A2","A3","A4","A5"]` |
| `*.convergenceHeatmap.values` | `ConvergenceHeatmapDto.Values` | Heatmap cell fill | `number?[][]` — `null` = no data |
| `*.convergenceHeatmap.counts` | `ConvergenceHeatmapDto.Counts` | Heatmap tooltip | `int[][]` attempt counts |
| `*.convergenceHeatmap.focus` | `ConvergenceHeatmapDto.Focus` | Heatmap focus mode rankings | Optional; combinedCoding only |

---

## 5. overall.timeOnPlatform

| Payload field | Backend DTO | Frontend consumer | Notes |
|---|---|---|---|
| `overall.timeOnPlatform.daily` | `TimeOnPlatformDto.Daily` | Time-on-platform chart | `[{date: "YYYY-MM-DD", minutes: N}]` |

---

## 6. overall.recommendedActions (CTAs)

| Payload field | Backend DTO | Frontend consumer | Notes |
|---|---|---|---|
| `[].id` | `RecommendedActionDto.Id` | `runRecommendedAction.actionId` | Stable string id |
| `[].panelId` | `RecommendedActionDto.PanelId` | `getRecommendedAction(panelId)` | `heatmap\|allocation\|depth\|time\|mcq` |
| `[].label` | `RecommendedActionDto.Label` | CTA button text | Display label |
| `[].actionType` | `RecommendedActionDto.ActionType` | `runRecommendedAction` dispatch | `"start_session"` or `"link"` |
| `[].track` | `RecommendedActionDto.Track` | Request body `.track` | `micro\|interview\|mcq` |
| `[].params` | `RecommendedActionDto.Params` | Request body `.params` (full object) | Not spread to top level |
| `[].params.category` | — | Request body `.category` | Convenience copy |
| `[].params.difficulty` | — | Request body `.difficulty` | MCQ only |

### Session-start request body (frontend → backend)

```json
{
  "actionId": "cta_depth_raise",
  "panelId": "depth",
  "track": "micro",
  "category": "Trees",
  "difficulty": null,
  "params": { "category": "Trees", "intent": "raise_depth", "timeboxMinutes": 45 },
  "source": "dashboard"
}
```

---

## 7. MCQ payload fields

| Payload field | Backend | Frontend consumer | Notes |
|---|---|---|---|
| `mcq.metrics.breadth` | `McqNamespace.Metrics.BreadthMcq` | Scores panel MCQ breadth chip | |
| `mcq.metrics.weightedMcqScore` | `McqNamespace.Metrics.WeightedMcqScore` | Scores panel weighted MCQ chip | |
| `mcq.mcq.byDifficulty` | Object: `{basic:{cat:score}, intermediate:..., advanced:...}` | 3 MCQ bar charts (one per difficulty) | |
| `mcq.mcq.overallCorrect` | `{correct: N, total: N}` | MCQ header stats | |
| `mcq.mcq.byDifficultyEvidence` | `{basic:{cat:{attempts,questions}}}` | MCQ tooltip evidence | |

---

## 8. Raw data → backend field mapping summary

| Raw data field | C# property | Used for |
|---|---|---|
| `UniqueCorrectMcqAllTime` | via calculator | KaTeX U_all (MCQ points) |
| `codingSessionsByTrack["micro"]` | `CodiviumRawData.CodingSessions` (filtered) | Micro breadth/depth/heatmap |
| `codingSessionsByTrack["interview"]` | `CodiviumRawData.CodingSessions` (filtered) | Interview breadth/depth/heatmap |
| `mcqAttemptsByTrack["mcq"]` | `CodiviumRawData.McqAttempts` | MCQ breadth/score/chart |
| `CategoryId` / `category` (alias) | `CodingSession.Category` | All per-category metrics |
| `ExerciseId` | `CodingSession.ExerciseId` | KaTeX distinct-exercise points |
| `Difficulty` | `CodingSession.Difficulty` | Difficulty breakdown, KaTeX |
| `CompletedAtUtc` | `CodingSession.CompletedAt` | Decay weighting, time series |
| `TimeToACMinutes` | `CodingSession.TimeToACMinutes` | Median time, efficiency |
| `Attempts` (array) | `CodingSession.AttemptCount` (derived) | Avg attempts, first-try rate |
| `ScorePercent` / `percent` (alias) | `McqAttempt.ScorePercent` | Weighted MCQ score |

---

## 9. Known gaps / open items

| Gap | Status |
|---|---|
| `granularity` param (week/month) | ⚠️ Accepted but only `day` implemented. See R09. |
| `overall.insights` frontend fallback | ✅ Backend path preferred; client fallback runs if absent |
| `combinedCoding.convergenceHeatmap.focus` | ✅ Built by `CodiviumHeatmapFocusBuilder` from config |
| `meta.allowedModes` UI enforcement | ✅ Tested (T21) |
| `selectedTrack` server persistence | ✅ Implemented in `DashboardUiPrefs.SelectedTrack` |

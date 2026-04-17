# CodiviumRecommendedActions.v1.cs — Detail Reference

## What it is
Generates the recommended action CTA objects shown on each dashboard panel.
Produces one CTA per panel based on computed metrics and heatmap focus rankings.

## Entry Points

### Primary (KaTeX-aligned)
```csharp
List<RecommendedActionDto> CodiviumRecommendedActions.BuildFromKatex(
    KatexAllResults scores,
    HeatmapFocusDto focusData,
    string          sessionStartEndpoint
)
```

### Fallback
```csharp
List<RecommendedActionDto> CodiviumRecommendedActions.Build(
    CodiviumScoring.CodiviumRawData rawData,
    string                          sessionStartEndpoint
)
```

## Input
| Parameter | Type | Notes |
|---|---|---|
| scores | KatexAllResults | All computed metrics |
| focusData | HeatmapFocusDto | Focus mode rankings from CodiviumHeatmapFocusBuilder |
| sessionStartEndpoint | string | URL for start-session CTA links |

## Output: List<RecommendedActionDto>
Each item:
| Field | Type | Notes |
|---|---|---|
| id | string | Stable identifier e.g. "cta_heatmap_focus" |
| panelId | string | "heatmap"/"depth"/"allocation"/"time"/"mcq"/"scores" |
| label | string | Button text e.g. "Start Focus Session" |
| actionType | string | "start_session" or "link" |
| track | string | "micro" or "interview" |
| params | object | Session parameters: category, count, difficultyMix, timeboxMinutes |

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 7 of Build pipeline)

## Limitations
- Produces one CTA per panel — not configurable at runtime
- sessionStartEndpoint must match the endpoint registered in Program.cs
- Focus rankings must be non-empty for heatmap CTA to be meaningful

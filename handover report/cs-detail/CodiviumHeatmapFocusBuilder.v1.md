# CodiviumHeatmapFocusBuilder.v1.cs — Detail Reference

## What it is
Computes the five focus mode rankings for the convergence heatmap panel.
Rankings are pre-computed by the backend so the frontend can switch modes instantly.

## Entry Point
```csharp
HeatmapFocusDto CodiviumHeatmapFocusBuilder.BuildFocus(
    CodiviumScoring.ScoringConfig config,
    TrackNamespace                trackData
)
```

## Input
| Parameter | Type | Notes |
|---|---|---|
| config | ScoringConfig | Focus mode definitions from config.heatmap.focus_modes |
| trackData | TrackNamespace | Heatmap values, counts, allocation, depth for the track |

## Output: HeatmapFocusDto
| Field | Type | Notes |
|---|---|---|
| modes | FocusModeDto[] | Mode definitions: id, label, description, isDefault |
| defaultModeId | string | "impact" by default |
| rankings | Dict<string, string[]> | Category lists per mode, ordered by rank |
| topNDefault | int | Default number of categories to highlight (12) |
| topNOptions | int[] | Available N choices: [8,10,12,14,16] |

### Five focus modes and ranking logic
| Mode | Ranks by |
|---|---|
| impact | time spent × early convergence weakness (composite) |
| worst_convergence | lowest A1–A3 pass rate |
| most_time | highest allocation minutes |
| lowest_depth | lowest depth score |
| highest_friction | low early convergence × time (proxy for slow progress) |

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 5)
CodiviumRecommendedActions.v1.cs (primary CTA source)

## Limitations
- Requires non-empty heatmap values — returns empty rankings if no data
- Focus mode definitions must match scoring-config.v1.json heatmap.focus_modes

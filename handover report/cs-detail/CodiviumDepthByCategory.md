# CodiviumDepthByCategory.cs — Detail Reference

## What it is
Adapts per-category depth scores from the KaTeX scoring output into the dashboard payload shape.

## Entry Point
```csharp
DashboardDepthPayload CodiviumDepthByCategory.AdaptForDashboard(
    Dictionary<string, double> depthByCategoryCanonical,
    double                     depthAvg
)
```

## Input
| Parameter | Type | Notes |
|---|---|---|
| depthByCategoryCanonical | Dict<string,double> | From KatexAllResults.DepthByCategory |
| depthAvg | double | From KatexAllResults.DepthAvg |

## Output: DashboardDepthPayload
| Field | Type |
|---|---|
| DepthByCategory | List<DepthItem> — [{Category, Depth}] |
| DepthAvg | double |

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 4)
— produces combinedCoding.depthByCategory, micro.depthByCategory, interview.depthByCategory.

## Limitations
- Flat array shape only — the dashboard contract requires depthByCategory at top level of track namespace, not nested under a depth key

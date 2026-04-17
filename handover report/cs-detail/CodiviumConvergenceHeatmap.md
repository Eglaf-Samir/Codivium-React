# CodiviumConvergenceHeatmap.cs — Detail Reference

## What it is
Builds the convergence heatmap cell-value matrix.
Each cell = pass rate at attempt bucket (A1–A5) for a category.

## Entry Point
```csharp
HeatmapPayload CodiviumConvergenceHeatmap.BuildConvergenceHeatmap(
    CodiviumScoring.CodiviumRawData rawData
)
```

## Input
CodiviumRawData — uses CodingSessionsByTrack and attempt data.

## Output: HeatmapPayload
| Field | Type | Notes |
|---|---|---|
| Categories | string[] | Category names (row labels) |
| Buckets | string[] | ["A1","A2","A3","A4","A5"] |
| Values | double[][] | Pass rate 0–1 per [category][bucket] |
| Counts | int[][] | Attempt count per [category][bucket] |

Bucket A1 = first attempt ever at this exercise, A2 = second attempt, etc.
Pass rate = (attempts where all tests passed) / (total attempts in bucket).

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 3)
— result embedded in combinedCoding.convergenceHeatmap, micro.convergenceHeatmap, interview.convergenceHeatmap.

## Limitations
- Only includes categories with at least one attempt
- Bucket A5 captures all attempts ≥5 (not just exactly 5)

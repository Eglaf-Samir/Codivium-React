# CodiviumDashboardPayloadV2Adapter.v1.cs — Detail Reference

## What it is
Assembles the complete dashboard-payload-v2 JSON object from scoring results.
The final step in the backend pipeline before the payload is serialised and sent.

## Entry Point
```csharp
DashboardPayloadV2 DashboardPayloadV2Adapter.BuildFromRaw(
    CodiviumScoring.CodiviumRawData rawData,
    DashboardUiPrefs                uiPrefs,
    string                          anchorDate,       // "YYYY-MM-DD"
    string                          sessionStartEndpoint
)
```

## Input
| Parameter | Type | Notes |
|---|---|---|
| rawData | CodiviumRawData | Full raw session data incl. config |
| uiPrefs | DashboardUiPrefs | User's panel visibility + mode preferences |
| anchorDate | string | ISO date for "as of" framing — pass today's date |
| sessionStartEndpoint | string | URL for CTA "Start Session" buttons |

## What it does
1. Calls CodiviumKatexScoring.ComputeAll() for all metrics
2. Calls CodiviumAllocation.Build() for exercise time allocation
3. Calls CodiviumDepthByCategory.AdaptForDashboard() for depth chart
4. Calls CodiviumConvergenceHeatmap.BuildConvergenceHeatmap() for heatmap
5. Calls CodiviumHeatmapFocusBuilder.BuildFocus() for focus mode rankings
6. Calls CodiviumInsights.Build() for structured info-pane text
7. Calls CodiviumRecommendedActions.BuildFromKatex() for CTA objects
8. Calls CodiviumTimeOnPlatform.BuildTimeOnPlatform() for daily activity series
9. Assembles DashboardPayloadV2 with all above results structured into overall/micro/interview/mcq/combinedCoding namespaces

## Output: DashboardPayloadV2
Complete JSON object matching dashboard-payload-v2.contract.md.
Contains: meta, overall (metrics, timeOnPlatform, insights, recommendedActions),
combinedCoding, micro, interview, mcq namespaces.

## Used by
Program.cs → GET /api/dashboard/payload endpoint (to be added)

## Limitations
- anchorDate must be a valid YYYY-MM-DD string
- sessionStartEndpoint must be a valid URL path string
- All sub-builders are called synchronously — suitable for request/response cycle

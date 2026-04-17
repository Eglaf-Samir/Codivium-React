# CodiviumPayloadDtos.cs — Detail Reference

## What it is
All DTO (data transfer object) classes for the dashboard-payload-v2 JSON structure.
No scoring logic — pure data containers.

## Key DTOs
- DashboardPayloadV2 — root payload object
- DashboardMeta — meta.sessionStartEndpoint, meta.anchorDate, meta.ui
- OverallNamespace — overall.metrics, timeOnPlatform, insights, recommendedActions
- TrackNamespace — micro / interview / combinedCoding blocks (allocation, depth, heatmap)
- McqNamespace — mcq block
- MetricsDto — all 15 headline KPI fields
- AllocationRowDto — {category, minutes, solved}
- DepthRowDto — {category, depth}

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs fills these DTOs.
Program.cs serialises them to JSON via System.Text.Json.

## Limitations
- All property names use [JsonPropertyName] attributes to enforce camelCase output
- Adding new fields here requires corresponding update to dashboard-payload-v2.contract.md

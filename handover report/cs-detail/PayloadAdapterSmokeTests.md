# PayloadAdapterSmokeTests.cs — Detail Reference

## What it is
Smoke tests for DashboardPayloadV2Adapter.BuildFromRaw().
Verifies the adapter produces focus data and recommended actions from minimal input.

## Covers
- Full pipeline smoke test (raw data → payload) does not throw
- Focus rankings non-empty when heatmap data present
- RecommendedActions non-empty

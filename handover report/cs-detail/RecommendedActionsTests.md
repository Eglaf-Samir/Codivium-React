# RecommendedActionsTests.cs — Detail Reference

## What it is
xUnit tests for CodiviumRecommendedActions.BuildFromKatex() and fallback Build().

## Covers
- One action produced per panel (heatmap/depth/allocation/time/mcq/scores)
- Fallback Build() still available when KatexAllResults not available
- Session params include required fields (track, category, count)

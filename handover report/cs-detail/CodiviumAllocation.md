# CodiviumAllocation.cs — Detail Reference

## What it is
Computes the exercise time allocation by category (minutes spent + exercises solved).
Drives the Allocation doughnut/bar chart on the Performance Insights dashboard.

## Entry Point
```csharp
List<AllocationRow> CodiviumAllocation.Build(
    IEnumerable<CodiviumScoring.CodingSession> sessions
)
```

## Input
Flat list of CodingSession records (all tracks combined, or filtered by track).

## Output: List<AllocationRow>
| Field | Type | Notes |
|---|---|---|
| Category | string | Category display name |
| Minutes | double | Sum of TimeToACMinutes for this category |
| Solved | int | Count of distinct accepted sessions |

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 2) — produces allocation arrays for
combinedCoding.allocation, micro.allocation, interview.allocation.

## Limitations
- Minutes is sum of TimeToACMinutes (accepted solve time only, not including failed attempts)
- Does not weight by difficulty

# CodiviumKatexScoring.v1.cs — Detail Reference

## What it is
Executable mirror of the KaTeX scoring formulae documented in assets/docs/codivium_scoring_katex.html.
All formula implementations live here. No other file should contain scoring maths.

## Purpose
Compute all KPI metrics from raw session data using the KaTeX specification:
breadth, depth (convergence AUC), points, efficiency, MCQ weighted score.

## Entry Point
```csharp
KatexAllResults CodiviumKatexScoring.ComputeAll(
    CodiviumScoring.CodiviumRawData rawData,
    CodiviumScoring.ScoringConfig   config
)
```

## Input
- rawData: CodiviumRawData (all sessions, MCQ attempts, UniqueCorrectMcqAllTime, config)
- config: ScoringConfig parsed from scoring-config.v1.json — provides weights, thresholds, category catalog

## Output: KatexAllResults
| Field | Type | Notes |
|---|---|---|
| BreadthMicro | double 0–100 | % micro categories with ≥1 clean solve |
| BreadthInterview | double 0–100 | % interview categories with ≥1 clean solve |
| BreadthMcq | double 0–100 | % MCQ categories attempted |
| BreadthOverall | double 0–100 | Weighted: 0.4×micro + 0.4×interview + 0.2×mcq |
| DepthByCategory | Dict<string,double> | Per-category convergence depth score 0–100 |
| DepthAvg | double 0–100 | Mean of DepthByCategory |
| CodiviumScore | double 0–100 | 2BD/(B+D) harmonic mean; 0 if B=0 or D=0 |
| PointsAllTime | double | Cumulative weighted points with time bonus |
| PointsLast30Days | double | Points from sessions in last 30 days |
| EfficiencyPtsPerHr | double | Points / active coding hours |
| WeightedMcqScore | double 0–100 | f(UniqueCorrectMcqAllTime, beta) |
| FirstTryPassRate | double 0–100 | % exercises solved on attempt 1 |
| AvgAttemptsToAC | double | Mean attempt count to accepted |
| MedianTimeToACMinutes | double | Median TimeToACMinutes across all sessions |
| ConvergenceHeatmapData | nested | [category][bucket A1–A5] pass rates and counts |

## Key Formulae
- Depth per category: AUC×0.55 + Efficiency×0.35 + NotStuck×0.10
- CodiviumScore: 2BD/(B+D) — harmonic mean of breadth B and depth D
- Points: Σ difficulty_weight × time_factor × improvement_bonus × decay(CompletedAtUtc)

## Limitations
- All weights/thresholds are read from ScoringConfig — do not hardcode
- Sessions with missing CompletedAtUtc are excluded from decay calculation and will cause a fail-fast error
- Redo of the same ExerciseId within 7 days is excluded from points (counted as practice only)

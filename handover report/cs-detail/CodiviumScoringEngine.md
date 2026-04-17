# CodiviumScoringEngine.cs — Detail Reference

## What it is
The central data model and entry-point orchestrator for the Codivium scoring system.
Defines all core input/output types and delegates computation to CodiviumKatexScoring.

## Purpose
- Defines CodiviumRawData (input), ScoringConfig, and all sub-models
- Exposes CodiviumScoring.ComputeScoreBundle() as the single scoring entry point
- Validates and normalises raw data before passing to the KaTeX layer

## Key Classes

### CodiviumRawData (input root)
| Field | Type | Required | Notes |
|---|---|---|---|
| CodingSessionsByTrack | Dict<string, CodingSession[]> | Yes | Keys: "micro", "interview" |
| McqAttemptsByTrack | Dict<string, McqAttempt[]> | Yes | Key: "mcq" |
| UniqueCorrectMcqAllTime | int | Yes | Lifetime distinct correct MCQ questions |
| Config | ScoringConfig | Yes | From scoring-config.v1.json |

### CodingSession
| Field | Type | Required |
|---|---|---|
| ExerciseId | string | Yes |
| CategoryId | string | Yes |
| SubCategory | string? | No |
| Difficulty | string | Yes — "basic"/"intermediate"/"advanced" |
| CompletedAtUtc | DateTime | Yes |
| TimeToACMinutes | double | Yes |
| Attempts | SubmissionAttempt[] | Yes |

### McqAttempt
| Field | Type | Required |
|---|---|---|
| QuizId | string | Yes |
| CategoryId | string | Yes |
| Difficulty | string | Yes |
| CompletedAtUtc | DateTime | Yes |
| ScorePercent | double | Yes (0–100) |
| Correct | int | Optional enrichment |
| Total | int | Optional enrichment |

## Entry Point
```csharp
ScoreBundle CodiviumScoring.ComputeScoreBundle(CodiviumRawData raw)
```
Returns a ScoreBundle containing all computed metrics ready for use by the payload adapter.

## Output: ScoreBundle
All headline metrics: BreadthOverall, BreadthMicro, BreadthInterview, BreadthMcq,
DepthOverall, CodiviumScore, Points, Efficiency, SubmissionMetrics,
ConvergenceHeatmap data, AllocationByCategory, DepthByCategory per track.

## Used by
- CodiviumDashboardPayloadV2Adapter.v1.cs (BuildFromRaw)
- CodiviumAdaptiveEndpoints.cs (via IRawDataProvider)

## Limitations
- Difficulty must be one of basic/intermediate/advanced — numeric 1/2/3 accepted via converter
- CompletedAtUtc required on every session (drives recency decay)
- CategoryId or category alias required on every session

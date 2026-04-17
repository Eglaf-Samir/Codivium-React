# CodiviumMcq.cs — Detail Reference

## What it is
Builds the MCQ performance payload section of the dashboard.
Also defines the McqSessionResult DTO used by the MCQ API endpoints.

## Entry Point (dashboard use)
```csharp
McqPayload CodiviumMcq.BuildMcqPayload(CodiviumScoring.CodiviumRawData rawData)
```

## Input
CodiviumRawData — specifically mcqAttemptsByTrack["mcq"]

## Output: McqPayload
| Field | Type | Notes |
|---|---|---|
| byDifficulty | ByDifficultyPayload | Map: {basic,intermediate,advanced} → {category: avgScore} |
| byDifficultyEvidence | ByDifficultyEvidencePayload | Map: same shape but values are {attempts, questions} |
| overallCorrect | OverallCorrectPayload | {correct, total} across all attempts ever |

## McqSessionResult DTO (API use)
Used by CodiviumMcqApiEndpoints.cs to deserialise POST /api/mcq/results body.
| Field | Type |
|---|---|
| SessionId | string |
| Settings | McqSessionSettings |
| StartedAt | DateTimeOffset |
| CompletedAt | DateTimeOffset |
| MinutesSpent | double |
| TotalQuestions | int |
| Correct | int |
| Peeked | int |
| ScorePercent | double |
| SelectedRecommendationType | string? |
| Answers | McqQuestionAnswer[] |

## Used by
- CodiviumDashboardPayloadV2Adapter.v1.cs (mcq namespace)
- CodiviumMcqApiEndpoints.cs (DTO reference)

## Limitations
- avgScore per cell is mean of all ScorePercent values — no recency weighting
- Evidence counts use attempt count (quiz sessions), not individual question count

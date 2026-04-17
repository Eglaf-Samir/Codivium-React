# CodiviumRawDataBuilder.v1.cs — Detail Reference

## What it is
Reference implementation for building CodiviumRawData from database rows.
Contains the DB row model classes and the builder that maps them to the scoring input.

## Entry Point
```csharp
CodiviumScoring.CodiviumRawData CodiviumRawDataBuilder.Build(
    IEnumerable<CodingSessionRow> codingRows,
    IEnumerable<CodingAttemptRow> attemptRows,
    IEnumerable<McqAttemptRow>    mcqRows,
    int                           uniqueCorrectMcqAllTime,
    CodiviumScoring.ScoringConfig config
)
```

## Input DB Row Models

### CodingSessionRow (maps to one accepted solve)
| Field | Type | Notes |
|---|---|---|
| SessionId | string | Primary key |
| UserId | string | Filter by this |
| Track | string | "micro"/"interview" |
| CategoryId | string | Category name or slug |
| SubCategory | string? | Optional — enables stretch recommendations |
| Difficulty | string | "basic"/"intermediate"/"advanced" |
| CompletedAtUtc | DateTime | When accepted |
| TimeToACMinutes | double | Total session duration |
| ExerciseId | string | Stable exercise identifier |

### CodingAttemptRow (one per submission within a session)
| Field | Type |
|---|---|
| SessionId | string (FK) |
| UnitTestsPassed | int |
| TimeToSubmissionMinutes | double |
| SubmittedAtUtc | DateTime? |

### McqAttemptRow
| Field | Type |
|---|---|
| QuizId | string |
| UserId | string |
| CategoryId | string |
| Difficulty | string |
| CompletedAtUtc | DateTime |
| ScorePercent | double |
| Correct | int |
| Total | int |
| MinutesSpent | double? |

## Output
CodiviumScoring.CodiviumRawData — the complete input structure for all scoring and adaptive engines.

## Notes
- Replace DemoRawDataProvider with a class that calls this builder with real DB rows
- Normalises legacy difficulty aliases (1/2/3 → basic/intermediate/advanced)
- Groups sessions by track automatically

## Limitations
- DemoRawDataProvider.cs is the stub — replace for production
- UniqueCorrectMcqAllTime must be a pre-computed count from the database, not derived here

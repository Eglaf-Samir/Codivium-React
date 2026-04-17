# CodiviumTimeOnPlatform.cs — Detail Reference

## What it is
Builds the daily time-on-platform series used by the Time chart on the dashboard.

## Entry Point
```csharp
TimeOnPlatformPayload CodiviumTimeOnPlatform.BuildTimeOnPlatform(
    CodiviumScoring.CodiviumRawData rawData,
    ICodiviumClock                  clock
)
```

## Input
- rawData: session data (CompletedAtUtc + TimeToACMinutes used to derive daily minutes)
- clock: ICodiviumClock (use SystemCodiviumClock in production)

## Output: TimeOnPlatformPayload
| Field | Type |
|---|---|
| Daily | List<TimePoint> — [{Date "YYYY-MM-DD", Minutes}] |

Daily is sparse — only days with activity. The frontend densifies to last 370 days.

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 8)
— produces overall.timeOnPlatform.daily.

## Limitations
- Derives minutes from session data only (TimeToACMinutes). Does not include browse/read time.
- Clock injection required for deterministic testing

# DemoRawDataProvider.cs — Detail Reference

## What it is
Stub implementation of IRawDataProvider for demo/development use.
Returns hardcoded fixture data. Must be replaced for production.

## Interface implemented
```csharp
Task<CodiviumScoring.CodiviumRawData> GetRawDataAsync(
    string userId, DateTimeOffset fromUtc, DateTimeOffset toUtc)
```

## What it returns
A fixed CodiviumRawData object with demo sessions for a single fictitious user.
Ignores userId, fromUtc, toUtc parameters entirely.

## Used by
CodiviumAdaptiveEndpoints.cs, Program.cs (registered as IRawDataProvider in DI).

## Limitations
- MUST be replaced in production with a real database implementation
- Does not filter by userId or date range
- Single fixed user — not usable for multi-user testing

# KatexScoringEngineTests.cs — Detail Reference

## What it is
xUnit test suite for CodiviumKatexScoring.ComputeAll(). The most comprehensive test file (31KB).

## Entry point
Run with: dotnet test backend/tests/Codivium.Dashboard.Tests.csproj

## Test coverage
- EC-01 to EC-10 edge-case fixtures (zero evidence, single session, boundary difficulties)
- Golden oracle values from demo data (regression guard)
- Redo deduplication within 7 days
- Null TimeToACMinutes derivation from attempt timestamps
- MCQ U_all = 0 produces MCQ points = 0

## Used by
CI/CD pipeline. Run before every deployment.

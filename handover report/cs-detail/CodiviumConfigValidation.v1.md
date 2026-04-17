# CodiviumConfigValidation.v1.cs — Detail Reference

## What it is
Validates ScoringConfig at startup. Throws descriptive errors for misconfigured weights,
missing categories, or invalid threshold values.

## Entry Point
```csharp
void CodiviumConfigValidation.ValidateOrThrow(CodiviumScoring.ScoringConfig cfg)
```

Throws InvalidOperationException with actionable message if any validation fails.

## What it validates
- All required config sections present (katex, difficulty, convergence, categories)
- Difficulty weights sum correctly
- Category catalog non-empty and valid
- Threshold values within expected ranges

## Used by
Program.cs — called once at startup before any request is served.

## Limitations
- Validation is fail-fast: first error throws immediately

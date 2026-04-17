# CodiviumKatexConfig.v1.cs — Detail Reference

## What it is
C# schema classes for the KaTeX scoring configuration section of scoring-config.v1.json.
Defines the strongly-typed config model used by CodiviumKatexScoring.

## Key Classes
- KatexScoringConfig — root config type (lives at cfg.Katex)
- KatexCodingConfig — coding session scoring weights
- KatexBreadthConfig — breadth weights (micro/interview/mcq)
- KatexRecencyConfig — decay parameters
- KatexTimeFactorConfig — time efficiency bonus parameters
- KatexTriesFactorConfig — redo spacing parameters

## Used by
CodiviumKatexScoring.v1.cs reads cfg.Katex to get all formula constants.

## Limitations
- All fields have default values matching the published KaTeX spec
- Do not modify defaults without updating the KaTeX documentation

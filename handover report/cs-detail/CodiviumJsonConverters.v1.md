# CodiviumJsonConverters.v1.cs — Detail Reference

## What it is
Custom System.Text.Json converters for the raw data contract.
Handles legacy difficulty values (1/2/3 → basic/intermediate/advanced).

## Key Converter
DifficultyValueConverter — normalises difficulty strings on deserialisation.
Accepts: "basic","intermediate","advanced","1","2","3","easy","medium","hard".
Throws JsonException on unrecognised values.

## Used by
CodiviumScoringEngine.cs — applied to CodingSession.Difficulty and McqAttempt.Difficulty
via JsonConverter attribute.

## Limitations
- Case-insensitive matching only — not locale-aware

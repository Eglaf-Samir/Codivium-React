# CanonicalizationTests.cs — Detail Reference

## What it is
xUnit tests for category/track key canonicalisation logic.

## Covers
- Category keys are lowercased and trimmed (not stripped of internal spaces)
- Track IDs have whitespace removed
- Alias resolution after canonicalisation
- Collision detection (two aliases resolving to same canonical key)

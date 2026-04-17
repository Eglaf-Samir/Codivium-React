# CodiviumClock.v1.cs — Detail Reference

## What it is
Clock abstraction to avoid DateTime.UtcNow inside calculators (enables deterministic testing).

## Interface
```csharp
interface ICodiviumClock { DateTime UtcNow { get; } }
```

## Implementations
- SystemCodiviumClock — returns DateTime.UtcNow (use in production)
- CodiviumClocks.System — singleton convenience accessor

## Used by
CodiviumTimeOnPlatform.cs, CodiviumAdaptiveEngine.cs (via DateTimeOffset.UtcNow parameter).

## Limitations
- Inject SystemCodiviumClock in production DI. Tests inject a fixed-time mock.

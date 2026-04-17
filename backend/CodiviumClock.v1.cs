// CodiviumClock.v1.cs
// G07: Determinism support - avoid DateTime.UtcNow inside calculators by injecting a clock.

using System;

public interface ICodiviumClock
{
    DateTime UtcNow { get; }
}

public sealed class SystemCodiviumClock : ICodiviumClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}

public static class CodiviumClocks
{
    public static readonly ICodiviumClock System = new SystemCodiviumClock();
}

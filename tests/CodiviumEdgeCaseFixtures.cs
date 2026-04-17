// CodiviumEdgeCaseFixtures.cs
//
// Step 4 of the refactor plan: edge-case raw-data fixtures for backend scoring tests.
//
// Each fixture is a static factory method that returns CodiviumScoring.CodiviumRawData
// built from a known input, together with a companion ExpectedOutputs record that
// states the exact values ComputeAll() must produce.
//
// These fixtures cover the boundary conditions identified during the KaTeX spec audit:
//
//  EC-01  Zero evidence in one coding track  → that track's breadth/depth = 0
//  EC-02  Both B=0 and D=0                  → CodiviumScore = 0
//  EC-03  Attempt count at every bucket boundary (1/2/3/4/5/6+)
//  EC-04  Redo within 7 days                → must NOT count
//  EC-05  Redo outside 7 days               → must count
//  EC-06  MCQ with U_all = 0               → McqPoints = 0
//  EC-07  TimeToACMinutes missing           → derived from last attempt time
//  EC-08  Last accepted attempt is not the first (fail-pass-fail-pass pattern)
//  EC-09  All sessions in one category (breadth balance = 0, coverage fraction < 1)
//  EC-10  Exactly one session per track     → confidence stabilizer effect
//
// Usage (xUnit example):
//   var (raw, expected) = CodiviumEdgeCaseFixtures.EC01_ZeroEvidenceInOneTrack();
//   var catalog = CodiviumCatalog.Build(raw.Config);
//   var result  = CodiviumKatexScoring.ComputeAll(raw, catalog, expected.AsOfUtc);
//   Assert.Equal(0.0, result.BreadthByTrack["interview"], precision: 3);

#nullable enable
using System;
using System.Collections.Generic;

public static class CodiviumEdgeCaseFixtures
{
    // ─────────────────────────────────────────────────────────────────────────
    // Shared helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Expected output values companion for a fixture.
    /// Only fields relevant to each fixture are set; others are left as NaN/null to mean "don't check."
    /// </summary>
    public sealed class ExpectedOutputs
    {
        public DateTimeOffset AsOfUtc { get; init; }

        // Breadth
        public double? BreadthMicro     { get; init; }
        public double? BreadthInterview { get; init; }
        public double? BreadthMcq       { get; init; }
        public double? OverallBreadth   { get; init; }

        // Depth
        public double? DepthMicro     { get; init; }
        public double? DepthInterview { get; init; }
        public double? OverallDepth   { get; init; }

        // Score
        public double? CodiviumScore { get; init; }

        // Points
        public double? PointsAllTime    { get; init; }
        public double? PointsLast30Days { get; init; }

        // Efficiency
        public double? EfficiencyPtsPerHr { get; init; }

        // Diagnostics
        public double? FirstTryPassRate     { get; init; }
        public double? AvgAttemptsToAC      { get; init; }
        public double? MedianTimeToACMinutes { get; init; }
    }

    /// <summary>
    /// Minimal scoring config with exactly 3 categories per coding track and 2 per MCQ.
    /// Uses KaTeX defaults throughout.
    /// </summary>
    private static CodiviumScoring.ScoringConfig MiniConfig() =>
        System.Text.Json.JsonSerializer.Deserialize<CodiviumScoring.ScoringConfig>(
            System.IO.File.ReadAllText(
                System.IO.Path.Combine(AppContext.BaseDirectory,
                    "..", "..", "..", "..", "config", "scoring-config.katex.v1.json")),
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })!
        with
        {
            Categories = new CodiviumScoring.CategoriesConfig
            {
                AvailableByTrack = new Dictionary<string, List<string>>
                {
                    ["micro"]     = new() { "arrays", "trees", "graphs" },
                    ["interview"] = new() { "arrays", "trees", "dynamic programming" },
                    ["mcq"]       = new() { "arrays", "trees" },
                }
            }
        };

    /// <summary>
    /// A single fully-accepted session.
    /// </summary>
    private static CodiviumScoring.CodingSession AcceptedSession(
        string exerciseId,
        string categoryId,
        string difficulty,
        DateTime completedAt,
        double timeToAcMinutes,
        int attemptCount = 1)
    {
        var attempts = new List<CodiviumScoring.SubmissionAttempt>();
        // All attempts before the last fail, last attempt passes.
        for (var i = 0; i < attemptCount - 1; i++)
            attempts.Add(new CodiviumScoring.SubmissionAttempt
            {
                UnitTestsPassed = 0,
                TimeToSubmissionMinutes = timeToAcMinutes * (i + 1.0) / attemptCount
            });
        attempts.Add(new CodiviumScoring.SubmissionAttempt
        {
            UnitTestsPassed = 10,
            TimeToSubmissionMinutes = timeToAcMinutes
        });

        return new CodiviumScoring.CodingSession
        {
            ExerciseId = exerciseId,
            CategoryId = categoryId,
            Difficulty = difficulty,
            UnitTestsTotal = 10,
            CompletedAtUtc = completedAt,
            TimeToACMinutes = timeToAcMinutes,
            Attempts = attempts
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-01: Zero evidence in interview track
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-01: Only micro sessions present. Interview track has zero evidence.
    /// Expected: BreadthInterview = 0, DepthInterview = 0.
    /// CodiviumScore must still compute from micro breadth and the 0 interview depth/breadth terms.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC01_ZeroEvidenceInOneTrack()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        // One accepted micro session, 5 days ago, 1 attempt, basic difficulty, 20 min
        var session = AcceptedSession("ex-001", "arrays", "basic",
            asOf.AddDays(-5).UtcDateTime, 20.0, 1);

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession> { session },
                ["interview"] = new List<CodiviumScoring.CodingSession>()   // empty
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        var expected = new ExpectedOutputs
        {
            AsOfUtc = asOf,
            BreadthInterview = 0.0,   // no evidence → breadth = 0
            DepthInterview   = 0.0,   // no evidence → depth = 0
            BreadthMcq       = 0.0,
            CodiviumScore    = 0.0,   // D = 0.5*Dmicro + 0.5*0 > 0 but B has interview=0 term
            // Note: CodiviumScore > 0 only if both B > 0 and D > 0.
            // B = 0.4*Bmicro + 0.4*0 + 0.2*0 > 0 (micro has one session)
            // D = 0.5*Dmicro + 0.5*0 > 0
            // So CodiviumScore > 0 (harmonic mean of non-zero B and non-zero D)
            // — override: do not assert CodiviumScore = 0 here, just check interview terms
        };
        // Correct: CodiviumScore != 0 here (both B>0 and D>0 from micro contribution)
        // Set to null to indicate "don't check this field"
        return (raw, expected with { CodiviumScore = null });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-02: B = 0 → CodiviumScore must be exactly 0
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-02: No sessions at all. All evidence = 0. B = 0, D = 0.
    /// CodiviumScore edge case: if B=0 or D=0 → score = 0 (defined in spec).
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC02_AllZeroEvidence()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession>(),
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        var expected = new ExpectedOutputs
        {
            AsOfUtc         = asOf,
            CodiviumScore   = 0.0,
            OverallBreadth  = 0.0,
            OverallDepth    = 0.0,
            BreadthMicro    = 0.0,
            BreadthInterview= 0.0,
            BreadthMcq      = 0.0,
            DepthMicro      = 0.0,
            DepthInterview  = 0.0,
            PointsAllTime   = 0.0,
            PointsLast30Days= 0.0,
            FirstTryPassRate     = 0.0,
            AvgAttemptsToAC      = 0.0,
            MedianTimeToACMinutes= 0.0,
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-03: Every convergence bucket boundary (1,2,3,4,5,6 attempts)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-03: Six sessions, one per attempt-count 1..6. All basic, same category, same day.
    /// Tests that q_conv maps: 1→g[0]=1.00, 2→g[1]=0.92, 3→g[2]=0.85,
    ///                         4→g[3]=0.78, 5→g[4]=0.70, 6→g[5]=0.60.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC03_AllConvergenceBuckets()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();
        var baseDate = asOf.AddDays(-1).UtcDateTime;

        var sessions = new List<CodiviumScoring.CodingSession>();
        for (var attempts = 1; attempts <= 6; attempts++)
        {
            sessions.Add(AcceptedSession(
                $"ex-conv-{attempts}", "arrays", "basic",
                baseDate, 20.0, attempts));
        }

        // Add one session with > 6 attempts — must use g[5]=0.60 (same as A6)
        var manyAttempts = new List<CodiviumScoring.SubmissionAttempt>();
        for (var i = 0; i < 9; i++)
            manyAttempts.Add(new CodiviumScoring.SubmissionAttempt
                { UnitTestsPassed = 0, TimeToSubmissionMinutes = 5.0 * (i + 1) });
        manyAttempts.Add(new CodiviumScoring.SubmissionAttempt
            { UnitTestsPassed = 10, TimeToSubmissionMinutes = 50.0 });

        sessions.Add(new CodiviumScoring.CodingSession
        {
            ExerciseId = "ex-conv-10", CategoryId = "arrays", Difficulty = "basic",
            UnitTestsTotal = 10, CompletedAtUtc = baseDate, TimeToACMinutes = 50.0,
            Attempts = manyAttempts
        });

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = sessions,
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // We don't prescribe exact output values here — the test should verify
        // that each session's contribution uses the correct g[] value.
        // The expected object is used by higher-level checks only.
        var expected = new ExpectedOutputs { AsOfUtc = asOf };
        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-04: Redo within 7 days → must NOT count
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-04: Same exercise solved twice, 3 days apart (< 7-day spacing).
    /// The second solve is a redo but within the spacing window → RedoPoints += 0.
    /// PointsAllTime = first-solve points only.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC04_RedoWithin7Days()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        var firstSolve = AcceptedSession("ex-redo-01", "arrays", "basic",
            asOf.AddDays(-10).UtcDateTime, 20.0, 1);
        // 3 days later — within 7-day spacing → does NOT count as valid redo
        var redoTooSoon = AcceptedSession("ex-redo-01", "arrays", "basic",
            asOf.AddDays(-7).UtcDateTime, 18.0, 1);

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession> { firstSolve, redoTooSoon },
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // P0 * w_micro(1.0) * f_basic(1.0) * q_conv(1 attempt → g[0]=1.00) = 4.0 * 1.0 * 1.0 * 1.0 = 4.0
        // Redo: spacing = 3 days < 7 → R_valid = 0 → RedoPoints = 0
        // McqPoints = 0.8 * sqrt(0) = 0
        var expected = new ExpectedOutputs
        {
            AsOfUtc       = asOf,
            PointsAllTime = 4.0,  // first solve only
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-05: Redo outside 7 days → must count
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-05: Same exercise solved twice, 10 days apart (> 7-day spacing).
    /// Second solve IS a valid redo → RedoPoints = Predo * w * f_d * ln(1+1) > 0.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC05_RedoOutside7Days()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        var firstSolve = AcceptedSession("ex-redo-02", "arrays", "basic",
            asOf.AddDays(-15).UtcDateTime, 20.0, 1);
        // 10 days later — outside 7-day spacing → counts as valid redo
        var validRedo = AcceptedSession("ex-redo-02", "arrays", "basic",
            asOf.AddDays(-5).UtcDateTime, 18.0, 1);

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession> { firstSolve, validRedo },
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // P0 * 1.0 * 1.0 * 1.00 = 4.0  (first solve, q_conv A1)
        // Predo * 1.0 * 1.0 * ln(1+1) = 2.5 * ln(2) ≈ 1.7329
        // McqPoints = 0
        var expected = new ExpectedOutputs
        {
            AsOfUtc = asOf,
            PointsAllTime = Math.Round(4.0 + 2.5 * Math.Log(2.0), 4),
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-06: MCQ U_all = 0 → McqPoints = 0
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-06: UniqueCorrectMcqAllTime = 0.
    /// McqPoints = Pmcq * sqrt(0) = 0.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC06_McqUallIsZero()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession>(),
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // PointsAllTime = CodingPoints(0) + RedoPoints(0) + McqPoints(0.8*sqrt(0)=0) = 0
        var expected = new ExpectedOutputs
        {
            AsOfUtc       = asOf,
            PointsAllTime = 0.0,
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-07: TimeToACMinutes missing → derived from last attempt's TimeToSubmissionMinutes
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-07: CodingSession has TimeToACMinutes = null.
    /// The backend must fall back to Attempts[acceptedIndex].TimeToSubmissionMinutes.
    /// The evidence contribution must use that derived time value.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC07_TimeToACDerivedFromAttempt()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        // Session without explicit TimeToACMinutes — should derive from attempt
        var session = new CodiviumScoring.CodingSession
        {
            ExerciseId    = "ex-notac-01",
            CategoryId    = "arrays",
            Difficulty    = "basic",
            UnitTestsTotal= 10,
            CompletedAtUtc= asOf.AddDays(-1).UtcDateTime,
            TimeToACMinutes = null,   // ← deliberately null
            Attempts = new List<CodiviumScoring.SubmissionAttempt>
            {
                new() { UnitTestsPassed = 0,  TimeToSubmissionMinutes = 15.0 },
                new() { UnitTestsPassed = 10, TimeToSubmissionMinutes = 28.0 },  // accepted at 28 min
            }
        };

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession> { session },
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // Must not throw — the backend should use 28.0 minutes as tCorrect.
        // We do not prescribe an exact output; the test verifies no exception and D/B > 0.
        var expected = new ExpectedOutputs
        {
            AsOfUtc    = asOf,
            DepthMicro = null, // > 0 (just verify it rendered without throwing)
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-08: Last accepted attempt is not the first (fail-pass-fail-pass)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-08: Attempts = [fail, pass, fail, pass].
    /// "Keep last accepted" logic means acceptedAttemptIndex = 3, attemptsToAC = 4.
    /// q_tries = clamp(1/sqrt(4), 0.45, 1.0) = clamp(0.5, 0.45, 1.0) = 0.5
    /// q_conv  = g[min(4,6)-1] = g[3] = 0.78
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC08_LastAcceptedNotFirst()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        var session = new CodiviumScoring.CodingSession
        {
            ExerciseId     = "ex-multipass-01",
            CategoryId     = "arrays",
            Difficulty     = "basic",
            UnitTestsTotal = 10,
            CompletedAtUtc = asOf.AddDays(-1).UtcDateTime,
            TimeToACMinutes= 40.0,
            Attempts = new List<CodiviumScoring.SubmissionAttempt>
            {
                new() { UnitTestsPassed = 0,  TimeToSubmissionMinutes = 10.0 }, // fail
                new() { UnitTestsPassed = 10, TimeToSubmissionMinutes = 20.0 }, // pass
                new() { UnitTestsPassed = 0,  TimeToSubmissionMinutes = 30.0 }, // fail (re-submitted after passing!)
                new() { UnitTestsPassed = 10, TimeToSubmissionMinutes = 40.0 }, // pass again (last)
            }
        };

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession> { session },
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // q_tries = clamp(1/sqrt(4), 0.45, 1.0) = 0.5
        // q_conv  = g[3] = 0.78
        // q_time  = clamp(exp(-40/90), 0.6, 1.0) = clamp(0.6407, 0.6, 1.0) = 0.6407
        // decay   = 0.5^(1/15) ≈ 0.9548
        // contrib = 1.0 * 0.5 * 0.78 * 0.6407 * 1.0 * 0.9548
        // firstTryPass = 0% (4 attempts → not first try)
        var expected = new ExpectedOutputs
        {
            AsOfUtc          = asOf,
            FirstTryPassRate = 0.0,
            AvgAttemptsToAC  = 4.0,  // exactly 4 attempts (last accepted index + 1)
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-09: All sessions in one category → balance = 0, low breadth
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-09: All micro sessions are in "arrays" only. All 3 categories exist.
    /// coverage = 1/3.
    /// balance = 0 (entropy of a 1-element distribution = 0 → bal = 0/log(3) = 0).
    /// B_micro = 100 * conf * (alpha * 1/3 + beta * 0) = 100 * conf * 0.65/3
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC09_AllSessionsInOneCategory()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        // 6 sessions all in "arrays" — spread over 30 days to get meaningful evidence
        var sessions = new List<CodiviumScoring.CodingSession>();
        for (var i = 0; i < 6; i++)
        {
            sessions.Add(AcceptedSession($"ex-arr-{i}", "arrays", "basic",
                asOf.AddDays(-(i + 1)).UtcDateTime, 20.0, 1));
        }

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = sessions,
                ["interview"] = new List<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // balance = 0 because all evidence in one category
        // breadth must be lower than if sessions were spread across all 3 categories
        var expected = new ExpectedOutputs
        {
            AsOfUtc  = asOf,
            // We do not prescribe a specific number here; the test verifies BreadthMicro > 0
            // but also verifies BreadthMicro < an equivalent fixture with spread sessions
        };

        return (raw, expected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-10: Exactly one session → confidence stabilizer dampens breadth
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// EC-10: One session per track. Very low total evidence.
    /// Confidence stabilizer: conf = 1 - exp(-T/k).
    /// With T tiny and k=10 (micro), conf is small → breadth is small.
    /// Verifies the stabilizer prevents early-user score inflation.
    /// </summary>
    public static (CodiviumScoring.CodiviumRawData raw, ExpectedOutputs expected)
        EC10_SingleSessionPerTrack()
    {
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var cfg = MiniConfig();

        var microSession = AcceptedSession("ex-m-01", "arrays", "basic",
            asOf.AddDays(-1).UtcDateTime, 15.0, 1);
        var interviewSession = AcceptedSession("ex-i-01", "arrays", "basic",
            asOf.AddDays(-1).UtcDateTime, 20.0, 1);

        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 5,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<CodiviumScoring.CodingSession> { microSession },
                ["interview"] = new List<CodiviumScoring.CodingSession> { interviewSession }
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>
            {
                ["mcq"] = new List<CodiviumScoring.McqAttempt>()
            }
        };

        // conf_micro = 1 - exp(-E_micro / 10) where E_micro is a small number
        // conf < 0.1 for very small E → breadth < 100 * 0.1 * 0.65/3 ≈ 2.2
        // Just assert breadth is non-zero but < 10
        var expected = new ExpectedOutputs
        {
            AsOfUtc = asOf,
            // Breadth will be > 0 (there is evidence) but significantly dampened
            // Exact values checked in test code
        };

        return (raw, expected);
    }
}

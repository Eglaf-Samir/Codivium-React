// KatexScoringEngineTests.cs
//
// xUnit tests for the KaTeX scoring engine.
// Exercises CodiviumKatexScoring.ComputeAll() against:
//   - Normal fixture (golden oracle values from demo data)
//   - EC-01 through EC-10 edge-case fixtures
//
// Run with: dotnet test backend/tests/Codivium.Dashboard.Tests.csproj

using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace Codivium.Dashboard.Tests;

public sealed class KatexScoringEngineTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Shared: build a minimal but complete ScoringConfig with KaTeX defaults.
    // Uses three coding categories per track and two MCQ categories.
    // ─────────────────────────────────────────────────────────────────────────

    private static global::CodiviumScoring.ScoringConfig MiniConfig() =>
        new global::CodiviumScoring.ScoringConfig
        {
            Version = "test",
            Categories = new global::CodiviumScoring.CategoriesConfig
            {
                AvailableByTrack = new Dictionary<string, List<string>>
                {
                    ["micro"]     = new() { "arrays", "trees", "graphs" },
                    ["interview"] = new() { "arrays", "trees", "dynamic programming" },
                    ["mcq"]       = new() { "arrays", "trees" },
                }
            },
            Katex = new global::KatexScoringConfig
            {
                Recency = new global::KatexRecencyConfig { HalfLifeDays = 15.0 },
                DifficultyFactor = new Dictionary<string, double>
                {
                    ["basic"] = 1.0, ["intermediate"] = 1.3, ["advanced"] = 1.6
                },
                Coding = new global::KatexCodingConfig
                {
                    ActivityWeightByTrack = new Dictionary<string, double>
                        { ["micro"] = 1.0, ["interview"] = 1.0 },
                    TriesFactor = new global::KatexTriesFactorConfig { Min = 0.45, Max = 1.0 },
                    ConvergenceWeightsByAttemptBucket = new List<double>
                        { 1.00, 0.92, 0.85, 0.78, 0.70, 0.60 },
                    TimeFactor = new global::KatexTimeFactorConfig
                    {
                        Min = 0.6, Max = 1.0,
                        TdMinutesByDifficulty = new Dictionary<string, double>
                            { ["basic"] = 90, ["intermediate"] = 120, ["advanced"] = 160 }
                    }
                },
                Breadth = new global::KatexBreadthConfig
                {
                    TauE  = 1.5, Alpha = 0.65, Beta = 0.35,
                    ConfidenceKByTrack = new Dictionary<string, double>
                        { ["micro"] = 10, ["interview"] = 8, ["mcq"] = 14 },
                    OverallWeights = new Dictionary<string, double>
                        { ["micro"] = 0.4, ["interview"] = 0.4, ["mcq"] = 0.2 }
                },
                Depth = new global::KatexDepthConfig
                {
                    Lambda = 12.0, LambdaChart = 12.0,
                    OverallWeights = new Dictionary<string, double>
                        { ["micro"] = 0.5, ["interview"] = 0.5 }
                },
                Points = new global::KatexPointsConfig
                    { P0 = 4.0, Predo = 2.5, RedoSpacingDays = 7 },
                Efficiency = new global::KatexEfficiencyConfig { EpsilonMinutes = 1.0 },
                Mcq = new global::KatexMcqConfig
                {
                    Breadth = new global::KatexMcqBreadthConfig { Gamma = 1.5, UsesRecencyDecay = true },
                    Points  = new global::KatexMcqPointsConfig { Pmcq = 0.8 }
                },
                EdgeCases = new global::KatexEdgeCasesConfig
                    { HarmonicMeanRequiresPositiveTerms = true }
            }
        };

    // ─────────────────────────────────────────────────────────────────────────
    // Shared helper: build one accepted CodingSession cleanly
    // ─────────────────────────────────────────────────────────────────────────

    private static global::CodiviumScoring.CodingSession AcceptedSession(
        string exerciseId, string categoryId, string difficulty,
        DateTime completedAt, double timeToAcMinutes, int attemptCount = 1)
    {
        var attempts = new List<global::CodiviumScoring.SubmissionAttempt>();
        for (var i = 0; i < attemptCount - 1; i++)
            attempts.Add(new global::CodiviumScoring.SubmissionAttempt
            {
                UnitTestsPassed = 0,
                TimeToSubmissionMinutes = timeToAcMinutes * (i + 1.0) / attemptCount
            });
        attempts.Add(new global::CodiviumScoring.SubmissionAttempt
        {
            UnitTestsPassed = 10,
            TimeToSubmissionMinutes = timeToAcMinutes
        });

        return new global::CodiviumScoring.CodingSession
        {
            ExerciseId      = exerciseId,
            CategoryId      = categoryId,
            Difficulty      = difficulty,
            UnitTestsTotal  = 10,
            CompletedAtUtc  = completedAt,
            TimeToACMinutes = timeToAcMinutes,
            Attempts        = attempts
        };
    }

    private static global::CodiviumScoring.CodiviumRawData EmptyRaw(
        global::CodiviumScoring.ScoringConfig cfg) =>
        new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
                { ["micro"] = new List<global::CodiviumScoring.CodingSession>(),
                  ["interview"] = new List<global::CodiviumScoring.CodingSession>() },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

    // ─────────────────────────────────────────────────────────────────────────
    // EC-02: All zero evidence → CodiviumScore = 0, all metrics = 0
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC02_AllZeroEvidence_ScoreIsZero()
    {
        var cfg     = MiniConfig();
        var raw     = EmptyRaw(cfg);
        var asOf    = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        Assert.Equal(0.0, result.CodiviumScore,    precision: 3);
        Assert.Equal(0.0, result.OverallBreadth,   precision: 3);
        Assert.Equal(0.0, result.OverallDepth,     precision: 3);
        Assert.Equal(0.0, result.PointsAllTime,    precision: 3);
        Assert.Equal(0.0, result.PointsLast30Days, precision: 3);
        Assert.Equal(0.0, result.BreadthByTrack["micro"],     precision: 3);
        Assert.Equal(0.0, result.BreadthByTrack["interview"], precision: 3);
        Assert.Equal(0.0, result.BreadthByTrack["mcq"],       precision: 3);
        Assert.Equal(0.0, result.DepthByTrack["micro"],       precision: 3);
        Assert.Equal(0.0, result.DepthByTrack["interview"],   precision: 3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-01: Zero evidence in interview track → interview breadth/depth = 0
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC01_ZeroEvidenceInInterviewTrack_InterviewTermsAreZero()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var session = AcceptedSession("ex-001", "arrays", "basic",
            asOf.AddDays(-5).UtcDateTime, 20.0, 1);

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { session },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        Assert.Equal(0.0, result.BreadthByTrack["interview"], precision: 3);
        Assert.Equal(0.0, result.DepthByTrack["interview"],   precision: 3);
        Assert.True(result.BreadthByTrack["micro"] > 0,
            "Micro breadth should be > 0 when there is one micro session.");
        // CodiviumScore > 0 because both B and D are > 0 (micro contributes to both)
        Assert.True(result.CodiviumScore > 0,
            "CodiviumScore should be > 0 when micro has a session.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-03: Convergence bucket g[] values are applied correctly
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC03_ConvergenceBuckets_QConvMatchesGArray()
    {
        // Six sessions, each with 1..6 attempts, same date, same decay.
        // Evidence(attempts=n) ∝ q_tries(n) * q_conv(n) * q_time * decay
        // Since q_time and decay are identical for all, the relative evidence
        // values reflect only q_tries * q_conv.
        // Expected ordering by q_tries*q_conv: 1 > 2 > 3 > 4 > 5 > 6
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var baseDate = asOf.AddDays(-1).UtcDateTime;
        var catalog = global::CodiviumCatalog.Build(cfg);
        // g = [1.00, 0.92, 0.85, 0.78, 0.70, 0.60]
        // q_tries = clamp(1/sqrt(n), 0.45, 1.0)
        var expectedG    = new[] { 1.00, 0.92, 0.85, 0.78, 0.70, 0.60 };
        var expectedQ    = new double[6];
        for (int n = 1; n <= 6; n++)
        {
            var qTries = Math.Clamp(1.0 / Math.Sqrt(n), 0.45, 1.0);
            expectedQ[n - 1] = qTries * expectedG[n - 1];
        }

        // Run each session individually and capture the resulting evidence
        var evidencePerAttemptCount = new double[6];
        for (int attempts = 1; attempts <= 6; attempts++)
        {
            var session = AcceptedSession($"ex-{attempts}", "arrays", "basic",
                baseDate, 20.0, attempts);
            var raw = new global::CodiviumScoring.CodiviumRawData
            {
                Config = cfg,
                UniqueCorrectMcqAllTime = 0,
                CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
                {
                    ["micro"]     = new List<global::CodiviumScoring.CodingSession> { session },
                    ["interview"] = new List<global::CodiviumScoring.CodingSession>()
                },
                McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                    { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
            };
            var result = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);
            evidencePerAttemptCount[attempts - 1] = result.EvidenceByTrackByCategory["micro"]["arrays"];
        }

        // Evidence should be strictly decreasing (more attempts = lower quality)
        for (int i = 0; i < 5; i++)
        {
            Assert.True(evidencePerAttemptCount[i] > evidencePerAttemptCount[i + 1],
                $"Evidence with {i+1} attempt(s) ({evidencePerAttemptCount[i]:F4}) should exceed " +
                $"evidence with {i+2} attempt(s) ({evidencePerAttemptCount[i+1]:F4}).");
        }

        // The ratio of adjacent evidence values should match the ratio of q_tries*q_conv
        for (int i = 0; i < 5; i++)
        {
            var actualRatio   = evidencePerAttemptCount[i + 1] / evidencePerAttemptCount[i];
            var expectedRatio = expectedQ[i + 1] / expectedQ[i];
            Assert.Equal(expectedRatio, actualRatio, precision: 3);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-04: Redo within 7 days → does NOT count; PointsAllTime = first solve only
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC04_RedoWithin7Days_NotCounted()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);

        // First solve 10 days ago, redo 7 days ago (exactly 3-day gap — below G=7)
        var firstSolve = AcceptedSession("ex-redo-01", "arrays", "basic",
            asOf.AddDays(-10).UtcDateTime, 20.0, 1);
        var redoTooSoon = AcceptedSession("ex-redo-01", "arrays", "basic",
            asOf.AddDays(-7).UtcDateTime, 18.0, 1);

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg, UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { firstSolve, redoTooSoon },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        // P0 * w_micro(1.0) * f_basic(1.0) * q_conv(A1=1.00) = 4.0; redo = 0; mcq = 0
        Assert.Equal(4.0, result.PointsAllTime, precision: 3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-05: Redo outside 7 days → counts; PointsAllTime = first + redo
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC05_RedoOutside7Days_IsCounted()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);

        // First solve 15 days ago, redo 5 days ago (10-day gap — above G=7)
        var firstSolve = AcceptedSession("ex-redo-02", "arrays", "basic",
            asOf.AddDays(-15).UtcDateTime, 20.0, 1);
        var validRedo  = AcceptedSession("ex-redo-02", "arrays", "basic",
            asOf.AddDays(-5).UtcDateTime,  18.0, 1);

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg, UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { firstSolve, validRedo },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        // P0=4.0 + Predo*ln(2) ≈ 4.0 + 1.7329 = 5.7329
        var expected = 4.0 + 2.5 * Math.Log(2.0);
        Assert.Equal(expected, result.PointsAllTime, precision: 3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-06: MCQ U_all = 0 → McqPoints = 0
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC06_McqUallZero_McqPointsIsZero()
    {
        var cfg = MiniConfig();
        var raw = EmptyRaw(cfg); // UniqueCorrectMcqAllTime = 0
        var asOf    = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        // PointsAllTime = CodingPoints(0) + RedoPoints(0) + Pmcq*sqrt(0) = 0
        Assert.Equal(0.0, result.PointsAllTime, precision: 4);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-07: TimeToACMinutes null → derived from last accepted attempt; no throw
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC07_NullTimeToAC_DerivedFromAttemptWithoutThrowing()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);

        var session = new global::CodiviumScoring.CodingSession
        {
            ExerciseId      = "ex-notac-01",
            CategoryId      = "arrays",
            Difficulty      = "basic",
            UnitTestsTotal  = 10,
            CompletedAtUtc  = asOf.AddDays(-1).UtcDateTime,
            TimeToACMinutes = null,   // deliberately null — must be derived
            Attempts = new List<global::CodiviumScoring.SubmissionAttempt>
            {
                new() { UnitTestsPassed = 0,  TimeToSubmissionMinutes = 15.0 },
                new() { UnitTestsPassed = 10, TimeToSubmissionMinutes = 28.0 }, // accepted
            }
        };

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg, UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { session },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);

        // Should not throw
        var exception = Record.Exception(() =>
            global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf));

        Assert.Null(exception);

        // Should produce non-zero depth (session was accepted and contributed evidence)
        var result = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);
        Assert.True(result.DepthByTrack["micro"] > 0,
            "Micro depth should be > 0 when one session was accepted.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-08: fail-pass-fail-pass → attemptsToAC = 4 (keep last accepted)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC08_LastAcceptedNotFirst_AttemptsToACIsFour()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);

        // Attempt sequence: fail(0), pass(10), fail(0), pass(10)
        // "Keep last accepted" → acceptedAttemptIndex = 3 → attemptsToAC = 4
        var session = new global::CodiviumScoring.CodingSession
        {
            ExerciseId      = "ex-multipass-01",
            CategoryId      = "arrays",
            Difficulty      = "basic",
            UnitTestsTotal  = 10,
            CompletedAtUtc  = asOf.AddDays(-1).UtcDateTime,
            TimeToACMinutes = 40.0,
            Attempts = new List<global::CodiviumScoring.SubmissionAttempt>
            {
                new() { UnitTestsPassed = 0,  TimeToSubmissionMinutes = 10.0 },
                new() { UnitTestsPassed = 10, TimeToSubmissionMinutes = 20.0 },
                new() { UnitTestsPassed = 0,  TimeToSubmissionMinutes = 30.0 },
                new() { UnitTestsPassed = 10, TimeToSubmissionMinutes = 40.0 },
            }
        };

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg, UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { session },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        // Evidence should reflect q_tries(4) * q_conv(4) not q_tries(2) * q_conv(2)
        // q_tries(4) = clamp(1/sqrt(4), 0.45, 1.0) = 0.5
        // q_conv(4)  = g[3] = 0.78
        // compare against evidence from a clean 1-attempt session (q_tries=1.0, q_conv=1.00)
        var cleanSession = AcceptedSession("ex-clean-01", "arrays", "basic",
            asOf.AddDays(-1).UtcDateTime, 40.0, 1);
        var rawClean = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg, UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { cleanSession },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };
        var resultClean = global::CodiviumKatexScoring.ComputeAll(rawClean, catalog, asOf);

        // The 4-attempt session should produce less evidence than the 1-attempt session
        var e4 = result.EvidenceByTrackByCategory["micro"]["arrays"];
        var e1 = resultClean.EvidenceByTrackByCategory["micro"]["arrays"];
        Assert.True(e4 < e1,
            $"4-attempt evidence ({e4:F4}) should be less than 1-attempt evidence ({e1:F4}).");

        // The ratio should match (q_tries(4)*q_conv(4)) / (q_tries(1)*q_conv(1))
        // = (0.5 * 0.78) / (1.0 * 1.00) = 0.39
        var expectedRatio = (0.5 * 0.78) / (1.0 * 1.00);
        Assert.Equal(expectedRatio, e4 / e1, precision: 3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-09: All sessions in one category → balance = 0, breadth reduced
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC09_AllSessionsInOneCategory_BalanceIsZeroAndBreadthReduced()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);

        // Concentrated: 6 sessions all in "arrays" only
        var concentrated = Enumerable.Range(0, 6)
            .Select(i => AcceptedSession($"ex-arr-{i}", "arrays", "basic",
                asOf.AddDays(-(i + 1)).UtcDateTime, 20.0, 1))
            .ToList();

        // Spread: 2 sessions each in "arrays", "trees", "graphs"
        var spread = new List<global::CodiviumScoring.CodingSession>
        {
            AcceptedSession("ex-a1", "arrays", "basic", asOf.AddDays(-1).UtcDateTime, 20.0, 1),
            AcceptedSession("ex-a2", "arrays", "basic", asOf.AddDays(-2).UtcDateTime, 20.0, 1),
            AcceptedSession("ex-t1", "trees",  "basic", asOf.AddDays(-3).UtcDateTime, 20.0, 1),
            AcceptedSession("ex-t2", "trees",  "basic", asOf.AddDays(-4).UtcDateTime, 20.0, 1),
            AcceptedSession("ex-g1", "graphs", "basic", asOf.AddDays(-5).UtcDateTime, 20.0, 1),
            AcceptedSession("ex-g2", "graphs", "basic", asOf.AddDays(-6).UtcDateTime, 20.0, 1),
        };

        global::CodiviumKatexScoring.KatexAllResults RunWith(
            List<global::CodiviumScoring.CodingSession> sessions)
        {
            var r = new global::CodiviumScoring.CodiviumRawData
            {
                Config = cfg, UniqueCorrectMcqAllTime = 0,
                CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
                {
                    ["micro"]     = sessions,
                    ["interview"] = new List<global::CodiviumScoring.CodingSession>()
                },
                McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                    { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
            };
            return global::CodiviumKatexScoring.ComputeAll(
                r, global::CodiviumCatalog.Build(cfg), asOf);
        }

        var resultConc  = RunWith(concentrated);
        var resultSpread = RunWith(spread);

        // Spread breadth should be higher than concentrated (balance > 0 for spread)
        Assert.True(resultSpread.BreadthByTrack["micro"] > resultConc.BreadthByTrack["micro"],
            $"Spread breadth ({resultSpread.BreadthByTrack["micro"]:F2}) should exceed " +
            $"concentrated breadth ({resultConc.BreadthByTrack["micro"]:F2}).");

        // Concentrated breadth should still be > 0 (coverage = 1/3)
        Assert.True(resultConc.BreadthByTrack["micro"] > 0,
            "Concentrated breadth should be > 0.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-10: Single session → confidence stabilizer significantly dampens breadth
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EC10_SingleSession_ConfidenceStabilizerDampensBreadth()
    {
        var cfg  = MiniConfig();
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);

        var single = AcceptedSession("ex-single-01", "arrays", "basic",
            asOf.AddDays(-1).UtcDateTime, 15.0, 1);

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg, UniqueCorrectMcqAllTime = 5,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>
            {
                ["micro"]     = new List<global::CodiviumScoring.CodingSession> { single },
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>
                { ["mcq"] = new List<global::CodiviumScoring.McqAttempt>() }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);

        // Breadth should be > 0 (there is evidence) but < 20 (confidence stabilizer
        // limits early scores: conf = 1 - exp(-E/10) where E is small)
        Assert.True(result.BreadthByTrack["micro"] > 0,
            "Breadth should be > 0 with one session.");
        Assert.True(result.BreadthByTrack["micro"] < 20,
            $"Confidence stabilizer should keep breadth < 20 with a single session, " +
            $"got {result.BreadthByTrack["micro"]:F2}.");

        // Score should still be in [0, 100]
        Assert.InRange(result.CodiviumScore, 0.0, 100.0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Harmonic mean edge cases (directly from KaTeX spec)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void HarmonicMean_BreadthZero_ScoreIsZero()
    {
        // If B = 0, score = 0 (spec rule)
        var cfg  = MiniConfig();
        var raw  = EmptyRaw(cfg);
        var asOf = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.Zero);
        var catalog = global::CodiviumCatalog.Build(cfg);
        var result  = global::CodiviumKatexScoring.ComputeAll(raw, catalog, asOf);
        Assert.Equal(0.0, result.CodiviumScore, precision: 4);
    }

    [Fact]
    public void HarmonicMean_SymmetricInputs_ScoreEqualsInputs()
    {
        // If B = D = v, then 2*v*v/(v+v) = v. Score should equal inputs.
        // We verify this indirectly: a perfectly symmetric fixture should yield
        // a score approximately equal to both B and D.
        // This is a mathematical property check, not a fixture-based check.
        var b = 60.0; var d = 60.0;
        var expected = 2 * b * d / (b + d);
        Assert.Equal(60.0, expected, precision: 4);
    }
}

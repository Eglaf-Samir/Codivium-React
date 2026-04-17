using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace Codivium.Dashboard.Tests;

public sealed class RecommendedActionsTests
{
    [Fact]
    public void BuildFromKatex_CreatesOneActionPerPanel()
    {
        // Minimal config + categories availability.
        var cfg = new global::CodiviumScoring.ScoringConfig
        {
            Version = "test",
            Categories = new global::CodiviumScoring.CategoriesConfig
            {
                AvailableByTrack = new Dictionary<string, List<string>>
                {
                    ["micro"] = new List<string> { "Arrays", "Strings" },
                    ["interview"] = new List<string> { "Trees" },
                    ["mcq"] = new List<string> { "Arrays", "Trees" }
                }
            },
            Heatmap = new global::CodiviumScoring.HeatmapConfig
            {
                Buckets = new List<string> { "A1", "A2", "A3", "A4", "A5", "A6" },
                FocusModes = new global::CodiviumScoring.HeatmapFocusModesConfig
                {
                    DefaultMode = "impact",
                    Modes = new List<global::CodiviumScoring.HeatmapFocusModeConfig>
                    {
                        new() { Id = "impact", Label = "Impact", Description = "d", IsDefault = true }
                    }
                }
            },
            Katex = new global::CodiviumKatexConfig
            {
                Breadth = new global::KatexBreadthConfig
                {
                    TauE = 1.5,
                    Alpha = 0.65,
                    Beta = 0.35,
                    ConfidenceKByTrack = new Dictionary<string, double>
                    {
                        ["micro"] = 10,
                        ["interview"] = 8,
                        ["mcq"] = 14
                    }
                }
            }
        };

        var catalog = global::CodiviumCatalog.Build(cfg);

        var payload = new Codivium.Dashboard.DashboardPayloadV2
        {
            Meta = new Codivium.Dashboard.DashboardMeta { SessionStartEndpoint = "/api/sessions/start" },
            Overall = new Codivium.Dashboard.OverallNamespace
            {
                Metrics = new Codivium.Dashboard.OverallMetricsDto
                {
                    CodiviumScore = 50,
                    BreadthOverall = 40,
                    DepthOverall = 60,
                    CodiviumPoints30 = 10,
                    CodiviumPointsAll = 100,
                    EfficiencyPtsPerHr = 3
                },
                TimeOnPlatform = new Codivium.Dashboard.TimeOnPlatformDto
                {
                    Daily = new List<Codivium.Dashboard.DailyMinutesDto>
                    {
                        new() { Day = "2026-03-01", Minutes = 10 },
                        new() { Day = "2026-03-02", Minutes = 10 },
                        new() { Day = "2026-03-03", Minutes = 10 }
                    }
                }
            },
            CombinedCoding = new Codivium.Dashboard.TrackNamespace
            {
                Allocation = new List<Codivium.Dashboard.AllocationRowDto>
                {
                    new() { Category = "Arrays", Minutes = 100, Solved = 3 }
                },
                DepthByCategory = new List<Codivium.Dashboard.DepthRowDto>
                {
                    new() { Category = "Arrays", Depth = 70 },
                    new() { Category = "Trees", Depth = 10 }
                },
                ConvergenceHeatmap = new Codivium.Dashboard.ConvergenceHeatmapDto
                {
                    Categories = new List<string> { "Arrays", "Trees" },
                    Buckets = new List<string> { "A1", "A2", "A3", "A4", "A5", "A6" },
                    Counts = new List<List<int>>
                    {
                        new() { 5, 1, 0, 0, 0, 0 }, // Arrays (fast)
                        new() { 0, 0, 1, 2, 3, 4 }  // Trees (slow)
                    }
                }
            },
            Mcq = new Codivium.Dashboard.McqNamespace
            {
                Mcq = new global::CodiviumMcq.McqPayload
                {
                    ByDifficulty = new global::CodiviumMcq.ByDifficultyPayload
                    {
                        Basic = new Dictionary<string, double> { ["Arrays"] = 80, ["Trees"] = 50 },
                        Intermediate = new Dictionary<string, double> { ["Arrays"] = 70, ["Trees"] = 40 },
                        Advanced = new Dictionary<string, double> { ["Arrays"] = 60, ["Trees"] = 30 }
                    },
                    ByDifficultyEvidence = new global::CodiviumMcq.ByDifficultyEvidencePayload
                    {
                        Basic = new Dictionary<string, global::CodiviumMcq.EvidenceCell> { ["Arrays"] = new() { Attempts = 10, Correct = 8, Percent = 80 } },
                        Intermediate = new Dictionary<string, global::CodiviumMcq.EvidenceCell> { ["Arrays"] = new() { Attempts = 10, Correct = 7, Percent = 70 } },
                        Advanced = new Dictionary<string, global::CodiviumMcq.EvidenceCell> { ["Arrays"] = new() { Attempts = 10, Correct = 6, Percent = 60 } }
                    },
                    OverallCorrect = new global::CodiviumMcq.OverallCorrectPayload { Correct = 21, Total = 30, Percent = 70 }
                }
            }
        };

        var katex = new global::CodiviumKatexScoring.KatexAllResults
        {
            CodiviumScore = 50,
            OverallBreadth = 40,
            BreadthByTrack = new Dictionary<string, double> { ["micro"] = 40, ["interview"] = 40, ["mcq"] = 40 },
            OverallDepth = 60,
            DepthByTrack = new Dictionary<string, double> { ["micro"] = 60, ["interview"] = 60 },
            PointsAllTime = 100,
            PointsLast30Days = 10,
            EfficiencyPointsPerHour = 3,
            EvidenceByTrackByCategory = new Dictionary<string, Dictionary<string, double>>
            {
                ["micro"] = new Dictionary<string, double> { ["arrays"] = 2.0, ["strings"] = 0.0 },
                ["interview"] = new Dictionary<string, double> { ["trees"] = 0.4 },
                ["mcq"] = new Dictionary<string, double> { ["arrays"] = 1.0, ["trees"] = 0.8 }
            },
            DepthChartByCategory = new Dictionary<string, double> { ["arrays"] = 70, ["trees"] = 10 }
        };

        var actions = Codivium.Dashboard.CodiviumRecommendedActions.BuildFromKatex(payload, cfg, catalog, katex);

        Assert.Equal(5, actions.Count);

        var panels = actions.Select(a => a.PanelId).ToHashSet(StringComparer.OrdinalIgnoreCase);
        Assert.True(panels.SetEquals(new[] { "heatmap", "allocation", "depth", "time", "mcq" }),
            "Expected exactly one CTA per panel: heatmap, allocation, depth, time, mcq.");
    }

    [Fact]
    public void Build_Fallback_IsStillAvailable()
    {
        var cfg = new global::CodiviumScoring.ScoringConfig
        {
            Version = "test",
            Categories = new global::CodiviumScoring.CategoriesConfig
            {
                AvailableByTrack = new Dictionary<string, List<string>>
                {
                    ["micro"] = new List<string> { "Arrays" },
                    ["interview"] = new List<string> { "Trees" },
                    ["mcq"] = new List<string>()
                }
            }
        };

        var payload = new Codivium.Dashboard.DashboardPayloadV2
        {
            Meta = new Codivium.Dashboard.DashboardMeta { SessionStartEndpoint = "/api/sessions/start" },
            CombinedCoding = new Codivium.Dashboard.TrackNamespace
            {
                Allocation = new List<Codivium.Dashboard.AllocationRowDto>
                {
                    new() { Category = "Arrays", Minutes = 100, Solved = 3 }
                },
                DepthByCategory = new List<Codivium.Dashboard.DepthRowDto>
                {
                    new() { Category = "Trees", Depth = 10 }
                },
                ConvergenceHeatmap = new Codivium.Dashboard.ConvergenceHeatmapDto
                {
                    Categories = new List<string> { "Arrays" },
                    Buckets = new List<string> { "A1" },
                    Counts = new List<List<int>> { new() { 1 } }
                }
            }
        };

        var actions = Codivium.Dashboard.CodiviumRecommendedActions.Build(payload, cfg);

        Assert.True(actions.Count >= 1, "Fallback Build() should still return at least one CTA.");
    }
}

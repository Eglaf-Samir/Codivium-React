using System;
using System.Collections.Generic;
using Xunit;

namespace Codivium.Dashboard.Tests;

public sealed class PayloadAdapterSmokeTests
{
    [Fact]
    public void BuildFromRaw_ProducesFocusAndRecommendedActions()
    {
        var cfg = new global::CodiviumScoring.ScoringConfig
        {
            Version = "test",
            Categories = new global::CodiviumScoring.CategoriesConfig
            {
                AvailableByTrack = new Dictionary<string, List<string>>
                {
                    ["micro"] = new List<string> { "Arrays" },
                    ["interview"] = new List<string> { "Arrays" },
                    ["mcq"] = new List<string>()
                },
                DisplayOrder = new List<string> { "Arrays" }
            },
            Heatmap = new global::CodiviumScoring.HeatmapConfig
            {
                Buckets = new List<string> { "A1", "A2", "A3", "A4", "A5" },
                FocusModes = new global::CodiviumScoring.HeatmapFocusModesConfig
                {
                    DefaultMode = "impact",
                    Modes = new List<global::CodiviumScoring.HeatmapFocusModeConfig>
                    {
                        new() { Id = "impact", Label = "Impact", Description = "d", IsDefault = true }
                    }
                }
            }
        };

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>(StringComparer.OrdinalIgnoreCase)
            {
                ["micro"] = new List<global::CodiviumScoring.CodingSession>(),
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>(StringComparer.OrdinalIgnoreCase)
            {
                ["mcq"] = new List<global::CodiviumScoring.McqAttempt>()
            }
        };

        var payload = Codivium.Dashboard.DashboardPayloadV2Adapter.BuildFromRaw(
            raw,
            DateTimeOffset.UtcNow.AddDays(-30),
            DateTimeOffset.UtcNow,
            granularity: "day",
            sessionStartEndpoint: "/api/sessions/start");

        Assert.NotNull(payload.CombinedCoding);
        Assert.NotNull(payload.CombinedCoding.ConvergenceHeatmap);
        Assert.NotNull(payload.CombinedCoding.ConvergenceHeatmap.Focus);

        Assert.NotNull(payload.Overall.RecommendedActions);
        Assert.True(payload.Overall.RecommendedActions.Count > 0, "Expected at least one recommended action.");
    }
}

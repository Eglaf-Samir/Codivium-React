using System.Collections.Generic;
using Xunit;

namespace Codivium.Dashboard.Tests;

public sealed class HeatmapFocusBuilderTests
{
    [Fact]
    public void BuildFocus_UsesConfiguredModesAndProducesRankings()
    {
        var cfg = new global::CodiviumScoring.ScoringConfig
        {
            Version = "test",
            Categories = new global::CodiviumScoring.CategoriesConfig
            {
                AvailableByTrack = new Dictionary<string, List<string>>
                {
                    ["micro"] = new List<string> { "Arrays", "Strings" },
                    ["interview"] = new List<string> { "Arrays", "Trees" }
                },
                DisplayOrder = new List<string> { "Arrays", "Strings", "Trees" }
            },
            Heatmap = new global::CodiviumScoring.HeatmapConfig
            {
                Buckets = new List<string> { "A1", "A2", "A3", "A4", "A5" },
                FocusModes = new global::CodiviumScoring.HeatmapFocusModesConfig
                {
                    DefaultMode = "impact",
                    TopNDefault = 12,
                    TopNOptions = new List<int> { 8, 10, 12 },
                    Modes = new List<global::CodiviumScoring.HeatmapFocusModeConfig>
                    {
                        new() { Id = "impact", Label = "Impact", Description = "d", IsDefault = true },
                        new() { Id = "most_time", Label = "Most time", Description = "d" },
                        new() { Id = "lowest_depth", Label = "Lowest depth", Description = "d" }
                    }
                }
            }
        };

        var ns = new Codivium.Dashboard.TrackNamespace
        {
            Allocation = new List<Codivium.Dashboard.AllocationRowDto>
            {
                new() { Category = "Arrays", Minutes = 120, Solved = 5 },
                new() { Category = "Strings", Minutes = 20, Solved = 2 },
                new() { Category = "Trees", Minutes = 60, Solved = 1 }
            },
            DepthByCategory = new List<Codivium.Dashboard.DepthRowDto>
            {
                new() { Category = "Arrays", Depth = 30 },
                new() { Category = "Strings", Depth = 80 },
                new() { Category = "Trees", Depth = 10 }
            },
            ConvergenceHeatmap = new Codivium.Dashboard.ConvergenceHeatmapDto
            {
                Categories = new List<string> { "Arrays", "Strings", "Trees" },
                Buckets = new List<string> { "A1", "A2", "A3", "A4", "A5" },
                Values = new List<List<double?>>
                {
                    new() { 0.2, 0.3, 0.4, 0.6, 0.7 },
                    new() { 0.7, 0.8, 0.9, 0.9, 0.95 },
                    new() { 0.1, 0.2, 0.2, 0.3, 0.4 }
                },
                Counts = new List<List<int>>
                {
                    new() { 10, 8, 5, 2, 1 },
                    new() { 8, 5, 2, 1, 1 },
                    new() { 6, 4, 2, 1, 0 }
                }
            }
        };

        var focus = Codivium.Dashboard.CodiviumHeatmapFocusBuilder.BuildFocus(cfg, ns);

        Assert.Equal("impact", focus.DefaultModeId);
        Assert.True(focus.Rankings.ContainsKey("impact"), "Expected 'impact' ranking.");
        Assert.True(focus.Rankings.ContainsKey("most_time"), "Expected 'most_time' ranking.");
        Assert.True(focus.Rankings.ContainsKey("lowest_depth"), "Expected 'lowest_depth' ranking.");

        Assert.Equal(3, focus.Rankings["most_time"].Count);
        Assert.Equal("Arrays", focus.Rankings["most_time"][0]);
    }
}

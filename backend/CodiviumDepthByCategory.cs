// CodiviumDepthByCategory.cs
// Extracted from v37 monolith — Step A of the refactor plan.
// Computes depth-by-category chart values (combined coding, KaTeX-aligned).
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class CodiviumDepthByCategory
{
    public sealed class DashboardDepthPayload
    {
        [JsonPropertyName("depthByCategory")]
        public required List<DepthItem> DepthByCategory { get; init; }

        [JsonPropertyName("depthAvg")]
        public required double DepthAvg { get; init; }
    }

    public sealed class DepthItem
    {
        [JsonPropertyName("category")]
        public required string Category { get; init; }

        [JsonPropertyName("depth")]
        public required double Depth { get; init; }
    }

    public static Dictionary<string, double> ComputeDepthByCategory(CodiviumScoring.CodiviumRawData rawData)
    {
        return ComputeDepthByCategory(rawData, DateTimeOffset.UtcNow);
    }

    public static Dictionary<string, double> ComputeDepthByCategory(CodiviumScoring.CodiviumRawData rawData, DateTimeOffset asOfUtc)
    {
        if (rawData == null) throw new ArgumentNullException(nameof(rawData));

        var cfg = rawData.Config;
        CodiviumConfigValidation.ValidateOrThrow(cfg);

        var catalog = CodiviumCatalog.Build(cfg);

        // KaTeX-aligned depth-by-category chart:
        //   E_chart(c) = E_micro(c) + E_interview(c)
        //   D_chart(c) = 100 * (1 - exp(-E_chart(c) / lambda_chart))
        var evidence = CodiviumKatexScoring.ComputeEvidenceByTrackByCategory(rawData, catalog, asOfUtc);
        var lambdaChart = cfg.Katex.Depth.LambdaChart;

        var depthByCategory = new Dictionary<string, double>(StringComparer.Ordinal);
        foreach (var c in catalog.CodingUniverseCanonOrder)
        {
            var eMicro = (evidence.ContainsKey("micro") && evidence["micro"].TryGetValue(c, out var em)) ? em : 0.0;
            var eInterview = (evidence.ContainsKey("interview") && evidence["interview"].TryGetValue(c, out var ei)) ? ei : 0.0;
            var e = eMicro + eInterview;

            var d = e <= 0 ? 0.0 : 100.0 * (1.0 - Math.Exp(-e / lambdaChart));
            d = CodiviumScoring.Clamp(d, 0.0, 100.0);
            depthByCategory[c] = d;
        }

        return depthByCategory;
    }

    public static DashboardDepthPayload AdaptForDashboard(Dictionary<string, double> depthByCategoryCanon, CodiviumScoring.ScoringConfig cfg)
    {
        var catalog = CodiviumCatalog.Build(cfg);

        var items = catalog.CodingUniverseCanonOrder
            .Select(c => new DepthItem
            {
                Category = catalog.UniverseCanonToDisplay.TryGetValue(c, out var disp) ? disp : CodiviumCatalog.ToTitleCaseDisplay(c),
                Depth = depthByCategoryCanon.TryGetValue(c, out var v) ? Math.Round(v, 2) : 0.0
            })
            .ToList();

        double avg = items.Count == 0 ? 0.0 : items.Average(i => i.Depth);

        return new DashboardDepthPayload
        {
            DepthByCategory = items,
            DepthAvg = Math.Round(avg, 2)
        };
    }

}


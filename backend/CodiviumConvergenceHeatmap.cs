// CodiviumConvergenceHeatmap.cs
// Extracted from v37 monolith — Step E of the refactor plan.
// Builds the convergence heatmap cell-value matrix.
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class CodiviumConvergenceHeatmap
{
    public sealed class HeatmapPayload
    {
        [JsonPropertyName("categories")] public required List<string> Categories { get; init; }
        [JsonPropertyName("buckets")] public required List<string> Buckets { get; init; }
        [JsonPropertyName("values")] public required List<List<double?>> Values { get; init; } // mean ratios
        [JsonPropertyName("counts")] public List<List<int>>? Counts { get; init; }
    }

    public static HeatmapPayload BuildConvergenceHeatmap(CodiviumScoring.CodiviumRawData rawData)
    {
        var cfg = rawData.Config;

        CodiviumConfigValidation.ValidateOrThrow(cfg);
        var codingByTrackCanon = CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(rawData.CodingSessionsByTrack, nameof(rawData.CodingSessionsByTrack));
        var catalog = CodiviumCatalog.Build(cfg);

        var buckets = cfg.Heatmap.Buckets ?? new List<string> { "A1", "A2", "A3", "A4", "A5" };
        if (buckets.Count != 5) buckets = new List<string> { "A1", "A2", "A3", "A4", "A5" };

        // For each category, for each bucket index (0..4), accumulate sum of ratios and count
        var sum = new Dictionary<string, double[]>(StringComparer.Ordinal);
        var cnt = new Dictionary<string, int[]>(StringComparer.Ordinal);

        foreach (var trackCanon in CodiviumCatalog.OrderCodingTracksForProcessing(codingByTrackCanon.Keys))
        {
            if (!codingByTrackCanon.TryGetValue(trackCanon, out var sessions) || sessions is null) continue;
            var avail = catalog.GetAvailableSetForTrack(trackCanon);

            foreach (var s in sessions ?? Array.Empty<CodiviumScoring.CodingSession>())
            {
                if (s.Attempts is null || s.Attempts.Count == 0) continue;

                string catCanon = catalog.ResolveCategoryKey((s.CategoryId ?? s.CategoryLegacy) ?? "");
                if (!avail.Contains(catCanon)) continue;

                int nTests = s.UnitTestsTotal;
                if (nTests <= 0) continue;

                if (!sum.TryGetValue(catCanon, out var sums))
                {
                    sums = new double[5];
                    sum[catCanon] = sums;
                    cnt[catCanon] = new int[5];
                }
                var cnts = cnt[catCanon];

                int tries = s.Attempts.Count;
                for (int b = 0; b < 5; b++)
                {
                    if (b >= tries) break;
                    double r = CodiviumScoring.Clamp((double)s.Attempts[b].UnitTestsPassed / nTests, 0.0, 1.0);
                    sums[b] += r;
                    cnts[b] += 1;
                }
            }
        }

        // Build stable matrix aligned to current universe order
        var categoriesDisplay = catalog.CodingUniverseCanonOrder
            .Select(c => catalog.UniverseCanonToDisplay.TryGetValue(c, out var disp) ? disp : CodiviumCatalog.ToTitleCaseDisplay(c))
            .ToList();

        var values = new List<List<double?>>(categoriesDisplay.Count);
        var counts = new List<List<int>>(categoriesDisplay.Count);

        foreach (var catCanon in catalog.CodingUniverseCanonOrder)
        {
            var row = new List<double?>(5);
            var crow = new List<int>(5);

            if (sum.TryGetValue(catCanon, out var sums) && cnt.TryGetValue(catCanon, out var cnts))
            {
                for (int i = 0; i < 5; i++)
                {
                    if (cnts[i] <= 0) { row.Add(null); crow.Add(0); }
                    else { row.Add(Math.Round(sums[i] / cnts[i], 3)); crow.Add(cnts[i]); }
                }
            }
            else
            {
                for (int i = 0; i < 5; i++) { row.Add(null); crow.Add(0); }
            }

            values.Add(row);
            counts.Add(crow);
        }

        return new HeatmapPayload
        {
            Categories = categoriesDisplay,
            Buckets = buckets,
            Values = values,
            Counts = counts
        };
    }
}

// =====================================================================================
// Breadth Insights (Option B): structured insights rendered by the dashboard info pane.
// Only score keys are populated for now.
// =====================================================================================


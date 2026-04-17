// CodiviumAllocation.cs
// Extracted from v37 monolith — Step C of the refactor plan.
// Computes minutes and solved count per coding category.
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class CodiviumAllocation
{
    public sealed class AllocationRow
    {
        [JsonPropertyName("category")] public required string Category { get; init; }
        [JsonPropertyName("minutes")] public required int Minutes { get; init; }
        [JsonPropertyName("solved")] public required int Solved { get; init; }
    }

    public static List<AllocationRow> BuildAllocationByCategory(CodiviumScoring.CodiviumRawData rawData)
    {
        var cfg = rawData.Config;

        CodiviumConfigValidation.ValidateOrThrow(cfg);
        var codingByTrackCanon = CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(rawData.CodingSessionsByTrack, nameof(rawData.CodingSessionsByTrack));
        var catalog = CodiviumCatalog.Build(cfg);

        var minutesByCat = new Dictionary<string, double>(StringComparer.Ordinal);
        var solvedByCat = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var trackCanon in CodiviumCatalog.OrderCodingTracksForProcessing(codingByTrackCanon.Keys))
        {
            if (!codingByTrackCanon.TryGetValue(trackCanon, out var sessions) || sessions is null) continue;
            var avail = catalog.GetAvailableSetForTrack(trackCanon);

            foreach (var s in sessions ?? Array.Empty<CodiviumScoring.CodingSession>())
            {
                string catCanon = catalog.ResolveCategoryKey((s.CategoryId ?? s.CategoryLegacy) ?? "");
                if (!avail.Contains(catCanon)) continue;

                if (s.Attempts is null || s.Attempts.Count == 0) continue;
                var last = s.Attempts[^1];

                double minutes = last.TimeToSubmissionMinutes;
                if (!double.IsFinite(minutes) || minutes <= 0) continue;

                minutesByCat[catCanon] = minutesByCat.TryGetValue(catCanon, out var cur) ? cur + minutes : minutes;

                if (last.UnitTestsPassed == s.UnitTestsTotal)
                    solvedByCat[catCanon] = solvedByCat.TryGetValue(catCanon, out var curS) ? curS + 1 : 1;
            }
        }

        // Include all categories (stable axes), fill missing with 0
        var rows = catalog.CodingUniverseCanonOrder
            .Select(c =>
        {
            return new AllocationRow
            {
                Category = catalog.UniverseCanonToDisplay.TryGetValue(c, out var disp) ? disp : CodiviumCatalog.ToTitleCaseDisplay(c),
                Minutes = (int)Math.Round(minutesByCat.TryGetValue(c, out var m) ? m : 0.0),
                Solved = solvedByCat.TryGetValue(c, out var s) ? s : 0
            };
        }).ToList();

        return rows;
    }
}


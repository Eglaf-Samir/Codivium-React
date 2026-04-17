// CodiviumTimeOnPlatform.cs
// Extracted from v37 monolith — Step B of the refactor plan.
// Builds the daily time-on-platform series.
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class CodiviumTimeOnPlatform
{
    public sealed class TimePoint
    {
        [JsonPropertyName("date")] public required string Date { get; init; } // YYYY-MM-DD
        [JsonPropertyName("minutes")] public required int Minutes { get; init; }
    }

    public sealed class TimeOnPlatformPayload
    {
        [JsonPropertyName("daily")]
        public required List<TimePoint> Daily { get; init; }
    }

    public static TimeOnPlatformPayload BuildTimeOnPlatform(CodiviumScoring.CodiviumRawData rawData, ICodiviumClock? clock = null)
    {
        // Uses optional timestamps if present; otherwise uses list position as time proxy (last N days).
        // Aggregates solved coding sessions (time to correct) + MCQ minutesSpent (fallback: estimate 6 minutes per attempt).
        var cfg = rawData.Config;
        CodiviumConfigValidation.ValidateOrThrow(cfg);
        var codingByTrackCanon = CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(rawData.CodingSessionsByTrack, nameof(rawData.CodingSessionsByTrack));
        var mcqByTrackCanon = CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(rawData.McqAttemptsByTrack, nameof(rawData.McqAttemptsByTrack));
        var useClock = clock ?? CodiviumClocks.System;

        var catalog = CodiviumCatalog.Build(cfg);

        var byDate = new Dictionary<DateTime, double>();
        DateTime today = useClock.UtcNow.Date;

        void Add(DateTime dayUtc, double minutes)
        {
            if (minutes <= 0) return;
            if (!byDate.TryGetValue(dayUtc, out var cur)) cur = 0;
            byDate[dayUtc] = cur + minutes;
        }

        // coding sessions (all coding tracks)
        foreach (var trackCanon in CodiviumCatalog.OrderCodingTracksForProcessing(codingByTrackCanon.Keys))
        {
            if (!codingByTrackCanon.TryGetValue(trackCanon, out var sessions) || sessions is null) continue;
            var avail = catalog.GetAvailableSetForTrack(trackCanon);

            int idx = 0;
            foreach (var s in sessions ?? Array.Empty<CodiviumScoring.CodingSession>())
            {
                idx++;
                string catCanon = catalog.ResolveCategoryKey((s.CategoryId ?? s.CategoryLegacy) ?? "");
                if (!avail.Contains(catCanon)) continue;

                if (s.Attempts is null || s.Attempts.Count == 0) continue;
                var last = s.Attempts[^1];
                if (last.UnitTestsPassed != s.UnitTestsTotal) continue;
                double minutes = last.TimeToSubmissionMinutes;
                if (!double.IsFinite(minutes) || minutes <= 0) continue;

                var day = (s.CompletedAtUtc?.Date) ?? (s.StartedAtUtc?.Date);
                if (day is null)
                {
                    // Proxy: assign backwards from today
                    day = today.AddDays(-Math.Min(119, idx));
                }
                Add(day.Value, minutes);
            }
        }

        // MCQ attempts (all mcq tracks)
        foreach (var (trackCanon, attempts) in CodiviumCatalog.EnumerateMcqTracks(mcqByTrackCanon))
        {
            var avail = catalog.GetAvailableSetForTrack(trackCanon);
            int idx = 0;
            foreach (var a in attempts ?? Array.Empty<CodiviumScoring.McqAttempt>())
            {
                idx++;
                string catCanon = catalog.ResolveCategoryKey((a.CategoryId ?? a.CategoryLegacy) ?? "");
                if (!avail.Contains(catCanon)) continue;

                double minutes = (a.MinutesSpent is { } ms && double.IsFinite(ms) && ms > 0) ? ms : 6.0;
                var day = (a.CompletedAtUtc ?? a.TakenAtUtcLegacy)?.Date;
                if (day is null) day = today.AddDays(-Math.Min(119, idx));
                Add(day.Value, minutes);
            }
        }

        // Build last 120 days series (fill gaps)
        var start = today.AddDays(-119);
        var daily = new List<TimePoint>(120);
        for (int i = 0; i < 120; i++)
        {
            var day = start.AddDays(i);
            int mins = byDate.TryGetValue(day, out var m) ? (int)Math.Round(m) : 0;
            daily.Add(new TimePoint { Date = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), Minutes = mins });
        }

        return new TimeOnPlatformPayload { Daily = daily };
    }
}


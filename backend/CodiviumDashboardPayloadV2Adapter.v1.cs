// CodiviumDashboardPayloadV2Adapter.v1.cs
//
// G09 + G10 + G11:
// - Builds the canonical "dashboard-payload-v2" shape expected by the dashboard frontend.
// - Computes combinedCoding + per-track micro/interview blocks.
// - Populates missing KPI tiles: Points (all + 30d), Efficiency (pts/hr), and depth summary KPIs.
// - Builds timeOnPlatform.daily within the query window.
//
// This is a reference adapter intended to be merged into your production backend.
// It composes existing v37 calculators and maps them to the v2 DTOs (v38).

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

#nullable disable

namespace Codivium.Dashboard
{
    public static class DashboardPayloadV2Adapter
    {
        public static DashboardPayloadV2 BuildFromRaw(
            global::CodiviumScoring.CodiviumRawData rawData,
            DateTimeOffset fromUtc,
            DateTimeOffset toUtc,
            string granularity = "day",
            string sessionStartEndpoint = "/api/sessions/start",
            DashboardUiPrefs uiPrefs = null,
            global::ICodiviumClock clock = null)
        {
            if (rawData is null) throw new ArgumentNullException(nameof(rawData));
            var cfg = rawData.Config ?? throw new ArgumentException("rawData.Config is required.");

            global::CodiviumConfigValidation.ValidateOrThrow(cfg);
            var catalog = global::CodiviumCatalog.Build(cfg);

            // --- Core all-time calculators (v37) ---
            var bundle = global::CodiviumScoring.ComputeScoreBundle(rawData, toUtc);
            var scores = bundle.Scores;
            var katex = bundle.Katex;
            // `catalog` comes from the same computation bundle used to produce scores.
            // This ensures normalization/availability rules are identical across scoring, insights, and CTAs.
            double GetScore(string k) => scores.TryGetValue(k, out var v) ? v : 0.0;

            // Insights: build AFTER we compute the panels so we can include chart/context details.
            Dictionary<string, Codivium.Dashboard.CodiviumInsights.Insight> insights = null;

            // Combined coding (micro + interview)
            var allocCombined = global::CodiviumAllocation.BuildAllocationByCategory(rawData);

            var depthCanonCombined = global::CodiviumDepthByCategory.ComputeDepthByCategory(rawData, toUtc);
            var depthCombined = global::CodiviumDepthByCategory.AdaptForDashboard(depthCanonCombined, cfg);

            var heatmapCombined = global::CodiviumConvergenceHeatmap.BuildConvergenceHeatmap(rawData);

            // Per-track micro/interview
            var microBlock = BuildCodingTrackBlock(rawData, "micro", catalog, toUtc);
            var interviewBlock = BuildCodingTrackBlock(rawData, "interview", catalog, toUtc);

            // MCQ
            var mcqPayload = global::CodiviumMcq.BuildMcqPayload(rawData);

            // Time-on-platform: windowed series
            var top = BuildTimeOnPlatformWindowed(rawData, fromUtc, toUtc, granularity);
            // Points + Efficiency (KaTeX-aligned, computed in ComputeCodiviumScores)

            // Depth summaries
            double depthOverall = GetScore("overall_depth");
            double depthMicro = GetScore("micro_depth");
            double depthInterview = GetScore("interview_depth");

            // --- Map to v2 payload DTOs (v38) ---
            var payload = new DashboardPayloadV2();
            payload.Meta.SessionStartEndpoint = sessionStartEndpoint;
            payload.Meta.AnchorDate = toUtc.UtcDateTime.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            payload.Meta.Ui = uiPrefs;

            payload.Overall.Metrics = new MetricsDto
            {
                CodiviumScore = Round1(GetScore("codivium_score")),
                BreadthOverall = Round1(GetScore("overall_breadth")),
                BreadthInterview = Round1(GetScore("interview_breadth")),
                BreadthMicro = Round1(GetScore("micro_challenge_breadth")),
                BreadthMcq = Round1(GetScore("mcq_breadth")),
                WeightedMcqScore = Round1(GetScore("weighted_mcq_score")),

                FirstTryPassRate = Round1(GetScore("first_try_pass")),
                AvgAttemptsToAC = Math.Round(GetScore("avg_attempts"), 2),
                MedianTimeToACMinutes = Round1(GetScore("median_time_minutes")),

                CodiviumPointsAll = Math.Round(GetScore("points_all_time"), 2),
                CodiviumPoints30 = Math.Round(GetScore("points_30d"), 2),
                EfficiencyPtsPerHr = Math.Round(GetScore("efficiency_pts_per_hr"), 2),

                DepthOverall = Math.Round(depthOverall, 2),
                DepthMicro = Math.Round(depthMicro, 2),
                DepthInterview = Math.Round(depthInterview, 2),

                // alias fields used by some frontend variants
                DepthOverallScore = Math.Round(depthOverall, 2),
                MicroDepthScore = Math.Round(depthMicro, 2),
                InterviewDepthScore = Math.Round(depthInterview, 2)
            };

            payload.Overall.TimeOnPlatform = top;
            // Defer insights until we have computed panel data (heatmap/allocation/time/mcq).
            // payload.Overall.Insights is set near the end of BuildFromRaw.

            // combinedCoding drives default Allocation/Depth/Heatmap
            payload.CombinedCoding = new TrackNamespace
            {
                Allocation = allocCombined.Select(r => new AllocationRowDto { Category = r.Category, Minutes = r.Minutes, Solved = r.Solved }).ToList(),
                DepthByCategory = depthCombined.DepthByCategory.Select(d => new DepthRowDto { Category = d.Category, Depth = d.Depth }).ToList(),
                DepthAvg = depthCombined.DepthAvg,
                ConvergenceHeatmap = new ConvergenceHeatmapDto
                {
                    Categories = heatmapCombined.Categories,
                    Buckets = heatmapCombined.Buckets,
                    Values = heatmapCombined.Values,
                    Counts = heatmapCombined.Counts ?? new List<List<int>>()
                }
            };


            // G12: attach backend-driven heatmap focus metadata (combined + per-track)
            if (payload.CombinedCoding?.ConvergenceHeatmap != null)
            {
                payload.CombinedCoding.ConvergenceHeatmap.Focus = CodiviumHeatmapFocusBuilder.BuildFocus(cfg, payload.CombinedCoding);
            }

            payload.Micro = microBlock;
            payload.Interview = interviewBlock;
            if (payload.Micro?.ConvergenceHeatmap != null)
            {
                payload.Micro.ConvergenceHeatmap.Focus = CodiviumHeatmapFocusBuilder.BuildFocus(cfg, payload.Micro);
            }
            if (payload.Interview?.ConvergenceHeatmap != null)
            {
                payload.Interview.ConvergenceHeatmap.Focus = CodiviumHeatmapFocusBuilder.BuildFocus(cfg, payload.Interview);
            }

            payload.Mcq = new McqNamespace
            {
                Mcq = mcqPayload,
                Metrics = new MetricsDto
                {
                    BreadthMcq = Round1(GetScore("mcq_breadth")),
                    WeightedMcqScore = Round1(GetScore("weighted_mcq_score"))
                }
            };

            
            // G12: backend-authored CTAs
            // Build KaTeX-aligned, backend-authored insights for the analysis pane.
            insights = CodiviumInsights.BuildAll(payload, rawData, cfg, catalog, katex, fromUtc, toUtc);
            payload.Overall.Insights = insights;

            // G12/G13: backend-authored CTAs (recommendedActions)
            // We use KaTeX evidence + current aggregates so CTA suggestions match the scoring model.
            payload.Overall.RecommendedActions = CodiviumRecommendedActions.BuildFromKatex(payload, cfg, catalog, katex);

            return payload;
        }

        private static TrackNamespace BuildCodingTrackBlock(
            global::CodiviumScoring.CodiviumRawData rawData,
            string trackCanon,
            global::CodiviumCatalog.Catalog catalog,
            DateTimeOffset asOfUtc)
        {
            // Filter raw data to this coding track only
            var rawTrack = FilterRawToCodingTrack(rawData, trackCanon);

            // Compute combined calculators on filtered raw, then reduce axes to the track catalog order.
            var allocFull = global::CodiviumAllocation.BuildAllocationByCategory(rawTrack);
            var depthCanon = global::CodiviumDepthByCategory.ComputeDepthByCategory(rawTrack, asOfUtc);
            var depthFull = global::CodiviumDepthByCategory.AdaptForDashboard(depthCanon, rawData.Config);
            var heatFull = global::CodiviumConvergenceHeatmap.BuildConvergenceHeatmap(rawTrack);

            // Track-specific category order and display mapping
            var trackInfo = catalog.TracksByCanonId.TryGetValue(trackCanon, out var ti) ? ti : null;
            var displayOrder = (trackInfo?.CategoriesCanonOrder ?? new List<string>())
                .Select(c => catalog.UniverseCanonToDisplay.TryGetValue(c, out var disp) ? disp : global::CodiviumCatalog.ToTitleCaseDisplay(c))
                .ToList();

            // Filter allocation
            var allocIndex = allocFull.ToDictionary(x => x.Category, x => x, StringComparer.Ordinal);
            var alloc = displayOrder.Select(d => allocIndex.TryGetValue(d, out var r)
                ? new AllocationRowDto { Category = r.Category, Minutes = r.Minutes, Solved = r.Solved }
                : new AllocationRowDto { Category = d, Minutes = 0, Solved = 0 })
                .ToList();

            // Filter depth
            var depthIndex = depthFull.DepthByCategory.ToDictionary(x => x.Category, x => x.Depth, StringComparer.Ordinal);
            var depthRows = displayOrder.Select(d => new DepthRowDto { Category = d, Depth = depthIndex.TryGetValue(d, out var v) ? v : 0.0 }).ToList();
            double depthAvg = depthRows.Count == 0 ? 0.0 : depthRows.Average(x => x.Depth);

            // Filter heatmap
            var heatIndex = heatFull.Categories.Select((c, i) => (c, i))
                .ToDictionary(x => x.c, x => x.i, StringComparer.Ordinal);

            var fullCounts = heatFull.Counts;
            if (fullCounts == null || fullCounts.Count != heatFull.Categories.Count)
            {
                // Defensive fallback: align counts length to categories length.
                fullCounts = Enumerable.Range(0, heatFull.Categories.Count)
                    .Select(_ => new List<int> { 0, 0, 0, 0, 0 })
                    .ToList();
            }

            var values = new List<List<double?>>(displayOrder.Count);
            var counts = new List<List<int>>(displayOrder.Count);

            foreach (var d in displayOrder)
            {
                if (heatIndex.TryGetValue(d, out var i))
                {
                    values.Add(heatFull.Values[i]);
                    counts.Add(fullCounts[i]);
                }
                else
                {
                    values.Add(new List<double?> { null, null, null, null, null });
                    counts.Add(new List<int> { 0, 0, 0, 0, 0 });
                }
            }

            return new TrackNamespace
            {
                Allocation = alloc,
                DepthByCategory = depthRows,
                DepthAvg = Math.Round(depthAvg, 2),
                ConvergenceHeatmap = new ConvergenceHeatmapDto
                {
                    Categories = displayOrder,
                    Buckets = heatFull.Buckets,
                    Values = values,
                    Counts = counts
                }
            };
        }

        private static global::CodiviumScoring.CodiviumRawData FilterRawToCodingTrack(global::CodiviumScoring.CodiviumRawData rawData, string trackCanon)
        {
            var codingCanon = global::CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(
                rawData.CodingSessionsByTrack,
                nameof(rawData.CodingSessionsByTrack));

            var coding = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>(StringComparer.OrdinalIgnoreCase);
            coding[trackCanon] = codingCanon.TryGetValue(trackCanon, out var sessions)
                ? sessions
                : new List<global::CodiviumScoring.CodingSession>();

            return new global::CodiviumScoring.CodiviumRawData
            {
                Config = rawData.Config,
                UniqueCorrectMcqAllTime = rawData.UniqueCorrectMcqAllTime >= 0 ? rawData.UniqueCorrectMcqAllTime : rawData.McqDistinctCorrectAllTimeLegacy,
                CodingSessionsByTrack = coding,
                McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>(StringComparer.OrdinalIgnoreCase)
            };
        }

        private static TimeOnPlatformDto BuildTimeOnPlatformWindowed(
            global::CodiviumScoring.CodiviumRawData rawData,
            DateTimeOffset fromUtc,
            DateTimeOffset toUtc,
            string granularity)
        {
            // Only "day" is supported in this reference adapter.
            var daily = new SortedDictionary<DateOnly, int>();

            void Add(DateTime? dtUtc, int minutes)
            {
                if (minutes <= 0) return;
                if (!dtUtc.HasValue) return;
                var t = dtUtc.Value;
                if (t <= DateTime.MinValue.AddDays(1)) return;
                var dto = new DateTimeOffset(DateTime.SpecifyKind(t, DateTimeKind.Utc));
                if (dto < fromUtc || dto >= toUtc) return;
                var day = DateOnly.FromDateTime(dto.UtcDateTime);
                daily[day] = daily.TryGetValue(day, out var cur) ? cur + minutes : minutes;
            }

            // Coding minutes: last attempt time
            var codingByTrackCanon = global::CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(
                rawData.CodingSessionsByTrack,
                nameof(rawData.CodingSessionsByTrack));

            foreach (var trackCanon in global::CodiviumCatalog.OrderCodingTracksForProcessing(codingByTrackCanon.Keys))
            {
                if (!codingByTrackCanon.TryGetValue(trackCanon, out var sessions) || sessions is null) continue;
                foreach (var s in sessions ?? Array.Empty<global::CodiviumScoring.CodingSession>())
                {
                    if (s.Attempts is null || s.Attempts.Count == 0) continue;
                    var last = s.Attempts[^1];
                    int mins = (int)Math.Round(last.TimeToSubmissionMinutes);
                    Add(s.CompletedAtUtc, mins);
                }
            }

            // MCQ minutes: MinutesSpent
            var mcqByTrackCanon = global::CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(
                rawData.McqAttemptsByTrack,
                nameof(rawData.McqAttemptsByTrack));

            foreach (var kv in mcqByTrackCanon)
            {
                foreach (var a in kv.Value ?? Array.Empty<global::CodiviumScoring.McqAttempt>())
                {
                    int mins = (int)Math.Round(a.MinutesSpent ?? 0.0);
                    Add(a.CompletedAtUtc ?? a.TakenAtUtcLegacy, mins);
                }
            }

            // Emit list (do not densify; frontend densifies)
            var outList = daily.Select(kv => new DailyMinutesDto
            {
                Date = kv.Key.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Minutes = kv.Value
            }).ToList();

            return new TimeOnPlatformDto { Daily = outList };
        }

        private static double Round1(double x) => Math.Round(x, 1);
    }
}

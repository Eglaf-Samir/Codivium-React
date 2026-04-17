// CodiviumRecommendedActions.v1.cs
//
// G12/G13: Backend-driven recommendedActions[].
// Produces one CTA per panel (heatmap/allocation/depth/time/mcq) and packages the data
// needed by your website to start a "next session" workflow.
//
// IMPORTANT
// - The dashboard does NOT hard-code what a "session" is.
// - Instead, it POSTs a small JSON object to payload.meta.sessionStartEndpoint.
// - Your production backend should translate that JSON into a sessionId + redirectUrl.
//
// Why this file exists
// - We want CTA suggestions to be consistent with the KaTeX scoring model.
// - That means we should use KaTeX evidence and the same category canon/availability rules
//   that scoring uses.
//
// Security principles
// - Recommended actions should only contain *routing hints* (category, track, difficulty, timebox).
// - The session start endpoint must validate/sanitize everything again server-side.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Codivium.Dashboard
{
    public static class CodiviumRecommendedActions
    {
        /// <summary>
        /// KaTeX-aligned CTA builder.
        ///
        /// This is the method used by DashboardPayloadV2Adapter.
        /// It uses:
        /// - KaTeX evidence (katex.EvidenceByTrackByCategory)
        /// - KaTeX constants (cfg.Katex.*)
        /// - The already-computed dashboard panel aggregates (payload.*)
        ///
        /// The output is one action per panel:
        ///   heatmap | allocation | depth | time | mcq
        /// </summary>
        public static List<RecommendedActionDto> BuildFromKatex(
            DashboardPayloadV2 payload,
            global::CodiviumScoring.ScoringConfig cfg,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumKatexScoring.KatexAllResults katex)
        {
            if (payload is null) throw new ArgumentNullException(nameof(payload));
            if (cfg is null) throw new ArgumentNullException(nameof(cfg));
            if (catalog is null) throw new ArgumentNullException(nameof(catalog));
            if (katex is null) throw new ArgumentNullException(nameof(katex));

            var actions = new List<RecommendedActionDto>();

            // ------------------------------------------------------------
            // Helpers
            // ------------------------------------------------------------
            var tauE = cfg.Katex?.Breadth?.TauE ?? 1.5;

            // Canonicalize track id and test membership.
            bool TrackHasCategory(string trackCanon, string categoryCanon)
            {
                if (!catalog.TracksByCanonId.TryGetValue(trackCanon, out var ti)) return false;
                return ti.CategoriesCanonSet.Contains(categoryCanon);
            }

            string CategoryCanonFromDisplay(string display)
            {
                // The catalog includes a universe display mapping.
                // We reverse-map using a case-insensitive compare.
                if (string.IsNullOrWhiteSpace(display)) return "";
                var norm = global::CodiviumCatalog.CanonicalizeCategoryKey(display);
                // Fast path: direct lookup if already canonical.
                if (catalog.UniverseCanonSet.Contains(norm)) return norm;

                // Reverse map by display label.
                foreach (var kv in catalog.UniverseCanonToDisplay)
                {
                    if (string.Equals(kv.Value, display, StringComparison.OrdinalIgnoreCase)) return kv.Key;
                }

                // Fallback: assume display can be normalized to a canon form.
                return norm;
            }

            string PickCodingTrackForCategoryCanon(string categoryCanon)
            {
                // Preference order:
                // - If only in one coding track, pick that.
                // - If in both, default to micro (more practice-friendly).
                var inMicro = TrackHasCategory("micro", categoryCanon);
                var inInterview = TrackHasCategory("interview", categoryCanon);

                if (inMicro && !inInterview) return "micro";
                if (inInterview && !inMicro) return "interview";
                if (inMicro) return "micro";
                if (inInterview) return "interview";
                return "micro";
            }

            string PickCodingTrackForCategoryDisplay(string categoryDisplay)
                => PickCodingTrackForCategoryCanon(CategoryCanonFromDisplay(categoryDisplay));

            // Safe numeric helpers
#pragma warning disable CS8321
            double Clamp(double x, double lo, double hi) => Math.Max(lo, Math.Min(hi, x));
#pragma warning restore CS8321

            // ------------------------------------------------------------
            // 1) Heatmap CTA (convergence)
            // ------------------------------------------------------------
            // Goal: pick a category where convergence is slow (more mass in A5/A6),
            // because improving convergence increases evidence quality (via KaTeX g[A]).
            var heat = payload.CombinedCoding?.ConvergenceHeatmap;
            var heatCats = heat?.Categories ?? new List<string>();
            var heatBuckets = heat?.Buckets ?? new List<string>();
            var heatCounts = heat?.Counts ?? new List<List<int>>();

            string heatCat = "";
            double heatWorstScore = double.NegativeInfinity;

            for (int r = 0; r < heatCats.Count; r++)
            {
                // Weighted sum of attempt bucket indices (A1→1 ... A6→6).
                double s = 0.0;
                if (r < heatCounts.Count && heatCounts[r] != null)
                {
                    for (int c = 0; c < Math.Min(heatBuckets.Count, heatCounts[r].Count); c++)
                    {
                        var idx = ParseAttemptBucketIndex(heatBuckets[c]);
                        s += heatCounts[r][c] * idx;
                    }
                }

                if (s > heatWorstScore)
                {
                    heatWorstScore = s;
                    heatCat = heatCats[r];
                }
            }

            // Fallback if heatmap is missing: use lowest depth category.
            if (string.IsNullOrWhiteSpace(heatCat))
            {
                var lowest = (payload.CombinedCoding?.DepthByCategory ?? new List<DepthRowDto>())
                    .OrderBy(r => r.Depth)
                    .FirstOrDefault();
                heatCat = lowest?.Category ?? "";
            }

            if (!string.IsNullOrWhiteSpace(heatCat))
            {
                actions.Add(new RecommendedActionDto
                {
                    Id = "cta_heatmap_convergence",
                    PanelId = "heatmap",
                    Label = "Improve convergence in a weak category",
                    ActionType = "start_session",
                    Track = PickCodingTrackForCategoryDisplay(heatCat),
                    Params = new Dictionary<string, object>
                    {
                        ["category"] = heatCat,
                        ["intent"] = "improve_convergence",
                        ["timeboxMinutes"] = 35,
                        ["source"] = "heatmap"
                    }
                });
            }

            // ------------------------------------------------------------
            // 2) Depth CTA (raise weakest depth)
            // ------------------------------------------------------------
            var depthRows = payload.CombinedCoding?.DepthByCategory ?? new List<DepthRowDto>();
            var lowestDepth = depthRows
                .Where(r => r != null && !string.IsNullOrWhiteSpace(r.Category))
                .OrderBy(r => r.Depth)
                .FirstOrDefault();

            if (lowestDepth != null)
            {
                actions.Add(new RecommendedActionDto
                {
                    Id = "cta_depth_raise",
                    PanelId = "depth",
                    Label = "Deepen your weakest category",
                    ActionType = "start_session",
                    Track = PickCodingTrackForCategoryDisplay(lowestDepth.Category),
                    Params = new Dictionary<string, object>
                    {
                        ["category"] = lowestDepth.Category,
                        ["intent"] = "raise_depth",
                        ["timeboxMinutes"] = 45,
                        ["source"] = "depth"
                    }
                });
            }

            // ------------------------------------------------------------
            // 3) Allocation/Breadth CTA (unlock missing category)
            // ------------------------------------------------------------
            // Use KaTeX evidence activation rule:
            //   A_{a,c} = 1{E_{a,c} >= tau_E}
            // Missing categories are those with E_total < tau_E.
            var eMicro = katex.EvidenceByTrackByCategory.TryGetValue("micro", out var em) ? em : new Dictionary<string, double>();
            var eInterview = katex.EvidenceByTrackByCategory.TryGetValue("interview", out var ei) ? ei : new Dictionary<string, double>();

            // Universe for coding is the union of micro + interview categories (catalog already maintains that).
            var codingUniverse = catalog.CodingUniverseCanonSet?.ToList() ?? new List<string>();

            var missing = codingUniverse
                .Select(c => new
                {
                    Canon = c,
                    Evidence = (eMicro.TryGetValue(c, out var m) ? m : 0.0) + (eInterview.TryGetValue(c, out var iv) ? iv : 0.0)
                })
                .Where(x => x.Evidence < tauE)
                .OrderBy(x => x.Evidence)
                .FirstOrDefault();

            if (missing != null)
            {
                var display = catalog.UniverseCanonToDisplay.TryGetValue(missing.Canon, out var d) ? d : missing.Canon;

                actions.Add(new RecommendedActionDto
                {
                    Id = "cta_allocation_unlock_breadth",
                    PanelId = "allocation",
                    Label = "Unlock a new category for breadth",
                    ActionType = "start_session",
                    Track = PickCodingTrackForCategoryCanon(missing.Canon),
                    Params = new Dictionary<string, object>
                    {
                        ["category"] = display,
                        ["intent"] = "unlock_breadth",
                        ["targetEvidenceTauE"] = tauE,
                        ["timeboxMinutes"] = 30,
                        ["source"] = "allocation"
                    }
                });
            }

            // ------------------------------------------------------------
            // 4) Time CTA (streak / consistency / momentum)
            // ------------------------------------------------------------
            // The KaTeX model uses recency decay for points and evidence.
            // If recent minutes are low, we recommend a short consistency session.
            var daily = payload.Overall?.TimeOnPlatform?.Daily ?? new List<DailyMinutesDto>();
            int SumLast(int days)
            {
                if (daily.Count <= 0) return 0;
                return daily.TakeLast(Math.Min(days, daily.Count)).Sum(d => d.Minutes);
            }

            var last7 = SumLast(7);
            var points30 = payload.Overall?.Metrics?.CodiviumPoints30 ?? 0.0;
            var timebox = (last7 < 120) ? 30 : 25;

            // Pick intent based on current bottleneck (breadth vs depth).
            var b = payload.Overall?.Metrics?.BreadthOverall ?? 0.0;
            var dpth = payload.Overall?.Metrics?.DepthOverall ?? 0.0;
            var timeIntent = (b + 1e-9 < dpth) ? "unlock_breadth" : "raise_depth";

            actions.Add(new RecommendedActionDto
            {
                Id = "cta_time_consistency",
                PanelId = "time",
                Label = (last7 < 120) ? "Do a short consistency session" : "Maintain momentum this week",
                ActionType = "start_session",
                Track = "micro",
                Params = new Dictionary<string, object>
                {
                    ["intent"] = timeIntent,
                    ["timeboxMinutes"] = timebox,
                    ["source"] = "time",
                    ["recentMinutes7d"] = last7,
                    ["points30d"] = points30
                }
            });

            // ------------------------------------------------------------
            // 5) MCQ CTA (weakest difficulty band)
            // ------------------------------------------------------------
            // Prefer to target the band where you are currently weakest (avg percent correct),
            // but require some minimal attempts to avoid noisy recommendations.
            var mcqPayloadObj = payload.Mcq?.Mcq;
            string diff = "basic";
            string diffLabel = "Basic";

            try
            {
                if (mcqPayloadObj is global::CodiviumMcq.McqPayload typed)
                {
                    var (dCanon, _) = WorstDifficulty(typed, minAttempts: 6);
                    diff = dCanon;
                    diffLabel = diff switch
                    {
                        "advanced" => "Advanced",
                        "intermediate" => "Intermediate",
                        _ => "Basic"
                    };
                }
            }
            catch
            {
                // ignore, keep defaults
            }

            actions.Add(new RecommendedActionDto
            {
                Id = "cta_mcq_focus",
                PanelId = "mcq",
                Label = $"Practice MCQ ({diffLabel})",
                ActionType = "start_session",
                Track = "mcq",
                Params = new Dictionary<string, object>
                {
                    ["intent"] = "mcq_gaps",
                    ["difficulty"] = diff,
                    ["timeboxMinutes"] = 20,
                    ["source"] = "mcq"
                }
            });

            return actions;
        }

        /// <summary>
        /// Legacy/compat builder kept for older call sites.
        ///
        /// NOTE:
        /// - This version uses only the already-built payload.
        /// - The preferred method is BuildFromKatex (called by the adapter).
        /// </summary>
        public static List<RecommendedActionDto> Build(DashboardPayloadV2 payload, global::CodiviumScoring.ScoringConfig cfg)
        {
            // If you only have payload + cfg, we can still produce reasonable actions,
            // but they will be less "evidence-aware" than BuildFromKatex.
            if (payload is null) throw new ArgumentNullException(nameof(payload));
            if (cfg is null) throw new ArgumentNullException(nameof(cfg));

            // Best effort: if the payload was built by our adapter, catalog + katex are not available here.
            // So we fall back to the simple heuristics from earlier versions.
            return BuildFromPayloadFallback(payload, cfg);
        }

        // ------------------------------------------------------------
        // Fallback heuristic builder (payload-only)
        // ------------------------------------------------------------
        private static List<RecommendedActionDto> BuildFromPayloadFallback(DashboardPayloadV2 payload, global::CodiviumScoring.ScoringConfig cfg)
        {
            var actions = new List<RecommendedActionDto>();

            // Helper for picking track based on category availability from config display lists.
            // This is weaker than catalog-based picking (canon-aware) but works without the catalog.
            string PickCodingTrackForCategory(string categoryDisplay)
            {
                var byTrack = cfg.Categories?.AvailableByTrack ?? new Dictionary<string, List<string>>();
                bool inMicro = byTrack.TryGetValue("micro", out var micro) && micro != null && micro.Contains(categoryDisplay);
                bool inInterview = byTrack.TryGetValue("interview", out var interview) && interview != null && interview.Contains(categoryDisplay);

                if (inMicro && !inInterview) return "micro";
                if (inInterview && !inMicro) return "interview";
                if (inMicro) return "micro";
                if (inInterview) return "interview";
                return "micro";
            }

            // Heatmap: pick first ranked focus category if present, else first category.
            var heatFocus = payload.CombinedCoding?.ConvergenceHeatmap?.Focus;
            string heatCat = heatFocus?.Rankings != null && heatFocus.Rankings.TryGetValue(heatFocus.DefaultModeId ?? "impact", out var list) && list != null && list.Count > 0
                ? list[0]
                : payload.CombinedCoding?.ConvergenceHeatmap?.Categories?.FirstOrDefault() ?? "";

            if (!string.IsNullOrWhiteSpace(heatCat))
            {
                actions.Add(new RecommendedActionDto
                {
                    Id = "cta_heatmap_focus",
                    PanelId = "heatmap",
                    Label = "Start a focused session",
                    ActionType = "start_session",
                    Track = PickCodingTrackForCategory(heatCat),
                    Params = new Dictionary<string, object>
                    {
                        ["category"] = heatCat,
                        ["source"] = "heatmap_focus"
                    }
                });
            }

            // Depth: lowest depth category.
            var depthRows = payload.CombinedCoding?.DepthByCategory ?? new List<DepthRowDto>();
            var lowestDepth = depthRows.OrderBy(r => r.Depth).FirstOrDefault();
            if (lowestDepth != null)
            {
                actions.Add(new RecommendedActionDto
                {
                    Id = "cta_depth_raise",
                    PanelId = "depth",
                    Label = "Raise depth in your weakest category",
                    ActionType = "start_session",
                    Track = PickCodingTrackForCategory(lowestDepth.Category),
                    Params = new Dictionary<string, object>
                    {
                        ["category"] = lowestDepth.Category,
                        ["source"] = "depth_lowest"
                    }
                });
            }

            // Allocation: highest time category.
            var allocRows = payload.CombinedCoding?.Allocation ?? new List<AllocationRowDto>();
            var mostTime = allocRows.OrderByDescending(r => r.Minutes).FirstOrDefault();
            if (mostTime != null)
            {
                actions.Add(new RecommendedActionDto
                {
                    Id = "cta_allocation_balance",
                    PanelId = "allocation",
                    Label = "Balance your category mix",
                    ActionType = "start_session",
                    Track = PickCodingTrackForCategory(mostTime.Category),
                    Params = new Dictionary<string, object>
                    {
                        ["category"] = mostTime.Category,
                        ["source"] = "allocation_top_time"
                    }
                });
            }

            // Time: simple 30 min session.
            actions.Add(new RecommendedActionDto
            {
                Id = "cta_time_consistency",
                PanelId = "time",
                Label = "Do a 30‑minute session",
                ActionType = "start_session",
                Track = "micro",
                Params = new Dictionary<string, object>
                {
                    ["timeboxMinutes"] = 30,
                    ["source"] = "time"
                }
            });

            // MCQ: basic session.
            actions.Add(new RecommendedActionDto
            {
                Id = "cta_mcq_basic",
                PanelId = "mcq",
                Label = "Practice MCQ (Basic)",
                ActionType = "start_session",
                Track = "mcq",
                Params = new Dictionary<string, object>
                {
                    ["difficulty"] = "basic",
                    ["timeboxMinutes"] = 20,
                    ["source"] = "mcq"
                }
            });

            return actions;
        }

        // ------------------------------------------------------------
        // Small helpers
        // ------------------------------------------------------------
        private static int ParseAttemptBucketIndex(string bucket)
        {
            if (string.IsNullOrWhiteSpace(bucket)) return 1;
            bucket = bucket.Trim().ToUpperInvariant();
            if (bucket.StartsWith("A", StringComparison.Ordinal))
            {
                var num = new string(bucket.Skip(1).TakeWhile(char.IsDigit).ToArray());
                if (int.TryParse(num, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
                {
                    if (n < 1) return 1;
                    if (n > 6) return 6;
                    return n;
                }
            }
            return 1;
        }

        private static (string diff, double avg) WorstDifficulty(global::CodiviumMcq.McqPayload mcq, int minAttempts)
        {
            // Compute average percent-correct per difficulty band, using only categories with enough attempts.
            (string diff, double avg) best = ("basic", 101.0);

            void Consider(string dCanon, Dictionary<string, double> pctByCat, Dictionary<string, global::CodiviumMcq.EvidenceCell> evByCat)
            {
                var vals = new List<double>();
                foreach (var kv in pctByCat)
                {
                    if (evByCat.TryGetValue(kv.Key, out var ev) && ev.Attempts >= minAttempts)
                    {
                        vals.Add(kv.Value);
                    }
                }
                if (vals.Count <= 0) return;
                var avg = vals.Average();
                if (avg < best.avg) best = (dCanon, avg);
            }

            Consider("basic", mcq.ByDifficulty.Basic, mcq.ByDifficultyEvidence.Basic);
            Consider("intermediate", mcq.ByDifficulty.Intermediate, mcq.ByDifficultyEvidence.Intermediate);
            Consider("advanced", mcq.ByDifficulty.Advanced, mcq.ByDifficultyEvidence.Advanced);

            if (best.avg > 100.0) return ("basic", 0.0);
            return best;
        }
    }
}

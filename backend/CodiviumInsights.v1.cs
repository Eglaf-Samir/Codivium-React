// CodiviumInsights.v1.cs
//
// G13 (Side-pane analysis) — KaTeX-aligned, backend-authored insights.
//
// The dashboard frontend supports two modes for the right-side analysis pane:
//   (A) "Fallback" client-side analysis builders (older behavior)
//   (B) Backend-provided structured insights: payload.overall.insights
//
// This file implements (B) for *all* score/info keys used by the dashboard UI so:
//   - The analysis text is consistent with the KaTeX scoring document
//     (assets/docs/codivium_scoring_katex.html).
//   - The dashboard can render analysis without relying on client fallback logic,
//     which can silently drift over time.
//
// IMPORTANT SECURITY NOTE
// - Insights are shipped as *data*, not HTML.
// - The frontend renders blocks as plain text (and adds safe <abbr> tooltips itself).
// - Never include HTML in Text fields.
//
// IMPORTANT MAINTENANCE NOTE
// - If you change KaTeX formulas or constants, update BOTH:
//     (1) CodiviumKatexScoring.v1.cs (the executable implementation)
//     (2) This insights builder (the explanations shown to users)
//
// Design goals:
// - Over-commented for new developers.
// - Deterministic output (no randomness).
// - Conservative language when evidence is small.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json.Serialization;

namespace Codivium.Dashboard
{
    public static class CodiviumInsights
    {
        // -----------------------------
        // Insight schema (mirrors frontend renderer)
        // -----------------------------
        public sealed class Insight
        {
            [JsonPropertyName("title")] public required string Title { get; init; }
            [JsonPropertyName("summary")] public required string Summary { get; init; }
            [JsonPropertyName("sections")] public required List<Section> Sections { get; init; }
            [JsonPropertyName("meta")] public Dictionary<string, object?> Meta { get; init; } = new();
        }

        public sealed class Section
        {
            [JsonPropertyName("heading")] public required string Heading { get; init; }
            [JsonPropertyName("type")] public string Type { get; init; } = "analysis";
            [JsonPropertyName("blocks")] public required List<Block> Blocks { get; init; }
        }

        public sealed class Block
        {
            [JsonPropertyName("kind")] public required string Kind { get; init; } // p | bullets | note
            [JsonPropertyName("text")] public string? Text { get; init; }
            [JsonPropertyName("items")] public List<string>? Items { get; init; }
        }

        // -----------------------------
        // Entry point
        // -----------------------------
        public static Dictionary<string, Insight> BuildAll(
            DashboardPayloadV2 payload,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumScoring.ScoringConfig cfg,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumKatexScoring.KatexAllResults katex,
            DateTimeOffset fromUtc,
            DateTimeOffset toUtc)
        {
            if (payload is null) throw new ArgumentNullException(nameof(payload));
            if (rawData is null) throw new ArgumentNullException(nameof(rawData));
            if (cfg is null) throw new ArgumentNullException(nameof(cfg));
            if (catalog is null) throw new ArgumentNullException(nameof(catalog));
            if (katex is null) throw new ArgumentNullException(nameof(katex));

            // Helper: fetch metric values as *numbers* for embedding into text.
            // We prefer the already-rounded payload metrics for display, but keep
            // the KaTeX numeric values available for deeper explanations.
            double M(string key, double fallback = 0.0)
            {
                try
                {
                    var m = payload.Overall?.Metrics;
                    if (m == null) return fallback;

                    // Switch by known keys so we keep behavior explicit.
                    return key switch
                    {
                        "codiviumScore" => m.CodiviumScore ?? fallback,
                        "breadthOverall" => m.BreadthOverall ?? fallback,
                        "breadthMicro" => m.BreadthMicro ?? fallback,
                        "breadthInterview" => m.BreadthInterview ?? fallback,
                        "breadthMcq" => m.BreadthMcq ?? fallback,
                        "depthOverall" => m.DepthOverall ?? fallback,
                        "depthMicro" => m.DepthMicro ?? fallback,
                        "depthInterview" => m.DepthInterview ?? fallback,
                        "pointsAll" => m.CodiviumPointsAll ?? fallback,
                        "points30" => m.CodiviumPoints30 ?? fallback,
                        "efficiency" => m.EfficiencyPtsPerHr ?? fallback,
                        "firstTry" => m.FirstTryPassRate ?? fallback,
                        "avgAttempts" => m.AvgAttemptsToAC ?? fallback,
                        "medianMinutes" => m.MedianTimeToACMinutes ?? fallback,
                        "weightedMcq" => m.WeightedMcqScore ?? fallback,
                        _ => fallback
                    };
                }
                catch
                {
                    return fallback;
                }
            }

            // KaTeX constants used in explanations.
            var tauE = cfg.Katex?.Breadth?.TauE ?? 1.5;
            var alpha = cfg.Katex?.Breadth?.Alpha ?? 0.65;
            var beta = cfg.Katex?.Breadth?.Beta ?? 0.35;

            var lambda = cfg.Katex?.Depth?.Lambda ?? 12.0;
            var lambdaChart = cfg.Katex?.Depth?.LambdaChart ?? lambda;

            // Convenience: get per-track category list (canonical) from catalog.
            var microCats = catalog.TracksByCanonId.TryGetValue("micro", out var mi) ? mi.CategoriesCanonOrder : new List<string>();
            var interviewCats = catalog.TracksByCanonId.TryGetValue("interview", out var ii) ? ii.CategoriesCanonOrder : new List<string>();
            var mcqCats = catalog.TracksByCanonId.TryGetValue("mcq", out var mq) ? mq.CategoriesCanonOrder : new List<string>();

            // Evidence maps from KaTeX computation.
            // Evidence is the single "currency" used by breadth and depth:
            //   - Breadth: coverage + balance + confidence (built from evidence distribution)
            //   - Depth: saturation as evidence grows (100*(1-exp(-E/lambda)))
            var eMicro = katex.EvidenceByTrackByCategory.TryGetValue("micro", out var em) ? em : new Dictionary<string, double>();
            var eInterview = katex.EvidenceByTrackByCategory.TryGetValue("interview", out var ei2) ? ei2 : new Dictionary<string, double>();
            var eMcq = katex.EvidenceByTrackByCategory.TryGetValue("mcq", out var eq) ? eq : new Dictionary<string, double>();

            // Helper: format with 1 decimal in a culture-invariant way.
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            // Helper: canonical category → display label for user-facing text.
            string Disp(string canon)
            {
                if (string.IsNullOrWhiteSpace(canon)) return "";
                if (catalog.UniverseCanonToDisplay.TryGetValue(canon, out var d)) return d;
                // Fallback (should be rare): title-case the canon string.
                return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(canon);
            }

            // --------------------------------------------
            // Track-level breadth diagnostics (KaTeX exact)
            // --------------------------------------------
            // KaTeX defines:
            //   A_{a,c} = 1{ E_{a,c} >= tau_E }   (activation threshold)
            //   cov_a   = (1/|C_a|) * sum_c A_{a,c}
            //
            //   p_{a,c} = E_{a,c} / sum_j E_{a,j}  (with 0 if sum=0)
            //   H_a     = - sum_c p_{a,c} ln p_{a,c}
            //   bal_a   = H_a / ln |C_a|          (0 if sum=0)
            //
            //   T_a     = sum_c E_{a,c}
            //   conf_a  = 1 - exp(-T_a / k_a)
            //
            //   breadth_a = 100 * conf_a * (alpha*cov_a + beta*bal_a)
            //
            // We compute these diagnostics here ONLY for explanation text — the numeric breadth
            // values shown on the dashboard come from CodiviumKatexScoring, not from this file.
            (double cov, double bal, double conf, double totalE, int activeCount, int n) BreadthDiag(List<string> cats, Dictionary<string, double> eByCat, double k)
            {
                var nCats = cats.Count;
                if (nCats <= 0) return (0, 0, 0, 0, 0, 0);

                double sumE = 0.0;
                foreach (var c in cats)
                {
                    if (eByCat.TryGetValue(c, out var v)) sumE += Math.Max(0.0, v);
                }

                int active = 0;
                foreach (var c in cats)
                {
                    var v = eByCat.TryGetValue(c, out var vv) ? Math.Max(0.0, vv) : 0.0;
                    if (v >= tauE) active++;
                }

                double cov = (double)active / nCats;

                // Balance entropy across ALL categories (KaTeX definition).
                double H = 0.0;
                if (sumE > 0.0)
                {
                    foreach (var c in cats)
                    {
                        var v = eByCat.TryGetValue(c, out var vv) ? Math.Max(0.0, vv) : 0.0;
                        var p = v / sumE;
                        if (p > 0.0) H += -p * Math.Log(p);
                    }
                }
                double bal = 0.0;
                if (nCats > 1)
                {
                    var denom = Math.Log(nCats);
                    if (denom > 0.0) bal = H / denom;
                }

                // Confidence is a saturating function of total evidence.
                // k_a differs by track and comes from cfg.katex.breadth.confidence_k_by_track.
                double conf = 0.0;
                if (k > 0.0) conf = 1.0 - Math.Exp(-sumE / k);

                return (cov, bal, conf, sumE, active, nCats);
            }

            double KFor(string trackCanon)
            {
                var kBy = cfg.Katex?.Breadth?.ConfidenceKByTrack ?? new Dictionary<string, double>();
                if (kBy.TryGetValue(trackCanon, out var k) && k > 0.0) return k;
                // Safe defaults from the KaTeX doc note.
                return trackCanon switch
                {
                    "micro" => 10.0,
                    "interview" => 8.0,
                    "mcq" => 14.0,
                    _ => 10.0
                };
            }

            var bMicroDiag = BreadthDiag(microCats, eMicro, KFor("micro"));
            var bInterviewDiag = BreadthDiag(interviewCats, eInterview, KFor("interview"));
            var bMcqDiag = BreadthDiag(mcqCats, eMcq, KFor("mcq"));

            // Helper: pick top missing categories (evidence below activation threshold).
            List<string> MissingCats(List<string> cats, Dictionary<string, double> eByCat, int take = 5)
            {
                return cats
                    .Select(c => new { c, e = eByCat.TryGetValue(c, out var v) ? v : 0.0 })
                    .Where(x => x.e < tauE)
                    .OrderBy(x => x.e) // least evidence first
                    .Take(take)
                    .Select(x => Disp(x.c))
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToList();
            }

            // Helper: pick top strength categories (highest evidence).
#pragma warning disable CS8321
            List<string> TopEvidenceCats(List<string> cats, Dictionary<string, double> eByCat, int take = 5)
            {
                return cats
                    .Select(c => new { c, e = eByCat.TryGetValue(c, out var v) ? v : 0.0 })
                    .OrderByDescending(x => x.e)
                    .Take(take)
                    .Select(x => $"{Disp(x.c)} (E={F1(x.e)})")
                    .ToList();
            }
#pragma warning restore CS8321

            // Depth-by-category list for combined coding (already adapted for dashboard display labels).
            var depthRows = payload.CombinedCoding?.DepthByCategory ?? new List<DepthRowDto>();
            var depthBottom = depthRows.OrderBy(r => r.Depth).Take(5).Select(r => $"{r.Category} ({F1(r.Depth)})").ToList();
            var depthTop = depthRows.OrderByDescending(r => r.Depth).Take(5).Select(r => $"{r.Category} ({F1(r.Depth)})").ToList();

            // Allocation list (minutes per category).
            var allocRows = payload.CombinedCoding?.Allocation ?? new List<AllocationRowDto>();
            var allocTop = allocRows.OrderByDescending(r => r.Minutes).Take(5).Select(r => $"{r.Category} ({r.Minutes}m)").ToList();

            // Time-on-platform window summary (last 7 and last 30).
            var daily = payload.Overall?.TimeOnPlatform?.Daily ?? new List<DailyMinutesDto>();
            int SumDays(int n)
            {
                if (daily.Count == 0) return 0;
                // Daily is already window-filtered in adapter. We take the *last* N.
                return daily.TakeLast(Math.Min(n, daily.Count)).Sum(d => d.Minutes);
            }
            var last7 = SumDays(7);
            var last30 = SumDays(30);

            // MCQ difficulty summaries.
            // The MCQ payload uses:
            //   - byDifficulty: { basic: {cat->pct}, intermediate: ..., advanced: ...}
            //   - byDifficultyEvidence: { basic: {cat->EvidenceCell}, ...}
            //   - overallCorrect: { correct, total, percent }
            object? mcqObj = payload.Mcq?.Mcq;
            // The shape is `CodiviumMcq.McqPayload` but stored as object (to keep backward compatibility).
            // We'll attempt to access it via dynamic dictionaries for robustness.
            Dictionary<string, Dictionary<string, double>> mcqByDiff = new(StringComparer.OrdinalIgnoreCase);
            Dictionary<string, Dictionary<string, int>> mcqAttemptsByDiff = new(StringComparer.OrdinalIgnoreCase);

            try
            {
                if (mcqObj is global::CodiviumMcq.McqPayload typed)
                {
                    mcqByDiff["basic"] = typed.ByDifficulty.Basic;
                    mcqByDiff["intermediate"] = typed.ByDifficulty.Intermediate;
                    mcqByDiff["advanced"] = typed.ByDifficulty.Advanced;

                    mcqAttemptsByDiff["basic"] = typed.ByDifficultyEvidence.Basic.ToDictionary(k => k.Key, v => v.Value.Attempts);
                    mcqAttemptsByDiff["intermediate"] = typed.ByDifficultyEvidence.Intermediate.ToDictionary(k => k.Key, v => v.Value.Attempts);
                    mcqAttemptsByDiff["advanced"] = typed.ByDifficultyEvidence.Advanced.ToDictionary(k => k.Key, v => v.Value.Attempts);
                }
            }
            catch
            {
                // If the MCQ object is not the typed payload (e.g., custom production shape),
                // we don't fail insight generation; we simply omit deep MCQ breakdown.
            }

            // Helper: find worst MCQ difficulty by average percent (only where attempts >= minAttempts).
            (string diff, double avg) WorstMcqDifficulty(int minAttempts = 6)
            {
                string worst = "basic";
                double worstAvg = 101.0;

                foreach (var diff in new[] { "basic", "intermediate", "advanced" })
                {
                    if (!mcqByDiff.TryGetValue(diff, out var map)) continue;
                    if (!mcqAttemptsByDiff.TryGetValue(diff, out var aMap)) aMap = new Dictionary<string, int>();
                    var vals = new List<double>();
                    foreach (var kv in map)
                    {
                        var a = aMap.TryGetValue(kv.Key, out var at) ? at : 0;
                        if (a >= minAttempts) vals.Add(kv.Value);
                    }
                    if (vals.Count == 0) continue;
                    var avg = vals.Average();
                    if (avg < worstAvg)
                    {
                        worstAvg = avg;
                        worst = diff;
                    }
                }

                if (worstAvg > 100.0) return ("basic", 0.0);
                return (worst, worstAvg);
            }

            // Helper: build one insight object (DRY).
            Insight I(string title, string summary, params Section[] sections)
            {
                return new Insight
                {
                    Title = title,
                    Summary = summary,
                    Sections = sections.ToList()
                };
            }

            Section S(string heading, params Block[] blocks)
            {
                return new Section { Heading = heading, Blocks = blocks.ToList() };
            }

            Block P(string text) => new Block { Kind = "p", Text = text };
            Block Note(string text) => new Block { Kind = "note", Text = text };
            Block Bullets(IEnumerable<string> items) => new Block { Kind = "bullets", Items = items.ToList() };

            // --------------------------------------------
            // Build the full insights dictionary
            // --------------------------------------------
            var insights = new Dictionary<string, Insight>(StringComparer.OrdinalIgnoreCase);

            // --- Overview (tab 1 in info-only mode) ---
            insights["dashboard_overview"] = I(
                title: "Dashboard overview",
                summary: "A quick summary of your mastery, momentum, and what to focus on next.",
                S("Your headline numbers",
                    Bullets(new[]
                    {
                        $"Codivium Score (Mastery): {F1(M("codiviumScore"))}",
                        $"Breadth (overall): {F1(M("breadthOverall"))}",
                        $"Depth (overall): {F1(M("depthOverall"))}",
                        $"Points (last 30d): {F1(M("points30"))}",
                        $"All‑time Points: {F1(M("pointsAll"))}",
                        $"Efficiency (pts/hr): {F1(M("efficiency"))}",
                    })),
                S("What these mean (KaTeX-aligned)",
                    P("Mastery is the harmonic mean of Breadth and Depth: it stays low if either Breadth or Depth is low."),
                    P("Breadth rewards (1) coverage, (2) balance of evidence across categories, and (3) confidence so early scores don’t swing wildly."),
                    P("Depth rewards sustained evidence in the same category, but it saturates (diminishing returns)."),
                    P("Points and Efficiency are separate: they measure momentum and quality‑adjusted throughput."),
                    Note("This pane is generated by the backend so it stays consistent with the KaTeX scoring document.")),
                S("Next focus suggestion",
                    Bullets(BuildNextFocusBullets(M("breadthOverall"), M("depthOverall"), MissingCats(microCats, eMicro, 3), MissingCats(interviewCats, eInterview, 3))))
            );

            // --- Scores tab (panel_scores) ---
            insights["panel_scores"] = I(
                title: "Score system (Mastery, Breadth, Depth)",
                summary: "How the core score is computed, and why it behaves conservatively when evidence is small.",
                S("Mastery score (Codivium Score)",
                    P("Formula: S = 2BD / (B + D), where B is overall breadth (0–100) and D is overall depth (0–100)."),
                    Bullets(new[]
                    {
                        $"B (breadthOverall) = {F1(M("breadthOverall"))}",
                        $"D (depthOverall) = {F1(M("depthOverall"))}",
                        $"S (codiviumScore) = {F1(M("codiviumScore"))}",
                    })),
                S("Breadth (why it can’t be gamed by one category)",
                    P($"A category counts as covered only if evidence reaches τ_E = {F1(tauE)}."),
                    P("Balance uses entropy of the evidence distribution across all categories (spreading evidence helps)."),
                    P("Confidence uses total evidence so early users don’t get unstable scores."),
                    Note($"Breadth blend weights: alpha={F1(alpha)} (coverage), beta={F1(beta)} (balance).")),
                S("Depth (why it saturates)",
                    P($"Depth per category uses a saturation curve: D_{{a,c}} = 100 * (1 - exp(-E/λ)). Default λ={F1(lambda)}."),
                    P("That means early evidence raises depth quickly, but later evidence yields diminishing returns."),
                    Note($"The depth-by-category chart uses λ_chart={F1(lambdaChart)} for a consistent visual scale.")),
                S("Confidence & guards",
                    Bullets(new[]
                    {
                        "If evidence is tiny, breadth confidence is tiny — scores stay conservative on purpose.",
                        "If a track has no available categories (rare), its breadth is defined as 0.",
                        "If there is no coding evidence, overall depth is 0."
                    }))
            );

            // --- Individual KPI insight keys used by the frontend ---
            insights["codiviumScore"] = insights["panel_scores"]; // alias — same explanation is useful
            insights["breadthScore"] = BuildBreadthInsight("Overall breadth", "breadthOverall", microCats, interviewCats, eMicro, eInterview, bMicroDiag, bInterviewDiag, cfg, catalog);
            insights["microBreadthScore"] = BuildTrackBreadthInsight("Micro breadth", "breadthMicro", microCats, eMicro, bMicroDiag, cfg, catalog);
            insights["interviewBreadthScore"] = BuildTrackBreadthInsight("Interview breadth", "breadthInterview", interviewCats, eInterview, bInterviewDiag, cfg, catalog);
            insights["mcqBreadthScore"] = BuildTrackBreadthInsight("MCQ breadth", "breadthMcq", mcqCats, eMcq, bMcqDiag, cfg, catalog);

            // Depth summaries
            insights["depthOverallScore"] = BuildDepthInsight(
                "Overall depth", "depthOverall",
                katex, catalog, depthRows, depthTop, depthBottom,
                eMicro, eInterview, microCats, interviewCats,
                lambda, lambdaChart, cfg);

            insights["microDepthScore"] = BuildDepthInsight(
                "Micro depth", "depthMicro",
                katex, catalog, depthRows, depthTop, depthBottom,
                eMicro, eInterview, microCats, interviewCats,
                lambda, lambdaChart, cfg, trackFilter: "micro");

            insights["interviewDepthScore"] = BuildDepthInsight(
                "Interview depth", "depthInterview",
                katex, catalog, depthRows, depthTop, depthBottom,
                eMicro, eInterview, microCats, interviewCats,
                lambda, lambdaChart, cfg, trackFilter: "interview");

            insights["panel_depth"] = insights["depthOverallScore"];


            // Diagnostics KPIs
            insights["firstTryPassRate"] = BuildFirstTryInsight(
                M("firstTry"), M("avgAttempts"), rawData, catalog, cfg);

            insights["avgAttemptsToAC"] = BuildAvgAttemptsInsight(
                M("avgAttempts"), M("firstTry"), rawData, catalog, cfg);

            insights["medianTimeToAC"] = BuildMedianTimeInsight(
                M("medianMinutes"), M("efficiency"), rawData, catalog, cfg);

            // Points / efficiency
            insights["codiviumPointsAll"] = BuildPointsAllTimeInsight(
                M("pointsAll"), M("points30"), rawData, catalog, katex, cfg);

            insights["codiviumPoints30"] = BuildPoints30Insight(
                M("points30"), M("pointsAll"), rawData, catalog, katex, cfg);

            insights["efficiencyPtsPerHr"] = BuildEfficiencyInsight(
                M("efficiency"), M("avgAttempts"), M("medianMinutes"), rawData, catalog, katex, cfg);

            // Heatmap panel (attempt buckets)
            insights["panel_heatmap"] = BuildHeatmapInsight(payload, cfg);

            // Time panel
            insights["panel_time"] = BuildTimeInsight(daily, last7, last30, allocTop, M("efficiency"));

            // Allocation panel
            insights["panel_exercise"] = I(
                title: "Time by category (allocation)",
                summary: "Where your coding practice time has gone (combined Micro + Interview).",
                S("Top time categories",
                    Bullets(allocTop.Count > 0 ? allocTop : new[] { "No allocation data in this payload yet." })),
                S("How to use this chart",
                    P("If one category dominates your time, breadth can stall (coverage and balance)."),
                    P("A good pattern is: keep your best categories warm, but regularly add a little time to missing/weak categories."),
                    Note("Allocation is descriptive; mastery comes from evidence quality and coverage, not raw time alone.")));

            // MCQ panel
            var (worstDiff, worstAvg) = WorstMcqDifficulty();
            insights["panel_mcq"] = I(
                title: "MCQ performance",
                summary: "Knowledge-check performance across Basic, Intermediate, and Advanced difficulty.",
                S("Your MCQ snapshot",
                    Bullets(new[]
                    {
                        $"Weighted MCQ score: {F1(M("weightedMcq"))}",
                        $"MCQ breadth: {F1(M("breadthMcq"))}",
                        $"Weakest band (avg): {worstDiff} (~{F1(worstAvg)}%)"
                    })),
                S("How MCQ affects mastery",
                    P("MCQ contributes to breadth as its own track (coverage + balance + confidence)."),
                    P("MCQ contributes to points using U_all (lifetime distinct correct)."),
                    Note("If MCQ difficulty is low-evidence, the backend will keep interpretations conservative.")));

            // Difficulty-specific MCQ keys (frontend expects them)
            insights["mcqEasy"] = BuildMcqDifficultyInsight("basic", "MCQ Basic", mcqByDiff, mcqAttemptsByDiff);
            insights["mcqMedium"] = BuildMcqDifficultyInsight("intermediate", "MCQ Intermediate", mcqByDiff, mcqAttemptsByDiff);
            insights["mcqHard"] = BuildMcqDifficultyInsight("advanced", "MCQ Advanced", mcqByDiff, mcqAttemptsByDiff);

            // Mark: these insights are backend-authored (so frontend should not treat as fallback).
            foreach (var kv in insights)
            {
                kv.Value.Meta["backend"] = true;
                kv.Value.Meta["katexAligned"] = true;
                kv.Value.Meta["asOfUtc"] = toUtc.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
            }

            return insights;
        }

        // -----------------------------
        // Builders for specific insight keys
        // -----------------------------

        private static Insight BuildBreadthInsight(
            string title,
            string metricKey,
            List<string> microCats,
            List<string> interviewCats,
            Dictionary<string, double> eMicro,
            Dictionary<string, double> eInterview,
            (double cov, double bal, double conf, double totalE, int activeCount, int n) microDiag,
            (double cov, double bal, double conf, double totalE, int activeCount, int n) interviewDiag,
            global::CodiviumScoring.ScoringConfig cfg,
            global::CodiviumCatalog.Catalog catalog)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);
            var tauE = cfg.Katex?.Breadth?.TauE ?? 1.5;

            string Disp(string canon)
            {
                if (catalog.UniverseCanonToDisplay.TryGetValue(canon, out var d)) return d;
                return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(canon);
            }

            // Overall breadth is a weighted average of track breadth values (micro/interview/mcq).
            // This insight is for *coding breadth* conceptually, so we highlight missing categories
            // across micro + interview.
            var missing = microCats
                .Concat(interviewCats)
                .Distinct(StringComparer.Ordinal)
                .Select(c => new
                {
                    c,
                    e = (eMicro.TryGetValue(c, out var m) ? m : 0.0) + (eInterview.TryGetValue(c, out var i) ? i : 0.0)
                })
                .Where(x => x.e < tauE)
                .OrderBy(x => x.e)
                .Take(6)
                .Select(x => Disp(x.c))
                .ToList();

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "What breadth measures (KaTeX)",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "p", Text = "Breadth combines coverage, balance (entropy), and confidence (stability). It is conservative when evidence is small." },
                        new Block { Kind = "p", Text = $"A category is counted as covered only when evidence reaches τ_E = {F1(tauE)}." },
                    }
                },
                new Section
                {
                    Heading = "Track diagnostics (how your breadth is shaped)",
                    Blocks = new List<Block>
                    {
                        new Block
                        {
                            Kind = "bullets",
                            Items = new List<string>
                            {
                                $"Micro: coverage={F1(100*microDiag.cov)}%, balance={F1(100*microDiag.bal)}%, confidence={F1(100*microDiag.conf)}% (active {microDiag.activeCount}/{microDiag.n})",
                                $"Interview: coverage={F1(100*interviewDiag.cov)}%, balance={F1(100*interviewDiag.bal)}%, confidence={F1(100*interviewDiag.conf)}% (active {interviewDiag.activeCount}/{interviewDiag.n})"
                            }
                        }
                    }
                }
            };

            if (missing.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Missing categories (biggest breadth opportunities)",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = missing.Select(m => m).ToList() }
                    }
                });
            }

            sections.Add(new Section
            {
                Heading = "How to improve breadth",
                Blocks = new List<Block>
                {
                    new Block { Kind = "bullets", Items = new List<string>
                    {
                        "Unlock a missing category: get evidence above τ_E (a couple of good solves is often enough).",
                        "Avoid putting 100% of effort into one category: balance matters (entropy).",
                        "Consistency matters: confidence rises as total evidence grows."
                    } }
                }
            });

            return new Insight
            {
                Title = title,
                Summary = "Coverage + balance + confidence, computed from KaTeX evidence.",
                Sections = sections
            };
        }

        private static Insight BuildTrackBreadthInsight(
            string title,
            string metricKey,
            List<string> cats,
            Dictionary<string, double> eByCat,
            (double cov, double bal, double conf, double totalE, int activeCount, int n) diag,
            global::CodiviumScoring.ScoringConfig cfg,
            global::CodiviumCatalog.Catalog catalog)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);
            var tauE = cfg.Katex?.Breadth?.TauE ?? 1.5;

            string Disp(string canon)
            {
                if (catalog.UniverseCanonToDisplay.TryGetValue(canon, out var d)) return d;
                return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(canon);
            }

            var missing = cats
                .Select(c => new { c, e = eByCat.TryGetValue(c, out var v) ? v : 0.0 })
                .Where(x => x.e < tauE)
                .OrderBy(x => x.e)
                .Take(6)
                .Select(x => Disp(x.c))
                .ToList();

            var top = cats
                .Select(c => new { c, e = eByCat.TryGetValue(c, out var v) ? v : 0.0 })
                .OrderByDescending(x => x.e)
                .Take(6)
                .Select(x => $"{Disp(x.c)} (E={F1(x.e)})")
                .ToList();

            return new Insight
            {
                Title = title,
                Summary = "Breadth for this track (KaTeX evidence → coverage, balance, confidence).",
                Sections = new List<Section>
                {
                    new Section
                    {
                        Heading = "Track diagnostics",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = new List<string>
                            {
                                $"Coverage: {F1(100*diag.cov)}% (active {diag.activeCount}/{diag.n})",
                                $"Balance: {F1(100*diag.bal)}% (entropy of evidence distribution)",
                                $"Confidence: {F1(100*diag.conf)}% (stability from total evidence)",
                                $"Total evidence T: {F1(diag.totalE)}"
                            } }
                        }
                    },
                    new Section
                    {
                        Heading = "Strongest categories (by evidence)",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = top }
                        }
                    },
                    new Section
                    {
                        Heading = "Missing categories (evidence below τ_E)",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = (missing.Count>0? missing : new List<string>{"None — all categories are activated."}) }
                        }
                    },
                    new Section
                    {
                        Heading = "How to improve this breadth score",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = new List<string>
                            {
                                $"To activate a category, raise evidence to at least τ_E={F1(tauE)}.",
                                "Spread evidence across multiple categories (balance/entropy).",
                                "Accumulate more evidence over time (confidence rises)."
                            } }
                        }
                    }
                }
            };
        }

        private static Insight BuildHeatmapInsight(DashboardPayloadV2 payload, global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            var heat = payload.CombinedCoding?.ConvergenceHeatmap;
            var buckets = heat?.Buckets ?? new List<string>();
            var cats = heat?.Categories ?? new List<string>();
            var counts = heat?.Counts ?? new List<List<int>>();

            // Compute a simple "convergence difficulty" indicator from the counts:
            // - Higher attempt buckets (A5/A6) increase the score.
            // This is for analysis text only; evidence weighting is still done in KaTeX scoring.
            string? worstCat = null;
            string? bestCat = null;
            double worst = double.NegativeInfinity;
            double best = double.PositiveInfinity;

            for (int r = 0; r < cats.Count; r++)
            {
                double s = 0;
                if (r < counts.Count && counts[r] != null)
                {
                    for (int c = 0; c < Math.Min(buckets.Count, counts[r].Count); c++)
                    {
                        var bucket = buckets[c];
                        var n = counts[r][c];
                        // Bucket index weight: A1→1, A2→2, ... A6+→6
                        var idx = ParseAttemptBucketIndex(bucket);
                        s += n * idx;
                    }
                }
                if (s > worst) { worst = s; worstCat = cats[r]; }
                if (s < best) { best = s; bestCat = cats[r]; }
            }

            // Convergence weights from KaTeX doc defaults (also stored in cfg.Katex.Coding.ConvergenceWeights).
            var g = cfg.Katex?.Coding?.ConvergenceWeightsByAttemptBucket ?? new List<double> { 1.00, 0.92, 0.85, 0.78, 0.70, 0.60 };
            var gText = string.Join(", ", g.Select(F1));

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "What the heatmap means",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "p", Text = "Rows are categories. Columns are attempt buckets A1..A6 (A6 means >5 attempts). More mass in high buckets means slower convergence." },
                        new Block { Kind = "p", Text = "KaTeX uses convergence weights g[A] to downweight low‑convergence solves when computing evidence." },
                        new Block { Kind = "note", Text = $"KaTeX default convergence weights g = [{gText}]. Higher attempts → smaller weight." }
                    }
                }
            };

            if (!string.IsNullOrWhiteSpace(worstCat) && !string.IsNullOrWhiteSpace(bestCat))
            {
                sections.Add(new Section
                {
                    Heading = "Your current pattern (from this payload)",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Slowest convergence category (more high‑attempt mass): {worstCat}",
                            $"Fastest convergence category (more low‑attempt mass): {bestCat}",
                        } }
                    }
                });
            }

            sections.Add(new Section
            {
                Heading = "How to improve convergence",
                Blocks = new List<Block>
                {
                    new Block { Kind = "bullets", Items = new List<string>
                    {
                        "If you often land in A5/A6: switch to slightly easier problems in that category for a week to rebuild speed.",
                        "Write down the failure mode after each miss (edge case, complexity, data structure choice). This raises evidence quality faster.",
                        "Use spaced redo: revisit a solved problem after ~7+ days to stabilize mastery."
                    } }
                }
            });

            return new Insight
            {
                Title = "Convergence heatmap",
                Summary = "Attempt buckets and where convergence is slowing down.",
                Sections = sections
            };
        }

        private static Insight BuildMcqDifficultyInsight(
            string diffCanon,
            string title,
            Dictionary<string, Dictionary<string, double>> mcqByDiff,
            Dictionary<string, Dictionary<string, int>> mcqAttemptsByDiff)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            if (!mcqByDiff.TryGetValue(diffCanon, out var map))
            {
                return new Insight
                {
                    Title = title,
                    Summary = "No MCQ data available for this band in the current payload.",
                    Sections = new List<Section>
                    {
                        new Section { Heading = "Status", Blocks = new List<Block>{ new Block{ Kind="p", Text="No data." } } }
                    }
                };
            }

            var aMap = mcqAttemptsByDiff.TryGetValue(diffCanon, out var am) ? am : new Dictionary<string, int>();

            // Pick the worst categories by percent, but only when there is enough evidence.
            const int minAttempts = 6;

            var worst = map
                .Select(kv => new { cat = kv.Key, pct = kv.Value, attempts = aMap.TryGetValue(kv.Key, out var a) ? a : 0 })
                .Where(x => x.attempts >= minAttempts)
                .OrderBy(x => x.pct)
                .Take(6)
                .Select(x => $"{x.cat} ({F1(x.pct)}% on {x.attempts} attempts)")
                .ToList();

            if (worst.Count == 0)
            {
                worst = map
                    .Select(kv => new { cat = kv.Key, pct = kv.Value, attempts = aMap.TryGetValue(kv.Key, out var a) ? a : 0 })
                    .OrderBy(x => x.pct)
                    .Take(6)
                    .Select(x => $"{x.cat} ({F1(x.pct)}% on {x.attempts} attempts)")
                    .ToList();
            }

            return new Insight
            {
                Title = title,
                Summary = "Category-level performance in this difficulty band.",
                Sections = new List<Section>
                {
                    new Section
                    {
                        Heading = "Weakest categories (lowest percent correct)",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = worst }
                        }
                    },
                    new Section
                    {
                        Heading = "How to improve",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = new List<string>
                            {
                                "Review the mistakes: write a 1–2 line rule for each missed question.",
                                "Retest after 1–3 days, then again after ~7 days (spaced review).",
                                "If the same category repeats, pair MCQ with a short coding exercise to ground the concept."
                            } }
                        }
                    }
                }
            };
        }

        private static List<string> BuildNextFocusBullets(double breadthOverall, double depthOverall, List<string> missingMicro, List<string> missingInterview)
        {
            var bullets = new List<string>();

            // Simple decision rule: whichever component is lower is the bottleneck for harmonic mean mastery.
            if (breadthOverall + 1e-9 < depthOverall)
            {
                bullets.Add("Breadth is currently the bottleneck for mastery. Unlock a few missing categories to raise coverage.");
                if (missingMicro.Count > 0) bullets.Add("Micro missing examples: " + string.Join(", ", missingMicro));
                if (missingInterview.Count > 0) bullets.Add("Interview missing examples: " + string.Join(", ", missingInterview));
            }
            else if (depthOverall + 1e-9 < breadthOverall)
            {
                bullets.Add("Depth is currently the bottleneck for mastery. Pick 1–2 weak categories and build sustained evidence.");
            }
            else
            {
                bullets.Add("Breadth and depth are balanced. Keep adding one new category occasionally while deepening your weakest areas.");
            }

            bullets.Add("Use Points(30d) as momentum feedback and Efficiency to keep quality high.");
            return bullets;
        }

        private static int ParseAttemptBucketIndex(string bucket)
        {
            // Buckets are typically "A1", "A2", ..., "A6+" (or "A6").
            // We convert to 1..6 for a simple weighted score.
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
        // =====================================================================
        // BuildDepthInsight
        // =====================================================================

        private static Insight BuildDepthInsight(
            string title,
            string metricKey,
            global::CodiviumKatexScoring.KatexAllResults katex,
            global::CodiviumCatalog.Catalog catalog,
            List<DepthRowDto> depthRows,
            List<string> depthTop,
            List<string> depthBottom,
            Dictionary<string, double> eMicro,
            Dictionary<string, double> eInterview,
            List<string> microCats,
            List<string> interviewCats,
            double lambda,
            double lambdaChart,
            global::CodiviumScoring.ScoringConfig cfg,
            string? trackFilter = null)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);
            string Disp(string canon)
            {
                if (catalog.UniverseCanonToDisplay.TryGetValue(canon, out var d)) return d;
                return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(canon);
            }
            var dMicro   = katex.DepthByTrack.TryGetValue("micro",    out var dm) ? dm : 0.0;
            var dInter   = katex.DepthByTrack.TryGetValue("interview", out var di) ? di : 0.0;
            var dOverall = katex.OverallDepth;

            var eByCat = trackFilter == "micro"     ? eMicro
                       : trackFilter == "interview" ? eInterview
                       : eMicro.Keys.Concat(eInterview.Keys)
                                .Distinct(StringComparer.Ordinal)
                                .ToDictionary(
                                    c => c,
                                    c => (eMicro.TryGetValue(c,    out var me) ? me : 0.0) +
                                         (eInterview.TryGetValue(c, out var ie) ? ie : 0.0),
                                    StringComparer.Ordinal);

            var cats = trackFilter == "micro"     ? microCats
                     : trackFilter == "interview" ? interviewCats
                     : microCats.Concat(interviewCats).Distinct(StringComparer.Ordinal).ToList();

            var catDepths = cats
                .Select(c => new {
                    canon = c, display = Disp(c),
                    e = eByCat.TryGetValue(c, out var ev) ? ev : 0.0,
                    depth = eByCat.TryGetValue(c, out var ev2) && ev2 > 0 ? 100.0 * (1.0 - Math.Exp(-ev2 / lambda)) : 0.0
                })
                .Where(x => x.e > 0)
                .OrderByDescending(x => x.depth)
                .ToList();

            var growthOpps = cats
                .Select(c => new {
                    display = Disp(c),
                    e = eByCat.TryGetValue(c, out var ev) ? ev : 0.0,
                    depth = eByCat.TryGetValue(c, out var ev2) && ev2 > 0 ? 100.0 * (1.0 - Math.Exp(-ev2 / lambda)) : 0.0
                })
                .Where(x => x.e > 0 && (100.0 - x.depth) > 5)
                .OrderByDescending(x => x.e)
                .Take(4)
                .Select(x => $"{x.display}: depth {F1(x.depth)}, {F1(100.0 - x.depth)} pts to gain")
                .ToList();

            var scoreValue = trackFilter == "micro"     ? dMicro
                           : trackFilter == "interview" ? dInter
                           : dOverall;

            var interp =
                scoreValue >= 80 ? "Strong \u2014 most practised categories are near-saturated." :
                scoreValue >= 55 ? "Moderate \u2014 solid evidence; more repetition will push depth further." :
                scoreValue >= 30 ? "Developing \u2014 concentrated practice in a few categories will raise depth faster." :
                                   "Early stage \u2014 consistent repetition in a few categories will produce visible gains quickly.";

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Your depth score",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string> { $"Score: {F1(scoreValue)} / 100", interp } }
                    }
                }
            };

            if (trackFilter == null)
            {
                sections.Add(new Section
                {
                    Heading = "Track breakdown",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Micro depth: {F1(dMicro)}",
                            $"Interview depth: {F1(dInter)}"
                        }}
                    }
                });
            }

            if (catDepths.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Strongest categories",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets",
                            Items = catDepths.Take(5).Select(x => $"{x.display}: {F1(x.depth)} (E={F1(x.e)})").ToList() }
                    }
                });
            }

            if (growthOpps.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Best growth opportunities",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = growthOpps }
                    }
                });
            }
            else if (catDepths.Count == 0)
            {
                sections.Add(new Section
                {
                    Heading = "Growth opportunities",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "p", Text = "No evidence yet. Complete accepted coding sessions to start building depth." }
                    }
                });
            }

            sections.Add(new Section
            {
                Heading = "How depth is computed (KaTeX)",
                Blocks = new List<Block>
                {
                    new Block { Kind = "p", Text = $"Per category: D = 100\u00d7(1\u2212exp(\u2212E/\u03bb)), with \u03bb={F1(lambda)}. Depth saturates: early evidence raises it quickly." },
                    new Block { Kind = "p", Text = "Overall depth is the evidence-weighted average of category depths." },
                    new Block { Kind = "note", Text = $"The depth-by-category chart uses \u03bb_chart={F1(lambdaChart)} for a consistent visual scale." }
                }
            });

            return new Insight
            {
                Title = title,
                Summary = "Evidence-weighted depth across categories; saturates as practice accumulates.",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildFirstTryInsight
        // =====================================================================

        private static Insight BuildFirstTryInsight(
            double firstTryPct,
            double avgAttempts,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            var byDiff = new Dictionary<string, (int firstTry, int total)>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in rawData.CodingSessionsByTrack)
            {
                if (global::CodiviumCatalog.CanonicalizeTrackId(kvp.Key) == "mcq") continue;
                foreach (var s in kvp.Value)
                {
                    if (s.UnitTestsTotal <= 0 || s.Attempts == null || s.Attempts.Count == 0) continue;
                    var aIdx = -1;
                    for (var i = 0; i < s.Attempts.Count; i++)
                        if (s.Attempts[i].UnitTestsPassed >= s.UnitTestsTotal) aIdx = i;
                    if (aIdx < 0) continue;
                    var diff = (s.Difficulty ?? "basic").Trim().ToLowerInvariant();
                    if (!byDiff.ContainsKey(diff)) byDiff[diff] = (0, 0);
                    var cur = byDiff[diff];
                    byDiff[diff] = (cur.firstTry + (aIdx == 0 ? 1 : 0), cur.total + 1);
                }
            }

            var diffLines = new List<string>();
            foreach (var d in new[] { "basic", "intermediate", "advanced" })
            {
                if (!byDiff.TryGetValue(d, out var v) || v.total == 0) continue;
                var pct = 100.0 * v.firstTry / v.total;
                diffLines.Add($"{CultureInfo.InvariantCulture.TextInfo.ToTitleCase(d)}: {F1(pct)}% ({v.firstTry}/{v.total})");
            }

            var interp =
                firstTryPct >= 60 ? "Strong \u2014 well-thought-out first submissions. Good planning and pre-submission testing." :
                firstTryPct >= 35 ? "Moderate \u2014 room to improve by slowing down on the first attempt." :
                                    "Low \u2014 consider: restate the problem, sketch the algorithm, trace one example before coding.";

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Your first-try pass rate",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Overall: {F1(firstTryPct)}% of accepted sessions solved on first attempt",
                            interp
                        }}
                    }
                }
            };

            if (diffLines.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Breakdown by difficulty",
                    Blocks = new List<Block> { new Block { Kind = "bullets", Items = diffLines } }
                });
            }

            sections.Add(new Section
            {
                Heading = "KaTeX link",
                Blocks = new List<Block>
                {
                    new Block { Kind = "p", Text = $"First-try is related to avg attempts ({F1(avgAttempts)} currently). A1 solves use full q_conv weight (g=1.00); A4+ use 0.78 or lower." },
                    new Block { Kind = "note", Text = "More reliable with 20+ accepted solves." }
                }
            });

            sections.Add(new Section
            {
                Heading = "How to improve",
                Blocks = new List<Block>
                {
                    new Block { Kind = "bullets", Items = new List<string>
                    {
                        "Restate the problem before touching the editor.",
                        "Trace one small example manually to confirm your algorithm.",
                        "After a miss, log the specific failure type \u2014 pattern recognition prevents repeats."
                    }}
                }
            });

            return new Insight
            {
                Title = "First-try pass rate",
                Summary = "How often you solve on the first submission \u2014 reflects pre-submission planning quality.",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildAvgAttemptsInsight
        // =====================================================================

        private static Insight BuildAvgAttemptsInsight(
            double avgAttempts,
            double firstTryPct,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            var buckets = new int[6];
            var total = 0;
            foreach (var kvp in rawData.CodingSessionsByTrack)
            {
                if (global::CodiviumCatalog.CanonicalizeTrackId(kvp.Key) == "mcq") continue;
                foreach (var s in kvp.Value)
                {
                    if (s.UnitTestsTotal <= 0 || s.Attempts == null || s.Attempts.Count == 0) continue;
                    var aIdx = -1;
                    for (var i = 0; i < s.Attempts.Count; i++)
                        if (s.Attempts[i].UnitTestsPassed >= s.UnitTestsTotal) aIdx = i;
                    if (aIdx < 0) continue;
                    buckets[Math.Min(aIdx, 5)]++;
                    total++;
                }
            }

            var gWeights = cfg.Katex?.Coding?.ConvergenceWeightsByAttemptBucket ?? new List<double> { 1.00, 0.92, 0.85, 0.78, 0.70, 0.60 };
            var labels   = new[] { "A1 (1)", "A2 (2)", "A3 (3)", "A4 (4)", "A5 (5)", "A6+ (6+)" };
            var distLines = new List<string>();
            for (var i = 0; i < 6; i++)
            {
                if (buckets[i] == 0) continue;
                var pct = total > 0 ? 100.0 * buckets[i] / total : 0.0;
                var g   = i < gWeights.Count ? gWeights[i] : 0.60;
                distLines.Add($"{labels[i]}: {buckets[i]} sessions ({F1(pct)}%) \u2014 q_conv={g:F2}");
            }

            var interp =
                avgAttempts <= 1.8 ? "Excellent \u2014 near first-try convergence. Highest evidence quality." :
                avgAttempts <= 2.8 ? "Good \u2014 A2\u2013A3 solves are normal and carry strong convergence weights." :
                avgAttempts <= 4.0 ? "Moderate \u2014 a meaningful share of solves in A4\u2013A5 (weights 0.78/0.70)." :
                                     "High \u2014 many A4+ solves drag evidence quality. Focus on planning and first-attempt correctness.";

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Your attempts profile",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Average: {F1(avgAttempts)} attempts to acceptance",
                            $"First-try pass rate: {F1(firstTryPct)}%",
                            interp
                        }}
                    }
                }
            };

            if (distLines.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Distribution by attempt bucket",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = distLines },
                        new Block { Kind = "note", Text = "q_conv is multiplied into every evidence contribution. More A1 solves = higher average evidence quality." }
                    }
                });
            }

            sections.Add(new Section
            {
                Heading = "What drives it",
                Blocks = new List<Block>
                {
                    new Block { Kind = "bullets", Items = new List<string>
                    {
                        "Difficulty: harder problems naturally need more attempts. High avg on Advanced is expected.",
                        "Familiarity: first-time category exposure needs more iterations. Repeating categories improves convergence.",
                        "Submission habits: partial solutions inflates attempt count without adding quality."
                    }}
                }
            });

            return new Insight
            {
                Title = "Average attempts to acceptance",
                Summary = "How many submissions to reach a passing solution \u2014 feeds evidence quality via q_conv (A1..A6).",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildMedianTimeInsight
        // =====================================================================

        private static Insight BuildMedianTimeInsight(
            double medianMinutes,
            double efficiencyPtsHr,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            static double Median(List<double> v) {
                if (v.Count == 0) return 0.0;
                var s = v.OrderBy(x => x).ToList();
                return s.Count % 2 == 0 ? (s[s.Count/2-1] + s[s.Count/2]) / 2.0 : s[s.Count/2];
            }

            var timesByDiff = new Dictionary<string, List<double>>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in rawData.CodingSessionsByTrack)
            {
                if (global::CodiviumCatalog.CanonicalizeTrackId(kvp.Key) == "mcq") continue;
                foreach (var s in kvp.Value)
                {
                    if (s.UnitTestsTotal <= 0 || s.Attempts == null || s.Attempts.Count == 0) continue;
                    var aIdx = -1;
                    for (var i = 0; i < s.Attempts.Count; i++)
                        if (s.Attempts[i].UnitTestsPassed >= s.UnitTestsTotal) aIdx = i;
                    if (aIdx < 0) continue;
                    var t = s.TimeToACMinutes ?? s.Attempts[aIdx].TimeToSubmissionMinutes;
                    if (t <= 0 || double.IsNaN(t) || double.IsInfinity(t)) continue;
                    var diff = (s.Difficulty ?? "basic").Trim().ToLowerInvariant();
                    if (!timesByDiff.ContainsKey(diff)) timesByDiff[diff] = new List<double>();
                    timesByDiff[diff].Add(t);
                }
            }

            var tdMap = new Dictionary<string, double> { ["basic"] = 90, ["intermediate"] = 120, ["advanced"] = 160 };
            var diffLines = new List<string>();
            foreach (var d in new[] { "basic", "intermediate", "advanced" })
            {
                if (!timesByDiff.TryGetValue(d, out var times) || times.Count == 0) continue;
                var med = Median(times);
                var td  = tdMap.TryGetValue(d, out var tdv) ? tdv : 120;
                var qt  = Math.Clamp(Math.Exp(-med / td), 0.6, 1.0);
                diffLines.Add($"{CultureInfo.InvariantCulture.TextInfo.ToTitleCase(d)}: median {F1(med)}m (q_time\u2248{F1(qt)} at T_d={td}m)");
            }

            var interp =
                medianMinutes <= 20 ? "Fast \u2014 efficient time-to-acceptance." :
                medianMinutes <= 40 ? "Moderate \u2014 typical. Reducing time on familiar problems improves efficiency." :
                medianMinutes <= 70 ? "Slow \u2014 check whether long solves are on harder problems (expected) or familiar ones." :
                                      "Very slow \u2014 median over 70 minutes reduces efficiency significantly. Consider timeboxing.";

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Your median time to acceptance",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Median: {F1(medianMinutes)} minutes",
                            interp
                        }}
                    }
                }
            };

            if (diffLines.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Breakdown by difficulty (with q_time)",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = diffLines },
                        new Block { Kind = "note", Text = "q_time = clamp(exp(-t/T_d), 0.6, 1.0). The 0.6 floor means time affects evidence only mildly \u2014 but time strongly affects efficiency (denominator)." }
                    }
                });
            }

            sections.Add(new Section
            {
                Heading = "Link to efficiency",
                Blocks = new List<Block>
                {
                    new Block { Kind = "p", Text = $"Current efficiency: {F1(efficiencyPtsHr)} pts/hr. Time is in the efficiency denominator (weighted by recency). Reducing median time on high-quality solves has a direct multiplying effect." },
                    new Block { Kind = "note", Text = "Median is used (not mean) because it is robust to occasional very long sessions." }
                }
            });

            return new Insight
            {
                Title = "Median time to acceptance",
                Summary = "How long accepted solves typically take \u2014 feeds efficiency (pts/hr) via the time denominator.",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildPointsAllTimeInsight
        // =====================================================================

        private static Insight BuildPointsAllTimeInsight(
            double pointsAll,
            double points30,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumKatexScoring.KatexAllResults katex,
            global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);
            var k     = cfg.Katex;
            var p0    = k?.Points?.P0    ?? 4.0;
            var pRedo = k?.Points?.Predo ?? 2.5;
            var pMcq  = k?.Mcq?.Points?.Pmcq ?? 0.8;
            var uAll  = Math.Max(0, rawData.UniqueCorrectMcqAllTime);

            var mcqPts = pMcq * Math.Sqrt(uAll);

            var exerciseIds   = new HashSet<string>(StringComparer.Ordinal);
            var totalAccepted = 0;
            foreach (var kvp in rawData.CodingSessionsByTrack)
            {
                if (global::CodiviumCatalog.CanonicalizeTrackId(kvp.Key) == "mcq") continue;
                foreach (var s in kvp.Value)
                {
                    if (s.UnitTestsTotal <= 0 || s.Attempts == null || s.Attempts.Count == 0) continue;
                    if (!s.Attempts.Any(a => a.UnitTestsPassed >= s.UnitTestsTotal)) continue;
                    if (!string.IsNullOrWhiteSpace(s.ExerciseId)) exerciseIds.Add(s.ExerciseId.Trim());
                    totalAccepted++;
                }
            }

            var approxCodingPts = Math.Max(0.0, pointsAll - mcqPts);
            var redoCount = Math.Max(0, totalAccepted - exerciseIds.Count);

            var decompLines = new List<string>
            {
                $"Total all-time: {F1(pointsAll)} pts",
                $"  Estimated coding (first-solve + redo): ~{F1(approxCodingPts)} pts",
                $"  MCQ component (P_mcq\u00d7\u221aU_all = {pMcq:F1}\u00d7\u221a{uAll}): ~{F1(mcqPts)} pts",
                $"  Distinct exercises solved: {exerciseIds.Count}, redo-eligible solves: {redoCount}"
            };

            if (points30 > 0 && pointsAll > 0)
                decompLines.Add($"  At your 30-day rate, this represents ~{F1(pointsAll / points30)} months of equivalent recent activity.");

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Points decomposition",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = decompLines }
                    }
                },
                new Section
                {
                    Heading = "How all-time points are computed",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "p", Text = $"Coding: P0={F1(p0)} per first-solve (weighted by difficulty and q_conv). Redo: P_redo={F1(pRedo)}\u00d7ln(1+R_valid), spaced \u22657 days. MCQ: P_mcq\u00d7\u221a(U_all)." },
                        new Block { Kind = "note", Text = "Points are separate from mastery: mastery only grows when you expand coverage or deepen evidence. Points can rise from repetition alone." }
                    }
                },
                new Section
                {
                    Heading = "How to grow all-time points",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Solve new exercises: each worth P0={F1(p0)}\u00d7difficulty\u00d7q_conv.",
                            "Return to solved exercises after 7+ days for redo credit (sublinear via ln).",
                            $"Increase MCQ correct answers \u2014 sqrt growth means early MCQ progress is most rewarding (currently U_all={uAll})."
                        }}
                    }
                }
            };

            return new Insight
            {
                Title = "All-time points",
                Summary = "Career progression: distinct solves + spaced redos + MCQ knowledge, combined into an uncapped total.",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildPoints30Insight
        // =====================================================================

        private static Insight BuildPoints30Insight(
            double points30,
            double pointsAll,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumKatexScoring.KatexAllResults katex,
            global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);
            var k     = cfg.Katex;
            var p0    = k?.Points?.P0    ?? 4.0;
            var pRedo = k?.Points?.Predo ?? 2.5;

            var windowStart = DateTimeOffset.UtcNow.AddDays(-30).UtcDateTime;
            var newIn30 = new HashSet<string>(StringComparer.Ordinal);
            var allEver = new HashSet<string>(StringComparer.Ordinal);
            var redoIn30 = 0;

            foreach (var kvp in rawData.CodingSessionsByTrack)
            {
                if (global::CodiviumCatalog.CanonicalizeTrackId(kvp.Key) == "mcq") continue;
                foreach (var s in kvp.Value)
                {
                    if (s.UnitTestsTotal <= 0 || s.Attempts == null || s.Attempts.Count == 0) continue;
                    if (!s.Attempts.Any(a => a.UnitTestsPassed >= s.UnitTestsTotal)) continue;
                    if (string.IsNullOrWhiteSpace(s.ExerciseId)) continue;
                    var exId = s.ExerciseId.Trim();
                    var isNew = !allEver.Contains(exId);
                    allEver.Add(exId);
                    if (s.CompletedAtUtc.HasValue && s.CompletedAtUtc.Value >= windowStart)
                    {
                        if (isNew) newIn30.Add(exId);
                        else redoIn30++;
                    }
                }
            }

            var trend = points30 > 0 && pointsAll > 0
                ? (points30 >= pointsAll / 3.0 ? "accelerating or maintaining strong momentum"
                 : points30 >= pointsAll / 6.0 ? "moderate recent activity"
                 : "recent activity below career average \u2014 consider increasing session frequency")
                : "not enough data";

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Your 30-day window",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Points (last 30 days): {F1(points30)}",
                            $"  New exercises solved (first-time): {newIn30.Count}",
                            $"  Valid redo solves (spaced 7+ days): {redoIn30}",
                            $"Trajectory: {trend}"
                        }}
                    }
                },
                new Section
                {
                    Heading = "How 30-day points are computed",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "p", Text = "30-day points count first-solves whose first accepted solve occurred within the last 30 days, plus redo solves whose redo attempt is in the window. This is a hard window, not a recency-decayed sum." },
                        new Block { Kind = "note", Text = "MCQ points are all-time only. The 30-day figure is coding-only." }
                    }
                },
                new Section
                {
                    Heading = "How to raise 30-day points",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Solve exercises you have not done before: each worth P0={F1(p0)}\u00d7difficulty\u00d7q_conv.",
                            "Revisit exercises solved more than 7 days ago: redo credit via P_redo\u00d7ln(1+R).",
                            "Consistency: 3\u20134 sessions of 20\u201330 minutes beats one long session."
                        }}
                    }
                }
            };

            return new Insight
            {
                Title = "Points (last 30 days)",
                Summary = "Momentum: verified new and revisited work produced in the last month (hard 30-day window).",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildEfficiencyInsight
        // =====================================================================

        private static Insight BuildEfficiencyInsight(
            double efficiencyPtsHr,
            double avgAttempts,
            double medianMinutes,
            global::CodiviumScoring.CodiviumRawData rawData,
            global::CodiviumCatalog.Catalog catalog,
            global::CodiviumKatexScoring.KatexAllResults katex,
            global::CodiviumScoring.ScoringConfig cfg)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);
            string F2(double x) => Math.Round(x, 2).ToString("0.00", CultureInfo.InvariantCulture);

            var k        = cfg.Katex;
            var halfLife = k?.Recency?.HalfLifeDays ?? 15.0;
            var eps      = k?.Efficiency?.EpsilonMinutes ?? 1.0;
            var asOf     = DateTimeOffset.UtcNow;

            double wSumQ = 0, wSumT = 0, wSum = 0;
            var timeByDiff = new Dictionary<string, List<(double w, double t)>>(StringComparer.OrdinalIgnoreCase);
            var qByDiff    = new Dictionary<string, List<(double w, double q)>>(StringComparer.OrdinalIgnoreCase);

            foreach (var kvp in rawData.CodingSessionsByTrack)
            {
                if (global::CodiviumCatalog.CanonicalizeTrackId(kvp.Key) == "mcq") continue;
                foreach (var s in kvp.Value)
                {
                    if (s.UnitTestsTotal <= 0 || s.Attempts == null || s.Attempts.Count == 0) continue;
                    var aIdx = -1;
                    for (var i = 0; i < s.Attempts.Count; i++)
                        if (s.Attempts[i].UnitTestsPassed >= s.UnitTestsTotal) aIdx = i;
                    if (aIdx < 0 || !s.CompletedAtUtc.HasValue) continue;
                    var t = s.TimeToACMinutes ?? s.Attempts[aIdx].TimeToSubmissionMinutes;
                    if (t <= 0 || double.IsNaN(t) || double.IsInfinity(t)) continue;

                    var w    = Math.Pow(0.5, Math.Max(0, (asOf.UtcDateTime - s.CompletedAtUtc.Value).TotalDays) / halfLife);
                    var diff = (s.Difficulty ?? "basic").Trim().ToLowerInvariant();
                    var fD   = k?.DifficultyFactor?.TryGetValue(diff, out var dv) == true ? dv : 1.0;
                    var gW   = k?.Coding?.ConvergenceWeightsByAttemptBucket ?? new List<double> { 1.00, 0.92, 0.85, 0.78, 0.70, 0.60 };
                    var bIdx = Math.Min(Math.Max(1, aIdx + 1), 6) - 1;
                    var qConv = bIdx < gW.Count ? gW[bIdx] : 0.60;
                    var qTries = Math.Clamp(1.0 / Math.Sqrt(Math.Max(1, aIdx + 1)),
                                            k?.Coding?.TriesFactor?.Min ?? 0.45,
                                            k?.Coding?.TriesFactor?.Max ?? 1.0);
                    var q = fD * qTries * qConv;

                    wSumQ += w * q; wSumT += w * t; wSum += w;
                    if (!timeByDiff.ContainsKey(diff)) timeByDiff[diff] = new();
                    if (!qByDiff.ContainsKey(diff))    qByDiff[diff]    = new();
                    timeByDiff[diff].Add((w, t));
                    qByDiff[diff].Add((w, q));
                }
            }

            var avgWQ = wSum > 0 ? wSumQ / wSum : 0.0;
            var avgWT = wSum > 0 ? wSumT / wSum : 0.0;

            var primaryLever =
                avgWT > 50 && avgWQ > 0.7
                    ? $"Time is your primary lever: avg {F1(avgWT)}m/solve. Reducing time on familiar problems would have the biggest impact." :
                avgWQ < 0.6 && avgAttempts > 3
                    ? $"Convergence quality is your primary lever: avg q={F2(avgWQ)} (dragged by high attempts). Improving first-try rate would raise efficiency most." :
                avgWT > 30
                    ? $"Both time ({F1(avgWT)}m avg) and quality ({F2(avgWQ)} avg) have room. Focus on categories where you are slowest." :
                    $"Good balance: avg {F1(avgWT)}m/solve, avg q={F2(avgWQ)}. Efficiency grows by maintaining this on harder problems.";

            var diffLines = new List<string>();
            foreach (var d in new[] { "basic", "intermediate", "advanced" })
            {
                if (!timeByDiff.TryGetValue(d, out var tl) || tl.Count == 0) continue;
                var wT = tl.Sum(x => x.w * x.t) / tl.Sum(x => x.w);
                var wQ = qByDiff.TryGetValue(d, out var ql) ? ql.Sum(x => x.w * x.q) / ql.Sum(x => x.w) : 0.0;
                diffLines.Add($"{CultureInfo.InvariantCulture.TextInfo.ToTitleCase(d)}: {F1(wT)}m/solve, q={F2(wQ)} ({tl.Count} sessions)");
            }

            var interp =
                efficiencyPtsHr >= 15 ? "Excellent \u2014 top-tier throughput." :
                efficiencyPtsHr >= 8  ? "Good \u2014 solid. Incremental gains from reducing time or improving early-attempt quality." :
                efficiencyPtsHr >= 3  ? "Moderate \u2014 meaningful room to improve. See primary lever below." :
                efficiencyPtsHr > 0   ? "Low \u2014 check whether long solve times or high attempts are the main driver." :
                                         "No data yet \u2014 efficiency is computed once accepted sessions with timestamps exist.";

            var sections = new List<Section>
            {
                new Section
                {
                    Heading = "Your efficiency",
                    Blocks = new List<Block>
                    {
                        new Block { Kind = "bullets", Items = new List<string>
                        {
                            $"Efficiency: {F1(efficiencyPtsHr)} pts/hr",
                            interp
                        }}
                    }
                },
                new Section
                {
                    Heading = "Primary lever for improvement",
                    Blocks = new List<Block> { new Block { Kind = "p", Text = primaryLever } }
                }
            };

            if (diffLines.Count > 0)
            {
                sections.Add(new Section
                {
                    Heading = "Breakdown by difficulty (recency-weighted)",
                    Blocks = new List<Block> { new Block { Kind = "bullets", Items = diffLines } }
                });
            }

            sections.Add(new Section
            {
                Heading = "How efficiency is computed (KaTeX)",
                Blocks = new List<Block>
                {
                    new Block { Kind = "p", Text = $"\u03b7 = \u03a3(w_i\u00d7q_i) / (\u03b5+\u03a3(w_i\u00d7t_i)) \u00d7 60 pts/hr. w_i=recency (half-life {F1(halfLife)}d), q_i=f_d\u00d7q_tries\u00d7q_conv (no time penalty), t_i=minutes, \u03b5={F1(eps)}min." },
                    new Block { Kind = "note", Text = "Time is not in q_i to avoid double-counting. Timeboxing helps efficiency without reducing evidence quality." }
                }
            });

            return new Insight
            {
                Title = "Efficiency (pts/hr)",
                Summary = "Quality-weighted throughput: diagnoses whether time, attempts, or difficulty mix is the main drag.",
                Sections = sections
            };
        }

        // =====================================================================
        // BuildTimeInsight
        // =====================================================================

        private static Insight BuildTimeInsight(
            List<DailyMinutesDto> daily,
            int last7,
            int last30,
            List<string> allocTop,
            double efficiencyPtsHr)
        {
            string F1(double x) => Math.Round(x, 1).ToString("0.0", CultureInfo.InvariantCulture);

            var activeDays30     = daily.TakeLast(Math.Min(30, daily.Count)).Count(d => d.Minutes > 0);
            var activeDays7      = daily.TakeLast(Math.Min(7,  daily.Count)).Count(d => d.Minutes > 0);
            var activeSessions30 = daily.TakeLast(Math.Min(30, daily.Count)).Where(d => d.Minutes > 0).ToList();
            var avgSession       = activeSessions30.Count > 0 ? activeSessions30.Average(d => d.Minutes) : 0.0;
            var peak             = daily.TakeLast(Math.Min(30, daily.Count)).OrderByDescending(d => d.Minutes).FirstOrDefault();
            var peakStr          = peak != null && peak.Minutes > 0 ? $"{peak.Date}: {peak.Minutes}m" : "none";

            var prior7 = daily.Count >= 14 ? (int?)daily.TakeLast(14).Take(7).Sum(d => d.Minutes) : null;
            var trendStr =
                prior7 == null            ? "not enough data" :
                last7 > prior7.Value * 1.15 ? $"increasing (last 7d: {last7}m, prior 7d: {prior7.Value}m)" :
                last7 < prior7.Value * 0.85 ? $"decreasing (last 7d: {last7}m, prior 7d: {prior7.Value}m)" :
                                              $"stable (last 7d: {last7}m, prior 7d: {prior7.Value}m)";

            var qualityNote = efficiencyPtsHr > 0 && last30 > 0
                ? $"At {F1(efficiencyPtsHr)} pts/hr, your {last30} minutes in the last 30 days imply ~{F1(efficiencyPtsHr * last30 / 60.0)} pts \u2014 compare to your actual 30-day points to see how close the theory is."
                : "Time alone does not drive mastery. Evidence quality (accepted solves in new and practised categories) is what matters.";

            return new Insight
            {
                Title = "Time on platform",
                Summary = "Practice time distribution: frequency, session length, trend, and category allocation.",
                Sections = new List<Section>
                {
                    new Section
                    {
                        Heading = "Time snapshot (last 30 days)",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets", Items = new List<string>
                            {
                                $"Last 7 days: {last7}m across {activeDays7} active day(s)",
                                $"Last 30 days: {last30}m across {activeDays30} active day(s)",
                                $"Average session length (active days): {F1(avgSession)}m",
                                $"Peak day (last 30): {peakStr}",
                                $"Volume trend: {trendStr}"
                            }}
                        }
                    },
                    new Section
                    {
                        Heading = "Where your time is going",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "bullets",
                                Items = allocTop.Count > 0 ? allocTop : new List<string> { "No allocation data yet." } },
                            new Block { Kind = "note", Text = "If one category dominates, breadth may stall. Keep strong categories warm while adding time to weak or missing ones." }
                        }
                    },
                    new Section
                    {
                        Heading = "Time and quality",
                        Blocks = new List<Block>
                        {
                            new Block { Kind = "p", Text = qualityNote },
                            new Block { Kind = "bullets", Items = new List<string>
                            {
                                "Consistency over volume: 4\u00d75 sessions of 25\u201340 minutes is more effective than one 3-hour session.",
                                "After a miss, a 2-minute reflection is worth more than immediately re-attempting.",
                                "Category rotation: some time on unfamiliar categories keeps breadth moving even when depth sessions dominate."
                            }}
                        }
                    }
                }
            };
        }

    }
}

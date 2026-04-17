// CodiviumKatexScoring.v1.cs
//
// KaTeX-aligned scoring implementation.
//
// This file is the "executable mirror" of the formulas documented in:
//   assets/docs/codivium_scoring_katex.html
//
// Goal:
// - Given a raw data payload (CodiviumScoring.CodiviumRawData) and a category catalog (CodiviumCatalog.Catalog),
//   compute mastery (breadth + depth + Codivium score) PLUS points and efficiency.
// - Use constants from cfg.Katex (config/scoring-config.v1.json → "katex" section).
// - Keep behavior explicit, conservative, and heavily commented so a new developer can follow it.
//
// Notes on terminology:
// - "coding event" e = a single coding session that eventually reached Accepted (all tests passed).
// - "quiz attempt" q = a single MCQ quiz attempt.
// - Evidence E_{a,c} is computed per activity/track a and category c.
// - Breadth uses activation threshold tau_E and entropy-based balance.
// - Depth uses a saturating curve 100*(1-exp(-E/lambda)).
// - Score uses harmonic mean of overall breadth B and overall depth D.

#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;

public static class CodiviumKatexScoring
{
    // ------------------------------------------------------------
    // Public result containers
    // ------------------------------------------------------------

    public sealed class KatexAllResults
    {
        public required DateTimeOffset AsOfUtc { get; init; }

        // Evidence per track per category: evidence[trackCanon][categoryCanon] = E_{track,category}.
        public required Dictionary<string, Dictionary<string, double>> EvidenceByTrackByCategory { get; init; }

        // Breadth values (0..100).
        public required Dictionary<string, double> BreadthByTrack { get; init; }
        public required double OverallBreadth { get; init; }

        // Depth values (0..100). (Coding tracks only)
        public required Dictionary<string, double> DepthByTrack { get; init; }
        public required double OverallDepth { get; init; }

        // Mastery score (0..100): harmonic mean of overall breadth + overall depth.
        public required double CodiviumScore { get; init; }

        // Points + efficiency
        public required double PointsAllTime { get; init; }
        public required double PointsLast30Days { get; init; }
        public required double EfficiencyPointsPerHour { get; init; }

        // Convenience: depth-by-category chart values (0..100) for combined coding.
        public required Dictionary<string, double> DepthChartByCategory { get; init; }
    }

    // ------------------------------------------------------------
    // Entry point
    // ------------------------------------------------------------

    public static KatexAllResults ComputeAll(
        CodiviumScoring.CodiviumRawData rawData,
        CodiviumCatalog.Catalog catalog,
        DateTimeOffset asOfUtc)
    {
        if (rawData is null) throw new ArgumentNullException(nameof(rawData));
        if (catalog is null) throw new ArgumentNullException(nameof(catalog));

        // Fail fast if KaTeX config is missing or invalid.
        CodiviumConfigValidation.ValidateOrThrow(rawData.Config);

        // 1) Evidence
        var evidence = ComputeEvidenceByTrackByCategory(rawData, catalog, asOfUtc);

        // 2) Breadth
        var breadthByTrack = ComputeBreadthByTrack(rawData, catalog, evidence);
        var overallBreadth = ComputeOverallBreadth(rawData, breadthByTrack);

        // 3) Depth (coding only)
        var depthByTrack = ComputeDepthByTrack(rawData, catalog, evidence);
        var overallDepth = ComputeOverallDepth(rawData, depthByTrack);

        // 4) Codivium Score (harmonic mean)
        var score = ComputeCodiviumScore(rawData, overallBreadth, overallDepth);

        // 5) Points + efficiency
        var pointsAll = ComputePointsAllTime(rawData, catalog, asOfUtc);
        var points30 = ComputePointsLast30Days(rawData, catalog, asOfUtc);
        var eff = ComputeEfficiencyPointsPerHour(rawData, catalog, asOfUtc);

        // 6) Depth chart (combined coding categories)
        var depthChart = ComputeDepthChartByCategory(rawData, catalog, evidence);

        return new KatexAllResults
        {
            AsOfUtc = asOfUtc,
            EvidenceByTrackByCategory = evidence,
            BreadthByTrack = breadthByTrack,
            OverallBreadth = overallBreadth,
            DepthByTrack = depthByTrack,
            OverallDepth = overallDepth,
            CodiviumScore = score,
            PointsAllTime = pointsAll,
            PointsLast30Days = points30,
            EfficiencyPointsPerHour = eff,
            DepthChartByCategory = depthChart,
        };
    }

    // ------------------------------------------------------------
    // Evidence
    // ------------------------------------------------------------

    /// <summary>
    /// Computes E_{a,c} for each track a and category c.
    ///
    /// Coding evidence contribution follows:
    ///   contrib_code(e) = w_a * o(e) * f_d * decay(e)
    /// where:
    ///   w_a   = activity weight for the coding track (micro/interview)
    ///   f_d   = difficulty_factor by difficulty label
    ///   decay = 0.5^(Δ/H)
    ///   o(e)  = 1{accepted} * q_tries * q_conv * q_time
    ///
    /// MCQ evidence contribution follows:
    ///   contrib_mcq(q) = f_d * (p/100)^gamma * decay(q)   (if uses_recency_decay)
    ///
    /// Evidence is ALWAYS stored against the canonical track id and canonical category key.
    /// Categories missing from availability lists are ignored.
    /// </summary>
    public static Dictionary<string, Dictionary<string, double>> ComputeEvidenceByTrackByCategory(
        CodiviumScoring.CodiviumRawData rawData,
        CodiviumCatalog.Catalog catalog,
        DateTimeOffset asOfUtc)
    {
        var cfg = rawData.Config;
        var k = cfg.Katex;

        // Initialize with all currently available categories per track.
        // This ensures deterministic keys (front-end tables/loops don't need to null-check).
        var result = new Dictionary<string, Dictionary<string, double>>(StringComparer.Ordinal);
        foreach (var t in catalog.TracksByCanonId.Values)
        {
            var set = t.CategoriesCanonSet;
            var dict = new Dictionary<string, double>(StringComparer.Ordinal);
            foreach (var c in set) dict[c] = 0.0;
            result[t.TrackIdCanon] = dict;
        }

        // Helper: decay(x) = 0.5^(Δ/H)
        double Decay(DateTime utcEventTime)
        {
            var deltaDays = Math.Max(0.0, (asOfUtc.UtcDateTime - utcEventTime).TotalDays);
            return Math.Pow(0.5, deltaDays / k.Recency.HalfLifeDays);
        }
        // Helper: normalize difficulty label to the KaTeX canonical strings:
        //   basic | intermediate | advanced
        //
        // NOTE:
        // - The raw payload SHOULD provide these strings (as in the KaTeX document).
        // - Legacy payloads sometimes used numeric 1..3; those are normalized earlier via DifficultyValueConverter.
        string DifficultyLabel(string? d)
        {
            var s = (d ?? string.Empty).Trim().ToLowerInvariant();

            // Defensive synonyms (in case upstream uses easy/medium/hard).
            if (s == "easy") s = "basic";
            if (s == "medium") s = "intermediate";
            if (s == "hard") s = "advanced";

            // Fall back to "basic" to avoid dictionary KeyNotFound in misconfigured inputs.
            // (Config validation should catch bad difficulty values; this is only a safety net.)
            if (s != "basic" && s != "intermediate" && s != "advanced") s = "basic";
            return s;
        }

        double DifficultyFactor(string? d)
        {
            var label = DifficultyLabel(d);
            if (k.DifficultyFactor.TryGetValue(label, out var f)) return f;
            return 1.0; // Validation should prevent this, but keep safe.
        }
        // Coding sessions: micro + interview
        foreach (var kvp in rawData.CodingSessionsByTrack)
        {
            var trackCanon = CodiviumCatalog.CanonicalizeTrackId(kvp.Key);
            if (!result.ContainsKey(trackCanon))
                continue; // unknown/legacy track

            if (trackCanon == "mcq")
                continue; // coding evidence is only for coding tracks

            var wA = 1.0;
            if (k.Coding.ActivityWeightByTrack.TryGetValue(trackCanon, out var w)) wA = w;

            foreach (var session in kvp.Value)
            {
                // Resolve + validate category against "current availability".
                var categoryCanon = catalog.ResolveCategoryKey((session.CategoryId ?? session.CategoryLegacy) ?? string.Empty);
                if (!catalog.GetAvailableSetForTrack(trackCanon).Contains(categoryCanon))
                    continue;

                // Determine whether the session reached Accepted.
                if (session.UnitTestsTotal <= 0) continue;
                if (session.Attempts is null || session.Attempts.Count == 0) continue;

                var acceptedAttemptIndex = -1;
                for (var i = 0; i < session.Attempts.Count; i++)
                {
                    if (session.Attempts[i].UnitTestsPassed >= session.UnitTestsTotal)
                        acceptedAttemptIndex = i; // keep last accepted attempt
                }

                if (acceptedAttemptIndex < 0) continue; // not solved

                var attemptsToAccepted = acceptedAttemptIndex + 1;

                // t_correct: time to correct/accepted solve (minutes). We use the time-to-submission of
                // the accepted attempt. If it's missing/zero, we treat it as unavailable and skip.
                var tCorrect = session.TimeToACMinutes ?? session.Attempts[acceptedAttemptIndex].TimeToSubmissionMinutes;
                if (tCorrect <= 0 || double.IsNaN(tCorrect) || double.IsInfinity(tCorrect))
                    continue;

                // KaTeX requires a real timestamp per accepted solve so recency decay is meaningful.
//
// IMPORTANT (KaTeX alignment):
// - The KaTeX document names this field CompletedAtUtc.
// - We intentionally do NOT fall back to attempt timestamps or StartedAtUtc,
//   because that would silently distort decay and diverge from the documented spec.
var tEvent = session.CompletedAtUtc;
if (!tEvent.HasValue)
    throw new InvalidOperationException("KaTeX scoring requires CompletedAtUtc for accepted coding sessions.");

                // q_tries = clamp(1/sqrt(attemptsToAccepted), min, max)
                var qTries = 1.0 / Math.Sqrt(Math.Max(1, attemptsToAccepted));
                qTries = Clamp(qTries, k.Coding.TriesFactor.Min, k.Coding.TriesFactor.Max);

                // q_conv = convergence weight by attempt bucket A1..A6.
                // Bucket = min(attemptsToAccepted, 6).
                var bucketIndex = Math.Min(Math.Max(1, attemptsToAccepted), 6) - 1;
                var qConv = k.Coding.ConvergenceWeightsByAttemptBucket[bucketIndex];

                // q_time = clamp(exp(-tCorrect/Td), min, max)
                var td = k.Coding.TimeFactor.TdMinutesByDifficulty[DifficultyLabel(session.Difficulty)];
                var qTime = Math.Exp(-tCorrect / td);
                qTime = Clamp(qTime, k.Coding.TimeFactor.Min, k.Coding.TimeFactor.Max);

                // f_d
                var fD = DifficultyFactor(session.Difficulty);

                // decay
                var decay = Decay(tEvent.Value);

                // o(e) = 1{accepted} * q_tries * q_conv * q_time (accepted is already enforced)
                var o = qTries * qConv * qTime;

                // Evidence contribution
                var contrib = wA * o * fD * decay;
                result[trackCanon][categoryCanon] += contrib;
            }
        }

        // MCQ attempts: evidence for mcq track only
        // NOTE: McqAttemptsByTrack is namespaced by track so it can support future experiments.
        foreach (var kvp in rawData.McqAttemptsByTrack)
        {
            var trackCanon = CodiviumCatalog.CanonicalizeTrackId(kvp.Key);
            if (trackCanon != "mcq") continue;
            if (!result.ContainsKey(trackCanon)) continue;

            foreach (var attempt in kvp.Value)
            {
                var categoryCanon = catalog.ResolveCategoryKey((attempt.CategoryId ?? attempt.CategoryLegacy) ?? string.Empty);
                if (!catalog.GetAvailableSetForTrack(trackCanon).Contains(categoryCanon))
                    continue;

                var p = Clamp((attempt.ScorePercent ?? attempt.PercentLegacy) ?? 0.0, 0.0, 100.0);
                var p01 = p / 100.0;

                var fD = DifficultyFactor(attempt.Difficulty);

                // decay is optional for MCQ breadth; controlled by config.
                var decay = 1.0;
                if (k.Mcq.Breadth.UsesRecencyDecay)
                {
                    // KaTeX document field name: CompletedAtUtc.
                    // Legacy payloads used takenAtUtc; we accept it as a deprecated alias.
                    var ts = attempt.CompletedAtUtc ?? attempt.TakenAtUtcLegacy;
                    if (!ts.HasValue)
                        throw new InvalidOperationException("KaTeX scoring requires CompletedAtUtc for MCQ attempts when uses_recency_decay=true.");
                    decay = Decay(ts.Value);
                }

                var contrib = fD * Math.Pow(p01, k.Mcq.Breadth.Gamma) * decay;
                result[trackCanon][categoryCanon] += contrib;
            }
        }

        return result;
    }

    // ------------------------------------------------------------
    // Breadth
    // ------------------------------------------------------------

    private static Dictionary<string, double> ComputeBreadthByTrack(
        CodiviumScoring.CodiviumRawData rawData,
        CodiviumCatalog.Catalog catalog,
        Dictionary<string, Dictionary<string, double>> evidence)
    {
        var cfg = rawData.Config;
        var k = cfg.Katex;

        var res = new Dictionary<string, double>(StringComparer.Ordinal);

        foreach (var trackCanon in evidence.Keys)
        {
            // Only compute breadth for tracks that are declared in catalog.
            if (!catalog.TracksByCanonId.ContainsKey(trackCanon)) continue;

            var categories = catalog.GetAvailableSetForTrack(trackCanon);
            var K = categories.Count;
            if (K == 0)
            {
                res[trackCanon] = 0.0;
                continue;
            }

            // T_a = Σ E_{a,c}
            var totalEvidence = 0.0;
            foreach (var c in categories)
            {
                if (evidence[trackCanon].TryGetValue(c, out var e)) totalEvidence += e;
            }

            // cov_a = (# activated categories) / |C_a|
            var activated = 0;
            foreach (var c in categories)
            {
                if (evidence[trackCanon].TryGetValue(c, out var e) && e >= k.Breadth.TauE)
                    activated++;
            }

            var cov = activated / (double)K;

            // balance_a = normalized entropy of evidence distribution over C_a.
            // p_c = E_{a,c} / T_a.
            // balance = H(p)/log(K).
            var balance = 0.0;
            if (totalEvidence > 0 && K > 1)
            {
                var entropy = 0.0;
                foreach (var c in categories)
                {
                    if (!evidence[trackCanon].TryGetValue(c, out var e) || e <= 0) continue;
                    var p = e / totalEvidence;
                    entropy += -p * Math.Log(p);
                }

                var maxEntropy = Math.Log(K);
                balance = maxEntropy > 0 ? (entropy / maxEntropy) : 0.0;
                balance = Clamp(balance, 0.0, 1.0);
            }

            // conf_a = 1 - exp(-T_a / k_a)
            var kA = k.Breadth.ConfidenceKByTrack.TryGetValue(trackCanon, out var kVal) ? kVal : 1.0;
            var conf = totalEvidence <= 0 ? 0.0 : (1.0 - Math.Exp(-totalEvidence / kA));
            conf = Clamp(conf, 0.0, 1.0);

            // B_a = 100 * conf_a * (alpha*cov_a + beta*balance_a)
            var blend = (k.Breadth.Alpha * cov) + (k.Breadth.Beta * balance);
            var breadth = 100.0 * conf * blend;
            breadth = Clamp(breadth, 0.0, 100.0);

            res[trackCanon] = breadth;
        }

        // Ensure missing tracks have 0 (makes consumers simpler).
        if (!res.ContainsKey("micro")) res["micro"] = 0.0;
        if (!res.ContainsKey("interview")) res["interview"] = 0.0;
        if (!res.ContainsKey("mcq")) res["mcq"] = 0.0;

        return res;
    }

    private static double ComputeOverallBreadth(CodiviumScoring.CodiviumRawData rawData, Dictionary<string, double> breadthByTrack)
    {
        var k = rawData.Config.Katex;

        // B = Σ w_a * B_a
        // If weights don't sum to 1, we still apply them as-is (as documented).
        var sum = 0.0;
        foreach (var kvp in k.Breadth.OverallWeights)
        {
            var trackCanon = CodiviumCatalog.CanonicalizeTrackId(kvp.Key);
            var w = kvp.Value;
            breadthByTrack.TryGetValue(trackCanon, out var b);
            sum += w * b;
        }

        return Clamp(sum, 0.0, 100.0);
    }

    // ------------------------------------------------------------
    // Depth
    // ------------------------------------------------------------

    private static Dictionary<string, double> ComputeDepthByTrack(
        CodiviumScoring.CodiviumRawData rawData,
        CodiviumCatalog.Catalog catalog,
        Dictionary<string, Dictionary<string, double>> evidence)
    {
        var cfg = rawData.Config;
        var k = cfg.Katex;
        var res = new Dictionary<string, double>(StringComparer.Ordinal);

        foreach (var trackCanon in new[] { "micro", "interview" })
        {
            if (!evidence.ContainsKey(trackCanon))
            {
                res[trackCanon] = 0.0;
                continue;
            }

            var categories = catalog.GetAvailableSetForTrack(trackCanon);
            var totalEvidence = 0.0;
            foreach (var c in categories)
            {
                if (evidence[trackCanon].TryGetValue(c, out var e)) totalEvidence += e;
            }

            if (totalEvidence <= 0)
            {
                res[trackCanon] = 0.0;
                continue;
            }

            // D_{a,c} = 100*(1-exp(-E_{a,c}/lambda))
            // D_a     = Σ (E_{a,c} * D_{a,c}) / Σ E_{a,c}
            var weighted = 0.0;
            foreach (var c in categories)
            {
                if (!evidence[trackCanon].TryGetValue(c, out var e) || e <= 0) continue;
                var dAc = 100.0 * (1.0 - Math.Exp(-e / k.Depth.Lambda));
                weighted += e * dAc;
            }

            var depth = weighted / totalEvidence;
            depth = Clamp(depth, 0.0, 100.0);
            res[trackCanon] = depth;
        }

        return res;
    }

    private static double ComputeOverallDepth(CodiviumScoring.CodiviumRawData rawData, Dictionary<string, double> depthByTrack)
    {
        var k = rawData.Config.Katex;

        // D = Σ w_a * D_a (coding tracks)
        var sum = 0.0;
        foreach (var kvp in k.Depth.OverallWeights)
        {
            var trackCanon = CodiviumCatalog.CanonicalizeTrackId(kvp.Key);
            var w = kvp.Value;
            depthByTrack.TryGetValue(trackCanon, out var d);
            sum += w * d;
        }

        return Clamp(sum, 0.0, 100.0);
    }

    private static Dictionary<string, double> ComputeDepthChartByCategory(
        CodiviumScoring.CodiviumRawData rawData,
        CodiviumCatalog.Catalog catalog,
        Dictionary<string, Dictionary<string, double>> evidence)
    {
        var k = rawData.Config.Katex;

        // Chart categories = union of coding categories.
        var categories = catalog.CodingUniverseCanonOrder;

        var res = new Dictionary<string, double>(StringComparer.Ordinal);
        foreach (var c in categories)
        {
            var eMicro = (evidence.ContainsKey("micro") && evidence["micro"].TryGetValue(c, out var em)) ? em : 0.0;
            var eInterview = (evidence.ContainsKey("interview") && evidence["interview"].TryGetValue(c, out var ei)) ? ei : 0.0;
            var eChart = eMicro + eInterview;

            // D_chart(c) = 100*(1-exp(-E_chart(c)/lambda_chart))
            var d = eChart <= 0 ? 0.0 : 100.0 * (1.0 - Math.Exp(-eChart / k.Depth.LambdaChart));
            d = Clamp(d, 0.0, 100.0);
            res[c] = d;
        }

        return res;
    }

    // ------------------------------------------------------------
    // Codivium Score (harmonic mean)
    // ------------------------------------------------------------

    private static double ComputeCodiviumScore(CodiviumScoring.CodiviumRawData rawData, double breadth, double depth)
    {
        // S = 2*B*D/(B+D), but only if both are positive (edge case policy).
        if (rawData.Config.Katex.EdgeCases.HarmonicMeanRequiresPositiveTerms)
        {
            if (breadth <= 0 || depth <= 0) return 0.0;
        }

        var denom = breadth + depth;
        if (denom <= 0) return 0.0;
        var s = (2.0 * breadth * depth) / denom;
        return Clamp(s, 0.0, 100.0);
    }

    // ------------------------------------------------------------
    // Points (all-time + last-30-days)
    // ------------------------------------------------------------

    private sealed class AcceptedSolveEvent
    {
        public required string ExerciseId { get; init; }
        public required string TrackCanon { get; init; }
        public required string Difficulty { get; init; }
        public required DateTime OccurredAtUtc { get; init; }
        public required int AttemptsToAccepted { get; init; }
        public required double MinutesToAccepted { get; init; }
    }

    private static double ComputePointsAllTime(CodiviumScoring.CodiviumRawData rawData, CodiviumCatalog.Catalog catalog, DateTimeOffset asOfUtc)
    {
        var k = rawData.Config.Katex;
        var events = CollectAcceptedSolveEvents(rawData, catalog, asOfUtc);

        // S_first = first accepted solve per exercise.
        var first = events
            .GroupBy(e => e.ExerciseId, StringComparer.Ordinal)
            .Select(g => g.OrderBy(e => e.OccurredAtUtc).First())
            .ToList();

        // Points from first solves
        var codingPoints = 0.0;
        foreach (var e in first)
        {
            codingPoints += SolvePoints(rawData, e);
        }

        // Redo validity counts per exercise
        var redoCounts = ComputeValidRedoCounts(events, windowStartUtc: null, asOfUtc.UtcDateTime, k.Points.RedoSpacingDays);

        var redoPoints = 0.0;
        foreach (var kvp in redoCounts)
        {
            var exId = kvp.Key;
            var rValid = kvp.Value;
            if (rValid <= 0) continue;

            // Metadata (track/difficulty) is taken from the first accepted solve.
            var meta = first.FirstOrDefault(x => x.ExerciseId == exId);
            if (meta is null) continue;

            redoPoints += RedoPoints(rawData, meta, rValid);
        }

        // MCQ points: use U_all only (as per current data availability).
        //
        // KaTeX name: UniqueCorrectMcqAllTime (U_all).
        // Legacy alias accepted: mcqDistinctCorrectAllTime.
        var uAll = rawData.UniqueCorrectMcqAllTime;
        if (uAll < 0)
            uAll = rawData.McqDistinctCorrectAllTimeLegacy;

        if (uAll < 0)
            throw new InvalidOperationException("Raw payload missing UniqueCorrectMcqAllTime (KaTeX U_all).");

        var mcqPoints = k.Points.Pmcq * Math.Sqrt(uAll);

        return Math.Max(0.0, codingPoints + redoPoints + mcqPoints);
    }

    private static double ComputePointsLast30Days(CodiviumScoring.CodiviumRawData rawData, CodiviumCatalog.Catalog catalog, DateTimeOffset asOfUtc)
    {
        var k = rawData.Config.Katex;
        var events = CollectAcceptedSolveEvents(rawData, catalog, asOfUtc);

        var windowStart = asOfUtc.UtcDateTime.AddDays(-30);

        // First accepted solves per exercise (global), then filter to those whose first solve is in the window.
        var first = events
            .GroupBy(e => e.ExerciseId, StringComparer.Ordinal)
            .Select(g => g.OrderBy(e => e.OccurredAtUtc).First())
            .Where(e => e.OccurredAtUtc >= windowStart && e.OccurredAtUtc <= asOfUtc.UtcDateTime)
            .ToList();

        var codingPoints30 = 0.0;
        foreach (var e in first)
        {
            codingPoints30 += SolvePoints(rawData, e);
        }

        // Valid redo counts, but count ONLY redo events that occurred within the window.
        var redoCounts30 = ComputeValidRedoCounts(events, windowStart, asOfUtc.UtcDateTime, k.Points.RedoSpacingDays);

        // Metadata for redo points: use the exercise's first accepted solve (even if that first solve was outside window).
        var metaByExercise = events
            .GroupBy(e => e.ExerciseId, StringComparer.Ordinal)
            .Select(g => g.OrderBy(e => e.OccurredAtUtc).First())
            .ToDictionary(e => e.ExerciseId, e => e, StringComparer.Ordinal);

        var redoPoints30 = 0.0;
        foreach (var kvp in redoCounts30)
        {
            if (kvp.Value <= 0) continue;
            if (!metaByExercise.TryGetValue(kvp.Key, out var meta)) continue;
            redoPoints30 += RedoPoints(rawData, meta, kvp.Value);
        }

        // MCQ points 30d not implemented (requires per-question timestamped data).
        return Math.Max(0.0, codingPoints30 + redoPoints30);
    }

    private static double SolvePoints(CodiviumScoring.CodiviumRawData rawData, AcceptedSolveEvent e)
    {
        var k = rawData.Config.Katex;

        // P0 * w_a * f_d * q_conv
        var wA = k.Coding.ActivityWeightByTrack.TryGetValue(e.TrackCanon, out var w) ? w : 1.0;
        var fD = rawData.Config.Katex.DifficultyFactor[DifficultyLabel(e.Difficulty)];
        var qConv = rawData.Config.Katex.Coding.ConvergenceWeightsByAttemptBucket[Math.Min(Math.Max(1, e.AttemptsToAccepted), 6) - 1];

        return k.Points.P0 * wA * fD * qConv;
    }

    private static double RedoPoints(CodiviumScoring.CodiviumRawData rawData, AcceptedSolveEvent meta, int rValid)
    {
        var k = rawData.Config.Katex;
        var wA = k.Coding.ActivityWeightByTrack.TryGetValue(meta.TrackCanon, out var w) ? w : 1.0;
        var fD = rawData.Config.Katex.DifficultyFactor[DifficultyLabel(meta.Difficulty)];

        // Predo * w_a * f_d * ln(1 + R_valid)
        return k.Points.Predo * wA * fD * Math.Log(1.0 + Math.Max(0, rValid));
    }

    private static Dictionary<string, int> ComputeValidRedoCounts(
        List<AcceptedSolveEvent> events,
        DateTime? windowStartUtc,
        DateTime windowEndUtc,
        double spacingDays)
    {
        // For each exercise, sort accepted events by time and count "redo" events that satisfy spacing >= G.
        // If windowStartUtc is provided, count only redo events whose timestamp is within [windowStartUtc, windowEndUtc].
        var res = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var g in events.GroupBy(e => e.ExerciseId, StringComparer.Ordinal))
        {
            var sorted = g.OrderBy(e => e.OccurredAtUtc).ToList();
            if (sorted.Count < 2) continue;

            var count = 0;
            for (var i = 1; i < sorted.Count; i++)
            {
                var prev = sorted[i - 1];
                var cur = sorted[i];
                var delta = (cur.OccurredAtUtc - prev.OccurredAtUtc).TotalDays;
                if (delta < spacingDays) continue;

                if (windowStartUtc.HasValue)
                {
                    if (cur.OccurredAtUtc < windowStartUtc.Value || cur.OccurredAtUtc > windowEndUtc)
                        continue;
                }

                count++;
            }

            if (count > 0) res[g.Key] = count;
        }

        return res;
    }

    private static List<AcceptedSolveEvent> CollectAcceptedSolveEvents(
        CodiviumScoring.CodiviumRawData rawData,
        CodiviumCatalog.Catalog catalog,
        DateTimeOffset asOfUtc)
    {
        var events = new List<AcceptedSolveEvent>();

        foreach (var kvp in rawData.CodingSessionsByTrack)
        {
            var trackCanon = CodiviumCatalog.CanonicalizeTrackId(kvp.Key);
            if (trackCanon == "mcq") continue;

            foreach (var session in kvp.Value)
            {
                // ExerciseId is required for KaTeX points.
                if (string.IsNullOrWhiteSpace(session.ExerciseId)) continue;

                // Must be a known category.
                var categoryCanon = catalog.ResolveCategoryKey((session.CategoryId ?? session.CategoryLegacy) ?? string.Empty);
                if (!catalog.GetAvailableSetForTrack(trackCanon).Contains(categoryCanon))
                    continue;

                if (session.UnitTestsTotal <= 0) continue;
                if (session.Attempts is null || session.Attempts.Count == 0) continue;

                var acceptedAttemptIndex = -1;
                for (var i = 0; i < session.Attempts.Count; i++)
                {
                    if (session.Attempts[i].UnitTestsPassed >= session.UnitTestsTotal)
                        acceptedAttemptIndex = i;
                }
                if (acceptedAttemptIndex < 0) continue;

                var attemptsToAccepted = acceptedAttemptIndex + 1;
                var minutesToAccepted = session.TimeToACMinutes ?? session.Attempts[acceptedAttemptIndex].TimeToSubmissionMinutes;
                if (minutesToAccepted <= 0 || double.IsNaN(minutesToAccepted) || double.IsInfinity(minutesToAccepted))
                    continue;

                var occurredAt = session.CompletedAtUtc;
                if (!occurredAt.HasValue)
                    throw new InvalidOperationException("KaTeX points/efficiency require CompletedAtUtc for accepted solves.");

                events.Add(new AcceptedSolveEvent
                {
                    ExerciseId = session.ExerciseId.Trim(),
                    TrackCanon = trackCanon,
                    Difficulty = session.Difficulty,
                    OccurredAtUtc = occurredAt.Value,
                    AttemptsToAccepted = attemptsToAccepted,
                    MinutesToAccepted = minutesToAccepted,
                });
            }
        }

        return events;
    }

    // ------------------------------------------------------------
    // Efficiency
    // ------------------------------------------------------------

    private static double ComputeEfficiencyPointsPerHour(CodiviumScoring.CodiviumRawData rawData, CodiviumCatalog.Catalog catalog, DateTimeOffset asOfUtc)
    {
        var cfg = rawData.Config;
        var k = cfg.Katex;

        // Efficiency uses recency weights and ONLY coding accepted solves.
        // eta = Σ(w_i*q_i) / (epsilon + Σ(w_i*t_i))
        // pts/hr = eta * 60

        // Helper: decay
        double Decay(DateTime utcEventTime)
        {
            var deltaDays = Math.Max(0.0, (asOfUtc.UtcDateTime - utcEventTime).TotalDays);
            return Math.Pow(0.5, deltaDays / k.Recency.HalfLifeDays);
        }

        var numerator = 0.0;
        var denomMinutes = 0.0;

        // We recompute a minimal subset of coding accepted events here because we need attempts/time.
        foreach (var kvp in rawData.CodingSessionsByTrack)
        {
            var trackCanon = CodiviumCatalog.CanonicalizeTrackId(kvp.Key);
            if (trackCanon == "mcq") continue;

            foreach (var session in kvp.Value)
            {
                var categoryCanon = catalog.ResolveCategoryKey((session.CategoryId ?? session.CategoryLegacy) ?? string.Empty);
                if (!catalog.GetAvailableSetForTrack(trackCanon).Contains(categoryCanon))
                    continue;

                if (session.UnitTestsTotal <= 0) continue;
                if (session.Attempts is null || session.Attempts.Count == 0) continue;

                var acceptedAttemptIndex = -1;
                for (var i = 0; i < session.Attempts.Count; i++)
                {
                    if (session.Attempts[i].UnitTestsPassed >= session.UnitTestsTotal)
                        acceptedAttemptIndex = i;
                }

                if (acceptedAttemptIndex < 0) continue;

                var attemptsToAccepted = acceptedAttemptIndex + 1;
                var tMinutes = session.TimeToACMinutes ?? session.Attempts[acceptedAttemptIndex].TimeToSubmissionMinutes;
                if (tMinutes <= 0 || double.IsNaN(tMinutes) || double.IsInfinity(tMinutes))
                    continue;

                var occurredAt = session.CompletedAtUtc;
                if (!occurredAt.HasValue)
                    throw new InvalidOperationException("KaTeX points/efficiency require CompletedAtUtc for accepted solves.");

                // q_i = f_d * q_tries * q_conv (NO time factor)
                var fD = k.DifficultyFactor[DifficultyLabel(session.Difficulty)];

                var qTries = 1.0 / Math.Sqrt(Math.Max(1, attemptsToAccepted));
                qTries = Clamp(qTries, k.Coding.TriesFactor.Min, k.Coding.TriesFactor.Max);

                var bucketIndex = Math.Min(Math.Max(1, attemptsToAccepted), 6) - 1;
                var qConv = k.Coding.ConvergenceWeightsByAttemptBucket[bucketIndex];

                var q = fD * qTries * qConv;

                var w = Decay(occurredAt.Value);

                numerator += w * q;
                denomMinutes += w * tMinutes;
            }
        }

        var eta = numerator / (k.Efficiency.EpsilonMinutes + denomMinutes);
        var ptsPerHr = eta * 60.0;
        if (double.IsNaN(ptsPerHr) || double.IsInfinity(ptsPerHr) || ptsPerHr < 0) return 0.0;
        return ptsPerHr;
    }

    // ------------------------------------------------------------
    // Shared small helpers
    // ------------------------------------------------------------

    private static double Clamp(double x, double lo, double hi)
    {
        if (x < lo) return lo;
        if (x > hi) return hi;
        return x;
    }

    private static string DifficultyLabel(int d)
    {
        return d switch
        {
            1 => "basic",
            2 => "intermediate",
            3 => "advanced",
            _ => "basic",
        };
    }

    private static string DifficultyLabel(string? d)
    {
        var s = (d ?? string.Empty).Trim().ToLowerInvariant();
        if (s == "easy")   s = "basic";
        if (s == "medium") s = "intermediate";
        if (s == "hard")   s = "advanced";
        if (s != "basic" && s != "intermediate" && s != "advanced") s = "basic";
        return s;
    }
}

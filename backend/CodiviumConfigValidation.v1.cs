// CodiviumConfigValidation.v1.cs
// G07: Config validation - fail fast at startup (or payload build) with actionable errors.

using System;
using System.Collections.Generic;
using System.Globalization;

public static class CodiviumConfigValidation
{
    public static void ValidateOrThrow(CodiviumScoring.ScoringConfig cfg)
    {
        if (cfg is null) throw new ArgumentNullException(nameof(cfg));
        if (cfg.Categories is null) throw new InvalidOperationException("scoring-config: categories is required.");
        if (cfg.Categories.AvailableByTrack is null) throw new InvalidOperationException("scoring-config: categories.available_by_track is required.");

        if (cfg.Categories.AvailableByTrack.Count == 0)
            throw new InvalidOperationException("scoring-config: categories.available_by_track is empty.");

        // Ensure at least core tracks exist (can be empty lists, but keys should exist for clarity).
        RequireTrackKey(cfg.Categories.AvailableByTrack, "micro");
        RequireTrackKey(cfg.Categories.AvailableByTrack, "interview");
        RequireTrackKey(cfg.Categories.AvailableByTrack, "mcq");

        ValidateDifficulty(cfg);

        // KaTeX scoring config validation (mastery / points / efficiency).
        ValidateKatex(cfg);
    }

    private static void RequireTrackKey(Dictionary<string, List<string>> map, string trackId)
    {
        if (map is null) throw new ArgumentNullException(nameof(map));
        if (!map.ContainsKey(trackId))
            throw new InvalidOperationException($"scoring-config: categories.available_by_track is missing required key '{trackId}'.");
        if (map[trackId] is null)
            throw new InvalidOperationException($"scoring-config: categories.available_by_track['{trackId}'] is null.");
    }

    private static void ValidateDifficulty(CodiviumScoring.ScoringConfig cfg)
    {
        if (cfg.Difficulty is null) throw new InvalidOperationException("scoring-config: difficulty is required.");
        if (cfg.Difficulty.AllowedValues is null || cfg.Difficulty.AllowedValues.Count == 0)
            throw new InvalidOperationException("scoring-config: difficulty.allowed_values must be non-empty.");

        if (cfg.Difficulty.Weights is null) throw new InvalidOperationException("scoring-config: difficulty.weights is required.");
        if (cfg.Difficulty.BaselineTimeMinutes is null) throw new InvalidOperationException("scoring-config: difficulty.baseline_time_minutes is required.");

        foreach (var d in cfg.Difficulty.AllowedValues)
        {
            var k = d.ToString(CultureInfo.InvariantCulture);
            if (!cfg.Difficulty.Weights.ContainsKey(k))
                throw new InvalidOperationException($"scoring-config: difficulty.weights missing key '{k}'.");
            if (!cfg.Difficulty.BaselineTimeMinutes.ContainsKey(k))
                throw new InvalidOperationException($"scoring-config: difficulty.baseline_time_minutes missing key '{k}'.");
        }
    }


    private static void ValidateKatex(CodiviumScoring.ScoringConfig cfg)
    {
        if (cfg.Katex is null)
            throw new InvalidOperationException("scoring-config: katex section is required for KaTeX-aligned scoring (missing top-level key 'katex').");

        var k = cfg.Katex;

        // Recency
        if (k.Recency is null)
            throw new InvalidOperationException("scoring-config.katex: recency is required.");
        if (k.Recency.HalfLifeDays <= 0)
            throw new InvalidOperationException("scoring-config.katex: recency.half_life_days must be > 0.");

        // Difficulty factors
        if (k.DifficultyFactor is null || k.DifficultyFactor.Count == 0)
            throw new InvalidOperationException("scoring-config.katex: difficulty_factor is required and must be non-empty.");
        RequireKey(k.DifficultyFactor, "basic", "scoring-config.katex: difficulty_factor missing 'basic'.");
        RequireKey(k.DifficultyFactor, "intermediate", "scoring-config.katex: difficulty_factor missing 'intermediate'.");
        RequireKey(k.DifficultyFactor, "advanced", "scoring-config.katex: difficulty_factor missing 'advanced'.");

        // Coding factors
        if (k.Coding is null) throw new InvalidOperationException("scoring-config.katex: coding is required.");
        if (k.Coding.ActivityWeightByTrack is null || k.Coding.ActivityWeightByTrack.Count == 0)
            throw new InvalidOperationException("scoring-config.katex: coding.activity_weight_by_track must be non-empty.");
        RequireKey(k.Coding.ActivityWeightByTrack, "micro", "scoring-config.katex: coding.activity_weight_by_track missing 'micro'.");
        RequireKey(k.Coding.ActivityWeightByTrack, "interview", "scoring-config.katex: coding.activity_weight_by_track missing 'interview'.");

        if (k.Coding.TriesFactor is null)
            throw new InvalidOperationException("scoring-config.katex: coding.tries_factor is required.");
        if (k.Coding.TriesFactor.Min <= 0 || k.Coding.TriesFactor.Max <= 0 || k.Coding.TriesFactor.Min > k.Coding.TriesFactor.Max)
            throw new InvalidOperationException("scoring-config.katex: coding.tries_factor min/max must be positive and min <= max.");

        if (k.Coding.ConvergenceWeightsByAttemptBucket is null || k.Coding.ConvergenceWeightsByAttemptBucket.Count != 6)
            throw new InvalidOperationException("scoring-config.katex: coding.convergence_weights_by_attempt_bucket must have exactly 6 values (A1..A6).");

        if (k.Coding.TimeFactor is null)
            throw new InvalidOperationException("scoring-config.katex: coding.time_factor is required.");
        if (k.Coding.TimeFactor.Min <= 0 || k.Coding.TimeFactor.Max <= 0 || k.Coding.TimeFactor.Min > k.Coding.TimeFactor.Max)
            throw new InvalidOperationException("scoring-config.katex: coding.time_factor min/max must be positive and min <= max.");
        if (k.Coding.TimeFactor.TdMinutesByDifficulty is null || k.Coding.TimeFactor.TdMinutesByDifficulty.Count == 0)
            throw new InvalidOperationException("scoring-config.katex: coding.time_factor.Td_minutes_by_difficulty must be non-empty.");
        RequireKey(k.Coding.TimeFactor.TdMinutesByDifficulty, "basic", "scoring-config.katex: coding.time_factor.Td_minutes_by_difficulty missing 'basic'.");
        RequireKey(k.Coding.TimeFactor.TdMinutesByDifficulty, "intermediate", "scoring-config.katex: coding.time_factor.Td_minutes_by_difficulty missing 'intermediate'.");
        RequireKey(k.Coding.TimeFactor.TdMinutesByDifficulty, "advanced", "scoring-config.katex: coding.time_factor.Td_minutes_by_difficulty missing 'advanced'.");

        // Breadth
        if (k.Breadth is null) throw new InvalidOperationException("scoring-config.katex: breadth is required.");
        if (k.Breadth.TauE <= 0) throw new InvalidOperationException("scoring-config.katex: breadth.tau_E must be > 0.");
        if (k.Breadth.Alpha < 0 || k.Breadth.Beta < 0) throw new InvalidOperationException("scoring-config.katex: breadth alpha/beta must be >= 0.");
        if (k.Breadth.ConfidenceKByTrack is null || k.Breadth.ConfidenceKByTrack.Count == 0)
            throw new InvalidOperationException("scoring-config.katex: breadth.confidence_k_by_track must be non-empty.");
        RequireKey(k.Breadth.ConfidenceKByTrack, "micro", "scoring-config.katex: breadth.confidence_k_by_track missing 'micro'.");
        RequireKey(k.Breadth.ConfidenceKByTrack, "interview", "scoring-config.katex: breadth.confidence_k_by_track missing 'interview'.");
        RequireKey(k.Breadth.ConfidenceKByTrack, "mcq", "scoring-config.katex: breadth.confidence_k_by_track missing 'mcq'.");
        if (k.Breadth.OverallWeights is null || k.Breadth.OverallWeights.Count == 0)
            throw new InvalidOperationException("scoring-config.katex: breadth.overall_weights must be non-empty.");

        // Depth
        if (k.Depth is null) throw new InvalidOperationException("scoring-config.katex: depth is required.");
        if (k.Depth.Lambda <= 0 || k.Depth.LambdaChart <= 0)
            throw new InvalidOperationException("scoring-config.katex: depth.lambda and depth.lambda_chart must be > 0.");
        if (k.Depth.OverallWeights is null || k.Depth.OverallWeights.Count == 0)
            throw new InvalidOperationException("scoring-config.katex: depth.overall_weights must be non-empty.");

        // Points
        if (k.Points is null) throw new InvalidOperationException("scoring-config.katex: points is required.");
        if (k.Points.P0 < 0 || k.Points.Predo < 0 || k.Points.Pmcq < 0)
            throw new InvalidOperationException("scoring-config.katex: points weights must be >= 0.");
        if (k.Points.RedoSpacingDays < 0)
            throw new InvalidOperationException("scoring-config.katex: points.redo_spacing_days must be >= 0.");

        // Efficiency
        if (k.Efficiency is null) throw new InvalidOperationException("scoring-config.katex: efficiency is required.");
        if (k.Efficiency.EpsilonMinutes < 0)
            throw new InvalidOperationException("scoring-config.katex: efficiency.epsilon_minutes must be >= 0.");

        // MCQ
        if (k.Mcq is null) throw new InvalidOperationException("scoring-config.katex: mcq is required.");
        if (k.Mcq.Breadth is null) throw new InvalidOperationException("scoring-config.katex: mcq.breadth is required.");
        if (k.Mcq.Breadth.Gamma <= 0) throw new InvalidOperationException("scoring-config.katex: mcq.breadth.gamma must be > 0.");
    }

    private static void RequireKey(Dictionary<string, double> map, string key, string message)
    {
        if (!map.ContainsKey(key)) throw new InvalidOperationException(message);
    }

}
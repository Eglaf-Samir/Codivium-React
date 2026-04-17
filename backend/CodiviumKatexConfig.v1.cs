// CodiviumKatexConfig.v1.cs
//
// This file defines the machine-readable configuration schema used by the KaTeX scoring reference
// (assets/docs/codivium_scoring_katex.html) and the default constants in config/scoring-config.katex.v1.json.
//
// IMPORTANT:
// - In the combined production config (config/scoring-config.v1.json), this schema lives under the top-level key "katex".
// - The backend treats cfg.Katex as the source-of-truth for mastery, points, and efficiency calculations.
// - The rest of scoring-config.v1.json still contains UI settings (tracks display names, heatmap buckets, etc.)
//   plus category availability lists (categories.available_by_track).
//
// Keeping this schema explicit (instead of using loose dictionaries) is intentional:
// it prevents silent drift between docs, config, and implementation.

#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

public sealed class KatexScoringConfig
{
    [JsonPropertyName("version")] public string Version { get; set; } = "katex-v1";

    [JsonPropertyName("category_key")] public KatexCategoryKeyConfig CategoryKey { get; set; } = new();

    [JsonPropertyName("tracks")] public KatexTracksConfig Tracks { get; set; } = new();

    [JsonPropertyName("recency")] public KatexRecencyConfig Recency { get; set; } = new();

    // Difficulty multipliers shared across tracks.
    // Keys: "basic", "intermediate", "advanced".
    [JsonPropertyName("difficulty_factor")] public Dictionary<string, double> DifficultyFactor { get; set; } = new();

    [JsonPropertyName("coding")] public KatexCodingConfig Coding { get; set; } = new();

    [JsonPropertyName("breadth")] public KatexBreadthConfig Breadth { get; set; } = new();

    [JsonPropertyName("depth")] public KatexDepthConfig Depth { get; set; } = new();

    [JsonPropertyName("points")] public KatexPointsConfig Points { get; set; } = new();

    [JsonPropertyName("efficiency")] public KatexEfficiencyConfig Efficiency { get; set; } = new();
    [JsonPropertyName("heatmap")] public KatexHeatmapConfig Heatmap { get; set; } = new();

    [JsonPropertyName("mcq")] public KatexMcqConfig Mcq { get; set; } = new();

    [JsonPropertyName("edge_cases")] public KatexEdgeCasesConfig EdgeCases { get; set; } = new();
}

public sealed class KatexCategoryKeyConfig
{
    // Documentation-only flag: KaTeX doc uses key = lower(trim(x)).
    [JsonPropertyName("normalize_whitespace")] public bool NormalizeWhitespace { get; set; } = false;

    // Optional alias mapping: rawKey -> canonicalKey.
    // In config JSON, these should be written as human-friendly forms; backend canonicalizes both sides.
    [JsonPropertyName("aliases")] public Dictionary<string, string> Aliases { get; set; } = new();
}

public sealed class KatexTracksConfig
{
    // These exist primarily for documentation completeness.
    // The backend currently assumes the canonical track ids are: micro, interview, mcq.
    [JsonPropertyName("coding_tracks")] public List<string> CodingTracks { get; set; } = new();

    [JsonPropertyName("mcq_track")] public string McqTrack { get; set; } = "mcq";

    // Mastery computation policy switches.
    [JsonPropertyName("pool_categories_across_tracks_for_mastery")] public bool PoolCategoriesAcrossTracksForMastery { get; set; } = false;

    [JsonPropertyName("mcq_contributes_to_depth_in_mastery")] public bool McqContributesToDepthInMastery { get; set; } = false;
}

public sealed class KatexRecencyConfig
{
    // Half-life in days (H in decay(e)=0.5^(Δ/H)).
    [JsonPropertyName("half_life_days")] public double HalfLifeDays { get; set; } = 15.0;
}

public sealed class KatexCodingConfig
{
    // Per-track importance weights for coding evidence and points.
    // Keys: "micro", "interview".
    [JsonPropertyName("activity_weight_by_track")] public Dictionary<string, double> ActivityWeightByTrack { get; set; } = new();

    [JsonPropertyName("tries_factor")] public KatexTriesFactorConfig TriesFactor { get; set; } = new();

    [JsonPropertyName("convergence_weights_by_attempt_bucket")] public List<double> ConvergenceWeightsByAttemptBucket { get; set; } = new();

    [JsonPropertyName("time_factor")] public KatexTimeFactorConfig TimeFactor { get; set; } = new();
}

public sealed class KatexTriesFactorConfig
{
    [JsonPropertyName("min")] public double Min { get; set; } = 0.45;

    [JsonPropertyName("max")] public double Max { get; set; } = 1.0;
}

public sealed class KatexTimeFactorConfig
{
    [JsonPropertyName("min")] public double Min { get; set; } = 0.6;

    [JsonPropertyName("max")] public double Max { get; set; } = 1.0;

    // Minutes constants per difficulty label.
    // Keys: "basic", "intermediate", "advanced".
    [JsonPropertyName("Td_minutes_by_difficulty")] public Dictionary<string, double> TdMinutesByDifficulty { get; set; } = new();
}

public sealed class KatexBreadthConfig
{
    // Activation threshold τE.
    [JsonPropertyName("tau_E")] public double TauE { get; set; } = 1.5;

    // Blend weights for coverage and balance.
    [JsonPropertyName("alpha")] public double Alpha { get; set; } = 0.65;
    [JsonPropertyName("beta")] public double Beta { get; set; } = 0.35;

    // Confidence stabilizers.
    [JsonPropertyName("confidence_k_by_track")] public Dictionary<string, double> ConfidenceKByTrack { get; set; } = new();

    // How each track contributes to overall breadth B.
    [JsonPropertyName("overall_weights")] public Dictionary<string, double> OverallWeights { get; set; } = new();
}

public sealed class KatexDepthConfig
{
    // Saturation constant λ for track depth.
    [JsonPropertyName("lambda")] public double Lambda { get; set; } = 12.0;

    // Saturation constant used for the depth-by-category chart.
    [JsonPropertyName("lambda_chart")] public double LambdaChart { get; set; } = 12.0;

    // Track weights for overall depth D.
    // Keys: "micro", "interview".
    [JsonPropertyName("overall_weights")] public Dictionary<string, double> OverallWeights { get; set; } = new();
}

public sealed class KatexPointsConfig
{
    // Base points for first accepted solve.
    [JsonPropertyName("P0")] public double P0 { get; set; } = 4.0;

    // Redo points weight.
    [JsonPropertyName("Predo")] public double Predo { get; set; } = 2.5;

    // Spacing rule for redo validity.
    [JsonPropertyName("redo_spacing_days")] public double RedoSpacingDays { get; set; } = 7.0;

    // MCQ points weight.
    [JsonPropertyName("Pmcq")] public double Pmcq { get; set; } = 0.5;
}

public sealed class KatexEfficiencyConfig
{
    // Small stabilizer (minutes) in denominator.
    [JsonPropertyName("epsilon_minutes")] public double EpsilonMinutes { get; set; } = 1.0;
}

public sealed class KatexMcqConfig
{
    [JsonPropertyName("breadth")] public KatexMcqBreadthConfig Breadth { get; set; } = new();

    [JsonPropertyName("points")] public KatexMcqPointsConfig Points { get; set; } = new();

    [JsonPropertyName("quiz_constraints")] public KatexMcqQuizConstraintsConfig QuizConstraints { get; set; } = new();
}

public sealed class KatexMcqBreadthConfig
{
    [JsonPropertyName("gamma")] public double Gamma { get; set; } = 1.5;

    [JsonPropertyName("uses_recency_decay")] public bool UsesRecencyDecay { get; set; } = true;
}

public sealed class KatexMcqPointsConfig
{
    [JsonPropertyName("uses_U_all_only")] public bool UsesUAllOnly { get; set; } = true;
}

public sealed class KatexMcqQuizConstraintsConfig
{
    [JsonPropertyName("min_questions_per_quiz")] public int MinQuestionsPerQuiz { get; set; } = 10;
    [JsonPropertyName("expected_questions_per_quiz")] public int ExpectedQuestionsPerQuiz { get; set; } = 20;

    // Documentation-only: the dashboard/backend may use this for validation or estimates.
    [JsonPropertyName("allowed_difficulties")] public List<string> AllowedDifficulties { get; set; } = new();
}

public sealed class KatexEdgeCasesConfig
{
    [JsonPropertyName("zero_total_evidence_returns_zero")] public bool ZeroTotalEvidenceReturnsZero { get; set; } = true;
    [JsonPropertyName("harmonic_mean_requires_positive_terms")] public bool HarmonicMeanRequiresPositiveTerms { get; set; } = true;
}

// ─── Heatmap focus mode configuration ─────────────────────────────────────────

public sealed class KatexHeatmapConfig
{
    [JsonPropertyName("focus_modes")] public KatexHeatmapFocusModesConfig FocusModes { get; set; } = new();
}

public sealed class KatexHeatmapFocusModesConfig
{
    [JsonPropertyName("impact_weights")] public KatexHeatmapImpactWeightsConfig ImpactWeights { get; set; } = new();
}

public sealed class KatexHeatmapImpactWeightsConfig
{
    /// <summary>Weight on weakness (1 - earlyConvergence) in the Impact focus mode formula.</summary>
    [JsonPropertyName("alpha_imp")] public double AlphaImp { get; set; } = 0.55;

    /// <summary>Weight on (1 - depthNorm) in the Impact focus mode formula.</summary>
    [JsonPropertyName("beta_imp")] public double BetaImp { get; set; } = 0.45;
}

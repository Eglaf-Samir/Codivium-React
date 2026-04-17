// CodiviumScoringEngine.cs
//
// The Codivium scoring engine — replaces CodiviumDashboardBackend_AllInOne_CodiviumScoringEngine.cs.
//
// Contains:
//   - CodiviumRawData, CodingSession, McqAttempt, ScoringConfig (input models)
//   - CodiviumScoring (ComputeScoreBundle entry point)
//   - HeatmapFocusModesConfig (config model for heatmap focus modes)
//   - CodiviumScoreBundle (result container)
//   - CodiviumCatalog (category canonicalisation + track universe)
//
// All KaTeX math lives in CodiviumKatexScoring.v1.cs.
// All aggregators (depth, time, allocation, MCQ, heatmap) are in their own files.
// All payload DTOs are in CodiviumPayloadDtos.cs.
//
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class CodiviumScoring
{
    // -----------------------------
    // Raw input models
    // -----------------------------
    public sealed class CodiviumRawData
    {
        /// <summary>
        /// Current scoring/config snapshot (includes categories.available_by_track and KaTeX constants under cfg.Katex).
        /// </summary>
        public required ScoringConfig Config { get; init; }

        /// <summary>
        /// KaTeX input: lifetime total *distinct* MCQ questions answered correctly.
        ///
        /// KaTeX name: <c>UniqueCorrectMcqAllTime</c> (U_all).
        ///
        /// Why this is pre-aggregated:
        /// - A raw quiz result row often does NOT include stable per-question IDs in this dashboard bundle.
        /// - Your wider platform / DB layer should compute U_all as: count(distinct QuestionId) where Correct==true.
        ///
        /// IMPORTANT:
        /// - KaTeX Points uses: points_mcq = Pmcq * sqrt(U_all).
        /// - This value is REQUIRED for KaTeX Points (the backend fails fast if missing).
        /// </summary>
        [JsonPropertyName("UniqueCorrectMcqAllTime")]
        public int UniqueCorrectMcqAllTime { get; init; } = -1;

        /// <summary>
        /// Legacy alias (deprecated):
        /// - Older raw payloads used <c>mcqDistinctCorrectAllTime</c>.
        /// - We accept it for compatibility but normalize into <see cref="UniqueCorrectMcqAllTime"/>.
        /// </summary>
        [JsonPropertyName("mcqDistinctCorrectAllTime")]
        public int McqDistinctCorrectAllTimeLegacy { get; init; } = -1;

        /// <summary>
        /// Coding sessions keyed by track id (e.g., "micro", "interview").
        ///
        /// KaTeX requires that each accepted solve is track-aware. In this contract,
        /// track awareness is represented by the dictionary key. (An optional per-session Track field is accepted too.)
        /// </summary>
        public required Dictionary<string, IReadOnlyList<CodingSession>> CodingSessionsByTrack { get; init; }

        /// <summary>
        /// MCQ quiz results keyed by track id (e.g., "mcq" or future "mcq_*").
        ///
        /// KaTeX treats MCQ as quiz-result events (there is no accepted/failed notion).
        /// </summary>
        public required Dictionary<string, IReadOnlyList<McqAttempt>> McqAttemptsByTrack { get; init; }
    }

    /// <summary>
    /// A single coding session that reached "Accepted" (all unit tests passed).
    ///
    /// KaTeX conceptual field names (canonical):
    /// - Track (micro/interview)         [implicit via dictionary key; optional explicit field accepted]
    /// - CategoryId                     [preferred key; legacy "category" accepted]
    /// - Difficulty                     ["basic"/"intermediate"/"advanced"; legacy 1..3 accepted]
    /// - CompletedAtUtc                 [REQUIRED for decay + rolling windows]
    /// - Attempts (count only)          [KaTeX uses attempt count for q_tries and q_conv buckets]
    /// - TimeToACMinutes                [preferred; if omitted we derive from final attempt time]
    /// - ExerciseId                     [REQUIRED for points distinct + redo spacing]
    /// </summary>
    public sealed class CodingSession
    {
        // --- Category (preferred KaTeX name) ---
        [JsonPropertyName("CategoryId")]
        public string? CategoryId { get; init; }

        // --- Category (legacy alias) ---
        [JsonPropertyName("category")]
        public string? CategoryLegacy { get; init; }

        /// <summary>Stable identifier of the exercise / question attempted (KaTeX required).</summary>
        [JsonPropertyName("ExerciseId")]
        public required string ExerciseId { get; init; }

        /// <summary>
        /// Sub-category of the exercise (e.g. "Closures" within "Functions").
        /// Set at the point the session is stored — comes from the Exercise record in the DB.
        /// Used by the adaptive stretch recommendation to identify adjacent untouched territory.
        /// </summary>
        [JsonPropertyName("SubCategory")]
        public string? SubCategory { get; init; }

        /// <summary>
        /// Optional explicit track label (KaTeX lists Track as a required field).
        /// In this contract track is usually implied by the dictionary key.
        /// </summary>
        [JsonPropertyName("Track")]
        public string? Track { get; init; }

        /// <summary>
        /// Difficulty label normalized to KaTeX: basic / intermediate / advanced.
        /// Legacy 1..3 values are accepted via a JSON converter.
        /// </summary>
        [JsonPropertyName("Difficulty")]
        [JsonConverter(typeof(Codivium.Dashboard.DifficultyValueConverter))]
        public required string Difficulty { get; init; }

        /// <summary>
        /// KaTeX prefers an explicit TimeToACMinutes (time-to-accepted in minutes).
        /// If omitted, the backend derives it from the final attempt's TimeToSubmissionMinutes.
        /// </summary>
        [JsonPropertyName("TimeToACMinutes")]
        public double? TimeToACMinutes { get; init; }

        // Extra enrichment kept from earlier payloads; not required by KaTeX but useful for acceptance detection.
        public required int UnitTestsTotal { get; init; }
        public required IReadOnlyList<SubmissionAttempt> Attempts { get; init; }

        /// <summary>Timestamp used for KaTeX recency decay and rolling windows. REQUIRED for accepted solves.</summary>
        [JsonPropertyName("CompletedAtUtc")]
        public DateTime? CompletedAtUtc { get; init; }

        /// <summary>Optional session start timestamp (not used in KaTeX math; kept for telemetry/debug).</summary>
        [JsonPropertyName("StartedAtUtc")]
        public DateTime? StartedAtUtc { get; init; }
    }

    public sealed class SubmissionAttempt
    {
        /// <summary>Number of unit tests passed for this attempt.</summary>
        public required int UnitTestsPassed { get; init; }

        /// <summary>
        /// Time (minutes) to this attempt. Expected to be cumulative within a session (monotonic non-decreasing).
        /// </summary>
        public required double TimeToSubmissionMinutes { get; init; }

        public DateTime? SubmittedAtUtc { get; init; } // optional: attempt timestamp (not used by KaTeX; kept for debug)
    }

    /// <summary>
    /// A single MCQ quiz result event (KaTeX MCQ breadth evidence).
    ///
    /// Canonical KaTeX fields:
    /// - QuizId
    /// - CategoryId
    /// - Difficulty (basic/intermediate/advanced)
    /// - CompletedAtUtc
    /// - ScorePercent (0..100)
    /// </summary>
    public sealed class McqAttempt
    {
        [JsonPropertyName("QuizId")]
        public string? QuizId { get; init; }

        [JsonPropertyName("CategoryId")]
        public string? CategoryId { get; init; }

        // Legacy alias
        [JsonPropertyName("category")]
        public string? CategoryLegacy { get; init; }

        [JsonPropertyName("Difficulty")]
        [JsonConverter(typeof(Codivium.Dashboard.DifficultyValueConverter))]
        public required string Difficulty { get; init; }

        [JsonPropertyName("ScorePercent")]
        public double? ScorePercent { get; init; }

        // Legacy alias
        [JsonPropertyName("percent")]
        public double? PercentLegacy { get; init; }

        [JsonPropertyName("CompletedAtUtc")]
        public DateTime? CompletedAtUtc { get; init; }

        // Legacy alias
        [JsonPropertyName("takenAtUtc")]
        public DateTime? TakenAtUtcLegacy { get; init; }

        // Optional enrichment fields (not required by KaTeX).
        public int? TotalQuestions { get; init; }
        public int? Correct { get; init; }
        public double? MinutesSpent { get; init; }

        /// <summary>
        /// Number of questions the student peeked at (clicked View Answer before submitting).
        /// Optional — defaults to 0 when absent.
        /// Used by the adaptive engine for session quality rating (AP-05) and recent
        /// sessions dot state (AP-01).
        /// Populated by McqSessionResult.ToMcqAttempt() from the session-level Peeked count,
        /// proportionally allocated across categories by question count.
        /// </summary>
        public int? PeekCount { get; init; }

        /// <summary>
        /// Median response time in milliseconds across all questions in this category.
        /// Optional — treated as 30,000ms (30 seconds) when absent.
        /// Used by the adaptive engine for session quality rating (AP-05):
        ///   Fluent requires ≤ 20,000ms; Proficient requires ≤ 45,000ms.
        /// Computed in McqSessionResult.ToMcqAttempt() as the median of
        /// McqQuestionAnswer.ResponseTimeSeconds × 1000 for answers in this category.
        /// </summary>
        public int? MedianResponseTimeMs { get; init; }
    }


    // -----------------------------
    // Config models (deserialize JSON)
    // -----------------------------
    public sealed class ScoringConfig
    {
        [JsonPropertyName("version")] public string Version { get; set; } = "unknown";
        [JsonPropertyName("flags")] public Dictionary<string, bool> Flags { get; set; } = new();
        [JsonPropertyName("difficulty")] public DifficultyConfig Difficulty { get; set; } = new();
        [JsonPropertyName("convergence")] public ConvergenceConfig Convergence { get; set; } = new();
        [JsonPropertyName("mcq")] public McqConfig Mcq { get; set; } = new();
        [JsonPropertyName("scales")] public ScalesConfig Scales { get; set; } = new();
        [JsonPropertyName("improvement")] public ImprovementConfig Improvement { get; set; } = new();
        [JsonPropertyName("heatmap")] public HeatmapConfig Heatmap { get; set; } = new();
        [JsonPropertyName("categories")] public CategoriesConfig Categories { get; set; } = new();
       
        // KaTeX alignment: category key derivation + aliases live here.
        // This is optional for legacy scoring-config.v1.json, but required for KaTeX scoring.
        [JsonPropertyName("category_key")] public CategoryKeyConfig CategoryKey { get; set; } = new();

        [JsonPropertyName("analysis")] public AnalysisConfig Analysis { get; set; } = new();
        [JsonPropertyName("tracks")] public Dictionary<string, TrackConfig> Tracks { get; set; } = new(); // optional UI names

        // KaTeX scoring constants (required for KaTeX-aligned mastery/points/efficiency).
        // This is embedded under top-level key "katex" in config/scoring-config.v1.json.
        [JsonPropertyName("katex")] public KatexScoringConfig Katex { get; set; } = new();
    }

    public sealed class TrackConfig
    {
        [JsonPropertyName("display_name")] public string DisplayName { get; set; } = "";
    }

    public sealed class DifficultyConfig
    {
        [JsonPropertyName("allowed_values")] public List<int> AllowedValues { get; set; } = new() { 1, 2, 3 };
        [JsonPropertyName("labels")] public Dictionary<string, string> Labels { get; set; } = new();
        [JsonPropertyName("weights")] public Dictionary<string, double> Weights { get; set; } = new();
        [JsonPropertyName("baseline_time_minutes")] public Dictionary<string, double> BaselineTimeMinutes { get; set; } = new();
        [JsonPropertyName("test_time_adjust")] public double TestTimeAdjust { get; set; } = 0.12;
    }

    public sealed class ConvergenceConfig
    {
        [JsonPropertyName("stagnation_eps")] public double StagnationEps { get; set; } = 0.02;
        [JsonPropertyName("weights")] public Dictionary<string, double> Weights { get; set; } = new(); // auc, efficiency, not_stuck
        [JsonPropertyName("alpha_tries")] public double AlphaTries { get; set; } = 1.1;
    }

    public sealed class McqConfig
    {
        [JsonPropertyName("beta")] public double Beta { get; set; } = 1.3;
    }

    public sealed class ScalesConfig
    {
        [JsonPropertyName("lambda_coding")] public double LambdaCoding { get; set; } = 10.0;
        [JsonPropertyName("mu_mcq")] public double MuMcq { get; set; } = 4.0;
        [JsonPropertyName("rho_heatmap")] public double RhoHeatmap { get; set; } = 6.0;
        [JsonPropertyName("eta_improve")] public double EtaImprove { get; set; } = 5.0;
        [JsonPropertyName("kappa_time")] public double KappaTime { get; set; } = 8.0;
    }

    public sealed class ImprovementConfig
    {
        [JsonPropertyName("window")] public int Window { get; set; } = 20;
        [JsonPropertyName("eps")] public double Eps { get; set; } = 1e-9;
    }

    public sealed class HeatmapConfig
    {
        [JsonPropertyName("buckets")] public List<string> Buckets { get; set; } = new() { "A1", "A2", "A3", "A4", "A5" };

        /// <summary>Maps bucket label to attempt index (0..4). Example: A1->0, A5->4.</summary>
        [JsonPropertyName("bucket_attempt_index")] public Dictionary<string, int> BucketAttemptIndex { get; set; } = new();

        /// <summary>Weight per bucket label.</summary>
        [JsonPropertyName("bucket_weights")] public Dictionary<string, double> BucketWeights { get; set; } = new();

        [JsonPropertyName("focus_modes")] public HeatmapFocusModesConfig FocusModes { get; set; } = new();
    }

public sealed class HeatmapFocusModesConfig
    {
        [JsonPropertyName("default_mode")] public string DefaultMode { get; set; } = "impact";
        [JsonPropertyName("top_n_default")] public int TopNDefault { get; set; } = 12;
        [JsonPropertyName("top_n_options")] public List<int> TopNOptions { get; set; } = new() { 8, 10, 12, 14, 16 };
        [JsonPropertyName("modes")] public List<HeatmapFocusModeConfig> Modes { get; set; } = new();
    }

    public sealed class HeatmapFocusModeConfig
    {
        [JsonPropertyName("id")] public string Id { get; set; } = "";
        [JsonPropertyName("label")] public string Label { get; set; } = "";
        [JsonPropertyName("description")] public string Description { get; set; } = "";
        [JsonPropertyName("isDefault")] public bool IsDefault { get; set; } = false;
    }

    public sealed class CategoriesConfig
    {
        /// <summary>
        /// Track-specific category availability. Keys are track ids.
        /// This is the authoritative "current availability" list.
        /// </summary>
        [JsonPropertyName("available_by_track")]
        public Dictionary<string, List<string>> AvailableByTrack { get; set; } = new();

        // Legacy/optional fields (not required when available_by_track is present)
        [JsonPropertyName("universe")] public List<string>? Universe { get; set; }

        [JsonPropertyName("groups")] public Dictionary<string, List<string>> Groups { get; set; } = new();

        [JsonPropertyName("display_order")] public List<string> DisplayOrder { get; set; } = new();
    }



    // -----------------------------
    // Category key rules (KaTeX alignment)
    // -----------------------------
    public sealed class CategoryKeyConfig
    {
        // Human-readable documentation strings (not used by runtime logic).
        [JsonPropertyName("primary")] public string Primary { get; set; } = "lower(trim(CategoryId))";
        [JsonPropertyName("fallback")] public string Fallback { get; set; } = "lower(trim(CategoryName))";

        /// <summary>
        /// Optional alias map that normalizes multiple input spellings/labels to a single canonical category key.
        ///
        /// KaTeX spec: after canonicalization (lower + trim), apply aliases.
        /// Example:
        ///   { "dp": "dynamic programming" }
        /// which makes "DP" and "dp" resolve to "dynamic programming".
        ///
        /// IMPORTANT: alias values should refer to the *target* canonical category key that exists in
        /// categories.available_by_track, otherwise the category will still be filtered out as unavailable.
        /// </summary>
        [JsonPropertyName("aliases")] public Dictionary<string, string> Aliases { get; set; } = new();
    }
    // -----------------------------
    // Analysis config (thresholds, bands)
    // -----------------------------
    public sealed class AnalysisConfig
    {
        [JsonPropertyName("codivium_score_bands")] public List<ScoreBand> CodiviumScoreBands { get; set; } = new();
        [JsonPropertyName("efficiency_thresholds")] public EfficiencyThresholds EfficiencyThresholds { get; set; } = new();
        [JsonPropertyName("evidence_thresholds")] public EvidenceThresholds EvidenceThresholds { get; set; } = new();
        [JsonPropertyName("coding_difficulty_labels")] public Dictionary<string, string> CodingDifficultyLabels { get; set; } = new();
        [JsonPropertyName("pattern_rules")] public PatternRules PatternRules { get; set; } = new();
        [JsonPropertyName("targets")] public TargetsConfig Targets { get; set; } = new();
        [JsonPropertyName("depth")] public DepthAnalysisConfig Depth { get; set; } = new();

        public static AnalysisConfig Default()
        {
            return new AnalysisConfig
            {
                CodiviumScoreBands = new List<ScoreBand>
                {
                    new ScoreBand{ Min=0, Max=25, Label="Getting started", Explain="You are ramping up. Focus on consistent clean solves and a few core categories." },
                    new ScoreBand{ Min=25, Max=45, Label="Building foundations", Explain="You have a base. Widen coverage and reduce retries/time by improving planning and testing." },
                    new ScoreBand{ Min=45, Max=65, Label="Developing consistency", Explain="You are building repeatable performance. Keep widening coverage and push first-try pass in familiar categories." },
                    new ScoreBand{ Min=65, Max=85, Label="Strong performance", Explain="You are performing strongly across many areas. Focus on hard categories and interview transfer." },
                    new ScoreBand{ Min=85, Max=1_000_000, Label="Advanced trajectory", Explain="You are on an advanced trajectory. Maintain breadth while pushing difficulty and speed with high correctness." },
                },
                EfficiencyThresholds = EfficiencyThresholds.Default(),
                EvidenceThresholds = EvidenceThresholds.Default(),
                CodingDifficultyLabels = new Dictionary<string, string> { ["1"]="Basic", ["2"]="Intermediate", ["3"]="Advanced" }                ,
                PatternRules = PatternRules.Default(),
                Targets = TargetsConfig.Default()

            ,
                Depth = DepthAnalysisConfig.Default()};
        }
    }

    public sealed class ScoreBand
    {
        [JsonPropertyName("min")] public double Min { get; set; }
        [JsonPropertyName("max")] public double Max { get; set; }
        [JsonPropertyName("label")] public string Label { get; set; } = "";
        [JsonPropertyName("explain")] public string Explain { get; set; } = "";
    }

    public sealed class EfficiencyThresholds
    {
        [JsonPropertyName("median_time_minutes")] public RangeThreshold MedianTimeMinutes { get; set; } = new();
        [JsonPropertyName("avg_attempts")] public RangeThreshold AvgAttempts { get; set; } = new();
        [JsonPropertyName("first_try_pass_rate")] public MinThreshold FirstTryPassRate { get; set; } = new();
        [JsonPropertyName("weighted_mcq_score")] public WeightedMcqThreshold WeightedMcqScore { get; set; } = new();

        public static EfficiencyThresholds Default()
        {
            return new EfficiencyThresholds
            {
                MedianTimeMinutes = new RangeThreshold{ StrongMax=20, DevelopingMax=45 },
                AvgAttempts = new RangeThreshold{ StrongMax=2.0, DevelopingMax=3.5 },
                FirstTryPassRate = new MinThreshold{ StrongMin=55, DevelopingMin=35 },
                WeightedMcqScore = new WeightedMcqThreshold{ LowMax=50, ModerateMax=70 }
            };
        }
    }

    public sealed class RangeThreshold
    {
        [JsonPropertyName("strong_max")] public double StrongMax { get; set; } = 0;
        [JsonPropertyName("developing_max")] public double DevelopingMax { get; set; } = 0;
    }

    public sealed class MinThreshold
    {
        [JsonPropertyName("strong_min")] public double StrongMin { get; set; } = 0;
        [JsonPropertyName("developing_min")] public double DevelopingMin { get; set; } = 0;
    }

    public sealed class WeightedMcqThreshold
    {
        [JsonPropertyName("low_max")] public double LowMax { get; set; } = 50;
        [JsonPropertyName("moderate_max")] public double ModerateMax { get; set; } = 70;
    }

    public sealed class EvidenceThresholds
    {
        [JsonPropertyName("low_max")] public int LowMax { get; set; } = 2;
        [JsonPropertyName("moderate_max")] public int ModerateMax { get; set; } = 6;

        public static EvidenceThresholds Default() => new EvidenceThresholds{ LowMax=2, ModerateMax=6 };
    }



    public sealed class PatternRules
    {
        [JsonPropertyName("min_solved_for_patterns")] public int MinSolvedForPatterns { get; set; } = 4;
        [JsonPropertyName("min_solved_per_track")] public int MinSolvedPerTrack { get; set; } = 3;
        [JsonPropertyName("min_solved_per_difficulty")] public int MinSolvedPerDifficulty { get; set; } = 2;

        // Percentage-point gap threshold between Basic and Advanced first-try pass rates.
        [JsonPropertyName("difficulty_cliff_gap_pp")] public double DifficultyCliffGapPp { get; set; } = 25.0;

        // If Interview median time >= Micro median time * ratio, treat as a transfer gap.
        [JsonPropertyName("transfer_gap_time_ratio")] public double TransferGapTimeRatio { get; set; } = 1.6;

        // Percentage-point gap threshold between Micro and Interview first-try pass rates.
        [JsonPropertyName("transfer_gap_first_try_gap_pp")] public double TransferGapFirstTryGapPp { get; set; } = 20.0;

        public static PatternRules Default() => new PatternRules();
    }

    public sealed class TargetsConfig
    {
        [JsonPropertyName("top_n")] public int TopN { get; set; } = 5;
        [JsonPropertyName("min_solved_per_category")] public int MinSolvedPerCategory { get; set; } = 2;
        [JsonPropertyName("min_solved_per_category_for_rates")] public int MinSolvedPerCategoryForRates { get; set; } = 3;

        public static TargetsConfig Default() => new TargetsConfig();
    }


    public sealed class DepthAnalysisConfig
    {
        [JsonPropertyName("top_n")] public int TopN { get; set; } = 5;
        [JsonPropertyName("bottom_n")] public int BottomN { get; set; } = 5;
        [JsonPropertyName("untouched_examples_n")] public int UntouchedExamplesN { get; set; } = 6;

        // Robust outliers (Option A): compare categories to your own "typical" depth
        // using median + MAD (median absolute deviation).
        //
        // Guardrails to keep the signal honest:
        // - Only include categories with enough evidence (solved sessions).
        // - Suppress outliers if the distribution is too flat (MAD ~ 0).
        // - Require a minimum absolute gap so tiny differences aren't labeled as "outliers".
        [JsonPropertyName("outlier_min_evidence")] public int OutlierMinEvidence { get; set; } = 6;
        [JsonPropertyName("outlier_robust_z")] public double OutlierRobustZ { get; set; } = 1.5;
        [JsonPropertyName("outlier_min_abs_gap")] public double OutlierMinAbsGap { get; set; } = 5.0;
        [JsonPropertyName("outlier_max_per_side")] public int OutlierMaxPerSide { get; set; } = 3;

        // Percentiles for labeling category depth (relative to your own distribution)
        [JsonPropertyName("focus_percentile")] public double FocusPercentile { get; set; } = 0.80;
        [JsonPropertyName("building_percentile")] public double BuildingPercentile { get; set; } = 0.50;
        [JsonPropertyName("emerging_percentile")] public double EmergingPercentile { get; set; } = 0.20;

        // Concentration thresholds (shares of total depth)
        [JsonPropertyName("concentration_top1_share")] public double ConcentrationTop1Share { get; set; } = 0.45;
        [JsonPropertyName("concentration_top3_share")] public double ConcentrationTop3Share { get; set; } = 0.75;

        [JsonPropertyName("min_depth_nonzero")] public double MinDepthNonZero { get; set; } = 1e-6;

        public static DepthAnalysisConfig Default() => new DepthAnalysisConfig();
    }

    // -----------------------------
    // Public entry: computes scores
    // -----------------------------
    
/// <summary>
/// Bundle returned by <see cref="ComputeScoreBundle"/>.
///
/// Why a bundle?
/// - We want to compute KaTeX evidence ONCE and reuse it for:
///   (a) the score dictionary,
///   (b) dashboard insights (side pane),
///   (c) recommended actions (CTAs).
///
/// This avoids subtle drift and avoids expensive duplicate computations.
/// </summary>
public sealed class CodiviumScoreBundle
{
    public required Dictionary<string, double> Scores { get; init; }
    public required global::CodiviumKatexScoring.KatexAllResults Katex { get; init; }
    public required global::CodiviumCatalog.Catalog Catalog { get; init; }
    public required DateTimeOffset AsOfUtc { get; init; }
}

/// <summary>
/// Computes:
/// - KaTeX evidence + all score outputs (katex)
/// - The legacy score dictionary (Scores) consumed by dashboard code paths
/// - The normalized category catalog derived from config (Catalog)
/// </summary>
public static CodiviumScoreBundle ComputeScoreBundle(CodiviumRawData rawData, DateTimeOffset asOfUtc)
{
    if (rawData is null) throw new ArgumentNullException(nameof(rawData));

    // Config is shipped *inside* the raw data contract so the backend can compute correctly
    // even when deployed as a self-contained demo bundle.
    var cfg = rawData.Config ?? throw new InvalidOperationException("rawData.Config is required.");

    // The catalog is the canonical "category universe" + per-track availability map.
    // It ensures all downstream logic uses the same normalization rules.
    var catalog = global::CodiviumCatalog.Build(cfg);

    // KaTeX is the executable scoring implementation (source of truth).
    var katex = global::CodiviumKatexScoring.ComputeAll(rawData, catalog, asOfUtc);

    // Legacy numeric dictionary expected by some older code paths.
    // NOTE: This dictionary is *derived* from the KaTeX results + a few simple diagnostics.
    var scores = ComputeCodiviumScoresInternal(rawData, asOfUtc, katex);

    return new CodiviumScoreBundle
    {
        Scores = scores,
        Katex = katex,
        Catalog = catalog,
        AsOfUtc = asOfUtc
    };
}

/// <summary>
/// Convenience overload: anchors the computation to "now" (UTC).
/// For deterministic historical renders, call the overload with asOfUtc.
/// </summary>
public static Dictionary<string, double> ComputeCodiviumScores(CodiviumRawData rawData)
{
    return ComputeCodiviumScores(rawData, DateTimeOffset.UtcNow);
}

/// <summary>
/// Core public score dictionary API (backwards compatible).
/// Prefer <see cref="ComputeScoreBundle"/> when you also need KaTeX evidence.
/// </summary>
public static Dictionary<string, double> ComputeCodiviumScores(CodiviumRawData rawData, DateTimeOffset asOfUtc)
{
    return ComputeScoreBundle(rawData, asOfUtc).Scores;
}

// Internal implementation that builds the legacy score dictionary using the supplied KaTeX results.
private static Dictionary<string, double> ComputeCodiviumScoresInternal(
    CodiviumRawData rawData,
    DateTimeOffset asOfUtc,
    global::CodiviumKatexScoring.KatexAllResults katex)
{
    if (rawData is null) throw new ArgumentNullException(nameof(rawData));
    if (katex is null) throw new ArgumentNullException(nameof(katex));

    var cfg = rawData.Config ?? throw new InvalidOperationException("rawData.Config is required.");

    // ------------------------------------------------------------
    // Diagnostics computed from raw coding sessions (non-KaTeX)
    // ------------------------------------------------------------
    // These are "classic" analytics metrics used for user feedback and charts,
    // but they are NOT the KaTeX evidence functions themselves.
    //
    // Keeping them here is useful because:
    // - The dashboard shows them (median time, avg attempts, first-try pass rate).
    // - They provide intuitive context for the KaTeX-derived scores.

    // Diagnostic metrics: first-try pass rate, avg attempts, median time.
    // These use the same CodiviumScoring.CodingSession shape as the KaTeX path.
    // Accepted = session has at least one attempt where UnitTestsPassed >= UnitTestsTotal.
    // AttemptsToAccepted = (index of last accepted attempt) + 1.
    // TimeToAC = TimeToACMinutes if set, else last attempt TimeToSubmissionMinutes.

    var combinedCoding = new List<CodingSession>();
    if (rawData.CodingSessionsByTrack != null)
    {
        if (rawData.CodingSessionsByTrack.TryGetValue("micro", out var micro) && micro != null) combinedCoding.AddRange(micro);
        if (rawData.CodingSessionsByTrack.TryGetValue("interview", out var interview) && interview != null) combinedCoding.AddRange(interview);
    }

    // Resolve accepted sessions using the same logic as the KaTeX evidence path.
    var acceptedSessions = new List<(int attemptsToAccepted, double timeToAcMinutes)>();
    foreach (var s in combinedCoding)
    {
        if (s == null) continue;
        if (s.UnitTestsTotal <= 0) continue;
        if (s.Attempts == null || s.Attempts.Count == 0) continue;

        var acceptedIdx = -1;
        for (var i = 0; i < s.Attempts.Count; i++)
        {
            if (s.Attempts[i].UnitTestsPassed >= s.UnitTestsTotal)
                acceptedIdx = i; // keep last accepted attempt
        }
        if (acceptedIdx < 0) continue;

        var attemptsToAc = acceptedIdx + 1;
        var timeToAc = s.TimeToACMinutes ?? s.Attempts[acceptedIdx].TimeToSubmissionMinutes;
        if (timeToAc <= 0 || double.IsNaN(timeToAc) || double.IsInfinity(timeToAc)) continue;

        acceptedSessions.Add((attemptsToAc, timeToAc));
    }

    // First-try pass rate: percent of accepted sessions solved on first attempt.
    double firstTryPct = 0.0;
    if (acceptedSessions.Count > 0)
    {
        var firstTryCount = acceptedSessions.Count(x => x.attemptsToAccepted <= 1);
        firstTryPct = 100.0 * firstTryCount / acceptedSessions.Count;
    }

    // Average attempts to acceptance.
    double avgAttempts = 0.0;
    if (acceptedSessions.Count > 0)
    {
        avgAttempts = acceptedSessions.Average(x => (double)x.attemptsToAccepted);
    }

    // Median minutes to acceptance.
    double medianMinutes = 0.0;
    if (acceptedSessions.Count > 0)
    {
        var mins = acceptedSessions.Select(x => x.timeToAcMinutes).OrderBy(t => t).ToList();
        medianMinutes = Median(mins);
    }

    // ------------------------------------------------------------
    // Build the score dictionary (derived from KaTeX results)
    // ------------------------------------------------------------
    
// Weighted MCQ score:
// - Computed by CodiviumMcq.BuildMcqPayload as a difficulty-weighted percent correct.
// - Kept here as a separate diagnostic so UI can display "MCQ performance quality"
//   even when the KaTeX breadth/points logic only uses U_all (lifetime distinct correct).
double weightedMcqScore = 0.0;
try
{
    var mcqPayload = global::CodiviumMcq.BuildMcqPayload(rawData);
    if (mcqPayload != null)
    {
        // Compute difficulty-weighted MCQ score from the byDifficulty payload.
        // WeightedMcqScore = Σ(f_d * mean_score_d) / Σ(f_d) for difficulties with data.
        var diffWeights = new Dictionary<string, double>
            { ["basic"] = 1.0, ["intermediate"] = 1.3, ["advanced"] = 1.6 };
        var byDiff = new Dictionary<string, Dictionary<string, double>>
        {
            ["basic"]        = mcqPayload.ByDifficulty?.Basic        ?? new(),
            ["intermediate"] = mcqPayload.ByDifficulty?.Intermediate ?? new(),
            ["advanced"]     = mcqPayload.ByDifficulty?.Advanced     ?? new(),
        };
        double wSum = 0.0, wScoreSum = 0.0;
        foreach (var kvp in byDiff)
        {
            if (kvp.Value == null || kvp.Value.Count == 0) continue;
            var mean = kvp.Value.Values.Average();
            var fd   = diffWeights.TryGetValue(kvp.Key, out var dw) ? dw : 1.0;
            wScoreSum += fd * mean;
            wSum      += fd;
        }
        weightedMcqScore = wSum > 0 ? wScoreSum / wSum : 0.0;
    }
}
catch
{
    weightedMcqScore = 0.0;
}
var scores = new Dictionary<string, double>
    {
        // Headline mastery score (harmonic mean of overall breadth/depth).
        ["codivium_score"] = katex.CodiviumScore,

        // Breadth
        ["overall_breadth"] = katex.OverallBreadth,
        ["micro_challenge_breadth"] = katex.BreadthByTrack.TryGetValue("micro", out var bMicro) ? bMicro : 0.0,
        ["interview_breadth"] = katex.BreadthByTrack.TryGetValue("interview", out var bInterview) ? bInterview : 0.0,
        ["mcq_breadth"] = katex.BreadthByTrack.TryGetValue("mcq", out var bMcq) ? bMcq : 0.0,
        ["weighted_mcq_score"] = weightedMcqScore,

        // Depth
        ["overall_depth"] = katex.OverallDepth,
        ["micro_depth"] = katex.DepthByTrack.TryGetValue("micro", out var dMicro) ? dMicro : 0.0,
        ["interview_depth"] = katex.DepthByTrack.TryGetValue("interview", out var dInterview) ? dInterview : 0.0,

        // Points / momentum / efficiency
        ["points_all_time"] = katex.PointsAllTime,
        ["points_30d"] = katex.PointsLast30Days,
        ["efficiency_pts_per_hr"] = katex.EfficiencyPointsPerHour,

        // Diagnostics
        ["first_try_pass"] = firstTryPct,
        ["avg_attempts"] = avgAttempts,
        ["median_time_minutes"] = medianMinutes
    };

    // Weighted MCQ score may not exist in KaTeX results yet (depends on your data contract).
    // If your MCQ pipeline computes it separately, you can set it in the adapter.
    // For compatibility, we leave it absent here (adapter can fill it if available).

    return scores;
}

    public static double Clamp(double x, double lo, double hi) => Math.Max(lo, Math.Min(hi, x));

    /// <summary>
    /// Normalizes a raw difficulty value to an integer level (1..3).
    ///
    /// This helper exists because:
    /// - KaTeX canonical difficulty labels are: basic/intermediate/advanced
    /// - Legacy payloads and some older calculators used numeric 1..3
    ///
    /// The KaTeX scoring path uses string labels directly, but some legacy
    /// calculators in this bundle still expect numeric levels for charting.
    /// </summary>
    public static int RequireDifficulty(string? difficulty, IReadOnlyCollection<int> allowedValues)
    {
        if (string.IsNullOrWhiteSpace(difficulty))
            throw new InvalidOperationException("Difficulty is required.");

        var s = difficulty.Trim().ToLowerInvariant();
        int d;

        // Accept numeric strings ("1", "2", "3").
        if (int.TryParse(s, out var parsed))
        {
            d = parsed;
        }
        else
        {
            // Accept KaTeX labels + a few common synonyms.
            if (s == "easy") s = "basic";
            if (s == "medium") s = "intermediate";
            if (s == "hard") s = "advanced";

            d = s switch
            {
                "basic" => 1,
                "intermediate" => 2,
                "advanced" => 3,
                _ => throw new InvalidOperationException($"Unsupported difficulty '{difficulty}'. Expected basic/intermediate/advanced (or 1..3)."),
            };
        }

        if (allowedValues != null && allowedValues.Count > 0 && !allowedValues.Contains(d))
            throw new InvalidOperationException($"Difficulty '{d}' not allowed by config.");

        return d;
    }


    public static double Median(List<double> values)
    {
        if (values.Count == 0) return 0.0;
        var arr = values.OrderBy(x => x).ToArray();
        int n = arr.Length;
        int mid = n / 2;
        return (n % 2 == 1) ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2.0;
    }

    public static double Percentile(List<double> values, double percentile)
    {
        if (values == null || values.Count == 0) return 0.0;

        // Defensive copy + sort (ascending).
        var sorted = values
            .Where(v => !double.IsNaN(v) && !double.IsInfinity(v))
            .OrderBy(v => v)
            .ToList();

        if (sorted.Count == 0) return 0.0;

        var p = Clamp(percentile, 0.0, 100.0) / 100.0;
        if (sorted.Count == 1) return sorted[0];

        // Linear interpolation between closest ranks.
        var pos = p * (sorted.Count - 1);
        var lo = (int)Math.Floor(pos);
        var hi = (int)Math.Ceiling(pos);

        if (lo == hi) return sorted[lo];

        var w = pos - lo;
        return sorted[lo] + (sorted[hi] - sorted[lo]) * w;
    }
}

/// <summary>
/// Catalog utilities:
/// - Category canonical keys: lower(trim(x)) with optional alias mapping (internal whitespace preserved)
/// - Track normalization
/// - Track-type classification (MCQ if trackId ==/starts with "mcq")
/// - Availability sets from config categories.available_by_track
/// - Display labels (TitleCase)
///
/// Defaults (accepted by user):
/// 1) MCQ track detection: canonical trackId == "mcq" or starts with "mcq"
/// 2) micro breadth uses trackId "micro"; interview breadth uses trackId "interview"
/// 3) overall breadth: union of all coding tracks present in rawData.CodingSessionsByTrack (non-MCQ)
/// 4) display: TitleCase, preserve ALL-CAPS tokens
/// </summary>
public static class CodiviumCatalog
{
    public sealed class Catalog
    {
        public required Dictionary<string, TrackInfo> TracksByCanonId { get; init; }
        public required Dictionary<string, string> UniverseCanonToDisplay { get; init; }
        public required Dictionary<string, string> TrackCanonToDisplayName { get; init; }
        public required HashSet<string> UniverseCanonSet { get; init; }
        public required List<string> UniverseCanonOrder { get; init; }
        public required HashSet<string> CodingUniverseCanonSet { get; init; }
        public required List<string> CodingUniverseCanonOrder { get; init; }

        /// <summary>
        /// Category alias map (canonical alias -> canonical target).
        ///
        /// This is built from config.category_key.aliases.
        /// KaTeX spec: apply aliases *after* canonicalization (lower + trim).
        /// </summary>
        public required Dictionary<string, string> CategoryAliasCanonToCanon { get; init; }


        /// <summary>
        /// Resolve an input category string to the canonical category key:
        ///  1) Canonicalize (lower + trim)
        ///  2) Apply alias mapping (if present)
        ///
        /// This is the ONLY safe way to turn raw payload categories into canonical keys.
        /// </summary>
        public string ResolveCategoryKey(string? raw)
        {
            var canon = CodiviumCatalog.CanonicalizeCategoryKey(raw ?? "");
            return ResolveCategoryCanon(canon);
        }

        /// <summary>
        /// Resolve a category key that is already canonicalized (lower + trim).
        /// Applies at most a small number of alias hops to prevent accidental cycles.
        /// </summary>
        public string ResolveCategoryCanon(string? canon)
        {
            canon ??= "";
            canon = canon.Trim().ToLowerInvariant();

            // Fast path
            if (CategoryAliasCanonToCanon is null || CategoryAliasCanonToCanon.Count == 0) return canon;

            // Follow alias chain defensively (usually 0 or 1 hop).
            // If there is a cycle, we break after a few steps and keep the last value.
            var cur = canon;
            for (int i = 0; i < 4; i++)
            {
                if (!CategoryAliasCanonToCanon.TryGetValue(cur, out var next) || string.IsNullOrWhiteSpace(next))
                    break;
                var nextCanon = next.Trim().ToLowerInvariant();
                if (nextCanon == cur) break;
                cur = nextCanon;
            }

            return cur;
        }

        public HashSet<string> GetAvailableSetForTrack(string trackIdCanon)
        {
            if (TracksByCanonId.TryGetValue(trackIdCanon, out var t)) return t.CategoriesCanonSet;
            return new HashSet<string>(StringComparer.Ordinal);
        }

        public int GetAvailableCountForTrack(string trackId)
        {
            var canon = CanonicalizeTrackId(trackId);
            return TracksByCanonId.TryGetValue(canon, out var t) ? t.CategoriesCanonSet.Count : 0;
        }

        public int GetAvailableUnionCount(IEnumerable<string> trackIdsCanon)
        {
            var set = new HashSet<string>(StringComparer.Ordinal);
            foreach (var t in trackIdsCanon)
            {
                var canon = CanonicalizeTrackId(t);
                if (TracksByCanonId.TryGetValue(canon, out var ti))
                    set.UnionWith(ti.CategoriesCanonSet);
            }
            return set.Count;
        }

        public List<string> GetMissingDisplayTop(string trackIdCanon, IEnumerable<string> coveredCanon, int topN = 8)
        {
            var coveredSet = new HashSet<string>(coveredCanon ?? Array.Empty<string>(), StringComparer.Ordinal);
            if (!TracksByCanonId.TryGetValue(trackIdCanon, out var t)) return new List<string>();
            var missing = new List<string>();
            foreach (var c in t.CategoriesCanonOrder)
            {
                if (!coveredSet.Contains(c)) missing.Add(UniverseCanonToDisplay.TryGetValue(c, out var disp) ? disp : ToTitleCaseDisplay(c));
                if (missing.Count >= topN) break;
            }
            return missing;
        }

        public string GetTrackDisplayName(string trackIdCanon)
        {
            var canon = CanonicalizeTrackId(trackIdCanon);
            if (TrackCanonToDisplayName != null && TrackCanonToDisplayName.TryGetValue(canon, out var name) && !string.IsNullOrWhiteSpace(name))
                return name;
            return ToTitleCaseDisplay(canon);
        }
    }

    public sealed class TrackInfo
    {
        public required string TrackIdCanon { get; init; }
        public required bool IsMcq { get; init; }
        public required List<string> CategoriesCanonOrder { get; init; }
        public required HashSet<string> CategoriesCanonSet { get; init; }
        public required Dictionary<string, string> CanonToDisplay { get; init; }
    }

    public static Catalog Build(CodiviumScoring.ScoringConfig cfg)
    {
        if (cfg is null) throw new ArgumentNullException(nameof(cfg));

        var availableByTrack = cfg.Categories.AvailableByTrack ?? new Dictionary<string, List<string>>();
        if (availableByTrack.Count == 0)
        {
            // fallback to legacy universe if present
            if (cfg.Categories.Universe is { Count: > 0 })
            {
                availableByTrack = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase)
                {
                    ["micro"] = cfg.Categories.Universe.ToList(),
                    ["interview"] = cfg.Categories.Universe.ToList(),
                    ["mcq"] = cfg.Categories.Universe.ToList()
                };
            }
            else
            {
                throw new InvalidOperationException("Config categories.available_by_track is empty.");
            }
        }

        

        // Track display names (optional)
        var trackNameMap = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var kv in cfg.Tracks ?? new Dictionary<string, CodiviumScoring.TrackConfig>())
        {
            var canon = CanonicalizeTrackId(kv.Key);
            var disp = kv.Value?.DisplayName ?? "";
            if (!string.IsNullOrWhiteSpace(disp) && !trackNameMap.ContainsKey(canon))
                trackNameMap[canon] = disp.Trim();
        }
        // Category alias mapping (KaTeX alignment)
        //
        // KaTeX spec: after canonicalization (lower + trim), apply aliases.
        // We store aliases using canonical keys so all callers can resolve consistently.
        var categoryAliases = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var kv in (cfg.CategoryKey?.Aliases ?? new Dictionary<string, string>()))
        {
            if (string.IsNullOrWhiteSpace(kv.Key)) continue;
            if (string.IsNullOrWhiteSpace(kv.Value)) continue;

            var aliasCanon = CanonicalizeCategoryKey(kv.Key);
            var targetCanon = CanonicalizeCategoryKey(kv.Value);

            if (string.IsNullOrWhiteSpace(aliasCanon) || string.IsNullOrWhiteSpace(targetCanon)) continue;

            // If duplicates exist, last one wins intentionally (explicit config override).
            categoryAliases[aliasCanon] = targetCanon;
        }

        string ResolveCanon(string canon)
        {
            canon ??= "";
            canon = canon.Trim().ToLowerInvariant();
            if (categoryAliases.Count == 0) return canon;

            var cur = canon;
            for (int i = 0; i < 4; i++)
            {
                if (!categoryAliases.TryGetValue(cur, out var next) || string.IsNullOrWhiteSpace(next)) break;
                var nextCanon = next.Trim().ToLowerInvariant();
                if (nextCanon == cur) break;
                cur = nextCanon;
            }
            return cur;
        }


        // Build track catalogs
        var tracks = new Dictionary<string, TrackInfo>(StringComparer.Ordinal);

        // Universe mapping: canonical -> best display (first seen)
        var canonToDisplay = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var kv in availableByTrack)
        {
            var trackCanon = CanonicalizeTrackId(kv.Key);
            var rawCats = kv.Value ?? new List<string>();

            var canonOrder = new List<string>();
            var canonSet = new HashSet<string>(StringComparer.Ordinal);
            var localMap = new Dictionary<string, string>(StringComparer.Ordinal);

            foreach (var raw in rawCats)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;
                var canonRaw = CanonicalizeCategoryKey(raw);
                var canon = ResolveCanon(canonRaw);

                // If the raw category is an alias, display the *target* canonical category name.
                var disp = canon != canonRaw ? ToTitleCaseDisplay(canon) : ToTitleCaseDisplay(raw);

                if (!canonSet.Contains(canon))
                {
                    canonSet.Add(canon);
                    canonOrder.Add(canon);
                }

                if (!localMap.ContainsKey(canon)) localMap[canon] = disp;
                if (!canonToDisplay.ContainsKey(canon)) canonToDisplay[canon] = disp;
            }

            tracks[trackCanon] = new TrackInfo
            {
                TrackIdCanon = trackCanon,
                IsMcq = IsMcqTrackIdCanonical(trackCanon),
                CategoriesCanonOrder = canonOrder,
                CategoriesCanonSet = canonSet,
                CanonToDisplay = localMap
            };
        }

        // Universe = union of all track categories
        var universeSet = new HashSet<string>(canonToDisplay.Keys, StringComparer.Ordinal);

        // Universe order: follow categories.display_order if present; otherwise alphabetical by display
        var universeOrder = new List<string>();
        if (cfg.Categories.DisplayOrder is { Count: > 0 })
        {
            foreach (var d in cfg.Categories.DisplayOrder)
            {
                var canon = ResolveCanon(CanonicalizeCategoryKey(d));
                if (universeSet.Contains(canon) && !universeOrder.Contains(canon, StringComparer.Ordinal))
                    universeOrder.Add(canon);
            }
        }
        // append remaining
        var remaining = universeSet.Where(c => !universeOrder.Contains(c, StringComparer.Ordinal))
            .OrderBy(c => canonToDisplay.TryGetValue(c, out var disp) ? disp : c, StringComparer.OrdinalIgnoreCase)
            .ToList();
        universeOrder.AddRange(remaining);

        // For each track, if global display_order exists, align track order with it for consistent UI
        if (cfg.Categories.DisplayOrder is { Count: > 0 })
        {
            foreach (var t in tracks.Values)
            {
                var ordered = universeOrder.Where(c => t.CategoriesCanonSet.Contains(c)).ToList();
                // Append any track-only cats not in universeOrder (should not happen, but safe)
                foreach (var c in t.CategoriesCanonOrder)
                    if (!ordered.Contains(c, StringComparer.Ordinal)) ordered.Add(c);
                t.CategoriesCanonOrder.Clear();
                t.CategoriesCanonOrder.AddRange(ordered);
            }
        }

        
        // Coding universe = union of all non-MCQ track categories (current availability)
        var codingSet = new HashSet<string>(StringComparer.Ordinal);
        foreach (var t in tracks.Values)
        {
            if (t is null) continue;
            if (t.IsMcq) continue;
            codingSet.UnionWith(t.CategoriesCanonSet);
        }

        var codingOrder = new List<string>();
        foreach (var c in universeOrder)
            if (codingSet.Contains(c) && !codingOrder.Contains(c, StringComparer.Ordinal)) codingOrder.Add(c);

        if (codingOrder.Count != codingSet.Count)
        {
            // Add any remaining (should not happen often) in display order
            var codingRemaining = codingSet.Except(codingOrder, StringComparer.Ordinal)
                .Select(c => new { Canon = c, Disp = canonToDisplay.TryGetValue(c, out var d) ? d : ToTitleCaseDisplay(c) })
                .OrderBy(x => x.Disp, StringComparer.OrdinalIgnoreCase)
                .Select(x => x.Canon);
            foreach (var c in codingRemaining) codingOrder.Add(c);
        }

        return new Catalog
        {
            TracksByCanonId = tracks,
            UniverseCanonToDisplay = canonToDisplay,
            TrackCanonToDisplayName = trackNameMap,
            CategoryAliasCanonToCanon = categoryAliases,
            UniverseCanonSet = universeSet,
            UniverseCanonOrder = universeOrder,
            CodingUniverseCanonSet = codingSet,
            CodingUniverseCanonOrder = codingOrder
        };
    }

    public static string CanonicalizeCategoryKey(string raw)
    {
        // KaTeX spec category key rule:
        //   key = lower(trim(x))
        // where x is CategoryId if available, otherwise CategoryName.
        //
        // IMPORTANT: We intentionally do NOT remove internal whitespace here.
        // If you need typo-tolerance for whitespace variants, add them via category_key.aliases.
        return (raw ?? "").Trim().ToLowerInvariant();
    }

    public static string CanonicalizeTrackId(string raw)
    {
        // Track ids are NOT category keys.
        // For track ids we keep the original "typo-tolerant" behavior:
        //   - remove ALL whitespace
        //   - lower
        // so inputs like " Micro " and "mi cro" still resolve to "micro".
        if (raw is null) return "";
        var sb = new StringBuilder(raw.Length);
        foreach (var ch in raw)
        {
            if (char.IsWhiteSpace(ch)) continue;
            sb.Append(char.ToLowerInvariant(ch));
        }
        return sb.ToString();
    }

    /// <summary>
    /// Canonicalize a dictionary keyed by track id. Ensures lookups by canonical id always work.
    /// Throws if multiple keys canonicalize to the same id (to prevent silent data loss).
    /// </summary>
    public static Dictionary<string, TValue> CanonicalizeTrackDictionaryOrThrow<TValue>(
        IDictionary<string, TValue> input,
        string dictName)
    {
        var result = new Dictionary<string, TValue>(StringComparer.Ordinal);
        if (input is null) return result;

        foreach (var kvp in input)
        {
            var canon = CanonicalizeTrackId(kvp.Key);
            if (string.IsNullOrWhiteSpace(canon)) continue;

            if (result.ContainsKey(canon))
            {
                throw new InvalidOperationException(
                    $"{dictName} contains multiple keys that canonicalize to '{canon}'. " +
                    "Fix by enforcing canonical track keys at the raw payload boundary (e.g., 'micro', 'interview', 'mcq').");
            }

            result[canon] = kvp.Value;
        }

        return result;
    }


    public static bool IsMcqTrackIdCanonical(string trackIdCanon)
    {
        if (string.IsNullOrWhiteSpace(trackIdCanon)) return false;
        return trackIdCanon == "mcq" || trackIdCanon.StartsWith("mcq", StringComparison.Ordinal);
    }

    public static IEnumerable<(string TrackCanon, IReadOnlyList<CodiviumScoring.McqAttempt> Attempts)> EnumerateMcqTracks(
        Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>> mcqAttemptsByTrack)
    {
        foreach (var kv in mcqAttemptsByTrack ?? new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>())
        {
            var trackCanon = CanonicalizeTrackId(kv.Key);
            if (!IsMcqTrackIdCanonical(trackCanon)) continue;
            yield return (trackCanon, kv.Value ?? Array.Empty<CodiviumScoring.McqAttempt>());
        }
    }

    public static IEnumerable<string> OrderCodingTracksForProcessing(IEnumerable<string> trackIds)
    {
        var set = (trackIds ?? Array.Empty<string>())
            .Select(CanonicalizeTrackId)
            .Where(t => !IsMcqTrackIdCanonical(t))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        // stable order: micro, interview, then others
        var ordered = new List<string>();
        if (set.Contains("micro")) ordered.Add("micro");
        if (set.Contains("interview")) ordered.Add("interview");
        ordered.AddRange(set.Where(t => t != "micro" && t != "interview").OrderBy(t => t, StringComparer.Ordinal));
        return ordered;
    }

    public static string ToTitleCaseDisplay(string raw)
    {
        raw = (raw ?? "").Trim();
        if (raw.Length == 0) return "";

        // collapse whitespace to single spaces
        var parts = raw.Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var ti = CultureInfo.InvariantCulture.TextInfo;

        var tokens = parts.Select(p =>
        {
            // preserve short ALL-CAPS tokens (e.g., OOP, BFS)
            var letters = p.Where(char.IsLetter).ToArray();
            bool allCaps = letters.Length > 1 && letters.All(char.IsUpper);
            if (allCaps) return p;
            var lower = p.ToLowerInvariant();
            return ti.ToTitleCase(lower);
        });

        return string.Join(" ", tokens);
    }
}

// =====================================================================================
// Additional dashboard aggregators (use the SAME raw input models: CodiviumScoring.CodiviumRawData)
// =====================================================================================


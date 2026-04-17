// CodiviumMcq.cs
// Extracted from v37 monolith — Step D of the refactor plan.
// Builds the MCQ performance chart payload.
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class CodiviumMcq
{
    public sealed class McqPayload
    {
        [JsonPropertyName("byDifficulty")]
        public required ByDifficultyPayload ByDifficulty { get; init; }

        [JsonPropertyName("byDifficultyEvidence")]
        public required ByDifficultyEvidencePayload ByDifficultyEvidence { get; init; }

        [JsonPropertyName("overallCorrect")]
        public required OverallCorrectPayload OverallCorrect { get; init; }
    }

    public sealed class ByDifficultyPayload
    {
        [JsonPropertyName("basic")]
        public required Dictionary<string, double> Basic { get; init; }

        [JsonPropertyName("intermediate")]
        public required Dictionary<string, double> Intermediate { get; init; }

        [JsonPropertyName("advanced")]
        public required Dictionary<string, double> Advanced { get; init; }
    }

    public sealed class ByDifficultyEvidencePayload
    {
        [JsonPropertyName("basic")]
        public required Dictionary<string, EvidenceCell> Basic { get; init; }

        [JsonPropertyName("intermediate")]
        public required Dictionary<string, EvidenceCell> Intermediate { get; init; }

        [JsonPropertyName("advanced")]
        public required Dictionary<string, EvidenceCell> Advanced { get; init; }
    }

    public sealed class EvidenceCell
    {
        [JsonPropertyName("attempts")] public required int Attempts { get; init; }
        [JsonPropertyName("questions")] public required int Questions { get; init; }
    }

    public sealed class OverallCorrectPayload
    {
        [JsonPropertyName("correct")]
        public required int Correct { get; init; }

        [JsonPropertyName("total")]
        public required int Total { get; init; }
    }

    public static McqPayload BuildMcqPayload(CodiviumScoring.CodiviumRawData rawData)
    {
        var cfg = rawData.Config;

        CodiviumConfigValidation.ValidateOrThrow(cfg);
        var mcqByTrackCanon = CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(rawData.McqAttemptsByTrack, nameof(rawData.McqAttemptsByTrack));
        var catalog = CodiviumCatalog.Build(cfg);

        // Initialize maps for stable axes
        var basic = catalog.UniverseCanonOrder.ToDictionary(c => c, _ => new List<(double pct, int w)>(), StringComparer.Ordinal);
        var inter = catalog.UniverseCanonOrder.ToDictionary(c => c, _ => new List<(double pct, int w)>(), StringComparer.Ordinal);
        var adv = catalog.UniverseCanonOrder.ToDictionary(c => c, _ => new List<(double pct, int w)>(), StringComparer.Ordinal);

        // Evidence maps (attempts + question-count). Used for guards and to distinguish 0% from no data.
        var basicEv = catalog.UniverseCanonOrder.ToDictionary(c => c, _ => (attempts: 0, questions: 0), StringComparer.Ordinal);
        var interEv = catalog.UniverseCanonOrder.ToDictionary(c => c, _ => (attempts: 0, questions: 0), StringComparer.Ordinal);
        var advEv = catalog.UniverseCanonOrder.ToDictionary(c => c, _ => (attempts: 0, questions: 0), StringComparer.Ordinal);


        int totalCorrect = 0;
        int totalQuestions = 0;

        foreach (var (trackCanon, attempts) in CodiviumCatalog.EnumerateMcqTracks(mcqByTrackCanon))
        {
            var avail = catalog.GetAvailableSetForTrack(trackCanon);

            foreach (var a in attempts ?? Array.Empty<CodiviumScoring.McqAttempt>())
            {
                string catCanon = catalog.ResolveCategoryKey((a.CategoryId ?? a.CategoryLegacy) ?? "");
                if (!avail.Contains(catCanon)) continue;

                var dLabel = (a.Difficulty ?? "basic").Trim().ToLowerInvariant();
                var d = dLabel == "basic" ? 1 : (dLabel == "intermediate" ? 2 : (dLabel == "advanced" ? 3 : 1));
                double pct = CodiviumScoring.Clamp((a.ScorePercent ?? a.PercentLegacy) ?? 0.0, 0.0, 100.0);

                int q = a.TotalQuestions ?? 0;
                int c = a.Correct ?? 0;

                int weight = q > 0 ? q : 10; // fallback weight
                if (q > 0)
                {
                    totalQuestions += q;
                    totalCorrect += Math.Max(0, Math.Min(c, q));
                }
                else
                {
                    // if no question-count, approximate total using weight and percent
                    totalQuestions += weight;
                    totalCorrect += (int)Math.Round(weight * (pct / 100.0));
                }

                int evQ = q > 0 ? q : weight;

                if (d <= 1)
                {
                    basic[catCanon].Add((pct, weight));
                    var cur = basicEv[catCanon];
                    basicEv[catCanon] = (cur.attempts + 1, cur.questions + evQ);
                }
                else if (d == 2)
                {
                    inter[catCanon].Add((pct, weight));
                    var cur = interEv[catCanon];
                    interEv[catCanon] = (cur.attempts + 1, cur.questions + evQ);
                }
                else
                {
                    adv[catCanon].Add((pct, weight));
                    var cur = advEv[catCanon];
                    advEv[catCanon] = (cur.attempts + 1, cur.questions + evQ);
                }
            }
        }

        Dictionary<string, double> ToAvg(Dictionary<string, List<(double pct, int w)>> src)
        {
            var outMap = new Dictionary<string, double>(StringComparer.Ordinal);
            foreach (var c in catalog.UniverseCanonOrder)
            {
                var list = src[c];
                if (list.Count == 0) { outMap[c] = 0.0; continue; }
                double num = list.Sum(x => x.pct * x.w);
                double den = list.Sum(x => (double)x.w);
                outMap[c] = den > 0 ? Math.Round(num / den, 1) : 0.0;
            }
            // Convert keys to display names (TitleCase) because dashboard expects category labels
            return outMap.ToDictionary(
                kv => catalog.UniverseCanonToDisplay.TryGetValue(kv.Key, out var disp) ? disp : CodiviumCatalog.ToTitleCaseDisplay(kv.Key),
                kv => kv.Value,
                StringComparer.Ordinal);
        }


        Dictionary<string, EvidenceCell> ToEvidence(Dictionary<string, (int attempts, int questions)> src)
        {
            var outCanon = new Dictionary<string, EvidenceCell>(StringComparer.Ordinal);
            foreach (var c in catalog.UniverseCanonOrder)
            {
                var v = src[c];
                outCanon[c] = new EvidenceCell { Attempts = v.attempts, Questions = v.questions };
            }

            return outCanon.ToDictionary(
                kv => catalog.UniverseCanonToDisplay.TryGetValue(kv.Key, out var disp) ? disp : CodiviumCatalog.ToTitleCaseDisplay(kv.Key),
                kv => kv.Value,
                StringComparer.Ordinal);
        }
        return new McqPayload
        {
            ByDifficulty = new ByDifficultyPayload
            {
                Basic = ToAvg(basic),
                Intermediate = ToAvg(inter),
                Advanced = ToAvg(adv)
            },
            ByDifficultyEvidence = new ByDifficultyEvidencePayload
            {
                Basic = ToEvidence(basicEv),
                Intermediate = ToEvidence(interEv),
                Advanced = ToEvidence(advEv)
            },
            OverallCorrect = new OverallCorrectPayload
            {
                Correct = totalCorrect,
                Total = totalQuestions
            }
        };
    }
}



// ─────────────────────────────────────────────────────────────────────────────
// MCQ Quiz API DTOs — POST /api/mcq/results
// Added to support the MCQ quiz pages (mcq-parent.html, mcq-quiz.html).
// See contracts/mcq-quiz-api.contract.md for the full API specification.
// ─────────────────────────────────────────────────────────────────────────────

namespace Codivium.Mcq
{
    /// <summary>
    /// Full quiz session result posted by mcq-quiz.html on completion.
    /// Maps to McqAttempt for the scoring engine; Answers[] feeds per-question analytics.
    /// </summary>
    public sealed record McqSessionResult
    {
        [JsonPropertyName("sessionId")]
        public required string SessionId { get; init; }

        [JsonPropertyName("settings")]
        public required McqSessionSettings Settings { get; init; }

        [JsonPropertyName("startedAt")]
        public required DateTime StartedAtUtc { get; init; }

        [JsonPropertyName("completedAt")]
        public required DateTime CompletedAtUtc { get; init; }

        [JsonPropertyName("minutesSpent")]
        public required double MinutesSpent { get; init; }

        [JsonPropertyName("totalQuestions")]
        public required int TotalQuestions { get; init; }

        [JsonPropertyName("correct")]
        public required int Correct { get; init; }

        [JsonPropertyName("peeked")]
        public required int Peeked { get; init; }

        [JsonPropertyName("scorePercent")]
        public required double ScorePercent { get; init; }

        /// <summary>
        /// Which adaptive recommendation type led to this session.
        /// Set by the adaptive practice page when launching a pre-configured quiz.
        /// Null if the quiz was not launched from the adaptive practice page.
        /// Examples: "weakness_spotlight", "re_entry", "spaced_review"
        /// </summary>
        [JsonPropertyName("selectedRecommendationType")]
        public string? SelectedRecommendationType { get; init; }

        [JsonPropertyName("answers")]
        public required IReadOnlyList<McqQuestionAnswer> Answers { get; init; }

        /// <summary>
        /// Converts this session result to a McqAttempt for the scoring engine.
        /// Multi-category sessions: call once per distinct category in Answers[].
        /// </summary>
        public CodiviumScoring.McqAttempt ToMcqAttempt(string categoryId)
        {
            var categoryAnswers = Answers.Where(a => a.Category == categoryId).ToList();
            int catTotal   = categoryAnswers.Count;
            int catCorrect = categoryAnswers.Count(a => a.IsCorrect);
            double catScore = catTotal > 0 ? Math.Round(catCorrect / (double)catTotal * 100, 1) : 0;

            // Allocate peek count proportionally across categories by question count.
            // For single-category sessions all peeks belong to this category.
            // For multi-category sessions we distribute proportionally by question count.
            int catPeeked = 0;
            if (Peeked > 0 && TotalQuestions > 0 && catTotal > 0)
                catPeeked = (int)Math.Round((double)Peeked * catTotal / TotalQuestions);

            // Compute median response time (ms) from per-answer ResponseTimeSeconds
            // for answers belonging to this category. Used by AP-05 quality rating:
            //   Fluent ≤ 20,000ms, Proficient ≤ 45,000ms.
            int? catMedianResponseMs = null;
            var responseTimes = categoryAnswers
                .Where(a => a.ResponseTimeSeconds.HasValue && a.ResponseTimeSeconds.Value > 0)
                .Select(a => a.ResponseTimeSeconds!.Value * 1000)
                .OrderBy(t => t)
                .ToList();

            if (responseTimes.Count > 0)
            {
                int mid = responseTimes.Count / 2;
                catMedianResponseMs = responseTimes.Count % 2 == 1
                    ? responseTimes[mid]
                    : (responseTimes[mid - 1] + responseTimes[mid]) / 2;
            }

            return new CodiviumScoring.McqAttempt
            {
                QuizId               = SessionId,
                CategoryId           = categoryId,
                Difficulty           = Settings.Difficulty,
                ScorePercent         = catScore,
                CompletedAtUtc       = CompletedAtUtc,
                TotalQuestions       = catTotal,
                Correct              = catCorrect,
                MinutesSpent         = catTotal > 0 ? Math.Round(MinutesSpent * catTotal / TotalQuestions, 1) : 0,
                PeekCount            = catPeeked,
                MedianResponseTimeMs = catMedianResponseMs,
            };
        }

        /// <summary>
        /// Returns all distinct categories present in the answers, for multi-category sessions.
        /// </summary>
        public IReadOnlyList<string> DistinctCategories()
            => Answers.Select(a => a.Category).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    public sealed record McqSessionSettings
    {
        [JsonPropertyName("categories")]
        public required IReadOnlyList<string> Categories { get; init; }

        [JsonPropertyName("difficulty")]
        public required string Difficulty { get; init; }

        [JsonPropertyName("questionCount")]
        public required int QuestionCount { get; init; }

        [JsonPropertyName("skipCorrect")]
        public required bool SkipCorrect { get; init; }
    }

    /// <summary>
    /// Per-question answer record within a session result.
    /// Feeds per-question analytics; correctIndices echoed for server-side validation.
    /// </summary>
    public sealed record McqQuestionAnswer
    {
        [JsonPropertyName("questionId")]
        public required string QuestionId { get; init; }

        [JsonPropertyName("category")]
        public required string Category { get; init; }

        [JsonPropertyName("difficulty")]
        public required string Difficulty { get; init; }

        [JsonPropertyName("selectedIndices")]
        public required IReadOnlyList<int> SelectedIndices { get; init; }

        [JsonPropertyName("correctIndices")]
        public required IReadOnlyList<int> CorrectIndices { get; init; }

        [JsonPropertyName("isCorrect")]
        public required bool IsCorrect { get; init; }

        [JsonPropertyName("isPeek")]
        public required bool IsPeek { get; init; }

        [JsonPropertyName("tutorialViewed")]
        public required bool TutorialViewed { get; init; }

        [JsonPropertyName("submittedAt")]
        public required DateTime SubmittedAt { get; init; }

        [JsonPropertyName("responseTimeSeconds")]
        public int? ResponseTimeSeconds { get; init; } // Seconds from question render to submission

        [JsonPropertyName("questionIndex")]
        public required int QuestionIndex { get; init; }
    }
}

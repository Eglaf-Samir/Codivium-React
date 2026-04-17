// CodiviumRawDataBuilder.v1.cs
//
// DB -> Raw builder (reference).
//
// Goal:
// - Produce CodiviumScoring.CodiviumRawData from DB rows.
// - Normalize legacy DB shapes into the KaTeX-aligned raw contract.
//
// KaTeX alignment notes:
// - Difficulty is one of: basic / intermediate / advanced.
// - Older systems often store difficulty as 1..3.
// - KaTeX requires CompletedAtUtc for coding accepted solves AND MCQ quiz results.
// - KaTeX points require UniqueCorrectMcqAllTime (U_all).
//
// This builder is deliberately "over-commented" so a new developer can:
// - see exactly what is required,
// - understand why each field exists,
// - and know which values must come from the DB layer.

using System;
using System.Collections.Generic;
using System.Linq;

namespace Codivium.Dashboard
{
    // ---------------------------------------------------------------------
    // Minimal DB-facing record shapes (adapt to your DB models)
    // ---------------------------------------------------------------------

    public sealed class CodingSessionRow
    {
        public required string SessionId { get; init; }
        public required string TrackId { get; init; }           // "micro" / "interview"

        // KaTeX name: CategoryId (stable taxonomy key).
        public required string CategoryId { get; init; }

        // KaTeX name: ExerciseId (stable exercise/question id).
        public required string ExerciseId { get; init; }

        // Legacy representation (1..3). We normalize to KaTeX strings.
        public required int Difficulty { get; init; }

        // Telemetry used to detect acceptance in this demo bundle.
        public required int UnitTestsTotal { get; init; }

        public DateTimeOffset? StartedAtUtc { get; init; }
        public DateTimeOffset? CompletedAtUtc { get; init; } // REQUIRED by KaTeX for decay + rolling
    }

    public sealed class CodingAttemptRow
    {
        public required string SessionId { get; init; }

        // Telemetry used for acceptance detection and some diagnostic charts.
        public required int UnitTestsPassed { get; init; }

        // Cumulative minutes-to-attempt (should be monotonic non-decreasing within a session).
        public required double TimeToSubmissionMinutes { get; init; }
    }

    public sealed class McqAttemptRow
    {
        public required string TrackId { get; init; }           // "mcq" (or "mcq_*" in future)

        // KaTeX name: QuizId (stable identifier of the quiz attempt).
        public required string QuizId { get; init; }

        // KaTeX name: CategoryId.
        public required string CategoryId { get; init; }

        // Legacy representation (1..3). We normalize to KaTeX strings.
        public required int Difficulty { get; init; }

        // KaTeX name: ScorePercent (0..100).
        public required double ScorePercent { get; init; }

        // Optional enrichment.
        public int? TotalQuestions { get; init; }
        public int? Correct { get; init; }

        // KaTeX name: CompletedAtUtc.
        public DateTimeOffset? CompletedAtUtc { get; init; }

        public double? MinutesSpent { get; init; }
    }

    // ---------------------------------------------------------------------
    // Builder
    // ---------------------------------------------------------------------

    public static class CodiviumRawDataBuilder
    {
        /// <summary>
        /// Build KaTeX-aligned raw input from DB rows.
        ///
        /// IMPORTANT:
        /// - This builder validates the config.
        /// - It normalizes track IDs.
        /// - It normalizes difficulty to KaTeX labels.
        /// - It requires the DB layer to supply UniqueCorrectMcqAllTime (U_all).
        /// </summary>
        public static CodiviumScoring.CodiviumRawData Build(
            CodiviumScoring.ScoringConfig config,
            IEnumerable<CodingSessionRow> codingSessions,
            IEnumerable<CodingAttemptRow> codingAttempts,
            IEnumerable<McqAttemptRow> mcqAttempts,
            int uniqueCorrectMcqAllTime)
        {
            if (config is null) throw new ArgumentNullException(nameof(config));
            CodiviumConfigValidation.ValidateOrThrow(config);

            // -----------------------------------------------------------------
            // 1) Group attempt rows by session id
            // -----------------------------------------------------------------
            var attemptsBySession = (codingAttempts ?? Array.Empty<CodingAttemptRow>())
                .GroupBy(a => a.SessionId ?? string.Empty, StringComparer.Ordinal)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(a => a.TimeToSubmissionMinutes).ToList(),
                    StringComparer.Ordinal);

            // -----------------------------------------------------------------
            // 2) Build coding sessions grouped by canonical track id
            // -----------------------------------------------------------------
            var codingByTrack = new Dictionary<string, List<CodiviumScoring.CodingSession>>(StringComparer.OrdinalIgnoreCase);

            foreach (var s in codingSessions ?? Array.Empty<CodingSessionRow>())
            {
                if (s is null) continue;

                var trackCanon = CodiviumCatalog.CanonicalizeTrackId(s.TrackId);
                if (string.IsNullOrWhiteSpace(trackCanon))
                    throw new InvalidOperationException("CodingSessionRow.TrackId is required.");

                // For this bundle we only expect two coding tracks.
                if (trackCanon != "micro" && trackCanon != "interview")
                    throw new InvalidOperationException($"Unexpected coding track id '{s.TrackId}'. Expected 'micro' or 'interview'.");

                if (string.IsNullOrWhiteSpace(s.ExerciseId))
                    throw new InvalidOperationException("CodingSessionRow.ExerciseId is required (stable exercise/question id).");

                if (string.IsNullOrWhiteSpace(s.CategoryId))
                    throw new InvalidOperationException("CodingSessionRow.CategoryId is required (taxonomy key).");

                if (!codingByTrack.TryGetValue(trackCanon, out var list))
                {
                    list = new List<CodiviumScoring.CodingSession>();
                    codingByTrack[trackCanon] = list;
                }

                attemptsBySession.TryGetValue(s.SessionId ?? string.Empty, out var attemptRows);
                attemptRows ??= new List<CodingAttemptRow>();

                var attempts = attemptRows.Select(a => new CodiviumScoring.SubmissionAttempt
                {
                    UnitTestsPassed = a.UnitTestsPassed,
                    TimeToSubmissionMinutes = a.TimeToSubmissionMinutes
                }).ToList();

                // KaTeX prefers an explicit TimeToACMinutes.
                // If your DB stores this directly, set it from DB. Here we derive:
                // - use the final attempt's TimeToSubmissionMinutes (best-effort),
                // - or null if there are no attempts.
                double? timeToAcMinutes = null;
                if (attempts.Count > 0)
                    timeToAcMinutes = attempts[attempts.Count - 1].TimeToSubmissionMinutes;

                // KaTeX requires CompletedAtUtc for accepted solves.
                if (!s.CompletedAtUtc.HasValue)
                    throw new InvalidOperationException("CodingSessionRow.CompletedAtUtc is required for KaTeX scoring (accepted solves).");

                list.Add(new CodiviumScoring.CodingSession
                {
                    Track = trackCanon, // optional redundancy; helps debugging
                    CategoryId = s.CategoryId,
                    ExerciseId = s.ExerciseId,
                    Difficulty = DifficultyFromLegacyInt(s.Difficulty),
                    UnitTestsTotal = s.UnitTestsTotal,
                    Attempts = attempts,
                    StartedAtUtc = s.StartedAtUtc?.UtcDateTime,
                    CompletedAtUtc = s.CompletedAtUtc?.UtcDateTime,
                    TimeToACMinutes = timeToAcMinutes,
                });
            }

            // -----------------------------------------------------------------
            // 3) Build MCQ attempts grouped by canonical track id
            // -----------------------------------------------------------------
            var mcqByTrack = new Dictionary<string, List<CodiviumScoring.McqAttempt>>(StringComparer.OrdinalIgnoreCase);

            foreach (var a in mcqAttempts ?? Array.Empty<McqAttemptRow>())
            {
                if (a is null) continue;

                var trackCanon = CodiviumCatalog.CanonicalizeTrackId(a.TrackId);
                if (string.IsNullOrWhiteSpace(trackCanon))
                    throw new InvalidOperationException("McqAttemptRow.TrackId is required.");

                if (trackCanon != "mcq" && !trackCanon.StartsWith("mcq", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"Unexpected MCQ track id '{a.TrackId}'. Expected 'mcq' or 'mcq*'.");

                if (string.IsNullOrWhiteSpace(a.QuizId))
                    throw new InvalidOperationException("McqAttemptRow.QuizId is required (stable quiz attempt id).");

                if (string.IsNullOrWhiteSpace(a.CategoryId))
                    throw new InvalidOperationException("McqAttemptRow.CategoryId is required (taxonomy key).");

                if (!a.CompletedAtUtc.HasValue)
                    throw new InvalidOperationException("McqAttemptRow.CompletedAtUtc is required for KaTeX scoring when MCQ recency decay is enabled.");

                if (!mcqByTrack.TryGetValue(trackCanon, out var list))
                {
                    list = new List<CodiviumScoring.McqAttempt>();
                    mcqByTrack[trackCanon] = list;
                }

                list.Add(new CodiviumScoring.McqAttempt
                {
                    QuizId = a.QuizId,
                    CategoryId = a.CategoryId,
                    Difficulty = DifficultyFromLegacyInt(a.Difficulty),
                    ScorePercent = a.ScorePercent,
                    CompletedAtUtc = a.CompletedAtUtc?.UtcDateTime,
                    TotalQuestions = a.TotalQuestions,
                    Correct = a.Correct,
                    MinutesSpent = a.MinutesSpent
                });
            }

            // -----------------------------------------------------------------
            // 4) Convert to IReadOnlyList dictionaries
            // -----------------------------------------------------------------
            var codingReadonly = codingByTrack.ToDictionary(
                kvp => kvp.Key,
                kvp => (IReadOnlyList<CodiviumScoring.CodingSession>)kvp.Value,
                StringComparer.OrdinalIgnoreCase);

            var mcqReadonly = mcqByTrack.ToDictionary(
                kvp => kvp.Key,
                kvp => (IReadOnlyList<CodiviumScoring.McqAttempt>)kvp.Value,
                StringComparer.OrdinalIgnoreCase);

            // -----------------------------------------------------------------
            // 5) Build CodiviumRawData
            // -----------------------------------------------------------------
            if (uniqueCorrectMcqAllTime < 0)
                throw new InvalidOperationException("UniqueCorrectMcqAllTime (U_all) must be >= 0.");

            return new CodiviumScoring.CodiviumRawData
            {
                Config = config,

                // KaTeX U_all.
                UniqueCorrectMcqAllTime = uniqueCorrectMcqAllTime,

                CodingSessionsByTrack = codingReadonly,
                McqAttemptsByTrack = mcqReadonly
            };
        }

        // -----------------------------------------------------------------
        // Small local helpers
        // -----------------------------------------------------------------

        private static string DifficultyFromLegacyInt(int d)
        {
            return d switch
            {
                1 => "basic",
                2 => "intermediate",
                3 => "advanced",
                _ => "basic" // defensive default
            };
        }
    }
}

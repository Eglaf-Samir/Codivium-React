// CodiviumAdaptiveEngine.cs
//
// The complete 14-rule adaptive recommendation engine.
// Called by CodiviumAdaptiveEndpoints.GetAdaptiveState().
//
// Steps:
//   1. Receive session history (365-day window, pre-loaded by caller)
//   2. New-user detection → caller returns 404
//   3. Ring fills + drain state per category per difficulty
//   4. Session quality from most recent MCQ session (AP-05 model)
//   5. Recommendation engine — 14 trigger types in strict priority order
//   6. Milestone detection
//
// All 14 recommendation types are evaluated server-side — nothing is left to the client.
// The priority waterfall (P1–P14) mirrors the AP-S09/S10 specification.
//
// Priority map:
//   P1  recovery               P8  coding_fluency
//   P2  abandonment_spotlight  P9  coding_near_complete
//   P3  re_entry               P10 coding_next_level
//   P4  spaced_review          P11 mode_switch
//   P5  weakness_spotlight     P12 stretch
//   P6  coding_depth_gap       P13 difficulty_calibration
//   P7  difficulty_progression P14 building_continue  (guaranteed fallback)
//
// Thresholds are hardcoded constants in AdaptiveEngine — not read from config.
// SubCategory comes from CodingSession.SubCategory (set at session storage time).

#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;

namespace Codivium.Adaptive
{
    // ══════════════════════════════════════════════════════════════════════════
    // Result types
    // ══════════════════════════════════════════════════════════════════════════

    public sealed class AdaptiveEngineResult
    {
        public bool                              IsNewUser          { get; init; }
        public string                            Mode               { get; init; } = "orientation";
        public int                               SessionCount       { get; init; }
        public int                               LastSessionDaysAgo { get; init; }
        public string                            LastSessionLabel   { get; init; } = "";
        public IReadOnlyList<AdaptiveCategoryDto>       Categories  { get; init; } = Array.Empty<AdaptiveCategoryDto>();
        public AdaptivePrimaryDto?                       Primary     { get; init; }
        public IReadOnlyList<AdaptiveAlternativeDto>     Alternatives { get; init; } = Array.Empty<AdaptiveAlternativeDto>();
        public AdaptiveMilestoneDto?                     Milestone   { get; init; }
        public IReadOnlyList<AdaptiveRecentSessionDto>   RecentSessions { get; init; } = Array.Empty<AdaptiveRecentSessionDto>();
        public AdaptiveSessionQualityDto?                SessionQuality { get; init; }

        public static AdaptiveEngineResult NewUser() => new() { IsNewUser = true, Mode = "orientation" };
    }

    // Per-exercise attempt record — stored inside RingState for coding-specific rules.
    // "abandoned" outcome requires the DB layer to pass incomplete sessions;
    // with the current model (only accepted sessions stored) all outcomes are "accepted".
    sealed class AttemptRecord
    {
        public string   ExerciseId       { get; init; } = "";
        public string   Outcome          { get; init; } = "accepted"; // "accepted" | "abandoned"
        public int      SubmissionsCount { get; init; } = 1;          // attempts to acceptance
        public DateTime CompletedAt      { get; init; }
        public string   Difficulty       { get; init; } = "basic";
    }

    // Internal ring computation state — one instance per category+difficulty bucket.
    sealed class RingState
    {
        public int       CorrectAnswers    { get; set; }
        public int       SessionCount      { get; set; }          // MCQ + coding
        public int       CodingSessionCount { get; set; }         // coding only (for depth-gap / fluency rules)
        public DateTime  LastCorrectAt     { get; set; } = DateTime.MinValue;
        public double    Fill              { get; set; }          // 0–100, after drain applied
        public double    RawFill           { get; set; }          // 0–100, before drain (for near-complete rule)
        public string    DrainState        { get; set; } = "normal"; // normal|draining|ready|gap|locked
        public string    StatusLabel       { get; set; } = "Not started";
        public double    RollingScore      { get; set; }          // rolling avg of last N sessions
        public int       RollingSessions   { get; set; }          // sessions counted in rolling window
        // Newest-first list of individual exercise attempts for coding-specific rules.
        public List<AttemptRecord> Attempts { get; } = new();
    }

    // Flattened session for cross-type processing
    sealed class Session
    {
        public string   Category         { get; init; } = "";
        public string?  SubCategory      { get; init; }
        public string   Difficulty       { get; init; } = "basic";
        public double   Score            { get; init; }
        public string   Type             { get; init; } = "mcq";   // "mcq" | "coding"
        public DateTime CompletedAt      { get; init; }
        public int      Correct          { get; init; }
        public int      Total            { get; init; }

        /// <summary>Stable exercise/question identifier. Empty string for MCQ sessions.</summary>
        public string   ExerciseId       { get; init; } = "";

        /// <summary>
        /// Number of submission attempts before acceptance.
        /// Always 1 for MCQ (MCQ has no retry concept).
        /// For coding: number of attempts in the session (Attempts.Count).
        /// </summary>
        public int      SubmissionsCount { get; init; } = 1;

        /// <summary>
        /// Number of questions peeked at in this session.
        /// Always 0 for coding sessions (peek is an MCQ-only concept).
        /// </summary>
        public int  PeekCount            { get; init; }

        /// <summary>
        /// Median response time in milliseconds.
        /// Null for coding sessions; null MCQ sessions are treated as 30,000ms by ComputeQuality.
        /// </summary>
        public int? MedianResponseTimeMs { get; init; }
    }

    // Recommendation candidate produced by each trigger
    sealed class Candidate
    {
        public string                      Type        { get; init; } = "";
        public string                      TypeLabel   { get; init; } = "";
        public string                      CtaLabel    { get; init; } = "";
        public string                      CtaHref     { get; init; } = "";
        public string                      Headline    { get; init; } = "";
        public string                      Context     { get; init; } = "";
        public string                      Evidence    { get; init; } = "";
        public int                         EvidencePct { get; init; }
        public Dictionary<string, string>  TemplateVars { get; init; } = new();
        public string                      AltHeadline { get; init; } = "";
        public string                      AltSub      { get; init; } = "";
        public string                      AltSci      { get; init; } = "";
        public string                      AltType     { get; init; } = "teal"; // "teal"|"amber"
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Engine
    // ══════════════════════════════════════════════════════════════════════════

    public static class AdaptiveEngine
    {
        // ── Thresholds ────────────────────────────────────────────────────────
        const int    RingTarget             = 30;
        const double AdvancementScoreMin    = 70.0;
        const int    AdvancementSessionsMin = 5;

        const int    GraceDaysBasic        = 14;
        const int    GraceDaysIntermediate = 21;
        const int    GraceDaysAdvanced     = 28;
        const double SlowDrainPerDay       = 0.10;
        const double FastDrainPerDay       = 0.20;

        const int    ReEntryDays            = 7;
        const double WeaknessMinGapPct      = 50.0;
        const int    WeaknessMinCategories  = 3;
        const int    WeaknessMinQPerCat     = 5;
        const int    SpacedDaysSinceCorrect = 14;
        const int    SpacedMinCorrect       = 5;
        const double DiffProgMinScore       = 70.0;
        const int    DiffProgMinSessions    = 3;
        const double ModeSwitchMaxRatio     = 1.5;
        const int    ModeSwitchMinSessions  = 10;
        const double StretchMinScore        = 65.0;
        const double RecoveryDropPct        = 30.0;
        const int    RecoveryMaxAbsenceDays = 3;

        // ── Entry point ───────────────────────────────────────────────────────

        public static AdaptiveEngineResult Compute(
            string track,
            IReadOnlyList<CodiviumScoring.CodingSession> codingSessions,
            IReadOnlyList<CodiviumScoring.McqAttempt>    mcqAttempts,
            DateTimeOffset asOfUtc)
        {
            // Step 2 — new user
            if (!codingSessions.Any() && !mcqAttempts.Any())
                return AdaptiveEngineResult.NewUser();

            int totalSessions = codingSessions.Count + mcqAttempts.Count;
            string mode = totalSessions < 10 ? "building" : "full";

            // Flatten to unified session list, newest first
            var sessions = Flatten(codingSessions, mcqAttempts)
                           .OrderByDescending(s => s.CompletedAt)
                           .ToList();

            int daysAgo = sessions.Any()
                ? (int)(asOfUtc.UtcDateTime - sessions[0].CompletedAt).TotalDays
                : 999;

            // Step 3 — ring fills
            var rings = ComputeRings(sessions, asOfUtc);
            MarkGapState(rings);

            // Step 4 — session quality
            var quality = ComputeQuality(sessions);

            // Step 5+6 — recommendation engine
            var candidates = EvaluateTriggers(sessions, rings, daysAgo, track, asOfUtc);
            var primary     = candidates.ElementAtOrDefault(0);
            var alt1        = candidates.ElementAtOrDefault(1);
            var alt2        = candidates.ElementAtOrDefault(2);

            // Step 7 — milestone
            var milestone = CheckMilestone(totalSessions, rings, sessions, asOfUtc);

            return new AdaptiveEngineResult
            {
                IsNewUser          = false,
                Mode               = mode,
                SessionCount       = totalSessions,
                LastSessionDaysAgo = daysAgo,
                LastSessionLabel   = FormatDaysAgo(daysAgo),
                Categories         = BuildCategoryDtos(rings, track),
                Primary            = primary is null ? null : BuildPrimaryDto(primary, track),
                Alternatives       = BuildAlternativeDtos(new[] { alt1, alt2 }),
                Milestone          = milestone,
                RecentSessions     = sessions.Take(5).Select(ToRecentDto).ToList(),
                SessionQuality     = quality,
            };
        }

        // ── Step 3: Ring computation ──────────────────────────────────────────

        static Dictionary<string, Dictionary<string, RingState>> ComputeRings(
            List<Session> sessions, DateTimeOffset asOfUtc)
        {
            // rings[category][difficulty]
            var rings = new Dictionary<string, Dictionary<string, RingState>>(
                StringComparer.OrdinalIgnoreCase);

            void Ensure(string cat, string diff)
            {
                if (!rings.ContainsKey(cat))
                    rings[cat] = new Dictionary<string, RingState>(StringComparer.OrdinalIgnoreCase);
                if (!rings[cat].ContainsKey(diff))
                    rings[cat][diff] = new RingState();
            }

            foreach (var s in sessions)
            {
                if (string.IsNullOrWhiteSpace(s.Category)) continue;
                Ensure(s.Category, s.Difficulty);
                var ring = rings[s.Category][s.Difficulty];
                ring.CorrectAnswers += s.Correct;
                ring.SessionCount++;
                if (s.Type == "coding")
                {
                    ring.CodingSessionCount++;
                    ring.Attempts.Add(new AttemptRecord
                    {
                        ExerciseId       = s.ExerciseId,
                        Outcome          = "accepted",   // only accepted sessions exist in current model
                        SubmissionsCount = s.SubmissionsCount,
                        CompletedAt      = s.CompletedAt,
                        Difficulty       = s.Difficulty,
                    });
                }
                if (s.Correct > 0 && s.CompletedAt > ring.LastCorrectAt)
                    ring.LastCorrectAt = s.CompletedAt;
            }

            // Sort each ring's Attempts newest-first (for fluency/calibration rules)
            foreach (var catKv in rings)
                foreach (var diffKv in catKv.Value)
                    diffKv.Value.Attempts.Sort((a, b) => b.CompletedAt.CompareTo(a.CompletedAt));

            // Rolling score: last AdvancementSessionsMin sessions per category/difficulty
            foreach (var catKv in rings)
            {
                foreach (var diffKv in catKv.Value)
                {
                    var recent = sessions
                        .Where(s => s.Category.Equals(catKv.Key, StringComparison.OrdinalIgnoreCase)
                                 && s.Difficulty.Equals(diffKv.Key, StringComparison.OrdinalIgnoreCase))
                        .Take(AdvancementSessionsMin)
                        .ToList();
                    if (recent.Any())
                    {
                        diffKv.Value.RollingScore    = recent.Average(s => s.Score);
                        diffKv.Value.RollingSessions = recent.Count;
                    }
                }
            }

            // Compute fill and apply drain
            foreach (var catKv in rings)
            {
                foreach (var diffKv in catKv.Value)
                {
                    var ring = diffKv.Value;
                    double rawFill = Math.Min(100.0, ring.CorrectAnswers / (double)RingTarget * 100.0);
                    ring.RawFill = rawFill;  // store before drain for near-complete rule

                    // Drain
                    if (ring.LastCorrectAt != DateTime.MinValue)
                    {
                        int graceDays = GraceDays(diffKv.Key);
                        double daysSinceLast = (asOfUtc.UtcDateTime - ring.LastCorrectAt).TotalDays;
                        if (daysSinceLast > graceDays)
                        {
                            double pastGrace = daysSinceLast - graceDays;
                            double slowDays  = Math.Min(pastGrace, 7);
                            double fastDays  = Math.Max(0, pastGrace - 7);
                            double drain     = (slowDays * SlowDrainPerDay + fastDays * FastDrainPerDay) * rawFill;
                            rawFill          = Math.Max(0, rawFill - drain);
                            ring.DrainState  = "draining";
                        }
                    }

                    ring.Fill = rawFill;

                    // Status label
                    (ring.DrainState, ring.StatusLabel) = ring.Fill >= 100
                        ? ("ready",    "Ready to advance")
                        : ring.DrainState == "draining"
                        ? ("draining", "Review due")
                        : ring.CorrectAnswers == 0
                        ? ("locked",   "Not started")
                        : ring.Fill >= 60
                        ? ("normal",   "In progress")
                        : ("normal",   "Just started");
                }
            }

            return rings;
        }

        static void MarkGapState(Dictionary<string, Dictionary<string, RingState>> rings)
        {
            // Find the category with the lowest fill at basic difficulty —
            // mark it as the gap category
            var basicFills = rings
                .Where(c => c.Value.ContainsKey("basic"))
                .Select(c => (cat: c.Key, fill: c.Value["basic"].Fill))
                .ToList();

            if (basicFills.Count < WeaknessMinCategories) return;

            double maxFill = basicFills.Max(x => x.fill);
            var gapCat     = basicFills
                .Where(x => maxFill - x.fill >= WeaknessMinGapPct)
                .OrderBy(x => x.fill)
                .FirstOrDefault();

            if (gapCat.cat is not null && rings[gapCat.cat].ContainsKey("basic"))
                rings[gapCat.cat]["basic"].DrainState  = "gap";
                rings[gapCat.cat]["basic"].StatusLabel = "Priority gap";
        }

        static int GraceDays(string difficulty) => difficulty switch
        {
            "intermediate" => GraceDaysIntermediate,
            "advanced"     => GraceDaysAdvanced,
            _              => GraceDaysBasic,
        };

        // ── Step 4: Session quality ───────────────────────────────────────────
        //
        // Implements the AP-05 quality model. Inputs come from the most recent
        // MCQ session specifically — if the latest session was a coding session
        // we look back to find the most recent MCQ session instead.
        //
        // Quality levels tested from highest to lowest; first match wins:
        //
        //   Fluent        scorePercent ≥ 90  AND peekRate = 0%   AND medianResponseMs ≤ 20,000
        //   Proficient    scorePercent ≥ 80  AND peekRate ≤ 10%  AND medianResponseMs ≤ 45,000
        //   Consolidation scorePercent ≥ 70  AND peekRate ≤ 20%  (no response-time limit)
        //   Foundation    scorePercent ≥ 60  (no peek or response-time limit)
        //   null          scorePercent < 60  (no level awarded)
        //
        // Default for missing MedianResponseTimeMs: 30,000ms (30 seconds) — mid-range.
        // Default for missing PeekCount: 0.

        const int DefaultMedianResponseMs = 30_000;
        const int FluentMaxResponseMs     = 20_000;
        const int ProficientMaxResponseMs = 45_000;

        static AdaptiveSessionQualityDto? ComputeQuality(List<Session> sessions)
        {
            if (!sessions.Any()) return null;

            // Find the most recent MCQ session — quality rating is MCQ-only.
            var last = sessions.FirstOrDefault(s => s.Type == "mcq");
            if (last is null) return null;

            double scorePercent = last.Total > 0
                ? (double)last.Correct / last.Total * 100.0
                : last.Score;

            // peekRate: fraction of questions peeked at (0.0 – 1.0).
            double peekRate = last.Total > 0
                ? (double)last.PeekCount / last.Total
                : 0.0;

            // Use stored median response time, or fall back to the default.
            int responseMs = last.MedianResponseTimeMs ?? DefaultMedianResponseMs;

            // Determine quality level — test from highest to lowest.
            string? level;
            if      (scorePercent >= 90 && peekRate == 0.0 && responseMs <= FluentMaxResponseMs)
                level = "Fluent";
            else if (scorePercent >= 80 && peekRate <= 0.10 && responseMs <= ProficientMaxResponseMs)
                level = "Proficient";
            else if (scorePercent >= 70 && peekRate <= 0.20)
                level = "Consolidation";
            else if (scorePercent >= 60)
                level = "Foundation";
            else
                level = null;   // below 60% — no level awarded

            // Build the four-bar levels array (AP-05 section 4.1).
            // Below current level → pct = 100 (fully earned).
            // Current level       → pct = scorePercent (shows actual score).
            // Above current level → pct = 0 (not yet reached).
            var orderedLevels = new[] { "Foundation", "Consolidation", "Proficient", "Fluent" };
            int currentIndex  = level is null ? -1 : Array.IndexOf(orderedLevels, level);

            var levels = orderedLevels.Select((name, idx) =>
            {
                int pct;
                if (level is null)
                    pct = 0;
                else if (idx < currentIndex)
                    pct = 100;
                else if (idx == currentIndex)
                    pct = (int)Math.Round(scorePercent);
                else
                    pct = 0;

                return new AdaptiveQualityLevelDto
                {
                    Name      = name,
                    Pct       = pct,
                    IsCurrent = name == level,
                };
            }).ToList();

            return new AdaptiveSessionQualityDto
            {
                Level  = level ?? "none",
                Levels = levels,
            };
        }

        // ── Step 5: Recommendation engine ────────────────────────────────────
        //
        // 14 recommendation types evaluated in strict priority order.
        // All triggers return null if their condition is not met.
        // The first non-null result (lowest priority number) becomes primary.
        // The next two non-null results become alternatives.
        //
        // Priority map (server-side — all rules now live here):
        //   P1  recovery               — recent score drop within 3 days
        //   P2  abandonment_spotlight  — unfinished exercise within 7 days  ★
        //   P3  re_entry               — absent ≥ 7 days
        //   P4  spaced_review          — ≥ 14 days since last correct, ≥ 5 correct
        //   P5  weakness_spotlight     — biggest gap ≥ 50pp across ≥ 3 categories
        //   P6  coding_depth_gap       — weakest coding ring ≥ 40pp behind strongest  ★
        //   P7  difficulty_progression — ring full, rolling ≥ 70%, ≥ 3 sessions
        //   P8  coding_fluency         — submissions/solve trending down over 5 exercises  ★
        //   P9  coding_near_complete   — coding ring fill ≥ 80% and < 100%
        //   P10 coding_next_level      — difficulty ring complete, next level not started
        //   P11 mode_switch            — MCQ:coding ratio > 1.5 over last 10 sessions
        //   P12 stretch                — overall score ≥ 65%, untouched category exists
        //   P13 difficulty_calibration — one category averaging 2× more submissions  ★
        //   P14 building_continue      — guaranteed fallback (always fires)
        //
        // ★ requires ring.Attempts data; dormant until DB layer passes abandoned sessions
        //   or sufficient accepted coding attempts exist.

        static List<Candidate> EvaluateTriggers(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            int daysAgo,
            string track,
            DateTimeOffset asOfUtc)
        {
            var all = new (int P, Candidate? C)[]
            {
                (1,  TryRecovery(sessions, rings, daysAgo, track)),
                (2,  TryAbandonmentSpotlight(rings, track, asOfUtc)),
                (3,  TryReEntry(sessions, rings, daysAgo, track)),
                (4,  TrySpacedReview(sessions, rings, track, asOfUtc)),
                (5,  TryWeaknessSpotlight(sessions, rings, track)),
                (6,  TryCodingDepthGap(rings, track)),
                (7,  TryDifficultyProgression(sessions, rings, track)),
                (8,  TryCodingFluency(rings, track)),
                (9,  TryCodingNearComplete(rings, track)),
                (10, TryCodingNextLevel(rings, track)),
                (11, TryModeSwitch(sessions, rings, track)),
                (12, TryStretch(sessions, rings, track)),
                (13, TryDifficultyCalibration(rings, track)),
                (14, TryBuildingContinue(sessions, rings, track)),
            };

            return all
                .Where(x => x.C is not null)
                .OrderBy(x => x.P)
                .Select(x => x.C!)
                .ToList();
        }

        // 1. Re-entry
        static Candidate? TryReEntry(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            int daysAgo, string track)
        {
            if (daysAgo < ReEntryDays) return null;

            // Target the highest-fill draining category
            var target = rings
                .Where(c => c.Value.Any(d => d.Value.DrainState == "draining"))
                .OrderByDescending(c => c.Value.Values.Max(r => r.Fill))
                .FirstOrDefault();

            string cat  = target.Key ?? sessions.FirstOrDefault()?.Category ?? "your last category";
            string diff = "basic";
            int    evidence = Math.Min(95, 70 + daysAgo * 2);

            return new Candidate
            {
                Type        = "re_entry",
                TypeLabel   = "Re-entry — restoring momentum",
                CtaLabel    = $"Start recovery session",
                CtaHref     = BuildHref(track, cat, diff, "reentry"),
                Headline    = $"Welcome back — {daysAgo} days away. A short session now recovers what matters most.",
                Context     = $"The forgetting curve has been working since your last session. A targeted retrieval session on {cat} now is the most efficient thing you can do to restore that knowledge.",
                Evidence    = $"High signal — absence duration is unambiguous ({daysAgo} days)",
                EvidencePct = evidence,
                TemplateVars = new() { ["category"] = cat, ["n"] = daysAgo.ToString() },
                AltHeadline = $"Re-entry: {cat}",
                AltSub      = $"You have been away for {daysAgo} days. A short session on {cat} reactivates the material before further decay.",
                AltSci      = "Spaced retrieval: relearning after a gap is faster than first learning but requires active retrieval to arrest decay.",
                AltType     = "amber",
            };
        }

        // 2. Weakness spotlight
        static Candidate? TryWeaknessSpotlight(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            var attempted = rings.Where(c =>
                    c.Value.Values.Any(r => r.SessionCount >= 1))
                .ToList();

            if (attempted.Count < WeaknessMinCategories) return null;

            var fills = attempted
                .Select(c => (cat: c.Key,
                              fill: c.Value.ContainsKey("basic") ? c.Value["basic"].Fill : 0,
                              questions: c.Value.Values.Sum(r => r.CorrectAnswers)))
                .Where(x => x.questions >= WeaknessMinQPerCat)
                .ToList();

            if (fills.Count < WeaknessMinCategories) return null;

            double maxFill = fills.Max(x => x.fill);
            var worst = fills.OrderBy(x => x.fill).First();
            double gap = maxFill - worst.fill;

            if (gap < WeaknessMinGapPct) return null;

            string best = fills.OrderByDescending(x => x.fill).First().cat;
            int evidence = Math.Min(90, 60 + (int)gap / 2);

            return new Candidate
            {
                Type         = "weakness_spotlight",
                TypeLabel    = "Weakness spotlight — biggest gap",
                CtaLabel     = $"Practice {worst.cat} now",
                CtaHref      = BuildHref(track, worst.cat, "basic", "weakness"),
                Headline     = $"Your {worst.cat} knowledge has the most room to grow.",
                Context      = $"You're scoring {(int)worst.fill}% on {worst.cat} — {(int)gap} points below your average. That gap is where focused effort returns the most, right now.",
                Evidence     = $"Strong signal — {fills.Count} categories, {(int)gap}pt gap",
                EvidencePct  = evidence,
                TemplateVars = new() {
                    ["category"] = worst.cat,
                    ["score"]    = ((int)worst.fill).ToString(),
                    ["gap"]      = ((int)gap).ToString(),
                    ["n"]        = fills.Count.ToString(),
                },
                AltHeadline  = $"Weakness: {worst.cat}",
                AltSub       = $"{worst.cat} is {(int)gap}% below your strongest category ({best}). A focused session now closes the gap fastest.",
                AltSci       = "Deliberate practice produces the fastest improvement when effort targets the area of greatest weakness.",
                AltType      = "amber",
            };
        }

        // 3. Spaced review
        static Candidate? TrySpacedReview(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track,
            DateTimeOffset asOfUtc)
        {
            var due = rings
                .SelectMany(c => c.Value.Select(d => new
                {
                    Cat      = c.Key,
                    Diff     = d.Key,
                    Ring     = d.Value,
                    DaysSince = d.Value.LastCorrectAt == DateTime.MinValue ? 999
                                : (int)(asOfUtc.UtcDateTime - d.Value.LastCorrectAt).TotalDays,
                }))
                .Where(x => x.DaysSince >= SpacedDaysSinceCorrect
                         && x.Ring.CorrectAnswers >= SpacedMinCorrect)
                .OrderByDescending(x => x.DaysSince)
                .FirstOrDefault();

            if (due is null) return null;

            return new Candidate
            {
                Type         = "spaced_review",
                TypeLabel    = "Spaced review — optimal recall window",
                CtaLabel     = $"Review {due.Cat} now",
                CtaHref      = BuildHref(track, due.Cat, due.Diff, "spaced"),
                Headline     = $"{due.Cat} is due for review — {due.DaysSince} days since your last session.",
                Context      = $"The optimal review window for {due.Cat} is open now. Reviewing at this point produces more durable memory than reviewing earlier or later.",
                Evidence     = $"Clear signal — {due.DaysSince} days since last correct answer",
                EvidencePct  = Math.Min(88, 60 + due.DaysSince),
                TemplateVars = new() {
                    ["category"] = due.Cat,
                    ["n"]        = due.DaysSince.ToString(),
                },
                AltHeadline  = $"Spaced review: {due.Cat}",
                AltSub       = $"The review window for {due.Cat} is open — {due.DaysSince} days since your last correct answers.",
                AltSci       = "Spaced repetition: reviewing at the point of near-forgetting produces more durable memory than reviewing earlier or later.",
                AltType      = "teal",
            };
        }

        // 4. Difficulty progression
        static Candidate? TryDifficultyProgression(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            foreach (var (nextDiff, currDiff) in new[] { ("advanced","intermediate"), ("intermediate","basic") })
            {
                var ready = rings
                    .Where(c => c.Value.ContainsKey(currDiff)
                             && c.Value[currDiff].Fill >= 99.9
                             && c.Value[currDiff].RollingScore >= DiffProgMinScore
                             && c.Value[currDiff].RollingSessions >= DiffProgMinSessions)
                    .OrderByDescending(c => c.Value[currDiff].RollingScore)
                    .FirstOrDefault();

                if (ready.Key is null) continue;

                string cat       = ready.Key;
                double rollingAvg = ready.Value[currDiff].RollingScore;
                string currLabel  = Capitalise(currDiff);
                string nextLabel  = Capitalise(nextDiff);

                return new Candidate
                {
                    Type         = "difficulty_progression",
                    TypeLabel    = "Difficulty progression — level up",
                    CtaLabel     = $"Start {cat} {nextLabel}",
                    CtaHref      = BuildHref(track, cat, nextDiff, "progression"),
                    Headline     = $"{cat} {currLabel} is complete. It's time to move to {nextLabel}.",
                    Context      = $"Your ring for {cat} {currLabel} is full and your rolling average across the last {DiffProgMinSessions} sessions is {(int)rollingAvg}% — above the {(int)DiffProgMinScore}% threshold for advancement.",
                    Evidence     = $"Clear signal — ring full, rolling average {(int)rollingAvg}%",
                    EvidencePct  = Math.Min(95, (int)rollingAvg),
                    TemplateVars = new() {
                        ["category"]       = cat,
                        ["difficulty"]     = currLabel,
                        ["nextDifficulty"] = nextLabel,
                    },
                    AltHeadline  = $"Advance {cat} to {nextLabel}",
                    AltSub       = $"{cat} {currLabel} ring is full with a {(int)rollingAvg}% rolling average. {nextLabel} is the next step.",
                    AltSci       = "Zone of proximal development: the most productive learning happens just beyond current ability.",
                    AltType      = "teal",
                };
            }

            return null;
        }

        // 5. Mode switch (MCQ → coding or coding → MCQ)
        static Candidate? TryModeSwitch(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            if (sessions.Count < ModeSwitchMinSessions) return null;

            var recent = sessions.Take(ModeSwitchMinSessions).ToList();
            int mcqCount    = recent.Count(s => s.Type == "mcq");
            int codingCount = recent.Count(s => s.Type == "coding");
            if (codingCount == 0 && mcqCount == 0) return null;

            string dominant, other;
            double ratio;

            if (codingCount == 0)
            { dominant = "MCQ"; other = "coding"; ratio = mcqCount; }
            else if (mcqCount == 0)
            { dominant = "coding"; other = "MCQ"; ratio = codingCount; }
            else
            {
                ratio    = Math.Max((double)mcqCount / codingCount, (double)codingCount / mcqCount);
                dominant = mcqCount >= codingCount ? "MCQ" : "coding";
                other    = dominant == "MCQ"       ? "coding" : "MCQ";
            }

            if (ratio < ModeSwitchMaxRatio) return null;

            string activeCat = recent.GroupBy(s => s.Category)
                               .OrderByDescending(g => g.Count())
                               .FirstOrDefault()?.Key ?? "";

            string href = other == "coding"
                ? $"../menu-page.html?track={track}&category={Uri.EscapeDataString(activeCat)}&difficulty=basic&source=adaptive&type=modeswitch"
                : BuildHref(track, activeCat, "basic", "modeswitch");

            return new Candidate
            {
                Type         = "mode_switch",
                TypeLabel    = "Mode switch — change practice format",
                CtaLabel     = other == "coding" ? $"Try a {activeCat} exercise" : $"Try {activeCat} MCQ",
                CtaHref      = href,
                Headline     = $"You've been doing {dominant} for {(int)ratio}x more sessions than {other}. Switch now.",
                Context      = $"Your last {ModeSwitchMinSessions} sessions have been {mcqCount} MCQ and {codingCount} coding. {(dominant == "MCQ" ? "MCQ builds recognition. Coding exercises build the procedural fluency that MCQ cannot develop." : "Coding builds fluency. MCQ reinforces the declarative knowledge base that fluency draws on.")}",
                Evidence     = $"Moderate signal — {(int)ratio}:1 {dominant}:{other} ratio",
                EvidencePct  = Math.Min(75, 50 + (int)(ratio * 5)),
                TemplateVars = new() {
                    ["dominantMode"] = dominant,
                    ["otherMode"]    = other,
                    ["ratio"]        = ((int)ratio).ToString(),
                    ["category"]     = activeCat,
                },
                AltHeadline  = $"Switch to {other}",
                AltSub       = $"Your ratio of {dominant} to {other} sessions is {(int)ratio}:1. A {other} session on {activeCat} would restore balance.",
                AltSci       = "Learning science distinguishes declarative knowledge (MCQ) from procedural fluency (coding). Both are required for durable skill.",
                AltType      = "amber",
            };
        }

        // 6. Stretch
        static Candidate? TryStretch(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            if (!rings.Any()) return null;

            var attempted = rings.Where(c => c.Value.Values.Any(r => r.SessionCount > 0)).ToList();
            if (!attempted.Any()) return null;

            double overallScore = attempted
                .SelectMany(c => c.Value.Values)
                .Where(r => r.SessionCount > 0)
                .Average(r => r.Fill);

            if (overallScore < StretchMinScore) return null;

            // Find strongest category
            var strongest = attempted
                .OrderByDescending(c => c.Value.Values.Max(r => r.Fill))
                .First();

            // Find untouched categories
            var untouched = rings
                .Where(c => c.Value.Values.All(r => r.SessionCount == 0))
                .ToList();
            if (!untouched.Any()) return null;

            // Use SubCategory adjacency: find untouched category that shares
            // the most SubCategory values with the user's strongest category
            var strongestSubCats = sessions
                .Where(s => s.Category.Equals(strongest.Key, StringComparison.OrdinalIgnoreCase)
                         && !string.IsNullOrEmpty(s.SubCategory))
                .Select(s => s.SubCategory!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Map untouched category names to sub-category adjacency score
            // (populated from session data of other users or exercise metadata if available)
            // Fallback: pick the untouched category with the most exercises (proxy = most sessions
            // by other users in the same track — not available here, so use first alphabetically)
            string newCat = untouched
                .OrderByDescending(c =>
                {
                    // Score adjacency by how many known sub-categories overlap
                    // with those seen in the strongest category's sessions
                    if (!strongestSubCats.Any()) return 0;
                    var targetSubs = sessions
                        .Where(s => s.Category.Equals(c.Key, StringComparison.OrdinalIgnoreCase))
                        .Select(s => s.SubCategory ?? "")
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();
                    return targetSubs.Count(sub => strongestSubCats.Contains(sub));
                })
                .ThenBy(c => c.Key)
                .First().Key;

            return new Candidate
            {
                Type         = "stretch",
                TypeLabel    = "Stretch — expand your range",
                CtaLabel     = $"Try {newCat}",
                CtaHref      = BuildHref(track, newCat, "basic", "stretch"),
                Headline     = $"You've mastered {strongest.Key}. {newCat} uses the same core mental models.",
                Context      = $"Your {strongest.Key} score is strong at {(int)strongest.Value.Values.Max(r => r.Fill)}%. {newCat} builds on related concepts and is the natural next frontier.",
                Evidence     = $"Moderate signal — strong foundations, {newCat} adjacent",
                EvidencePct  = 72,
                TemplateVars = new() {
                    ["currentCategory"] = strongest.Key,
                    ["newCategory"]     = newCat,
                },
                AltHeadline  = $"Try {newCat}",
                AltSub       = $"Your {strongest.Key} foundations make {newCat} a productive next step — shared mental models reduce the cold-start difficulty.",
                AltSci       = "Transfer of learning: prior mastery in adjacent domains reduces acquisition time for new material.",
                AltType      = "teal",
            };
        }

        // 7. Recovery
        static Candidate? TryRecovery(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            int daysAgo,
            string track)
        {
            if (daysAgo > RecoveryMaxAbsenceDays) return null;
            if (!sessions.Any()) return null;

            var lastSession = sessions[0];

            // Category rolling average (last 5 sessions, same category)
            var catSessions = sessions
                .Where(s => s.Category.Equals(lastSession.Category, StringComparison.OrdinalIgnoreCase))
                .Skip(1)  // exclude the last session itself
                .Take(5)
                .ToList();

            if (!catSessions.Any()) return null;

            double average = catSessions.Average(s => s.Score);
            double drop    = average - lastSession.Score;

            if (drop < RecoveryDropPct) return null;

            return new Candidate
            {
                Type         = "recovery",
                TypeLabel    = "Recovery — rebound from a tough session",
                CtaLabel     = $"Retry {lastSession.Category}",
                CtaHref      = BuildHref(track, lastSession.Category, lastSession.Difficulty, "recovery"),
                Headline     = $"That session was a tough one — and that's useful information.",
                Context      = $"Your {lastSession.Category} score was {(int)drop}% below your average of {(int)average}%. A poor session is the most diagnostic event in deliberate practice.",
                Evidence     = $"Clear signal — {(int)drop}pt drop below {(int)average}% average",
                EvidencePct  = Math.Min(88, 60 + (int)drop),
                TemplateVars = new() {
                    ["category"] = lastSession.Category,
                    ["gap"]      = ((int)drop).ToString(),
                    ["average"]  = ((int)average).ToString(),
                },
                AltHeadline  = $"Recover: {lastSession.Category}",
                AltSub       = $"Your last session scored {(int)drop}% below your average on {lastSession.Category}. A targeted recovery session closes the gap.",
                AltSci       = "Errors are the most information-rich events in deliberate practice. A recovery session directly after a poor one produces faster improvement than moving on.",
                AltType      = "amber",
            };
        }

        // ── P2: Abandonment Spotlight ─────────────────────────────────────────
        // Fires when an exercise was started but not completed within the last 7 days.
        // NOTE: requires abandoned sessions to be passed to the engine. With the
        // current model (only accepted solves stored) this always returns null.
        static Candidate? TryAbandonmentSpotlight(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track,
            DateTimeOffset asOfUtc)
        {
            const int AbandonWindowDays = 7;
            var now = asOfUtc.UtcDateTime;

            AttemptRecord? best = null;
            string? bestCat = null;
            string? bestDiff = null;

            foreach (var catKv in rings)
            {
                foreach (var diffKv in catKv.Value)
                {
                    var abandoned = diffKv.Value.Attempts
                        .Where(a => a.Outcome == "abandoned"
                                 && (now - a.CompletedAt).TotalDays <= AbandonWindowDays)
                        .OrderByDescending(a => a.CompletedAt)
                        .FirstOrDefault();

                    if (abandoned is null) continue;

                    if (best is null || abandoned.CompletedAt > best.CompletedAt)
                    {
                        best     = abandoned;
                        bestCat  = catKv.Key;
                        bestDiff = diffKv.Key;
                    }
                }
            }

            if (best is null) return null;

            double daysAgo = (now - best.CompletedAt).TotalDays;
            string when    = daysAgo < 1 ? "today" : daysAgo < 2 ? "yesterday" : $"{(int)daysAgo} days ago";

            return new Candidate
            {
                Type        = "abandonment_spotlight",
                TypeLabel   = "Unfinished — return and complete",
                CtaLabel    = $"Return to {bestCat}",
                CtaHref     = $"../menu-page.html?track={track}&category={Uri.EscapeDataString(bestCat!)}&difficulty={bestDiff}&exerciseId={Uri.EscapeDataString(best.ExerciseId)}&source=adaptive&type=abandonment",
                Headline    = $"You left a {bestCat} exercise unfinished {when}.",
                Context     = $"You started a {Capitalise(bestDiff ?? "basic")}-level {bestCat} exercise {when} but did not get it to pass. Returning now — while the problem is still fresh — is the most efficient next step.",
                Evidence    = $"Clear signal — abandoned {when}",
                EvidencePct = 70,
                TemplateVars = new() { ["category"] = bestCat!, ["n"] = when },
                AltHeadline = $"Unfinished: {bestCat}",
                AltSub      = $"You started a {bestCat} exercise {when} but did not complete it. Returning now captures the partial mental context still in memory.",
                AltSci      = "Returning to an abandoned problem within days is faster than starting fresh — the problem representation built during the first attempt is still partially active.",
                AltType     = "amber",
            };
        }

        // ── P6: Coding Depth Gap ──────────────────────────────────────────────
        // Fires when the weakest coding category ring is ≥ 40pp behind the strongest,
        // and both categories have at least 3 coding sessions.
        static Candidate? TryCodingDepthGap(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            const int MinSessions    = 3;
            const int GapThresholdPp = 40;

            // Best fill per category (across all difficulties), coding sessions only
            var catFills = rings
                .Select(c =>
                {
                    int totalCodingSessions = c.Value.Values.Sum(r => r.CodingSessionCount);
                    double bestFill         = c.Value.Values.Max(r => r.Fill);
                    return (Cat: c.Key, Fill: bestFill, CodingSessions: totalCodingSessions);
                })
                .Where(x => x.CodingSessions >= MinSessions)
                .ToList();

            if (catFills.Count < 2) return null;

            var strongest = catFills.OrderByDescending(x => x.Fill).First();
            var weakest   = catFills.OrderBy(x => x.Fill).First();
            double gap    = strongest.Fill - weakest.Fill;

            if (gap < GapThresholdPp) return null;

            return new Candidate
            {
                Type        = "coding_depth_gap",
                TypeLabel   = "Weakest coding area",
                CtaLabel    = $"Focus on {weakest.Cat}",
                CtaHref     = $"../menu-page.html?track={track}&category={Uri.EscapeDataString(weakest.Cat)}&difficulty=basic&source=adaptive&type=deptgap",
                Headline    = $"{weakest.Cat} is your weakest coding category — {(int)gap}pp behind {strongest.Cat}.",
                Context     = $"Your {weakest.Cat} ring is at {(int)weakest.Fill}% versus {(int)strongest.Fill}% for {strongest.Cat}. Focusing here returns more progress per session than adding more practice in categories you already know well.",
                Evidence    = $"Clear signal — {(int)gap}pp gap",
                EvidencePct = Math.Min(95, (int)gap),
                TemplateVars = new() {
                    ["category"]         = weakest.Cat,
                    ["currentCategory"]  = strongest.Cat,
                },
                AltHeadline = $"Weakest: {weakest.Cat}",
                AltSub      = $"Your {weakest.Cat} ring is {(int)gap}pp behind {strongest.Cat}. Closing this gap is the highest-leverage use of practice time.",
                AltSci      = "Overall performance is limited more by the weakest element than by the average — addressing the gap directly is the most efficient move.",
                AltType     = "amber",
            };
        }

        // ── P8: Coding Fluency ────────────────────────────────────────────────
        // Fires when submissions-to-solve are trending down over the last 5 exercises
        // in a category, and the next difficulty level hasn't been started yet.
        static Candidate? TryCodingFluency(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            const int RequiredAttempts = 5;
            var diffOrder = new[] { "basic", "intermediate", "advanced" };

            foreach (var catKv in rings)
            {
                foreach (var diffKv in catKv.Value)
                {
                    var accepted = diffKv.Value.Attempts
                        .Where(a => a.Outcome == "accepted")
                        .Take(RequiredAttempts)
                        .ToList();

                    if (accepted.Count < RequiredAttempts) continue;

                    // Compare newest two vs oldest two submission counts
                    double newerAvg = (accepted[0].SubmissionsCount + accepted[1].SubmissionsCount) / 2.0;
                    double olderAvg = (accepted[3].SubmissionsCount + accepted[4].SubmissionsCount) / 2.0;
                    if (newerAvg >= olderAvg) continue;

                    // Find the next difficulty level that hasn't been started
                    int currIdx  = Array.IndexOf(diffOrder, diffKv.Key);
                    string? next = null;
                    for (int i = currIdx + 1; i < diffOrder.Length; i++)
                    {
                        string nd = diffOrder[i];
                        if (!catKv.Value.TryGetValue(nd, out var nr) || nr.CodingSessionCount == 0)
                        { next = nd; break; }
                    }
                    if (next is null) continue;

                    int improvement = (int)Math.Round(olderAvg - newerAvg);

                    return new Candidate
                    {
                        Type        = "coding_fluency",
                        TypeLabel   = "Fluency improving — advance",
                        CtaLabel    = $"Try {Capitalise(next)} {catKv.Key}",
                        CtaHref     = $"../menu-page.html?track={track}&category={Uri.EscapeDataString(catKv.Key)}&difficulty={next}&source=adaptive&type=fluency",
                        Headline    = $"Your {catKv.Key} coding is getting faster — time to move up.",
                        Context     = $"Over your last 5 {catKv.Key} exercises you are taking {improvement} fewer submission{(improvement != 1 ? "s" : "")} to pass. That trend is the clearest signal you are ready for {Capitalise(next)} difficulty.",
                        Evidence    = $"Strong signal — {improvement} fewer submissions over last 5 exercises",
                        EvidencePct = Math.Min(90, 50 + improvement * 10),
                        TemplateVars = new() {
                            ["category"]       = catKv.Key,
                            ["difficulty"]     = Capitalise(diffKv.Key),
                            ["nextDifficulty"] = Capitalise(next),
                        },
                        AltHeadline = $"Fluency: advance {catKv.Key}",
                        AltSub      = $"Your {catKv.Key} submission count is trending down — you are ready for {Capitalise(next)} difficulty.",
                        AltSci      = "Decreasing effort to produce the same output is the most reliable indicator of genuine skill consolidation in procedural domains.",
                        AltType     = "teal",
                    };
                }
            }
            return null;
        }

        // ── P9: Coding Near-Complete ──────────────────────────────────────────
        // Fires when any coding ring has fill ≥ 80% and < 100% (uses raw fill
        // before drain so near-complete rings that are draining still show up).
        static Candidate? TryCodingNearComplete(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            var best = rings
                .SelectMany(c => c.Value.Select(d => new
                {
                    Cat  = c.Key,
                    Diff = d.Key,
                    Ring = d.Value,
                }))
                .Where(x => x.Ring.CodingSessionCount > 0
                         && x.Ring.RawFill >= 80
                         && x.Ring.RawFill <  100
                         && x.Ring.DrainState != "locked")
                .OrderByDescending(x => x.Ring.RawFill)
                .FirstOrDefault();

            if (best is null) return null;

            int remaining = 100 - (int)best.Ring.RawFill;

            return new Candidate
            {
                Type        = "coding_near_complete",
                TypeLabel   = "Almost there — finish the ring",
                CtaLabel    = $"Finish {best.Cat}",
                CtaHref     = $"../menu-page.html?track={track}&category={Uri.EscapeDataString(best.Cat)}&difficulty={best.Diff}&source=adaptive&type=nearcomplete",
                Headline    = $"{best.Cat} is {(int)best.Ring.RawFill}% complete — one more session finishes it.",
                Context     = $"You are {remaining} percentage point{(remaining != 1 ? "s" : "")} away from completing {best.Cat} at {Capitalise(best.Diff)} level. A single exercise closes the ring.",
                Evidence    = $"Clear signal — {(int)best.Ring.RawFill}% complete",
                EvidencePct = (int)best.Ring.RawFill,
                TemplateVars = new() {
                    ["category"]   = best.Cat,
                    ["difficulty"] = Capitalise(best.Diff),
                },
                AltHeadline = $"Near-complete: {best.Cat}",
                AltSub      = $"{best.Cat} is {(int)best.Ring.RawFill}% done at {Capitalise(best.Diff)} level. One session closes the ring.",
                AltSci      = "Completion of a learning unit produces a stronger memory consolidation signal than leaving it unfinished — the closure effect in cognitive science.",
                AltType     = "teal",
            };
        }

        // ── P10: Coding Next Level ────────────────────────────────────────────
        // Fires when a difficulty ring is 100% complete (rawFill) and the next
        // difficulty level has not yet been started in that category.
        // Suppressed if coding_fluency already fired (it's more specific).
        static Candidate? TryCodingNextLevel(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            var diffOrder = new[] { "basic", "intermediate", "advanced" };

            var candidates = new List<(string Cat, string CurrDiff, string NextDiff)>();

            foreach (var catKv in rings)
            {
                for (int i = 0; i < diffOrder.Length - 1; i++)
                {
                    string curr = diffOrder[i];
                    string next = diffOrder[i + 1];

                    if (!catKv.Value.TryGetValue(curr, out var currRing)) continue;
                    if (currRing.RawFill < 100) continue;

                    // Next level not started (no coding sessions at all)
                    bool nextStarted = catKv.Value.TryGetValue(next, out var nextRing)
                                    && nextRing.CodingSessionCount > 0;
                    if (!nextStarted)
                    {
                        candidates.Add((catKv.Key, curr, next));
                        break;  // only report one level per category
                    }
                }
            }

            if (!candidates.Any()) return null;

            // Pick the highest current difficulty that is complete
            var pick = candidates
                .OrderByDescending(x => Array.IndexOf(diffOrder, x.CurrDiff))
                .First();

            return new Candidate
            {
                Type        = "coding_next_level",
                TypeLabel   = "Next level unlocked",
                CtaLabel    = $"Start {Capitalise(pick.NextDiff)} {pick.Cat}",
                CtaHref     = $"../menu-page.html?track={track}&category={Uri.EscapeDataString(pick.Cat)}&difficulty={pick.NextDiff}&source=adaptive&type=nextlevel",
                Headline    = $"{pick.Cat} — {Capitalise(pick.CurrDiff)} complete. Start {Capitalise(pick.NextDiff)}.",
                Context     = $"You have finished {pick.Cat} at {Capitalise(pick.CurrDiff)} level. The first {Capitalise(pick.NextDiff)} exercise is ready — begin it now before the momentum fades.",
                Evidence    = $"Clear signal — {Capitalise(pick.CurrDiff)} ring complete",
                EvidencePct = 80,
                TemplateVars = new() {
                    ["category"]       = pick.Cat,
                    ["difficulty"]     = Capitalise(pick.CurrDiff),
                    ["nextDifficulty"] = Capitalise(pick.NextDiff),
                },
                AltHeadline = $"Next level: {pick.Cat} {Capitalise(pick.NextDiff)}",
                AltSub      = $"{pick.Cat} {Capitalise(pick.CurrDiff)} is complete. Start {Capitalise(pick.NextDiff)} now while the context is still active.",
                AltSci      = "Beginning the next difficulty level immediately after completing the current one produces faster initial progress — prior context is still active in working memory.",
                AltType     = "amber",
            };
        }

        // ── P13: Difficulty Calibration ───────────────────────────────────────
        // Fires when one category is averaging 2× more submissions per solve
        // than the user's overall average — a signal the underlying concepts
        // need reinforcing via MCQ before more coding practice.
        static Candidate? TryDifficultyCalibration(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            const int    RequiredAccepted  = 5;
            const double OverloadRatioMin  = 2.0;

            // Compute average submissions per accepted solve per category
            var catAvgs = new List<(string Cat, double Avg)>();
            foreach (var catKv in rings)
            {
                var allAccepted = catKv.Value.Values
                    .SelectMany(r => r.Attempts.Where(a => a.Outcome == "accepted"))
                    .Take(10)
                    .ToList();

                if (allAccepted.Count < RequiredAccepted) continue;
                double avg = allAccepted.Average(a => (double)a.SubmissionsCount);
                catAvgs.Add((catKv.Key, avg));
            }

            if (catAvgs.Count < 2) return null;

            double overallAvg = catAvgs.Average(x => x.Avg);
            var hardest = catAvgs
                .Where(x => x.Avg >= overallAvg * OverloadRatioMin)
                .OrderByDescending(x => x.Avg)
                .FirstOrDefault();

            if (hardest.Cat is null) return null;

            double avgRounded = Math.Round(hardest.Avg * 10) / 10;

            return new Candidate
            {
                Type        = "difficulty_calibration",
                TypeLabel   = "Difficulty check — reinforce concepts",
                CtaLabel    = $"Reinforce {hardest.Cat} with MCQ",
                CtaHref     = BuildHref(track, hardest.Cat, "basic", "calibration"),
                Headline    = $"{hardest.Cat} coding is taking {avgRounded}× your usual number of attempts.",
                Context     = $"You are averaging {avgRounded} submissions per {hardest.Cat} exercise — significantly more than your other categories. This usually means the underlying concepts need reinforcing. A focused MCQ session on {hardest.Cat} often makes the next coding session noticeably easier.",
                Evidence    = $"Moderate signal — {avgRounded}× average submissions",
                EvidencePct = Math.Min(95, (int)((hardest.Avg / overallAvg) * 20)),
                TemplateVars = new() { ["category"] = hardest.Cat },
                AltHeadline = $"Calibrate: {hardest.Cat}",
                AltSub      = $"Your {hardest.Cat} submissions per solve ({avgRounded}×) suggest the concepts need reinforcing. An MCQ session helps.",
                AltSci      = "Procedural skill built on a weak conceptual foundation is fragile. Reinforcing the concepts first produces more durable coding fluency.",
                AltType     = "amber",
            };
        }

        // ── P14: Building Continue (guaranteed fallback) ──────────────────────
        // Always fires. Returns a recommendation to continue building the
        // category with the most data, so the primary card is never null.
        static Candidate TryBuildingContinue(
            List<Session> sessions,
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            // Pick the category the user has the most sessions in
            string cat = sessions
                .GroupBy(s => s.Category, StringComparer.OrdinalIgnoreCase)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key
                ?? rings.Keys.FirstOrDefault()
                ?? "your current category";

            // Determine the active difficulty for that category
            var diffOrder = new[] { "basic", "intermediate", "advanced" };
            string diff = "basic";
            if (rings.TryGetValue(cat, out var catRings))
            {
                diff = diffOrder
                    .Where(d => catRings.ContainsKey(d) && catRings[d].SessionCount > 0)
                    .LastOrDefault() ?? "basic";
            }

            return new Candidate
            {
                Type        = "building_continue",
                TypeLabel   = "Continue building",
                CtaLabel    = $"Continue {cat}",
                CtaHref     = BuildHref(track, cat, diff, "continue"),
                Headline    = $"Keep building your {cat} profile — you have the most data there.",
                Context     = $"One more session on {cat} gives the engine more evidence to identify whether you are ready to progress or need more practice at this level.",
                Evidence    = "Baseline — continue current trajectory",
                EvidencePct = 50,
                TemplateVars = new() { ["category"] = cat },
                AltHeadline = $"Continue {cat}",
                AltSub      = $"One more session gives us enough data to refine your next recommendation.",
                AltSci      = "Deliberate practice begins with an accurate baseline — without enough data, practice time risks being misdirected.",
                AltType     = "teal",
            };
        }

        // ── Step 7: Milestones ────────────────────────────────────────────────

        static AdaptiveMilestoneDto? CheckMilestone(
            int sessionCount,
            Dictionary<string, Dictionary<string, RingState>> rings,
            List<Session> sessions,
            DateTimeOffset asOfUtc)
        {
            // First session
            if (sessionCount == 1)
                return new AdaptiveMilestoneDto
                {
                    Type    = "first_session",
                    Label   = "First session complete",
                    Context = "You've completed your first session. Your profile has started building.",
                };

            // First ring complete
            var firstComplete = rings
                .SelectMany(c => c.Value.Select(d => new { Cat = c.Key, Diff = d.Key, d.Value.Fill }))
                .Where(x => x.Fill >= 100)
                .OrderBy(x => x.Diff)
                .FirstOrDefault();

            if (firstComplete is not null)
            {
                string next = firstComplete.Diff == "basic" ? "Intermediate"
                            : firstComplete.Diff == "intermediate" ? "Advanced"
                            : "—";
                return new AdaptiveMilestoneDto
                {
                    Type           = "first_ring",
                    Label          = "First ring complete",
                    Category       = firstComplete.Cat,
                    Difficulty     = Capitalise(firstComplete.Diff),
                    NextDifficulty = next,
                    Context        = $"{firstComplete.Cat} {Capitalise(firstComplete.Diff)} is now full. {(next == "—" ? "" : next + " is unlocked.")}",
                };
            }

            // Ten sessions
            if (sessionCount == 10)
                return new AdaptiveMilestoneDto
                {
                    Type    = "ten_sessions",
                    Label   = "10 sessions in",
                    Context = "You have completed 10 sessions. Full adaptive guidance is now active.",
                };

            // First full week — 7 consecutive calendar days with at least one session
            if (sessions.Count >= 7)
            {
                var dates = sessions
                    .Select(s => s.CompletedAt.Date)
                    .Distinct()
                    .OrderDescending()
                    .ToList();

                int streak = 1;
                for (int i = 1; i < dates.Count && streak < 7; i++)
                {
                    if ((dates[i - 1] - dates[i]).TotalDays == 1) streak++;
                    else break;
                }

                if (streak >= 7)
                    return new AdaptiveMilestoneDto
                    {
                        Type    = "first_week",
                        Label   = "First full week",
                        Context = "Seven consecutive days of practice. Habit formation confirmed.",
                    };
            }

            return null;
        }

        // ── DTO builders ──────────────────────────────────────────────────────

        static IReadOnlyList<AdaptiveCategoryDto> BuildCategoryDtos(
            Dictionary<string, Dictionary<string, RingState>> rings,
            string track)
        {
            return rings.Select(c =>
            {
                var basic = c.Value.TryGetValue("basic",        out var b) ? b : null;
                var inter = c.Value.TryGetValue("intermediate", out var i) ? i : null;
                var adv   = c.Value.TryGetValue("advanced",     out var a) ? a : null;

                var bestRing = basic ?? inter ?? adv ?? new RingState();

                int totalCodingSessions = c.Value.Values.Sum(r => r.CodingSessionCount);
                bool isCodingCategory   = totalCodingSessions > 0;

                // Collect all attempts across difficulties, newest-first
                var allAttempts = c.Value.Values
                    .SelectMany(r => r.Attempts)
                    .OrderByDescending(at => at.CompletedAt)
                    .Select(at => new AdaptiveAttemptDto
                    {
                        ExerciseId       = at.ExerciseId,
                        Outcome          = at.Outcome,
                        SubmissionsCount = at.SubmissionsCount,
                        CompletedDate    = at.CompletedAt.ToString("o"),
                        Difficulty       = at.Difficulty,
                    })
                    .ToList();

                return new AdaptiveCategoryDto
                {
                    Name              = c.Key,
                    Fill              = (int)bestRing.Fill,
                    Diff              = new[] {
                        basic != null && basic.RawFill >= 100 ? 1 : 0,
                        inter != null && inter.RawFill >= 100 ? 1 : 0,
                        adv   != null && adv.RawFill   >= 100 ? 1 : 0,
                    },
                    DiffFill          = new[] {
                        (int)(basic?.Fill ?? 0),
                        (int)(inter?.Fill ?? 0),
                        (int)(adv?.Fill   ?? 0),
                    },
                    State             = bestRing.DrainState,
                    Status            = bestRing.StatusLabel,
                    Track             = isCodingCategory ? track : "mcq",
                    CodingSessionCount = totalCodingSessions,
                    Attempts          = allAttempts,
                };
            }).ToList();
        }

        static AdaptivePrimaryDto BuildPrimaryDto(Candidate c, string track)
            => new AdaptivePrimaryDto
            {
                Type         = c.Type,
                TypeLabel    = c.TypeLabel,
                Headline     = c.Headline,
                Context      = c.Context,
                Evidence     = c.Evidence,
                EvidencePct  = c.EvidencePct,
                SciShort     = DefaultSciShort(c.Type),
                SciLong      = DefaultSciLong(c.Type),
                CtaLabel     = c.CtaLabel,
                CtaHref      = c.CtaHref,
                TemplateVars = c.TemplateVars,
            };

        static IReadOnlyList<AdaptiveAlternativeDto> BuildAlternativeDtos(
            IEnumerable<Candidate?> candidates)
        {
            return candidates
                .Where(c => c is not null)
                .Select(c => new AdaptiveAlternativeDto
                {
                    Type      = c!.AltType,
                    TypeLabel = c.TypeLabel,
                    Headline  = c.AltHeadline,
                    Sub       = c.AltSub,
                    Sci       = c.AltSci,
                    Cta       = c.CtaLabel + " →",
                    Href      = c.CtaHref,
                })
                .ToList();
        }

        // Builds the compact recent-session display object (AP-01 section 2).
        // Dot state logic per spec — tested in this order:
        //   correct : scorePercent ≥ 80 AND peekRate ≤ 10%   → green dot
        //   peeked  : peekRate > 30%                          → amber dot
        //   partial : everything else                         → grey dot
        // Coding sessions always have peekCount = 0 and score = 100,
        // so they always resolve to "correct".
        static AdaptiveRecentSessionDto ToRecentDto(Session s)
        {
            double peekRate = s.Total > 0 ? (double)s.PeekCount / s.Total : 0.0;

            string state;
            if      (s.Score >= 80 && peekRate <= 0.10) state = "correct";
            else if (peekRate > 0.30)                   state = "peeked";
            else                                        state = "partial";

            return new AdaptiveRecentSessionDto
            {
                Cat   = s.Category,
                Score = $"{(int)Math.Round(s.Score)}%",
                State = state,
            };
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        static List<Session> Flatten(
            IReadOnlyList<CodiviumScoring.CodingSession> coding,
            IReadOnlyList<CodiviumScoring.McqAttempt> mcq)
        {
            var list = new List<Session>();

            foreach (var s in coding)
            {
                string cat  = s.CategoryId ?? s.CategoryLegacy ?? "";
                if (string.IsNullOrWhiteSpace(cat)) continue;
                var lastAttempt = s.Attempts?.LastOrDefault();
                int correct = lastAttempt?.UnitTestsPassed ?? 0;
                double score = s.UnitTestsTotal > 0
                    ? (double)correct / s.UnitTestsTotal * 100.0
                    : 0;
                list.Add(new Session
                {
                    Category         = cat,
                    SubCategory      = s.SubCategory,
                    Difficulty       = NormaliseDifficulty(s.Difficulty),
                    Score            = score,
                    Type             = "coding",
                    CompletedAt      = s.CompletedAtUtc ?? s.StartedAtUtc ?? DateTime.MinValue,
                    Correct          = correct,
                    Total            = s.UnitTestsTotal,
                    ExerciseId       = s.ExerciseId ?? "",
                    SubmissionsCount = s.Attempts?.Count > 0 ? s.Attempts.Count : 1,
                    PeekCount        = 0,
                    MedianResponseTimeMs = null,
                });
            }
            }

            foreach (var m in mcq)
            {
                string cat = m.CategoryId ?? m.CategoryLegacy ?? "";
                if (string.IsNullOrWhiteSpace(cat)) continue;
                list.Add(new Session
                {
                    Category             = cat,
                    SubCategory          = null,
                    Difficulty           = NormaliseDifficulty(m.Difficulty),
                    Score                = m.ScorePercent ?? m.PercentLegacy ?? 0,
                    Type                 = "mcq",
                    CompletedAt          = m.CompletedAtUtc ?? m.TakenAtUtcLegacy ?? DateTime.MinValue,
                    Correct              = m.Correct ?? 0,
                    Total                = m.TotalQuestions ?? 0,
                    PeekCount            = m.PeekCount ?? 0,
                    MedianResponseTimeMs = m.MedianResponseTimeMs,
                });
            }

            return list;
        }

        static string NormaliseDifficulty(string? d) => d?.ToLowerInvariant() switch
        {
            "1" or "basic"        => "basic",
            "2" or "intermediate" => "intermediate",
            "3" or "advanced"     => "advanced",
            _                     => "basic",
        };

        static string Capitalise(string s)
            => string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s[1..];

        static string FormatDaysAgo(int days) => days switch
        {
            0     => "today",
            1     => "yesterday",
            <= 6  => $"{days} days ago",
            7     => "a week ago",
            <= 13 => $"{days} days ago",
            14    => "two weeks ago",
            _     => $"{days} days ago",
        };

        static string BuildHref(string track, string category, string difficulty, string type)
        {
            string catEnc  = Uri.EscapeDataString(category);
            string diffEnc = Uri.EscapeDataString(difficulty);
            return $"../mcq-parent.html?categories={catEnc}&difficulty={diffEnc}&count=10&source=adaptive&type={type}";
        }

        static string DefaultSciShort(string type) => type switch
        {
            "recovery"               => "Errors are the most information-rich events in deliberate practice. A recovery session directly after a poor one produces faster improvement.",
            "abandonment_spotlight"  => "Returning to an abandoned problem within days is faster than starting fresh — the problem representation built during the first attempt is still partially active.",
            "re_entry"               => "Retrieval practice at the point of near-forgetting produces significantly more durable memory than re-studying the same material.",
            "spaced_review"          => "Spaced repetition: reviewing at the point of near-forgetting produces more durable memory than reviewing earlier or later.",
            "weakness_spotlight"     => "Deliberate practice produces the fastest improvement when effort targets the specific area of greatest weakness.",
            "coding_depth_gap"       => "Overall performance is limited more by the weakest element than by the average — addressing the gap directly is the most efficient move.",
            "difficulty_progression" => "Zone of proximal development: the optimal learning zone is just beyond current capability — not too easy, not too hard.",
            "coding_fluency"         => "Decreasing effort to produce the same output is the most reliable indicator of genuine skill consolidation in procedural domains.",
            "coding_near_complete"   => "Completion of a learning unit produces a stronger memory consolidation signal than leaving it unfinished — the closure effect in cognitive science.",
            "coding_next_level"      => "Beginning the next difficulty level immediately after completing the current one produces faster initial progress — prior context is still active.",
            "mode_switch"            => "Learning science distinguishes declarative knowledge (MCQ) from procedural fluency (coding exercises). Both are required.",
            "stretch"                => "Transfer of learning: prior mastery in adjacent domains reduces acquisition time for new material.",
            "difficulty_calibration" => "Procedural skill built on a weak conceptual foundation is fragile. Reinforcing the concepts first produces more durable and transferable coding fluency.",
            "building_continue"      => "Deliberate practice begins with an accurate baseline — without enough data, practice time risks being misdirected.",
            _                        => "",
        };

        static string DefaultSciLong(string type) => type switch
        {
            "recovery"               => "Anders Ericsson's research on deliberate practice shows that feedback from failures is the primary driver of skill improvement. A recovery session converts the diagnostic information from a poor performance into targeted practice, producing faster improvement than moving on to new material.",
            "abandonment_spotlight"  => "Cognitive load theory explains this: the problem representation built during the first attempt is not completely lost. Re-engaging within a few days allows you to reconstruct that representation quickly, whereas waiting longer requires building it from scratch.",
            "re_entry"               => "The spacing effect (Ebbinghaus, 1885) shows that retrieval practice at the point of near-forgetting produces significantly stronger memory traces than reviewing material while it is still fresh. Your absence has placed you at the optimal reactivation point.",
            "spaced_review"          => "Spaced repetition leverages the spacing effect: the same amount of study time produces dramatically stronger long-term retention when distributed across multiple sessions with gaps, compared to massed practice. The optimal gap is when you have almost — but not quite — forgotten the material.",
            "weakness_spotlight"     => "Ericsson's deliberate practice framework shows that the fastest path to improvement is focused practice on specific weaknesses, not additional practice on areas of existing strength. The evidence here identifies the most productive target.",
            "coding_depth_gap"       => "The weakest link principle from systems theory applies directly here: in complex, interconnected skills, performance under pressure collapses to the weakest component. Closing the gap is both the most efficient and the most strategically important use of practice time.",
            "difficulty_progression" => "Vygotsky's Zone of Proximal Development describes the region of optimal challenge: tasks just beyond current independent capability but achievable with effort. Your ring completion and rolling average confirm you have left that zone at the current difficulty — it is time to re-enter it at the next level.",
            "coding_fluency"         => "Flow state research and deliberate practice research both converge on this: optimal learning occurs at the boundary of current capability. Your declining submission count places you below that boundary at this difficulty level — the next level is where the optimal zone now is.",
            "coding_near_complete"   => "The Zeigarnik effect demonstrates that incomplete tasks are held more actively in working memory than completed ones. Closing the ring now captures that consolidation signal at its strongest, and converts the incomplete representation into a stable long-term schema.",
            "coding_next_level"      => "Prior context is still active in working memory for several days after completing a difficulty level. Starting the next level immediately captures this window before the relevant schemas decay, reducing the cold-start difficulty of the first new exercise.",
            "mode_switch"            => "Cognitive science distinguishes between declarative knowledge (knowing that) and procedural knowledge (knowing how). MCQ practice builds declarative recognition; coding exercises build procedural fluency. Both are required for durable skill, and neither substitutes for the other.",
            "stretch"                => "Transfer of learning research shows that prior mastery in adjacent domains significantly reduces acquisition time for new material. The shared mental models between your strongest category and this new one mean the cold-start difficulty is lower than it would be for an entirely unrelated topic.",
            "difficulty_calibration" => "Research on transfer of learning shows that skills developed purely through procedural practice do not transfer well to new contexts. Conceptual knowledge — the why behind the how — is what enables flexible application. A focused MCQ session rebuilds the conceptual scaffold.",
            "building_continue"      => "Without sufficient data, the adaptive engine cannot reliably distinguish between a category that needs more practice and one that is ready for advancement. Building data in the same category is the most productive use of the next session.",
            _                        => "",
        };

        static string DefaultSciLong(string type) => type switch
        {
            "re_entry"              => "Hermann Ebbinghaus demonstrated in 1885 — and hundreds of subsequent studies have confirmed — that memories weaken exponentially without retrieval practice. The good news: relearning after a gap is always faster than first learning. A 10-minute retrieval session now is worth more than an hour after another week away.",
            "weakness_spotlight"    => "Anders Ericsson's research on expert performance found consistently that experts spend disproportionate time on their weakest areas. The gap in your profile is the clearest signal your data can give. Spending practice time on strengths feels productive but produces little measurable improvement. The uncomfortable sessions on weaker material are the ones that produce growth.",
            "spaced_review"         => "The spacing effect is one of the most replicated findings in memory research. Reviewing material at increasing intervals — just before you would forget it — produces retention that is significantly more durable than massed practice. The timing of review matters as much as the review itself.",
            "difficulty_progression"=> "Vygotsky's Zone of Proximal Development describes the region between what a learner can do independently and what they can do with challenge. Too easy and there is no growth stimulus. Too hard and performance collapses. The 70% advancement threshold exists precisely to identify when a learner is in the optimal zone.",
            "mode_switch"           => "Learning science distinguishes two types of knowledge: declarative (recognising that something is correct) and procedural (being able to produce it from scratch). MCQ develops the first. Coding exercises develop the second. Both are required for genuine competence — neither alone is sufficient.",
            "stretch"               => "Transfer of learning research shows that skills and mental models built in one area reduce acquisition time in related areas. A learner with strong foundations in their current category has already built the mental scaffolding that adjacent concepts hang on. Starting there is faster than starting from zero.",
            "recovery"              => "Research on deliberate practice shows that poor sessions are not failures — they are the highest-information events in a practice sequence. They reveal exactly which sub-concepts have not yet consolidated. A targeted recovery session immediately after a poor performance produces faster improvement than moving on to new material.",
            _                       => "",
        };
    }
}

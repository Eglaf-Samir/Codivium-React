# IFeedbackBuilder — Server-Side Contract

**Version:** 1.0  
**Package:** codivium_platform v1.1.0  
**Implements:** `POST /api/exercise/submit` → `feedback` object  
**See also:** `contracts/exercise-workspace-api.contract.md` §"Feedback object"

---

## Purpose

`IFeedbackBuilder` is the server-side interface responsible for computing all
insight and recommendation data returned in the `feedback` object when a student's
submission is accepted. The frontend (`feedback.js`) renders this data directly —
it contains no threshold logic, no string construction, and no calculation of its own.

---

## Interface definition (C#)

```csharp
/// <summary>
/// Computes the feedback payload for a successful exercise submission.
/// Called after ICodeRunner confirms all tests pass.
/// </summary>
public interface IFeedbackBuilder
{
    /// <param name="exerciseId">Stable exercise identifier.</param>
    /// <param name="userId">Authenticated user ID.</param>
    /// <param name="result">Code runner result (all tests passed).</param>
    /// <param name="attempt">Attempt number (1-indexed, total for this session).</param>
    /// <param name="elapsedSecs">Seconds from page load to this submission (client-measured).</param>
    /// <param name="priorAttempts">All submission records for this session, oldest first.</param>
    Task<FeedbackDto> BuildAsync(
        string            exerciseId,
        string            userId,
        CodeRunResult     result,
        int               attempt,
        int               elapsedSecs,
        IList<AttemptRecord> priorAttempts
    );
}

/// <summary>Single submission attempt record from the current session.</summary>
public sealed class AttemptRecord
{
    public int  TestsPassed     { get; init; }  // e.g. 18
    public int  TestsTotal      { get; init; }  // e.g. 24
    public int  ElapsedSecsAtSubmit { get; init; } // seconds from page load to this submit
}
```

---

## Output: FeedbackDto

```csharp
public sealed class FeedbackDto
{
    // ── Identity (from exercise table) ──────────────────────────────────────
    public required string ExerciseName   { get; init; }  // Display name
    public required string Category       { get; init; }  // e.g. "Strings"
    public required string Difficulty     { get; init; }  // "beginner" | "intermediate" | "advanced"

    // ── Session metrics (computed from priorAttempts + elapsedSecs) ─────────
    public int  BestPreSuccessPercent  { get; init; }  // See formula below
    public int  TimeToFirstAttemptSecs { get; init; }  // See formula below
    public int? AvgIterationSeconds    { get; init; }  // See formula below (null if attempt==1)

    // ── Pre-computed display strings (insight generation rules below) ────────
    public required string InsightText    { get; init; }  // Paragraph shown in insight panel
    public string[]        Chips          { get; init; } = Array.Empty<string>();  // Badge labels
    public string?         NextSuggestion { get; init; }  // Short next-exercise hint

    // ── Performance classification ───────────────────────────────────────────
    public required string PerformanceTier { get; init; }  // "optimal"|"good"|"acceptable"|"needs-work"

    // ── History (from submissions table) ────────────────────────────────────
    public bool IsFirstSolve { get; init; }
    public IReadOnlyList<HistoryEntry> History { get; init; } = Array.Empty<HistoryEntry>();

    // ── Deltas vs previous solve (null if IsFirstSolve) ─────────────────────
    public DeltasDto? Deltas { get; init; }

    // ── Next exercise recommendation (optional) ──────────────────────────────
    public string? NextExerciseId   { get; init; }
    public string? NextExerciseName { get; init; }
}

public sealed class HistoryEntry
{
    public int TimeToSuccessSeconds { get; init; }
    public int Attempts             { get; init; }
}

public sealed class DeltasDto
{
    /// Percentage change vs previous solve. Negative = improvement.
    /// Formula: (current - previous) / previous * 100, rounded to nearest integer.
    public double? TimeToSuccess { get; init; }
    public double? Attempts      { get; init; }
}
```

---

## Calculation formulas

### BestPreSuccessPercent
The highest test pass percentage across all non-accepted submissions in the current session.

```
BestPreSuccessPercent = 
  priorAttempts
    .Where(a => a.TestsPassed < a.TestsTotal)   // exclude the accepted attempt
    .Select(a => (int)Math.Round((double)a.TestsPassed / a.TestsTotal * 100))
    .DefaultIfEmpty(0)
    .Max()
```

**Example:** Session had 3 attempts with 18/24, 22/24, 24/24 tests passing.  
Prior attempts (non-accepted): [18/24 = 75%, 22/24 = 92%]. `BestPreSuccessPercent = 92`.

---

### TimeToFirstAttemptSecs
Seconds from exercise page load to the first submit click. Derived from the first attempt record.

```
TimeToFirstAttemptSecs = priorAttempts.First().ElapsedSecsAtSubmit
```
If `priorAttempts` is empty (accepted on first attempt), use `elapsedSecs` (the acceptance itself was first).

**Example:** First submit came at 125 seconds. `TimeToFirstAttemptSecs = 125`.

---

### AvgIterationSeconds
Average time between consecutive submissions. Null if accepted on first attempt.

```
if (attempt == 1) return null;

AvgIterationSeconds = 
  (elapsedSecs - priorAttempts.First().ElapsedSecsAtSubmit) / (attempt - 1)
```

**Example:** elapsedSecs=768, timeToFirstAttempt=125, attempts=2.  
`AvgIterationSeconds = (768 - 125) / (2 - 1) = 643`. (One iteration between first and final submit.)

---

### Deltas
Percentage change vs the most recent prior accepted solve for the same exercise by this user.

```csharp
var prevSolve = submissionsStore
    .GetCompletionsForUser(userId, exerciseId)
    .OrderByDescending(s => s.CompletedAt)
    .FirstOrDefault();

if (prevSolve == null) return null;   // IsFirstSolve = true, no deltas

double timeDelta    = Math.Round((elapsedSecs - prevSolve.TimeToSuccessSeconds)
                       / (double)prevSolve.TimeToSuccessSeconds * 100);
double attemptDelta = Math.Round((attempt - prevSolve.Attempts)
                       / (double)prevSolve.Attempts * 100);
return new DeltasDto { TimeToSuccess = timeDelta, Attempts = attemptDelta };
```

**Example:** Previous solve: 864s, 3 attempts. Current: 768s, 2 attempts.  
`TimeToSuccess = (768-864)/864*100 = -11.1 ≈ -11`  
`Attempts = (2-3)/3*100 = -33.3 ≈ -33`

---

## Performance tier rules

| Tier | Condition |
|---|---|
| `optimal` | attempts == 1 AND timeRatio ≤ 0.40 |
| `good` | attempts ≤ 2 AND timeRatio ≤ 0.60 |
| `acceptable` | attempts ≤ 4 AND timeRatio ≤ 1.00 |
| `needs-work` | attempts ≥ 5 OR timeRatio > 1.00 |

Where `timeRatio = elapsedSecs / difficultyThreshold`:

| Difficulty | Threshold |
|---|---|
| beginner | 5,400s (90 min) |
| intermediate | 7,200s (120 min) |
| advanced | 9,600s (160 min) |

---

## Insight generation rules

`InsightText` is a single paragraph concatenating up to three sentences.

### Sentence 1 — Convergence quality (always present)

| Condition | Text |
|---|---|
| attempts == 1 | "First-attempt acceptance — your pre-submission reasoning was precise." |
| attempts == 2 | "Two submissions to acceptance. Your first attempt already reached {BestPreSuccessPercent}% of tests — one focused iteration closed the gap." |
| attempts 3–4 | "Accepted in {attempts} submissions. Best pre-success run hit {BestPreSuccessPercent}% — the failure pattern was identified and resolved cleanly." |
| attempts ≥ 5 | "This took {attempts} submissions. Before your next attempt, try writing a small concrete test case first — it tends to surface the edge case responsible for most retries." |

### Sentence 2 — Time quality (always present)

| timeRatio | Text |
|---|---|
| ≤ 0.30 | "Time to acceptance ({fmtTime}) was well inside the reference window for {difficulty} — strong signal of a solid mental model for this category." |
| ≤ 0.60 | "Solve time ({fmtTime}) is comfortably within the expected range." |
| ≤ 1.00 | "Solve time ({fmtTime}) approached the reference window. Spending an extra minute on a written plan before coding is usually faster overall." |
| > 1.00 | "A long session ({fmtTime}). For future runs, consider timeboxing your first approach and writing a brief post-mortem if you exceed the timebox." |

### Sentence 3 — Trend (only if Deltas != null)

| Condition | Text |
|---|---|
| Deltas.TimeToSuccess < -10 | "{abs(delta)}% faster than your previous attempt — growing familiarity with this problem structure is paying off." |
| (no sentence 3 otherwise) | — |

---

## Chips generation rules

Chips are short badge labels (1–4 words each) added based on performance signals:

| Condition | Chip |
|---|---|
| attempts == 1 | "First-try pass" |
| attempts == 2 | "A2 convergence" |
| IsFirstSolve | "First solve" |
| timeRatio ≤ 0.30 | "Fast solve" |
| Deltas.TimeToSuccess < -10 | "Personal best time" |
| Deltas.Attempts < -15 | "Fewer attempts" |
| BestPreSuccessPercent ≥ 90 AND attempts > 1 | "Best pre-pass: {pct}%" |

---

## NextSuggestion generation rules

| Condition | Text |
|---|---|
| tier == "needs-work" | "Consolidate: another {difficulty} {category} exercise." |
| tier == "optimal" AND difficulty != "advanced" | "Strong run — try an {nextDifficulty} {category} challenge." |
| (all other cases) | "Continue: next {difficulty} {category} exercise." |

Where `nextDifficulty`: beginner → Intermediate, intermediate → Advanced.

If `NextExerciseId` is provided (looked up from exercise catalogue), the frontend changes
the footer button label from "Try Again" to "Try Next Exercise".

---

## Complete example

### Input to BuildAsync
```
exerciseId   = "ex_min_window_001"
userId       = "user_abc123"
attempt      = 2
elapsedSecs  = 768
priorAttempts = [
  { TestsPassed: 22, TestsTotal: 24, ElapsedSecsAtSubmit: 125 }
]
prevSolve (from DB) = { TimeToSuccessSeconds: 864, Attempts: 3, CompletedAt: "2026-03-10" }
exercise (from DB)  = { Name: "Minimum Window Substring", Category: "Strings", Difficulty: "advanced" }
```

### Computed values
```
BestPreSuccessPercent  = round(22/24*100) = 92
TimeToFirstAttemptSecs = 125  (from priorAttempts[0])
AvgIterationSeconds    = (768 - 125) / (2 - 1) = 643
timeRatio              = 768 / 9600 = 0.08  (Advanced threshold)
PerformanceTier        = "optimal"  (attempts==1? No. attempts≤2 AND ratio≤0.60? YES → "good")
                          Actually: attempts==2, ratio=0.08≤0.60 → "good"
Deltas.TimeToSuccess   = round((768-864)/864*100) = -11
Deltas.Attempts        = round((2-3)/3*100) = -33
```

### Output FeedbackDto
```json
{
  "exerciseName":          "Minimum Window Substring",
  "category":              "Strings",
  "difficulty":            "advanced",
  "bestPreSuccessPercent": 92,
  "timeToFirstAttemptSecs": 125,
  "avgIterationSeconds":   643,
  "insightText":           "Two submissions to acceptance. Your first attempt already reached 92% of tests — one focused iteration closed the gap. Solve time (12:48) is comfortably within the expected range.",
  "chips":                 ["A2 convergence", "Best pre-pass: 92%"],
  "nextSuggestion":        "Continue: next Advanced Strings exercise.",
  "performanceTier":       "good",
  "isFirstSolve":          false,
  "history": [
    { "timeToSuccessSeconds": 1020, "attempts": 4 },
    { "timeToSuccessSeconds": 880,  "attempts": 3 },
    { "timeToSuccessSeconds": 864,  "attempts": 3 },
    { "timeToSuccessSeconds": 768,  "attempts": 2 }
  ],
  "deltas": { "timeToSuccess": -11, "attempts": -33 },
  "nextExerciseId":   "ex_group_anagrams_001",
  "nextExerciseName": "Group Anagrams"
}
```

---

## Integration checklist

- [ ] Implement `IFeedbackBuilder` in `backend/`
- [ ] Wire into `POST /api/exercise/submit` handler (see `backend/api/Program.cs`)
- [ ] Query submissions table for `history` and previous solve (for deltas)
- [ ] Query exercise catalogue for `NextExerciseId` recommendation
- [ ] Return `FeedbackDto` serialised as camelCase JSON in `feedback` property of submit response
- [ ] Verify with `feedback-demo.html` — open in browser, should show full modal with charts

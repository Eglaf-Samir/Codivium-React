# Database to Raw Data Mapping Guide

This guide describes how to translate your production database records into the `CodiviumRawData` shape consumed by the Codivium dashboard calculators.

---

## 1) What `CodiviumRawData` expects

`CodiviumRawData` (defined in `CodiviumDashboardBackend_AllInOne_v38.cs`) is the canonical raw input. It has three main arrays:

| Field | Meaning |
|---|---|
| `CodingSessions` | One record per completed coding session (micro or interview) |
| `McqAttempts` | One record per MCQ quiz attempt |
| `Config` | Category catalog + KaTeX scoring configuration |

---

## 2) `CodingSession` field mapping

| `CodingSession` field | DB column (example) | Notes |
|---|---|---|
| `Track` | `sessions.track` | `"micro"` or `"interview"` (canonicalize before passing) |
| `Category` | `sessions.category` | Must match the catalog in `Config.Categories` |
| `Difficulty` | `sessions.difficulty` | `"basic"` / `"intermediate"` / `"advanced"` |
| `Solved` | `sessions.solved_at IS NOT NULL` | Boolean: was all unit tests passing reached? |
| `FirstTryPass` | `sessions.attempt_count = 1` | Boolean: solved on the first submission? |
| `AttemptCount` | `sessions.attempt_count` | Total submissions for this session |
| `TimeToAcMinutes` | `sessions.solved_at - sessions.started_at` (minutes) | Only meaningful if `Solved = true` |
| `CompletedAt` | `sessions.completed_at` | UTC timestamp — used for time-window filtering |

### Canonicalization
- Track values: lowercase, strip whitespace. `"Micro"` → `"micro"`, `"interview-prep"` → `"interview"`.
- Category values: use the catalog key, not the display label. `"Dynamic Programming"` (catalog key) is correct; do not use slugs unless the catalog is slug-keyed.

---

## 3) `McqAttempt` field mapping

| `McqAttempt` field | DB column (example) | Notes |
|---|---|---|
| `Category` | `mcq_attempts.category` | Must match `Config.McqCategories` |
| `Difficulty` | `mcq_attempts.difficulty` | `"basic"` / `"intermediate"` / `"advanced"` |
| `CorrectCount` | `mcq_attempts.correct` | Number of questions answered correctly |
| `TotalCount` | `mcq_attempts.total` | Number of questions attempted |
| `CompletedAt` | `mcq_attempts.completed_at` | UTC timestamp |

---

## 4) `Config` field mapping

`Config` is derived from your category catalog, not from user data. Populate it once per request (or cache it):

| Field | Source |
|---|---|
| `Categories` | Your current list of coding categories (micro + interview catalog) |
| `McqCategories` | Your current MCQ category list |
| `KatexConfig` | Load from `config/scoring-config.katex.v1.json` (shipped with package) |

If a category is in `CodingSessions` but not in `Config.Categories`, it will be ignored by breadth/depth calculations. Always keep the catalog current.

---

## 5) Reference implementation

`DemoRawDataProvider.cs` in `backend/api/Services/` shows the expected shape. In production, replace it with a DB-backed provider:

```csharp
public class DbRawDataProvider : IRawDataProvider
{
    public async Task<CodiviumRawData> GetRawDataAsync(string userId,
        DateTimeOffset from, DateTimeOffset to)
    {
        var sessions = await _db.Sessions
            .Where(s => s.UserId == userId && s.CompletedAt <= to)
            .Select(s => new CodingSession {
                Track       = s.Track.ToLowerInvariant(),
                Category    = s.Category,
                Difficulty  = s.Difficulty,
                Solved      = s.SolvedAt != null,
                FirstTryPass = s.AttemptCount == 1 && s.SolvedAt != null,
                AttemptCount = s.AttemptCount,
                TimeToAcMinutes = s.SolvedAt.HasValue
                    ? (s.SolvedAt.Value - s.StartedAt).TotalMinutes
                    : 0,
                CompletedAt = s.CompletedAt
            }).ToListAsync();

        // ... similar for McqAttempts
        return new CodiviumRawData { CodingSessions = sessions, ... };
    }
}
```

---

## 6) Time-window note

The adapter (`DashboardPayloadV2Adapter.BuildFromRaw`) uses `fromUtc`/`toUtc` only for the `timeOnPlatform.daily` windowed series. All-time score calculators use the full session history (not time-windowed). Pass the full history in `CodiviumRawData` regardless of the query window.

---

## 7) Required vs optional fields

All fields in `CodingSession` are technically optional (C# defaults to 0/false/null) but the following are meaningfully required for correct scoring:

| Field | Consequence if missing |
|---|---|
| `Track` | Session excluded from micro/interview breakdowns; counted in combinedCoding only |
| `Category` | Session excluded from all breadth/depth/allocation calculations |
| `Solved` | Session not counted in breadth or depth |
| `CompletedAt` | Session excluded from `timeOnPlatform.daily` windowed series |
| `AttemptCount` | `avgAttemptsToAC` defaults to 0; use 1 if unknown |
| `TimeToAcMinutes` | `medianTimeToAC` excluded for this session; only meaningful if `Solved = true` |

For `McqAttempt`, `CorrectCount` and `TotalCount` are required for weighted MCQ scoring. `Category` must match a `McqCategories` entry or the attempt is excluded.

---

## 8) Demo vs reference data

| File | Status | Notes |
|---|---|---|
| `backend/api/Services/DemoRawDataProvider.cs` | REFERENCE — replace in production | Hard-coded demo data; do not use DB-backed |
| `demo/payload_example1.json` | DEMO — not backend input | A pre-built payload (output format), not raw data input |
| `demo/demo_data_*.js` | DEMO — not backend input | Browser-injected payload fixtures for demo pages |

`demo/payload_example1.json` shows the **output** shape (`dashboard-payload-v2`), not the raw input. Do not confuse it with `CodiviumRawData`.

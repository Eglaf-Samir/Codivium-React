# Codivium Raw Data Contract v1 (KaTeX-aligned)

This file defines the **raw input payload** consumed by the backend scoring/calculation layer.

**Design goal:** the raw contract should match the KaTeX scoring document **exactly** for all scoring-critical fields (names, semantics, and requiredness), while still being tolerant of a small set of deprecated legacy aliases so older clients do not break.

---

## 1) Top-level shape

Your raw payload MUST include:

- `config`
- `UniqueCorrectMcqAllTime` (KaTeX U_all)
- `codingSessionsByTrack`
- `mcqAttemptsByTrack`

### 1.1 Required fields

| Field | Type | Required | Meaning |
|---|---:|:---:|---|
| `config` | object | ✅ | Scoring config snapshot (includes categories.available_by_track and KaTeX constants under `config.katex`). |
| `UniqueCorrectMcqAllTime` | int (>=0) | ✅ | **KaTeX U_all** = lifetime total **distinct** MCQ questions answered correctly. |
| `codingSessionsByTrack` | object(map) | ✅ | Coding accepted-solve sessions grouped by track id (e.g., `micro`, `interview`). |
| `mcqAttemptsByTrack` | object(map) | ✅ | MCQ quiz results grouped by track id (e.g., `mcq`). |

### 1.2 Deprecated compatibility aliases

| Legacy field | Replacement | Notes |
|---|---|---|
| `mcqDistinctCorrectAllTime` | `UniqueCorrectMcqAllTime` | Still accepted, but **deprecated**. Prefer the KaTeX name going forward. |

---

## 2) Coding session (accepted solve)

A coding session is **one exercise** that reached **Accepted** (i.e., all unit tests passed). In KaTeX notation, this corresponds to an event `e ∈ E`.

**Canonical KaTeX fields (must exist in the raw payload):**

- `Track` (micro/interview)
- `CategoryId`
- `Difficulty` (basic/intermediate/advanced)
- `CompletedAtUtc`
- `Attempts`
- `TimeToACMinutes`
- `ExerciseId`

### 2.1 Track field

In this contract, `Track` can be represented in either of two ways:

- **Implicit (recommended)**: the session is placed inside `codingSessionsByTrack["micro"]` or `codingSessionsByTrack["interview"]`.
- **Explicit (optional redundancy)**: include `Track` inside the session object.

Both representations are treated as satisfying the KaTeX requirement that each event is track-aware.

### 2.2 Coding session fields

| Field | Type | Required | Meaning |
|---|---:|:---:|---|
| `CategoryId` | string | ✅* | Category / skill taxonomy id for the exercise. |
| `category` | string | ✅* | **Legacy alias** of `CategoryId`. |
| `ExerciseId` | string | ✅ | Stable id of the coding exercise/question (used for distinct/redo spacing in KaTeX points). |
| `Difficulty` | string or int | ✅ | KaTeX label: `basic` / `intermediate` / `advanced`. Legacy numeric 1..3 accepted. |
| `CompletedAtUtc` | ISO datetime (UTC) | ✅ | Timestamp of the accepted solve. Used for KaTeX decay + rolling windows. |
| `StartedAtUtc` | ISO datetime (UTC) | ❌ | Optional telemetry. Not used directly in KaTeX math. |
| `TimeToACMinutes` | number | ✅ | Minutes to reach the accepted solve. (Prefer explicit; may be derived upstream from the final attempt.) |
| `Attempts` | array | ✅ | List of submission attempts for this exercise. KaTeX uses **attempt count only**, but we keep attempt detail for diagnostics. |
| `UnitTestsTotal` | int | ❌ | Optional enrichment (kept for acceptance diagnostics). |
| `Track` | string | ❌ | Optional explicit track label (redundant if grouped by track key). |

✅* = At least one of `CategoryId` or `category` must be present.

### 2.3 SubmissionAttempt

| Field | Type | Required | Meaning |
|---|---:|:---:|---|
| `UnitTestsPassed` | int | ✅ | Unit tests passed for that attempt (diagnostic). |
| `TimeToSubmissionMinutes` | number | ✅ | Minutes to that attempt (cumulative within the session). |
| `SubmittedAtUtc` | ISO datetime (UTC) | ❌ | Optional attempt timestamp (diagnostic). |

---

## 3) MCQ attempt (quiz result)

An MCQ attempt is a **quiz result event**. In KaTeX, MCQ events contribute to **breadth evidence** and (currently) MCQ points depend only on `U_all`.

**Canonical KaTeX fields:**

- `QuizId`
- `Track` (implicit via `mcqAttemptsByTrack` key)
- `CategoryId`
- `Difficulty`
- `CompletedAtUtc`
- `ScorePercent`

### 3.1 MCQ attempt fields

| Field | Type | Required | Meaning |
|---|---:|:---:|---|
| `QuizId` | string | ✅ | Stable identifier for the quiz result event. |
| `CategoryId` | string | ✅* | Category / skill taxonomy id. |
| `category` | string | ✅* | **Legacy alias** of `CategoryId`. |
| `Difficulty` | string or int | ✅ | `basic` / `intermediate` / `advanced`. Legacy numeric 1..3 accepted. |
| `CompletedAtUtc` | ISO datetime (UTC) | ✅ | Timestamp used for decay/rolling windows. |
| `takenAtUtc` | ISO datetime (UTC) | ❌ | **Legacy alias** of `CompletedAtUtc`. |
| `ScorePercent` | number (0..100) | ✅† | Quiz score percentage. |
| `percent` | number (0..100) | ✅† | **Legacy alias** of `ScorePercent`. |
| `TotalQuestions` | int | ❌ | Optional enrichment. |
| `Correct` | int | ❌ | Optional enrichment. |
| `MinutesSpent` | number | ❌ | Optional enrichment. |

✅* = At least one of `CategoryId` or `category` must be present.

✅† = At least one of `ScorePercent` or `percent` must be present.

---

## 4) Validation rules (fail-fast)

The backend scoring layer will fail fast if any scoring-critical fields are missing or invalid, including:

- Missing `UniqueCorrectMcqAllTime` (or missing legacy alias).
- Missing `CompletedAtUtc` on any coding accepted solve (KaTeX recency decay needs it).
- Missing `CompletedAtUtc` on MCQ attempts when MCQ recency decay is enabled.
- Invalid `Difficulty` values (must map to KaTeX labels).

---

## 5) Example (minimal)

```json
{
  "config": { "katex": { "version": "v1" } },
  "UniqueCorrectMcqAllTime": 123,
  "codingSessionsByTrack": {
    "micro": [
      {
        "CategoryId": "arrays",
        "ExerciseId": "ex_0001",
        "Difficulty": "basic",
        "CompletedAtUtc": "2026-03-01T10:15:00Z",
        "TimeToACMinutes": 18,
        "Attempts": [
          { "UnitTestsPassed": 3, "TimeToSubmissionMinutes": 5 },
          { "UnitTestsPassed": 10, "TimeToSubmissionMinutes": 18 }
        ]
      }
    ]
  },
  "mcqAttemptsByTrack": {
    "mcq": [
      {
        "QuizId": "quiz_0001",
        "CategoryId": "arrays",
        "Difficulty": "basic",
        "CompletedAtUtc": "2026-03-02T09:00:00Z",
        "ScorePercent": 80
      }
    ]
  }
}
```

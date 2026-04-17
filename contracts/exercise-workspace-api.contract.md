# Exercise Workspace API Contract

**Version:** 1.0  
**Status:** Authoritative — implement against this contract  
**Owner:** editor-page.js (frontend), backend exercise API (backend)

---

## GET /api/exercise

Fetches an exercise definition by ID.

### Request

```
GET /api/exercise?id={exerciseId}
Accept: application/json
Credentials: same-origin
```

### Response — 200 OK

```json
{
  "id":               "string (required) — unique exercise identifier",
  "name":             "string (required) — display name",
  "category":         "string (required) — e.g. 'Arrays', 'Trees', 'Hash Tables'",
  "difficulty":       "string (required) — 'easy' | 'intermediate' | 'advanced'",
  "problemStatement": "string (required) — full instructions as HTML or markdown. Must include the problem description, constraints, and worked examples authored inline. The frontend renders this as a single block; there are no separate constraints or examples fields.",
  "testsTotal":       "integer (required) — total number of unit tests; shown as a pill on the instructions pane",
  "codeScaffold":     "string (required) — starter Python code loaded into the candidate editor",
  "hints":            "string (required) — markdown; shown in the Hints tab (locked until attempt threshold)",
  "miniTutorial":     "string (required) — HTML or markdown; shown in the Mini Tutorial tab (locked until threshold)",
  "unitTestsSource":  "string (required) — Python source for the unit tests; split into collapsible cards in the Unit Tests tab",
  "suggestedSolution":"string (required) — Python; loaded into the Solution pane (locked until threshold)",
  "priorAttempts":    "integer (optional, default 0) — total submissions by this user across all past sessions",
  "bestPriorScore":   "integer (optional) — 0–100; highest unit-test pass percentage across all prior attempts",
  "lastSolvedAt":     "string (optional) — ISO 8601 date of last accepted solve, e.g. '2026-03-12'"
}
```

**Note on `problemStatement`:** constraints and worked examples are not separate API fields. They are part of `problemStatement`, authored by the content team as inline HTML or markdown. The backend stores and returns them as a single blob. Do not create separate `constraints` or `examples` database columns — they belong inside the instructions content.

### Response — 404 Not Found

```json
{ "error": "Exercise not found", "code": "NOT_FOUND" }
```

### Response — 401 Unauthorised

```json
{ "error": "Authentication required", "code": "UNAUTHORISED" }
```

---

## POST /api/exercise/submit

Submits a code solution for evaluation.

**Direction note:** the frontend never executes code or counts test results. It sends only the student's source code and session metadata. The backend runs the code in a sandboxed Python environment, counts tests passed, and returns the results. `testsPassed`, `testsTotal`, and `testResults[]` all flow *from the backend to the frontend* — they are never sent by the client.

### Request

```
POST /api/exercise/submit
Content-Type: application/json
Accept: application/json
Credentials: same-origin
```

```json
{
  "exerciseId":  "string (required) — which exercise is being submitted",
  "track":       "string (required) — 'micro' or 'interview'; derived by the client from the ?from= URL parameter. Included so the submission record is self-contained without a DB join.",
  "code":        "string (required) — the student's Python source code",
  "sessionId":   "string (required) — client session ID (see Session Management below)",
  "elapsedSecs": "integer (required) — elapsed seconds since page load to this submit click",
  "attempt":     "integer (required) — 1-based attempt number for this session"
}
```

**The frontend does NOT send:** test counts, pass/fail results, or any measure of code correctness. Those are entirely computed server-side.

### Validation rules (enforced by frontend before sending)

| Field | Rule |
|---|---|
| `exerciseId` | Must be non-empty string |
| `track` | Must be `"micro"` or `"interview"` |
| `code` | Must be non-empty after trim |
| `sessionId` | Must be non-empty string |
| `elapsedSecs` | Must be integer ≥ 0 |
| `attempt` | Must be integer ≥ 1 |

### Response — 200 OK (tests ran — may be pass or fail)

```json
{
  "accepted":     "boolean — true = all tests passed (backend determined)",
  "testsPassed":  "integer — number of tests that passed (backend computed)",
  "testsTotal":   "integer — total tests in the suite (backend computed)",
  "testResults": [
    {
      "name":     "string — test function name, e.g. 'test_example1'",
      "status":   "string — 'pass' | 'fail'",
      "input":    "string — human-readable input (shown on failure)",
      "expected": "string — expected output (shown on failure)",
      "got":      "string — actual output (shown on failure)"
    }
  ],
  "feedback": {
    "⚠️ See IFeedbackBuilder.contract.md for the complete, authoritative feedback schema.":
    "The shape below is the minimum viable subset; the full shape adds history, deltas, chips, performanceTier, nextSuggestion, and nextExercise fields required by the feedback modal.",
    "exerciseName":          "string",
    "category":              "string",
    "difficulty":            "string",
    "bestPreSuccessPercent": "integer — highest test pass % across non-accepted attempts this session",
    "timeToFirstAttemptSecs":"integer — seconds from page load to first submit",
    "avgIterationSeconds":   "integer | null — avg seconds between submissions (null if attempt == 1)",
    "insightText":           "string — insight paragraph, server-generated by IFeedbackBuilder",
    "chips":                 ["string — short badge labels, e.g. 'First-try pass'"],
    "nextSuggestion":        "string (optional)",
    "nextExerciseId":        "string (optional)",
    "nextExerciseName":      "string (optional)",
    "performanceTier":       "string (optional) — 'optimal' | 'good' | 'acceptable' | 'needs-work'",
    "isFirstSolve":          "boolean",
    "history":               [{ "timeToSuccessSeconds": "integer", "attempts": "integer" }],
    "deltas":                { "timeToSuccess": "number | null", "attempts": "number | null" }
  }
}
```

`feedback` is only present when `accepted: true`.
`testResults` is always present (pass and fail entries alike) — the frontend uses it to stamp tick/cross badges on each unit test card.

### Response — 400 Bad Request (validation error)

```json
{
  "error": "Validation failed",
  "code":  "VALIDATION_ERROR",
  "fields": {
    "code": "Code must not be empty"
  }
}
```

### Response — 429 Too Many Requests

```json
{ "error": "Rate limit exceeded", "code": "RATE_LIMITED", "retryAfterSecs": 30 }
```

### Response — 5xx Server Error

```json
{ "error": "Internal error", "code": "SERVER_ERROR" }
```

---

## Session Management

A session ID is created client-side on first exercise load:

```
sessionId = "sess_" + Date.now().toString(36) + "_" + random(6 chars)
```

This is a lightweight client-generated ID. The backend may:
- Accept it as-is and use it for correlation logging
- Replace it with a server-generated ID in the response (future extension)
- Validate it against an auth token if session pinning is required

The session ID is **not** persisted to localStorage — it is per-page-load only.

---

## CSRF Strategy

For same-origin deployments (standard): `credentials: same-origin` with session cookies is sufficient.  
For cross-origin deployments: add a CSRF token header. The frontend will include  
`X-Csrf-Token: {token}` if `window.__CODIVIUM_CSRF_TOKEN` is set on the page.

---

## Frontend integration notes

- `editor-page.js` implements the full load + submit + results flow against this contract.
- `editor-page.submit.js` is a **stub only** — it does not implement this contract.
- `editor-page.loader.js` implements exercise loading but populates different DOM IDs  
  than `editor-page.js`. These must be reconciled during full integration.
- See `editor-page.state-model.js` for the window globals used to store exercise state.

---

## DOM contract (required elements in editor.html)

| ID | Element | Purpose |
|---|---|---|
| `submitSolution` | `<button>` | Submit trigger (already present) |
| `editorStatus` | `<div>` | Status text: loading / submitting / error / success |
| `testResults` | `<div>` | Container for test results panel |
| `testSummary` | `<p>` | e.g. "8 / 24 tests passed" |
| `testCaseList` | `<ul>` | Per-test pass/fail list |
| `attemptCount` | `<span>` | e.g. "Attempt 3" (optional) |
| `candidateEditor` | `<textarea>` | CodeMirror mount (already present) |

---

## CSRF strategy

If your deployment uses CSRF tokens:
1. Set `window.__CODIVIUM_CSRF_TOKEN = "<token>"` in a server-rendered script tag before `editor-page.js` loads.
2. The submit module automatically includes it as `X-Csrf-Token` in the POST header.
3. If absent, the header is omitted (suitable for cookie-only CSRF or CSRF-free deployments).

---

## Session ID format

Client-generated: `sess_{timestamp_base36}_{6_random_chars}`  
Example: `sess_lf3kj2_a7c9m1`

Created at exercise load time via `CVD.submit.enable(exerciseId)`.
Sent with every submission. Server may use it, ignore it, or replace it.

---

## Analytics events (A18)

The submit module dispatches `CustomEvent` on `document` for all lifecycle events (prefix: `cvd:`).

| Event | When | Key detail fields |
|---|---|---|
| `cvd:exercise_loaded` | Exercise data loaded | `exerciseId`, `name`, `difficulty`, `testsTotal` |
| `cvd:code_changed` | User edits code (debounced 2s) | `exerciseId`, `codeLength` |
| `cvd:submit_clicked` | Submit button clicked | `exerciseId`, `attempt`, `codeLength` |
| `cvd:submit_success` | All tests passed | `exerciseId`, `attempt`, `testsPassed`, `testsTotal` |
| `cvd:submit_fail` | Some tests failed | `exerciseId`, `attempt`, `testsPassed`, `testsTotal` |
| `cvd:submit_error` | Network/server error | `exerciseId`, `attempt`, `error`, `status` |
| `cvd:focus_mode_changed` | Layout focus mode toggled | `mode` |

All events include `sessionId` and `ts` (Unix ms) in `detail`.

Integration options (any of the three will receive events):
```javascript
// Option A: DOM listener
document.addEventListener("cvd:submit_success", e => analytics.track(e.detail));
// Option B: CVD hook (set before page loads)
window.CVD = window.CVD || {};
window.CVD.analytics = { track: function(event, detail) { ... } };
// Option C: shorthand
window.cvdTrack = function(event, detail) { ... };
```

---

## Frontend validation rules (A16)

Applied client-side before the POST is sent:

| Check | Behaviour on failure |
|---|---|
| Code field non-empty | Status bar: "Write some code before submitting." |
| Exercise ID present | Status bar: "No exercise loaded — cannot submit." |
| Not currently submitting | Submit button disabled; no-op |

---

## DOM contract

`editor.html` must provide these element IDs:

| ID | Element | Purpose |
|---|---|---|
| `#submitSolution` | `<button>` | Submit trigger; disabled during pending |
| `#editorStatus` | any | Status text with `aria-live="polite"` |
| `#testResults` | any | Test results panel (hidden until first submit) |
| `#testSummary` | any | "N / M tests passed" summary line |
| `#testCaseList` | `<ul>` | Per-test result items |
| `#candidateEditor` | `<textarea>` | Code editor fallback (if CodeMirror absent) |
| `#attemptCount` | any | "Attempt N" counter display |

All IDs are present in the current `editor.html`. Do not rename them.

---

## Feedback object (on accepted: true)

The `feedback` object is computed entirely server-side by `IFeedbackBuilder` and
returned as part of the submit response. The frontend (`feedback.js`) renders the
data directly — it contains no threshold logic, no string construction, and no
calculation of its own.

> **Full specification:** `contracts/IFeedbackBuilder.contract.md`
> including formulas, tier rules, insight-generation rules, and a complete worked example.

### Minimum viable response

The four required fields for the modal to render. All other fields are optional and
enable richer display (charts, deltas, tier badge, recommendation).

```json
{
  "feedback": {
    "exerciseName":  "Minimum Window Substring",
    "category":      "Strings",
    "difficulty":    "advanced",
    "insightText":   "First-attempt acceptance — your pre-submission reasoning was precise. Time to acceptance (12:48) was well inside the reference window for Advanced.",
    "chips":         ["First-try pass", "Fast solve"],
    "performanceTier": "optimal"
  }
}
```

### Full response (enables trend charts, deltas, recommendation)

```json
{
  "feedback": {
    "exerciseName":           "Minimum Window Substring",
    "category":               "Strings",
    "difficulty":             "advanced",
    "isFirstSolve":           false,
    "bestPreSuccessPercent":  92,
    "timeToFirstAttemptSecs": 125,
    "avgIterationSeconds":    643,
    "insightText":            "Two submissions to acceptance. Your first attempt already reached 92% of tests — one focused iteration closed the gap. Solve time (12:48) is comfortably within the expected range. 11% faster than your previous attempt — growing familiarity with this problem structure is paying off.",
    "chips":                  ["A2 convergence", "Fast solve", "Personal best time"],
    "nextSuggestion":         "Strong run — try an Advanced Strings challenge.",
    "nextExerciseId":         "ex_group_anagrams_001",
    "nextExerciseName":       "Group Anagrams",
    "performanceTier":        "good",
    "history": [
      { "timeToSuccessSeconds": 1020, "attempts": 4 },
      { "timeToSuccessSeconds": 880,  "attempts": 3 },
      { "timeToSuccessSeconds": 864,  "attempts": 3 },
      { "timeToSuccessSeconds": 768,  "attempts": 2 }
    ],
    "deltas": {
      "timeToSuccess": -11,
      "attempts":      -33
    }
  }
}
```

### Field reference

| Field | Type | Required | Source | Notes |
|---|---|---|---|---|
| `exerciseName` | string | **Yes** | Exercise table | Display name in modal header |
| `category` | string | **Yes** | Exercise table | e.g. `"Strings"` |
| `difficulty` | string | **Yes** | Exercise table | `"beginner"` / `"intermediate"` / `"advanced"` |
| `insightText` | string | **Yes** | IFeedbackBuilder | Paragraph shown in insight panel. Server generates from threshold rules. |
| `chips` | string[] | **Yes** | IFeedbackBuilder | Badge labels. e.g. `["First-try pass", "Fast solve"]` |
| `performanceTier` | string | **Yes** | IFeedbackBuilder | `"optimal"` / `"good"` / `"acceptable"` / `"needs-work"` — controls badge colour |
| `isFirstSolve` | boolean | No | Submission history | `true` if no prior accepted solve exists |
| `bestPreSuccessPercent` | integer | No | IFeedbackBuilder | Max test pass % across all non-accepted attempts this session |
| `timeToFirstAttemptSecs` | integer | No | IFeedbackBuilder | Seconds from page load to first submit |
| `avgIterationSeconds` | integer | No | IFeedbackBuilder | Avg seconds between consecutive submissions. Null if accepted on first attempt. |
| `nextSuggestion` | string | No | IFeedbackBuilder | Short next-exercise hint shown in chip row |
| `nextExerciseId` | string | No | Exercise catalogue | If provided, footer button navigates to this exercise |
| `nextExerciseName` | string | No | Exercise catalogue | Display name of recommended exercise |
| `history` | object[] | No | Submission history | Past completions oldest-first. Each: `{timeToSuccessSeconds, attempts}`. Requires 2+ entries to show trend charts. |
| `deltas.timeToSuccess` | number | No | IFeedbackBuilder | % change vs previous solve. Negative = improvement (green). |
| `deltas.attempts` | number | No | IFeedbackBuilder | % change in attempts vs previous solve. Negative = improvement. |

### What the client contributes

The frontend adapter in the submit module adds two values the server cannot know:

| Field | Source | Notes |
|---|---|---|
| `current.timeToSuccessSeconds` | `elapsedSecs()` | Seconds from exercise page load to accepted submit |
| `current.attempts` | `_attemptCount` | Total submissions made this session |

All other `current.*` fields (`bestPreSuccessPercent`, `timeToFirstAttemptSecs`, `avgIterationSeconds`)
come from the server `feedback` object.

`CodiviumFeedback.show()` is called automatically by the submit module when `response.accepted === true`.

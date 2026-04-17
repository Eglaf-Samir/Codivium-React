# Integration Quick-Start Guide

**Version:** 1.1.0  
**For:** Backend and frontend developers integrating this package into the Codivium platform  
**Prerequisite reading:** `../../../docs/package/getting-started/HANDOVER.md`, `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md`

---

## What this package gives you

Three fully wired frontend pages and one existing dashboard backend:

| Page | File | Status | Needs from you |
|---|---|---|---|
| Exercise menu | `menu-page.html` | UI complete | `GET /api/menu/payload` endpoint |
| Exercise workspace | `editor.html` | UI complete | `GET /api/exercise` endpoint |
| Submission + feedback | (part of editor.html) | UI complete | `POST /api/exercise/submit` endpoint |
| Performance dashboard | `codivium_insights_embedded.html` | Production-ready | Already wired (see existing docs) |

The frontend pages **load themselves automatically** once your endpoints exist at the correct URLs. You do not need to touch the frontend code.

---

## How each page loads its data

### Menu page (`menu-page.html`)

When the page opens, `menu-data.js` runs automatically and calls:
```
GET /api/menu/payload?track=micro
```
On success it renders the exercise cards. On failure it shows an error message. The filter (category checkboxes, sort) runs entirely client-side — no second API call is needed.

**To activate:** Deploy your `GET /api/menu/payload` endpoint. Open `menu-page.html?track=micro` in a browser. The page does the rest.

**For local testing without a backend:** The page already loads demo data via `menu-demo-data.js`. You can test the full UI without any endpoint.

---

### Exercise workspace (`editor.html`)

When the page opens with a `?id=` parameter, `cvd-exercise-loader` runs automatically and calls:
```
GET /api/exercise?id={exerciseId}
```
On success it populates every pane: problem statement, hints, tests, mini-tutorial, code scaffold, suggested solution. On failure it shows an inline error with a Retry button.

The page opens with a `?from=` parameter (set by the menu page). This causes a "← Exercises" back-link to appear in the topbar automatically.

**To activate:** Deploy your `GET /api/exercise` endpoint. Navigate from the menu page to an exercise card. The workspace populates automatically.

**For local testing without a backend:** Set `window.__CODIVIUM_DEMO__ = true` in the browser console and reload. The page loads a built-in demo exercise.

---

### Submission and feedback

When the student clicks Submit, the submit module in `editor-page.js` runs automatically and calls:
```
POST /api/exercise/submit
Body: { exerciseId, code, sessionId, elapsedSecs, attempt }
```

On failure (some tests fail): the test results panel appears showing which tests failed with input/expected/got.

On success (all tests pass): the test results panel shows all tests passed, and **the feedback modal opens automatically** showing time, attempts, insight text, and (if your API provides history) trend charts.

**To activate:** Deploy your `POST /api/exercise/submit` endpoint. The feedback modal requires no additional wiring — it opens automatically when your endpoint returns `accepted: true` with a `feedback` object.

---

## Step-by-step integration order

### Step 1 — Exercise database

Create an `Exercises` table with the fields in `contracts/exercise-workspace-api.contract.md` §"Exercise fields". Seed it with your exercise content.

### Step 2 — Menu endpoint

Implement `GET /api/menu/payload?track={trackId}`.

Return shape (full reference: `contracts/exercise-menu-api.contract.md`):
```json
{
  "track": "micro",
  "trackLabel": "Micro Challenges",
  "categories": ["Arrays", "Strings", "Stacks"],
  "difficultyLevels": ["beginner", "intermediate", "advanced"],
  "exercises": [
    {
      "id": "ex_min_window_001",
      "name": "Minimum Window Substring",
      "shortDescription": "Find the smallest substring containing all required characters.",
      "category": "Strings",
      "difficulty": "advanced",
      "completionStatus": "not_started",
      "completedAt": null
    }
  ]
}
```

`completionStatus` is per-user. Query your submissions table: "completed" if they have an accepted submission, "attempted" if they have any submission, "not_started" otherwise.

**Test it:** Open `menu-page.html?track=micro` with your endpoint running. Exercise cards appear.

### Step 3 — Exercise detail endpoint

Implement `GET /api/exercise?id={exerciseId}`.

Return shape (full reference: `contracts/exercise-workspace-api.contract.md` §"GET /api/exercise"):
```json
{
  "id": "ex_min_window_001",
  "name": "Minimum Window Substring",
  "category": "Strings",
  "difficulty": "advanced",
  "testsTotal": 24,
  "problemStatement": "Given strings s and t...",
  "constraints": ["1 ≤ s.length ≤ 10⁵"],
  "examples": [{ "input": "s=\"ADOBECODEBANC\", t=\"ABC\"", "output": "\"BANC\"", "explanation": "..." }],
  "codeScaffold": "def minWindow(s: str, t: str) -> str:\n    pass\n",
  "hints": "**Hint 1:** Consider a sliding window approach...",
  "miniTutorial": "## Sliding Window Pattern\n...",
  "unitTestsSource": "def test_min_window():\n    ...",
  "suggestedSolution": "def minWindow(s, t):\n    ...",
  "priorAttempts": 0,
  "bestPriorScore": null,
  "lastSolvedAt": null
}
```

`priorAttempts`, `bestPriorScore`, and `lastSolvedAt` come from joining the exercise with the user's submission history.

**Test it:** Navigate from the menu to an exercise card. The workspace panes populate.

### Step 4 — Submit endpoint

Implement `POST /api/exercise/submit`.

Request body:
```json
{
  "exerciseId": "ex_min_window_001",
  "code": "def minWindow(s, t):\n    ...\n",
  "sessionId": "sess_lf3kj2_a7c9m1",
  "elapsedSecs": 847,
  "attempt": 3
}
```

Response when some tests fail:
```json
{
  "accepted": false,
  "testsPassed": 18,
  "testsTotal": 24,
  "failedTests": [
    { "input": "s=\"a\", t=\"aa\"", "expected": "\"\"", "got": "\"a\"" }
  ],
  "feedback": null
}
```

Response when all tests pass (minimum viable):
```json
{
  "accepted": true,
  "testsPassed": 24,
  "testsTotal": 24,
  "failedTests": [],
  "feedback": {
    "exerciseName": "Minimum Window Substring",
    "category": "Strings",
    "difficulty": "advanced",
    "isFirstSolve": false
  }
}
```

That minimum `feedback` object is enough to open the modal. The client fills in elapsed time and attempt count automatically. To enable trend charts and delta indicators, add `history` and `deltas` — see `contracts/exercise-workspace-api.contract.md` §"Feedback object" for the full shape.

**Test it:** Submit code in the workspace. Failed submissions show test results. Successful submissions open the feedback modal.

### Step 5 — Wire the accepted submission into the dashboard

When a submission is accepted, create a `CodiviumScoring.CodingSession` record and write it to your raw data store so `IRawDataProvider.GetRawDataAsync` returns it on the next dashboard load:

```csharp
// In your ISubmissionStore.RecordAsync, when result.AllPassed:
var session = new CodiviumScoring.CodingSession
{
    ExerciseId     = req.ExerciseId,
    TrackId        = exercise.TrackId,
    Category       = exercise.Category,
    StartedAtUtc   = DateTimeOffset.UtcNow.AddSeconds(-req.ElapsedSecs),
    CompletedAtUtc = DateTimeOffset.UtcNow,
    UnitTestsTotal = result.TotalCount,
    Attempts       = /* build from submission history */
};
// write to your CodingSessionsByTrack data store
```

This is what makes the dashboard reflect completed exercises. Without this step the submission endpoint works but the dashboard stays static.

---

## How the feedback modal works

The feedback modal (`CodiviumFeedback.show()`) is called automatically by the submit module when:
1. `feedback.js` is loaded in `editor.html`
2. The submit response has `accepted: true`
3. A `feedback` object is present in the response

The modal has no close button — the three footer buttons are the only exit:
- **Dashboard** → navigates to `codivium_insights_embedded.html`
- **Return to Menu** → navigates back to the menu page using the `?from=` URL parameter
- **Try Again** → reloads the editor with the same exercise

The modal builds insight text automatically from the `category`, `difficulty`, `attempts`, and `timeToSuccessSeconds` fields. You do not need to compute insight strings server-side for basic operation.

---

## DOM contract — IDs your endpoints must not break

These IDs are in `editor.html` and must remain unchanged for the frontend to work:

| ID | Used by | Purpose |
|---|---|---|
| `#instructionsContent` | `cvd-exercise-loader` | Problem statement HTML |
| `#hintsContent` | `cvd-exercise-loader` | Hints markdown |
| `#unitTestsContent` | `cvd-exercise-loader` | Unit tests source |
| `#miniTutorialContent` | `cvd-exercise-loader` | Mini tutorial markdown |
| `#exercisePageTitle` | `cvd-exercise-loader` | Exercise name heading |
| `#submitSolution` | `editor-page.js` submit module | Submit button |
| `#editorStatus` | `editor-page.js` submit module | Status bar (aria-live) |
| `#testResults` | `editor-page.js` submit module | Test results panel |
| `#testSummary` | `editor-page.js` submit module | "N / M tests passed" |
| `#testCaseList` | `editor-page.js` submit module | Per-test pass/fail list |
| `#candidateEditor` | `cvd-editors` | Code editor textarea |
| `#attemptCount` | `editor-page.js` submit module | "Attempt N" display |
| `#backToMenu` | `cvd-exercise-loader` | Back link (shown when ?from= present) |

---

## CSRF

If your deployment uses CSRF tokens, inject the token before `editor-page.js` loads:

```html
<!-- Server injects this at render time -->
<script>
  window.__CODIVIUM_CSRF_TOKEN = "{{ csrf_token }}";
</script>
```

The submit module automatically includes it as `X-Csrf-Token` in the POST header.

---

## SSR embedding (optional — faster first paint)

Instead of waiting for the API call, the server can embed the payload directly in the page:

**Menu page:**
```html
<script>
  window.__CODIVIUM_MENU_DATA__ = { /* full payload */ };
</script>
```
Place before `menu-data.js`. The loader skips the API call and renders immediately.

**Exercise workspace:**
```html
<script>
  window.__CODIVIUM_EXERCISE_DATA__ = { /* full exercise payload */ };
</script>
```
Place before `editor-page.js`. The loader skips the API call and populates immediately.

---

## Analytics

The submit module dispatches events on `document` for all lifecycle moments. Hook in before the page loads:

```javascript
// Option A: DOM listener (add anywhere on the page)
document.addEventListener("cvd:submit_success", function(e) {
  myAnalytics.track("exercise_accepted", e.detail);
});

// Option B: CVD hook (set before editor-page.js loads)
window.CVD = window.CVD || {};
window.CVD.analytics = {
  track: function(event, detail) { myAnalytics.track(event, detail); }
};
```

Events fired: `exercise_loaded`, `code_changed`, `submit_clicked`, `submit_success`, `submit_fail`, `submit_error`, `focus_mode_changed`. All include `sessionId` and `ts` (Unix ms) in `detail`.

---

## Removing demo data for production

`menu-demo-data.js` is loaded by `menu-page.html` and activates demo data when no real API is present. Remove it before production deployment:

In `menu-page.html`, delete this line:
```html
<script src="assets/components/exercise-menu/menu-demo-data.js"></script>
```

The exercise workspace uses `window.__CODIVIUM_DEMO__` as its demo flag. This is never set automatically — no removal needed there.

---

## Checking your work

Run the package smoke tests at any point:

```bash
node scripts/editor_smoke_test.js   # 23 structural checks on editor + menu pages
bash scripts/security_gates.sh      # inline script/style/handler check
node scripts/link_check.js          # broken link check
```

See `../../../docs/package/policies/GOVERNANCE.md` for the full pre-release checklist.

---

## Contacts and references

| Topic | Document |
|---|---|
| Submit and exercise API shapes | `contracts/exercise-workspace-api.contract.md` |
| Menu API shape | `contracts/exercise-menu-api.contract.md` |
| Backend architecture (what to build) | `../../../docs/package/getting-started/HANDOVER.md` §"Editor / Workspace pages" |
| C# backend patterns to follow | `backend/api/Program.cs` |
| Known limitations | `../../../docs/package/operations/KNOWN_LIMITATIONS.md` |
| Edit guidance | `../../../docs/package/reference/EDIT_GUIDANCE.md` |
| Architecture decisions | `docs/adr/` |

## Authentication model

### How the reference package handles user identity

The package uses a two-layer approach to resolve the authenticated user ID:

**Layer 1 — Production (JWT claims):**  
Register ASP.NET Core JWT Bearer middleware in your `Program.cs`:
```csharp
builder.Services.AddAuthentication()
    .AddJwtBearer(options => {
        options.Authority = "https://your-idp.example.com";
        options.Audience  = "codivium-api";
    });
app.UseAuthentication();
app.UseAuthorization();
```
The user ID is read from the `sub` or `ClaimTypes.NameIdentifier` claim.

**Layer 2 — Dev-only fallback:**  
When no JWT middleware is configured, the package accepts an `X-Codivium-UserId` header. This lets the API work in local development without a full auth stack. **Remove or guard this fallback before production.**

### Endpoints that require auth

All API endpoints call `GetRequiredUserId()` and throw `UnauthorizedAccessException` if no user identity is present. The MCQ and menu endpoints additionally have commented-out `ctx.User.Identity.IsAuthenticated` guards — uncomment these once JWT middleware is registered.


# Adaptive Practice State API Contract

**Version:** 1.0  
**Related files:** `assets/components/adaptive/adaptive-practice.js`, `backend/CodiviumAdaptiveEndpoints.cs`

---

## Overview

Two endpoints support the adaptive practice page.

| Endpoint | Purpose |
|---|---|
| `GET /api/user/adaptive-state` | Returns the full adaptive state for the authenticated user |
| `POST /api/user/adaptive-state` | Records a recommendation choice or onboarding completion |

Both endpoints require an authenticated session. The user identity is resolved from the JWT Bearer token.

---

## 1. `GET /api/user/adaptive-state`

Returns everything the adaptive practice page needs to render in a single call. The frontend calls this on page load and uses the result to determine which mode to show (orientation / building / full) and what content to render in each section.

### Request

No body. No query parameters.

### Response `200 OK`

```json
{
  "mode": "full",
  "sessionCount": 22,
  "lastSessionDaysAgo": 1,
  "lastSessionLabel": "yesterday",
  "categories": [
    {
      "name": "Language Basics",
      "fill": 82,
      "diff": [1, 1, 0],
      "state": "normal",
      "status": "In progress"
    }
  ],
  "primary": {
    "type": "weakness_spotlight",
    "typeLabel": "Weakness spotlight — biggest gap",
    "headline": "Your Functions knowledge has the most room to grow.",
    "context": "You're scoring 58% on Functions...",
    "evidence": "High — 12 sessions, 74 questions",
    "evidencePct": 82,
    "sciShort": "Deliberate practice produces...",
    "sciLong": "Anders Ericsson's research...",
    "ctaLabel": "Practice Functions now",
    "ctaHref": "/mcq-parent.html?categories=Functions&difficulty=basic&count=10&source=adaptive",
    "templateVars": {
      "category": "Functions",
      "score": "58",
      "gap": "24",
      "n": "9",
      "difficulty": "Basic",
      "nextDifficulty": "Intermediate",
      "dominantMode": "MCQ",
      "otherMode": "coding",
      "ratio": "2",
      "currentCategory": "Language Basics",
      "newCategory": "Functions",
      "average": "72"
    }
  },
  "alternatives": [
    {
      "type": "teal",
      "typeLabel": "Reinforcement — spaced review",
      "headline": "Review Arrays before it fades.",
      "sub": "You answered Arrays questions correctly 16 days ago...",
      "sci": "Spaced repetition: reviewing at the point of near-forgetting...",
      "cta": "Review Arrays →",
      "href": "/mcq-parent.html?categories=Arrays&difficulty=basic&count=8&source=adaptive&type=spaced"
    }
  ],
  "milestone": null,
  "recentSessions": [
    { "cat": "Language Basics", "score": "82%", "state": "correct" },
    { "cat": "Functions",       "score": "58%", "state": "partial" }
  ],
  "sessionQuality": {
    "level": "Consolidation",
    "levels": [
      { "name": "Foundation",    "pct": 100, "isCurrent": false },
      { "name": "Consolidation", "pct": 68,  "isCurrent": true  },
      { "name": "Proficient",    "pct": 0,   "isCurrent": false },
      { "name": "Fluent",        "pct": 0,   "isCurrent": false }
    ]
  }
}
```

### Field reference

#### Top-level fields

| Field | Type | Notes |
|---|---|---|
| `mode` | `"orientation"` \| `"building"` \| `"full"` | Orientation = zero sessions. Building = 1–9 sessions. Full = 10+ sessions. |
| `sessionCount` | int | Total sessions completed by the user across all tracks. |
| `lastSessionDaysAgo` | int | Days since last session. Used to trigger re-entry recommendation (threshold: 7 days). |
| `lastSessionLabel` | string | Human-readable version of `lastSessionDaysAgo`. E.g. `"yesterday"`, `"9 hours ago"`, `"3 days ago"`. |
| `milestone` | object \| null | Null when no milestone has fired. See milestone object below. |

#### `categories[]` items

| Field | Type | Notes |
|---|---|---|
| `name` | string | Category display name. |
| `fill` | int (0–100) | Ring fill percentage after drain. 100 = ring complete at current difficulty. |
| `diff` | `[int, int, int]` | Completion flags at [Basic, Intermediate, Advanced]. 1 = rawFill ≥ 100 at that level, 0 = not yet. |
| `diffFill` | `[int, int, int]` | Raw fill % per difficulty [Basic, Intermediate, Advanced] before drain is applied. Used by near-complete and next-level rules. |
| `state` | string | `"ready"` \| `"draining"` \| `"gap"` \| `"normal"` \| `"locked"`. Controls ring colour and card border. |
| `status` | string | Short status label shown below the ring. E.g. `"Ready to advance"`, `"Priority gap"`, `"Review due"`. |
| `track` | string | Which practice track this category belongs to: `"micro"` \| `"interview"` \| `"mcq"`. |
| `codingSessionCount` | int | Total coding sessions completed in this category across all difficulty levels. |
| `attempts` | `AdaptiveAttemptDto[]` | Per-exercise attempt history, newest first. Each entry: `{ exerciseId, outcome, submissionsCount, completedDate, difficulty }`. Used by fluency, calibration, and abandonment rules. |

#### `primary` object

| Field | Type | Notes |
|---|---|---|
| `type` | string | Recommendation type key. One of: `recovery`, `abandonment_spotlight`, `re_entry`, `spaced_review`, `weakness_spotlight`, `coding_depth_gap`, `difficulty_progression`, `coding_fluency`, `coding_near_complete`, `coding_next_level`, `mode_switch`, `stretch`, `difficulty_calibration`, `building_continue`. |
| `typeLabel` | string | Human-readable type label shown in the type tag. |
| `headline` | string | Main headline (overrides template if provided). |
| `context` | string | Body text below the headline. |
| `evidence` | string | Evidence confidence label. E.g. `"High — 12 sessions, 74 questions"`. |
| `evidencePct` | int (0–100) | Evidence bar fill percentage. |
| `sciShort` | string | Short scientific basis sentence shown inline. |
| `sciLong` | string | Full expanded scientific basis paragraph (shown when user clicks "Why this works"). |
| `ctaLabel` | string | CTA button label. |
| `ctaHref` | string | CTA button destination URL. |
| `templateVars` | object | Variable substitutions for copy templates. See below. |

#### `primary.templateVars` object

These values are available in `primary.templateVars` and used by the frontend for copy rendering. All are strings. Supply whichever are relevant to the recommendation type — unneeded fields can be omitted.

| Key | Used by type | Example |
|---|---|---|
| `category` | weakness_spotlight, spaced_review, abandonment_spotlight, re_entry, coding_depth_gap, coding_near_complete, coding_next_level, coding_fluency, difficulty_calibration, building_continue | `"Functions"` |
| `score` | weakness_spotlight | `"58"` |
| `gap` | weakness_spotlight, recovery | `"24"` (percentage points) |
| `n` | spaced_review, re_entry | `"14"` (days since last correct / days absent) |
| `difficulty` | difficulty_progression, coding_near_complete, coding_next_level, coding_fluency | `"Basic"` |
| `nextDifficulty` | difficulty_progression, coding_next_level, coding_fluency | `"Intermediate"` |
| `dominantMode` | mode_switch | `"MCQ"` |
| `otherMode` | mode_switch | `"coding"` |
| `ratio` | mode_switch | `"3"` (MCQ:coding ratio) |
| `currentCategory` | stretch, coding_depth_gap | `"Functions"` |
| `newCategory` | stretch | `"Object Orientation"` |
| `average` | recovery | `"72"` (rolling average score %) |

#### `alternatives[]` items

| Field | Type | Notes |
|---|---|---|
| `type` | `"teal"` \| `"amber"` | Card accent colour. |
| `typeLabel` | string | Type label in small caps at card top. |
| `headline` | string | Card headline. |
| `sub` | string | Card body text. |
| `sci` | string | Small scientific note at card bottom. |
| `cta` | string | CTA button label. |
| `href` | string | CTA button destination. |

#### `milestone` object (when not null)

| Field | Type | Notes |
|---|---|---|
| `type` | string | Milestone type: `"first_session"`, `"first_ring"`, `"ten_sessions"`, `"first_week"`. |
| `label` | string | Short label for the banner heading. |
| `category` | string | (optional) Category involved in the milestone. |
| `difficulty` | string | (optional) Difficulty involved. |
| `nextDifficulty` | string | (optional) Next difficulty now unlocked. |
| `context` | string | One-line context shown in the banner. |

#### `recentSessions[]` items

| Field | Type | Notes |
|---|---|---|
| `cat` | string | Category name. |
| `score` | string | Score as percentage string. E.g. `"74%"`. |
| `state` | `"correct"` \| `"partial"` \| `"peeked"` | Determines dot colour in the recent sessions list. |

#### `sessionQuality` object

| Field | Type | Notes |
|---|---|---|
| `level` | string | Current quality level name: `"Foundation"`, `"Consolidation"`, `"Proficient"`, `"Fluent"`. |
| `levels[]` | array | One entry per level. `pct` = fill of the progress bar for that level. `isCurrent` = true for the active level. |

### Error responses

| Code | Meaning | Frontend behaviour |
|---|---|---|
| `401` | Unauthenticated | Redirect to login |
| `404` | No adaptive state yet (brand new user) | Show orientation mode |
| `500` | Server error | Fall back to orientation mode |

---

## 2. `POST /api/user/adaptive-state`

Records a recommendation choice or onboarding completion. Called fire-and-forget — the frontend does not wait for a response before navigating.

### Request body

```json
{
  "action": "recommendation_chosen",
  "recommendationType": "weakness_spotlight",
  "chosenAt": "2026-03-19T22:00:00.000Z",
  "onboardingContext": {
    "goal": "improve",
    "level": "basic",
    "time": 20,
    "difficulty": "basic",
    "count": 10,
    "answeredAt": "2026-03-19T21:55:00.000Z"
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `action` | string | Currently always `"recommendation_chosen"`. Future values may include `"dismissed"` (Not Today). |
| `recommendationType` | string | The recommendation type label that was shown and chosen. |
| `chosenAt` | ISO 8601 UTC | When the user clicked the CTA. |
| `onboardingContext` | object \| null | Populated on first session only, from `localStorage["cv_adaptive_onboarding"]`. Null on all subsequent requests. Contains the user's questionnaire answers. |

### Response `204 No Content`

No body. The frontend ignores the response.

---

## Backend implementation notes

The `GET` endpoint must:

1. Load the user's session history from the database (all tracks and categories)
2. Compute ring fills using the target of 30 correct answers = 100% fill
3. Run the 14-rule recommendation engine in priority order (P1–P14)
4. Return the highest-priority result as `primary`; the next two as `alternatives`
5. Populate `templateVars` from the computed session data
6. Compute `lastSessionDaysAgo` from the most recent session timestamp
7. Check for milestone conditions (first session, first ring, 10 sessions, first full week)
8. Return the full state object in one response

All 14 recommendation types are evaluated in `CodiviumAdaptiveEngine.cs`.
The `primary` field is guaranteed non-null for returning users — `building_continue` (P14) fires whenever no other rule matches.

The recommendation thresholds are documented as constants in `CodiviumAdaptiveEngine.cs`. The full priority table is in the handover reference at `handover report/cs-detail/CodiviumAdaptiveEngine.md`.

The `POST` endpoint must:

1. Update the user's continuity record with the chosen recommendation type and timestamp
2. If `onboardingContext` is present, store the user's goal, level, and time preference for goal-anchored recommendations (Phase 4 feature)
3. Return 204

See `backend/CodiviumAdaptiveEndpoints.cs` for the endpoint and `backend/CodiviumAdaptiveEngine.cs` for the complete 14-rule engine implementation.

### SubCategory field on CodingSession

`CodiviumScoring.CodingSession` now carries a `SubCategory` field (nullable string). This is set at the point a session is stored — retrieved from the `Exercise` record in the database. It enables the stretch recommendation engine to identify adjacent untouched categories by finding untouched categories whose sub-category names overlap with those the user has already encountered in their strongest category.

```csharp
// When storing an accepted session:
var session = new CodiviumScoring.CodingSession
{
    ExerciseId  = req.ExerciseId,
    CategoryId  = exercise.Category,
    SubCategory = exercise.SubCategory,   // ← set from exercise DB record
    Difficulty  = exercise.Difficulty,
    // ...
};
```

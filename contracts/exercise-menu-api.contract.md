# Exercise Menu — API Contract

**Version:** 1.0  
**Package version:** 1.1.0  
**Status:** Contract defined — backend implementation required before production.  
**See also:** `contracts/exercise-workspace-api.contract.md`, `assets/components/exercise-menu/menu-data.js`

---

## Overview

The exercise menu page (`menu-page.html`) makes one API call to populate the exercise grid.

| Call | Method | Endpoint | Purpose |
|---|---|---|---|
| Load menu | GET | `/api/menu/payload` | Fetch exercise list for a given track |

---

## GET /api/menu/payload

### Request

```
GET /api/menu/payload?track={trackId}
Accept: application/json
Credentials: same-origin
```

| Parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `track` | string | No | `"micro"` | Exercise track identifier. Currently: `"micro"`, `"interview"` |

### Response — 200 OK

```json
{
  "track": "micro",
  "trackLabel": "Micro Challenges",
  "categories": ["Arrays", "Strings", "Stacks", "Trees", "Dynamic Programming"],
  "difficultyLevels": ["beginner", "intermediate", "advanced"],
  "exercises": [
    {
      "id": "ex_min_window_001",
      "name": "Minimum Window Substring",
      "shortDescription": "Find the smallest substring that contains all required characters.",
      "category": "Strings",
      "difficulty": "advanced",
      "completionStatus": "not_started",
      "completedAt": null
    },
    {
      "id": "ex_find_duplicates_001",
      "name": "Find Duplicates in Array",
      "shortDescription": "Identify all duplicate integers in the array in linear time.",
      "category": "Arrays",
      "difficulty": "intermediate",
      "completionStatus": "completed",
      "completedAt": "2026-03-10"
    }
  ]
}
```

### Response fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `track` | string | Yes | Matches request `?track=` (or default) |
| `trackLabel` | string | Yes | Human-readable track name for display |
| `categories` | string[] | Yes | All categories present in `exercises` — used to populate filter checkboxes |
| `difficultyLevels` | string[] | Yes | Valid difficulty values — used to populate difficulty filter |
| `exercises` | object[] | Yes | Ordered list of exercises to render as cards |

### Exercise object fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | Yes | Unique identifier — passed as `?id=` to `editor.html` |
| `name` | string | Yes | Display name shown on card |
| `shortDescription` | string | Yes | One-sentence description shown on card |
| `category` | string | Yes | Must be in `categories` array |
| `difficulty` | string | Yes | One of `"beginner"`, `"intermediate"`, `"advanced"` |
| `completionStatus` | string | Yes | One of `"not_started"`, `"attempted"`, `"completed"` |
| `completedAt` | string\|null | Yes | ISO 8601 date string if completed, otherwise null |

### Error responses

| Status | Meaning | Frontend behaviour |
|---|---|---|
| 400 | Invalid track parameter | Show error message in grid area |
| 401 | Not authenticated | Redirect to login |
| 403 | Track not available to this user | Show access error |
| 404 | Track not found | Show "not found" error |
| 500 | Server error | Show error with retry button |

---

## Navigation pattern: menu → editor → back

When a student clicks an exercise card, the URL constructed is:

```
editor.html?id={exerciseId}&from={encodedReturnUrl}
```

Where `encodedReturnUrl` is `encodeURIComponent("menu-page.html?track=" + track)`.

Example:
```
editor.html?id=ex_min_window_001&from=menu-page.html%3Ftrack%3Dmicro
```

The editor page reads `?from=` on load and shows a "← Exercises" back-link in the topbar pointing to the decoded URL. This creates the full round-trip: menu → exercise → back to menu.

The feedback modal (shown on successful submission) should also provide a "Return to Exercises" button using the same `from` URL.

---

## SSR embedding pattern

For instant page load without a network request, the server can embed the payload directly:

```html
<script>
  window.__CODIVIUM_MENU_DATA__ = { /* full payload object */ };
</script>
```

Place this before `menu-data.js` loads. `menu-data.js` checks for `window.__CODIVIUM_MENU_DATA__` first and skips the API call if it's present. This mirrors the dashboard's `CodiviumInsights.init(payload)` SSR pattern.

For local development and package demos, `menu-demo-data.js` provides this payload automatically.

---

## Track values

| `track` param | `trackLabel` | Description |
|---|---|---|
| `micro` (default) | Micro Challenges | Short focused exercises, 15–30 min each |
| `interview` | Interview Preparation | Longer exercises, classic interview problems |

The frontend uses `?track=` in the URL to preserve track context across navigation. The sidebar active indicator is set from `document.body.dataset.page` which is updated to match `trackLabel` on load.

---

## DOM contract

`menu-page.html` must provide these element IDs for `menu-data.js`:

| ID | Element | Purpose |
|---|---|---|
| `#gridScroll` | div | Scrollable container wrapping the grid |
| `.exercise-grid` | section (inside #gridScroll) | Grid of exercise cards (cleared and rebuilt on load) |
| `#menuSearch` | input[type=search] | Search field |
| `#menuTrackTitle` | any | Track label heading (updated on load) |
| `#f-category` | div | Category filter checkbox group (populated on load) |
| `#cvMenuLoading` | div | Loading indicator (removed after render) |

All IDs are present in the current `menu-page.html`.

---

## Analytics events

`menu-data.js` dispatches a `CustomEvent('cvMenuReady')` on `document` after the grid renders:

```javascript
document.addEventListener('cvMenuReady', function(e) {
  console.log(e.detail); // { count: 12, track: "micro" }
});
```

Hook into this for analytics: exercise menu viewed, track, exercise count.

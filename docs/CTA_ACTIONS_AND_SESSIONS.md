# CTA actions and session-start contract

This document describes the **recommendedActions** (CTAs) emitted in the dashboard payload and the **session-start endpoint** the UI calls when a user clicks a CTA.

This is intentionally **contract-level**, not an implementation guide for your production backend.

---

## 1) Where CTAs appear in the payload

`payload.overall.recommendedActions` is an array of objects.

The dashboard UI uses `panelId` to place each CTA into the appropriate panel:

- `heatmap`
- `allocation`
- `depth`
- `time`
- `mcq`

The backend guarantees **one action per panel** (best effort).

---

## 2) RecommendedAction schema

Example:

```json
{
  "id": "cta_depth_raise",
  "panelId": "depth",
  "label": "Deepen your weakest category",
  "actionType": "start_session",
  "track": "micro",
  "params": {
    "category": "Trees",
    "intent": "raise_depth",
    "timeboxMinutes": 45,
    "source": "depth"
  }
}
```

### Fields

- `id` (string)
  - Stable identifier for analytics/debugging.
- `panelId` (string)
  - One of: `heatmap | allocation | depth | time | mcq`.
- `label` (string)
  - Button text.
- `actionType` (string)
  - Currently always `"start_session"`.
- `track` (string)
  - One of: `micro | interview | mcq`.
- `params` (object)
  - **Routing hints** only (see below).

---

## 3) Params conventions

The backend emits these keys when relevant:

- `category` (string, optional)
  - Display label for the category (e.g., `"Trees"`).
- `difficulty` (string, optional)
  - For MCQ: `basic | intermediate | advanced`.
- `timeboxMinutes` (number, optional)
  - Suggested session length.
- `intent` (string, optional)
  - Suggested objective:
    - `unlock_breadth`
    - `raise_depth`
    - `improve_convergence`
    - `mcq_gaps`
- `source` (string)
  - Debugging: indicates which builder branch produced the action.

### Important: validation responsibility

The dashboard treats `params` as **hints**.

Your production backend MUST validate:

- `track` is allowed for the user’s plan/permissions.
- `category` exists in your current category universe for that user.
- `difficulty` is valid for MCQ.
- `timeboxMinutes` is within your accepted bounds.

---

## 4) Session-start endpoint

The payload includes:

`payload.meta.sessionStartEndpoint` (string)

The frontend performs:

- `POST payload.meta.sessionStartEndpoint`
- JSON body (matches backend `StartSessionRequest`):

```json
{
  "actionId": "cta_depth_deepen",
  "panelId": "depth",
  "track": "micro",
  "category": "Tries",
  "difficulty": null,
  "params": {
    "category": "Tries",
    "categoryId": "tries",
    "intent": "raise_depth",
    "count": 5,
    "difficultyMix": ["easy", "medium", "hard"],
    "timeboxMinutes": 35
  },
  "source": "dashboard"
}
```

**Field notes:**
- `actionId` — the `id` from the CTA object; for analytics and logging.
- `panelId`, `track`, `category`, `difficulty` — top-level convenience fields.
- `params` — the full params object from the CTA, containing all routing hints (`intent`, `count`, `difficultyMix`, `categoryId`, `timeboxMinutes`). The backend must NOT rely on params alone being absent; always check both top-level fields and `params`.
- `source` — always `"dashboard"` when sent by the dashboard UI.

### Expected response

```json
{
  "sessionId": "abc123",
  "redirectUrl": "/practice/session/abc123"
}
```

- `sessionId` is for tracking/debugging.
- `redirectUrl` is where the frontend should navigate.

### Error handling

On error:

- Return non-2xx.
- Return JSON `{ "error": "...", "details": ... }` if available.
- The frontend should display a small toast and keep the dashboard state.

---

## 5) Security notes

- Never trust `category`, `difficulty`, or `timeboxMinutes` coming from the client.
- Rate-limit the session-start endpoint (especially if sessions allocate resources).
- Log actionId/panelId for analytics but do not store PII in logs.

---

## 6) Relationship to KaTeX scoring

The backend chooses CTAs using:

- KaTeX evidence per category/track (activation threshold `τ_E`)
- Convergence heatmap attempt buckets (A1..A6) to target low-convergence categories
- Depth-by-category chart values to target the weakest depth areas
- Time-on-platform for consistency nudges

CTAs are **not** part of the KaTeX scoring itself; they are “actionability” built on top of it.

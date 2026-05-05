import { getToken, getAuthHeaders, apiUrl} from '../../shared/fetch.js';

// utils/adaptive.js
// Shared utility functions used across adaptive practice components.
//
// All 14 recommendation types (P1–P14) are now computed server-side in
// CodiviumAdaptiveEngine.cs and returned in GET /api/user/adaptive-state.
// This file contains only the lightweight client utilities that components
// need: auth, navigation, category normalisation, and analytics recording.

// ── Auth token ────────────────────────────────────────────────────────────────

// ── Safe redirect ─────────────────────────────────────────────────────────────
// Only allows relative paths and same-origin absolute URLs.
export function safeRedirect(url) {
  if (!url) return;
  try {
    if (/^[^:]+$/.test(url) || url.startsWith('/')) {
      window.location.href = url;
      return;
    }
    const parsed = new URL(url, window.location.href);
    if (parsed.origin === window.location.origin) {
      window.location.href = parsed.href;
    }
  } catch (_) {}
}

// ── normaliseCategories ───────────────────────────────────────────────────────
// Defensive defaults for category objects from the server.
// The server now populates track, diffFill, attempts, and codingSessionCount
// directly, so this function is a safety net for older fixtures and test data.
export function normaliseCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map(cat => ({
    ...cat,
    track:              cat.track             || 'mcq',
    diffFill:           Array.isArray(cat.diffFill) && cat.diffFill.length === 3
                          ? cat.diffFill.map(Number)
                          : [0, 0, 0],
    attempts:           Array.isArray(cat.attempts) ? cat.attempts : [],
    codingSessionCount: typeof cat.codingSessionCount === 'number'
                          ? cat.codingSessionCount
                          : 0,
  }));
}

// ── Analytics: record recommendation choice ───────────────────────────────────
// Called when a user clicks any CTA. Persists to localStorage and fires a
// fire-and-forget POST to the server for continuity tracking.
export function recordRecommendationChoice(typeLabel) {
  const record = { type: typeLabel, chosenAt: new Date().toISOString() };

  try {
    localStorage.setItem('cv_adaptive_last_choice', JSON.stringify(record));
  } catch (_) {}

  try {
    const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
    const onboardingContext = (() => {
      try {
        const raw = localStorage.getItem('cv_adaptive_onboarding');
        return raw ? JSON.parse(raw) : null;
      } catch (_) { return null; }
    })();

    fetch(apiUrl('/api/user/adaptive-state'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action:             'recommendation_chosen',
        recommendationType: typeLabel,
        chosenAt:           record.chosenAt,
        onboardingContext,
      }),
    }).catch(() => {});
  } catch (_) {}
}

// ── Analytics: record dismissal ───────────────────────────────────────────────
// Called when a user clicks "Not Today". Fire-and-forget POST to server.
export function recordDismissal(typeLabel) {
  const record = { type: 'dismissed', chosenAt: new Date().toISOString() };

  try {
    localStorage.setItem('cv_adaptive_last_choice', JSON.stringify(record));
  } catch (_) {}

  try {
    const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
    fetch(apiUrl('/api/user/adaptive-state'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action:             'recommendation_dismissed',
        recommendationType: typeLabel,
        dismissedAt:        record.chosenAt,
      }),
    }).catch(() => {});
  } catch (_) {}
}


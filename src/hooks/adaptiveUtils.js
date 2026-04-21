// utils/adaptive.js
// Shared utility functions used across adaptive practice components.

// ── Auth token ────────────────────────────────────────────────────────────────
export function getToken() {
  try {
    return (
      sessionStorage.getItem('cv_auth_token') ||
      localStorage.getItem('cv_auth_token') ||
      null
    );
  } catch (_) {
    return null;
  }
}

export function getAuthHeaders(extra = {}) {
  const token = getToken();
  const headers = { Accept: 'application/json', ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (window.__CODIVIUM_CSRF_TOKEN) headers['X-Csrf-Token'] = window.__CODIVIUM_CSRF_TOKEN;
  return headers;
}

// ── Safe redirect ─────────────────────────────────────────────────────────────
// Only allows relative paths and same-origin absolute URLs.
export function safeRedirect(url) {
  if (!url) return;
  try {
    if (/^[a-zA-Z0-9/_\-\.?&=#%+,@:;!~*'()[\]{}]+$/.test(url)) {
      window.location.href = url;
      return;
    }
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      window.location.href = parsed.href;
    }
  } catch (_) {}
}

// ── Record recommendation choice ─────────────────────────────────────────────
// Called when any CTA is clicked. Writes to localStorage and fires POST.
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

    fetch('/api/user/adaptive-state', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'recommendation_chosen',
        recommendationType: typeLabel,
        chosenAt: record.chosenAt,
        onboardingContext,
      }),
    }).catch(() => {});
  } catch (_) {}
}

// ── Dismiss recommendation ────────────────────────────────────────────────────
export function recordDismissal(typeLabel) {
  const record = { type: 'dismissed', chosenAt: new Date().toISOString() };

  try {
    localStorage.setItem('cv_adaptive_last_choice', JSON.stringify(record));
  } catch (_) {}

  try {
    const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
    fetch('/api/user/adaptive-state', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'recommendation_dismissed',
        recommendationType: typeLabel,
        dismissedAt: record.chosenAt,
      }),
    }).catch(() => {});
  } catch (_) {}
}

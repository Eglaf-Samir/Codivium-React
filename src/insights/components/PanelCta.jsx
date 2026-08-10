// src/insights/components/PanelCta.jsx
// CTA button matching vanilla setupPanelCtas / runRecommendedAction.
// Always renders. Uses action.label for text.
// POSTs action params to the session endpoint if actionType === 'start_session'.
import React, { useState } from 'react';
import { apiUrl, getAuthHeaders, getApiBase } from '../../shared/fetch.js';

// BUG FIX: this originally only allowed same-origin-as-the-page endpoints
// (mirrors vanilla __cvNormalizeSameOriginEndpoint, which assumes frontend +
// backend are served from one host). This app's real deployment is a
// decoupled SPA + separate API (src/config.js baseURL, e.g.
// https://localhost:7294 while the page itself is http://localhost:3000) —
// every other API call in the app already targets that origin via
// apiUrl()/getApiBase(). Under the old same-origin-only check, EVERY CTA
// click hit this and failed with "Blocked unsafe endpoint URL." Now also
// trusts our own configured API origin (not an arbitrary attacker-supplied
// one) in addition to same-origin.
function normEndpoint(raw) {
  if (!raw) return null;
  try {
    const s = String(raw).trim();
    if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) return s;
    const u = new URL(s, window.location.href);
    if (u.origin === window.location.origin) return u.pathname + u.search;
    try {
      const apiBase = getApiBase();
      if (apiBase && u.origin === new URL(apiBase, window.location.href).origin) return u.href;
    } catch (_) { /* ignore malformed configured base */ }
    return null; // block cross-origin (neither the page's own nor our configured backend)
  } catch (_) { return null; }
}

export default function PanelCta({ panelId, recommendedActions }) {
  const [busy, setBusy] = useState(false);
  const action = recommendedActions && recommendedActions[panelId];

  // Always render — matches vanilla "Start session" button always present in shellHead
  const label = action?.label || action?.ctaLabel ||
    (panelId === 'mcq' ? 'Start MCQ quiz' : 'Start coding session');

  async function handleClick() {
    if (!action) return;
    setBusy(true);
    try {
      const type = String(action.actionType || 'start_session');

      // link / navigate
      if (type === 'link' || type === 'navigate') {
        const url = action.url || action.href;
        if (url) window.location.href = url;
        return;
      }

      // start_session — POST to endpoint
      const endpointRaw = action.endpoint ||
        window.__cvState?.__sessionStartEndpoint ||
        window.CodiviumConfig?.sessionStartEndpoint ||
        apiUrl('/api/sessions/start');
      const endpoint = normEndpoint(endpointRaw);
      if (!endpoint) { alert('Blocked unsafe endpoint URL.'); return; }

      const params = (action.params && typeof action.params === 'object') ? action.params : {};
      const body = {
        actionId:   action.id   || null,
        panelId:    action.panelId || panelId,
        track:      action.track  || null,
        category:   params.category   || null,
        difficulty: params.difficulty || null,
        params,
        source: 'dashboard',
      };

      // AUTH FIX: the session-start endpoint requires the same JWT bearer
      // token as the dashboard payload fetch (backend registers [Authorize]
      // on both). Without this header every CTA click 401s even though the
      // dashboard itself loaded fine — mirrors getAuthHeaders() already used
      // by the rest of the app (src/shared/fetch.js).
      const authHeaders = getAuthHeaders({ 'Content-Type': 'application/json' });
      if (!authHeaders.Authorization) { alert('Please sign in to start a session.'); return; }

      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST', cache: 'no-store',
          headers: authHeaders,
          body: JSON.stringify(body),
        });
      } catch (_) { alert('Could not start session (network error).'); return; }

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        // Backend error responses use `{ error }` (see SessionsApiController),
        // not `message`/`Message` — check both so the real reason surfaces
        // instead of always falling back to the generic text.
        alert((data?.message || data?.Message || data?.error || data?.Error) || 'Could not start session.');
        return;
      }

      const redirect = data?.redirectUrl || data?.redirect_url || data?.url;
      if (redirect) {
        const safe = normEndpoint(redirect) || (String(redirect).startsWith('http') ? redirect : null);
        if (safe) window.location.href = safe;
        else alert('Blocked unsafe redirect URL.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`panelCtaBtn${busy ? ' isBusy' : ''}`}
      data-panel-cta={panelId}
      disabled={busy}
      onClick={handleClick}
    >
      {busy ? 'Loading…' : label}
    </button>
  );
}

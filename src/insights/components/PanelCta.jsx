// src/insights/components/PanelCta.jsx
// CTA button matching vanilla setupPanelCtas / runRecommendedAction.
// Always renders. Uses action.label for text.
// POSTs action params to the session endpoint if actionType === 'start_session'.
import React, { useState } from 'react';
import { apiUrl } from '../../shared/fetch.js';

// Normalise same-origin endpoint (mirrors vanilla __cvNormalizeSameOriginEndpoint)
function normEndpoint(raw) {
  if (!raw) return null;
  try {
    const s = String(raw).trim();
    if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) return s;
    const u = new URL(s, window.location.href);
    if (u.origin === window.location.origin) return u.pathname + u.search;
    return null; // block cross-origin
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

      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (_) { alert('Could not start session (network error).'); return; }

      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        alert((data?.message || data?.Message) || 'Could not start session.');
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

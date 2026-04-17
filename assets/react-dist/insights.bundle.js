// insights.bundle.js — Data bridge.
// Fetches /api/user/insights-data and calls window.CodiviumInsights.update(payload).
// Also reads window.__CODIVIUM_DASHBOARD_DATA__ for demo/fixture mode.
(function () {
  'use strict';

  function getToken() {
    try {
      return sessionStorage.getItem('cv_auth_token')
          || localStorage.getItem('cv_auth_token')
          || null;
    } catch (_) { return null; }
  }

  function fetchAndUpdate() {
    // Priority 1: demo/fixture data set before this script ran
    if (window.__CODIVIUM_DASHBOARD_DATA__) {
      deliver(window.__CODIVIUM_DASHBOARD_DATA__);
      return;
    }
    var token = getToken();
    if (!token) return;

    var ctrl = new AbortController();
    var tid  = setTimeout(function () { ctrl.abort(); }, 10000);
    fetch('/api/user/insights-data', {
      signal:  ctrl.signal,
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token }
    })
    .then(function (res) { clearTimeout(tid); if (res.ok) return res.json().then(deliver); })
    .catch(function () { clearTimeout(tid); });
  }

  function deliver(payload) {
    if (!payload) return;

    // Strategy: wait until React has replaced the queue-stub with the real
    // applyData handler, then call it.  We detect "real" by the fact that
    // calling it no longer writes to __pendingPayload (or by waiting for
    // React's useEffect to have had a chance to run — 300 ms is plenty on
    // any modern machine).
    window.__cv_pending_payload__ = payload;

    var attempts = 0;
    function tryUpdate() {
      // Flush any payload queued while React was still mounting
      var p = window.__cv_pending_payload__;
      if (!p) return; // already consumed

      var ci = window.CodiviumInsights;
      if (ci && typeof ci.update === 'function') {
        // Check if React's real handler is now in place by testing whether
        // update is the same object as it was on last attempt
        if (ci.update !== tryUpdate._lastFn) {
          tryUpdate._lastFn = ci.update;
          // Give it one more tick so the function reference has stabilised
          setTimeout(tryUpdate, 50);
          return;
        }
        window.__cv_pending_payload__ = null;
        ci.update(p);
        return;
      }
      if (++attempts < 100) setTimeout(tryUpdate, 100);
    }
    tryUpdate._lastFn = null;

    // First attempt after a short delay so React has time to mount
    setTimeout(tryUpdate, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndUpdate);
  } else {
    fetchAndUpdate();
  }
})();

(function(){
  // Prevent '#' placeholder links from jumping the page / polluting history.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href="#"]');
    if(a){
      e.preventDefault();
    }
  });

  // Tooltips: copy data-tip into title for native accessibility.
  document.querySelectorAll('.info-mini[data-tip]').forEach((btn) => {
    if(!btn.getAttribute('title')){
      btn.setAttribute('title', btn.getAttribute('data-tip') || '');
    }
  });

  // -----------------------------
  // Performance options
  // -----------------------------
  const STORAGE_KEY = 'cvEffects';

  function normalizeMode(raw){
    const v = (raw == null) ? '' : String(raw).trim().toLowerCase();
    if (!v) return '';
    if (v === 'low' || v === 'lite' || v === 'minimal' || v === 'perf') return 'low';
    if (v === 'full' || v === 'high' || v === 'default') return 'full';
    return '';
  }

  function getParamMode(){
    try {
      const usp = new URLSearchParams(location.search || '');
      return normalizeMode(usp.get('cvEffects'));
    } catch (e) {
      return '';
    }
  }

  function getStoredMode(){
    try {
      return normalizeMode(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return '';
    }
  }

  function setStoredMode(mode){
    try {
      if (!mode) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // ignore
    }
  }

  function applyDrawerSpeedToElements(ms) {
    // Directly apply transition to drawer elements as fallback for CSS var
    // Must run after DOM is ready since elements don't exist during initial script run
    const speed = ms + 'ms';
    function _apply() {
      const selectors = ['.filter-drawer', '.drawer-wrap', '.drawer-tab'];
      selectors.forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(el) {
          el.style.setProperty('--cv-drawer-speed', speed);
        });
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _apply, { once: true });
    } else {
      _apply();
    }
  }

  function applyMode(mode){
    const root = document.documentElement;
    if (!root) return;
    if (mode === 'low') {
      root.setAttribute('data-cv-effects', 'low');
      root.style.setProperty('--cv-drawer-speed', '0ms');
    } else {
      root.removeAttribute('data-cv-effects');
      // Restore saved drawer speed (default 154ms)
      try {
        const saved = localStorage.getItem('cv_drawer_speed');
        const ms = saved ? parseInt(saved, 10) : 154;
        root.style.setProperty('--cv-drawer-speed', ms + 'ms');
        applyDrawerSpeedToElements(ms);
      } catch(_) {
        root.style.setProperty('--cv-drawer-speed', '154ms');
      }
    }
  }

  // Apply on page load
  const paramMode = getParamMode();
  const mode = paramMode || getStoredMode();
  if (paramMode) setStoredMode(paramMode);
  applyMode(mode || 'full');  // always apply to ensure --cv-drawer-speed is set

  // Listen for cv_drawer_speed changes from settings page (cross-tab/same-tab)
  window.addEventListener('storage', function(e) {
    if (e.key === 'cv_drawer_speed' && e.newValue !== null) {
      const ms = parseInt(e.newValue, 10) || 154;
      document.documentElement.style.setProperty('--cv-drawer-speed', ms + 'ms');
      applyDrawerSpeedToElements(ms);
    }
    if (e.key === 'cvEffects') {
      applyMode(e.newValue === '1' ? 'low' : 'full');
    }
  });

  // Load profile image on all pages
  (function() {
    try {
      var img = document.getElementById('profileImg');
      if (img) {
        var saved = localStorage.getItem('cv_profile_image');
        if (saved) img.src = saved;
        var name = localStorage.getItem('cv_profile_name');
        var nameEl = document.getElementById('profileName');
        if (nameEl && name) nameEl.textContent = name;
      }
    } catch(_) {}
  })();

  // Public API (safe even before dashboard bundle loads)
  window.CodiviumInsights = window.CodiviumInsights || {};
  window.CodiviumInsights.setEffectsMode = function(newMode){
    const m = normalizeMode(newMode);
    if (!m || m === 'full'){
      applyMode('full');
      setStoredMode('full');
      return 'full';
    }
    applyMode(m);
    setStoredMode(m);
    return m;
  };
  window.CodiviumInsights.getEffectsMode = function(){
    const root = document.documentElement;
    if (root && root.getAttribute('data-cv-effects') === 'low') return 'low';
    return 'full';
  };
})();

/* ── Glow-follow cursor effect ─────────────────────────────────────────────
 * Call initGlowFollow() after DOM is ready to enable the golden cursor-follow
 * ring effect on all elements with class="glow-follow".
 */
function initGlowFollow() {
  document.querySelectorAll('.glow-follow').forEach(card => {
    let __glowRaf = null;
    let __glowLastE = null;
    card.addEventListener('pointermove', function(e) {
      __glowLastE = e;
      if (__glowRaf) return;
      __glowRaf = requestAnimationFrame(function() {
        __glowRaf = null;
        if (!__glowLastE) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (__glowLastE.clientX - r.left) + 'px');
        card.style.setProperty('--my', (__glowLastE.clientY - r.top) + 'px');
      });
    }, { passive: true });
    card.addEventListener('pointerleave', function() {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
}

/* ── JWT auth helper ─────────────────────────────────────────────────────────
 * All API calls use a JWT Bearer token stored in sessionStorage.
 * Token is set by the login page after successful authentication.
 * Key: 'cv_auth_token'
 * Note: sessionStorage is cleared on tab close. For persistence across tabs,
 * the production implementation should use an HttpOnly SameSite=Strict cookie.
 *
 * Usage:
 *   fetch('/api/endpoint', { headers: getAuthHeaders() })
 *   fetch('/api/endpoint', { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) })
 */
function getAuthHeaders(extra) {
  // cv_auth_token stored in sessionStorage (scoped to tab, cleared on close).
  // sessionStorage is not accessible to other tabs or after browser restart,
  // reducing persistent token theft risk vs localStorage.
  // Production target: HttpOnly SameSite=Strict cookie (token never touches JS).
  // See deployment-manifest.json S1 for migration instructions.
  const token = (function() {
    try { return sessionStorage.getItem('cv_auth_token') || ''; } catch(_) { return ''; }
  })();
  const headers = Object.assign({}, extra || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

/* ── Network resilience helpers ──────────────────────────────────────────────
 * __cvFetch(url, opts, timeoutMs)
 *   Wraps fetch() with an AbortController timeout. Throws on timeout or
 *   non-2xx responses (unless opts.allowStatuses includes the status).
 *
 * __cvFetchWithRetry(url, opts, timeoutMs, maxRetries)
 *   Wraps __cvFetch with one automatic retry for 429/503 responses.
 *   Only for GET requests — never retry POST/PUT/DELETE to avoid duplication.
 */
function __cvFetch(url, opts, timeoutMs) {
  var ms = timeoutMs || 10000;
  var controller = new AbortController();
  var timerId = setTimeout(function() { controller.abort(); }, ms);
  var fetchOpts = Object.assign({}, opts || {}, { signal: controller.signal });
  return fetch(url, fetchOpts).then(function(res) {
    clearTimeout(timerId);
    return res;
  }).catch(function(err) {
    clearTimeout(timerId);
    throw err;
  });
}

function __cvFetchWithRetry(url, opts, timeoutMs, maxRetries) {
  var retries = (maxRetries !== undefined) ? maxRetries : 1;
  function attempt(remaining) {
    return __cvFetch(url, opts, timeoutMs).then(function(res) {
      if ((res.status === 503 || res.status === 429) && remaining > 0) {
        return new Promise(function(resolve) { setTimeout(resolve, 1500); })
          .then(function() { return attempt(remaining - 1); });
      }
      return res;
    }).catch(function(err) {
      if (remaining > 0 && err.name !== 'AbortError') {
        return new Promise(function(resolve) { setTimeout(resolve, 1500); })
          .then(function() { return attempt(remaining - 1); });
      }
      throw err;
    });
  }
  return attempt(retries);
}

/* ── Offline / online detection ──────────────────────────────────────────────
 * Shows a fixed banner at the top of the page when the browser goes offline.
 * Automatically dismisses when connectivity is restored.
 */
(function() {
  var _offlineBanner = null;

  function showOfflineBanner() {
    if (_offlineBanner) return;
    _offlineBanner = document.createElement('div');
    _offlineBanner.id = 'cvOfflineBanner';
    _offlineBanner.setAttribute('role', 'alert');
    _offlineBanner.setAttribute('aria-live', 'assertive');
    _offlineBanner.textContent = 'You are offline — some features may be unavailable.';
    (document.body || document.documentElement).prepend(_offlineBanner);
  }

  function hideOfflineBanner() {
    if (_offlineBanner) {
      _offlineBanner.remove();
      _offlineBanner = null;
    }
  }

  window.addEventListener('offline', showOfflineBanner);
  window.addEventListener('online',  hideOfflineBanner);

  // Show immediately if already offline on page load
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showOfflineBanner);
    } else {
      showOfflineBanner();
    }
  }
})();

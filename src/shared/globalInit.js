// src/shared/globalInit.js
// Replaces assets/components/core/global.js.
// Call initGlobal() once from each page's main.jsx (before React mounts).
// All logic is identical to global.js — just modular ES instead of an IIFE.

// ── Helpers ───────────────────────────────────────────────────────────────────
const EFFECTS_KEY    = 'cvEffects';
const DRAWER_KEY     = 'cv_drawer_speed';
const DRAWER_DEFAULT = 154;

function normaliseMode(raw) {
  const v = (raw == null) ? '' : String(raw).trim().toLowerCase();
  if (!v) return '';
  if (v === 'low' || v === 'lite' || v === 'minimal' || v === 'perf') return 'low';
  if (v === 'full' || v === 'high' || v === 'default') return 'full';
  return '';
}

function getParamMode() {
  try { return normaliseMode(new URLSearchParams(location.search || '').get(EFFECTS_KEY)); }
  catch (_) { return ''; }
}

function getStoredMode() {
  try { return normaliseMode(localStorage.getItem(EFFECTS_KEY)); }
  catch (_) { return ''; }
}

function setStoredMode(mode) {
  try {
    if (!mode) localStorage.removeItem(EFFECTS_KEY);
    else       localStorage.setItem(EFFECTS_KEY, mode);
  } catch (_) {}
}

function applyDrawerSpeedToElements(ms) {
  const speed = ms + 'ms';
  function apply() {
    ['.filter-drawer', '.drawer-wrap', '.drawer-tab'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el =>
        el.style.setProperty('--cv-drawer-speed', speed));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
}

export function applyMode(mode) {
  const root = document.documentElement;
  if (!root) return;
  if (mode === 'low') {
    root.setAttribute('data-cv-effects', 'low');
    root.style.setProperty('--cv-drawer-speed', '0ms');
  } else {
    root.removeAttribute('data-cv-effects');
    try {
      const saved = localStorage.getItem(DRAWER_KEY);
      const ms    = saved ? parseInt(saved, 10) : DRAWER_DEFAULT;
      root.style.setProperty('--cv-drawer-speed', ms + 'ms');
      applyDrawerSpeedToElements(ms);
    } catch (_) {
      root.style.setProperty('--cv-drawer-speed', DRAWER_DEFAULT + 'ms');
    }
  }
}

// ── Profile image ─────────────────────────────────────────────────────────────
function applyProfileImage() {
  try {
    const img    = document.getElementById('profileImg');
    const nameEl = document.getElementById('profileName');
    if (img) {
      const saved = localStorage.getItem('cv_profile_image');
      if (saved) img.src = saved;
    }
    if (nameEl) {
      const name = localStorage.getItem('cv_profile_name');
      if (name) nameEl.textContent = name;
    }
  } catch (_) {}
}

// ── Offline banner ────────────────────────────────────────────────────────────
let _offlineBanner = null;

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
  if (_offlineBanner) { _offlineBanner.remove(); _offlineBanner = null; }
}

// ── Public API (window.CodiviumInsights) ──────────────────────────────────────
function exposeEffectsApi() {
  window.CodiviumInsights = window.CodiviumInsights || {};
  window.CodiviumInsights.setEffectsMode = (newMode) => {
    const m = normaliseMode(newMode);
    if (!m || m === 'full') { applyMode('full'); setStoredMode('full'); return 'full'; }
    applyMode(m); setStoredMode(m); return m;
  };
  window.CodiviumInsights.getEffectsMode = () =>
    document.documentElement?.getAttribute('data-cv-effects') === 'low' ? 'low' : 'full';
}

// ── Storage listener (cross-tab pref sync) ────────────────────────────────────
function bindStorageListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === DRAWER_KEY && e.newValue !== null) {
      const ms = parseInt(e.newValue, 10) || DRAWER_DEFAULT;
      document.documentElement.style.setProperty('--cv-drawer-speed', ms + 'ms');
      applyDrawerSpeedToElements(ms);
    }
    if (e.key === EFFECTS_KEY) {
      applyMode(e.newValue === 'low' ? 'low' : 'full');
    }
  });
}

// ── Href="#" guard ────────────────────────────────────────────────────────────
function bindHashGuard() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href="#"]');
    if (a) e.preventDefault();
  });
}

// ── Main init ─────────────────────────────────────────────────────────────────
// Call once from each page's main.jsx, before createRoot().
export function initGlobal() {
  // Guard against double-init when both the vanilla script tag fallback
  // and the React bundle call initGlobal() on the same page load.
  if (document.documentElement._cvGlobalInit) return;
  document.documentElement._cvGlobalInit = true;

  // Effects mode
  const paramMode = getParamMode();
  const mode = paramMode || getStoredMode();
  if (paramMode) setStoredMode(paramMode);
  applyMode(mode || 'full');

  // Storage listener
  bindStorageListener();

  // Hash guard
  bindHashGuard();

  // Profile image (runs after DOMContentLoaded if needed)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyProfileImage, { once: true });
  } else {
    applyProfileImage();
  }

  // Offline detection
  window.addEventListener('offline', showOfflineBanner);
  window.addEventListener('online',  hideOfflineBanner);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showOfflineBanner, { once: true });
    } else {
      showOfflineBanner();
    }
  }

  // Expose public API
  exposeEffectsApi();
}

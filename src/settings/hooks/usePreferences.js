// hooks/usePreferences.js
import { useState, useEffect, useCallback } from 'react';
import { PREF_DEFAULTS, DASH_PRESETS } from '../utils/prefs.js';
import { lsGet, lsSet } from '../utils/storage.js';

function loadAll() {
  const prefs = {};
  for (const [key, def] of Object.entries(PREF_DEFAULTS)) {
    prefs[key] = lsGet(key, def);
  }
  return prefs;
}

export function usePreferences() {
  const [prefs, setPrefs] = useState(loadAll);

  // setPref: update one key, write to localStorage, update state
  const setPref = useCallback((key, value) => {
    lsSet(key, value);
    setPrefs(prev => ({ ...prev, [key]: value }));

    // ── Side effects ──────────────────────────────────────────────────────

    // ── Helper: fire a same-tab storage-style event so editor.html reacts
    //    without a page reload even when both pages share the same tab session.
    //    The native 'storage' event only fires in OTHER tabs; this fills that gap.
    function dispatchPrefEvent(k, v) {
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: k, newValue: String(v), oldValue: null,
          storageArea: localStorage, url: window.location.href,
        }));
      } catch (_) {}
    }

    // reduce_motion: apply to this page immediately and notify other pages
    if (key === 'reduce_motion') {
      const low = value === '1';
      // Apply directly to documentElement (works same-tab immediately)
      if (typeof window.CVEffects?.applyMode === 'function') {
        window.CVEffects.applyMode(low ? 'low' : 'full');
      } else {
        // Fallback: set attribute directly
        if (low) {
          document.documentElement.setAttribute('data-cv-effects', 'low');
          document.documentElement.style.setProperty('--cv-drawer-speed', '0ms');
        } else {
          document.documentElement.removeAttribute('data-cv-effects');
        }
      }
      lsSet('cvEffects', low ? 'low' : 'full');
      dispatchPrefEvent('cvEffects', low ? 'low' : 'full');
    }

    // Editor/REPL theme and typography: dispatch storage event so editor.html
    // reapplies the new values immediately (editor-page.js listens for these)
    const editorKeys = [
      'cv_syntax_theme', 'cv_repl_syntax_theme',
      'cv_editor_font_size', 'cv_repl_font_size', 'cv_instructions_font_size',
      'cv_editor_font_family', 'cv_repl_font_family', 'cv_instructions_font_family',
    ];
    if (editorKeys.includes(key)) {
      dispatchPrefEvent(key, value);
    }

    // show_tour_btn: toggle the tour button visibility immediately
    if (key === 'show_tour_btn') {
      try {
        const btn = document.getElementById('cvSiteTourBtn');
        if (btn) btn.style.display = value === '1' ? '' : 'none';
      } catch (_) {}
      dispatchPrefEvent(key, value);
    }

    // cv_drawer_speed: apply CSS variable immediately
    if (key === 'cv_drawer_speed') {
      document.documentElement.style.setProperty('--cv-drawer-speed', `${value}ms`);
    }

    // as_dash_layout: apply to dashboard if open
    if (key === 'as_dash_layout') {
      const preset = DASH_PRESETS[value] || DASH_PRESETS.full;
      try { lsSet('cv.dashboard.ui', JSON.stringify(preset)); } catch (_) {}
      if (window.CodiviumInsights?.setUiPrefs) {
        try { window.CodiviumInsights.setUiPrefs(preset); } catch (_) {}
      }
    }

    // analytics/performance consent: also write the cv_ prefixed canonical key
    if (key === 'analytics_consent') {
      lsSet('cv_analytics_consent', value === '1' ? 'accepted' : 'declined');
    }
    if (key === 'performance_consent') {
      lsSet('cv_performance_consent', value === '1' ? 'accepted' : 'declined');
    }
  }, []);

  // Apply drawer speed on mount
  useEffect(() => {
    const speed  = prefs.reduce_motion === '1' ? '0' : prefs.cv_drawer_speed;
    document.documentElement.style.setProperty('--cv-drawer-speed', `${speed}ms`);
    if (prefs.reduce_motion === '1') {
      document.documentElement.setAttribute('data-cv-effects', 'low');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { prefs, setPref };
}

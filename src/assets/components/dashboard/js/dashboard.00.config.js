// dashboard.00.config.js — Constants and configuration (IIFE scope, no DOM).
// -----------------------------
// Config (extensible knobs)
// -----------------------------
//
// You may set window.CodiviumInsightsConfig BEFORE loading the dashboard bundle.
// Example:
//   window.CodiviumInsightsConfig = { refresh: { softMaxMs: 1800 } };
//
// Or at runtime:
//   CodiviumInsights.setConfig({ tooltip: { offsetX: 4, offsetY: 10 } });

const __cvConfig = (function(){
  try {
    const base = (typeof window !== 'undefined' && window.CodiviumInsightsConfig)
      ? window.CodiviumInsightsConfig
      : {};
    const cfg = {
      // Set to true to expose window.__cvDebug and window.CodiviumInsights.__state.
      // Never enable in production; integrators can override via window.CodiviumInsightsConfig.
      debug: base.debug === true,

      refresh: {
        // Max frequency of automatic refreshes (ms). Smaller = more responsive, larger = less thrash.
        softMaxMs: 2200,
        hardMaxMs: 2600,
        hardDelayMs: 480,

        // Global floor for refresh requests (ms), and how long we wait for scroll to settle (ms).
        minIntervalMs: 30000,
        scrollStableMaxMs: 2500,
      },
      resilience: {
        // Ignore resize/transition events briefly after a layout toggle (ms).
        ignoreAfterToggleMs: 180,

        // Ignore resize/transition events during initial mount (ms).
        initialIgnoreMs: 2600,
      },
      tooltip: {
        // Tiny chart tooltip (px)
        pad: 12,
        offsetX: 6,
        offsetY: 14,
        flipX: 10,
        flipY: 10,
      },
    };

    // Shallow merge user-provided top-level sections + nested leaf objects.
    const merge = (t, p) => {
      if (!p || typeof p !== 'object') return t;
      for (const k of Object.keys(p)){
        const v = p[k];
        if (v && typeof v === 'object' && !Array.isArray(v)){
          t[k] = t[k] || {};
          Object.assign(t[k], v);
        } else {
          t[k] = v;
        }
      }
      return t;
    };

    merge(cfg, base);
    if (typeof window !== 'undefined') window.CodiviumInsightsConfig = cfg;
    return cfg;
  } catch (_e) {
    return {
      refresh: { softMaxMs: 2200, hardMaxMs: 2600, hardDelayMs: 480, minIntervalMs: 30000, scrollStableMaxMs: 2500 },
      resilience: { ignoreAfterToggleMs: 180, initialIgnoreMs: 2600 },
      tooltip: { pad: 12, offsetX: 6, offsetY: 14, flipX: 10, flipY: 10 },
    };
  }
})();

(function(){
  try {
    if (typeof window === 'undefined') return;
    window.CodiviumInsights = window.CodiviumInsights || {};

    if (!window.CodiviumInsights.getConfig){
      window.CodiviumInsights.getConfig = function(){
        try { return JSON.parse(JSON.stringify(window.CodiviumInsightsConfig || __cvConfig)); }
        catch (_e) { return window.CodiviumInsightsConfig || __cvConfig; }
      };
    }

    if (!window.CodiviumInsights.setConfig){
      window.CodiviumInsights.setConfig = function(patch){
        try {
          if (!patch || typeof patch !== 'object') return;
          const cfg = window.CodiviumInsightsConfig || __cvConfig;
          for (const k of Object.keys(patch)){
            const v = patch[k];
            if (v && typeof v === 'object' && !Array.isArray(v)){
              cfg[k] = cfg[k] || {};
              Object.assign(cfg[k], v);
            } else {
              cfg[k] = v;
            }
          }
          window.CodiviumInsightsConfig = cfg;
        } catch (_e) {}
      };
    }
  } catch (_e) {}
})();

// src/insights/utils/config.js
// Dashboard configuration — direct port of dashboard.00.config.js
// No DOM dependencies; pure config object.

export const cvConfig = (() => {
  try {
    const base = (typeof window !== 'undefined' && window.CodiviumInsightsConfig)
      ? window.CodiviumInsightsConfig : {};
    const cfg = {
      debug: base.debug === true,
      refresh: { softMaxMs:2200, hardMaxMs:2600, hardDelayMs:480,
                 minIntervalMs:30000, scrollStableMaxMs:2500 },
      resilience: { ignoreAfterToggleMs:180, initialIgnoreMs:2600 },
      tooltip: { pad:12, offsetX:6, offsetY:14, flipX:10, flipY:10 },
    };
    const merge = (t, p) => {
      if (!p || typeof p !== 'object') return t;
      for (const k of Object.keys(p)) {
        const v = p[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          t[k] = t[k] || {}; Object.assign(t[k], v);
        } else { t[k] = v; }
      }
      return t;
    };
    merge(cfg, base);
    if (typeof window !== 'undefined') window.CodiviumInsightsConfig = cfg;
    return cfg;
  } catch (_) {
    return {
      refresh:    { softMaxMs:2200, hardMaxMs:2600, hardDelayMs:480, minIntervalMs:30000, scrollStableMaxMs:2500 },
      resilience: { ignoreAfterToggleMs:180, initialIgnoreMs:2600 },
      tooltip:    { pad:12, offsetX:6, offsetY:14, flipX:10, flipY:10 },
    };
  }
})();

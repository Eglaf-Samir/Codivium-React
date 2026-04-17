/* theme.js
 * ─────────────────────────────────────────────────────────────
 * Reads the saved theme from localStorage and applies it to
 * <html data-theme="..."> before the first paint.
 *
 * Must be loaded as early as possible in <head> — before any
 * stylesheet that depends on the theme tokens — to prevent a
 * flash of the default theme.
 *
 * Valid theme keys: 'vanta-black' | 'obsidian' | 'ebony' | 'dark-charcoal' | 'slate' | 'glacier-slate' | 'frost' | 'parchment'
 * Default: 'obsidian'
 *
 * localStorage key: cv_site_theme
 * ───────────────────────────────────────────────────────────── */
(function () {
  var VALID = ['vanta-black', 'obsidian', 'ebony', 'dark-charcoal', 'slate', 'glacier-slate', 'frost', 'parchment'];
  var DEFAULT = 'obsidian';
  var KEY = 'cv_site_theme';

  var saved;
  try { saved = localStorage.getItem(KEY); } catch (_) {}

  var theme = (saved && VALID.indexOf(saved) !== -1) ? saved : DEFAULT;

  /* Apply immediately — before CSS paints */
  document.documentElement.setAttribute('data-theme', theme);

  /* Expose a small API for the settings page and any other page that
     needs to switch theme at runtime without a full reload. */
  window.CVTheme = {
    VALID: VALID,
    DEFAULT: DEFAULT,

    /* Returns the currently active theme key */
    get: function () {
      return document.documentElement.getAttribute('data-theme') || DEFAULT;
    },

    /* Applies a new theme, persists it, fires a custom event */
    set: function (key) {
      if (VALID.indexOf(key) === -1) return;
      document.documentElement.setAttribute('data-theme', key);
      try { localStorage.setItem(KEY, key); } catch (_) {}
      document.dispatchEvent(new CustomEvent('cv:theme-change', { detail: { theme: key } }));
    },

    /* Human-readable names for the settings UI */
    LABELS: {
      'vanta-black':   'Vanta Black',
      'obsidian':      'Obsidian',
      'ebony':         'Ebony',
      'dark-charcoal': 'Dark Charcoal',
      'slate':         'Slate',
      'glacier-slate': 'Glacier Slate',
      'frost':         'Frost',
      'parchment':     'Parchment',
    },

    /* Preview swatch colours for the settings UI chips */
    SWATCHES: {
      'vanta-black':   { bg: '#05070A', text: '#E7EEF6',                accent: '#7FAFD9',                accent2: '#C5A96A'                },
      'obsidian':      { bg: '#0a0a0c', text: 'rgba(245,245,252,0.92)', accent: 'rgba(246,213,138,0.92)', accent2: 'rgba(246,213,138,0.50)' },
      'ebony':         { bg: '#111417', text: '#e7edf3',                accent: '#7e9db6',                accent2: '#c1a36b'                },
      'dark-charcoal': { bg: '#181818', text: '#F7F7F7',                accent: '#009E98',                accent2: '#D4709A'                },
      'slate':         { bg: '#080c14', text: 'rgba(235,240,252,0.92)', accent: 'rgba(246,213,138,0.92)', accent2: 'rgba(30,144,255,0.50)'  },
      'glacier-slate': { bg: '#AEB8C3', text: '#18222C',                accent: '#1A4A6B',                accent2: '#14405E'                },
      'frost':         { bg: '#F4F8FC', text: '#16202A',                accent: '#2E6FA3',                accent2: '#3E72A8'                },
      'parchment':     { bg: '#f5f0e8', text: 'rgba(26,26,28,0.92)',    accent: '#7A5E00',                accent2: 'rgba(139,26,26,0.50)'   },
    },
  };
}());

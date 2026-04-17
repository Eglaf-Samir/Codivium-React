// hooks/useSettings.js
// Manages all editor/workspace settings that live in localStorage.
// Applies CSS custom properties to the stage element when settings change.
import { useState, useEffect, useCallback } from 'react';
import { EDITOR_THEMES } from '../../settings/utils/themes.js';

const KEYS = {
  syntaxTheme:      'cv_syntax_theme',
  editorFontSize:   'cv_editor_font_size',
  editorFontFamily: 'cv_editor_font_family',
  editorBold:       'cv_editor_bold',
  wsTheme:          'cv_ws_theme',
  glassOn:          'cv_glass_on',
  paletteThemed:    'cv_pal_themed',
  globalTheme:      'cv_use_global_ws_theme',
  leftFontFamily:   'cv_instructions_font_family',
  leftFontSize:     'cv_instructions_font_size',
  leftBold:         'cv_left_bold',
  testsFontFamily:  'cv_tests_font_family',
  testsFontSize:    'cv_tests_font_size',
  testsBold:        'cv_tests_bold',
  replFontFamily:   'cv_repl_font_family',
  replFontSize:     'cv_repl_font_size',
  replSyntaxTheme:  'cv_repl_syntax_theme',
};

function get(key, def = '') {
  try { const v = localStorage.getItem(key); return v !== null ? v : def; } catch (_) { return def; }
}
function set(key, val) {
  try { localStorage.setItem(key, String(val)); } catch (_) {}
}

// Normalise font-size: settings page stores bare numbers like '13',
// editor state uses '13px'. Accept both.
function normaliseFontSize(raw, def = '13px') {
  if (!raw) return def;
  const s = String(raw).trim();
  if (!s || s === 'auto') return def;
  return s.includes('px') ? s : s + 'px';
}

const FONT_MAP = {
  'system-mono':      'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Courier New",monospace',
  'jetbrains-mono':   '"JetBrains Mono",ui-monospace,monospace',
  'fira-code':        '"Fira Code",ui-monospace,monospace',
  'source-code-pro':  '"Source Code Pro",ui-monospace,monospace',
  'ibm-plex-mono':    '"IBM Plex Mono",ui-monospace,monospace',
  'inconsolata':      '"Inconsolata",ui-monospace,monospace',
  'auto':             '',
  'cinzel':           '"Cinzel",serif',
  'system-sans':      'system-ui,-apple-system,sans-serif',
  'system-serif':     'ui-serif,Georgia,serif',
};

// CSS variable map for syntax theme colors
const SYN_CSS = {
  codeBg:    '--syn-code-bg',
  codeFg:    '--syn-code-fg',
  gutterBg:  '--syn-gutter-bg',
  gutterFg:  '--syn-gutter-fg',
  panelBg:   '--syn-panel-bg',
  panelBorder:'--syn-panel-border',
  selection: '--syn-selection-bg',
  linehl:    '--syn-linehl-bg',
  caret:     '--syn-caret',
  comment:   '--syn-comment',
  keyword:   '--syn-keyword',
  string:    '--syn-string',
  number:    '--syn-number',
  function:  '--syn-function',
  type:      '--syn-type',
  variable:  '--syn-variable',
  builtin:   '--syn-builtin',
  operator:  '--syn-operator',
  punct:     '--syn-punct',
};

const REPL_SYN_CSS = {
  codeBg:     '--repl-syn-code-bg',
  codeFg:     '--repl-syn-code-fg',
  gutterBg:   '--repl-syn-gutter-bg',
  gutterFg:   '--repl-syn-gutter-fg',
  panelBg:    '--repl-syn-panel-bg',
  panelBorder:'--repl-syn-border',
  selection:  '--repl-syn-selection',
  caret:      '--repl-syn-caret',
  comment:    '--repl-syn-comment',
  keyword:    '--repl-syn-keyword',
  string:     '--repl-syn-string',
  number:     '--repl-syn-number',
  function:   '--repl-syn-function',
};

function applyThemeVars(themeKey, cssMap) {
  const theme = EDITOR_THEMES.find(t => t.key === themeKey) || EDITOR_THEMES[0];
  if (!theme?.colors) return;
  const root = document.documentElement;
  for (const [colorKey, cssVar] of Object.entries(cssMap)) {
    if (theme.colors[colorKey]) root.style.setProperty(cssVar, theme.colors[colorKey]);
  }
}

// Apply colour and background directly as inline styles on the given DOM
// elements so the syntax theme is authoritative — inline styles beat every
// CSS rule except !important, so workspace-theme cascade cannot interfere.
function applyInlinePaneTheme(selectors, bg, fg) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (bg) el.style.background = bg;
      if (fg) el.style.color = fg;
    } catch (_) {}
  }
}

export function useSettings(stageRef) {
  const [syntaxTheme,      setSyntaxTheme]      = useState(() => get(KEYS.syntaxTheme, 'obsidian-code'));
  const [replSyntaxTheme,  setReplSyntaxTheme]  = useState(() => get(KEYS.replSyntaxTheme, '') || get(KEYS.syntaxTheme, 'obsidian-code'));
  const [editorFontSize,   setEditorFontSize]   = useState(() => normaliseFontSize(get(KEYS.editorFontSize, '13'), '13px'));
  const [editorFontFamily, setEditorFontFamily] = useState(() => get(KEYS.editorFontFamily, 'system-mono'));
  const [editorBold,       setEditorBold]       = useState(() => get(KEYS.editorBold, '0') === '1');
  const [wsTheme,          setWsTheme]          = useState(() => get(KEYS.wsTheme, 'original'));
  const [glassOn,          setGlassOn]          = useState(() => get(KEYS.glassOn, '1') !== '0');
  const [paletteThemed,    setPaletteThemed]    = useState(() => get(KEYS.paletteThemed, '0') === '1');
  const [globalTheme,      setGlobalTheme]      = useState(() => get(KEYS.globalTheme, '0') === '1');
  const [leftFontFamily,   setLeftFontFamily]   = useState(() => get(KEYS.leftFontFamily, 'auto'));
  const [leftFontSize,     setLeftFontSize]      = useState(() => normaliseFontSize(get(KEYS.leftFontSize, '15'), '15px'));
  const [leftBold,         setLeftBold]         = useState(() => get(KEYS.leftBold, '0') === '1');
  const [testsFontFamily,  setTestsFontFamily]  = useState(() => get(KEYS.testsFontFamily, 'auto'));
  const [testsFontSize,    setTestsFontSize]    = useState(() => get(KEYS.testsFontSize, 'auto'));
  const [testsBold,        setTestsBold]        = useState(() => get(KEYS.testsBold, '0') === '1');
  const [replFontFamily,   setReplFontFamily]   = useState(() => get(KEYS.replFontFamily, 'auto'));
  const [replFontSize,     setReplFontSize]     = useState(() => normaliseFontSize(get(KEYS.replFontSize, '13'), '13px'));
  const [paletteOpen,      setPaletteOpen]      = useState(false);

  // Apply syntax theme CSS vars to documentElement whenever syntaxTheme changes,
  // and also set inline styles on the editor pane elements so the syntax theme
  // is fully authoritative — no workspace theme cascade can override inline styles.
  useEffect(() => {
    const theme = EDITOR_THEMES.find(t => t.key === syntaxTheme) || EDITOR_THEMES[0];
    applyThemeVars(syntaxTheme, SYN_CSS);
    if (theme?.colors) {
      applyInlinePaneTheme(
        ['#paneRight .pane-body', '#paneRight .cm-shell', '#paneRight .editor-slot-textarea'],
        theme.colors.codeBg,
        theme.colors.codeFg,
      );
    }
  }, [syntaxTheme]);

  // Apply REPL syntax theme CSS vars and inline pane styles.
  useEffect(() => {
    const theme = EDITOR_THEMES.find(t => t.key === replSyntaxTheme) || EDITOR_THEMES[0];
    applyThemeVars(replSyntaxTheme, REPL_SYN_CSS);
    if (theme?.colors) {
      applyInlinePaneTheme(
        ['#paneReplIn .pane-body', '#paneReplIn .cm-shell', '#paneReplIn .editor-slot-textarea',
         '#paneReplOut .pane-body', '#paneReplOut .repl-output'],
        theme.colors.codeBg,
        theme.colors.codeFg,
      );
    }
  }, [replSyntaxTheme]);

  // Apply all other settings to the stage element as CSS variables
  useEffect(() => {
    const stage = stageRef?.current;
    if (!stage) return;

    // Editor font
    const ff = FONT_MAP[editorFontFamily] || '';
    if (ff) stage.style.setProperty('--editor-font-family', ff);
    stage.style.setProperty('--editor-font-size', editorFontSize);
    stage.style.setProperty('--editor-font-weight', editorBold ? '700' : '400');

    // Left pane font
    const lff = FONT_MAP[leftFontFamily] || '';
    if (lff) stage.style.setProperty('--left-info-font-family', lff);
    else stage.style.removeProperty('--left-info-font-family');
    if (leftFontSize !== 'auto') stage.style.setProperty('--left-info-font-size', leftFontSize);
    else stage.style.removeProperty('--left-info-font-size');
    stage.style.setProperty('--left-info-font-weight', leftBold ? '700' : '400');

    // Tests pane font
    const tff = FONT_MAP[testsFontFamily] || '';
    if (tff) stage.style.setProperty('--tests-font-family', tff);
    else stage.style.removeProperty('--tests-font-family');
    if (testsFontSize !== 'auto') stage.style.setProperty('--tests-font-size', testsFontSize);
    else stage.style.removeProperty('--tests-font-size');

    // REPL font
    const rff = FONT_MAP[replFontFamily] || '';
    if (rff) stage.style.setProperty('--repl-font-family', rff);
    else stage.style.removeProperty('--repl-font-family');
    if (replFontSize !== 'auto') stage.style.setProperty('--repl-font-size', replFontSize);
    else stage.style.removeProperty('--repl-font-size');

    // Workspace theme
    if (wsTheme === 'original') stage.removeAttribute('data-ui-theme');
    else stage.setAttribute('data-ui-theme', wsTheme);

    // Glass
    stage.classList.toggle('glass-off', !glassOn);

  }, [stageRef, editorFontSize, editorFontFamily, editorBold, wsTheme, glassOn,
      leftFontFamily, leftFontSize, leftBold, testsFontFamily, testsFontSize,
      replFontFamily, replFontSize]);

  // Listen for storage events from the settings page (cross-tab)
  useEffect(() => {
    function onStorage(e) {
      switch (e.key) {
        case KEYS.syntaxTheme:
          if (e.newValue) setSyntaxTheme(e.newValue);
          break;
        case KEYS.replSyntaxTheme:
          if (e.newValue) setReplSyntaxTheme(e.newValue);
          break;
        case KEYS.editorFontSize:
          if (e.newValue) setEditorFontSize(normaliseFontSize(e.newValue, '13px'));
          break;
        case KEYS.editorFontFamily:
          if (e.newValue) setEditorFontFamily(e.newValue);
          break;
        case KEYS.replFontFamily:
          if (e.newValue) setReplFontFamily(e.newValue);
          break;
        case KEYS.replFontSize:
          if (e.newValue) setReplFontSize(normaliseFontSize(e.newValue, '13px'));
          break;
        case KEYS.leftFontFamily:
          if (e.newValue) setLeftFontFamily(e.newValue);
          break;
        case KEYS.leftFontSize:
          if (e.newValue) setLeftFontSize(normaliseFontSize(e.newValue, 'auto'));
          break;
        default:
          break;
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const apply = useCallback((vals) => {
    if (vals.syntaxTheme      !== undefined) { setSyntaxTheme(vals.syntaxTheme);           set(KEYS.syntaxTheme, vals.syntaxTheme); }
    if (vals.replSyntaxTheme  !== undefined) { setReplSyntaxTheme(vals.replSyntaxTheme);   set(KEYS.replSyntaxTheme, vals.replSyntaxTheme); }
    if (vals.editorFontSize   !== undefined) { setEditorFontSize(normaliseFontSize(vals.editorFontSize, '13px')); set(KEYS.editorFontSize, vals.editorFontSize); }
    if (vals.editorFontFamily !== undefined) { setEditorFontFamily(vals.editorFontFamily); set(KEYS.editorFontFamily, vals.editorFontFamily); }
    if (vals.editorBold       !== undefined) { setEditorBold(vals.editorBold);             set(KEYS.editorBold, vals.editorBold ? '1' : '0'); }
    if (vals.wsTheme          !== undefined) { setWsTheme(vals.wsTheme);                   set(KEYS.wsTheme, vals.wsTheme); }
    if (vals.glassOn          !== undefined) { setGlassOn(vals.glassOn);                   set(KEYS.glassOn, vals.glassOn ? '1' : '0'); }
    if (vals.paletteThemed    !== undefined) { setPaletteThemed(vals.paletteThemed);       set(KEYS.paletteThemed, vals.paletteThemed ? '1' : '0'); }
    if (vals.globalTheme      !== undefined) { setGlobalTheme(vals.globalTheme);           set(KEYS.globalTheme, vals.globalTheme ? '1' : '0'); }
    if (vals.leftFontFamily   !== undefined) { setLeftFontFamily(vals.leftFontFamily);     set(KEYS.leftFontFamily, vals.leftFontFamily); }
    if (vals.leftFontSize     !== undefined) { setLeftFontSize(normaliseFontSize(vals.leftFontSize, 'auto')); set(KEYS.leftFontSize, String(vals.leftFontSize)); }
    if (vals.leftBold         !== undefined) { setLeftBold(vals.leftBold);                 set(KEYS.leftBold, vals.leftBold ? '1' : '0'); }
    if (vals.testsFontFamily  !== undefined) { setTestsFontFamily(vals.testsFontFamily);   set(KEYS.testsFontFamily, vals.testsFontFamily); }
    if (vals.testsFontSize    !== undefined) { setTestsFontSize(normaliseFontSize(vals.testsFontSize, 'auto')); set(KEYS.testsFontSize, vals.testsFontSize); }
    if (vals.testsBold        !== undefined) { setTestsBold(vals.testsBold);               set(KEYS.testsBold, vals.testsBold ? '1' : '0'); }
    if (vals.replFontFamily   !== undefined) { setReplFontFamily(vals.replFontFamily);     set(KEYS.replFontFamily, vals.replFontFamily); }
    if (vals.replFontSize     !== undefined) { setReplFontSize(normaliseFontSize(vals.replFontSize, 'auto')); set(KEYS.replFontSize, vals.replFontSize); }
  }, []);

  return {
    syntaxTheme, replSyntaxTheme,
    editorFontSize, editorFontFamily, editorBold,
    wsTheme, glassOn, paletteThemed, globalTheme,
    leftFontFamily, leftFontSize, leftBold,
    testsFontFamily, testsFontSize, testsBold,
    replFontFamily, replFontSize,
    paletteOpen, setPaletteOpen,
    apply,
  };
}

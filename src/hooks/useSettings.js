// hooks/useSettings.js
// Manages all editor/workspace settings that live in localStorage.
// Applies CSS custom properties to the stage element when settings change.
import { useState, useEffect, useCallback } from 'react';

const KEYS = {
  syntaxTheme:      'cv_syntax_theme',
  editorFontSize:   'cv_editor_font_size',
  editorFontFamily: 'cv_editor_font_family',
  editorBold:       'cv_editor_bold',
  wsTheme:          'cv_ws_theme',
  glassOn:          'cv_glass_on',
  paletteThemed:    'cv_pal_themed',
  globalTheme:      'cv_use_global_ws_theme',
  leftFontFamily:   'cv_left_font_family',
  leftFontSize:     'cv_left_font_size',
  leftBold:         'cv_left_bold',
  testsFontFamily:  'cv_tests_font_family',
  testsFontSize:    'cv_tests_font_size',
  testsBold:        'cv_tests_bold',
  replFontFamily:   'cv_repl_font_family',
  replFontSize:     'cv_repl_font_size',
};

function get(key, def = '') {
  try { const v = localStorage.getItem(key); return v !== null ? v : def; } catch (_) { return def; }
}
function set(key, val) {
  try { localStorage.setItem(key, String(val)); } catch (_) {}
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

export function useSettings(stageRef) {
  const [syntaxTheme,      setSyntaxTheme]      = useState(() => get(KEYS.syntaxTheme, 'obsidian-code'));
  const [editorFontSize,   setEditorFontSize]   = useState(() => get(KEYS.editorFontSize, '14px'));
  const [editorFontFamily, setEditorFontFamily] = useState(() => get(KEYS.editorFontFamily, 'system-mono'));
  const [editorBold,       setEditorBold]       = useState(() => get(KEYS.editorBold, '0') === '1');
  const [wsTheme,          setWsTheme]          = useState(() => get(KEYS.wsTheme, 'original'));
  const [glassOn,          setGlassOn]          = useState(() => get(KEYS.glassOn, '1') !== '0');
  const [paletteThemed,    setPaletteThemed]    = useState(() => get(KEYS.paletteThemed, '0') === '1');
  const [globalTheme,      setGlobalTheme]      = useState(() => get(KEYS.globalTheme, '0') === '1');
  const [leftFontFamily,   setLeftFontFamily]   = useState(() => get(KEYS.leftFontFamily, 'auto'));
  const [leftFontSize,     setLeftFontSize]     = useState(() => get(KEYS.leftFontSize, 'auto'));
  const [leftBold,         setLeftBold]         = useState(() => get(KEYS.leftBold, '0') === '1');
  const [testsFontFamily,  setTestsFontFamily]  = useState(() => get(KEYS.testsFontFamily, 'auto'));
  const [testsFontSize,    setTestsFontSize]    = useState(() => get(KEYS.testsFontSize, 'auto'));
  const [testsBold,        setTestsBold]        = useState(() => get(KEYS.testsBold, '0') === '1');
  const [replFontFamily,   setReplFontFamily]   = useState(() => get(KEYS.replFontFamily, 'auto'));
  const [replFontSize,     setReplFontSize]     = useState(() => get(KEYS.replFontSize, 'auto'));
  const [paletteOpen,      setPaletteOpen]      = useState(false);

  // Apply all settings to the stage element as CSS variables
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
    if (lff) stage.style.setProperty('--left-font-family', lff);
    else stage.style.removeProperty('--left-font-family');
    if (leftFontSize !== 'auto') stage.style.setProperty('--left-font-size', leftFontSize);
    else stage.style.removeProperty('--left-font-size');
    stage.style.setProperty('--left-font-weight', leftBold ? '700' : '400');

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

  const apply = useCallback((vals) => {
    if (vals.syntaxTheme      !== undefined) { setSyntaxTheme(vals.syntaxTheme);           set(KEYS.syntaxTheme, vals.syntaxTheme); }
    if (vals.editorFontSize   !== undefined) { setEditorFontSize(vals.editorFontSize);     set(KEYS.editorFontSize, vals.editorFontSize); }
    if (vals.editorFontFamily !== undefined) { setEditorFontFamily(vals.editorFontFamily); set(KEYS.editorFontFamily, vals.editorFontFamily); }
    if (vals.editorBold       !== undefined) { setEditorBold(vals.editorBold);             set(KEYS.editorBold, vals.editorBold ? '1' : '0'); }
    if (vals.wsTheme          !== undefined) { setWsTheme(vals.wsTheme);                   set(KEYS.wsTheme, vals.wsTheme); }
    if (vals.glassOn          !== undefined) { setGlassOn(vals.glassOn);                   set(KEYS.glassOn, vals.glassOn ? '1' : '0'); }
    if (vals.paletteThemed    !== undefined) { setPaletteThemed(vals.paletteThemed);       set(KEYS.paletteThemed, vals.paletteThemed ? '1' : '0'); }
    if (vals.globalTheme      !== undefined) { setGlobalTheme(vals.globalTheme);           set(KEYS.globalTheme, vals.globalTheme ? '1' : '0'); }
    if (vals.leftFontFamily   !== undefined) { setLeftFontFamily(vals.leftFontFamily);     set(KEYS.leftFontFamily, vals.leftFontFamily); }
    if (vals.leftFontSize     !== undefined) { setLeftFontSize(vals.leftFontSize);         set(KEYS.leftFontSize, vals.leftFontSize); }
    if (vals.leftBold         !== undefined) { setLeftBold(vals.leftBold);                 set(KEYS.leftBold, vals.leftBold ? '1' : '0'); }
    if (vals.testsFontFamily  !== undefined) { setTestsFontFamily(vals.testsFontFamily);   set(KEYS.testsFontFamily, vals.testsFontFamily); }
    if (vals.testsFontSize    !== undefined) { setTestsFontSize(vals.testsFontSize);       set(KEYS.testsFontSize, vals.testsFontSize); }
    if (vals.testsBold        !== undefined) { setTestsBold(vals.testsBold);               set(KEYS.testsBold, vals.testsBold ? '1' : '0'); }
    if (vals.replFontFamily   !== undefined) { setReplFontFamily(vals.replFontFamily);     set(KEYS.replFontFamily, vals.replFontFamily); }
    if (vals.replFontSize     !== undefined) { setReplFontSize(vals.replFontSize);         set(KEYS.replFontSize, vals.replFontSize); }
  }, []);

  return {
    syntaxTheme, editorFontSize, editorFontFamily, editorBold,
    wsTheme, glassOn, paletteThemed, globalTheme,
    leftFontFamily, leftFontSize, leftBold,
    testsFontFamily, testsFontSize, testsBold,
    replFontFamily, replFontSize,
    paletteOpen, setPaletteOpen,
    apply,
  };
}

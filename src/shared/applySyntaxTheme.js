// src/shared/applySyntaxTheme.js
// Applies cv_syntax_theme CSS custom properties to documentElement.
// Replaces the vanilla assets/components/core/syntax-theme-vars.js
// for React-bundled pages.
//
// Usage: call applyStoredSyntaxTheme() once at bundle init,
// and optionally listen for 'storage' events for live cross-tab updates.

import { EDITOR_THEMES } from '../settings/utils/themes.js';

const CSS_MAP = {
  codeBg:    '--cv-code-bg',
  codeFg:    '--cv-code-fg',
  keyword:   '--cv-code-keyword',
  string:    '--cv-code-string',
  comment:   '--cv-code-comment',
  number:    '--cv-code-number',
  function:  '--cv-code-function',
  operator:  '--cv-code-operator',
  variable:  '--cv-code-variable',
  type:      '--cv-code-type',
};

export function applySyntaxTheme(key) {
  const theme = EDITOR_THEMES.find(t => t.key === key) || EDITOR_THEMES[0];
  if (!theme?.colors) return;
  const root = document.documentElement;
  const c = theme.colors;
  for (const [colorKey, cssVar] of Object.entries(CSS_MAP)) {
    const val = c[colorKey] || (colorKey === 'comment' ? 'rgba(150,160,180,0.70)' : c.codeFg);
    if (val) root.style.setProperty(cssVar, val);
  }
}

export function applyStoredSyntaxTheme() {
  try {
    const key = localStorage.getItem('cv_syntax_theme') || 'carbon-ink';
    applySyntaxTheme(key);
  } catch (_) {
    applySyntaxTheme('carbon-ink');
  }
}

export function bindSyntaxThemeStorageListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cv_syntax_theme' && e.newValue) {
      applySyntaxTheme(e.newValue);
    }
  });
}

// components/shared/CodePreview.jsx
// Live syntax preview pane. Renders PREVIEW_LINES with CSS color vars from theme.

import React, { useRef, useEffect } from 'react';
import { getTheme } from '../../utils/themes.js';
import { CODE_FONT_FAMILY_MAP } from '../../utils/prefs.js';
import { PREVIEW_LINES } from '../../utils/previewTokens.js';

const TYPE_CLASS = {
  kw:  'as-ep-kw',  fn:  'as-ep-fn',  str: 'as-ep-str', num: 'as-ep-num',
  cmt: 'as-ep-cmt', op:  'as-ep-op',  var: 'as-ep-var', cls: 'as-ep-cls', pun: 'as-ep-pun',
};

export function CodePreview({ themeKey, fontSize, fontFamily, filename = 'preview.py' }) {
  const containerRef = useRef(null);
  const theme = getTheme(themeKey);
  const c = theme.colors;

  const cssVars = {
    '--syn-keyword':  c.keyword,
    '--syn-function': c.function,
    '--syn-string':   c.string,
    '--syn-number':   c.number,
    '--syn-comment':  c.comment,
    '--syn-operator': c.operator,
    '--syn-variable': c.variable,
    '--syn-type':     c.type,
    '--syn-punct':    c.punct,
  };

  const resolvedFont = CODE_FONT_FAMILY_MAP[fontFamily] || CODE_FONT_FAMILY_MAP['system-mono'];

  return (
    <div
      className="as-editor-preview"
      ref={containerRef}
      aria-label="Editor theme preview"
      aria-live="polite"
      style={{
        background: c.codeBg,
        borderColor: c.panelBorder,
        ...cssVars,
      }}
    >
      <div className="as-ep-bar">
        <span className="as-ep-dot as-ep-red" />
        <span className="as-ep-dot as-ep-amber" />
        <span className="as-ep-dot as-ep-green" />
        <span className="as-ep-filename">{filename}</span>
      </div>
      <div className="as-ep-code">
        <pre>
          <code
            style={{
              color: c.codeFg,
              fontSize: `${fontSize || 13}px`,
              fontFamily: resolvedFont,
            }}
          >
            {PREVIEW_LINES.map((line, li) => (
              <React.Fragment key={li}>
                {line.map((tok, ti) =>
                  typeof tok === 'string'
                    ? tok
                    : <span key={ti} className={TYPE_CLASS[tok.t] || ''}>{tok.v}</span>
                )}
                {li < PREVIEW_LINES.length - 1 && '\n'}
              </React.Fragment>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ── FontSelect ────────────────────────────────────────────────────────────────

export function FontSelect({ label, hint, id, value, options, onChange }) {
  return (
    <div className="as-row">
      <div className="as-row-text">
        <div className="as-row-label">{label}</div>
        {hint && <div className="as-row-hint">{hint}</div>}
      </div>
      <div className="as-row-controls as-row-font-family">
        <select
          className="as-select"
          id={id}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// components/EditorSlot.jsx
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                    EDITOR INTEGRATION SLOT                              ║
// ║                                                                          ║
// ║  This component is a drop-in placeholder for a code editor.             ║
// ║  Replace the <textarea> below with your own editor tool.               ║
// ║                                                                          ║
// ║  YOUR REPLACEMENT MUST:                                                  ║
// ║  1. Accept the same props (see PropTypes comment below)                 ║
// ║  2. Forward a ref that exposes the same imperative API (see below)      ║
// ║  3. Keep the outer <div> wrapper with its className and data attributes ║
// ║                                                                          ║
// ║  IMPERATIVE REF API (required):                                         ║
// ║    getValue()         → string   current editor content                 ║
// ║    setValue(v:string) → void     replace all editor content             ║
// ║    focus()            → void     focus the editor                       ║
// ║    refresh()          → void     re-measure after layout change         ║
// ║                                                                          ║
// ║  PROPS:                                                                  ║
// ║    initialValue   string    code to show when editor first mounts       ║
// ║    readOnly       boolean   if true, editor should not be editable      ║
// ║    syntaxTheme    string    theme key e.g. 'obsidian-code' (optional)   ║
// ║    onChange       function  called with new string on every edit        ║
// ║    className      string    extra CSS class on the wrapper div          ║
// ║                                                                          ║
// ║  EVENTS DISPATCHED ON window:                                            ║
// ║    'cv:splitter-resize'  fired after the user drags a splitter          ║
// ║    → call refresh() or requestMeasure() on your editor in response      ║
// ║                                                                          ║
// ║  SYNTAX THEME:                                                           ║
// ║    The wrapper div carries data-syntax-theme="{syntaxTheme}" so your   ║
// ║    editor can read the user's theme preference from the DOM if needed.  ║
// ║    The value comes from the Settings palette → Syntax Highlighting.     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const EditorSlot = forwardRef(function EditorSlot(
  {
    initialValue = '',
    readOnly     = false,
    syntaxTheme  = 'obsidian-code',
    onChange,
    className    = '',
  },
  ref
) {
  const textareaRef = useRef(null);

  // ── Imperative ref API ─────────────────────────────────────────────────────
  // Replace this implementation when you replace the textarea with your editor.
  useImperativeHandle(ref, () => ({
    getValue:  ()  => textareaRef.current?.value ?? '',
    setValue:  (v) => { if (textareaRef.current) textareaRef.current.value = v; },
    focus:     ()  => textareaRef.current?.focus(),
    refresh:   ()  => { /* no-op for textarea; re-implement for your editor */ },
  }), []);

  // ── Set initial value on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current && initialValue) {
      textareaRef.current.value = initialValue;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for splitter resize ─────────────────────────────────────────────
  // Your editor should call its own requestMeasure() equivalent here.
  useEffect(() => {
    const onResize = () => { /* call ref.current.refresh() or similar */ };
    window.addEventListener('cv:splitter-resize', onResize);
    return () => window.removeEventListener('cv:splitter-resize', onResize);
  }, []);

  // ── Wrapper classes ────────────────────────────────────────────────────────
  // Keep `cm-shell` — existing CSS targets it for sizing and border styling.
  // Add `editor-slot` so you can target this component specifically in your CSS.
  const wrapperClass = [
    'cm-shell',
    'editor-slot',
    readOnly ? 'readonly' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    // ── Keep this wrapper div — the CSS grid depends on it ──────────────────
    <div
      className={wrapperClass}
      data-syntax-theme={syntaxTheme}
      data-readonly={readOnly || undefined}
    >
      {/* ════════════════════════════════════════════════════════════════════
          INSERT YOUR EDITOR COMPONENT HERE
          Replace the <textarea> below with your own tool.
          Your component must fill this div completely (width: 100%, height: 100%).
          ════════════════════════════════════════════════════════════════════ */}
      <textarea
        ref={textareaRef}
        className="editor-slot-textarea"
        readOnly={readOnly}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label={readOnly ? 'Code (read-only)' : 'Code editor'}
        aria-multiline="true"
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={{
          width:       '100%',
          height:      '100%',
          resize:      'none',
          border:      'none',
          outline:     'none',
          background:  'transparent',
          color:       'inherit',
          fontFamily:  'var(--editor-font-family, ui-monospace, monospace)',
          fontSize:    'var(--editor-font-size, 14px)',
          fontWeight:  'var(--editor-font-weight, 400)',
          lineHeight:  '1.6',
          padding:     '12px',
          boxSizing:   'border-box',
          tabSize:     4,
        }}
      />
      {/* ════════════════════════════════════════════════════════════════════ */}
    </div>
  );
});

export default EditorSlot;

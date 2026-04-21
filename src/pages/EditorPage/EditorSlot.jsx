// components/EditorSlot.jsx
// Ace Editor-backed code editor. Keeps the same imperative ref API
// (getValue / setValue / focus / refresh) that LeftPane / RightPane / ReplPane
// already call, so consumers don't need to change.
//
// Theme follows the app-wide theme set on <html data-theme="...">. The app
// dispatches 'cv:theme-change' whenever the user switches themes in Settings;
// this component listens and remaps to the matching Ace theme.

import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/ext-language_tools';

const LIGHT_THEMES = new Set(['frost', 'parchment']);

function resolveAceTheme(appTheme) {
  if (appTheme === 'parchment') return 'textmate';
  if (LIGHT_THEMES.has(appTheme)) return 'tomorrow';
  return 'tomorrow_night';
}

function currentAppTheme() {
  try {
    return document.documentElement.getAttribute('data-theme') || 'obsidian';
  } catch (_) {
    return 'obsidian';
  }
}

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
  const aceRef = useRef(null);
  const wrapperRef = useRef(null);
  const [appTheme, setAppTheme] = useState(currentAppTheme);
  const [pasteBlocked, setPasteBlocked] = useState(false);

  // Imperative API — matches the old textarea contract so callers keep working
  useImperativeHandle(ref, () => ({
    getValue: () => aceRef.current?.editor?.getValue() ?? '',
    setValue: (v) => {
      const ed = aceRef.current?.editor;
      if (!ed) return;
      // cursor to end, single undo entry, no selection
      ed.setValue(v ?? '', 1);
      ed.clearSelection();
    },
    focus: () => aceRef.current?.editor?.focus(),
    refresh: () => aceRef.current?.editor?.resize(true),
  }), []);

  // Seed initial value once on mount (Ace's value prop would re-apply on every
  // render otherwise, which fights user typing).
  useEffect(() => {
    const ed = aceRef.current?.editor;
    if (!ed || !initialValue) return;
    if (ed.getValue() === '') {
      ed.setValue(initialValue, 1);
      ed.clearSelection();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // React to splitter drags — Ace needs resize() after the container size changes
  useEffect(() => {
    const onResize = () => aceRef.current?.editor?.resize(true);
    window.addEventListener('cv:splitter-resize', onResize);
    return () => window.removeEventListener('cv:splitter-resize', onResize);
  }, []);

  // Track app theme changes. Settings fires `cv:theme-change` on change.
  useEffect(() => {
    function sync() { setAppTheme(currentAppTheme()); }
    document.addEventListener('cv:theme-change', sync);
    // MutationObserver as a fallback in case any code flips data-theme
    // without firing the custom event.
    let mo;
    try {
      mo = new MutationObserver(sync);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch (_) {}
    return () => {
      document.removeEventListener('cv:theme-change', sync);
      if (mo) mo.disconnect();
    };
  }, []);

  // Paste blocking for editable editors. Candidate-solution text must be typed,
  // not pasted — matches the existing behaviour the team asked for.
  const handleLoad = useCallback((editor) => {
    if (readOnly) return;
    editor.commands.removeCommand('paste');
    const container = editor.container;
    const onPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setPasteBlocked(true);
      clearTimeout(onPaste._t);
      onPaste._t = setTimeout(() => setPasteBlocked(false), 2000);
    };
    container.addEventListener('paste', onPaste, true);
    // textarea inside Ace handles the actual keyboard paste event
    const textInput = container.querySelector('textarea');
    if (textInput) textInput.addEventListener('paste', onPaste, true);
  }, [readOnly]);

  const wrapperClass = [
    'cm-shell',
    'editor-slot',
    readOnly ? 'readonly' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapperRef}
      className={wrapperClass}
      data-syntax-theme={syntaxTheme}
      data-readonly={readOnly || undefined}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {pasteBlocked && (
        <div className="cv-paste-block" role="status" aria-live="polite">
          🚫 Pasting is disabled. Please type the code manually.
        </div>
      )}
      <AceEditor
        ref={aceRef}
        mode="python"
        theme={resolveAceTheme(appTheme)}
        name={`editor-${readOnly ? 'ro' : 'rw'}-${Math.random().toString(36).slice(2, 7)}`}
        width="100%"
        height="100%"
        fontSize={14}
        readOnly={readOnly}
        wrapEnabled
        showGutter
        showPrintMargin={false}
        highlightActiveLine={!readOnly}
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          useWorker: false,
          wrap: true,
          tabSize: 4,
          showLineNumbers: true,
          fixedWidthGutter: true,
        }}
        // onLoad={handleLoad}
        onChange={onChange ? (val) => onChange(val) : undefined}
        style={{ background: 'transparent' }}
      />
    </div>
  );
});

export default EditorSlot;

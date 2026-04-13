// components/ReplPane.jsx
// REPL input (EditorSlot) + output (plain pre).
// Dispatches cvd:repl-run custom event for the external code runner to intercept.
import React, { useRef, useState, useCallback, useEffect } from 'react';
import EditorSlot from './EditorSlot.jsx';

const HISTORY_KEY = 'cv_repl_history';
const HISTORY_MAX = 30;

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch (_) { return []; }
}

function writeHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-HISTORY_MAX))); } catch (_) {}
}

export default function ReplPane({ syntaxTheme, candidateRef, onReplSplitDrag }) {
  const replEditorRef = useRef(null);
  const [output, setOutput]       = useState('');
  const historyRef                = useRef(readHistory());
  const historyIdxRef             = useRef(historyRef.current.length);

  function appendOutput(text) {
    setOutput(prev => prev ? `${prev}\n${text}` : text);
  }

  const run = useCallback(() => {
    const code = replEditorRef.current?.getValue()?.trim() ?? '';
    if (!code) return;

    // History (de-dupe consecutive)
    const h = historyRef.current;
    if (!h.length || h[h.length - 1] !== code) {
      h.push(code);
      if (h.length > HISTORY_MAX) h.splice(0, h.length - HISTORY_MAX);
      writeHistory(h);
    }
    historyIdxRef.current = h.length;

    appendOutput(`>>> ${code.replace(/\n/g, '\n... ')}`);

    // Dispatch to external runner
    try {
      window.dispatchEvent(new CustomEvent('cvd:repl-run', { detail: { code } }));
    } catch (_) {}
  }, []);

  const clearInput = useCallback(() => {
    replEditorRef.current?.setValue('');
    replEditorRef.current?.focus();
    historyIdxRef.current = historyRef.current.length;
  }, []);

  const clearOutput = useCallback(() => setOutput(''), []);

  const copyOutput = useCallback(async () => {
    try { await navigator.clipboard.writeText(output); } catch (_) {}
  }, [output]);

  const toEditor = useCallback(() => {
    const code = replEditorRef.current?.getValue()?.trim() ?? '';
    if (!code || !candidateRef?.current) return;
    const current = candidateRef.current.getValue();
    candidateRef.current.setValue(`${current}\n\n${code}\n`);
    candidateRef.current.focus();
  }, [candidateRef]);

  // Keyboard shortcuts on the CM6 REPL (handled as native key events via a keymap extension)
  // History recall — exposed as a method so the keymap can call it
  const recallHistory = useCallback((delta) => {
    const h = readHistory();
    historyRef.current = h;
    if (!h.length) return;
    historyIdxRef.current = Math.max(0, Math.min(h.length, historyIdxRef.current + delta));
    const val = historyIdxRef.current === h.length ? '' : h[historyIdxRef.current];
    replEditorRef.current?.setValue(val);
  }, []);

  // Listen for output pushed back from the external runner
  useEffect(() => {
    function onOutput(e) {
      if (e.detail?.output !== undefined) appendOutput(String(e.detail.output));
    }
    window.addEventListener('cvd:repl-output', onOutput);
    return () => window.removeEventListener('cvd:repl-output', onOutput);
  }, []);

  return (
    <div className="ws-bottom" id="wsBottom" aria-label="REPL">
      {/* Input pane */}
      <section className="pane glow-follow" id="paneReplIn" aria-label="REPL input">
        <div className="pane-head simple">
          <div className="pane-head-title">REPL Input</div>
          <div className="pane-head-actions">
            <button className="mini-btn" type="button" title="Run (Ctrl+Enter)" onClick={run}>
              Run
            </button>
            <button className="mini-btn" type="button" title="Append input to Your Code" onClick={toEditor}>
              To Editor
            </button>
            <button className="mini-btn" type="button" title="Clear input" onClick={clearInput}>
              Clear
            </button>
          </div>
        </div>
        <div className="pane-body">
          <EditorSlot
            ref={replEditorRef}
            initialValue=""
            syntaxTheme={syntaxTheme}
            readOnly={false}
            className="repl-editor"
          />
        </div>
      </section>

      {/* Vertical splitter between input and output */}
      <div
        className="splitter splitter-v"
        id="splitReplV"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize REPL input and output"
        tabIndex={0}
        onMouseDown={onReplSplitDrag}
      />

      {/* Output pane */}
      <section className="pane glow-follow" id="paneReplOut" aria-label="REPL output">
        <div className="pane-head simple">
          <div className="pane-head-title">REPL Output</div>
          <div className="pane-head-actions">
            <button className="mini-btn" type="button" title="Copy output" onClick={copyOutput}>
              Copy
            </button>
            <button className="mini-btn" type="button" title="Clear output" onClick={clearOutput}>
              Clear
            </button>
          </div>
        </div>
        <div className="pane-body">
          <pre className="repl-output-pre">
            <code id="replOutputCode">{output}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}

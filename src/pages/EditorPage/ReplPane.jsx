// components/ReplPane.jsx
// REPL input (EditorSlot) + colored typed-history output, executed via Pyodide
// loaded from the CDN. Pulls "My Code" from candidateRef so user-defined symbols
// are available to the REPL.
import React, { useRef, useState, useCallback, useEffect } from 'react';
import ReplEditor from './ReplEditor.jsx';

const HISTORY_KEY = 'cv_repl_history';
const HISTORY_MAX = 30;

const PYODIDE_VERSION = 'v0.23.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

const HISTORY_ITEM_STYLES = {
  input:  { color: '#ffd700', fontWeight: 'bold' },
  output: { color: '#90ee90' },
  error:  { color: '#ff6b6b' },
};

let pyodideLoadPromise = null;
function loadPyodideOnce() {
  if (pyodideLoadPromise) return pyodideLoadPromise;
  pyodideLoadPromise = new Promise((resolve, reject) => {
    const init = () => {
      if (!window.loadPyodide) {
        reject(new Error('window.loadPyodide is unavailable after script load'));
        return;
      }
      window.loadPyodide({ indexURL: PYODIDE_INDEX_URL }).then(resolve, reject);
    };
    if (window.loadPyodide) { init(); return; }
    const existing = document.querySelector('script[data-cv-pyodide]');
    if (existing) {
      existing.addEventListener('load', init);
      existing.addEventListener('error', () => reject(new Error('Failed to load Pyodide script')));
      return;
    }
    const script = document.createElement('script');
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.dataset.cvPyodide = '1';
    script.onload = init;
    script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.body.appendChild(script);
  });
  return pyodideLoadPromise;
}

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

export default function ReplPane({
  syntaxTheme,
  replFontSize,
  replFontFamily,
  candidateRef,
  onReplSplitDrag,
}) {
  const replEditorRef = useRef(null);
  const outputRef     = useRef(null);
  const [history, setHistory]     = useState([]);
  const [pyodide, setPyodide]     = useState(null);
  const [pyodideStatus, setPyodideStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [running, setRunning]     = useState(false);
  const cmdHistoryRef             = useRef(readHistory());
  const historyIdxRef             = useRef(cmdHistoryRef.current.length);

  // Auto-scroll on new entries
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const pushEntry = useCallback((type, content) => {
    setHistory(prev => [...prev, { type, content: String(content) }]);
  }, []);

  // Load Pyodide once
  useEffect(() => {
    let alive = true;
    loadPyodideOnce()
      .then(inst => {
        if (!alive) return;
        setPyodide(inst);
        setPyodideStatus('ready');
      })
      .catch(err => {
        if (!alive) return;
        setPyodideStatus('error');
        pushEntry('error', `Failed to load Pyodide: ${err?.message || String(err)}`);
      });
    return () => { alive = false; };
  }, [pushEntry]);

  const run = useCallback(async () => {
    const code = replEditorRef.current?.getValue()?.trim() ?? '';
    if (!code || running) return;

    // Persisted command history (de-dupe consecutive)
    const h = cmdHistoryRef.current;
    if (!h.length || h[h.length - 1] !== code) {
      h.push(code);
      if (h.length > HISTORY_MAX) h.splice(0, h.length - HISTORY_MAX);
      writeHistory(h);
    }
    historyIdxRef.current = h.length;

    pushEntry('input', code);

    if (!pyodide) {
      pushEntry('error', 'Pyodide is not loaded yet. Please wait...');
      return;
    }

    setRunning(true);
    try {
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);

      const userCode = candidateRef?.current?.getValue?.() || '';
      if (userCode.trim()) {
        try { await pyodide.runPythonAsync(userCode); }
        catch (e) { console.warn('User code load error', e); }
      }

      let result;
      try {
        result = await pyodide.runPythonAsync(code);
      } catch {
        await pyodide.runPythonAsync(
          `exec("""${code.replace(/"/g, '\\"')}""")`
        );
      }

      const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

      if (stderr && String(stderr).trim()) {
        pushEntry('error', stderr);
      } else if (stdout && String(stdout).trim()) {
        pushEntry('output', stdout);
      } else if (result !== undefined && result !== null) {
        pushEntry('output', String(result));
      }
    } catch (err) {
      pushEntry('error', err?.message || String(err));
    } finally {
      setRunning(false);
    }
  }, [pyodide, candidateRef, running, pushEntry]);

  const clearInput = useCallback(() => {
    replEditorRef.current?.setValue('');
    replEditorRef.current?.focus();
    historyIdxRef.current = cmdHistoryRef.current.length;
  }, []);

  const clearOutput = useCallback(() => setHistory([]), []);

  const copyOutput = useCallback(async () => {
    const text = history
      .map(it => (it.type === 'input' ? `>>> ${it.content}` : it.content))
      .join('\n');
    try { await navigator.clipboard.writeText(text); } catch (_) {}
  }, [history]);

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
    cmdHistoryRef.current = h;
    if (!h.length) return;
    historyIdxRef.current = Math.max(0, Math.min(h.length, historyIdxRef.current + delta));
    const val = historyIdxRef.current === h.length ? '' : h[historyIdxRef.current];
    replEditorRef.current?.setValue(val);
  }, []);

  const renderHistoryItem = (item, i) => (
    <div
      key={i}
      style={{ marginBottom: 8, whiteSpace: 'pre-wrap', padding: '0 10px' }}
    >
      {item.type === 'input' && (
        <span style={{ color: '#4a9eff' }}>{'>>> '}</span>
      )}
      <span style={HISTORY_ITEM_STYLES[item.type]}>{item.content}</span>
    </div>
  );

  return (
    <div className="ws-bottom" id="wsBottom" aria-label="REPL">
      {/* Input pane */}
      <section className="pane glow-follow" id="paneReplIn" aria-label="REPL input">
        <div className="pane-head simple">
          <div className="pane-head-title">REPL Input</div>
          <div className="pane-head-actions">
            <button
              className="mini-btn"
              type="button"
              title={
                pyodideStatus === 'loading' ? 'Loading Pyodide…' :
                pyodideStatus === 'error'   ? 'Pyodide failed to load' :
                'Run (Ctrl+Enter)'
              }
              onClick={run}
              disabled={running || pyodideStatus !== 'ready'}
            >
              {running ? 'Running…' : pyodideStatus === 'loading' ? 'Loading…' : 'Run'}
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
          <ReplEditor
            ref={replEditorRef}
            initialValue=""
            syntaxTheme={syntaxTheme}
            fontSize={replFontSize}
            fontFamily={replFontFamily}
            readOnly={false}
            className="editor repl"
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
          <div
            ref={outputRef}
            id="replOutputCode"
            className="repl-output"
            style={{ padding: '8px 0' }}
          >
            {history.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic', padding: 10 }}>
                {pyodideStatus === 'loading'
                  ? 'Loading Pyodide…'
                  : pyodideStatus === 'error'
                  ? 'Pyodide failed to load. Check your network connection.'
                  : 'Output will appear here'}
              </div>
            ) : (
              history.map(renderHistoryItem)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

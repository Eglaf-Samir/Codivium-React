// components/WorkspaceControls.jsx
// Toolbar: Default / Code / Read focus mode buttons + REPL toggle.
import React from 'react';

const DEFAULT_ICO = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4h7v7H4V4Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M13 4h7v7h-7V4Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 13h7v7H4v-7Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M13 13h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const CODE_ICO = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 18L3 12l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const READ_ICO = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5.5C4 4.12 5.12 3 6.5 3H20v16H6.5C5.12 19 4 20.12 4 21.5V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M8 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 11h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const REPL_ICO = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M7 10l3 2-3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export default function WorkspaceControls({ focusMode, setFocusMode, replVisible, setReplVisible, onSettingsOpen }) {
  return (
    <div className="ws-controls" id="wsControls" aria-label="Workspace controls">
      <button
        className={`wsc-btn${focusMode === 'default' ? ' active' : ''}`}
        data-focus="default"
        id="focusDefaultBtn"
        type="button"
        title="Default layout"
        onClick={() => setFocusMode('default')}
      >
        <span className="wsc-ico">{DEFAULT_ICO}</span>
        <span className="wsc-lbl">Default</span>
      </button>

      <button
        className={`wsc-btn${focusMode === 'editor' ? ' active' : ''}`}
        data-focus="editor"
        id="focusEditorBtn"
        type="button"
        title="Code focus"
        onClick={() => setFocusMode('editor')}
      >
        <span className="wsc-ico">{CODE_ICO}</span>
        <span className="wsc-lbl">Code</span>
      </button>

      <button
        className={`wsc-btn${focusMode === 'instructions' ? ' active' : ''}`}
        data-focus="instructions"
        id="focusReadBtn"
        type="button"
        title="Read focus"
        onClick={() => setFocusMode('instructions')}
      >
        <span className="wsc-ico">{READ_ICO}</span>
        <span className="wsc-lbl">Read</span>
      </button>

      <button
        className={`wsc-btn${replVisible ? ' active' : ''}`}
        id="replToggleBtn"
        type="button"
        title="Toggle REPL panel"
        aria-label="Toggle REPL panel"
        aria-expanded={replVisible}
        aria-controls="wsBottom"
        onClick={() => setReplVisible(v => !v)}
      >
        <span className="wsc-ico">{REPL_ICO}</span>
        <span className="wsc-lbl">REPL</span>
      </button>
    </div>
  );
}

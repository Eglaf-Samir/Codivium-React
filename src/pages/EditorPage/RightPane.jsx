// components/RightPane.jsx
// Right pane: Candidate Solution (CM6 editor) + Suggested Solution (CM6 read-only).
// Owns the submit button and test results panel.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import EditorSlot from './EditorSlot.jsx';

const LOCK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function SolutionLockTooltip({ anchorRef, why, onForceUnlock, onClose }) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  React.useEffect(() => {
    if (!anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  }, [anchorRef]);

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="cv-lock-tooltip"
      role="tooltip"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
    >
      <p className="cv-lock-why">
        {why || 'The suggested solution is locked temporarily to encourage problem-solving first.'}
      </p>
      <button className="cv-lock-force-btn" type="button" onClick={onForceUnlock}>
        Unlock anyway
      </button>
    </div>
  );
}


function TestResultItem({ result, index }) {
  const pass = result.status === 'pass';
  return (
    <li className={`cv-test-item ${pass ? 'cv-test-pass' : 'cv-test-fail'}`}>
      <div className="cv-test-label">
        <span className="cv-test-index">{index + 1}</span>
        <code className="cv-test-name">{result.name ? `${result.name}()` : `Test ${index + 1}`}</code>
        <span className={`cv-test-badge ${pass ? 'cv-badge-pass' : 'cv-badge-fail'}`}>
          {pass ? 'PASS' : 'FAIL'}
        </span>
      </div>
      {!pass && (
        <>
          <div className="cv-test-row"><span className="cv-tr-key">Input:</span><code>{result.input}</code></div>
          <div className="cv-test-row"><span className="cv-tr-key">Expected:</span><code>{result.expected}</code></div>
          <div className="cv-test-row"><span className="cv-tr-key">Got:</span><code className="cv-got">{result.got}</code></div>
        </>
      )}
    </li>
  );
}

export default function RightPane({
  exercise, locks, syntaxTheme,
  candidateRef,    // forwarded ref to candidate editor
  onSubmit, submitting, submitStatus, attemptCount, testResults,
}) {
  const [activeTab, setActiveTab] = useState('candidate');
  const solutionRef       = useRef(null);
  const solutionTabRef    = useRef(null);
  const [showSolTooltip, setShowSolTooltip] = useState(false);

  const solutionLocked = locks.isLocked('solution');

  // Populate editors when exercise loads
  useEffect(() => {
    if (!exercise) return;
    if (exercise.codeScaffold && candidateRef?.current) {
      candidateRef.current.setValue(exercise.codeScaffold);
    }
    if (exercise.suggestedSolution && solutionRef.current) {
      solutionRef.current.setValue(exercise.suggestedSolution);
    }
  }, [exercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSolutionTabClick = useCallback(() => {
    if (solutionLocked) {
      setShowSolTooltip(prev => !prev);
      return;
    }
    setShowSolTooltip(false);
    setActiveTab('solution');
  }, [solutionLocked]);

  const handleSolForceUnlock = useCallback(() => {
    locks.unlock('solution');
    setShowSolTooltip(false);
    setActiveTab('solution');
  }, [locks]);

  return (
    <section className="pane glow-follow" id="paneRight" aria-label="Code editor">
      <div className="pane-head simple" aria-label="Editor header">
        <div className="pane-tabs" role="tablist" aria-label="Editor tabs">
          <button
            id="tab-right-candidate"
            role="tab"
            type="button"
            className={`tab-btn${activeTab === 'candidate' ? ' active' : ''}`}
            aria-selected={activeTab === 'candidate'}
            aria-controls="panel-right-candidate"
            tabIndex={activeTab === 'candidate' ? 0 : -1}
            onClick={() => setActiveTab('candidate')}
          >
            Candidate Solution
          </button>
          <button
            ref={solutionTabRef}
            id="tab-right-solution"
            role="tab"
            type="button"
            className={`tab-btn${activeTab === 'solution' ? ' active' : ''}`}
            aria-selected={activeTab === 'solution'}
            aria-controls="panel-right-solution"
            tabIndex={activeTab === 'solution' ? 0 : -1}
            onClick={handleSolutionTabClick}
            data-lock-key="solution"
            data-locked={solutionLocked ? 'true' : undefined}
          >
            Suggested Solution
            {solutionLocked && (
              <span className="cv-tab-lock" aria-label="Locked">{LOCK_SVG}</span>
            )}
          </button>
          {showSolTooltip && solutionLocked && createPortal(
            <SolutionLockTooltip
              anchorRef={solutionTabRef}
              why={locks.WHY?.solution}
              onForceUnlock={handleSolForceUnlock}
              onClose={() => setShowSolTooltip(false)}
            />,
            document.body
          )}
        </div>

        <div className="submit-bar">
          <button
            className="submit-btn"
            id="submitSolution"
            type="button"
            disabled={submitting || !exercise}
            aria-busy={submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Running tests…' : 'Submit'}
          </button>
          {attemptCount > 0 && (
            <span className="cv-attempt-count" id="attemptCount" aria-live="polite">
              Attempt {attemptCount}
            </span>
          )}
        </div>

        {submitStatus && (
          <div
            className={`cv-editor-status cv-status-${submitStatus.type}`}
            id="editorStatus"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {submitStatus.message}
          </div>
        )}
      </div>

      <div className="pane-body">
        {/* Candidate Solution panel */}
        <div
          id="panel-right-candidate"
          role="tabpanel"
          aria-labelledby="tab-right-candidate"
          className={`tab-panel${activeTab === 'candidate' ? ' active' : ''}`}
          data-pane="right" data-panel="candidate"
          hidden={activeTab !== 'candidate' || undefined}
        >
          <h2 className="pane-title sr-only">Candidate Solution</h2>
          <EditorSlot
            ref={candidateRef}
            initialValue={exercise?.codeScaffold ?? ''}
            syntaxTheme={syntaxTheme}
            readOnly={false}
          />

          {/* Test results */}
          {testResults && (
            <div className="cv-test-results" id="testResults" aria-live="polite" aria-atomic="false">
              <p className={`cv-test-summary ${testResults.accepted ? 'cv-test-pass' : 'cv-test-fail'}`} id="testSummary">
                {testResults.testsPassed} / {testResults.testsTotal} test{testResults.testsTotal !== 1 ? 's' : ''} passed
              </p>
              <ul className="cv-test-list" id="testCaseList">
                {testResults.testResults?.map((r, i) => (
                  <TestResultItem key={r.name ?? i} result={r} index={i} />
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Suggested Solution panel */}
        <div
          id="panel-right-solution"
          role="tabpanel"
          aria-labelledby="tab-right-solution"
          className={`tab-panel${activeTab === 'solution' ? ' active' : ''}`}
          data-pane="right" data-panel="solution"
          hidden={activeTab !== 'solution' || undefined}
        >
          <h2 className="pane-title sr-only">Suggested Solution</h2>
          <p className="pane-lead">This is read-only.</p>
          <EditorSlot
            ref={solutionRef}
            initialValue={exercise?.suggestedSolution ?? ''}
            syntaxTheme={syntaxTheme}
            readOnly
          />
        </div>
      </div>
    </section>
  );
}

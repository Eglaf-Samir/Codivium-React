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

function unlockMsg(cfg, key, elapsedSeconds, submissionCount) {
  const c = cfg && cfg[key];
  if (!c) return null;
  const secsLeft = Math.max(0, c.minutes * 60 - elapsedSeconds);
  const attLeft  = Math.max(0, c.attempts - submissionCount);
  const parts = [];
  if (secsLeft > 0) {
    const m = Math.floor(secsLeft / 60);
    const s = secsLeft % 60;
    parts.push(m > 0 ? `${m}m ${s}s` : `${s}s`);
  }
  if (attLeft > 0) parts.push(`${attLeft} submission${attLeft !== 1 ? 's' : ''}`);
  if (parts.length === 0) return 'Unlocking shortly…';
  return `Unlocks in: ${parts.join(' or ')}`;
}

function SolutionLockTooltip({ anchorRef, why, onForceUnlock, onClose, locks, elapsedSeconds }) {
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

  const whenMsg = locks
    ? unlockMsg(locks.cfg, 'solution', elapsedSeconds || 0, locks.submissionCount || 0)
    : null;

  return (
    <div
      className="cv-lock-tooltip"
      role="tooltip"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
    >
      <button className="cv-lt-close" type="button" aria-label="Close" onClick={onClose}>&#x2715;</button>
      <div className="cv-lt-title">Locked</div>
      <p className="cv-lt-why">
        {why || 'The suggested solution is locked temporarily to encourage problem-solving first.'}
      </p>
      {whenMsg && <div className="cv-lt-when">{whenMsg}</div>}
      <button className="cv-lt-unlock" type="button" onClick={onForceUnlock}>
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
          {result.input && (
            <div className="cv-test-row"><span className="cv-tr-key">Unit Test Description:</span><code>{result.input}</code></div>
          )}
          {/* Show Expected/Got only when the harness produced a real diff;
              fall back to the error message otherwise so the user sees
              something actionable instead of an empty/<unknown> row. */}
          {result.expected || result.got ? (
            <>
              <div className="cv-test-row"><span className="cv-tr-key">Expected:</span><code>{result.expected || '—'}</code></div>
              <div className="cv-test-row"><span className="cv-tr-key">Got:</span><code className="cv-got">{result.got || '—'}</code></div>
            </>
          ) : (
            <div className="cv-test-row"><span className="cv-tr-key">Error:</span><code className="cv-got">{result.error || 'Test failed without a diagnostic message.'}</code></div>
          )}
        </>
      )}
    </li>
  );
}

export default function RightPane({
  exercise, locks, syntaxTheme,
  editorFontSize, editorFontFamily, editorBold,
  candidateRef,    // forwarded ref to candidate editor
  onCandidateChange, // fires on every keystroke — used to keep a buffer of the latest code
  onSubmit, submitting, submitStatus, attemptCount, testResults,
  elapsedSeconds,
}) {
  const [activeTab, setActiveTab] = useState('candidate');
  const solutionRef       = useRef(null);
  const solutionTabRef    = useRef(null);
  const [showSolTooltip, setShowSolTooltip] = useState(false);

  const solutionLocked = locks.isLocked('solution');

  // Populate the read-only Suggested Solution when exercise loads.
  // Candidate editor seeding is owned by EditorPage so it can pick between
  // the scaffold and a resumed useroldcode without racing with this effect.
  useEffect(() => {
    if (!exercise) return;
    if (exercise.suggestedSolution && solutionRef.current) {
      solutionRef.current.setValue(exercise.suggestedSolution);
    }
  }, [exercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When a new test run completes, surface the Result tab automatically so the
  // user sees output. When a new submission starts (testResults cleared) while
  // the Result tab is active, fall back to Candidate Solution so the tab can
  // disappear cleanly.
  useEffect(() => {
    if (testResults) setActiveTab('result');
    else setActiveTab(prev => (prev === 'result' ? 'candidate' : prev));
  }, [testResults]);

  // Ace doesn't paint correctly while its container has `hidden`/display:none.
  // After a tab switch makes an editor visible, force a reflow so the latest
  // font / theme / value lands on screen instead of waiting for the next user
  // resize. Both editors receive the same editor settings, so this keeps
  // Suggested Solution visually in sync with Candidate Solution.
  useEffect(() => {
    const target =
      activeTab === 'candidate' ? candidateRef?.current :
      activeTab === 'solution'  ? solutionRef?.current  : null;
    if (!target?.refresh) return;
    // Defer one frame so the `hidden` attribute is removed before Ace measures.
    const id = requestAnimationFrame(() => target.refresh());
    return () => cancelAnimationFrame(id);
  }, [activeTab, candidateRef, editorFontSize, editorFontFamily, editorBold, syntaxTheme]);

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
          {testResults && (
            <button
              id="tab-right-result"
              role="tab"
              type="button"
              className={`tab-btn${activeTab === 'result' ? ' active' : ''}`}
              aria-selected={activeTab === 'result'}
              aria-controls="panel-right-result"
              tabIndex={activeTab === 'result' ? 0 : -1}
              onClick={() => setActiveTab('result')}
            >
              Result
              <span
                className={`cv-tab-badge ${testResults.accepted ? 'cv-badge-pass' : 'cv-badge-fail'}`}
                aria-label={testResults.accepted ? 'All tests passed' : 'Some tests failed'}
              >
                {testResults.testsPassed}/{testResults.testsTotal}
              </span>
            </button>
          )}
          {showSolTooltip && solutionLocked && createPortal(
            <SolutionLockTooltip
              anchorRef={solutionTabRef}
              why={locks.WHY?.solution}
              locks={locks}
              elapsedSeconds={elapsedSeconds}
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
            fontSize={editorFontSize}
            fontFamily={editorFontFamily}
            bold={editorBold}
            readOnly={false}
            onChange={onCandidateChange}
          />
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
            fontSize={editorFontSize}
            fontFamily={editorFontFamily}
            bold={editorBold}
            readOnly
          />
        </div>

        {/* Result panel — only rendered while results exist */}
        {testResults && (
          <div
            id="panel-right-result"
            role="tabpanel"
            aria-labelledby="tab-right-result"
            className={`tab-panel${activeTab === 'result' ? ' active' : ''}`}
            data-pane="right" data-panel="result"
            hidden={activeTab !== 'result' || undefined}
          >
            <h2 className="pane-title sr-only">Result</h2>
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
          </div>
        )}
      </div>
    </section>
  );
}

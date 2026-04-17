// EditorPage.jsx — Root component for the Codivium exercise workspace.
import React, { useState, useRef, useCallback, useEffect } from 'react';

import { useTimer }    from './hooks/useTimer.js';
import { useLocks }    from './hooks/useLocks.js';
import { useExercise } from './hooks/useExercise.js';
import { useSplitters } from './hooks/useSplitter.js';
import { useSettings } from './hooks/useSettings.js';

import Timer              from './components/Timer.jsx';
import WorkspaceControls  from './components/WorkspaceControls.jsx';
import LeftPane           from './components/LeftPane.jsx';
import RightPane          from './components/RightPane.jsx';
import ReplPane           from './components/ReplPane.jsx';
import SettingsPalette    from './components/SettingsPalette.jsx';
import FeedbackModal     from './components/FeedbackModal.jsx';
import HelpPanel         from './components/HelpPanel.jsx';
import { useGlowFollow } from '../shared/useGlowFollow.js';
import { getToken, apiUrl} from '../shared/fetch.js';

export default function EditorPage() {
  useGlowFollow();
  const stageRef     = useRef(null);
  const workspaceRef = useRef(null);
  const candidateRef   = useRef(null);   // imperative ref into EditorSlot (candidate)
  const feedbackRef    = useRef(null);   // imperative ref into FeedbackModal

  // ── Attempt-first note ─────────────────────────────────────────────────────
  const [attemptNoteSeen, setAttemptNoteSeen] = React.useState(() => {
    try { return localStorage.getItem('cv_attempt_note_seen') === '1'; } catch (_) { return false; }
  });
  const handleDismissNote = React.useCallback(() => {
    try { localStorage.setItem('cv_attempt_note_seen', '1'); } catch (_) {}
    setAttemptNoteSeen(true);
  }, []);

  // ── Core hooks ─────────────────────────────────────────────────────────────
  const timer    = useTimer();
  const settings = useSettings(stageRef);
  const { exercise, loading, error, reload } = useExercise();

  // Locks depend on elapsed seconds from the timer
  const locks = useLocks(timer.elapsedSeconds);

  // Splitters (drag-to-resize): mutate CSS vars directly on workspaceRef
  const { onVerticalSplitDrag, onHorizontalSplitDrag, onReplSplitDrag } =
    useSplitters(workspaceRef);

  // ── Layout state ───────────────────────────────────────────────────────────
  const [focusMode,   setFocusMode]   = useState('default');
  const [replVisible, setReplVisible] = useState(true);

  // ── Remove loading placeholder on mount ──────────────────────────────────
  useEffect(() => {
    const placeholder = document.getElementById('editor-react-root-loading');
    if (placeholder) placeholder.remove();
  }, []);

  // ── Hash-link prevention + tooltip polyfill ──────────────────────────────
  // Absorbs global.js hash-link and data-tip responsibilities for the editor page.
  useEffect(() => {
    function preventHash(e) {
      const a = e.target.closest && e.target.closest('a[href="#"]');
      if (a) e.preventDefault();
    }
    document.addEventListener('click', preventHash);
    // Copy data-tip → title on any .info-mini elements React renders
    document.querySelectorAll('.info-mini[data-tip]').forEach(btn => {
      if (!btn.getAttribute('title')) btn.setAttribute('title', btn.getAttribute('data-tip') || '');
    });
    return () => document.removeEventListener('click', preventHash);
  }, []);

  // Apply focus-mode body classes (CSS drives the layout from these)
  useEffect(() => {
    document.body.classList.toggle('focus-editor',       focusMode === 'editor');
    document.body.classList.toggle('focus-instructions', focusMode === 'instructions');
    document.body.classList.toggle('repl-collapsed',     !replVisible);
    return () => {
      document.body.classList.remove('focus-editor', 'focus-instructions', 'repl-collapsed');
    };
  }, [focusMode, replVisible]);

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting,   setSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);   // { type, message }
  const [testResults,  setTestResults]  = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const sessionIdRef   = useRef(null);
  const sessionStartRef= useRef(Date.now());

  function createSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function elapsedSecs() {
    return Math.round((Date.now() - sessionStartRef.current) / 1000);
  }

  // Reset per-exercise state when exercise changes
  useEffect(() => {
    if (!exercise?.id) return;
    const prev = localStorage.getItem('cv_exercise_id') ?? '';
    if (exercise.id !== prev) {
      localStorage.setItem('cv_exercise_id', exercise.id);
      localStorage.setItem('cv_submission_count', '0');
      timer.reset();
      locks.resetForExercise();
      setAttemptCount(0);
      setTestResults(null);
      setSubmitStatus(null);
      sessionIdRef.current    = createSessionId();
      sessionStartRef.current = Date.now();
    }
  }, [exercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    const code = candidateRef.current?.getValue()?.trim() ?? '';
    if (!code) {
      setSubmitStatus({ type: 'warn', message: 'Write some code before submitting.' });
      return;
    }
    if (!exercise?.id) {
      setSubmitStatus({ type: 'warn', message: 'No exercise loaded — cannot submit.' });
      return;
    }

    if (!sessionIdRef.current) sessionIdRef.current = createSessionId();

    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    setSubmitting(true);
    setTestResults(null);
    setSubmitStatus({ type: 'running', message: 'Running tests…' });

    // Emit analytics event
    try {
      document.dispatchEvent(new CustomEvent('cvd:submit_clicked', {
        detail: { exerciseId: exercise.id, attempt: newCount, codeLength: code.length },
        bubbles: false,
      }));
    } catch (_) {}

    // Demo mode — synthetic response
    if (window.__CODIVIUM_DEMO__) {
      await new Promise(r => setTimeout(r, 900));
      const accepted = newCount > 1;
      const resp = {
        accepted,
        testsPassed: accepted ? (exercise.testsTotal || 10) : 7,
        testsTotal:  exercise.testsTotal || 10,
        testResults: [
          { name: 'test_example', status: 'pass', input: '', expected: '', got: '' },
          { name: 'test_edge',    status: accepted ? 'pass' : 'fail',
            input: 'edge input', expected: 'expected', got: accepted ? 'expected' : 'wrong' },
        ],
        feedback: null,
      };
      setSubmitting(false);
      locks.onSubmission();
      setTestResults(resp);
      setSubmitStatus(
        accepted
          ? { type: 'success', message: 'All tests passed! (demo mode)' }
          : { type: 'fail', message: `${resp.testsPassed} / ${resp.testsTotal} tests passed — keep going.` }
      );

      if (accepted && window.CodiviumFeedback?.show) {
        window.CodiviumFeedback.show({
          exerciseId: exercise.id, exerciseName: exercise.name,
          category: exercise.category, difficulty: exercise.difficulty,
          testsPassed: resp.testsPassed, testsTotal: resp.testsTotal,
          returnMenuUrl: 'menu-page.html',
          current: { timeToSuccessSeconds: elapsedSecs(), attempts: newCount },
          insightText: 'Demo mode — no real scoring.', chips: [], nextSuggestion: '',
          performanceTier: null, isFirstSolve: true, history: [], deltas: null,
        });
      }
      return;
    }

    // Real submission
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(window.__CODIVIUM_CSRF_TOKEN ? { 'X-Csrf-Token': window.__CODIVIUM_CSRF_TOKEN } : {}),
      };

      const track = (() => {
        try {
          const from = decodeURIComponent(new URLSearchParams(window.location.search).get('from') || '');
          const m = from.match(/[?&]track=([^&]+)/);
          return m ? m[1] : 'micro';
        } catch (_) { return 'micro'; }
      })();

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 15000);

      const res = await fetch(apiUrl('/api/exercise/submit'), {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        signal: ctrl.signal,
        body: JSON.stringify({
          exerciseId: exercise.id, track, code,
          sessionId: sessionIdRef.current,
          elapsedSecs: elapsedSecs(),
          attempt: newCount,
        }),
      });
      clearTimeout(timeout);

      if (res.status === 429) throw Object.assign(new Error('Rate limited'), { code: 'RATE_LIMITED' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const response = await res.json();
      setSubmitting(false);
      locks.onSubmission();
      setTestResults(response);

      if (response.accepted) {
        setSubmitStatus({ type: 'success', message: 'All tests passed!' });
        if (feedbackRef.current && response.feedback) {
          const fb = response.feedback;
          feedbackRef.current.show({
            exerciseId: exercise.id, exerciseName: fb.exerciseName || exercise.name,
            category: fb.category || exercise.category, difficulty: fb.difficulty || exercise.difficulty,
            testsPassed: response.testsPassed, testsTotal: response.testsTotal,
            returnMenuUrl: 'menu-page.html', nextExerciseId: fb.nextExerciseId || null,
            current: {
              timeToSuccessSeconds: elapsedSecs(), attempts: newCount,
              bestPreSuccessPercent: fb.bestPreSuccessPercent ?? null,
              timeToFirstAttemptSecs: fb.timeToFirstAttemptSecs ?? null,
              avgIterationSeconds: fb.avgIterationSeconds ?? null,
            },
            insightText: fb.insightText || '', chips: fb.chips || [],
            nextSuggestion: fb.nextSuggestion || '', performanceTier: fb.performanceTier || null,
            isFirstSolve: fb.isFirstSolve ?? false, history: fb.history || [], deltas: fb.deltas || null,
          });
        }
      } else {
        const p = response.testsPassed || 0, tot = response.testsTotal || 0;
        setSubmitStatus({ type: 'fail', message: `${p} / ${tot} tests passed — keep going.` });
      }
    } catch (err) {
      setSubmitting(false);
      const msg = err.code === 'RATE_LIMITED'
        ? 'Too many submissions — please wait before retrying.'
        : `Submission error: ${err.message || 'Unknown error'} — please try again.`;
      setSubmitStatus({ type: 'error', message: msg });
    }
  }, [submitting, exercise, attemptCount, locks]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main
      ref={stageRef}
      className="stage"
      id="main-content"
      role="main"
    >
      {/* Session timer in topbar — rendered outside the workspace */}
      <Timer timer={timer} />

      {/* Settings button (gear icon in sidebar or topbar — fires openPalette) */}
      <SettingsPalette
        open={settings.paletteOpen}
        onClose={() => settings.setPaletteOpen(false)}
        settings={settings}
        lockCfg={locks.cfg}
        onLockCfgChange={locks.updateCfg}
      />

      {/* Main workspace shell */}
      <div className="stage-shell" id="mainWorkspace">
        <WorkspaceControls
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          replVisible={replVisible}
          setReplVisible={setReplVisible}
          onSettingsOpen={() => settings.setPaletteOpen(true)}
        />

        <div aria-hidden="true" className="ws-base" />

        <div
          ref={workspaceRef}
          className="workspace"
          id="workspace"
          aria-label="Exercise workspace"
        >
          {/* ── Top region: left pane + vertical splitter + right pane ── */}
          <div className="ws-top" id="wsTop">
            <LeftPane
              exercise={exercise}
              locks={locks}
              elapsedSeconds={timer.elapsedSeconds}
              attemptNoteSeen={attemptNoteSeen}
              onDismissNote={handleDismissNote}
              onLearnMore={() => window.CodiviumHelp?.openAttemptModal()}
            />

            <div
              className="splitter splitter-v"
              id="splitTopV"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize left and right panels"
              tabIndex={0}
              onMouseDown={onVerticalSplitDrag}
            />

            <RightPane
              exercise={exercise}
              locks={locks}
              syntaxTheme={settings.syntaxTheme}
              candidateRef={candidateRef}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitStatus={submitStatus}
              attemptCount={attemptCount}
              testResults={testResults}
              elapsedSeconds={timer.elapsedSeconds}
            />
          </div>

          {/* ── Horizontal splitter ── */}
          {replVisible && (
            <div
              className="splitter splitter-h"
              id="splitMainH"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize top and bottom panels"
              tabIndex={0}
              onMouseDown={onHorizontalSplitDrag}
            />
          )}

          {/* ── REPL ── */}
          {replVisible && (
            <ReplPane
              syntaxTheme={settings.syntaxTheme}
              replSyntaxTheme={settings.replSyntaxTheme}
              candidateRef={candidateRef}
              onReplSplitDrag={onReplSplitDrag}
            />
          )}
        </div>
      </div>

      {/* Feedback modal — React replacement for feedback.js */}
      <FeedbackModal ref={feedbackRef} />

      {/* Help panel — React replacement for cv-help-panel.js */}
      <HelpPanel />

      {/* Loading / error overlay */}
      {loading && (
        <div className="cv-loading-overlay" aria-live="polite">
          <span>Loading exercise…</span>
        </div>
      )}
      {error && !loading && (
        <div className="cv-load-error">
          <p className="cv-load-error-title">Could not load exercise</p>
          <p className="cv-load-error-msg">{error}</p>
          <button className="cv-load-error-retry" type="button" onClick={reload}>Retry</button>
        </div>
      )}
    </main>
  );
}

// EditorPage.jsx — Root component for the Codivium exercise workspace.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import { useTimer } from '../../hooks/useTimer.js';
import { useLocks } from '../../hooks/useLocks.js';
import { useExercise } from '../../hooks/useExercise.js';
import { useSplitters } from '../../hooks/useSplitter.js';
import { useSettings } from '../../hooks/useSettings.js';

import {
  CreateOutput as InterviewCreateOutput,
  CreateOutputStream as InterviewCreateOutputStream,
  SubmitUserInterViewPrepration as SubmitInterviewFinal,
  SaveInterviewPreparationSession,
} from '../../api/interviewprepration/apiinterviewprepration';
import {
  CreateOutput as DeliberateCreateOutput,
  CreateOutputStream as DeliberateCreateOutputStream,
  SubmitUserInterViewPrepration as SubmitDeliberateFinal,
  SaveDeliberatePracticeSession,
} from '../../api/deliberatePractice/apideliberatepractice';

import Timer from './Timer.jsx';
import WorkspaceControls from './WorkspaceControls.jsx';
import LeftPane from './LeftPane.jsx';
import RightPane from './RightPane.jsx';
import ReplPane from './ReplPane.jsx';
import SettingsPalette from './SettingsPalette.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import EditorTour from './EditorTour.jsx';
import CodeSubmitConfirmation from './CodeSubmitConfirmation.jsx';

export default function EditorPage() {
  const stageRef = useRef(null);
  const workspaceRef = useRef(null);
  const candidateRef = useRef(null);   // imperative ref into EditorSlot (candidate)
  const feedbackRef = useRef(null);   // imperative ref into FeedbackModal

  // ── Attempt-first note ─────────────────────────────────────────────────────
  const [attemptNoteSeen, setAttemptNoteSeen] = React.useState(() => {
    try { return localStorage.getItem('cv_attempt_note_seen') === '1'; } catch (_) { return false; }
  });
  const handleDismissNote = React.useCallback(() => {
    try { localStorage.setItem('cv_attempt_note_seen', '1'); } catch (_) { }
    setAttemptNoteSeen(true);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // ── Core hooks ─────────────────────────────────────────────────────────────
  // Resume seconds carried in via WelcomeBackModal's "Continue where I left
  // off" — useTimer starts the display at that value so the user sees the
  // accumulated time, not 0:00.
  const resumeSeconds = Number(location?.state?.initialTimeInSeconds) || 0;
  const timer = useTimer({ initialSeconds: resumeSeconds });
  const settings = useSettings(stageRef);
  const { exercise, loading, error, reload, item, track } = useExercise();

  // Locks depend on elapsed seconds from the timer
  const locks = useLocks(timer.elapsedSeconds);

  // Splitters (drag-to-resize): mutate CSS vars directly on workspaceRef
  const { onVerticalSplitDrag, onHorizontalSplitDrag, onReplSplitDrag } =
    useSplitters(workspaceRef);

  // ── Layout state ───────────────────────────────────────────────────────────
  const [focusMode, setFocusMode] = useState('default');
  const [replVisible, setReplVisible] = useState(true);
  const [tourActive, setTourActive] = useState(false);

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
    document.body.classList.toggle('focus-editor', focusMode === 'editor');
    document.body.classList.toggle('focus-instructions', focusMode === 'instructions');
    document.body.classList.toggle('repl-collapsed', !replVisible);
    return () => {
      document.body.classList.remove('focus-editor', 'focus-instructions', 'repl-collapsed');
    };
  }, [focusMode, replVisible]);

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);   // { type, message }
  const [testResults, setTestResults] = useState(null);
  const [attemptCount, setAttemptCount] = useState(
    () => Number(location?.state?.totalRunCount) || 0,
  );
  const [isStartFresh, setIsStartFresh] = useState(
    () => (location?.state?.isStartFresh ?? true),
  );
  const [lastRunOutput, setLastRunOutput] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  // Distinguishes Run-Code (backend executes the suite) from Final-Submit
  // (backend just saves + builds feedback). Only the former should cycle
  // through unit-test names in the status indicator.
  const [runningTests, setRunningTests] = useState(false);
  // initialOffsetRef is kept around for any future surface that wants a
  // resume baseline distinct from the running total. The save / submit /
  // run paths now read timer.elapsedSeconds directly because useTimer is
  // seeded with the resume value above.
  const initialOffsetRef = useRef(resumeSeconds);
  // Keeps the latest editor contents in sync via the EditorSlot onChange
  // callback. The unmount-time session save reads from this ref because the
  // candidate editor's imperative ref (candidateRef.current.getValue) is
  // already null by the time React runs the parent cleanup — children
  // unmount first, leaving Ace's instance destroyed.
  const codeBufferRef = useRef('');

  // Run-progress is now driven by NDJSON events streamed from the backend
  // (`progress` per test start, `testResult` per finish, `complete` at end).
  // The handler in handleRunCode wires those events into setSubmitStatus
  // directly — no client-side cycling needed.

  // Reset per-exercise state when exercise changes + preload useroldcode if continuing
  useEffect(() => {
    if (!exercise?.id) return;
    const prev = localStorage.getItem('cv_exercise_id') ?? '';
    if (exercise.id !== prev) {
      localStorage.setItem('cv_exercise_id', exercise.id);
      localStorage.setItem('cv_submission_count', '0');
      timer.reset();
      locks.resetForExercise();
      setTestResults(null);
      setSubmitStatus(null);
      setShowSubmitConfirm(false);
    }

    // Seed the candidate editor. Prefer resumed useroldcode when the user
    // chose "Continue Where I Left Off"; otherwise fall back to the scaffold.
    const st = location?.state || {};
    const useroldcode =
      st.useroldcode ?? st.UserOldCode ?? st.userOldCode ?? st.lastUserCode ?? '';
    const seed = !isStartFresh && useroldcode ? useroldcode : (exercise.codeScaffold || '');
    if (candidateRef.current?.setValue) {
      candidateRef.current.setValue(seed);
    }
    // Mirror the seed into the buffer ref so an unmount that fires before
    // the user types anything still saves something useful.
    codeBufferRef.current = seed;
  }, [exercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Run Code: calls CreateOutput (executes user code against unit tests) ──
  const handleRunCode = useCallback(async () => {
    if (submitting) return;
    const code = candidateRef.current?.getValue()?.trim() ?? '';
    if (!code) {
      setSubmitStatus({ type: 'warn', message: 'Write some code before running.' });
      return;
    }
    if (!exercise?.raw || !item) {
      setSubmitStatus({ type: 'warn', message: 'No exercise loaded — cannot run.' });
      return;
    }

    const Userid = localStorage.getItem('Userid');
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    setSubmitting(true);
    setRunningTests(true);
    setTestResults(null);
    // The cycling useEffect (driven by runningTests) populates submitStatus
    // with per-test progress, so no static "Running tests…" line is needed.

    const totalSecs = timer.elapsedSeconds;

    try {
      let body;
      let runApi;
      if (track === 'interview') {
        body = {
          Id: item.csInterviewPreprationId,
          ExerciseId: item.excerciseId,
          Code: code,
          IsStartFresh: isStartFresh,
          totalSeconds: totalSecs,
          interviewPreprationId: item.id,
          userId: Userid,
        };
        runApi = InterviewCreateOutputStream;
      } else {
        body = {
          Id: item.deliberatePracticeid,
          PracticeId: item.practiceId,
          Code: code,
          IsStartFresh: isStartFresh,
          totalSeconds: totalSecs,
          deliberatePracticePreprationId: item.id,
          userId: Userid,
        };
        runApi = DeliberateCreateOutputStream;
      }

      // Real per-test progress: backend streams { type: progress/testResult/complete }
      // events as the Python harness runs each unit test. We surface the
      // currently-running test name to the user the moment it starts, then
      // flip to a brief "Test N/M ..." line after it finishes — that flicker
      // is what makes progress feel real rather than estimated.
      const onStreamEvent = (evt) => {
        if (!evt) return;
        if (evt.type === 'progress') {
          const label = evt.name || `test_${evt.index}`;
          setSubmitStatus({
            type: 'running',
            message: `Running test ${evt.index} / ${evt.total}: ${label}`,
          });
        } else if (evt.type === 'testResult') {
          const verb = evt.passed ? '✓' : '✗';
          const label = evt.name || `test_${evt.index}`;
          setSubmitStatus({
            type: 'running',
            message: `${verb} ${evt.index} / ${evt.total}: ${label}`,
          });
        }
      };

      const response = await runApi(JSON.stringify(body), onStreamEvent);
      setSubmitting(false);
      setRunningTests(false);

      if (!response || response.status !== 200 || !response.data) {
        if (response?.status === 401) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        setSubmitStatus({ type: 'error', message: 'Run failed — please try again.' });
        return;
      }

      setIsStartFresh(false);
      setLastRunOutput(response.data);
      locks.onSubmission();

      const failedIds = response.data.failedUnitTestIDList || [];
      const totalErrors = response.data.totalErrorTestCount ?? failedIds.length;
      const totalTests = (exercise.unitTests || []).length;
      const passed = Math.max(0, totalTests - failedIds.length);
      // Treat the Python harness's "<unknown>" placeholder as a missing value
      // so the failure row can fall back to the error message instead.
      const cleanOutput = (s) => (s && s !== '<unknown>' ? s : '');
      const mapped = {
        accepted: failedIds.length === 0 && totalErrors === 0,
        testsPassed: passed,
        testsTotal: totalTests,
        testResults: (exercise.unitTests || []).map((u) => {
          const out =
            (response.data.unitTestResults || []).find((r) => r.unitTestId === u.id) || {};
          const failed = failedIds.includes(u.id);
          return {
            name: u.name || `test_${u.id}`,
            status: failed ? 'fail' : 'pass',
            input: out.unitTestDescription || '',
            expected: cleanOutput(out.expectedOutput),
            got: cleanOutput(out.actualOutput),
            error: out.errorMessage || '',
          };
        }),
      };
      setTestResults(mapped);

      if (mapped.accepted) {
        // Surface the confirmation modal instead of asking the user to click
        // the header button a second time.
        setSubmitStatus(null);
        setShowSubmitConfirm(true);
      } else {
        setSubmitStatus({
          type: 'fail',
          message: `${mapped.testsPassed} / ${mapped.testsTotal} tests passed — keep going.`,
        });
      }
    } catch (err) {
      setSubmitting(false);
      setRunningTests(false);
      setSubmitStatus({
        type: 'error',
        message: `Run error: ${err?.message || 'Unknown error'} — please try again.`,
      });
    }
  }, [submitting, exercise, item, track, attemptCount, isStartFresh, timer, locks, navigate]);

  // ── Final Submit: once tests pass, send final submission ──
  const handleFinalSubmit = useCallback(async () => {
    if (!lastRunOutput?.id) {
      setSubmitStatus({ type: 'warn', message: 'Please run your code successfully before submitting.' });
      return;
    }
    const Userid = localStorage.getItem('Userid');
    const totalSecs = timer.elapsedSeconds;
    setSubmitting(true);
    setSubmitStatus({ type: 'running', message: 'Submitting…' });

    try {
      const submitApi =
        track === 'interview' ? SubmitInterviewFinal : SubmitDeliberateFinal;
      const body =
        track === 'interview'
          ? {
            ExecutionId: lastRunOutput.id,
            ExecutionTime: totalSecs,
            InterviewPreprationId: item.id,
            UserId: Userid,
            RunCount: attemptCount,
          }
          : {
            ExecutionId: lastRunOutput.id,
            ExecutionTime: totalSecs,
            deliberatePracticePreprationId: item.id,
            UserId: Userid,
            RunCount: attemptCount,
          };

      const response = await submitApi(JSON.stringify(body));
      setSubmitting(false);

      if (!response || response.status !== 200) {
        if (response?.status === 401) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        Swal.fire({
          title: 'Error!',
          text: 'Submission failed. Please try again.',
          icon: 'error',
        });
        setSubmitStatus({ type: 'error', message: 'Submission failed.' });
        return;
      }

      setSubmitStatus({ type: 'success', message: 'Submission successful!' });

      // Backend now returns the v1.2.1 Feedback Modal Integration Contract
      // shape: { accepted, testsPassed, testsTotal, testResults, feedback }.
      // Every field shown in the modal is pre-computed server-side — chips,
      // insightText, tiers, deltas, history, next-exercise. The frontend
      // only routes those values into the modal payload.
      const data = response.data || {};
      const fb = data.feedback || {};
      const history = Array.isArray(fb.history) ? fb.history : [];

      // The modal's MetricCard components read session metrics off `current`
      // (timeToFirstAttemptSecs, bestPreSuccessPercent, avgIterationSeconds in
      // addition to timeToSuccessSeconds + attempts). Pass them all here so
      // the secondary-metrics row populates instead of showing "—".
      // Prefer the backend-derived attempt count: it comes from the run-log
      // table and is consistent with bestPreSuccess / timeToFirstAttempt /
      // avgIteration. The local attemptCount can drift on resumed sessions.
      const current = {
        timeToSuccessSeconds: totalSecs,
        attempts: fb.attempts ?? attemptCount,
        timeToFirstAttemptSecs: fb.timeToFirstAttemptSecs ?? null,
        bestPreSuccessPercent: fb.bestPreSuccessPercent ?? null,
        avgIterationSeconds: fb.avgIterationSeconds ?? null,
      };

      if (feedbackRef.current?.show) {
        feedbackRef.current.show({
          exerciseId: exercise.id,
          exerciseName: fb.exerciseName || exercise.name,
          category: fb.category || exercise.category,
          difficulty: fb.difficulty || exercise.difficulty,
          testsPassed: data.testsPassed ?? (exercise.unitTests || []).length,
          testsTotal:  data.testsTotal  ?? (exercise.unitTests || []).length,
          returnMenuUrl: `/menu?track=${encodeURIComponent(track)}`,
          current,
          insightText:    fb.insightText    || '',
          chips:          fb.chips          || [],
          nextSuggestion: fb.nextSuggestion || '',
          attemptTier:    fb.attemptTier    || null,
          speedTier:      fb.speedTier      || null,
          performanceTier: null,
          isFirstSolve:   !!fb.isFirstSolve,
          history,
          deltas:         fb.deltas || null,
          // Backend still computes a next-exercise recommendation but we keep
          // the footer CTA as plain "Try Again" — drop it from the modal payload
          // so the button always re-enters the current exercise.
          nextExerciseId:   null,
          nextExerciseName: null,
          // Used by the modal's "Try Again" button to reset and re-enter the
          // same exercise via the same route the user came from.
          item,
          editorRoute: location.pathname,
        });
      }
    } catch (err) {
      setSubmitting(false);
      setSubmitStatus({
        type: 'error',
        message: `Submission error: ${err?.message || 'Unknown error'}`,
      });
    }
  }, [lastRunOutput, item, track, attemptCount, timer, exercise, navigate, location.pathname]);

  // The header button now only runs the tests. Final submission is gated by
  // the CodeSubmitConfirmation modal that appears after a passing run.
  const handleSubmit = useCallback(() => {
    handleRunCode();
  }, [handleRunCode]);

  const confirmFinalSubmit = useCallback(() => {
    setShowSubmitConfirm(false);
    handleFinalSubmit();
  }, [handleFinalSubmit]);

  const cancelFinalSubmit = useCallback(() => {
    setShowSubmitConfirm(false);
  }, []);

  // ── Save session on unmount (best-effort) ──
  useEffect(() => {
    return () => {
      if (!item) return;
      const Userid = localStorage.getItem('Userid');
      if (!Userid) return;
      // Read from the buffer ref — the candidate editor's child unmount
      // happens before this cleanup, so candidateRef.current.getValue()
      // returns "" by the time we get here. The buffer is kept in sync via
      // the EditorSlot onChange callback.
      const liveCode = candidateRef.current?.getValue?.() ?? '';
      const code = liveCode || codeBufferRef.current || '';
      const totalSecs = timer.elapsedSeconds;
      try {
        if (track === 'interview') {
          SaveInterviewPreparationSession({
            userId: Userid,
            interviewPreprationId: item.id,
            lastUserCode: code,
            totalSeconds: totalSecs,
            runCount: attemptCount,
            lastOutput: null,
          });
        } else {
          SaveDeliberatePracticeSession({
            userId: Userid,
            // Backend DTO field is DeliberatePracticePreprationId — earlier
            // we sent deliberatePracticeId here, which silently bound to
            // 0 and broke the resume flow for the deliberate-practice track.
            deliberatePracticePreprationId: item.id,
            lastUserCode: code,
            totalSeconds: totalSecs,
            runCount: attemptCount,
            lastOutput: null,
          });
        }
      } catch (e) {
        console.error('Save session failed', e);
      }
    };
  }, [item, track]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main
      ref={stageRef}
      className="main stage"
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
              onTourStart={() => setTourActive(true)}
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
              editorFontSize={settings.editorFontSize}
              editorFontFamily={settings.editorFontFamily}
              editorBold={settings.editorBold}
              candidateRef={candidateRef}
              onCandidateChange={(v) => { codeBufferRef.current = v ?? ''; }}
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
              // REPL gets its own syntax theme, not the editor's. Settings
              // changes on the Code Editor sub-tab can't leak into REPL.
              syntaxTheme={settings.replSyntaxTheme}
              replFontSize={settings.replFontSize}
              replFontFamily={settings.replFontFamily}
              candidateRef={candidateRef}
              onReplSplitDrag={onReplSplitDrag}
            />
          )}
        </div>
      </div>

      {/* Feedback modal — React replacement for feedback.js */}
      <FeedbackModal ref={feedbackRef} />

      {/* Pre-submission confirmation — appears when all unit tests pass */}
      <CodeSubmitConfirmation
        showConfirm={showSubmitConfirm}
        onSubmitCode={confirmFinalSubmit}
        handleClose={cancelFinalSubmit}
      />

      {/* Guided tour overlay — spotlights editor UI step-by-step */}
      <EditorTour active={tourActive} onStop={() => setTourActive(false)} />

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

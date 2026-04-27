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
  SubmitUserInterViewPrepration as SubmitInterviewFinal,
  SaveInterviewPreparationSession,
} from '../../api/interviewprepration/apiinterviewprepration';
import {
  CreateOutput as DeliberateCreateOutput,
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
  const timer = useTimer();
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
  const initialOffsetRef = useRef(Number(location?.state?.initialTimeInSeconds) || 0);

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
    setTestResults(null);
    setSubmitStatus({ type: 'running', message: 'Running tests…' });

    const totalSecs = timer.elapsedSeconds + initialOffsetRef.current;

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
        runApi = InterviewCreateOutput;
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
        runApi = DeliberateCreateOutput;
      }

      const response = await runApi(JSON.stringify(body));
      setSubmitting(false);

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
            expected: out.expectedOutput || '',
            got: out.actualOutput || '',
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
    const totalSecs = timer.elapsedSeconds + initialOffsetRef.current;
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

      // Backend (UserInterviewRunTimeLogApiController.InterViewSubmission /
      // DeliberatePracticeSubmission) returns the full list of this user's
      // submissions for this exercise — sorted by insertion order. Map it into
      // the shape FeedbackModal's TimeChart / AttemptsChart already understand.
      const submissions = Array.isArray(response.data) ? response.data : [];
      const pick = (obj, ...keys) => {
        for (const k of keys) {
          if (obj && obj[k] != null) return obj[k];
        }
        return 0;
      };
      const history = submissions.map(s => ({
        timeToSuccessSeconds: Number(pick(s, 'executionTime', 'ExecutionTime')) || 0,
        attempts:             Number(pick(s, 'runCount', 'RunCount')) || 0,
        createdAt:            pick(s, 'createdAt', 'CreatedAt'),
      }));

      const isFirstSolve = history.length <= 1;
      const first  = history[0];
      const latest = history[history.length - 1];

      // Improvement % vs first attempt — negative = better (less time / fewer runs).
      const pctChange = (oldV, newV) =>
        !oldV ? 0 : ((newV - oldV) / oldV) * 100;

      const deltas = !isFirstSolve && first && latest
        ? {
            timeToSuccess: pctChange(first.timeToSuccessSeconds, latest.timeToSuccessSeconds),
            attempts:      pctChange(first.attempts, latest.attempts),
          }
        : null;

      const current = latest || { timeToSuccessSeconds: totalSecs, attempts: attemptCount };

      const insightText = isFirstSolve
        ? 'Nice work — first time solving this exercise.'
        : `You've completed this exercise ${history.length} times. Keep refining.`;

      if (feedbackRef.current?.show) {
        feedbackRef.current.show({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: exercise.category,
          difficulty: exercise.difficulty,
          testsPassed: (exercise.unitTests || []).length,
          testsTotal: (exercise.unitTests || []).length,
          returnMenuUrl: `/menu?track=${encodeURIComponent(track)}`,
          current,
          insightText,
          chips: [],
          nextSuggestion: '',
          performanceTier: null,
          isFirstSolve,
          history,
          deltas,
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
      const code = candidateRef.current?.getValue?.() ?? '';
      const totalSecs = timer.elapsedSeconds + initialOffsetRef.current;
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
            deliberatePracticeId: item.id,
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

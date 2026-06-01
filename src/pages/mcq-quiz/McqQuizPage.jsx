// McqQuizPage.jsx
import React, { useEffect, useCallback } from 'react';
import { useQuiz } from './hooks/useQuiz.js';
import {
  ProgressBar, CvTimer, QuestionCard,
  TutorialPanel, SummaryView,
} from './components/QuizComponents.jsx';
import McqTour, { useMcqTour } from '../mcq-shared/McqTour.jsx';
import { useGlowFollow } from '../mcq-shared/useGlowFollow.js';
import { useCssLoader } from '../../hooks/useCssLoader.js';
import { Link } from 'react-router-dom';

// MCQ CSS files have unscoped selectors (.summary, .input, .divider, etc.)
// that would collide with other pages if imported globally. Inject them
// only while this route is mounted via useCssLoader — do NOT prewarm at
// module load (mcq-quiz.css's `.summary { display: none }` would hide the
// Contact / MCQ-setup `.summary`-class elements on those pages).
const MCQ_CSS = [
  '/assets/css/components/mcq/mcq-forms.css',
  '/assets/css/components/mcq/mcq-quiz.css',
];

export default function McqQuizPage() {
  const cssReady = useCssLoader(MCQ_CSS, { evict: true });
  useGlowFollow();

  const tourState = useMcqTour({ onParent: false });
  const { state, submit, advance, showPeekWarning, hidePeekWarning, toggleTutorial, restart, saveAndExit } = useQuiz();
  const { phase, questions, index, settings } = state;
  const q = questions[index];

  // Auto-advance after normal (non-peek) submit
  useEffect(() => {
    if (phase !== 'active' || !state.locked) return;
    const lastAns = state.answers[state.answers.length - 1];
    if (!lastAns || lastAns.isPeek) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tid = setTimeout(() => advance(), reduced ? 600 : 2400);
    return () => clearTimeout(tid);
  }, [state.locked, state.answers.length, phase]); // eslint-disable-line

  // Mid-quiz leave guard: while the quiz is in progress, expose a global
  // saveAndExit() the sidebar/topbar leave guard can invoke before
  // navigating away. We tear it down once the quiz reaches summary (so
  // the regular result-post handles the save) or on unmount.
  useEffect(() => {
    if (phase !== 'active') {
      if (typeof window !== 'undefined') delete window.__cvMcqSaveAndExit;
      return;
    }
    if (typeof window !== 'undefined') {
      window.__cvMcqSaveAndExit = saveAndExit;
    }
    return () => {
      if (typeof window !== 'undefined') delete window.__cvMcqSaveAndExit;
    };
  }, [phase, saveAndExit]);

  const handleSubmit = useCallback((sel) => submit(sel, false), [submit]);
  const handlePeekConfirm = useCallback((sel) => submit(sel, true), [submit]);
  const handleAdvancePeek = useCallback(() => advance(), [advance]);
  const handleBack = useCallback(() => { window.location.href = '/mcq'; }, []);
  const handleAdjust = useCallback(() => { window.location.href = '/mcq'; }, []);

  // FOUC guard — hide until MCQ CSS has parsed (route-scoped via evict).
  if (!cssReady) {
    return <main className="main" id="main-content" role="main" style={{ visibility: 'hidden' }} />;
  }

  if (phase === 'loading') {
    return (
      <main className="main" id="main-content" role="main">
        <div className="page-shell">
          <div className="window window-large glow-follow">
            <div className="window-pad">
              <div style={{ color: 'rgba(245,245,252,0.6)', fontSize: 14 }}>Loading questions…</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Production-mode hard error: shown when the backend refuses to give us
  // questions and demo fallback is disabled (see useQuiz.js ALLOW_DEMO).
  if (phase === 'error') {
    return (
      <main className="main" id="main-content" role="main">
        <div className="page-shell">
          <div className="window window-large glow-follow">
            <div className="window-pad">
              <div style={{ color: 'rgba(245,80,80,0.85)', fontSize: 14, marginBottom: 10 }}>
                {state.loadError || 'Could not load questions.'}
              </div>
              <Link to="/mcq" style={{ color: 'rgba(246,213,138,0.85)' }}>← Back to Setup</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'active' && questions.length === 0) {
    return (
      <main className="main" id="main-content" role="main">
        <div className="page-shell">
          <div className="window window-large glow-follow">
            <div className="window-pad">
              <div style={{ color: 'rgba(245,245,252,0.6)', fontSize: 14 }}>
                No questions available.{' '}
                <Link to="/mcq" style={{ color: 'rgba(246,213,138,0.85)' }}>← Back to Setup</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'summary') {
    return (
      <main className="main" id="main-content" role="main">
        <div className="page-shell">
          <SummaryView state={state} onRestart={restart} onAdjust={handleAdjust} />
        </div>
      </main>
    );
  }

  // Active quiz
  const humanDiff = d => {
    const s = String(d || '').toLowerCase();
    if (s === 'intermediate') return 'Intermediate';
    if (s === 'advanced' || s === 'advance') return 'Advanced';
    if (s === 'basic') return 'Basic';
    return d || '—';
  };
  // Settings now carries Guid IDs + friendly names. Prefer the friendly name
  // for display; fall back to `categories` (legacy) for category count.
  const isMulti = q?.isMultipleAnswer || (q?.correctIndices?.length > 1);
  const catCount =
    (Array.isArray(settings?.categoryNames) && settings.categoryNames.length) ||
    (Array.isArray(settings?.categoryIds) && settings.categoryIds.length) ||
    (Array.isArray(settings?.categories) && settings.categories.length) || 0;
  const diffLabel = humanDiff(settings?.difficultyName || settings?.difficulty);
  const metaText = `${catCount} categor${catCount === 1 ? 'y' : 'ies'} · ${diffLabel} · ${questions.length} question${questions.length === 1 ? '' : 's'}${settings?.skipCorrect ? ' · skipping correct' : ''}`;

  return (
    <>
      <main className="main" id="main-content" role="main">
        <div className="page-shell">

          {/* Fixed-position timer overlay — position:fixed in CSS */}
          <CvTimer />

          {/* Demo mode notice */}
          {/* {settings?._isDemo && (
            <div style={{
              padding: '8px 14px', marginBottom: 10, fontSize: 12,
              background: 'rgba(246,213,138,0.08)', border: '1px solid rgba(246,213,138,0.22)',
              borderRadius: 4, color: 'rgba(246,213,138,0.82)',
            }} role="note">
              Demo mode — showing sample questions.{' '}
              <Link to="/mcq" style={{ color: 'inherit' }}>Go to MCQ Setup</Link> to choose your own filters.
            </div>
          )} */}

          {/* Main window — matches parent page chrome */}
          <div className="window window-large glow-follow">
            <div className="window-pad">

              {/* Top bar: tags + q-number + meta */}
              <div className="quiz-top">
                <div className="tags" aria-label="Question tags">
                  <div className="tag gold" id="tagCategory">{q?.category}</div>
                  <div className="tag" id="tagDifficulty">{humanDiff(q?.difficulty)}</div>
                  {isMulti && <div className="tag tag-multi" id="tagMulti">Select all that apply</div>}
                </div>
                <div className="quiz-top-meta">
                  <div className="qmeta">
                    <span id="qNumber">{index + 1} / {questions.length}</span>
                    {' · '}
                    <span id="appliedMeta">{metaText}</span>
                  </div>
                </div>
              </div>

              {/* Segmented progress bar — tour target: data-role="progress" */}
              <div data-role="progress">
                <ProgressBar answers={state.answers} total={questions.length} />
              </div>

              {/* Quiz stage: card + optional tutorial panel */}
              <div className="quiz-stage" id="quizStage">
                <QuestionCard
                  question={q}
                  index={index}
                  total={questions.length}
                  state={state}
                  onSubmit={handleSubmit}
                  onPeek={showPeekWarning}
                  onPeekConfirm={handlePeekConfirm}
                  onPeekCancel={hidePeekWarning}
                  onToggleTutorial={toggleTutorial}
                  onAdvancePeek={handleAdvancePeek}
                  onBack={handleBack}
                />
                <TutorialPanel question={q} isOpen={state.tutorialOpen} />
              </div>

            </div>
          </div>
        </div>
      </main>
      <McqTour tourState={tourState} />
    </>
  );
}
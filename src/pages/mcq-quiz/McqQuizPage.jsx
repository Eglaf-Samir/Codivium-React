// McqQuizPage.jsx
import React, { useEffect, useCallback } from 'react';
import { useQuiz } from './hooks/useQuiz.js';
import {
  ProgressBar, CvTimer, QuestionCard,
  TutorialPanel, SummaryView,
} from './components/QuizComponents.jsx';
import McqTour, { useMcqTour } from '../mcq-shared/McqTour.jsx';
import { useGlowFollow } from '../mcq-shared/useGlowFollow.js';

export default function McqQuizPage() {
  useGlowFollow();
  const tourState = useMcqTour({ onParent: false });
  const { state, submit, advance, showPeekWarning, hidePeekWarning, toggleTutorial, restart } = useQuiz();
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

  const handleSubmit      = useCallback((sel) => submit(sel, false),  [submit]);
  const handlePeekConfirm = useCallback((sel) => submit(sel, true),   [submit]);
  const handleAdvancePeek = useCallback(() => advance(),              [advance]);
  const handleBack        = useCallback(() => { window.location.href = '/mcq'; }, []);
  const handleAdjust      = useCallback(() => { window.location.href = '/mcq'; }, []);

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

  if (phase === 'active' && questions.length === 0) {
    return (
      <main className="main" id="main-content" role="main">
      <div className="page-shell">
        <div className="window window-large glow-follow">
          <div className="window-pad">
            <div style={{ color: 'rgba(245,245,252,0.6)', fontSize: 14 }}>
              No questions available.{' '}
              <a href="/mcq" style={{ color: 'rgba(246,213,138,0.85)' }}>← Back to Setup</a>
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
  const humanDiff = d => d === 'intermediate' ? 'Intermediate' : d === 'advanced' ? 'Advanced' : 'Basic';
  const isMulti   = q?.correctIndices?.length > 1;
  const catCount  = settings?.categories?.length ?? 0;
  const metaText  = `${catCount} categor${catCount === 1 ? 'y' : 'ies'} · ${humanDiff(settings?.difficulty)} · ${questions.length} question${questions.length === 1 ? '' : 's'}${settings?.skipCorrect ? ' · skipping correct' : ''}`;

  return (
    <>
    <main className="main" id="main-content" role="main">
    <div className="page-shell">

      {/* Fixed-position timer overlay — position:fixed in CSS */}
      <CvTimer />

      {/* Demo mode notice */}
      {settings?._isDemo && (
        <div style={{
          padding: '8px 14px', marginBottom: 10, fontSize: 12,
          background: 'rgba(246,213,138,0.08)', border: '1px solid rgba(246,213,138,0.22)',
          borderRadius: 4, color: 'rgba(246,213,138,0.82)',
        }} role="note">
          Demo mode — showing sample questions.{' '}
          <a href="/mcq" style={{ color: 'inherit' }}>Go to MCQ Setup</a> to choose your own filters.
        </div>
      )}

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
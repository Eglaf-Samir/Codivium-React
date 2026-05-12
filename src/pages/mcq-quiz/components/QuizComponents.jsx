// components/QuizComponents.jsx — class names match mcq-quiz.css exactly
import React, { useState, useEffect, useRef } from 'react';
import renderContent from '../utils/renderContent.jsx';
import { useTimer }   from '../hooks/useTimer.js';

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ answers, total }) {
  const answered = answers.length;
  return (
    <div className="progress-seg-wrap">
      <div className="progress-seg-track" id="progressTrack"
        role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total}>
        {Array.from({ length: total }, (_, i) => {
          const ans = answers[i];
          const cls = ans
            ? 'seg ' + (ans.isPeek ? 'answered-peeked' : ans.isCorrect ? 'answered-correct' : 'answered-wrong')
            : 'seg';
          return <div key={i} className={cls} data-idx={i} />;
        })}
      </div>
      <div className="progress-seg-label" id="progressLabel">
        {answered} answered · {total - answered} remaining
      </div>
    </div>
  );
}

// ── Timer — .cv-timer is position:fixed top-right in mcq-quiz.css ─────────────

function buildTicks() {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI;
    const outer = 29, inner = i % 3 === 0 ? 24 : 27;
    out.push({
      x1: (32 + Math.sin(a) * outer).toFixed(2), y1: (32 - Math.cos(a) * outer).toFixed(2),
      x2: (32 + Math.sin(a) * inner).toFixed(2), y2: (32 - Math.cos(a) * inner).toFixed(2),
      major: i % 3 === 0,
    });
  }
  return out;
}
const TICKS = buildTicks();

export function CvTimer() {
  const { hidden, toggleHidden, digital, secDeg, minDeg, hourDeg, handCoords } = useTimer();
  useEffect(() => {
    document.body.classList.toggle('timer-hidden', hidden);
    return () => document.body.classList.remove('timer-hidden');
  }, [hidden]);
  const sec  = handCoords(secDeg, 24);
  const min  = handCoords(minDeg, 21);
  const hour = handCoords(hourDeg, 14);
  return (
    <div className="cv-timer" id="cvTimerContainer" data-role="timer">
      <div className="cv-timer-widget" id="cvTimer">
        <svg className="cv-timer-face" id="cvTimerSvg" width="72" height="72" viewBox="0 0 64 64"
          aria-label={`Elapsed time: ${digital}`}>
          <circle cx="32" cy="32" r="30" fill="rgba(10,11,20,0.9)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
          <g id="cvTimerTicks">
            {TICKS.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={t.major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'}
                strokeWidth={t.major ? 1.5 : 1} strokeLinecap="round"/>
            ))}
          </g>
          <line id="cvTimerHourHand" x1="32" y1="32" x2={hour.x2} y2={hour.y2}
            stroke="rgba(245,245,252,0.75)" strokeWidth="3" strokeLinecap="round"/>
          <line id="cvTimerMinHand" x1="32" y1="32" x2={min.x2} y2={min.y2}
            stroke="rgba(245,245,252,0.85)" strokeWidth="2" strokeLinecap="round"/>
          <line id="cvTimerSecHand" x1="32" y1="32" x2={sec.x2} y2={sec.y2}
            stroke="rgba(246,213,138,0.90)" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="32" cy="32" r="2.5" fill="rgba(246,213,138,0.95)"/>
        </svg>
        <div className="cv-timer-digital" id="cvTimerDigital">{digital}</div>
      </div>
      <button className="cv-timer-toggle" id="cvTimerToggle" type="button"
        aria-label={hidden ? 'Show timer' : 'Hide timer'} onClick={toggleHidden}>
        {hidden
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    </div>
  );
}

// ── Peek warning ──────────────────────────────────────────────────────────────

export function PeekWarning({ visible, onConfirm, onCancel }) {
  if (!visible) return null;
  return (
    <div className="peek-warning" id="peekWarning" role="alert">
      <div className="peek-warning-text">
        <strong>Show the correct answer?</strong>{' '}
        This will be recorded as a peek and won't count as correct.
      </div>
      <div className="peek-warning-actions">
        <button className="ghost ghost-mini" id="btnPeekCancel" type="button" onClick={onCancel}>Cancel</button>
        <button className="ghost ghost-mini peek-confirm" id="btnPeekConfirm" type="button" onClick={onConfirm}>Show Answer</button>
      </div>
    </div>
  );
}

// ── Tutorial panel ────────────────────────────────────────────────────────────

export function TutorialPanel({ question, isOpen }) {
  return (
    <aside className="window quiz-tutorial-panel glow-follow" id="tutorialPanel"
      aria-label="Mini tutorial" hidden={!isOpen || undefined}>
      <div className="window-pad tutorial-pad">
        <div className="label" style={{ marginBottom: 10 }}>Mini Tutorial</div>
        <div id="nanoTutorialBody" aria-live="polite" style={{ overflowY: 'auto', flex: 1 }}>
          {isOpen && question?.nanoTutorial ? renderContent(question.nanoTutorial) : null}
        </div>
      </div>
    </aside>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────
// Tags, progress bar and meta live in McqQuizPage — this is just the card.

export function QuestionCard({
  question, index, total, state,
  onSubmit, onPeek, onPeekConfirm, onPeekCancel,
  onToggleTutorial, onAdvancePeek, onBack,
}) {
  const [selected, setSelected] = useState([]);
  const prevIdRef = useRef(null);

  useEffect(() => {
    if (!question || question.id === prevIdRef.current) return;
    prevIdRef.current = question.id;
    setSelected([]);
  }, [question?.id]);

  useEffect(() => {
    if (!question) return;
    function onKey(e) {
      if (state.locked) return;
      const key = e.key;
      if (key >= '1' && key <= '9') {
        const idx = Number(key) - 1;
        if (idx < question.options.length) {
          setSelected(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
          e.preventDefault();
        }
      }
      if (key === 'Enter' && selected.length > 0) { onSubmit(selected); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [question, state.locked, selected, onSubmit]);

  if (!question) return null;

  const locked     = state.locked;
  const lastAns    = locked && state.answers.length ? state.answers[state.answers.length - 1] : null;
  const correctSet = new Set(question.correctIndices);
  const lastSelSet = lastAns ? new Set(lastAns.selected) : new Set();
  const isPeek     = lastAns?.isPeek;

  return (
    <section className="window glow-follow" id="quizCard" aria-label="Quiz question">
      <div className="window-pad">

        <div className="qtext" id="qText" data-role="question">{renderContent(question.question)}</div>
        <div className="divider" />

        <div className="options" id="options" role="group" aria-label="Answer choices" data-role="options">
          {question.options.map((opt, i) => {
            const isChecked = locked ? lastSelSet.has(i) : selected.includes(i);
            const isCorrect = locked && correctSet.has(i);
            const isWrong   = locked && !correctSet.has(i) && lastSelSet.has(i);
            const cls = ['opt'];
            if (locked)    cls.push('locked');
            if (isChecked) cls.push('user-selected');
            if (isCorrect) cls.push('correct');
            if (isWrong)   cls.push('wrong');
            return (
              <label key={i} className={cls.join(' ')} htmlFor={`opt_${i}`}>
                <input type="checkbox" id={`opt_${i}`} name="answer" value={String(i)}
                  checked={isChecked} disabled={locked}
                  onChange={() => {
                    if (locked) return;
                    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
                  }}
                />
                <span>{renderContent(opt)}</span>
              </label>
            );
          })}
        </div>

        <PeekWarning visible={state.peekWarning}
          onConfirm={() => onPeekConfirm(selected)} onCancel={onPeekCancel} />

        <div className="quiz-actions" data-role="next">
          <button className="ghost" id="btnBack" type="button" data-role="exit" onClick={onBack}>← Setup</button>
          <div className="quiz-btn-row">
            {question.nanoTutorial && (
              <button className="ghost ghost-mini" id="btnTutorial" type="button" onClick={onToggleTutorial}>
                {state.tutorialOpen ? 'Hide Tutorial' : 'Tutorial'}
              </button>
            )}
            {!locked && (
              <button className="ghost ghost-mini" id="btnPeek" type="button" onClick={onPeek}>
                View Answer
              </button>
            )}
            {!locked && (
              <button className="btn" id="btnSubmit" type="button"
                disabled={selected.length === 0} onClick={() => onSubmit(selected)}>
                Submit
              </button>
            )}
            {locked && isPeek && (
              <button className="ghost" id="btnNextPeek" type="button" onClick={onAdvancePeek}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Summary — must include 'show': CSS hides .summary { display:none } by default

function ReviewItem({ answer, index }) {
  const { q, selected, isPeek, isCorrect } = answer;
  const correctSet  = new Set(q.correctIndices);
  const selectedSet = new Set(selected);
  return (
    <div className="review-item">
      <div className="review-item-head">
        <div className="review-num">Q{index + 1}</div>
        <div className={`review-status-badge ${isPeek ? 'peeked' : isCorrect ? 'correct' : 'wrong'}`}>
          {isPeek ? 'Revealed' : isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      </div>
      <div className="review-item-body">
        <div className="review-q">{renderContent(q.question)}</div>
        <div className="review-options">
          {q.options.map((opt, i) => {
            const isC = correctSet.has(i), isS = selectedSet.has(i);
            return (
              <div key={i} className={`review-opt${isC ? ' correct' : isS ? ' wrong' : ''}`}>
                <span className="review-opt-icon">{isC ? '\u2713' : isS ? '\u2717' : '\u00b7'}</span>
                <span>{renderContent(opt)}</span>
              </div>
            );
          })}
        </div>
        {q.explanation && (
          <div className="review-explanation">
            <div className="review-explanation-label">Explanation</div>
            <div>{renderContent(q.explanation)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SummaryView({ state, onRestart, onAdjust }) {
  const total = state.questions.length;
  return (
    <div className="summary show" id="summary" aria-label="Quiz summary">
      <div className="summary-grid">
        <div className="metric"><div className="n">Total</div><div className="v" id="mTotal">{total}</div></div>
        <div className="metric"><div className="n">Correct</div>
          <div className="v" id="mCorrect" style={{ color: 'rgba(34,197,94,0.90)' }}>{state.correctCount}</div>
        </div>
        <div className="metric"><div className="n">Incorrect</div>
          <div className="v" id="mWrong" style={{ color: 'rgba(255,92,90,0.90)' }}>
            {total - state.correctCount - state.peekCount}
          </div>
        </div>
        <div className="metric"><div className="n">Peeked</div><div className="v" id="mPeeked">{state.peekCount}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="ghost" id="btnAdjust" type="button" onClick={onAdjust}>Adjust Filters</button>
        <button className="btn" id="btnRestart" type="button" onClick={onRestart}>Restart</button>
      </div>
      <div className="review-list" id="reviewList" style={{ marginTop: 20 }}>
        {state.answers.map((ans, i) => <ReviewItem key={i} answer={ans} index={i} />)}
      </div>
    </div>
  );
}

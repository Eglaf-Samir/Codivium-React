// src/pages/mcq/McqQuizPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Demo question bank
const DEMO_QUESTIONS = [
  { id:'q1', category:'Arrays', difficulty:'basic', text:'What is the time complexity of accessing an element by index in an array?',
    options:['O(1)','O(n)','O(log n)','O(n²)'], correct:[0], multiSelect:false,
    explanation:'Array elements are stored contiguously, so index access is O(1).' },
  { id:'q2', category:'Strings', difficulty:'basic', text:'Which method returns the number of characters in a Python string?',
    options:['str.count()','str.size()','len(str)','str.length()'], correct:[2], multiSelect:false,
    explanation:'len() is the built-in function for string length in Python.' },
  { id:'q3', category:'Stacks', difficulty:'intermediate', text:'Which data structure is commonly used to implement a function call stack?',
    options:['Queue','Array','Stack','Linked List'], correct:[2], multiSelect:false,
    explanation:'A stack (LIFO) naturally models function call/return semantics.' },
  { id:'q4', category:'Hash Tables', difficulty:'intermediate', text:'Which of the following are valid collision resolution strategies? (Select all that apply)',
    options:['Chaining','Open Addressing','Linear Probing','Binary Search'], correct:[0,1,2], multiSelect:true,
    explanation:'Chaining, open addressing (including linear probing) are all collision resolution techniques.' },
  { id:'q5', category:'Trees', difficulty:'advanced', text:'What is the height of a balanced binary tree with n nodes?',
    options:['O(n)','O(log n)','O(n log n)','O(1)'], correct:[1], multiSelect:false,
    explanation:'A balanced binary tree has height O(log n).' },
  { id:'q6', category:'Dynamic Programming', difficulty:'advanced', text:'Which problems are best solved with dynamic programming? (Select all that apply)',
    options:['Fibonacci sequence','Shortest path in weighted graph','Sorting an array','Longest common subsequence'], correct:[0,1,3], multiSelect:true,
    explanation:'DP is used for overlapping subproblems and optimal substructure: Fibonacci, shortest paths (Bellman-Ford), and LCS.' },
  { id:'q7', category:'Graphs', difficulty:'intermediate', text:'Which algorithm finds the shortest path in an unweighted graph?',
    options:['DFS','BFS','Dijkstra','Bellman-Ford'], correct:[1], multiSelect:false,
    explanation:'BFS explores level by level, guaranteeing shortest path in unweighted graphs.' },
  { id:'q8', category:'Sorting', difficulty:'basic', text:'What is the average-case time complexity of QuickSort?',
    options:['O(n)','O(n log n)','O(n²)','O(log n)'], correct:[1], multiSelect:false,
    explanation:'QuickSort is O(n log n) on average due to balanced partitioning.' },
  { id:'q9', category:'Linked Lists', difficulty:'intermediate', text:'What is the time complexity of inserting at the head of a singly linked list?',
    options:['O(n)','O(log n)','O(1)','O(n log n)'], correct:[2], multiSelect:false,
    explanation:'Head insertion only requires updating the head pointer — O(1).' },
  { id:'q10', category:'Recursion', difficulty:'advanced', text:'Which of the following are base cases for recursive Fibonacci? (Select all that apply)',
    options:['F(0)=0','F(1)=1','F(2)=1','F(-1)=0'], correct:[0,1], multiSelect:true,
    explanation:'Standard Fibonacci base cases are F(0)=0 and F(1)=1.' },
];

function Timer() {
  const [secs, setSecs] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const fmt = h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return (
    <div className="cv-timer" aria-label="Session timer">
      <button className="cv-timer-toggle" type="button" title="Toggle timer"
        onClick={() => setVisible(v => !v)}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
      {visible && (
        <div className="cv-timer-widget">
          <div className="cv-timer-digital" aria-live="off" aria-atomic="true">{fmt}</div>
        </div>
      )}
    </div>
  );
}

export default function McqQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories = [], difficulty = 'basic', qCount = 10 } = location.state || {};

  // Build question set
  const questions = (() => {
    let pool = DEMO_QUESTIONS.filter(q =>
      (categories.length === 0 || categories.includes(q.category)) &&
      q.difficulty === difficulty
    );
    if (pool.length === 0) pool = [...DEMO_QUESTIONS];
    // Shuffle and take qCount
    return pool.sort(() => Math.random() - 0.5).slice(0, Math.min(qCount, pool.length));
  })();

  const [idx,         setIdx]         = useState(0);
  const [answers,     setAnswers]      = useState({});   // qId → number[]
  const [submitted,   setSubmitted]    = useState({});   // qId → boolean
  const [peekWarning, setPeekWarning]  = useState(false);
  const [showSummary, setShowSummary]  = useState(false);
  const [showTutorial,setShowTutorial] = useState(false);

  const q = questions[idx];
  const sel = answers[q?.id] || [];
  const isSubmitted = !!submitted[q?.id];
  const answered = Object.keys(submitted).length;

  const toggleOption = (oi) => {
    if (isSubmitted) return;
    setAnswers(prev => {
      const cur = prev[q.id] || [];
      if (q.multiSelect) {
        return { ...prev, [q.id]: cur.includes(oi) ? cur.filter(x => x !== oi) : [...cur, oi] };
      } else {
        return { ...prev, [q.id]: cur[0] === oi ? [] : [oi] };
      }
    });
  };

  const handleSubmit = () => {
    if (!sel.length) return;
    setSubmitted(prev => ({ ...prev, [q.id]: true }));
  };

  const isCorrect = (qid) => {
    const q_ = questions.find(x => x.id === qid);
    const a  = answers[qid] || [];
    if (!q_) return false;
    return q_.correct.length === a.length && q_.correct.every(c => a.includes(c));
  };

  const handleNext = () => {
    if (idx < questions.length - 1) setIdx(i => i + 1);
    else setShowSummary(true);
  };

  const handlePeek = () => {
    if (!isSubmitted) { setPeekWarning(true); return; }
    handleNext();
  };

  const summaryStats = {
    total:   questions.length,
    correct: Object.keys(submitted).filter(isCorrect).length,
    wrong:   Object.keys(submitted).filter(id => !isCorrect(id)).length,
    peeked:  0,
  };

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (showSummary) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 6 && n <= questions[idx]?.options.length) {
        toggleOption(n - 1);
      }
      if (e.key === 'Enter') handleSubmit();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [idx, isSubmitted, sel, showSummary]);

  if (!questions.length) {
    return (
      <main id="main-content" className="main" role="main">
        <div className="page-shell" style={{ padding: '40px', textAlign: 'center' }}>
          <p>No questions found for selected filters.</p>
          <button className="ghost" onClick={() => navigate('/mcq')}>← Back to Setup</button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="main" role="main">
      <div className="watermarks" aria-hidden="true">
        <div className="wm1">CODIVIUM</div><div className="wm2">CODIVIUM</div><div className="wm3">CODIVIUM</div>
      </div>
      <Timer/>

      <div className="page-shell">
        <div className="quiz-stage" id="quizStage">

          {/* ── Quiz card ── */}
          {!showSummary && q && (
            <section className="window glow-follow" id="quizCard" aria-label="Quiz question">
              <div className="window-pad">
                <div className="quiz-top">
                  <div className="tags" aria-label="Question tags">
                    <div className="tag gold">{q.category}</div>
                    <div className="tag">{q.difficulty[0].toUpperCase()+q.difficulty.slice(1)}</div>
                    {q.multiSelect && <div className="tag tag-multi">Select all that apply</div>}
                  </div>
                  <div className="quiz-top-meta">
                    <div className="qmeta">{idx + 1} / {questions.length}</div>
                  </div>
                </div>

                <div className="progress-seg-wrap" aria-label="Quiz progress">
                  <div className="progress-seg-track" role="progressbar"
                    aria-valuenow={answered} aria-valuemin="0" aria-valuemax={questions.length}
                    style={{ '--progress': `${(answered / questions.length) * 100}%` }}/>
                  <div className="progress-seg-label">{answered} answered · {questions.length - answered} remaining</div>
                </div>

                <div className="divider"/>

                <div className="qtext" role="heading" aria-level="2" aria-live="polite">{q.text}</div>

                <div className="options" role="group" aria-label="Answer choices">
                  {q.options.map((opt, oi) => {
                    const isSel = sel.includes(oi);
                    const isCorr = q.correct.includes(oi);
                    let cls = 'option';
                    if (isSubmitted) {
                      if (isCorr) cls += ' option-correct';
                      else if (isSel) cls += ' option-wrong';
                    } else if (isSel) {
                      cls += ' option-selected';
                    }
                    return (
                      <button key={oi} className={cls} type="button"
                        aria-pressed={isSel} onClick={() => toggleOption(oi)}>
                        <span className="option-key">{oi + 1}</span>
                        <span className="option-text">{opt}</span>
                        {isSubmitted && isCorr && <span className="option-tick" aria-hidden="true">✓</span>}
                        {isSubmitted && isSel && !isCorr && <span className="option-cross" aria-hidden="true">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className={`answer-feedback ${isCorrect(q.id) ? 'feedback-correct' : 'feedback-wrong'}`} role="alert">
                    <strong>{isCorrect(q.id) ? '✓ Correct!' : '✗ Incorrect'}</strong>
                    {' — '}{q.explanation}
                  </div>
                )}

                {peekWarning && (
                  <div className="peek-warning" role="alert">
                    <div className="peek-warning-text">Are you sure you want to skip without answering?</div>
                    <div className="peek-warning-actions">
                      <button className="ghost ghost-mini" type="button" onClick={() => setPeekWarning(false)}>Cancel</button>
                      <button className="ghost ghost-mini peek-confirm" type="button"
                        onClick={() => { setPeekWarning(false); handleNext(); }}>Skip</button>
                    </div>
                  </div>
                )}

                <div className="quiz-actions">
                  <button className="ghost" type="button" onClick={() => navigate('/mcq')}>← Back to Setup</button>
                  <div className="quiz-btn-row">
                    {!isSubmitted
                      ? <button className="btn" type="button" onClick={handleSubmit} disabled={!sel.length}>Submit</button>
                      : <button className="btn" type="button" onClick={handleNext}>
                          {idx < questions.length - 1 ? 'Next →' : 'View Results'}
                        </button>
                    }
                  </div>
                </div>

                <p className="help help--quiz-tip">Tip: <strong>1–{q.options.length}</strong> to toggle options, <strong>Enter</strong> to submit.</p>
              </div>
            </section>
          )}

          {/* ── Summary ── */}
          {showSummary && (
            <section className="window summary glow-follow" aria-label="Quiz summary">
              <div className="window-pad">
                <h1 className="h1">Session Summary</h1>
                <p className="lede">Here's how you did. Review each question below, then restart or adjust your filters.</p>
                <div className="divider"/>
                <div className="summary-grid" aria-label="Summary metrics">
                  {[['Total', summaryStats.total],['Correct', summaryStats.correct],
                    ['Wrong', summaryStats.wrong],['Peeked', summaryStats.peeked]].map(([n, v]) => (
                    <div key={n} className="metric"><div className="n">{n}</div><div className="v">{v}</div></div>
                  ))}
                </div>
                <div className="divider"/>
                <div className="review-list" aria-label="Question review">
                  {questions.map((q_, i) => (
                    <div key={q_.id} className={`review-item ${submitted[q_.id] ? (isCorrect(q_.id) ? 'review-correct' : 'review-wrong') : 'review-skipped'}`}>
                      <div className="review-num">Q{i + 1}</div>
                      <div className="review-text">{q_.text}</div>
                      <div className="review-result">
                        {!submitted[q_.id] ? 'Skipped' : isCorrect(q_.id) ? '✓ Correct' : '✗ Wrong'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="divider"/>
                <div className="summary-actions">
                  <button className="ghost" type="button" onClick={() => navigate('/mcq')}>Adjust Filters</button>
                  <button className="btn" type="button" onClick={() => { setIdx(0); setAnswers({}); setSubmitted({}); setShowSummary(false); }}>Restart</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

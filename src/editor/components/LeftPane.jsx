// components/LeftPane.jsx
// Left pane: Requirements / Hints / Unit Tests / Mini Tutorial tabs.
// Lock-aware: locked tabs show a lock icon and a tooltip on click.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderMd } from '../hooks/useExercise.js';
import { AttemptFirstNote } from './HelpPanel.jsx';

const LOCK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" className="cv-tab-lock-svg" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);


// ── Self-contained editor tour ──────────────────────────────────────────────
const TOUR_STEPS = [
  { target: '#paneLeft',          title: 'Exercise Window',          body: 'This is your primary reading pane. The Exercise tab shows the problem statement, constraints, and examples. Work through it carefully before writing code.' },
  { target: '#tab-left-req',      title: 'Exercise Tab',             body: 'Start here — read the full problem description, understand the inputs and outputs, and study the examples before touching the editor.' },
  { target: '#tab-left-hints',    title: 'Hints (Locked)',           body: 'Hints unlock after a set number of submissions. They guide you toward the solution without giving it away. Resist the urge to unlock early — the struggle builds skill.' },
  { target: '#tab-left-tests',    title: 'Unit Tests (Locked)',      body: 'View the full test suite after enough attempts. Tests reveal edge cases you may not have considered.' },
  { target: '#tab-left-tutorial', title: 'Mini Tutorial (Locked)',   body: 'A concise tutorial on the core concept behind this exercise. Unlocks after a set number of attempts — try the problem genuinely first.' },
  { target: '#paneRight',         title: 'Code Editor',              body: 'Write your Python solution here. The editor supports syntax highlighting, auto-indent, and multiple colour themes. Your code persists across sessions.' },
  { target: '#tab-right-candidate', title: 'Your Code Tab',          body: 'This is your working space. Write, test, and refine your solution here.' },
  { target: '#tab-right-solution', title: 'Suggested Solution (Locked)', body: "A model solution unlocks after you submit. Compare it to your own approach to deepen understanding — there's often more than one good answer." },
  { target: '#submitSolution',    title: 'Submit Button',            body: "When you're satisfied with your solution, submit it. Each submission is tracked. Your code is checked against the full test suite and feedback is shown below." },
  { target: '#paneReplIn',        title: 'REPL Input',               body: 'Run arbitrary Python here without submitting. Use it to test ideas, debug edge cases, or explore library functions. Hit the Run button or Ctrl+Enter.' },
  { target: '#paneReplOut',       title: 'REPL Output',              body: 'Output from your REPL runs appears here — print statements, errors, and return values. Clear it with the button in the pane header.' },
  { target: '#wsControls',        title: 'Layout Controls',          body: 'Switch between three workspace layouts: Default (all panes), Code Focus (editor maximised), and Read Focus (instructions maximised). The REPL toggle shows or hides the bottom row.' },
  { target: '#cvTimer',           title: 'Session Timer',            body: "Tracks how long you've spent on this exercise. The analog clock face and digital readout update every second. Click the eye toggle to hide or show it." },
];

function getRect(sel) {
  try {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 };
  } catch (_) { return null; }
}

function EditorTour({ step, total, onPrev, onNext, onEnd, rect }) {
  const { title, body } = TOUR_STEPS[step];
  // Position card below spotlight, clamped to viewport
  const cardW = 320, cardH = 200;
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  let top = 20, left = 20;
  if (rect) {
    top  = rect.top + rect.height + 10;
    left = rect.left;
    if (top + cardH > vh - 10) top = Math.max(10, rect.top - cardH - 10);
    if (left + cardW > vw - 10) left = vw - cardW - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;
  }
  return (
    <>
      {/* Dim overlay */}
      <div id="tourOverlay" style={{ position:'fixed', inset:0, zIndex:9000, pointerEvents:'none' }} />
      {/* Spotlight */}
      {rect && (
        <div id="tourSpotlight" style={{
          position: 'fixed',
          top: rect.top, left: rect.left,
          width: rect.width, height: rect.height,
          zIndex: 9001,
          outline: '3px solid rgba(246,213,138,0.75)',
          borderRadius: 4,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }} />
      )}
      {/* Card */}
      <div id="tourCard" role="dialog" aria-modal="true" aria-label="Guided tour"
        style={{ position:'fixed', top, left, width: cardW, zIndex: 9002 }}
        className="cv-tour-card"
      >
        <button className="cv-tour-close" aria-label="Close tour" onClick={onEnd}>&#x2715;</button>
        <div className="cv-tour-step-label">Step {step + 1} of {total}</div>
        <div className="cv-tour-title">{title}</div>
        <div className="cv-tour-body">{body}</div>
        <div className="cv-tour-actions">
          <div className="cv-tour-dots">
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className={`cv-tour-dot${i === step ? ' active' : ''}`} />
            ))}
          </div>
          <div className="cv-tour-nav">
            {step > 0 && <button className="cv-tour-nav-btn" onClick={onPrev}>Back</button>}
            {step < total - 1
              ? <button className="cv-tour-nav-btn primary" onClick={onNext}>Next</button>
              : <button className="cv-tour-nav-btn primary" onClick={onEnd}>Finish</button>
            }
          </div>
        </div>
      </div>
    </>
  );
}

function useTour() {
  const [active, setActive] = React.useState(false);
  const [step,   setStep]   = React.useState(0);
  const [rect,   setRect]   = React.useState(null);

  function advance(s) {
    setStep(s);
    setRect(getRect(TOUR_STEPS[s].target));
  }

  function start() { setStep(0); setRect(getRect(TOUR_STEPS[0].target)); setActive(true); }
  function end()   { setActive(false); }
  function next()  { const n = step + 1; if (n < TOUR_STEPS.length) advance(n); else end(); }
  function prev()  { const p = step - 1; if (p >= 0) advance(p); }

  useEffect(() => {
    if (!active) return;
    function onKey(e) { if (e.key === 'Escape') end(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  // Expose on window.CVD so the tour-btn onClick can call it if needed
  useEffect(() => {
    window.CVD = window.CVD || {};
    window.CVD.tour = { start, end };
  }, []);

  return { active, step, rect, start, end, next, prev, total: TOUR_STEPS.length };
}

function unlockMsg(cfg, key, elapsedSeconds, submissionCount) {
  const c = cfg && cfg[key];
  if (!c) return null;
  const secsLeft   = Math.max(0, c.minutes * 60 - elapsedSeconds);
  const attLeft    = Math.max(0, c.attempts - submissionCount);
  const parts = [];
  if (secsLeft > 0) {
    const m = Math.floor(secsLeft / 60);
    const s = secsLeft % 60;
    parts.push(m > 0 ? `${m}m ${s}s` : `${s}s`);
  }
  if (attLeft > 0 && !(c.attempts === 1 && submissionCount === 0 && key === 'tests')) {
    parts.push(`${attLeft} submission${attLeft !== 1 ? 's' : ''}`);
  }
  if (parts.length === 0) return 'Unlocking shortly…';
  return `Unlocks in: ${parts.join(' or ')}`;
}

function LockTooltip({ why, onForceUnlock, onClose, anchorRef, lockKey, locks, elapsedSeconds }) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  }, [anchorRef]);

  const whenMsg = locks && lockKey
    ? unlockMsg(locks.cfg, lockKey, elapsedSeconds || 0, locks.submissionCount || 0)
    : null;

  return createPortal(
    <div
      className="cv-lock-tooltip"
      role="tooltip"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
      }}
    >
      <button className="cv-lt-close" type="button" aria-label="Close" onClick={onClose}>&#x2715;</button>
      <div className="cv-lt-title">Locked</div>
      <p className="cv-lt-why">{why}</p>
      {whenMsg && <div className="cv-lt-when">{whenMsg}</div>}
      <button className="cv-lt-unlock" type="button" onClick={onForceUnlock}>
        Unlock anyway
      </button>
    </div>,
    document.body
  );
}

function UnitTestCard({ block, index }) {
  const [open, setOpen] = useState(false);
  const nameMatch = block.match(/^def\s+(\w+)\s*\(\s*\)/);
  const name = nameMatch ? nameMatch[1] : `test_${index + 1}`;
  return (
    <div className="cv-unit-test-card" data-test-name={name}>
      <button
        className="cv-unit-test-header"
        aria-expanded={open}
        aria-controls={`cv-ut-body-${index}`}
        type="button"
        onClick={() => setOpen(o => !o)}
      >
        <span className="cv-unit-test-index">{index + 1}</span>
        <code className="cv-unit-test-name">{name}()</code>
        <span className="cv-unit-test-status" aria-hidden="true" />
        <span className="cv-unit-test-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="cv-unit-test-body" id={`cv-ut-body-${index}`}>
          <pre><code>{block.trim()}</code></pre>
        </div>
      )}
    </div>
  );
}

function UnitTests({ source }) {
  if (!source) return <p className="hint-note">No unit tests provided.</p>;
  const blocks = source.trim().split(/\n(?=def test_)/);
  if (blocks.length <= 1) {
    return <pre className="code-area"><code>{source}</code></pre>;
  }
  return (
    <>
      {blocks.map((block, i) => (
        <UnitTestCard key={i} block={block} index={i} />
      ))}
    </>
  );
}


// Extracted into its own component so useRef is stable per tab slot
function TabWrapper({ tab, active, locked, showTooltip, locks, elapsedSeconds, onTabClick, onForceUnlock, onCloseTooltip }) {
  const btnRef = useRef(null);
  return (
    <div className="tab-btn-wrapper">
      <button
        ref={btnRef}
        id={`tab-left-${tab.key}`}
        role="tab"
        type="button"
        className={`tab-btn${active ? ' active' : ''}`}
        aria-selected={active}
        aria-controls={`panel-left-${tab.key}`}
        tabIndex={active ? 0 : -1}
        onClick={() => onTabClick(tab)}
        data-locked={locked ? 'true' : undefined}
      >
        {tab.label}
        {locked && <span className="cv-tab-lock" aria-label="Locked">{LOCK_SVG}</span>}
      </button>
      {showTooltip && (
        <LockTooltip
          why={locks.WHY[tab.lockKey]}
          anchorRef={btnRef}
          lockKey={tab.lockKey}
          locks={locks}
          elapsedSeconds={elapsedSeconds}
          onForceUnlock={() => onForceUnlock(tab.key)}
          onClose={onCloseTooltip}
        />
      )}
    </div>
  );
}

export default function LeftPane({ exercise, locks, elapsedSeconds, attemptNoteSeen, onDismissNote, onLearnMore }) {
  const [activeTab, setActiveTab] = useState('req');
  const [lockTooltip, setLockTooltip] = useState(null); // key of open tooltip

  const tabs = [
    { key: 'req',      label: 'Requirements', lockKey: null },
    { key: 'hints',    label: 'Hints',        lockKey: 'hints' },
    { key: 'tests',    label: 'Unit Tests',   lockKey: 'tests' },
    { key: 'tutorial', label: 'Mini Tutorial',lockKey: 'tutorial' },
  ];

  const handleTabClick = useCallback((tab) => {
    if (tab.lockKey && locks.isLocked(tab.lockKey)) {
      setLockTooltip(prev => prev === tab.key ? null : tab.key);
      return;
    }
    setActiveTab(tab.key);
    setLockTooltip(null);
  }, [locks]);

  const handleForceUnlock = useCallback((key) => {
    locks.unlock(key);
    setLockTooltip(null);
    setActiveTab(key);
  }, [locks]);

  const tour = useTour();

  return (
    <>
    {tour.active && createPortal(
      <EditorTour
        step={tour.step}
        total={tour.total}
        rect={tour.rect}
        onPrev={tour.prev}
        onNext={tour.next}
        onEnd={tour.end}
      />,
      document.body
    )}
    <section className="pane pane-tabbed glow-follow" id="paneLeft" aria-label="Exercise information">
      <div className="pane-head" role="tablist" aria-label="Information tabs">
        {tabs.map(tab => {
          const locked = tab.lockKey && locks.isLocked(tab.lockKey);
          const active = activeTab === tab.key && !locked;
          return (
            <TabWrapper
              key={tab.key}
              tab={tab}
              active={active}
              locked={locked}
              showTooltip={lockTooltip === tab.key}
              locks={locks}
              elapsedSeconds={elapsedSeconds}
              onTabClick={handleTabClick}
              onForceUnlock={handleForceUnlock}
              onCloseTooltip={() => setLockTooltip(null)}
            />
          );
        })}
        <button
          className="tab-btn tour-btn"
          id="tourBtn"
          type="button"
          aria-label="Guided tour"
          title="Take a guided tour of this page"
          onClick={tour.start}
        >
          <svg viewBox="0 0 24 24" fill="none" width="13" height="13"
            className="tour-btn-ico" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="7" r="0.5" fill="currentColor"/>
          </svg>
          Explore the Editor
        </button>
      </div>

      <div className="pane-body">
        {/* Requirements */}
        <div id="panel-left-req" role="tabpanel" aria-labelledby="tab-left-req"
          className={`tab-panel${activeTab === 'req' ? ' active' : ''}`}
          data-pane="left" data-panel="req"
          hidden={activeTab !== 'req' || undefined}>
          {!attemptNoteSeen && (
            <AttemptFirstNote onDismiss={onDismissNote} onLearnMore={onLearnMore} />
          )}
          {exercise
            ? (
              <>
                {exercise.name && <h2 className="pane-title">{exercise.name}</h2>}
                {(exercise.category || exercise.difficulty) && (
                  <div className="cv-exercise-meta">
                    {exercise.category   && <span className="pill pill-level">{exercise.category}</span>}
                    {exercise.difficulty && <span className="pill">{exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}</span>}
                    {exercise.testsTotal && <span className="pill">{exercise.testsTotal} tests</span>}
                  </div>
                )}
                {exercise.problemStatement && (
                  <div className="pane-lead"
                    dangerouslySetInnerHTML={{ __html: renderMd(exercise.problemStatement) }} />
                )}
                {exercise.priorAttempts > 0 && (
                  <p className="cv-prior-info">
                    Prior attempts: {exercise.priorAttempts}
                    {exercise.bestPriorScore != null && ` — best: ${exercise.bestPriorScore}%`}
                    {exercise.lastSolvedAt  && ` — last: ${exercise.lastSolvedAt}`}
                  </p>
                )}
              </>
            )
            : <p className="hint-note">Loading exercise…</p>
          }
        </div>

        {/* Hints */}
        <div id="panel-left-hints" role="tabpanel" aria-labelledby="tab-left-hints"
          className={`tab-panel${activeTab === 'hints' ? ' active' : ''}`}
          data-pane="left" data-panel="hints"
          hidden={activeTab !== 'hints' || undefined}>
          {exercise?.hints
            ? <div id="hintsContent" dangerouslySetInnerHTML={{ __html: renderMd(exercise.hints) }} />
            : <p className="hint-note">No hints provided.</p>
          }
        </div>

        {/* Unit Tests */}
        <div id="panel-left-tests" role="tabpanel" aria-labelledby="tab-left-tests"
          className={`tab-panel${activeTab === 'tests' ? ' active' : ''}`}
          data-pane="left" data-panel="tests"
          hidden={activeTab !== 'tests' || undefined}>
          <div id="unitTestsContent">
            <UnitTests source={exercise?.unitTestsSource} />
          </div>
        </div>

        {/* Mini Tutorial */}
        <div id="panel-left-tutorial" role="tabpanel" aria-labelledby="tab-left-tutorial"
          className={`tab-panel${activeTab === 'tutorial' ? ' active' : ''}`}
          data-pane="left" data-panel="tutorial"
          hidden={activeTab !== 'tutorial' || undefined}>
          {exercise?.miniTutorial
            ? <div id="miniTutorialContent" dangerouslySetInnerHTML={{ __html: renderMd(exercise.miniTutorial) }} />
            : <p className="hint-note">No tutorial provided.</p>
          }
        </div>
      </div>
    </section>
    </>
  );
}

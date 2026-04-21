// EditorTour.jsx — Guided tour for the exercise workspace.
// Parity with old HTML/JS: 13 steps, same targets + copy.
// Uses #tourOverlay / #tourSpotlight / #tourCard CSS from editor.css.
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const STEPS = [
  {
    target: '#paneLeft',
    title: 'Exercise Window',
    body: 'This is your primary reading pane. The Exercise tab shows the problem statement, constraints, and examples. Work through it carefully before writing code.',
  },
  {
    target: '#tab-left-req',
    title: 'Exercise Tab',
    body: 'Start here — read the full problem description, understand the inputs and outputs, and study the examples before touching the editor.',
  },
  {
    target: '#tab-left-hints',
    title: 'Hints (Locked)',
    body: 'Hints unlock after a set number of submissions. They guide you toward the solution without giving it away. Resist the urge to unlock early — the struggle builds skill.',
  },
  {
    target: '#tab-left-tests',
    title: 'Unit Tests (Locked)',
    body: 'View the full test suite after enough attempts. Tests reveal edge cases you may not have considered.',
  },
  {
    target: '#tab-left-tutorial',
    title: 'Mini Tutorial (Locked)',
    body: 'A concise tutorial on the core concept behind this exercise. Unlocks after a set number of attempts — try the problem genuinely first.',
  },
  {
    target: '#paneRight',
    title: 'Code Editor',
    body: 'Write your Python solution here. The editor supports syntax highlighting, auto-indent, and multiple colour themes. Your code persists across sessions.',
  },
  {
    target: '#tab-right-candidate',
    title: 'Your Code Tab',
    body: 'This is your working space. Write, test, and refine your solution here.',
  },
  {
    target: '#tab-right-solution',
    title: 'Suggested Solution (Locked)',
    body: "A model solution unlocks after you submit. Compare it to your own approach to deepen understanding — there's often more than one good answer.",
  },
  {
    target: '#submitSolution, .submit-btn',
    title: 'Submit Button',
    body: "When you're satisfied with your solution, submit it. Each submission is tracked. Your code is checked against the full test suite and feedback is shown below.",
  },
  {
    target: '#paneReplIn',
    title: 'REPL Input',
    body: 'Run arbitrary Python here without submitting. Use it to test ideas, debug edge cases, or explore library functions. Hit the Run button or Ctrl+Enter.',
  },
  {
    target: '#paneReplOut',
    title: 'REPL Output',
    body: 'Output from your REPL runs appears here — print statements, errors, and return values. Clear it with the button in the pane header.',
  },
  {
    target: '#wsControls',
    title: 'Layout Controls',
    body: 'Switch between three workspace layouts: Default (all panes), Code Focus (editor maximised), and Read Focus (instructions maximised). The REPL toggle shows or hides the bottom row.',
  },
  {
    target: '#cvTimer',
    title: 'Session Timer',
    body: "Tracks how long you've spent on this exercise. The analog clock face and digital readout update every second. Click the eye toggle to hide or show it.",
  },
];

function getTarget(selector) {
  if (!selector) return null;
  for (const sel of selector.split(',')) {
    try {
      const el = document.querySelector(sel.trim());
      if (el) return el;
    } catch (_) {}
  }
  return null;
}

function getRect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 };
}

function positionSpotlight(rect, spotEl) {
  if (!spotEl) return;
  if (!rect) { spotEl.style.display = 'none'; return; }
  spotEl.style.display = '';
  spotEl.style.top    = rect.top + 'px';
  spotEl.style.left   = rect.left + 'px';
  spotEl.style.width  = rect.width + 'px';
  spotEl.style.height = rect.height + 'px';
}

function positionCard(rect, cardEl) {
  if (!cardEl || !rect) return;
  const cardW = 320;
  const cardH = 180;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top;
  let left;
  if (rect.top + rect.height + cardH + 16 < vh) {
    top = rect.top + rect.height + 10;
  } else {
    top = rect.top - cardH - 10;
  }
  left = rect.left;
  if (left + cardW > vw - 10) left = vw - cardW - 10;
  if (left < 10) left = 10;
  if (top  < 10) top  = 10;
  cardEl.style.top  = top + 'px';
  cardEl.style.left = left + 'px';
}

export default function EditorTour({ active, onStop }) {
  const [idx, setIdx] = useState(0);
  const spotRef = useRef(null);
  const cardRef = useRef(null);

  const render = useCallback((i) => {
    const step = STEPS[i];
    if (!step) return;
    const target = getTarget(step.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    requestAnimationFrame(() => {
      const t = getTarget(step.target);
      const rect = getRect(t);
      positionSpotlight(rect, spotRef.current);
      positionCard(rect, cardRef.current);
      const firstBtn = cardRef.current?.querySelector('button');
      if (firstBtn) firstBtn.focus();
    });
  }, []);

  useEffect(() => {
    if (active) { setIdx(0); render(0); }
  }, [active, render]);

  useEffect(() => {
    if (!active) return;
    render(idx);
  }, [idx, active, render]);

  useEffect(() => {
    if (!active) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') { onStop(); return; }
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft')  setIdx((i) => Math.max(i - 1, 0));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, onStop]);

  useEffect(() => {
    if (!active) return undefined;
    const onResize = () => render(idx);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, idx, render]);

  // Focus trap
  const handleCardKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !cardRef.current) return;
    const focusable = Array.from(cardRef.current.querySelectorAll('button'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  if (!active) return null;

  const step    = STEPS[idx];
  const isFirst = idx === 0;
  const isLast  = idx === STEPS.length - 1;

  return createPortal(
    <>
      <div id="tourOverlay" style={{ display: 'block' }} />
      <div id="tourSpotlight" ref={spotRef} style={{ display: 'block' }} />
      <div
        id="tourCard"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Guided tour"
        tabIndex={-1}
        onKeyDown={handleCardKeyDown}
        style={{ display: 'block' }}
      >
        <button id="tourClose" type="button" aria-label="Close tour" onClick={onStop}>
          ✕
        </button>
        <div className="tour-step-label">Step {idx + 1} of {STEPS.length}</div>
        <div className="tour-title">{step.title}</div>
        <div className="tour-body">{step.body}</div>
        <div className="tour-actions">
          <div className="tour-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <div key={i} className={`tour-dot${i === idx ? ' active' : ''}`} />
            ))}
          </div>
          <div className="tour-nav">
            {!isFirst && (
              <button
                className="tour-nav-btn"
                id="tourPrev"
                type="button"
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                className="tour-nav-btn primary"
                id="tourNext"
                type="button"
                onClick={() => setIdx((i) => i + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="tour-nav-btn primary"
                id="tourEnd"
                type="button"
                onClick={onStop}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

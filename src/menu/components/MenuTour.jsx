// components/MenuTour.jsx
// Guided tour for the exercise menu. Same visual pattern as the dashboard tour.
// Uses ciTour* CSS classes from assets/components/core/tour.css.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const STEPS = [
  {
    selector: '.exercise-card',
    title: 'Exercise Cards',
    body: 'Each card represents one coding exercise. Click any card to open it in the exercise workspace. Cards show the exercise name, a short description, category, difficulty, and your completion status.',
  },
  {
    selector: '#drawerTab',
    title: 'Filters',
    body: 'Click this tab (or press Ctrl+Shift+F) to open the filter drawer. Filter by category, difficulty, completion status, exercise type, and mental model. Sort by name, difficulty, or status. Your filter selection is saved between visits.',
  },
  {
    selector: '#menuSearch',
    title: 'Search',
    body: 'Type to instantly filter exercises by name or description. Results update as you type — no need to press Enter.',
  },
  {
    selector: '.exercise-card',
    title: 'Exercise Name',
    body: 'The exercise name describes what you need to solve. Harder exercises tend to have longer, more specific names. Click any card to start.',
  },
  {
    selector: '.pill.cat, .exercise-card .pill',
    title: 'Category',
    body: 'The category tag shows which data structure or algorithm topic this exercise covers — for example: Arrays, Strings, Trees, or Dynamic Programming. Use the filter to focus on specific categories.',
  },
  {
    selector: '.pill.level, .exercise-card .pill:nth-child(2)',
    title: 'Difficulty Level',
    body: 'Exercises are rated Beginner, Intermediate, or Advanced. Start with Beginner to build confidence, then work up through Intermediate to Advanced as your skills develop.',
  },
  {
    selector: '.card-status, .exercise-card .card-status',
    title: 'Completion Status',
    body: 'The status indicator shows whether you have Not Started, Attempted, or Completed each exercise. Use the Completeness filter to see exercises by status — for example, to revisit ones you attempted but haven\'t solved yet.',
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

function positionSpotlight(el, spotEl) {
  if (!spotEl) return;
  if (!el) { spotEl.style.display = 'none'; return; }
  const r = el.getBoundingClientRect();
  const pad = 8;
  Object.assign(spotEl.style, {
    display: '',
    left:   `${r.left   - pad}px`,
    top:    `${r.top    - pad}px`,
    width:  `${r.width  + pad * 2}px`,
    height: `${r.height + pad * 2}px`,
  });
}

function positionCard(targetEl, cardEl) {
  if (!cardEl) return;
  const cw = cardEl.offsetWidth  || 460;
  const ch = cardEl.offsetHeight || 220;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = Math.round(vw / 2 - cw / 2);
  let top  = Math.round(vh / 2 - ch / 2);

  if (targetEl) {
    const r = targetEl.getBoundingClientRect();
    const belowTop = r.bottom + 16;
    const aboveTop = r.top - ch - 16;
    const clampL   = l => Math.max(12, Math.min(vw - cw - 12, l));
    if (belowTop + ch < vh)    { top = belowTop; left = clampL(r.left); }
    else if (aboveTop > 0)     { top = aboveTop; left = clampL(r.left); }
    else                       { left = Math.round(vw / 2 - cw / 2); top = Math.max(16, Math.round(vh / 2 - ch / 2)); }
  }

  cardEl.style.left = `${left}px`;
  cardEl.style.top  = `${top}px`;
}

export default function MenuTour({ active, onStop }) {
  const [idx, setIdx] = useState(0);
  const spotRef = useRef(null);
  const cardRef = useRef(null);

  const render = useCallback((i) => {
    const step = STEPS[i];
    if (!step) return;
    const target = getTarget(step.selector);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    requestAnimationFrame(() => {
      const t = getTarget(step.selector);
      positionSpotlight(t, spotRef.current);
      positionCard(t, cardRef.current);
      cardRef.current?.focus();
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
    if (!active) return;
    function onKey(e) {
      if (e.key === 'Escape')     { onStop(); return; }
      if (e.key === 'ArrowRight') { setIdx(i => Math.min(i + 1, STEPS.length - 1)); }
      if (e.key === 'ArrowLeft')  { setIdx(i => Math.max(i - 1, 0)); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, onStop]);

  if (!active) return null;

  const step      = STEPS[idx];
  const isFirst   = idx === 0;
  const isLast    = idx === STEPS.length - 1;

  function onTabKey(e) {
    if (e.key !== 'Tab' || !cardRef.current) return;
    const btns  = Array.from(cardRef.current.querySelectorAll('button:not(:disabled)'));
    if (!btns.length) return;
    const first = btns[0], last = btns[btns.length - 1];
    if (e.shiftKey && document.activeElement === first)  { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  return createPortal(
    <>
      <div className="ciTourBackdrop" id="menuTourBackdrop" />
      <div className="ciTourSpotlight" id="menuTourSpotlight" ref={spotRef} />
      <div
        className="ciTourCard"
        id="menuTourCard"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menuTourCardTitle"
        tabIndex={-1}
        onKeyDown={onTabKey}
        style={{ position: 'fixed' }}
      >
        <div className="ciTourCardHead">
          <div>
            <div className="ciTourCardTitle" id="menuTourCardTitle">{step.title}</div>
            <div className="ciTourCardMeta" id="menuTourStep">
              Step {idx + 1} of {STEPS.length}
            </div>
          </div>
          <button className="ciTourClose" id="menuTourClose" type="button"
            aria-label="Close tour" onClick={onStop}>&#x2715;</button>
        </div>

        <div className="ciTourCardBody" id="menuTourBody">{step.body}</div>

        <div className="ciTourFoot">
          <button className="ciTourNavBtn ciTourSkipBtn" id="menuTourSkip"
            type="button" onClick={onStop}>Skip</button>
          <div className="ciTourBtns">
            <button className="ciTourNavBtn" id="menuTourBack" type="button"
              disabled={isFirst}
              onClick={() => setIdx(i => Math.max(i - 1, 0))}>Back</button>
            <button className="ciTourNavBtn primary" id="menuTourNext" type="button"
              onClick={() => isLast ? onStop() : setIdx(i => i + 1)}>
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

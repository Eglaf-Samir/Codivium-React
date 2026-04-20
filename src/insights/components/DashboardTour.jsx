// src/insights/components/DashboardTour.jsx
// Dashboard guided tour — uses the existing ciTourCard/ciTourSpotlight CSS.
//
// Performance fix: visibleSteps DOM scan (querySelector + getComputedStyle × 20)
// was running on every InsightsDashboard render even when the tour was inactive.
// It now runs only when the user opens the tour (inside the start callback).
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { INFO_CONTENT } from '../data/infoContent.js';

const TOUR_STEPS = [
  { key: 'tour_layout_presets',   selector: '#cvLayoutPresetDock' },
  { key: 'tour_info_toggle',      selector: '#cvInfoPaneToggleBtn' },
  { key: 'tour_i_buttons',        selector: '.infoBtn.chipInfo' },
  { key: 'tour_cta_buttons',      selector: '.panelCtaBtn' },
  { key: 'tour_faq',              selector: '#openFaqLink' },
  { key: 'tour_glossary',         selector: '#openGlossaryLink' },
  { key: 'panel_scores',          selector: '.scoresPalette' },
  { key: 'codiviumScore',         selector: '#codiviumScore' },
  { key: 'breadthScore',          selector: '#breadthScore' },
  { key: 'interviewBreadthScore', selector: '#interviewBreadthScore' },
  { key: 'microBreadthScore',     selector: '#microBreadthScore' },
  { key: 'mcqBreadthScore',       selector: '#mcqBreadthScore' },
  { key: 'firstTryPassRate',      selector: '#firstTryPassRate' },
  { key: 'avgAttemptsToAC',       selector: '#avgAttemptsToAC' },
  { key: 'medianTimeToAC',        selector: '#medianTimeToAC' },
  { key: 'panel_depth',           selector: '.depthPanel' },
  { key: 'panel_heatmap',         selector: '.heatmapPanel' },
  { key: 'panel_time',            selector: '.timePanel' },
  { key: 'panel_exercise',        selector: '.donutPanel' },
  { key: 'panel_mcq',             selector: '.mcqPanel' },
];

/** Compute which steps are currently visible in the DOM. Called once on tour open. */
function computeVisibleSteps() {
  return TOUR_STEPS.filter(s => {
    try {
      const el = document.querySelector(s.selector);
      return el &&
             !el.classList.contains('isHidden') &&
             getComputedStyle(el).display !== 'none';
    } catch (_) { return false; }
  });
}

function getContent(key) {
  const info  = INFO_CONTENT[key] || {};
  const title = info.title || key;
  let body    = (info.body || '').replace(/\\n/g, '\n');
  const cutIdx = body.indexOf('Analysis of your results');
  if (cutIdx > 0) body = body.slice(0, cutIdx).trim();
  return { title, body };
}

export function useDashboardTour() {
  const [active,  setActive]  = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  // Steps are computed once when the tour opens, then held in state.
  // This avoids 20× querySelector + getComputedStyle on every render.
  const [steps, setSteps] = useState([]);

  const total = steps.length;

  const start = useCallback(() => {
    // Compute visible steps at open time (DOM is fully rendered by then)
    const visible = computeVisibleSteps();
    setSteps(visible);
    setStepIdx(0);
    setActive(true);
  }, []);

  const end  = useCallback(() => {
    setActive(false);
    setSteps([]);     // clear so stale steps don't linger
  }, []);

  const next = useCallback(() =>
    setStepIdx(s => Math.min(s + 1, total - 1)), [total]);
  const prev = useCallback(() =>
    setStepIdx(s => Math.max(s - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape')     end();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, end, next, prev]);

  // Wire the "Explore the Dashboard" button in the header
  useEffect(() => {
    const btn = document.getElementById('startTourBtn');
    if (!btn || btn._cvDashTourBound) return;
    btn._cvDashTourBound = true;
    btn.addEventListener('click', start);
    return () => { btn.removeEventListener('click', start); btn._cvDashTourBound = false; };
  }, [start]);

  return { active, stepIdx, steps, total, start, end, next, prev };
}

export default function DashboardTour({ tourState }) {
  const { active, stepIdx, steps, total, end, next, prev } = tourState;
  const cardRef = useRef(null);
  const step    = steps[stepIdx];
  const isLast  = stepIdx >= total - 1;

  const [spotRect, setSpotRect] = useState(null);
  const [cardPos,  setCardPos]  = useState({ left: 100, top: 100 });

  useLayoutEffect(() => {
    if (!active || !step) { setSpotRect(null); return; }
    const el = document.querySelector(step.selector);
    if (!el) { setSpotRect(null); return; }
    try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (_) {}
    const r = el.getBoundingClientRect();
    const m = 6;
    setSpotRect({
      left:   r.left   - m,
      top:    r.top    - m,
      width:  r.width  + m * 2,
      height: r.height + m * 2,
    });

    const pad = 14, cw = 560, ch = 280;
    const vw  = window.innerWidth, vh = window.innerHeight;
    let left  = r.right + pad;
    let top   = r.top;
    if (['panel_mcq','mcqEasy','mcqMedium','mcqHard'].includes(step.key)) top -= 80;
    if (left + cw > vw - pad) left = r.left - cw - pad;
    if (left < pad) left = pad;
    if (top + ch > vh - pad) top = vh - ch - pad;
    if (top < pad) top = pad;
    setCardPos({ left, top });
  }, [active, stepIdx, step]);

  if (!active || !step) return null;

  const { title, body } = getContent(step.key);

  return createPortal(
    <>
      <div className="ciTourBackdrop" onClick={end} />
      {spotRect && (
        <div
          className="ciTourSpotlight"
          style={{
            left:   spotRect.left,
            top:    spotRect.top,
            width:  spotRect.width,
            height: spotRect.height,
          }}
        />
      )}
      <div
        className="ciTourCard"
        ref={cardRef}
        style={{ left: cardPos.left, top: cardPos.top }}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard tour"
      >
        <div className="ciTourCardHead">
          <div>
            <div className="ciTourCardTitle">{title}</div>
            <div className="ciTourCardMeta">Step {stepIdx + 1} of {total}</div>
          </div>
          <button
            className="ciTourClose"
            type="button"
            aria-label="Close tour"
            onClick={end}
          >×</button>
        </div>
        <div className="ciTourCardBody">{body}</div>
        <div className="ciTourCalcNote">
          For full calculation details, see the FAQ and Glossary.
        </div>
        <div className="ciTourFoot">
          <button className="ciTourNavBtn" type="button" onClick={end}>Skip</button>
          <div className="ciTourBtns">
            <button
              className="ciTourNavBtn"
              type="button"
              disabled={stepIdx === 0}
              onClick={prev}
            >Back</button>
            <button
              className="ciTourNavBtn primary"
              type="button"
              onClick={isLast ? end : next}
            >{isLast ? 'Done' : 'Next'}</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// src/insights/utils/gridLayout.js
// Pure responsive-grid computation, extracted out of InsightsDashboard.jsx.
//
// RESPONSIVE FIX: getBreakpoint() previously read window.innerWidth — the
// full browser viewport — rather than the width actually available to this
// component. Once this dashboard is embedded in a larger host page, the
// real container can be meaningfully narrower than the viewport (host
// sidebar, content padding, a max-width wrapper), so window.innerWidth can
// select a layout too wide for the space actually available, causing
// overflow. getBreakpointForWidth() takes a measured width instead;
// InsightsDashboard supplies it from a ResizeObserver on the actual
// #ciMount container.

// ── Grid layout computation (mirrors __cvApplyDynamicGridLayout) ──────────────
export function computeGrid(panels, breakpoint) {
  const leftOn  = !!(panels.scores || panels.depth);
  const heatOn  = !!panels.heatmap;
  const rightOn = !!(panels.time  || panels.allocation);
  const mcqOn   = !!panels.mcq;

  if (!leftOn && !rightOn && !heatOn && !mcqOn) return null;

  const TOP_FR = 2.73, MCQ_FR = 1.3;
  let rows = [], colCount = 1, colTemplate = '1fr';

  if (breakpoint === 'wide') {
    const top = [];
    if (leftOn) top.push('left');
    if (heatOn) top.push('heat');
    if (rightOn) top.push('right');
    if (!top.length) { if (mcqOn) top.push('mcq'); else return null; }
    rows.push(top);
    colCount = top.length;
    // RESPONSIVE FIX: was minmax(520px,1fr) — two 520px columns plus
    // gaps/padding demanded 1040px+ before subtracting anything the *host*
    // page also claims (its own sidebar, content padding, a max-width
    // wrapper), which is exactly the "browser is 1440px but the dashboard
    // only has ~1000-1100px" scenario this container can find itself in
    // once embedded. minmax(0,1fr) lets columns shrink to fit the space
    // actually measured (see getBreakpointForWidth below) instead of
    // forcing overflow; panels/charts already have min-width:0 (see
    // dashboard.layout.css / assets/styles/*.css) so they can shrink
    // instead of clipping.
    colTemplate = colCount===3 ? '26.7fr 23.1fr 48.4fr'
                : colCount===2 ? 'minmax(0,1fr) minmax(0,1fr)'
                : '1fr';
    if (mcqOn && !(top.length===1 && top[0]==='mcq'))
      rows.push(new Array(colCount).fill('mcq'));
  } else if (breakpoint === 'medium') {
    const top = [];
    if (leftOn) top.push('left');
    if (rightOn) top.push('right');
    if (!top.length) { if (heatOn) top.push('heat'); else if (mcqOn) top.push('mcq'); else return null; }
    rows.push(top);
    colCount = top.length;
    colTemplate = colCount===2 ? 'minmax(0,1fr) minmax(0,1fr)' : '1fr'; // RESPONSIVE FIX: see wide-breakpoint comment above
    if (heatOn && !top.includes('heat')) rows.push(new Array(colCount).fill('heat'));
    if (mcqOn && !(top.length===1 && top[0]==='mcq')) rows.push(new Array(colCount).fill('mcq'));
  } else {
    const stack = [];
    if (leftOn)  stack.push('left');
    if (heatOn)  stack.push('heat');
    if (rightOn) stack.push('right');
    if (mcqOn)   stack.push('mcq');
    if (!stack.length) return null;
    rows = stack.map(a => [a]);
    colCount = 1; colTemplate = '1fr';
  }

  const areas = rows.map(r => `"${r.join(' ')}"`).join('\n');
  const rowTemplate = rows.map(r => r.includes('mcq') ? `minmax(0,${MCQ_FR}fr)` : `minmax(0,${TOP_FR}fr)`).join(' ');
  return { areas, colTemplate, rowTemplate };
}

export function getBreakpointForWidth(w) {
  if (!w) return 'narrow'; // unmeasured yet — default to the layout that can't overflow
  if (w <= 1100) return 'narrow';
  if (w <= 1400) return 'medium';
  return 'wide';
}

// Below this width, force Summary View regardless of the user's chosen
// mode — the full multi-panel grid genuinely doesn't work at phone width.
export const AUTO_SUMMARY_MAX_W = 900;
export function isForcedSummaryForWidth(w) {
  return w > 0 && w < AUTO_SUMMARY_MAX_W;
}

// Manages the dim-layer / clear-layer hole-punch spotlight system.
// Returns inline style objects — no imperative DOM manipulation in the caller.

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';

const PAD   = 14;
const TRANS = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';

function rectFor(selector) {
  if (!selector) return null;
  for (const s of selector.split(',')) {
    try {
      const el = document.querySelector(s.trim());
      if (el) return el.getBoundingClientRect();
    } catch (_) {}
  }
  return null;
}

function buildPolygon(r, W, H) {
  const top    = Math.max(0, r.top    - PAD);
  const left   = Math.max(0, r.left   - PAD);
  const right  = Math.max(0, W - r.right  - PAD);
  const bottom = Math.max(0, H - r.bottom - PAD);
  return {
    inset:   `${top}px ${right}px ${bottom}px ${left}px`,
    polygon: (
      `polygon(0 0, 100% 0, 100% 100%, 0 100%, ` +
      `0 ${top}px, ${left}px ${top}px, ` +
      `${left}px ${H - bottom}px, ${W - right}px ${H - bottom}px, ` +
      `${W - right}px ${top}px, 0 ${top}px)`
    ),
    ring: {
      top: r.top - PAD + 6,
      left: r.left - PAD + 6,
      width: r.width + (PAD - 6) * 2,
      height: r.height + (PAD - 6) * 2,
    },
    tip: {
      top:  r.bottom + PAD + 12 > window.innerHeight - 100
              ? r.top - 100 - PAD
              : r.bottom + PAD + 12,
      left: Math.min(r.left, window.innerWidth - 296),
    },
  };
}

export function useSpotlight(spotlightSelector, visible) {
  const [geo, setGeo] = useState(null);
  const roRef = useRef(null);

  const compute = useCallback(() => {
    if (!visible || !spotlightSelector) { setGeo(null); return; }
    const r = rectFor(spotlightSelector);
    if (!r) { setGeo(null); return; }
    setGeo(buildPolygon(r, window.innerWidth, window.innerHeight));
  }, [visible, spotlightSelector]);

  useLayoutEffect(() => {
    compute();
    const t = setTimeout(compute, 60);
    return () => clearTimeout(t);
  }, [compute]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener('resize', compute);
    if (spotlightSelector) {
      for (const s of spotlightSelector.split(',')) {
        try {
          const el = document.querySelector(s.trim());
          if (el && window.ResizeObserver) {
            const ro = new ResizeObserver(compute);
            ro.observe(el);
            roRef.current = ro;
            break;
          }
        } catch (_) {}
      }
    }
    return () => {
      window.removeEventListener('resize', compute);
      roRef.current?.disconnect();
      roRef.current = null;
    };
  }, [visible, spotlightSelector, compute]);

  if (!visible || !geo) {
    return {
      dimStyle:      { display: 'none' },
      clearStyle:    { display: 'none' },
      backdropExtra: {},
      ringStyle:     { display: 'none' },
      tipPos:        null,
    };
  }

  return {
    dimStyle: {
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.65)',
      clipPath: geo.polygon,
      transition: TRANS,
      pointerEvents: 'none',
    },
    clearStyle: {
      position: 'fixed', inset: 0, zIndex: 9997,
      clipPath: `inset(${geo.inset})`,
      transition: TRANS,
      pointerEvents: 'none',
    },
    backdropExtra: {
      clipPath: geo.polygon,
      transition: TRANS,
    },
    ringStyle: {
      position: 'fixed',
      top:    geo.ring.top,
      left:   geo.ring.left,
      width:  geo.ring.width,
      height: geo.ring.height,
      zIndex: 9999,
      borderRadius: 6,
      outline: '2.5px solid rgba(246,213,138,0.80)',
      boxShadow: '0 0 0 4px rgba(246,213,138,0.12)',
      pointerEvents: 'none',
      transition: 'top 0.45s cubic-bezier(0.23,1,0.32,1), left 0.45s cubic-bezier(0.23,1,0.32,1), width 0.45s cubic-bezier(0.23,1,0.32,1), height 0.45s cubic-bezier(0.23,1,0.32,1)',
    },
    tipPos: geo.tip,
  };
}

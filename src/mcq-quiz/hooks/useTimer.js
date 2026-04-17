// hooks/useTimer.js
import { useState, useEffect, useRef } from 'react';

function pad(n) { return n < 10 ? '0' + n : String(n); }

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);   // seconds
  const [hidden, setHidden]   = useState(() => {
    try { return localStorage.getItem('cv_timer_hidden') === '1'; } catch(_) { return false; }
  });
  const startRef = useRef(Date.now());
  const rafRef   = useRef(null);

  useEffect(() => {
    function tick() {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function toggleHidden() {
    setHidden(h => {
      const next = !h;
      try { localStorage.setItem('cv_timer_hidden', next ? '1' : '0'); } catch(_) {}
      return next;
    });
  }

  // Clock hand angles
  const secsF   = elapsed % 60;
  const secDeg  = (secsF / 60) * 360;
  const minDeg  = (elapsed % 3600) / 3600 * 360;
  const hourDeg = (elapsed % (12 * 3600)) / (12 * 3600) * 360;

  // Digital display
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor(elapsed / 60) % 60;
  const s = elapsed % 60;
  const digital = (h > 0 ? h + ':' : '') + pad(m) + ':' + pad(s);

  function handCoords(deg, len, cx = 32, cy = 32) {
    const r = (deg - 90) * Math.PI / 180;
    return {
      x2: (cx + Math.cos(r) * len).toFixed(2),
      y2: (cy + Math.sin(r) * len).toFixed(2),
    };
  }

  return { elapsed, hidden, toggleHidden, digital, secDeg, minDeg, hourDeg, handCoords };
}

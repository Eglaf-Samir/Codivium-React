// hooks/useTimer.js
// Session timer — tracks elapsed seconds since exercise load. Accepts an
// optional initialSeconds so the resume flow can start counting from the
// previously saved time rather than zero. reset(newInitial) lets the caller
// restart the clock at any baseline (0 for a fresh attempt; saved seconds
// for "continue where I left off").
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer({ initialSeconds = 0 } = {}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
  const [visible, setVisible] = useState(true);
  // Anchoring startRef in the past by initialSeconds means each tick computes
  // (now - startRef) / 1000 = initialSeconds + real-elapsed, so the display
  // and the value used for save / submit both reflect cumulative time.
  const startRef = useRef(Date.now() - initialSeconds * 1000);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
  }, []);

  const reset = useCallback((newInitial = 0) => {
    startRef.current = Date.now() - newInitial * 1000;
    setElapsedSeconds(newInitial);
  }, []);

  const toggleVisible = useCallback(() => setVisible(v => !v), []);

  useEffect(() => {
    start();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [start]);

  // Format for digital display
  const formatted = (() => {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  })();

  // Clock hand angles for SVG analogue clock
  const hands = (() => {
    const totalSec = elapsedSeconds;
    const sec = totalSec % 60;
    const min = (totalSec / 60) % 60;
    const hour = (totalSec / 3600) % 12;
    return {
      sec:  (sec  / 60)  * 360,
      min:  (min  / 60)  * 360,
      hour: (hour / 12)  * 360,
    };
  })();

  return { elapsedSeconds, formatted, hands, visible, toggleVisible, reset };
}

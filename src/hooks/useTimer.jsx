// hooks/useTimer.js
// Session timer — tracks elapsed seconds since exercise load.
// Exposes reset() so the exercise loader can restart the clock on new exercise.
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [visible, setVisible] = useState(true);
  const startRef = useRef(Date.now());
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setElapsedSeconds(0);
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

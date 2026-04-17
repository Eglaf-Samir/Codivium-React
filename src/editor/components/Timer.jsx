// components/Timer.jsx
// Analogue SVG clock + digital readout. Uses the useTimer hook.
import React from 'react';

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * 2 * Math.PI;
  const outer = 29, inner = i % 3 === 0 ? 24 : 27;
  return {
    x1: +(32 + Math.sin(a) * outer).toFixed(2),
    y1: +(32 - Math.cos(a) * outer).toFixed(2),
    x2: +(32 + Math.sin(a) * inner).toFixed(2),
    y2: +(32 - Math.cos(a) * inner).toFixed(2),
  };
});

const EYE_PATH = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8';
const EYE_OFF  = 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22';

function hand(cx, cy, angle, length, width) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x2: +(cx + Math.cos(rad) * length).toFixed(2),
    y2: +(cy + Math.sin(rad) * length).toFixed(2),
    strokeWidth: width,
  };
}

export default function Timer({ timer }) {
  const { formatted, hands, visible, toggleVisible } = timer;
  const cx = 32, cy = 32;
  const sec  = hand(cx, cy, hands.sec,  22, 1.5);
  const min  = hand(cx, cy, hands.min,  18, 2.0);
  const hour = hand(cx, cy, hands.hour, 13, 2.5);

  return (
    <div className="cv-timer" id="cvTimer" aria-label="Session timer">
      <button
        className="cv-timer-toggle"
        id="cvTimerToggle"
        type="button"
        title="Toggle timer"
        aria-label="Toggle timer visibility"
        onClick={toggleVisible}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d={visible ? EYE_PATH : EYE_OFF}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
          {!visible && <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />}
        </svg>
      </button>

      {visible && (
        <div className="cv-timer-widget" id="cvTimerWidget">
          <svg className="cv-timer-svg" viewBox="0 0 64 64" aria-hidden="true">
            {/* Tick marks */}
            {TICKS.map((tk, i) => (
              <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
                stroke="currentColor" strokeWidth={i % 3 === 0 ? 1.5 : 0.8} opacity="0.5" />
            ))}
            {/* Hands */}
            <line x1={cx} y1={cy} x2={hour.x2} y2={hour.y2}
              stroke="currentColor" strokeWidth={hour.strokeWidth} strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={min.x2} y2={min.y2}
              stroke="currentColor" strokeWidth={min.strokeWidth} strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={sec.x2} y2={sec.y2}
              stroke="var(--accent, #f6d58a)" strokeWidth={sec.strokeWidth} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="2" fill="currentColor" />
          </svg>
          <span className="cv-timer-digital" aria-live="off" aria-label={`Elapsed: ${formatted}`}>
            {formatted}
          </span>
        </div>
      )}
    </div>
  );
}

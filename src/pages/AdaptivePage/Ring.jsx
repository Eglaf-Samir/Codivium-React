// components/Ring.jsx
// SVG ring + difficulty step dots. Direct port of buildRingSvg() + buildDiffSteps().

import React from 'react';

const RING_COLORS = {
  ready:    'rgba(94,200,172,0.82)',
  draining: 'rgba(255,165,60,0.75)',
  gap:      'rgba(246,213,138,0.70)',
  locked:   'rgba(255,255,255,0.10)',
  normal:   'rgba(246,213,138,0.75)',
};

const TRACK_COLOR = 'rgba(255,255,255,0.07)';

export function Ring({ pct, state }) {
  const r     = 28;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const gap   = circ - dash;
  const offset = circ / 4;

  const fillColor = RING_COLORS[state] || RING_COLORS.normal;
  const textColor = pct === 0 ? 'rgba(255,255,255,0.18)' : fillColor;

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className="ap-ring-svg"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={TRACK_COLOR}
        strokeWidth="3.5"
      />

      {/* Fill arc */}
      {pct > 0 && (
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth="3.5"
          strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
          strokeDashoffset={offset.toFixed(2)}
          strokeLinecap="square"
          transform="rotate(-90 32 32)"
        />
      )}

      {/* Percentage label */}
      <text
        x="32" y="37"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        fill={textColor}
      >
        {pct}%
      </text>
    </svg>
  );
}

export function DiffSteps({ diff }) {
  // diff = [basic_complete, intermediate_complete, advanced_complete]
  return (
    <div className="ap-ring-diff">
      {diff.map((v, i) => {
        const isActive = v === 1 && (i === diff.length - 1 || diff[i + 1] === 0);
        let cls = 'ap-diff-step';
        if (v === 1) cls += isActive ? ' active' : ' earned';
        return <div key={i} className={cls} />;
      })}
    </div>
  );
}

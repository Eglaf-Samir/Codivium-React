// components/CategoryRings.jsx
// Port of renderRings(categories). Renders up to 8 category progress ring cards.

import React from 'react';
import { Ring, DiffSteps } from './Ring.jsx';

export default function CategoryRings({ categories }) {
  if (!categories || categories.length === 0) return null;

  const rings = categories.slice(0, 8);

  return (
    <div className="ap-rings-full-span">
      <div className="ap-section-label">Category progress</div>
      <div
        className="ap-rings-scroll"
        id="apRingsContainer"
        aria-label="Category progression rings"
        style={{ '--ring-count': rings.length }}
      >
        {rings.map((cat) => (
          <div
            key={cat.name}
            className={`ap-ring-card ap-ring-state-${cat.state}`}
            aria-label={`${cat.name}: ${cat.fill}% — ${cat.status}`}
          >
            <Ring pct={cat.fill} state={cat.state} />
            <div className="ap-ring-name">{cat.name}</div>
            <DiffSteps diff={cat.diff || [0, 0, 0]} />
            <div className="ap-ring-status">{cat.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

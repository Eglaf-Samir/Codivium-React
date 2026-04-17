// components/MilestoneBanner.jsx
// Port of renderMilestone(). Picks a milestone template and renders the banner.

import React from 'react';
import { pickTemplate, fillTemplate } from '../utils/templates.js';

export default function MilestoneBanner({ milestone }) {
  if (!milestone) return null;

  const tpl  = pickTemplate('milestone');
  const vars = {
    category:       milestone.category       || '',
    difficulty:     milestone.difficulty     || '',
    nextDifficulty: milestone.nextDifficulty || '',
  };
  const filled = fillTemplate(tpl, vars);

  return (
    <div
      className="ap-milestone-banner"
      id="apMilestoneBanner"
      role="status"
      aria-live="polite"
    >
      <span className="ap-milestone-icon" aria-hidden="true">✦</span>
      <div className="ap-milestone-content">
        <div className="ap-milestone-headline">{filled.headline}</div>
        <div className="ap-milestone-context">{milestone.context}</div>
      </div>
    </div>
  );
}

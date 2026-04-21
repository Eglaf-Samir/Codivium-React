// components/AlternativeCard.jsx
// Port of renderAlternatives(). Renders one alternative recommendation card.

import React from 'react';
import { recordRecommendationChoice } from '../../hooks/adaptiveUtils.js';
import { useSafeRedirect } from '../../hooks/useSafeRedirect.js';

export default function AlternativeCard({ alt }) {
  const safeNavigate = useSafeRedirect();

  function handleClick(e) {
    e.preventDefault();
    recordRecommendationChoice(alt.typeLabel || alt.type);
    safeNavigate(alt.href);
  }

  return (
    <div
      className={`ap-alt-card window glow-follow ap-alt-card--${alt.type || 'teal'}`}
      aria-label={alt.typeLabel}
    >
      <div className="ap-alt-pad">
        <div className="ap-alt-type">{alt.typeLabel}</div>
        <div className="ap-alt-headline">{alt.headline}</div>
        <div className="ap-alt-sub">{alt.sub}</div>
        {alt.sci && (
          <div className="ap-alt-sci">{alt.sci}</div>
        )}
        <a
          className="btn btn-alt"
          href={alt.href || '#'}
          onClick={handleClick}
        >
          {alt.cta || 'Launch →'}
        </a>
      </div>
    </div>
  );
}

export function AlternativesGrid({ alternatives }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <>
      <div className="ap-section-label">Alternatives</div>
      <div className="ap-alt-grid" id="apAltGrid" aria-label="Alternative recommendations">
        {alternatives.map((alt, i) => (
          <AlternativeCard key={i} alt={alt} />
        ))}
      </div>
    </>
  );
}

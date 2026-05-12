// components/BuildingMode.jsx
// Mode B: single recommendation card with animated profile depth meter.
// Port of renderBuildingMode(state).

import React, { useEffect, useRef } from 'react';
import { safeRedirect, recordRecommendationChoice } from '../utils/adaptive.js';
import { BUILDING_MODE_THRESHOLD, getOnboardingGoal, buildGhostHref } from '../utils/routing.js';

export default function BuildingMode({ state }) {
  const fillRef   = useRef(null);
  const threshold = BUILDING_MODE_THRESHOLD; // 12
  const count     = state.sessionCount || 0;
  const fillPct   = Math.min(100, Math.round((count / threshold) * 100));
  const primary   = state.primary || {};

  // Animate the profile meter fill after mount
  useEffect(() => {
    if (!fillRef.current) return;
    const id = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${fillPct}%`;
    }, 120);
    return () => clearTimeout(id);
  }, [fillPct]);

  // Ghost link: route based on onboarding goal
  const goal      = getOnboardingGoal();
  const ghostHref = buildGhostHref(goal);

  function handleCta(e) {
    e.preventDefault();
    recordRecommendationChoice(primary.type || 'building_continue');
    safeRedirect(primary.ctaHref);
  }

  return (
    <div id="apBuildingMode" aria-label="Building profile guidance">

      <div className="ap-header">
        <div className="ap-header-row">
          <div>
            <div className="ap-kicker">Adaptive Practice</div>
            <h1 className="ap-title">Building your profile</h1>
          </div>
          <div className="ap-last-session">
            <div className="ap-session-dot" />
            {state.lastSessionLabel || 'No sessions yet'}
          </div>
        </div>
        <div className="ap-subtitle">
          {`You're ${count} session${count !== 1 ? 's' : ''} in. A few more will give us enough to identify your specific strengths and gaps precisely.`}
        </div>
      </div>

      <div className="ap-section-label">Recommendation</div>

      <div className="window glow-follow ap-building-window">
        <div className="window-pad">

          <div className="ap-building-note" role="note">
            <span className="ap-building-icon" aria-hidden="true">◈</span>
            <span>
              Your profile is still building. This recommendation is based on limited
              evidence — it's a good starting point, but will become more precise after
              a few more sessions.
            </span>
          </div>

          <div className="ap-profile-meter" aria-label="Profile depth meter">
            <div className="ap-profile-meter-row">
              <span className="ap-profile-meter-label">Profile depth</span>
              <span className="ap-profile-meter-val">
                {`${count} of ~${threshold} sessions for full guidance`}
              </span>
            </div>
            <div
              className="ap-profile-track"
              role="progressbar"
              aria-valuenow={fillPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${count} of ${threshold} sessions completed`}
            >
              <div
                className="ap-profile-fill"
                ref={fillRef}
                style={{ width: '0%', transition: 'width 0.6s ease' }}
                data-fill={fillPct}
              />
            </div>
          </div>

          <div className="ap-headline ap-headline-sm">
            {primary.headline || ''}
          </div>
          <div className="ap-context ap-context-tight">
            {primary.context || ''}
          </div>

          {primary.sciShort && (
            <div className="ap-sci">
              <div className="ap-sci-text">{primary.sciShort}</div>
            </div>
          )}

          <div className="ap-cta-row">
            <a
              className="btn"
              href={primary.ctaHref || '/mcq-parent'}
              onClick={handleCta}
            >
              {(primary.ctaLabel || 'Continue') + ' →'}
            </a>
            <a className="ghost" href={ghostHref}>
              Try something different
            </a>
          </div>

        </div>
      </div>

    </div>
  );
}

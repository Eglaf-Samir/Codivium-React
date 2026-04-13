// components/PrimaryCard.jsx
// Port of renderPrimary(). Template engine, evidence bar, science toggle, CTA wiring.

import React, { useState, useEffect, useRef } from 'react';
import { pickTemplate, fillTemplate } from '../../hooks/adaptiveTemplates.js';
import { recordRecommendationChoice, recordDismissal } from '../../hooks/adaptiveUtils.js';
import { useSafeRedirect } from '../../hooks/useSafeRedirect.js';

export default function PrimaryCard({ primary }) {
  const [sciExpanded, setSciExpanded] = useState(false);
  const [dismissed,   setDismissed]   = useState(false);
  const fillRef      = useRef(null);
  const safeNavigate = useSafeRedirect();

  // Template — memoised so it doesn't re-pick on every re-render
  const templateRef = useRef(null);
  if (!templateRef.current || templateRef.current._type !== primary?.type) {
    if (primary) {
      const tpl    = pickTemplate(primary.type);
      const filled = fillTemplate(tpl, primary.templateVars || {});
      templateRef.current = { ...filled, _type: primary.type };
    } else {
      templateRef.current = null;
    }
  }
  const t = templateRef.current;

  // Evidence bar animation — delayed CSS-driven width update
  useEffect(() => {
    if (!fillRef.current || primary?.evidencePct == null) return;
    const id = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${primary.evidencePct}%`;
    }, 120);
    return () => clearTimeout(id);
  }, [primary?.evidencePct]);

  if (!primary) return null;

  // In building mode: use headline/context directly (no template engine).
  // In full mode: headline/context come from the template.
  const headline = primary.headline || t?.headline || '';
  const context  = primary.context  || t?.context  || '';
  const ctaText  = (t?.cta || primary.ctaLabel || 'Launch') + ' →';

  function handleCta(e) {
    e.preventDefault();
    recordRecommendationChoice(primary.type);
    safeNavigate(primary.ctaHref);
  }

  function handleNotToday() {
    recordDismissal(primary.type);
    setDismissed(true);
  }

  return (
    <div
      className={`ap-primary window glow-follow${dismissed ? ' ap-primary--dismissed' : ''}`}
      aria-label="Primary recommendation"
    >
      <div className="ap-primary-accent" aria-hidden="true" />
      <div className="ap-primary-pad">

        {/* Type tag */}
        <div className="ap-type-tag" id="apPrimaryTag" aria-label="Recommendation type">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
          </svg>
          <span>{primary.typeLabel || primary.type}</span>
        </div>

        <h2 className="ap-headline" id="apPrimaryHeadline">{headline}</h2>
        <div className="ap-context" id="apPrimaryContext">{context}</div>

        {/* Evidence bar — full mode only */}
        {primary.evidencePct != null && (
          <div className="ap-evidence" aria-label="Evidence confidence">
            <div className="ap-evidence-row">
              <span>Evidence confidence</span>
              <span className="ap-evidence-value" id="apEvidenceValue">
                {primary.evidence || ''}
              </span>
            </div>
            <div
              className="ap-evidence-track"
              role="progressbar"
              aria-label="Evidence confidence level"
              aria-valuenow={primary.evidencePct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="ap-evidence-fill"
                id="apEvidenceFill"
                ref={fillRef}
                style={{ width: '0%', transition: 'width 0.6s ease' }}
              />
            </div>
          </div>
        )}

        {/* Science note — full mode only */}
        {primary.sciShort && (
          <div className="ap-sci" role="note" aria-label="Scientific basis">
            <div className="ap-sci-text" id="apPrimarySci">{primary.sciShort}</div>
            {primary.sciLong && (
              <>
                <button
                  className="ap-sci-toggle"
                  type="button"
                  aria-expanded={sciExpanded}
                  onClick={() => setSciExpanded(v => !v)}
                >
                  {sciExpanded ? 'Why this works ↑' : 'Why this works ↓'}
                </button>
                {sciExpanded && (
                  <div
                    className="ap-sci-detail"
                    id="apPrimarySciDetail"
                    role="region"
                  >
                    {primary.sciLong}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CTA row */}
        <div className="ap-cta-row">
          <a
            className="btn"
            id="apPrimaryCta"
            href={primary.ctaHref || '#'}
            onClick={handleCta}
          >
            {ctaText}
          </a>
          {!dismissed && (
            <button
              className="ghost"
              type="button"
              onClick={handleNotToday}
              disabled={dismissed}
            >
              Not today
            </button>
          )}
          {dismissed && (
            <span className="ap-dismissed-label">Skipped for today</span>
          )}
        </div>

      </div>
    </div>
  );
}

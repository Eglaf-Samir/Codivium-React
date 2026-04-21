// Root tour component. Uses createPortal to render above everything.
import React from 'react';
import { createPortal } from 'react-dom';
import { useTourState } from '../../../hooks/useTourState.js';
import { useSpotlight } from '../../../hooks/useSpotlight.js';
import TourSlide       from './TourSlide.jsx';
import TourVideoModal  from './TourVideoModal.jsx';

export default function OnboardingTour() {
  const tour = useTourState();
  const spotlight = useSpotlight(
    tour.visible ? tour.currentStep?.spotlight : null,
    tour.visible
  );

  if (!tour.visible) return null;

  const { currentStep, step, totalSteps, formAnswers, isLast } = tour;

  const handleNext = () => {
    if (isLast) tour.complete();
    else        tour.next();
  };

  return createPortal(
    <>
      <div id="cvTourDimLayer" style={spotlight.dimStyle} aria-hidden="true" />
      <div id="cvTourClearLayer" style={spotlight.clearStyle} aria-hidden="true" />

      {spotlight.ringStyle.display !== 'none' && (
        <div className="cvt-spotlight visible" style={spotlight.ringStyle} aria-hidden="true" />
      )}

      {spotlight.tipPos && currentStep.spotlight && (
        <div className="cvt-tooltip visible" aria-hidden="true" style={{
          position: 'fixed',
          top:  spotlight.tipPos.top,
          left: spotlight.tipPos.left,
          zIndex: 10000,
        }}>
          <div className="cvt-tooltip-title">{currentStep.label}</div>
          <div className="cvt-tooltip-body">{currentStep.desc.slice(0, 100)}…</div>
        </div>
      )}

      <div
        id="cvOnboardingTour"
        className={`cvt-visible${currentStep.spotlight ? ' has-spotlight' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Codivium platform tour"
        style={currentStep.spotlight ? spotlight.backdropExtra : undefined}
      >
        <div className="cvt-scene">
          <div className="cvt-card">

            <div id="cvtSlidesWrap">
              <TourSlide
                step={currentStep}
                stepIndex={step}
                totalSteps={totalSteps}
                formAnswers={formAnswers}
                onAnswer={tour.answerForm}
                onOpenVideo={tour.openVideo}
              />
            </div>

            <div className="cvt-footer">
              <button className="cvt-btn cvt-btn-ghost" type="button"
                id="cvtSkipBtn" onClick={tour.skip}>
                Skip tour
              </button>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {step > 0 && (
                  <button className="cvt-btn cvt-btn-secondary" type="button"
                    id="cvtBackBtn" onClick={tour.back}>
                    ← Back
                  </button>
                )}
                <button className="cvt-btn cvt-btn-primary" type="button"
                  id="cvtNextBtn" onClick={handleNext}>
                  {currentStep.nextLabel || (isLast ? 'Launch session →' : 'Next →')}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <TourVideoModal videoKey={tour.videoKey} onClose={tour.closeVideo} />
    </>,
    document.body
  );
}

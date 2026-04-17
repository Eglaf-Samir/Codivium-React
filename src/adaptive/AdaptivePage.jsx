// AdaptivePage.jsx
// Top-level adaptive practice page component.
// Fetches state, routes to the correct mode, and handles sidebar active-link sync.

import React, { useEffect } from 'react';
import { useAdaptiveState }  from './hooks/useAdaptiveState.js';
import OrientationMode       from './components/OrientationMode.jsx';
import BuildingMode          from './components/BuildingMode.jsx';
import FullMode              from './components/FullMode.jsx';
import OnboardingTour        from './components/tour/OnboardingTour.jsx';
import { useGlowFollow } from '../shared/useGlowFollow.js';

export default function AdaptivePage() {
  useGlowFollow();
  const { data, loading } = useAdaptiveState();

  // Keep sidebar active link in sync (already set by inline script in HTML,
  // but confirm it after React mounts in case of hydration timing)
  useEffect(() => {
    try {
      document.querySelectorAll('.side-link').forEach(a => {
        const match = a.dataset.section === 'home';
        a.classList.toggle('active', match);
        if (match) a.setAttribute('aria-current', 'page');
        else       a.removeAttribute('aria-current');
      });
    } catch (_) {}
  }, []);

  if (loading) {
    return (
      <div className="adaptive-page">
        <div className="ap-loading" role="status" aria-live="polite">
          <div className="ap-loading-text">Loading your practice guidance…</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const mode = data.mode || 'orientation';

  return (
    <div className="adaptive-page">
      {mode === 'orientation' && <OrientationMode />}
      {mode === 'building'    && <BuildingMode state={data} />}
      {mode === 'full'        && <FullMode     state={data} />}
      <OnboardingTour />
    </div>
  );
}

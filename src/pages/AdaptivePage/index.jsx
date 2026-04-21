// AdaptivePage.jsx
// Top-level adaptive practice page component.
// Fetches state, routes to the correct mode, and handles sidebar active-link sync.

import React from 'react';
import { useAdaptiveState }  from '../../hooks/useAdaptiveState.js';
import OrientationMode       from './OrientationMode.jsx';
import BuildingMode          from './BuildingMode.jsx';
import FullMode              from './FullMode.jsx';
import OnboardingTour        from './tour/OnboardingTour.jsx';

export default function AdaptivePage() {
  const { data, loading } = useAdaptiveState();


  if (loading) {
    return (
      <main id="main-content" className="main adaptive-page" role="main">
        <div className="ap-loading" role="status" aria-live="polite">
          <div className="ap-loading-text">Loading your practice guidance…</div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const mode = data.mode || 'orientation';

  return (
    <main id="main-content" className="main adaptive-page" role="main">
      {mode === 'orientation' && <OrientationMode />}
      {mode === 'building'    && <BuildingMode state={data} />}
      {mode === 'full'        && <FullMode     state={data} />}
      <OnboardingTour />
    </main>
  );
}

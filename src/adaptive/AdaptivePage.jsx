// AdaptivePage.jsx
// Top-level adaptive practice page component.
// Fetches state, routes to the correct mode, and handles sidebar active-link sync.

import React from 'react';
import { useAdaptiveState }  from './hooks/useAdaptiveState.js';
import OrientationMode       from './components/OrientationMode.jsx';
import BuildingMode          from './components/BuildingMode.jsx';
import FullMode              from './components/FullMode.jsx';
import OnboardingTour        from './components/tour/OnboardingTour.jsx';
import { useGlowFollow } from '../shared/useGlowFollow.js';

export default function AdaptivePage() {
  useGlowFollow();
  const { data, loading } = useAdaptiveState();

  // Note: the reference project manually toggled `.side-link` active state
  // here (looking for data-section === 'home'). Our Sidebar component
  // (src/components/Sidebar.jsx) already manages active state via React
  // and route matching (data-section === 'adaptive'), so the manual patch
  // is removed — it was overwriting our sidebar's correct active class.

  if (loading) {
    // Same loader treatment as the Interview Preparation / exercise menu
    // list (see ExerciseGrid.jsx) — reuses exercise-menu.css's classes,
    // already loaded globally via assets/styles/main.css.
    return (
      <main className="main" id="main-content" role="main">
        <div className="adaptive-page">
          <div className="cv-menu-loading" role="status" aria-live="polite" aria-label="Loading your practice guidance">
            <div className="cv-progress" role="progressbar" aria-label="Loading your practice guidance">
              <div className="cv-progress-bar" />
            </div>
            <span className="cv-progress-label">Loading your practice guidance…</span>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const mode = data.mode || 'orientation';

  return (
    <main className="main" id="main-content" role="main">
      <div className="adaptive-page">
        {mode === 'orientation' && <OrientationMode />}
        {mode === 'building'    && <BuildingMode state={data} />}
        {mode === 'full'        && <FullMode     state={data} />}
        <OnboardingTour />
      </div>
    </main>
  );
}

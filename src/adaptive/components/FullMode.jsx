// components/FullMode.jsx
// Mode C orchestrator. Port of renderFullMode() + equaliseColumns() + watchColumns().

import React, { useEffect, useRef } from 'react';
import MilestoneBanner             from './MilestoneBanner.jsx';
import PrimaryCard                 from './PrimaryCard.jsx';
import { AlternativesGrid }        from './AlternativeCard.jsx';
import { SidebarQuality, SidebarRecent, SidebarSpacedReview } from './SidebarCards.jsx';
import CategoryRings               from './CategoryRings.jsx';

export default function FullMode({ state }) {
  const altGridRef  = useRef(null);
  const sidebarRef  = useRef(null);
  const rafRef      = useRef(0);
  const observerRef = useRef(null);

  // All 14 recommendation types are evaluated server-side in CodiviumAdaptiveEngine.cs.
  // The server returns the correct primary and alternatives in priority order —
  // no client-side integration step is needed.
  const integratedPrimary  = state.primary       || null;
  const allAlternatives    = state.alternatives   || [];

  // Compute subtitle
  const catCount = (state.categories || []).filter(c => c.fill > 0).length;
  const subtitle  = `Based on ${state.sessionCount || 0} session${(state.sessionCount || 0) !== 1 ? 's' : ''} across ${catCount} categor${catCount !== 1 ? 'ies' : 'y'}. Updated with today's activity.`;

  // Column height equaliser — mirrors equaliseColumns() + watchColumns()
  function equalise() {
    const grid    = altGridRef.current;
    const sidebar = sidebarRef.current;
    if (!grid || !sidebar) return;
    const gridBottom    = grid.getBoundingClientRect().bottom;
    const sidebarBottom = sidebar.getBoundingClientRect().bottom;
    const gap = sidebarBottom - gridBottom;
    if (gap > 0) {
      grid.style.minHeight = `${grid.offsetHeight + gap}px`;
    }
  }

  useEffect(() => {
    function scheduleEqualise() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(equalise);
    }

    scheduleEqualise();

    const sidebar = sidebarRef.current;
    const grid    = altGridRef.current;
    if (sidebar && grid) {
      const ro = new ResizeObserver(scheduleEqualise);
      ro.observe(sidebar);
      ro.observe(grid);
      observerRef.current = ro;
    }

    const onHide = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (observerRef.current) { observerRef.current.disconnect(); }
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [state]);

  return (
    <div id="apFullMode" aria-label="Full adaptive guidance">

      {/* Page header */}
      <div className="ap-header">
        <div className="ap-header-row">
          <div>
            <div className="ap-kicker" id="apKicker">Adaptive Practice</div>
            <h1 className="ap-title">Your practice guidance</h1>
          </div>
          <div className="ap-last-session">
            <div className="ap-session-dot" />
            <span id="apLastSession">{state.lastSessionLabel || 'Loading…'}</span>
          </div>
        </div>
        <div className="ap-subtitle" id="apSubtitle">{subtitle}</div>
      </div>

      <div className="adaptive-shell">

        {/* Left column: recommendations */}
        <div className="ap-left-col">

          <MilestoneBanner milestone={state.milestone} />

          <div className="ap-section-label">Primary recommendation</div>
          <PrimaryCard primary={integratedPrimary} />

          <div ref={altGridRef}>
            <AlternativesGrid alternatives={allAlternatives} />
          </div>

        </div>

        {/* Right column: sidebar */}
        <aside
          className="adaptive-sidebar-col"
          aria-label="Session analytics"
          ref={sidebarRef}
        >
          <SidebarQuality    sessionQuality={state.sessionQuality} />
          <SidebarRecent     recentSessions={state.recentSessions} />
          <SidebarSpacedReview />
        </aside>

      </div>

      {/* Category rings — full-width below both columns */}
      <CategoryRings categories={state.categories} />

    </div>
  );
}

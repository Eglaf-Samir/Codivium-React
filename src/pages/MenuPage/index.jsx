// MenuPage — Exercise menu page
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useMenuData }    from '../../hooks/useMenuData.js';
import { useMenuFilters } from '../../hooks/useMenuFilters.js';

import MenuHeader   from './MenuHeader.jsx';
import FilterDrawer from './FilterDrawer.jsx';
import ExerciseGrid from './ExerciseGrid.jsx';
import MenuTour     from './MenuTour.jsx';
import HelpPanel    from '../../components/HelpPanel.jsx';

export default function MenuPage() {
  const location = useLocation();
  const { data, loading, error, reload } = useMenuData();

  // Derive key info from payload.
  // IMPORTANT: read track from URL first, not from data.track.
  const urlTrack   = (new URLSearchParams(location.search).get('track') || 'micro').toLowerCase();
  const track      = urlTrack;
  const trackLabel = data?.trackLabel  || (track === 'interview' ? 'Interview Questions Menu' : 'Micro Challenge Menu');
  const isMicro    = track === 'micro';
  const exercises  = data?.exercises   || [];
  const returnUrl  = `/menu?track=${encodeURIComponent(track)}`;

  // ── Update body data-page for sidebar active-link indicator ────────────────
  useEffect(() => {
    if (trackLabel) document.body.dataset.page = trackLabel;
  }, [trackLabel]);

  // ── Remove loading placeholder on mount ────────────────────────────────────
  useEffect(() => {
    const placeholder = document.getElementById('menu-react-root-loading');
    if (placeholder) placeholder.remove();
  }, []);

  // ── Hash-link prevention ────────────────────────────────────────────────────
  useEffect(() => {
    function preventHash(e) {
      const a = e.target.closest?.('a[href="#"]');
      if (a) e.preventDefault();
    }
    document.addEventListener('click', preventHash);
    return () => document.removeEventListener('click', preventHash);
  }, []);

  // ── Filter state ────────────────────────────────────────────────────────────
  const filters = useMenuFilters(exercises);

  // ── Drawer open/close ────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Tour ─────────────────────────────────────────────────────────────────────
  const [tourActive, setTourActive] = useState(false);

  return (
    <main id="main-content" className="main stage" role="main">
      {/* Filter drawer — portaled to document.body */}
      <FilterDrawer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        // Available options
        categories={data?.categories     || []}
        difficultyLevels={data?.difficultyLevels || ['beginner', 'intermediate', 'advanced']}
        exerciseTypes={data?.exerciseTypes || []}
        mentalModels={data?.mentalModels  || []}
        isMicro={isMicro}
        // Current filter selections
        selectedCategories={filters.selectedCategories}
        selectedLevels={filters.selectedLevels}
        selectedCompleteness={filters.selectedCompleteness}
        selectedExerciseTypes={filters.selectedExerciseTypes}
        selectedMentalModels={filters.selectedMentalModels}
        sortField={filters.sortField}
        sortDir={filters.sortDir}
        // Setters
        toggleCategories={filters.toggleCategories}
        toggleLevels={filters.toggleLevels}
        toggleCompleteness={filters.toggleCompleteness}
        toggleExerciseTypes={filters.toggleExerciseTypes}
        toggleMentalModels={filters.toggleMentalModels}
        updateSortField={filters.updateSortField}
        updateSortDir={filters.updateSortDir}
        onReset={filters.resetFilters}
      />

      {/* Main content */}
      <div className="stage-shell">
        <div className="watermarks" aria-hidden="true">
          <div className="word watermark-word wm1" data-text="CODIVIUM">CODIVIUM</div>
        </div>

        <MenuHeader
          trackLabel={trackLabel}
          searchTerm={filters.searchTerm}
          onSearchChange={filters.setSearchTerm}
          onTourStart={() => setTourActive(true)}
        />

        <div className="grid-scroll" id="gridScroll" aria-label="Scrollable exercise grid">
          <section className="exercise-grid" aria-label="Exercise menu grid">
            <ExerciseGrid
              exercises={filters.filteredExercises}
              totalCount={exercises.length}
              loading={loading}
              error={error}
              onRetry={reload}
              returnUrl={returnUrl}
            />
          </section>
        </div>
      </div>

      {/* Guided tour */}
      <MenuTour active={tourActive} onStop={() => setTourActive(false)} />

      {/* Help panel — React replacement for cv-help-panel.js */}
      <HelpPanel />
    </main>
  );
}

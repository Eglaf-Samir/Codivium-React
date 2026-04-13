// Interview.jsx — Root component for the exercise menu page.
import React, { useState, useEffect } from 'react';

import { useMenuData } from '../../hooks/useMenuData.jsx';
import { useMenuFilters } from '../../hooks/useMenuFilters.jsx';

import MenuHeader from '../../components/MenuHeader.jsx';
import FilterDrawer from '../../components/FilterDrawer.jsx';
import ExerciseGrid from '../../components/ExerciseGrid.jsx';
import MenuTour from '../../components/MenuTour.jsx';
import HelpPanel from '../../components/HelpPanel.jsx';

export default function Interview() {
  const { data, loading, error, reload } = useMenuData();

  const urlTrack = (new URLSearchParams(window.location.search).get('track') || 'micro').toLowerCase();
  const track = urlTrack;
  const trackLabel = data?.trackLabel || (track === 'interview' ? 'Interview Questions Menu' : 'Micro Challenge Menu');
  const isMicro = track === 'micro';
  const exercises = data?.exercises || [];
  const returnUrl = `menu-page.html?track=${encodeURIComponent(track)}`;

  useEffect(() => {
    if (trackLabel) document.body.dataset.page = trackLabel;
  }, [trackLabel]);

  useEffect(() => {
    const placeholder = document.getElementById('menu-react-root-loading');
    if (placeholder) placeholder.remove();
  }, []);

  useEffect(() => {
    function preventHash(e) {
      const a = e.target.closest?.('a[href="#"]');
      if (a) e.preventDefault();
    }
    document.addEventListener('click', preventHash);
    return () => document.removeEventListener('click', preventHash);
  }, []);

  const filters = useMenuFilters(exercises);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  return (
    <main id="main-content" className="stage" role="main">
      <FilterDrawer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        categories={data?.categories || []}
        difficultyLevels={data?.difficultyLevels || ['beginner', 'intermediate', 'advanced']}
        exerciseTypes={data?.exerciseTypes || []}
        mentalModels={data?.mentalModels || []}
        isMicro={isMicro}
        selectedCategories={filters.selectedCategories}
        selectedLevels={filters.selectedLevels}
        selectedCompleteness={filters.selectedCompleteness}
        selectedExerciseTypes={filters.selectedExerciseTypes}
        selectedMentalModels={filters.selectedMentalModels}
        sortField={filters.sortField}
        sortDir={filters.sortDir}
        toggleCategories={filters.toggleCategories}
        toggleLevels={filters.toggleLevels}
        toggleCompleteness={filters.toggleCompleteness}
        toggleExerciseTypes={filters.toggleExerciseTypes}
        toggleMentalModels={filters.toggleMentalModels}
        updateSortField={filters.updateSortField}
        updateSortDir={filters.updateSortDir}
        onReset={filters.resetFilters}
      />

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

      <MenuTour active={tourActive} onStop={() => setTourActive(false)} />

      <HelpPanel />
    </main>
  );
}

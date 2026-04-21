// components/ExerciseGrid.jsx
// Renders the exercise grid: loading skeleton, error state, empty state, or cards.
import React from 'react';
import ExerciseCard from './ExerciseCard.jsx';

export default function ExerciseGrid({ exercises, totalCount, loading, error, onRetry, returnUrl, onCardClick }) {
  if (loading) {
    return (
      <div className="cv-menu-loading" id="cvMenuLoading" aria-live="polite" aria-label="Loading exercises">
        <span>Loading exercises\u2026</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cv-menu-error" role="alert">
        <p className="cv-menu-error-msg">Could not load exercises: {error}</p>
        <button className="cv-menu-error-retry" type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {exercises.length === 0 && (
        <div className="cv-menu-empty" id="cvMenuEmpty" data-total={String(totalCount || 0)}>
          {totalCount === 0
            ? 'No exercises are available for this track yet.'
            : 'No exercises match the current filters.'}
        </div>
      )}
      {exercises.map(ex => (
        <ExerciseCard key={ex.id} exercise={ex} returnUrl={returnUrl} onClick={onCardClick} />
      ))}
    </>
  );
}

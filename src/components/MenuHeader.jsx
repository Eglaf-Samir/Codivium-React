// components/MenuHeader.jsx
// Track title, search box, and tour button.
import React from 'react';

export default function MenuHeader({ trackLabel, searchTerm, onSearchChange, onTourStart }) {
  return (
    <div className="cv-menu-header">
      <h1 className="cv-track-title" id="menuTrackTitle">{trackLabel || 'Exercises'}</h1>

      <div className="cv-search-wrap">
        <input
          type="search"
          id="menuSearch"
          className="cv-search-input"
          placeholder="Search exercises\u2026"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search exercises"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <button
        className="cv-menu-tour-btn"
        id="menuTourBtn"
        type="button"
        aria-label="Take a guided tour of the exercise menu"
        title="Guided tour"
        onClick={onTourStart}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Explore the Exercise Menu
      </button>
    </div>
  );
}

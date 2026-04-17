// components/CategoryFilter/SimplePills.jsx
import React, { useState } from 'react';

function makeRegex(q) {
  if (!q) return null;
  try { return new RegExp(q, 'i'); } catch(_) {
    try { return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'i'); } catch(__) { return null; }
  }
}

export default function SimplePills({ categories, selected, onChange }) {
  const [query, setQuery] = useState('');
  const [view,  setView]  = useState('all');

  const selectedSet = new Set(selected);
  const rx          = makeRegex(query);

  function toggle(name) {
    const next = new Set(selectedSet);
    next.has(name) ? next.delete(name) : next.add(name);
    onChange([...next]);
  }

  return (
    <div className="cat-tab is-active" id="catTabSimple" aria-label="Simple filter panel">

      {/* Search + select/clear actions */}
      <div className="simple-top">
        <div className="simple-search-wrap">
          <input className="simple-search" type="text" autoComplete="off" spellCheck="false"
            placeholder="Filter categories\u2026" value={query}
            onChange={e => setQuery(e.target.value)} aria-label="Filter category pills" />
        </div>
        <div className="simple-actions">
          <button className="ghost ghost-mini" type="button" onClick={() => onChange([...categories])}>
            Select all
          </button>
          <button className="ghost ghost-mini" type="button" onClick={() => onChange([])}>
            Clear
          </button>
        </div>
      </div>

      {/* View toggle + count */}
      <div className="cat-meta">
        <div className="cat-count" id="catCountText">
          {selectedSet.size === categories.length
            ? `Selected: All (${categories.length})`
            : `Selected: ${selectedSet.size}`}
        </div>
        <div className="cat-view-tabs" role="tablist">
          <button className={`mini-tab${view === 'all' ? ' is-active' : ''}`}
            type="button" role="tab" aria-selected={view === 'all'}
            onClick={() => setView('all')}>All</button>
          <button className={`mini-tab${view === 'selected' ? ' is-active' : ''}`}
            type="button" role="tab" aria-selected={view === 'selected'}
            onClick={() => setView('selected')}>Selected</button>
        </div>
      </div>

      {/* Pills grid — CSS targets .pill label and .pill input:checked + label */}
      <div className="simple-groups" id="simpleCatGroups" aria-label="Category pills">
        <div className="simple-pillgrid simple-pillgrid-flat">
          {categories.map((name, idx) => {
            const matchSearch = !rx || rx.test(name);
            const matchView   = view === 'all' || selectedSet.has(name);
            if (!matchSearch || !matchView) return null;
            const id = `sp_${idx}`;
            return (
              <div key={name} className="pill">
                <input
                  type="checkbox"
                  id={id}
                  checked={selectedSet.has(name)}
                  onChange={() => toggle(name)}
                />
                <label htmlFor={id}>{name}</label>
              </div>
            );
          })}
          {categories.filter(name => {
            const matchSearch = !rx || rx.test(name);
            const matchView = view === 'all' || selectedSet.has(name);
            return matchSearch && matchView;
          }).length === 0 && (
            <div className="pill-empty">
              {view === 'selected' ? 'No categories selected.' : 'No matches.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// components/CategoryFilter/PowerPalette.jsx
import React, { useState, useRef, useEffect } from 'react';

function makeRegex(q) {
  if (!q) return null;
  try { return new RegExp(q, 'i'); } catch(_) {
    try { return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); } catch(__) { return null; }
  }
}

export default function PowerPalette({ categories, selected, onChange }) {
  const [query,  setQuery]  = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef(null);
  const inputRef   = useRef(null);

  const selectedSet = new Set(selected);

  useEffect(() => {
    if (!isOpen) return;
    function outside(e) {
      if (controlRef.current && !controlRef.current.contains(e.target)) {
        setIsOpen(false); setQuery('');
      }
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [isOpen]);

  function open()  { setIsOpen(true);  setTimeout(() => inputRef.current?.focus(), 0); }
  function close() { setIsOpen(false); setQuery(''); }

  function toggle(name) {
    const next = new Set(selectedSet);
    next.has(name) ? next.delete(name) : next.add(name);
    onChange([...next]);
  }

  const q     = query.trim().toLowerCase();
  const rx    = makeRegex(q);
  const items = q ? categories.filter(n => !rx || rx.test(n)).slice(0, 30) : categories;

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown' && !isOpen) { e.preventDefault(); open(); return; }
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (q) {
        const matches = categories.filter(n => !rx || rx.test(n));
        if (matches.length) {
          const next = new Set(selectedSet);
          let changed = false;
          matches.forEach(name => { if (!next.has(name)) { next.add(name); changed = true; } });
          if (changed) onChange([...next]);
        }
        setQuery('');
      } else if (isOpen && items.length > 0) {
        toggle(items[0]);
      }
    }
  }

  return (
    <div className="cat-tab is-active" id="catTabPower" data-tab="power" aria-label="Power filter panel" aria-hidden="true">
      <div className="palette" aria-label="Category command palette">
        <div className="help help--flush">Quick select</div>
        <div className="control glow-follow palette-control" id="catPaletteControl" ref={controlRef}>
          <input
            ref={inputRef}
            id="catPaletteInput"
            className="palette-input"
            type="text"
            autoComplete="off"
            spellCheck="false"
            placeholder="Search categories… (press ↓ to browse)"
            aria-label="Quick category search"
            aria-expanded={isOpen}
            aria-controls="catPaletteDropdown"
            value={query}
            onChange={e => { setQuery(e.target.value); if (!isOpen) setIsOpen(true); }}
            onFocus={() => { if (!isOpen) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
          />
          <button
            className="palette-browse"
            id="catPaletteBrowse"
            type="button"
            aria-label="Browse categories"
            onClick={() => { isOpen ? close() : open(); inputRef.current?.focus(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div
            className={`palette-dropdown${isOpen ? ' open' : ''}`}
            id="catPaletteDropdown"
            role="listbox"
            aria-label="Category options"
          >
            {isOpen && (
              <>
                <div className="pdrop-head">
                  <div className="pdrop-title">
                    {q ? `Search results (${items.length})` : `All categories (${categories.length})`}
                  </div>
                  {q && items.length > 0 && (
                    <div className="pdrop-hint">Press Enter to select all {items.length} match{items.length !== 1 ? 'es' : ''}</div>
                  )}
                </div>
                <div className="pdrop-scroll">
                  {items.length === 0 ? (
                    <div className="pdrop-empty">No matches.</div>
                  ) : items.map(name => {
                    const checked = selectedSet.has(name);
                    return (
                      <div key={name} className="popt" role="option" aria-selected={checked}
                        onClick={() => toggle(name)}>
                        <div className="popt-main">
                          <div className="popt-check">{checked ? '✓' : ''}</div>
                          <div className="popt-label">{name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="category-box glow-follow" role="group" aria-label="Categories">
        <div className="category-head">
          <div className="mini">
            <input
              id="catAll"
              type="checkbox"
              checked={selectedSet.size === categories.length && categories.length > 0}
              ref={el => { if (el) el.indeterminate = selectedSet.size > 0 && selectedSet.size < categories.length; }}
              onChange={e => onChange(e.target.checked ? [...categories] : [])}
            />
            <label htmlFor="catAll">Select all</label>
          </div>
          <div className="range-value" aria-hidden="true">✓</div>
        </div>
        <div className="category-scroll" id="categoryList">
          {categories.map(name => {
            const id    = `cat_${name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
            const isMatch = q && rx && rx.test(name);
            return (
              <div key={name} className={`category-row${selectedSet.has(name) ? ' is-selected' : ''}${isMatch ? ' is-match' : ''}`}>
                <input type="checkbox" id={id} value={name}
                  checked={selectedSet.has(name)} onChange={() => toggle(name)} />
                <label htmlFor={id}>{name}</label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// components/CategoryFilter/CategoryFilter.jsx
import React, { useState } from 'react';
import SimplePills  from './SimplePills.jsx';
import PowerPalette from './PowerPalette.jsx';

export default function CategoryFilter({ categories, selected, onChange, onInfo }) {
  const [mode, setMode] = useState('simple');

  return (
    <section className="panel panel-left glow-follow" aria-label="Category filters"
      id="catPanel" data-mode={mode}>

      {/* Mode tabs — CSS targets #catPanel .panel-window-tabs .wtab */}
      <div className="panel-window-tabs" role="tablist" aria-label="Filter mode">
        <button
          className={`wtab${mode === 'simple' ? ' is-active' : ''}`}
          id="tabSimple" type="button" role="tab"
          aria-selected={mode === 'simple'} aria-controls="catTabSimple"
          onClick={() => setMode('simple')}
        >
          Simple Filter
        </button>
        <button
          className={`wtab${mode === 'power' ? ' is-active' : ''}`}
          id="tabPower" type="button" role="tab"
          aria-selected={mode === 'power'} aria-controls="catTabPower"
          onClick={() => setMode('power')}
        >
          Power Filter
        </button>
        <button className="info-dot info-dot-mini" id="modeInfo" type="button"
          aria-label="About filter modes" onClick={() => onInfo('mode')}>i</button>
      </div>

      {/* Tab panels — CSS shows/hides via #catTabSimple.is-active / #catTabPower.is-active */}
      <div className="cat-tabs">
        {mode === 'simple'
          ? <SimplePills categories={categories} selected={selected} onChange={onChange} />
          : <PowerPalette categories={categories} selected={selected} onChange={onChange} />
        }
      </div>
    </section>
  );
}

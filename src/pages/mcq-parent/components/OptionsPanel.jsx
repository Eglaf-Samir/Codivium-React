// components/OptionsPanel.jsx
//
// Right-rail options block. Difficulty is now driven by the live paramMaster
// list (Guid IDs + names) passed in from McqParentPage rather than the old
// hardcoded basic/intermediate/advanced strings. Question count + skip-correct
// inputs are unchanged.

import React from 'react';

// Display order for difficulty pills: Basic → Intermediate → Advanced.
function sortByName(list) {
  const order = { basic: 0, intermediate: 1, advanced: 2, advance: 2 };
  return [...(list || [])].sort((a, b) => {
    const ka = order[(a.name || '').toLowerCase()] ?? 99;
    const kb = order[(b.name || '').toLowerCase()] ?? 99;
    return ka - kb;
  });
}

// Title-case the paramMaster value for the radio label.
function prettyLabel(name) {
  if (!name) return '';
  const s = String(name);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function OptionsPanel({
  difficulties,           // [{id, name}] from useDifficultyLevels
  difficultyLevelId,      // Guid currently selected
  onDifficulty,           // (id) => void
  count, onCount,
  skipCorrect, onSkip,
  onInfo,
}) {
  const list = sortByName(difficulties);
  return (
    <section className="panel panel-right" aria-label="Difficulty and quiz options">
      <div className="right-controls">

        {/* Difficulty */}
        <div className="panel-group glow-follow" aria-label="Difficulty">
          <div className="label">
            Difficulty
            <button className="info-dot info-dot-mini info-inline" type="button"
              aria-label="About difficulty levels"
              onClick={() => onInfo('difficulty')}>i</button>
          </div>
          <div className="togglebar" role="radiogroup" aria-label="Difficulty">
            {list.length === 0 && (
              <div className="toggle-item" aria-disabled="true" style={{ opacity: 0.6 }}>
                <span className="help" style={{ padding: '8px 12px' }}>Loading…</span>
              </div>
            )}
            {list.map(d => (
              <div key={d.id} className="toggle-item">
                <input
                  id={`diff_${d.id}`}
                  type="radio"
                  name="difficulty"
                  value={d.id}
                  checked={difficultyLevelId === d.id}
                  onChange={() => onDifficulty(d.id)}
                />
                <label htmlFor={`diff_${d.id}`}>{prettyLabel(d.name)}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div className="panel-group glow-follow" aria-label="Number of questions">
          <div className="label">
            Number of Questions
            <button className="info-dot info-dot-mini info-inline" type="button"
              aria-label="About question count"
              onClick={() => onInfo('qcount')}>i</button>
          </div>
          <div className="range-wrap" aria-label="Question count">
            <div className="range-meta">
              <div className="help">Min 10 • Max 50</div>
              <div className="qcount-display" aria-label="Selected number of questions">
                <span className="qcount-label">Selected Num Questions:</span>
                <span className="qcount-num" id="qCountValue">{count}</span>
              </div>
            </div>
            <div className="control control--padded glow-follow">
              <label className="sr-only" htmlFor="qCount">Number of Questions</label>
              <input
                id="qCount"
                type="range"
                min={10} max={50} step={1}
                value={count}
                style={{ '--pct': `${Math.max(0, Math.min(100, ((count - 10) / 40) * 100))}%` }}
                onChange={e => onCount(Number(e.target.value))}
                aria-label="Number of questions"
              />
            </div>
            <div className="quick-set control glow-follow" aria-label="Quick set question count">
              <button className="ghost" id="setMin" type="button" onClick={() => onCount(10)}>Min</button>
              <button className="ghost" id="setMax" type="button" onClick={() => onCount(50)}>Max</button>
            </div>
          </div>
        </div>

        {/* Skip correct */}
        <div className="panel-group glow-follow" aria-label="Exclude previously-correct">
          <div className="checkline">
            <input
              id="skipCorrect"
              type="checkbox"
              checked={skipCorrect}
              onChange={e => onSkip(e.target.checked)}
            />
            <label htmlFor="skipCorrect">Exclude questions previously answered correctly</label>
            <button className="info-dot info-dot-mini info-inline" id="excludeInfo" type="button"
              aria-label="About exclude"
              onClick={() => onInfo('exclude')}>i</button>
          </div>
        </div>

      </div>
    </section>
  );
}

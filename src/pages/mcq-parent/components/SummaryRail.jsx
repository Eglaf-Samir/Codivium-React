// components/SummaryRail.jsx
import React, { useState } from 'react';

const DIFF_LABELS = { basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced' };
const DIFF_ORDER  = ['basic', 'intermediate', 'advanced'];

export default function SummaryRail({ categories, allCategories, difficulty, count, skipCorrect }) {
  const [expanded, setExpanded] = useState(false);

  const diffIdx  = Math.max(0, DIFF_ORDER.indexOf(difficulty));
  const noneSelected = categories.length === 0;
  const cats     = categories;  // show exactly what's selected — no fallback
  const isAll    = !noneSelected && cats.length === allCategories.length && allCategories.length > 0;
  const MAX      = expanded ? 999 : 5;
  const visible  = cats.slice(0, MAX);
  const overflow = cats.length - MAX;

  const skipText = skipCorrect
    ? 'The quiz will not show questions which you have already answered correctly in previous quizzes'
    : 'The quiz will select from the full set of available questions, whether you have answered them before or not.';

  return (
    <div className="window-pad rail-pad">
      <div className="rail-head">
        <div className="rail-title-row">
          <div className="rail-title">Selected Settings</div>
          <div className="ready-badge" aria-label="Ready">
            <span className="ready-dot" aria-hidden="true"></span>
            <span className="ready-text">Ready</span>
          </div>
        </div>
      </div>
      <div className="summary" aria-label="Selected settings summary">

        {/* Difficulty */}
        <div className="summary-block">
          <div className="summary-label">Difficulty Level</div>
          <div className="difficulty-ladder" id="diffLadder" role="img"
            aria-label={`Difficulty: ${DIFF_LABELS[difficulty] || difficulty}`}>
            {DIFF_ORDER.map((d, i) => (
              <div key={d} className={`ladder-step${i <= diffIdx ? ' is-active' : ''}`}
                data-level={d} aria-label={DIFF_LABELS[d]} />
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="summary-block">
          <div className="summary-row">
            <div className="summary-k">Number of Questions</div>
            <div className="summary-v" id="sumCount">{count}</div>
          </div>
        </div>

        {/* Categories */}
        <div className="summary-block">
          <div className="summary-label">
            Categories{isAll ? <span className="summary-all-badge"> — All</span> : null}
          </div>
          <div className="summary-pills" id="sumCats" aria-label="Selected categories">
            {noneSelected
              ? <div className="summary-pill" style={{ opacity: 0.5, fontStyle: 'italic' }}>None selected</div>
              : (<>
                  {visible.map(name => (
                    <div key={name} className="summary-pill">{name}</div>
                  ))}
                  {!expanded && overflow > 0 && (
                    <button type="button" className="summary-more"
                      onClick={() => setExpanded(true)}>+{overflow} more</button>
                  )}
                  {expanded && cats.length > 6 && (
                    <button type="button" className="summary-more"
                      onClick={() => setExpanded(false)}>Show less</button>
                  )}
                </>)
            }
          </div>
        </div>

        {/* Exclude */}
        <div className="summary-block">
          <div className="summary-label">Exclude Setting</div>
          <div className="summary-text" id="sumExclude">{skipText}</div>
        </div>

      </div>
    </div>
  );
}

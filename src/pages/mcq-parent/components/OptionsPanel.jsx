// components/OptionsPanel.jsx
import React from 'react';

const DIFFICULTIES = [
  { value: 'basic',        label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];

export default function OptionsPanel({ difficulty, onDifficulty, count, onCount, skipCorrect, onSkip, onInfo }) {
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
            {DIFFICULTIES.map(d => (
              <div key={d.value} className="toggle-item">
                <input
                  id={`diff_${d.value}`}
                  type="radio"
                  name="difficulty"
                  value={d.value}
                  checked={difficulty === d.value}
                  onChange={() => onDifficulty(d.value)}
                />
                <label htmlFor={`diff_${d.value}`}>{d.label}</label>
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

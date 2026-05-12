// components/OrientationMode.jsx
// Mode A: the three-question orientation diagnostic.
// Preserves .ap-orientation-wrap class so onboarding-tour.js spotlight still works.

import React, { useState } from 'react';
import { buildOrientationUrl } from '../utils/routing.js';
import { safeRedirect } from '../utils/adaptive.js';

const QUESTIONS = [
  {
    key: 'goal',
    label: "What's your main goal right now?",
    options: [
      { value: 'interview', label: 'Prepare for a job interview' },
      { value: 'improve',   label: 'Improve my Python skills'    },
      { value: 'explore',   label: 'Explore and learn'           },
      { value: 'gaps',      label: 'Fill specific gaps'          },
    ],
  },
  {
    key: 'level',
    label: 'How comfortable are you with Python?',
    options: [
      { value: 'beginner',     label: 'Just starting out' },
      { value: 'basic',        label: 'Know the basics'   },
      { value: 'intermediate', label: 'Comfortable'       },
      { value: 'advanced',     label: 'Advanced'          },
    ],
  },
  {
    key: 'time',
    label: 'How much time do you have right now?',
    options: [
      { value: '5',  label: 'About 5 minutes'  },
      { value: '20', label: 'About 20 minutes' },
      { value: '60', label: 'An hour or more'  },
      { value: '0',  label: 'Not sure yet'     },
    ],
  },
];

export default function OrientationMode() {
  const [answers,     setAnswers]     = useState({ goal: null, level: null, time: null });
  const [goalMissing, setGoalMissing] = useState(false);

  function select(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (key === 'goal') setGoalMissing(false);
  }

  function handleSubmit() {
    if (!answers.goal) {
      setGoalMissing(true);
      setTimeout(() => { if (mountedRef.current) setGoalMissing(false); }, 1600);
      return;
    }
    const url = buildOrientationUrl(answers);
    safeRedirect(url);
  }

  return (
    <div id="apOrientationMode" aria-label="Orientation — new user guidance">

      <div className="ap-header ap-header--orient">
        <div className="ap-kicker">Welcome to Codivium</div>
        <h1 className="ap-title">Let's find your starting point</h1>
        <div className="ap-subtitle">
          Three quick questions. One clear first step. No guessing required.
        </div>
      </div>

      {/* .ap-orientation-wrap is targeted by onboarding-tour.js spotlight — do not rename */}
      <div className="ap-orientation-wrap">
        <div className="ap-orientation-card window glow-follow">
          <div className="ap-orient-deco" />
          <div className="ap-orient-headline">Before your first session</div>
          <div className="ap-orient-sub">
            Tell us where you are and what you're aiming for. We'll take it from
            there — one specific recommendation, ready to launch immediately.
          </div>

          {QUESTIONS.map(({ key, label, options }) => (
            <div
              key={key}
              className={`ap-diag-block${key === 'goal' && goalMissing ? ' ap-diag-required' : ''}`}
            >
              <div className="ap-diag-label">{label}</div>
              <div
                className="ap-diag-opts"
                role="group"
                aria-label={`${label} options`}
                data-question={key}
              >
                {options.map(({ value, label: optLabel }) => (
                  <button
                    key={`${key}-${value}-${optLabel}`}
                    className={`ap-diag-opt${answers[key] === value && answers[key] !== null ? ' is-sel' : ''}`}
                    type="button"
                    data-value={value}
                    onClick={() => select(key, value)}
                    aria-pressed={answers[key] === value}
                  >
                    {optLabel}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="ap-orient-actions">
            <button
              className="btn ap-full-btn"
              id="apOrientSubmit"
              type="button"
              onClick={handleSubmit}
            >
              Get my first recommendation →
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

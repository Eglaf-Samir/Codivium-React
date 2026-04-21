import React from 'react';

const QUESTIONS = [
  {
    key: 'goal',
    label: "What's your main goal right now?",
    options: [
      { value: 'interview', label: 'Prepare for a job interview' },
      { value: 'improve',   label: 'Improve my Python skills' },
      { value: 'explore',   label: 'Explore and learn' },
      { value: 'gaps',      label: 'Fill specific gaps' },
    ],
  },
  {
    key: 'level',
    label: 'How comfortable are you with Python?',
    options: [
      { value: 'beginner',     label: 'Just starting out' },
      { value: 'basic',        label: 'Know the basics' },
      { value: 'intermediate', label: 'Comfortable' },
      { value: 'advanced',     label: 'Advanced' },
    ],
  },
  {
    key: 'time',
    label: 'How much time do you have right now?',
    options: [
      { value: '5',  label: 'About 5 minutes' },
      { value: '15', label: '15–20 minutes' },
      { value: '30', label: '30+ minutes' },
    ],
  },
];

export default function TourOrientForm({ answers, onAnswer }) {
  return (
    <>
      {QUESTIONS.map(q => (
        <div key={q.key} className="cvt-orient-block">
          <div className="cvt-orient-label">{q.label}</div>
          <div className="cvt-orient-opts">
            {q.options.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`cvt-orient-opt${answers[q.key] === opt.value ? ' selected' : ''}`}
                onClick={() => onAnswer(q.key, opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

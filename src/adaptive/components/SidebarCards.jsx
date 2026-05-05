// components/SidebarCards.jsx
// Port of renderQuality() and renderRecent(). Sidebar card components for Mode C.

import React from 'react';

// ── Session quality card ───────────────────────────────────────────────────────

export function SidebarQuality({ sessionQuality }) {
  if (!sessionQuality) return null;
  const { levels } = sessionQuality;

  return (
    <div
      className="window glow-follow ap-sidebar-card ap-quality-card"
      aria-label="Session quality indicator"
    >
      <div className="ap-sidebar-card-head">
        <div className="ap-sidebar-card-title">Last session quality</div>
      </div>
      <div className="ap-sidebar-card-body">
        <div
          className="ap-quality-levels"
          id="apQualityLevels"
          role="list"
          aria-label="Quality levels"
        >
          {(levels || []).map((lv) => (
            <div
              key={lv.name}
              className={`ap-quality-row${lv.isCurrent ? ' is-current' : ''}`}
              role="listitem"
              aria-label={`${lv.name}: ${lv.pct}%${lv.isCurrent ? ' — current level' : ''}`}
            >
              <div className="ap-quality-label">{lv.name}</div>
              <div className="ap-quality-bar-wrap">
                <div
                  className="ap-quality-bar-fill"
                  style={{ width: `${lv.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="ap-quality-desc">
          Based on accuracy, peek rate, and response confidence from your last session.
        </div>
      </div>
    </div>
  );
}

// ── Recent sessions card ───────────────────────────────────────────────────────

const STATE_DOT_CLASS = {
  correct: 'ap-session-dot--correct',
  partial: 'ap-session-dot--partial',
  peeked:  'ap-session-dot--peeked',
};

export function SidebarRecent({ recentSessions }) {
  if (!recentSessions || recentSessions.length === 0) return null;

  const sessions = recentSessions.slice(0, 5);

  return (
    <div
      className="window glow-follow ap-sidebar-card"
      aria-label="Recent sessions"
    >
      <div className="ap-sidebar-card-head">
        <div className="ap-sidebar-card-title">Recent sessions</div>
      </div>
      <div className="ap-sidebar-card-body">
        <div
          className="ap-recent-list"
          id="apRecentList"
          role="list"
          aria-label="Recent session results"
        >
          {sessions.map((s, i) => (
            <div
              key={`${s.cat}-${i}`}
              className="ap-recent-item"
              role="listitem"
              aria-label={`${s.cat}: ${s.score}`}
            >
              <span
                className={`ap-session-dot ${STATE_DOT_CLASS[s.state] || ''}`}
                aria-hidden="true"
              />
              <span className="ap-recent-cat">{s.cat}</span>
              <span className="ap-recent-score">{s.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Spaced review card (static placeholder) ────────────────────────────────────

export function SidebarSpacedReview() {
  return (
    <div
      className="window glow-follow ap-sidebar-card"
      aria-label="Next spaced review"
    >
      <div className="ap-sidebar-card-head">
        <div className="ap-sidebar-card-title">Next spaced review</div>
      </div>
      <div className="ap-sidebar-card-body">
        <div className="ap-review-item-name">Arrays</div>
        <div className="ap-review-item-sub ap-review-item-sub--urgent">
          Review window open now — 16 days since last correct answers.
        </div>
        <div className="ap-review-item-name">Language Basics</div>
        <div className="ap-review-item-sub">
          Review due in 5 days — advancement unlocked.
        </div>
        <div className="ap-review-sci">
          Spaced repetition: reviewing at the point of near-forgetting produces
          more durable memory than reviewing earlier or later.
        </div>
      </div>
    </div>
  );
}

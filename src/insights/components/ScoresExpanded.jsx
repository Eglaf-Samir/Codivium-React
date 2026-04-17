// src/insights/components/ScoresExpanded.jsx
// Tri-track expanded scores view — rendered inside ScoresPanel when the
// dashboard is in scores_only layout. Matches vanilla renderScoresExpanded().
import React from 'react';

function TrackCol({ label, breadth, depth, isUnavailable }) {
  const val = v => (isUnavailable || v == null) ? 'N/A' : Math.round(v);
  return (
    <div className="cvScoresExpCol">
      <div className="cvScoresExpColTitle">{label}</div>
      <div className="scoreChip">
        <div className="kpiTitle">Breadth</div>
        <div className="kpiValue sm">{val(breadth)}</div>
      </div>
      <div className="scoreChip">
        <div className="kpiTitle">Depth</div>
        <div className="kpiValue sm">{val(depth)}</div>
      </div>
    </div>
  );
}

export default function ScoresExpanded({ metrics }) {
  const m = metrics || {};

  const hasMicro     = m.microBreadthScore != null && m.microBreadthScore !== '—';
  const hasInterview = m.interviewBreadthScore != null && m.interviewBreadthScore !== '—';

  return (
    <div className="cvScoresExpanded">
      {/* Shared overall column */}
      <div className="cvScoresExpCol cvScoresExpColShared">
        <div className="cvScoresExpColTitle">Overall</div>
        <div className="scoreChip scoreChipWide">
          <div className="kpiTitle">Codivium Score (0–100)</div>
          <div className="kpiValue">{m.codiviumScore ?? '—'}</div>
        </div>
        <div className="scoreChip">
          <div className="kpiTitle">Points (all-time)</div>
          <div className="kpiValue sm">{m.codiviumPointsAll ?? '—'}</div>
        </div>
        <div className="scoreChip">
          <div className="kpiTitle">Points (30D)</div>
          <div className="kpiValue sm">{m.codiviumPoints30 ?? '—'}</div>
        </div>
        <div className="scoreChip">
          <div className="kpiTitle">Efficiency (pts/hr)</div>
          <div className="kpiValue sm">{m.efficiencyPtsPerHr ?? '—'}</div>
        </div>
      </div>

      {/* Per-track columns */}
      <TrackCol
        label="Combined"
        breadth={m.breadthScore}
        depth={m.depthOverallScore}
        isUnavailable={false}
      />
      <TrackCol
        label="Micro"
        breadth={m.microBreadthScore}
        depth={m.microDepthScore}
        isUnavailable={!hasMicro}
      />
      <TrackCol
        label="Interview"
        breadth={m.interviewBreadthScore}
        depth={m.interviewDepthScore}
        isUnavailable={!hasInterview}
      />
    </div>
  );
}

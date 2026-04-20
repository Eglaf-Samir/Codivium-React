// src/insights/components/ScoresPanel.jsx
import React, { useState } from 'react';
import ScoresExpanded from './ScoresExpanded.jsx';
import PanelCta from './PanelCta.jsx';

export default function ScoresPanel({ metrics, onInfoKey, hidden, recommendedActions, isExpanded }) {
  const m = metrics || {};
  const v = {
    codiviumScore:         m.codiviumScore         != null ? m.codiviumScore         : '—',
    breadthScore:          m.breadthScore          != null ? m.breadthScore          : '—',
    depthOverallScore:     m.depthOverallScore      != null ? m.depthOverallScore     : '—',
    microBreadthScore:     m.microBreadthScore      != null ? m.microBreadthScore     : '—',
    microDepthScore:       m.microDepthScore        != null ? m.microDepthScore       : '—',
    interviewBreadthScore: m.interviewBreadthScore  != null ? m.interviewBreadthScore : '—',
    interviewDepthScore:   m.interviewDepthScore    != null ? m.interviewDepthScore   : '—',
    mcqBreadthScore:       m.mcqBreadthScore        != null ? m.mcqBreadthScore       : '—',
    weightedMcqScore:      m.weightedMcqScore       != null ? m.weightedMcqScore      : '—',
    codiviumPointsAll:     m.codiviumPointsAll      != null ? m.codiviumPointsAll      : '—',
    codiviumPoints30:      m.codiviumPoints30       != null ? m.codiviumPoints30       : '—',
    efficiencyPtsPerHr:    m.efficiencyPtsPerHr     != null ? m.efficiencyPtsPerHr    : '—',
    firstTryPassRate:      m.firstTryPassRate       != null ? m.firstTryPassRate      : '—',
    avgAttemptsToAC:       m.avgAttemptsToAC        != null ? m.avgAttemptsToAC       : '—',
    medianTimeToAC:        m.medianTimeToAC         != null ? m.medianTimeToAC        : '—',
  };
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className={`card panel scoresPalette${hidden ? " isHidden" : ""}`}>
      <div className="shellHead">
        <div>
          <p className="title">Scores</p>
          <p className="desc">Quick summary indicators.</p>
        </div>
        <button aria-label="Info" className="infoBtn" data-info-key="panel_scores" type="button"
          onClick={() => onInfoKey && onInfoKey('panel_scores')}>i</button>
        <PanelCta panelId="scores" recommendedActions={recommendedActions} />
      </div>

      <div className="scoresScrollArea">
        <div aria-label="Scores view" className="segmented scoresTabs" role="tablist">
          <button className={`segBtn${activeTab === 'summary' ? ' isActive' : ''}`}
            type="button" role="tab" id="scoresTabBtnSummary"
            aria-selected={activeTab === 'summary'} aria-controls="scoresTabSummary"
            onClick={() => setActiveTab('summary')}>Summary</button>
          <button className={`segBtn${activeTab === 'breakdown' ? ' isActive' : ''}`}
            type="button" role="tab" id="scoresTabBtnBreakdown"
            aria-selected={activeTab === 'breakdown'} aria-controls="scoresTabBreakdown"
            onClick={() => setActiveTab('breakdown')}>Breakdown</button>
        </div>

        <div className="scoresTabPanels">
          {/* ── Summary tab ── */}
          <div className={`scoresTabPanel${activeTab !== 'summary' ? ' isHidden' : ''}`}
            id="scoresTabSummary" role="tabpanel" aria-labelledby="scoresTabBtnSummary">
            <div className="scoresGrid scoresGridMain">

              <div className="scoreChip scoreChipWide">
                <div className="kpiTitle">Codivium Score (0–100)</div>
                <div className="kpiValue" id="codiviumScore">{v.codiviumScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="codiviumScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('codiviumScore')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Codivium Points (all-time)</div>
                <div className="kpiValue sm" id="codiviumPointsAll">{v.codiviumPointsAll}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="codiviumPointsAll" type="button"
                  onClick={() => onInfoKey && onInfoKey('codiviumPointsAll')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Codivium Points (30D)</div>
                <div className="kpiValue sm" id="codiviumPoints30">{v.codiviumPoints30}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="codiviumPoints30" type="button"
                  onClick={() => onInfoKey && onInfoKey('codiviumPoints30')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Efficiency (pts/hr)</div>
                <div className="kpiValue sm" id="efficiencyPtsPerHr">{v.efficiencyPtsPerHr}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="efficiencyPtsPerHr" type="button"
                  onClick={() => onInfoKey && onInfoKey('efficiencyPtsPerHr')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Overall Breadth (B)</div>
                <div className="kpiValue sm" id="breadthScore">{v.breadthScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="breadthScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('breadthScore')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Overall Depth (D)</div>
                <div className="kpiValue sm" id="depthOverallScore">{v.depthOverallScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="depthOverallScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('depthOverallScore')}>i</button>
              </div>

            </div>
          </div>

          {/* ── Breakdown tab ── */}
          <div className={`scoresTabPanel${activeTab !== 'breakdown' ? ' isHidden' : ''}`}
            id="scoresTabBreakdown" role="tabpanel" aria-labelledby="scoresTabBtnBreakdown">
            <div className="scoresGrid scoresGridBreakdown">

              <div className="scoreChip">
                <div className="kpiTitle">Micro Breadth</div>
                <div className="kpiValue sm" id="microBreadthScore">{v.microBreadthScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="microBreadthScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('microBreadthScore')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Interview Breadth</div>
                <div className="kpiValue sm" id="interviewBreadthScore">{v.interviewBreadthScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="interviewBreadthScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('interviewBreadthScore')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">MCQ Breadth</div>
                <div className="kpiValue sm" id="mcqBreadthScore">{v.mcqBreadthScore}</div>
                <div className="kpiSub">Weighted MCQ{' '}
                  <span className="kpiInlineValue" id="weightedMcqScore">{v.weightedMcqScore}</span>
                </div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="mcqBreadthScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('mcqBreadthScore')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Micro Depth</div>
                <div className="kpiValue sm" id="microDepthScore">{v.microDepthScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="microDepthScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('microDepthScore')}>i</button>
              </div>

              <div className="scoreChip">
                <div className="kpiTitle">Interview Depth</div>
                <div className="kpiValue sm" id="interviewDepthScore">{v.interviewDepthScore}</div>
                <button aria-label="Info" className="infoBtn chipInfo"
                  data-info-key="interviewDepthScore" type="button"
                  onClick={() => onInfoKey && onInfoKey('interviewDepthScore')}>i</button>
              </div>

            </div>

            <div className="compactMiniKpis">
              <div className="mini">
                <div className="kpiTitle">First-try pass</div>
                <div className="kpiValue sm" id="firstTryPassRate">{v.firstTryPassRate}</div>
                <button aria-label="Info" className="infoBtn miniInfo"
                  data-info-key="firstTryPassRate" type="button"
                  onClick={() => onInfoKey && onInfoKey('firstTryPassRate')}>i</button>
              </div>
              <div className="mini">
                <div className="kpiTitle">Avg attempts</div>
                <div className="kpiValue sm" id="avgAttemptsToAC">{v.avgAttemptsToAC}</div>
                <button aria-label="Info" className="infoBtn miniInfo"
                  data-info-key="avgAttemptsToAC" type="button"
                  onClick={() => onInfoKey && onInfoKey('avgAttemptsToAC')}>i</button>
              </div>
              <div className="mini">
                <div className="kpiTitle">Median time</div>
                <div className="kpiValue sm" id="medianTimeToAC">{v.medianTimeToAC}</div>
                <button aria-label="Info" className="infoBtn miniInfo"
                  data-info-key="medianTimeToAC" type="button"
                  onClick={() => onInfoKey && onInfoKey('medianTimeToAC')}>i</button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden span for interpretMetric DOM reads */}
        <div className="isHidden">
          <span id="depthAvg">{m.depthOverallScore ?? ''}</span>
        </div>
      </div>

      {isExpanded && <ScoresExpanded metrics={metrics} />}
    </div>
  );
}

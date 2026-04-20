// src/insights/components/McqPanel.jsx
import React, { useRef, useEffect } from 'react';
import { useChart } from '../hooks/useChart.js';
import { mcqDifficultyChartConfig } from '../utils/chartConfigs.js';
import PanelCta from './PanelCta.jsx';

export default function McqPanel({ metrics, onInfoKey, hidden, themeKey, recommendedActions }) {
  const easyRef  = useRef(null);
  const medRef   = useRef(null);
  const hardRef  = useRef(null);

  useChart(easyRef,  'mcqEasy',   (c) => mcqDifficultyChartConfig(c, metrics?.mcqMatrix || [], 'Easy'),   [metrics?.mcqMatrix, themeKey]);
  useChart(medRef,   'mcqMedium', (c) => mcqDifficultyChartConfig(c, metrics?.mcqMatrix || [], 'Medium'), [metrics?.mcqMatrix, themeKey]);
  useChart(hardRef,  'mcqHard',   (c) => mcqDifficultyChartConfig(c, metrics?.mcqMatrix || [], 'Hard'),   [metrics?.mcqMatrix, themeKey]);

  // Set the overall bar fill width and full sentence text whenever MCQ totals change
  useEffect(() => {
    const fill    = document.getElementById('mcqOverallFill');
    const textEl  = document.getElementById('mcqOverallPct');
    const meta    = metrics?.mcqOverallMeta;   // e.g. "184 / 260"
    const pct     = metrics?.mcqOverallPct;    // e.g. "71%"

    if (!fill) return;

    if (!pct || pct === '—') {
      fill.style.width = '0%';
      return;
    }

    const num = parseFloat(String(pct).replace('%', ''));
    fill.style.width = isFinite(num) ? `${Math.min(100, Math.max(0, num))}%` : '0%';

    // Full sentence like vanilla: "184 questions answered correctly out of a total of 260 (71%)"
    if (textEl && meta) {
      const parts = String(meta).split('/').map(s => s.trim());
      if (parts.length === 2) {
        textEl.textContent =
          `${parts[0]} questions answered correctly out of a total of ${parts[1]} (${pct})`;
      } else {
        textEl.textContent = pct;
      }
    }
  }, [metrics?.mcqOverallPct, metrics?.mcqOverallMeta]);

  return (
    <div className={`card panel mcqPanel${hidden ? " isHidden" : ""}`}>
      <div className="shellHead">
        <div>
          <p className="title">MCQ performance</p>
          <p className="desc">Three difficulty views (category on x-axis).</p>
        </div>
        <button aria-label="Info" className="infoBtn" data-info-key="panel_mcq" type="button">i</button>
        <PanelCta panelId="mcq" recommendedActions={recommendedActions} />
      </div>
      <div className="mcqOverallRow">
        <div className="mcqOverallBarOuter">
          <div className="mcqOverallBarInner" id="mcqOverallFill"></div>
          <div className="mcqOverallBarText" id="mcqOverallPct">{metrics?.mcqOverallPct ?? '—'}</div>
        </div>
        <div className="mcqOverallMeta" id="mcqOverallMeta">{metrics?.mcqOverallMeta ?? ''}</div>
      </div>
      <div className="mcqGrid">
        <div className="mcqCard">
          <div className="mcqTitle">Basic</div>
          <button aria-label="Info" className="infoBtn mcqInfo" data-info-key="mcqEasy" type="button">i</button>
          <div className="canvasWrap mcq">
            <canvas ref={easyRef} id="mcqEasyChart" role="img" aria-label="MCQ breadth chart: easy" />
          </div>
        </div>
        <div className="mcqCard">
          <div className="mcqTitle">Intermediate</div>
          <button aria-label="Info" className="infoBtn mcqInfo" data-info-key="mcqMedium" type="button">i</button>
          <div className="canvasWrap mcq">
            <canvas ref={medRef} id="mcqMediumChart" role="img" aria-label="MCQ breadth chart: medium" />
          </div>
        </div>
        <div className="mcqCard">
          <div className="mcqTitle">Advanced</div>
          <button aria-label="Info" className="infoBtn mcqInfo" data-info-key="mcqHard" type="button">i</button>
          <div className="canvasWrap mcq">
            <canvas ref={hardRef} id="mcqHardChart" role="img" aria-label="MCQ breadth chart: hard" />
          </div>
        </div>
      </div>
    </div>
  );
}

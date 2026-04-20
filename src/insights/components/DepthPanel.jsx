// src/insights/components/DepthPanel.jsx
import React, { useRef } from 'react';
import { useChart } from '../hooks/useChart.js';
import { depthChartConfig } from '../utils/chartConfigs.js';
import PanelCta from './PanelCta.jsx';

export default function DepthPanel({ metrics, onInfoKey, hidden, themeKey, recommendedActions }) {
  const canvasRef = useRef(null);
  useChart(
    canvasRef,
    'depth',
    (canvas) => depthChartConfig(canvas, metrics?.depthScores || [], onInfoKey ? () => onInfoKey('panel_depth') : null),
    [metrics?.depthScores, themeKey]
  );
  return (
    <div className={`card panel depthPanel${hidden ? " isHidden" : ""}`}>
      <div className="shellHead">
        <div>
          <p className="title">Depth score by category</p>
          <p className="desc">Normalized focus by category.</p>
        </div>
        <button aria-label="Info" className="infoBtn" data-info-key="panel_depth" type="button">i</button>
        <PanelCta panelId="depth" recommendedActions={recommendedActions} />
      </div>
      <div className="canvasWrap depth">
        <canvas ref={canvasRef} id="depthChart" role="img" aria-label="Depth by category bar chart" />
      </div>
    </div>
  );
}

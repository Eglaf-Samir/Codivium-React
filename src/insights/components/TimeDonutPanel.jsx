// src/insights/components/TimeDonutPanel.jsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import PanelCta from './PanelCta.jsx';
import { useChart } from '../hooks/useChart.js';
import { timePlatformChartConfig, exerciseDonutConfig } from '../utils/chartConfigs.js';

export default function TimeDonutPanel({ metrics, onInfoKey, hiddenTime, hiddenAlloc, themeKey, recommendedActions }) {
  const [timeRange,  setTimeRange]  = useState('7d');
  const [timeGran,   setTimeGran]   = useState('daily');
  const [allocMode,  setAllocMode]  = useState('minutes');   // 'minutes' | 'share'
  const [selectedCat, setSelectedCat] = useState('__all__'); // selected bar category

  const timeCanvasRef  = useRef(null);
  const donutCanvasRef = useRef(null);

  useChart(
    timeCanvasRef, 'time',
    (canvas) => timePlatformChartConfig(canvas, metrics?.dailySeries || [], timeRange, timeGran),
    [metrics?.dailySeries, timeRange, timeGran, themeKey]
  );

  // Pass allocMode and selectedCat into the chart config so it can dim/highlight
  const onCategoryClick = useCallback((category) => {
    if (!category) return;
    setSelectedCat(prev => prev === category ? '__all__' : category);
  }, []);

  useChart(
    donutCanvasRef, 'exercise',
    (canvas) => exerciseDonutConfig(canvas, metrics?.alloc || [], onCategoryClick, allocMode, selectedCat),
    [metrics?.alloc, themeKey, allocMode, selectedCat] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // When a category is selected, populate the detail footer
  useEffect(() => {
    const alloc = metrics?.alloc || [];
    const total = alloc.reduce((s, x) => s + (x.minutes || 0), 0) || 1;
    const detail  = document.getElementById('categoryDetail');
    const hint    = document.getElementById('allocFooterHint');
    const plot    = document.getElementById('exerciseAllocChart')?.closest('.allocPlot');
    const timeEl  = document.getElementById('categoryDetailTime');
    const shareEl = document.getElementById('categoryDetailShare');
    const solvedEl= document.getElementById('categoryDetailSolved');

    if (selectedCat === '__all__') {
      if (detail)  detail.classList.add('isHidden');
      if (hint)    hint.textContent = 'Click a bar to focus a category.';
      if (plot)    plot.style.display = '';
      return;
    }

    const row = alloc.find(x => x.category === selectedCat);
    if (!row || !detail) return;

    const mins   = row.minutes || 0;
    const share  = Math.round((mins / total) * 100);
    const solved = row.solved != null ? row.solved : '—';

    // Format minutes like vanilla's formatDuration
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    const fmtDur = hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;

    if (hint)    hint.textContent  = selectedCat;
    if (timeEl)  timeEl.textContent  = `${fmtDur} (${share}%)`;
    if (shareEl) shareEl.textContent = `${share}%`;
    if (solvedEl) solvedEl.textContent = String(solved);
    if (detail)  detail.classList.remove('isHidden');
    // Hide chart, show detail card (matching vanilla behaviour)
    if (plot)    plot.style.display = 'none';
  }, [selectedCat, metrics?.alloc]);

  function rangeBtn(val, label) {
    return (
      <button key={val}
        className={`segBtn${timeRange === val ? ' isActive' : ''}`}
        data-time-range={val} type="button"
        onClick={() => setTimeRange(val)}
      >{label}</button>
    );
  }
  function granBtn(val, label) {
    return (
      <button key={val}
        className={`segBtn${timeGran === val ? ' isActive' : ''}`}
        data-time-gran={val} type="button"
        onClick={() => setTimeGran(val)}
      >{label}</button>
    );
  }

  return (
    <>
      <div className={`card panel timePanel${hiddenTime ? " isHidden" : ""}`}>
        <div className="shellHead">
          <div>
            <p className="title">Time on platform</p>
            <p className="desc">Switch range and aggregation to see trend + cadence.</p>
          </div>
          <button aria-label="Info" className="infoBtn" data-info-key="panel_time" type="button">i</button>
          <PanelCta panelId="time" recommendedActions={recommendedActions} />
        </div>
        <div className="timeKpis">
          <div className="pill" id="timeThisWeek">{metrics?.timeThisWeek ?? '—'}</div>
          <div className="pill" id="timeLast7Avg">{metrics?.timeLast7Avg ?? '—'}</div>
          <div className="pill" id="timeDays7">{metrics?.timeDays7 ?? '—'}</div>
        </div>
        <div className="timeControls">
          <div aria-label="Range" className="segmented" role="tablist">
            {rangeBtn('7d','7D')}
            {rangeBtn('30d','30D')}
            {rangeBtn('90d','90D')}
            {rangeBtn('ytd','YTD')}
          </div>
          <div aria-label="Aggregation" className="segmented" role="tablist">
            {granBtn('daily','Daily')}
            {granBtn('weekly','Weekly')}
          </div>
        </div>
        <div className="pillRow">
          <div className="pill" id="timePlatformBadge">{metrics?.timePlatformBadge ?? '—'}</div>
        </div>
        <div className="canvasWrap platform">
          <canvas ref={timeCanvasRef} id="timePlatformChart" role="img" aria-label="Time on platform chart" />
        </div>
      </div>

      <div className={`card panel donutPanel${hiddenAlloc ? " isHidden" : ""}`}>
        <div className="shellHead">
          <div>
            <p className="title">Exercise time by category</p>
            <p className="desc">Click a bar to focus a category.</p>
          </div>
          <button aria-label="Info" className="infoBtn" data-info-key="panel_exercise" type="button">i</button>
          <PanelCta panelId="allocation" recommendedActions={recommendedActions} />
        </div>
        <div className="allocControlsRow">
          <div className="pill" id="exerciseTotalBadge">{metrics?.exerciseTotalBadge ?? '—'}</div>
          <div aria-label="Allocation mode" className="segmented allocMode" role="tablist">
            <button
              className={`segBtn${allocMode === 'minutes' ? ' isActive' : ''}`}
              data-alloc-mode="minutes" type="button"
              onClick={() => setAllocMode('minutes')}
            >Minutes</button>
            <button
              className={`segBtn${allocMode === 'share' ? ' isActive' : ''}`}
              data-alloc-mode="share" type="button"
              onClick={() => setAllocMode('share')}
            >Share</button>
          </div>
          <button
            className="segBtn allocResetBtn" id="allocResetBtn" type="button"
            onClick={() => {
              setSelectedCat('__all__');
              const plot = document.getElementById('exerciseAllocChart')?.closest('.allocPlot');
              if (plot) plot.style.display = '';
            }}
          >ALL</button>
        </div>
        <div className="plot allocPlot">
          <canvas ref={donutCanvasRef} id="exerciseAllocChart" role="img" aria-label="Exercise time by category bar chart" />
        </div>
        <div className="allocFooter" id="allocFooter">
          <div className="allocFooterHint" id="allocFooterHint">Click a bar to focus a category.</div>
          <div className="categoryDetail isHidden" id="categoryDetail">
            <div className="categoryDetailRow">
              <div className="categoryDetailLabel">Total time</div>
              <div className="categoryDetailValue" id="categoryDetailTime">—</div>
            </div>
            <div className="categoryDetailRow">
              <div className="categoryDetailLabel">Share of total</div>
              <div className="categoryDetailValue" id="categoryDetailShare">—</div>
            </div>
            <div className="categoryDetailRow">
              <div className="categoryDetailLabel">Exercises completed</div>
              <div className="categoryDetailValue" id="categoryDetailSolved">—</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

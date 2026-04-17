// src/insights/hooks/useChart.js
// Chart.js canvas lifecycle hook.
// Creates a Chart instance when data is ready, updates on data/theme change,
// destroys on unmount. Retries via ResizeObserver if canvas has zero size initially.

import { useRef, useLayoutEffect, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const chartRegistry = {};
export function destroyChart(key) {
  if (chartRegistry[key]) {
    try { chartRegistry[key].destroy(); } catch (_) {}
    delete chartRegistry[key];
  }
}

export function useChart(canvasRef, chartKey, buildConfig, deps) {
  const chartRef    = useRef(null);
  const pendingRef  = useRef(null); // stores deps for retry

  function buildChart() {
    const canvas = canvasRef.current;
    if (!canvas || typeof buildConfig !== 'function') return false;

    destroyChart(chartKey);
    if (chartRef.current) { try { chartRef.current.destroy(); } catch (_) {} chartRef.current = null; }

    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false; // not yet measurable

    try {
      const config = buildConfig(canvas, Chart);
      if (!config) return true;
      const chart = new Chart(canvas, config);
      chartRef.current = chart;
      chartRegistry[chartKey] = chart;
    } catch (e) {
      console.error(`[Insights] Chart "${chartKey}" failed:`, e);
    }
    return true;
  }

  useLayoutEffect(() => {
    const built = buildChart();

    // If canvas had zero size, watch it with ResizeObserver and retry once visible
    if (!built && canvasRef.current && window.ResizeObserver) {
      const canvas = canvasRef.current;
      const ro = new ResizeObserver(() => {
        const r = canvas.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          ro.disconnect();
          buildChart();
        }
      });
      ro.observe(canvas);
      pendingRef.current = ro;
    } else if (pendingRef.current) {
      pendingRef.current.disconnect();
      pendingRef.current = null;
    }

    return () => {
      if (pendingRef.current) { pendingRef.current.disconnect(); pendingRef.current = null; }
      destroyChart(chartKey);
      chartRef.current = null;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return chartRef;
}

// src/insights/hooks/useDashboardMetrics.js
// Derives all KPI values from the raw payload whenever it changes.

import { useMemo } from 'react';
import { computeDashboardMetrics } from '../utils/metrics.js';

export function useDashboardMetrics(dashData, selectedTrack) {
  return useMemo(
    () => computeDashboardMetrics(dashData, selectedTrack),
    [dashData, selectedTrack]
  );
}

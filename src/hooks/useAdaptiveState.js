// hooks/useAdaptiveState.js
// Fetches GET /api/user/adaptive-state.
// Fallback chain: window.__adaptiveFixture → API → FIXTURE

import { useState, useEffect } from 'react';
import { getToken } from './adaptiveUtils.js';

// Default fixture shown when there is no auth token and no window.__adaptiveFixture
const FIXTURE = {
  mode:               'orientation',
  sessionCount:       0,
  lastSessionDaysAgo: null,
  lastSessionLabel:   'No sessions yet',
  primary:            null,
  alternatives:       [],
  categories:         [],
  recentSessions:     [],
  milestone:          null,
  sessionQuality: {
    level: null,
    levels: [
      { name: 'Foundation',    pct: 0, isCurrent: false },
      { name: 'Consolidation', pct: 0, isCurrent: false },
      { name: 'Proficient',    pct: 0, isCurrent: false },
      { name: 'Fluent',        pct: 0, isCurrent: false },
    ],
  },
};

export function useAdaptiveState() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Priority 1: window fixture (demo / testing)
      if (window.__adaptiveFixture) {
        if (!cancelled) {
          setData(window.__adaptiveFixture);
          setLoading(false);
        }
        return;
      }

      const token = getToken();

      // Priority 2: no auth token → show orientation fixture
      if (!token) {
        if (!cancelled) {
          setData(FIXTURE);
          setLoading(false);
        }
        return;
      }

      // Priority 3: API fetch with 8-second timeout
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch('/api/user/adaptive-state', {
          signal:  controller.signal,
          headers: {
            Accept:        'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        clearTimeout(timeoutId);

        if (!cancelled) {
          if (res.status === 401 || res.status === 404) {
            setData(FIXTURE);
          } else if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          } else {
            const json = await res.json();
            setData(json);
          }
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!cancelled) {
          const msg = err.name === 'AbortError' ? 'timeout' : err.message;
          console.warn('[Adaptive] API unavailable:', msg, '— showing fixture');
          setData(FIXTURE);
          setLoading(false);
          setError(msg);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

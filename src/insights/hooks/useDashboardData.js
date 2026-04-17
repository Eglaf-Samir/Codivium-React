// src/insights/hooks/useDashboardData.js
// Central data state for the dashboard.
// Holds the raw API payload and exposes the applyDashboardData bridge
// that the existing insights.bundle.js data bridge already calls via
// window.CodiviumInsights.update(payload).

import { useState, useCallback, useEffect, useRef } from 'react';

// ── UI storage key (matches vanilla dashboard.00b.state.js) ──────────────────
const UI_STORAGE_KEY = 'cv.dashboard.ui';
const UI_DEFAULT = {
  mode: 'full',
  panels: { scores:true, depth:true, heatmap:true, time:true,
            allocation:true, mcq:true, infoPane:true },
};

// ── Normalise helpers (mirrors vanilla) ──────────────────────────────────────
function normaliseMode(m) {
  const s = String(m || '').trim().toLowerCase();
  if (s === 'info_only' || s === 'info-only' || s === 'summary' || s === 'summary_only') return 'info_only';
  return 'full';
}

function normaliseTrack(t) {
  const s = String(t || '').trim().toLowerCase();
  return (s === 'micro' || s === 'interview') ? s : 'combined';
}

function normalisePanels(panels) {
  const out = { ...UI_DEFAULT.panels };
  if (!panels || typeof panels !== 'object') return out;
  for (const k of Object.keys(out)) {
    const v = panels[k];
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number') out[k] = !!v;
    else if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (['1','true','yes','on'].includes(s)) out[k] = true;
      if (['0','false','no','off'].includes(s)) out[k] = false;
    }
  }
  return out;
}

function readUiFromStorage() {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    return { mode: normaliseMode(obj.mode), panels: normalisePanels(obj.panels),
             selectedTrack: normaliseTrack(obj.selectedTrack) };
  } catch (_) { return null; }
}

function writeUiToStorage(ui) {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({
      mode: normaliseMode(ui.mode),
      panels: normalisePanels(ui.panels),
      selectedTrack: normaliseTrack(ui.selectedTrack),
    }));
  } catch (_) {}
}

function readUiFromPayload(payload) {
  try {
    const overallSrc = payload?.overall || payload?.Overall || {};
    const uiObj = payload?.meta?.ui || payload?.meta?.Ui ||
                  overallSrc?.meta?.ui || overallSrc?.meta?.Ui || null;
    if (!uiObj) return null;
    return {
      mode: normaliseMode(uiObj.mode),
      panels: normalisePanels(uiObj.panels),
      selectedTrack: uiObj.selectedTrack ? normaliseTrack(uiObj.selectedTrack) : null,
    };
  } catch (_) { return null; }
}

// ── The main hook ─────────────────────────────────────────────────────────────
export function useDashboardData() {
  // If a demo/test payload was set before React mounted, apply it immediately
  // so the dashboard doesn't depend on the async insights.bundle.js bridge.
  const [dashData, setDashData] = useState(
    () => window.__CODIVIUM_DASHBOARD_DATA__ || null
  );
  // Derive initial UI prefs: localStorage > demo payload > defaults
  const _initUi = (() => {
    const stored = readUiFromStorage();
    if (stored) return stored;
    const d = window.__CODIVIUM_DASHBOARD_DATA__;
    if (d) return readUiFromPayload(d);
    return null;
  })();
  const [uiMode,   setUiMode]   = useState(() => _initUi?.mode   || UI_DEFAULT.mode);
  const [panels,   setPanels]   = useState(() => _initUi?.panels || { ...UI_DEFAULT.panels });
  const [selectedTrack, setSelectedTrack] = useState(
    () => _initUi?.selectedTrack || 'combined'
  );
  const [activeInfoKey, setActiveInfoKey] = useState('welcome');
  const [hasPayload,    setHasPayload]    = useState(
    () => !!window.__CODIVIUM_DASHBOARD_DATA__
  );
  const [anchorDate,    setAnchorDate]    = useState(() => {
    const d = window.__CODIVIUM_DASHBOARD_DATA__;
    if (!d) return null;
    const ad = d.anchorDate ?? d.anchor_date ??
               d.meta?.anchorDate ?? d.meta?.anchor_date ??
               d.snapshotDate ?? null;
    return ad ? String(ad) : null;
  });
  const uiLoadedRef = useRef(false);

  // applyDashboardData — called by the data bridge
  const applyData = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') return;
    setDashData(payload);
    setHasPayload(true);

    // Anchor date
    const ad = payload.anchorDate ?? payload.anchor_date ??
               payload.meta?.anchorDate ?? payload.meta?.anchor_date ??
               payload.snapshotDate ?? null;
    setAnchorDate(ad ? String(ad) : null);

    // UI from payload — only if user has no saved preference
    const hasUserPref = !!localStorage.getItem(UI_STORAGE_KEY);
    const uiFromPayload = readUiFromPayload(payload);
    if (uiFromPayload && !hasUserPref) {
      if (uiFromPayload.mode)   setUiMode(uiFromPayload.mode);
      if (uiFromPayload.panels) setPanels(uiFromPayload.panels);
    }
    if (uiFromPayload?.selectedTrack) setSelectedTrack(uiFromPayload.selectedTrack);
  }, []);

  // Persist UI changes to localStorage
  const setAndPersistMode = useCallback((mode) => {
    setUiMode(mode);
    writeUiToStorage({ mode, panels, selectedTrack });
  }, [panels, selectedTrack]);

  const setAndPersistPanels = useCallback((nextPanelsOrFn) => {
    if (typeof nextPanelsOrFn === 'function') {
      setPanels(prev => {
        const next = nextPanelsOrFn(prev);
        writeUiToStorage({ mode: uiMode, panels: next, selectedTrack });
        return next;
      });
    } else {
      setPanels(nextPanelsOrFn);
      writeUiToStorage({ mode: uiMode, panels: nextPanelsOrFn, selectedTrack });
    }
  }, [uiMode, selectedTrack]);

  const setAndPersistTrack = useCallback((track) => {
    setSelectedTrack(track);
    writeUiToStorage({ mode: uiMode, panels, selectedTrack: track });
  }, [uiMode, panels]);

  // Wire window.CodiviumInsights.update → applyData
  useEffect(() => {
    window.CodiviumInsights = window.CodiviumInsights || {};
    window.CodiviumInsights.update = applyData;
    window.CodiviumInsights.init   = applyData; // legacy alias
    window.CodiviumInsights.setInfoPane = (key) => setActiveInfoKey(key);
    window.CodiviumInsights.toggleInfoPane = () =>
      setAndPersistPanels(p => ({ ...p, infoPane: !p.infoPane }));
    // setUiPrefs — called by settings page when default layout is changed
    // while the dashboard is already open in another tab.
    window.CodiviumInsights.setUiPrefs = (preset) => {
      if (!preset || typeof preset !== 'object') return;
      if (preset.mode)   setAndPersistMode(normaliseMode(preset.mode));
      if (preset.panels) setAndPersistPanels(normalisePanels(preset.panels));
    };

    // If data was already queued before React mounted (insights.bundle.js may have
    // called CodiviumInsights.update before our hook ran), re-apply it.
    if (window.CodiviumInsights.__pendingPayload) {
      applyData(window.CodiviumInsights.__pendingPayload);
      delete window.CodiviumInsights.__pendingPayload;
    }
  }, [applyData, setAndPersistMode, setAndPersistPanels]);

  return {
    dashData, hasPayload, anchorDate,
    uiMode, panels, selectedTrack, activeInfoKey,
    setMode:         setAndPersistMode,
    setPanels:       setAndPersistPanels,
    setSelectedTrack: setAndPersistTrack,
    setActiveInfoKey,
    applyData,
  };
}

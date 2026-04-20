// src/insights/components/AnalyseMode.jsx
// Analyse mode toggle — port of dashboard.09.analyse-mode.js.
// When active: panels get a hover highlight, clicking any panel loads its
// analysis into the info pane and ensures the info pane is visible.
import { useEffect, useCallback, useState } from 'react';

const PANEL_MAP = {
  scoresPalette: 'panel_scores',
  depthPanel:    'panel_depth',
  heatmapPanel:  'panel_heatmap',
  timePanel:     'panel_time',
  donutPanel:    'panel_exercise',
  mcqPanel:      'panel_mcq',
};
const SEEN_KEY = 'cv_analyse_mode_seen';

function getPanelKey(el) {
  if (!el || !el.closest) return null;
  for (const [cls, key] of Object.entries(PANEL_MAP)) {
    if (el.closest('.' + cls)) return key;
  }
  return null;
}

/**
 * @param {React.RefObject} mountRef       - ref to #ciMount element
 * @param {function}        onInfoKey      - called with the info key to display
 * @param {function}        onEnsurePaneOpen - called to ensure info pane is visible
 */
export function useAnalyseMode(mountRef, onInfoKey, onEnsurePaneOpen) {
  const [active, setActive] = useState(false);

  const toggle = useCallback(() => setActive(v => !v), []);

  // Apply/remove the cv-analyse-active class on #ciMount
  useEffect(() => {
    const mount = document.getElementById('ciMount');
    if (!mount) return;
    mount.classList.toggle('cv-analyse-active', active);

    if (active) {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {}
    }
  }, [active]);

  // Panel click handler while active — fires on the whole document
  // so the user can click anywhere inside a panel
  useEffect(() => {
    if (!active) return;

    function onClick(e) {
      // Don't intercept clicks on info buttons, controls, canvases etc.
      // Only trigger on a genuine panel body click
      if (e.target?.closest?.('.infoBtn, button, a, input, select, canvas')) return;
      const key = getPanelKey(e.target);
      if (!key) return;

      onInfoKey(key);
      // Ensure the info pane is open so the user sees the result
      if (typeof onEnsurePaneOpen === 'function') onEnsurePaneOpen();
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [active, onInfoKey, onEnsurePaneOpen]);

  return { analyseActive: active, toggleAnalyse: toggle };
}

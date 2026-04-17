// src/insights/hooks/useResizers.js
// Drag-splitter system. Manages --cv-info-w, --cv-mcq-h CSS custom properties
// on #ciMount, persisted to localStorage.
//
// Bug fix: the restore-on-mount effect previously read mountRef.current which
// was null at that point (assigned by a later useEffect in InsightsDashboard).
// All effects now call document.getElementById('ciMount') directly instead.

import { useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY    = 'cv.dashboard.resizers';
const INFO_W_MIN     = 300;
const INFO_W_MAX     = 680;
const MCQ_H_MIN      = 160;
const MCQ_H_MAX      = 620;
const INFO_W_DEFAULT = 380;

function readState()   { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { return {}; } }
function writeState(p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readState(), ...p })); } catch (_) {} }
function getMount()    { return document.getElementById('ciMount'); }

export function useResizers(mountRef) {
  const dragging = useRef(null);

  // ── Restore saved sizes on mount ──────────────────────────────────────────
  // NOTE: reads getMount() directly — mountRef.current is null at this point
  // because its assignment useEffect runs after this one.
  useEffect(() => {
    const mount = getMount();
    if (!mount) return;

    const st    = readState();
    const infoW = (st.infoW && st.infoW >= INFO_W_MIN) ? st.infoW : INFO_W_DEFAULT;
    mount.style.setProperty('--cv-info-w', infoW + 'px');
    if (st.mcqH)     mount.style.setProperty('--cv-mcq-h',    st.mcqH    + 'px');
    if (st.heatCols) mount.style.setProperty('--cv-heat-cols', st.heatCols);

    // Restore per-panel flex values
    const flex = [
      ['.scoresPalette', st.scoresFlex],
      ['.depthPanel',    st.depthFlex],
      ['.timePanel',     st.timeFlex],
      ['.donutPanel',    st.donutFlex],
    ];
    flex.forEach(([sel, val]) => {
      if (val != null) {
        const el = mount.querySelector(sel);
        if (el) el.style.setProperty('flex', val + ' 1 0', 'important');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once

  // ── Global mouse handlers while dragging ─────────────────────────────────
  useEffect(() => {
    function onMove(e) {
      const d = dragging.current;
      if (!d) return;
      const mount = getMount();
      if (!mount) return;

      if (d.type === 'info-v') {
        // Drag left → widen info pane
        const delta = d.startX - e.clientX;
        const newW  = Math.min(INFO_W_MAX, Math.max(INFO_W_MIN, d.startVal + delta));
        mount.style.setProperty('--cv-info-w', newW + 'px');
        writeState({ infoW: Math.round(newW) });
      } else if (d.type === 'mcq-h') {
        // Drag up → taller MCQ row
        const delta = d.startY - e.clientY;
        const newH  = Math.min(MCQ_H_MAX, Math.max(MCQ_H_MIN, d.startVal + delta));
        mount.style.setProperty('--cv-mcq-h', newH + 'px');
        writeState({ mcqH: Math.round(newH) });
      }
    }

    function onUp() {
      dragging.current = null;
      document.body.classList.remove('cv-dragging');
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []); // stable — no deps needed; getMount() is called lazily

  // ── Info-pane vertical splitter ───────────────────────────────────────────
  const onInfoSplitterDown = useCallback((e) => {
    const mount = getMount();
    if (!mount) return;
    const raw      = mount.style.getPropertyValue('--cv-info-w');
    const startVal = parseFloat(raw) || INFO_W_DEFAULT;
    dragging.current = { type: 'info-v', startX: e.clientX, startVal };
    document.body.classList.add('cv-dragging');
    e.preventDefault();
  }, []);

  // ── MCQ row splitter ──────────────────────────────────────────────────────
  const onMcqSplitterDown = useCallback((e) => {
    const mount = getMount();
    if (!mount) return;
    const raw      = mount.style.getPropertyValue('--cv-mcq-h');
    const startVal = parseFloat(raw) || 320;
    dragging.current = { type: 'mcq-h', startY: e.clientY, startVal };
    document.body.classList.add('cv-dragging');
    e.preventDefault();
  }, []);

  return { onInfoSplitterDown, onMcqSplitterDown };
}

// hooks/useSplitter.js
// Drag-to-resize splitter.
// Uses refs + direct CSS variable mutation for performance —
// no React re-renders during the drag loop.
import { useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cv_ws_sizes';

function loadSizes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function saveSizes(sizes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes)); } catch (_) {}
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export function useSplitters(workspaceRef) {
  // useRef so loadSizes() runs exactly once (on mount), not on every render
  const savedSizesRef = useRef(null);
  if (savedSizesRef.current === null) {
    savedSizesRef.current = loadSizes() ?? false; // false = "checked, nothing found"
  }
  const savedSizes = savedSizesRef.current || null;

  // Apply initial sizes via CSS variables on the workspace element
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    if (savedSizes) {
      if (savedSizes.leftPct)  ws.style.setProperty('--ws-left-px', savedSizes.leftPct);
      if (savedSizes.topPct)   ws.style.setProperty('--ws-top-px',  savedSizes.topPct);
      if (savedSizes.replPct)  ws.style.setProperty('--ws-repl-left-px', savedSizes.replPct);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Factory: creates a splitter drag handler for a given axis/dimension
  const makeDragHandler = useCallback((cssVar, axis, minPct, maxPct) => {
    return (e) => {
      e.preventDefault();
      const ws = workspaceRef.current;
      if (!ws) return;

      const rect    = ws.getBoundingClientRect();
      const total   = axis === 'x' ? rect.width : rect.height;
      const startPos = axis === 'x' ? e.clientX : e.clientY;
      const startVal = parseFloat(
        getComputedStyle(ws).getPropertyValue(cssVar).trim()
      ) || total * 0.5;

      function onMove(mv) {
        const delta = (axis === 'x' ? mv.clientX : mv.clientY) - startPos;
        const newVal = clamp(startVal + delta, total * minPct, total * maxPct);
        ws.style.setProperty(cssVar, `${newVal}px`);
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
        // Persist after drag ends
        const sizes = {
          leftPct: ws.style.getPropertyValue('--ws-left-px') || null,
          topPct:  ws.style.getPropertyValue('--ws-top-px')  || null,
          replPct: ws.style.getPropertyValue('--ws-repl-left-px') || null,
        };
        saveSizes(sizes);
        // Notify any editor instances to refresh
        window.dispatchEvent(new Event('cv:splitter-resize'));
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    };
  }, [workspaceRef]);

  const onVerticalSplitDrag    = makeDragHandler('--ws-left-px',      'x', 0.20, 0.80);
  const onHorizontalSplitDrag  = makeDragHandler('--ws-top-px',       'y', 0.20, 0.85);
  const onReplSplitDrag        = makeDragHandler('--ws-repl-left-px', 'x', 0.20, 0.80);

  return { onVerticalSplitDrag, onHorizontalSplitDrag, onReplSplitDrag };
}

// src/insights/components/HeatmapPanel.jsx
// Convergence heatmap panel — React port of renderConvergenceHeatmap /
// renderHeatmapVirtual from dashboard.06.mcq-and-render.js.
//
// heatmapData shape:
//   { categories: string[], buckets: string[5], values: number[][], counts: number[][] | null }
//   values[row][col] = 0..1 pass-rate for that category × attempt bucket
//   counts[row][col] = number of sessions (optional, used for tooltip)
//
// Rendering: virtualised scroll — only visible rows are in the DOM.
// Colour:    OKLCH metallic rainbow ramp (red → violet) matching vanilla heatColor().

import React, {
  useRef, useEffect, useCallback, useMemo, useState,
} from 'react';
import PanelCta from './PanelCta.jsx';

const TOP_N_MIN = 3;
const TOP_N_MAX = 30;
const TOP_N_DEF = 12;

const ROW_H        = 42;   // px — must match CSS .hRow height
const BUCKETS_DEF  = ['A1','A2','A3','A4','A5'];
const OVERSCAN     = 3;    // extra rows rendered above/below viewport

// ── Colour ────────────────────────────────────────────────────────────────────
// Direct port of heatColor() from dashboard.06.mcq-and-render.js
function heatColor(v) {
  const t0 = Math.max(0, Math.min(1, v));
  const t  = Math.pow(t0, 0.75);

  const hues = [10, 30, 55, 135, 210, 250, 290];
  const n = hues.length - 1;
  const p = t * n;
  const i = Math.max(0, Math.min(n - 1, Math.floor(p)));
  const f = p - i;
  const hue = hues[i] + (hues[i + 1] - hues[i]) * f;

  const L = 0.22 + 0.56 * t;
  const C = 0.11 + 0.03 * t;

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  function oklchToSrgb(Lv, Cv, hDeg) {
    const h    = (hDeg * Math.PI) / 180;
    const a    = Cv * Math.cos(h);
    const bLab = Cv * Math.sin(h);

    const l_ = Lv + 0.3963377774 * a + 0.2158037573 * bLab;
    const m_ = Lv - 0.1055613458 * a - 0.0638541728 * bLab;
    const s_ = Lv - 0.0894841775 * a - 1.2914855480 * bLab;

    const l  = l_ * l_ * l_;
    const m  = m_ * m_ * m_;
    const s  = s_ * s_ * s_;

    let rL = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gL = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bL = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    rL = clamp01(rL); gL = clamp01(gL); bL = clamp01(bL);

    function compand(u) {
      return u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
    }
    return {
      r: Math.round(compand(rL) * 255),
      g: Math.round(compand(gL) * 255),
      b: Math.round(compand(bL) * 255),
    };
  }

  const rgb = oklchToSrgb(L, C, hue);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},0.94)`;
}

// ── Single cell ───────────────────────────────────────────────────────────────
function HeatCell({ category, bucketLabel, value, count }) {
  const isEmpty = value === null || typeof value !== 'number' || !isFinite(value);
  const pct     = isEmpty ? null : `${Math.round(value * 100)}%`;
  const color   = isEmpty ? 'rgba(255,255,255,0.04)' : heatColor(value);
  const cText   = count && count > 0 ? ` · n=${count}` : '';
  const title   = isEmpty
    ? `${category} · ${bucketLabel} · no data`
    : `${category} · ${bucketLabel} · ${pct} tests passed${cText}`;

  return (
    <div
      className={`hCell hHeat${isEmpty ? ' hEmpty' : ''}`}
      style={{ '--heat': color }}
      title={title}
    >
      <span className="hVal" style={isEmpty ? { opacity: 0.55 } : undefined}>
        {isEmpty ? '—' : pct}
      </span>
    </div>
  );
}

// ── Single row ────────────────────────────────────────────────────────────────
function HeatRow({ row, buckets }) {
  return (
    <div className="hRow" style={{ height: ROW_H }}>
      <div className="hCell hRowLabel" title={row.category}>
        <span className="hLabel">{row.category}</span>
      </div>
      {buckets.map((b, i) => (
        <HeatCell
          key={b}
          category={row.category}
          bucketLabel={b}
          value={row.values[i] ?? null}
          count={row.counts ? row.counts[i] : 0}
        />
      ))}
    </div>
  );
}

// ── Virtualised body ──────────────────────────────────────────────────────────
function HeatmapVirtual({ rows, buckets }) {
  const hostRef    = useRef(null);
  const [slice, setSlice] = useState({ start: 0, end: 20 });

  const recalc = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const scrollTop = host.scrollTop;
    const height    = host.clientHeight || 300;
    const start     = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
    const visible   = Math.ceil(height / ROW_H) + OVERSCAN * 2;
    const end       = Math.min(rows.length, start + visible);
    setSlice(s => (s.start === start && s.end === end ? s : { start, end }));
  }, [rows.length]);

  useEffect(() => {
    recalc();
  }, [rows.length, recalc]);

  // Sync scrollbar gutter width onto wrapper so the fixed header aligns
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const syncGutter = () => {
      const wrap = host.closest('.heatmapWrap');
      if (!wrap) return;
      const sbw = Math.max(0, host.offsetWidth - host.clientWidth);
      wrap.style.setProperty('--cv-sbw', `${sbw}px`);
    };
    syncGutter();
    const ro = new ResizeObserver(syncGutter);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const totalH = rows.length * ROW_H;
  const offsetY = slice.start * ROW_H;
  const visible = rows.slice(slice.start, slice.end);

  return (
    <div
      ref={hostRef}
      className="heatmapBody heatmapVirt"
      id="convergenceHeatmap"
      onScroll={recalc}
    >
      {/* Spacer drives the scrollbar height */}
      <div className="hVirtSpacer" style={{ height: totalH }} />
      {/* Visible rows, translated to their absolute position */}
      <div
        className="hVirtItems"
        style={{ transform: `translateY(${offsetY}px)` }}
      >
        {visible.map(row => (
          <HeatRow key={row.category} row={row} buckets={buckets} />
        ))}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function HeatmapPanel({ heatmapCells, onInfoKey, hidden, themeKey,
  heatmapView, onViewChange, hasMicro, hasInterview, recommendedActions,
  allocData, depthData }) {
  // Normalise incoming data into rows
  const { rows, buckets } = useMemo(() => {
    const hd = heatmapCells;
    if (!hd || !Array.isArray(hd.categories) || !hd.categories.length) {
      return { rows: [], buckets: BUCKETS_DEF };
    }

    const bkts = Array.isArray(hd.buckets) && hd.buckets.length
      ? hd.buckets.slice(0, 5)
      : BUCKETS_DEF;

    const parsed = hd.categories.map((cat, i) => {
      const rawVals = Array.isArray(hd.values[i]) ? hd.values[i] : [];
      const rawCnts = hd.counts && Array.isArray(hd.counts[i]) ? hd.counts[i] : [];
      const values  = [];
      const counts  = [];
      for (let k = 0; k < 5; k++) {
        const v = rawVals[k];
        values.push((v === null || v === undefined) ? null : Number(v));
        const n = Number(rawCnts[k]);
        counts.push(isFinite(n) && n >= 0 ? Math.floor(n) : 0);
      }
      return { category: String(cat), values, counts };
    });

    return { rows: parsed, buckets: bkts };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmapCells, themeKey]);

  const [topN,     setTopN]     = useState(TOP_N_DEF);
  const [rankMode, setRankMode] = useState('impact');
  const activeView = heatmapView || 'focus';

  // Exact mode IDs and labels matching vanilla MOCK_MODES
  const RANK_MODES = [
    { id: 'impact',            label: 'Impact (time × weakness)' }, // default
    { id: 'worst_convergence', label: 'Worst convergence'            },
    { id: 'most_time',         label: 'Most time spent'              },
    { id: 'lowest_depth',      label: 'Lowest depth'                 },
    { id: 'highest_friction',  label: 'Highest friction'             },
  ];

  // Slice to topN when we have more rows than the current limit
  // ── Rank rows for Focus view (matches vanilla seedMockHeatmap / renderConvergenceHeatmap)
  const rankedRows = useMemo(() => {
    if (activeView !== 'focus' || !rows.length) return rows;

    const alloc = Array.isArray(allocData) ? allocData : [];
    const depth = Array.isArray(depthData) ? depthData : [];

    // Build lookup maps
    const minutesMap = {};
    alloc.forEach(x => { if (x.category) minutesMap[x.category] = x.minutes || 0; });
    const depthMap = {};
    depth.forEach(x => { if (x.category) depthMap[x.category] = Number(x.depth) || 0; });

    // Early convergence: mean of A1-A3 columns (indices 0-2)
    const earlyConv = (row) => {
      const vals = row.values.slice(0, 3).filter(v => v != null && isFinite(v));
      return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0.5;
    };

    const sorted = rows.slice();

    switch (rankMode) {
      case 'worst_convergence':
        // Lowest early convergence first (worst = highest priority)
        sorted.sort((a,b) => earlyConv(a) - earlyConv(b));
        break;

      case 'most_time':
        // Highest minutes first
        sorted.sort((a,b) => (minutesMap[b.category]||0) - (minutesMap[a.category]||0));
        break;

      case 'lowest_depth':
        // Lowest depth first
        sorted.sort((a,b) => (depthMap[a.category]||0) - (depthMap[b.category]||0));
        break;

      case 'highest_friction':
        // minutes × (1 - early convergence) — high friction = spent time but low pass rate
        sorted.sort((a,b) => {
          const fA = (minutesMap[a.category]||0) * (1 - earlyConv(a));
          const fB = (minutesMap[b.category]||0) * (1 - earlyConv(b));
          return fB - fA;
        });
        break;

      case 'impact':
      default:
        // impact = minutes × (1 - early_convergence) — same formula as vanilla
        sorted.sort((a,b) => {
          const iA = (minutesMap[a.category]||0) * (1 - earlyConv(a));
          const iB = (minutesMap[b.category]||0) * (1 - earlyConv(b));
          return iB - iA;
        });
        break;
    }

    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, activeView, rankMode, allocData, depthData]);

  const visibleRows = useMemo(
    () => {
      const base = rankedRows;
      return base.length > topN ? base.slice(0, topN) : base;
    },
    [rankedRows, topN]
  );
  const isEmpty = rows.length === 0;

  return (
    <div className={`card panel heatmapPanel${hidden ? ' isHidden' : ''}`}>
      <div className="shellHead">
        <div>
          <p className="title">Convergence heatmap</p>
          <p className="desc">Average unit test pass% by attempt number (1 → 5).</p>
        </div>
        <button
          aria-label="Info"
          className="infoBtn"
          data-info-key="panel_heatmap"
          type="button"
        >i</button>
        <PanelCta panelId="heatmap" recommendedActions={recommendedActions} />
      </div>

      <div className="heatmapWrap">
        {/* View tabs: Focus / All / Micro / Interview */}
        <div className="heatmapControls">
          <div className="heatmapControlsRow">
            <div aria-label="Heatmap view" className="segmented heatmapViews" role="tablist">
              {[
                { key: 'focus',     label: 'Focus' },
                { key: 'all',       label: 'All' },
                { key: 'micro',     label: 'Micro',     disabled: !hasMicro },
                { key: 'interview', label: 'Interview', disabled: !hasInterview },
              ].map(({ key, label, disabled }) => (
                <button
                  key={key}
                  className={`segBtn${activeView === key ? ' isActive' : ''}`}
                  data-heatmap-view={key}
                  type="button"
                  disabled={disabled}
                  title={disabled ? `${label} heatmap not available` : undefined}
                  onClick={() => typeof onViewChange === 'function' && onViewChange(key)}
                >{label}</button>
              ))}
            </div>

            {/* Focus mode: Rank by + Top N */}
            {activeView === 'focus' && (
              <div className="heatmapFocusControls" id="heatmapFocusControls">
                <label className="heatmapCtl">
                  <span>Rank by</span>
                  <select
                    id="heatmapFocusMode"
                    aria-label="Rank by"
                    value={rankMode}
                    onChange={e => setRankMode(e.target.value)}
                  >
                    {RANK_MODES.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {/* TopN counter — only in focus/all modes */}
            {rows.length > TOP_N_MIN && (
              <>
                <div className="heatmapCtl">
                  <span>Top</span>
                  <input
                    id="heatmapTopN"
                    type="number"
                    min={TOP_N_MIN}
                    max={Math.min(TOP_N_MAX, rows.length)}
                    value={topN}
                    onChange={e => {
                      const v = Math.min(TOP_N_MAX, Math.max(TOP_N_MIN,
                        Math.floor(Number(e.target.value)) || TOP_N_DEF));
                      setTopN(v);
                    }}
                    aria-label="Number of categories to show"
                  />
                </div>
                <div className="heatmapCtl" style={{color:'var(--color-text-muted,rgba(245,245,252,0.45))',fontSize:'11px'}}>
                  {visibleRows.length} of {rows.length} shown
                </div>
              </>
            )}
          </div>
        </div>
        {/* Fixed column header — bucket labels */}
        <div className="heatmapHead">
          <div className="hCell hLabel" />
          {buckets.map(b => (
            <div key={b} className="hCell">{b}</div>
          ))}
        </div>

        {isEmpty ? (
          <div
            className="heatmapBody"
            style={{ display: 'flex', alignItems: 'center',
                     justifyContent: 'center', padding: '24px 16px' }}
          >
            <div className="heatmapEmpty">
              No heatmap data yet — complete coding sessions to populate this panel.
            </div>
          </div>
        ) : (
          <HeatmapVirtual rows={visibleRows} buckets={buckets} />
        )}
      </div>
    </div>
  );
}

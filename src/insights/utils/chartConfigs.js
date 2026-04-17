// src/insights/utils/chartConfigs.js
// Chart.js configuration builders. Pure functions — no DOM access except
// reading CSS variables from documentElement (same as vanilla baseChartOptions).

function cssVar(name) {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (_) { return ''; }
}
function shouldReduceMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}

function baseOpts() {
  const tick  = cssVar('--color-chart-axis')  || 'rgba(245,245,252,0.70)';
  const grid  = cssVar('--color-chart-grid')  || 'rgba(255,255,255,0.08)';
  const font  = cssVar('--font-ui') || cssVar('--font') || 'sans-serif';
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: cssVar('--color-chart-label') || 'rgba(245,245,252,0.72)',
                  boxWidth: 10, boxHeight: 10, font: { family: font, weight: '700' } },
      },
      tooltip: {
        backgroundColor: cssVar('--color-chart-tooltip-bg')     || 'rgba(14,16,26,0.97)',
        borderColor:     cssVar('--color-chart-tooltip-border')  || 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        titleColor:  cssVar('--color-chart-tooltip-title') || 'rgba(245,245,252,0.92)',
        bodyColor:   cssVar('--color-chart-tooltip-body')  || 'rgba(245,245,252,0.82)',
        cornerRadius: 12,
      },
    },
    scales: {
      x: { ticks: { color: tick, font: { family: font, weight: '700', size: 10 } },
           grid: { color: grid }, border: { display: false } },
      y: { ticks: { color: tick, font: { family: font, weight: '700', size: 10 } },
           grid: { color: grid }, border: { display: false } },
    },
  };
  if (shouldReduceMotion()) {
    opts.animation = false;
    opts.transitions = { active: { animation: { duration: 0 } }, resize: { animation: { duration: 0 } } };
  }
  return opts;
}

// Pastel palette — reads CSS vars at render time (matches vanilla getPastels)
function getPastels() {
  return [
    cssVar('--color-chart-bar-1') || 'rgba(246,213,138,0.55)',
    cssVar('--color-chart-bar-2') || 'rgba(94,234,212,0.45)',
    cssVar('--color-chart-bar-3') || 'rgba(129,140,248,0.42)',
    cssVar('--color-chart-bar-4') || 'rgba(251,113,133,0.38)',
    cssVar('--color-chart-bar-5') || 'rgba(253,224,71,0.35)',
    cssVar('--color-chart-bar-1') || 'rgba(246,213,138,0.55)',
    cssVar('--color-chart-bar-2') || 'rgba(94,234,212,0.45)',
    cssVar('--color-chart-bar-3') || 'rgba(129,140,248,0.42)',
    cssVar('--color-chart-bar-4') || 'rgba(251,113,133,0.38)',
    cssVar('--color-chart-bar-5') || 'rgba(253,224,71,0.35)',
    cssVar('--color-chart-bar-1') || 'rgba(246,213,138,0.55)',
    cssVar('--color-chart-bar-2') || 'rgba(94,234,212,0.45)',
  ];
}
function getPastelBorders() {
  return getPastels().map(c => c.replace(/0\.\d+\)$/, '0.85)'));
}

// ── Depth chart ──────────────────────────────────────────────────────────────
export function depthChartConfig(canvas, depthScores, onDepthClick) {
  const PASTELS = getPastels(); const PASTEL_BORDERS = getPastelBorders();
  const rows = (depthScores || []).slice().sort((a,b) =>
    String(a.category||'').localeCompare(String(b.category||''), undefined, { sensitivity:'base' }));
  const labels = rows.map(x => x.category);
  const raw    = rows.map(x => Number(x.depth) || 0);
  const maxV   = raw.reduce((a,b) => Math.max(a,b), 0);
  const scale  = (maxV > 0 && maxV <= 1.2) ? 100 : 1;
  const values = raw.map(v => Math.round(v * scale));

  const opts = baseOpts();
  opts.plugins.legend.display = false;
  opts.scales.y.ticks.callback = v => `${v}%`;
  opts.scales.y.title = { display: true, text: 'Depth (%)', color: cssVar('--color-chart-axis') || 'rgba(245,245,252,0.70)', font: { weight: '800', size: 10 } };
  opts.scales.y.suggestedMin = 0;
  opts.scales.y.suggestedMax = 100;
  opts.layout = { padding: { left: 9, top: 4, right: 4, bottom: 0 } };

  const w = canvas.getBoundingClientRect().width || 800;
  const maxTicks = w < 720 ? 6 : w < 980 ? 8 : w < 1260 ? 10 : 12;
  const rot      = w < 720 ? 60 : w < 980 ? 45 : w < 1260 ? 30 : 0;
  opts.scales.x.ticks.maxRotation  = rot;
  opts.scales.x.ticks.minRotation  = rot;
  opts.scales.x.ticks.autoSkip     = true;
  opts.scales.x.ticks.maxTicksLimit = maxTicks;
  opts.scales.x.ticks.callback = (v, i) => {
    const s = String(labels[i] ?? v);
    return s.length > 14 ? s.slice(0, 13) + '…' : s;
  };

  // Bar click → open panel_depth info pane (matching vanilla)
  if (typeof onDepthClick === 'function') {
    opts.onClick = (_evt, elements) => {
      if (elements && elements.length > 0) onDepthClick('panel_depth');
    };
    opts.onHover = (evt, elements) => {
      if (evt.native && evt.native.target)
        evt.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    };
  }

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Depth', data: values,
        backgroundColor: labels.map((_,i) => PASTELS[i % PASTELS.length]),
        borderColor:     labels.map((_,i) => PASTEL_BORDERS[i % PASTEL_BORDERS.length]),
        borderWidth: 1, borderRadius: 10 }],
    },
    options: opts,
  };
}

// ── Time platform chart ───────────────────────────────────────────────────────
// Matches vanilla: line/area chart, y-axis in MINUTES, locale-aware date labels.
export function timePlatformChartConfig(canvas, dailySeries, range='7d', gran='daily') {
  const now = new Date(); now.setHours(23,59,59,999);
  const ranges = { '7d': 7, '30d': 30, '90d': 90, 'ytd': null };
  let start = new Date(now);
  if (range === 'ytd') { start = new Date(now.getFullYear(), 0, 1); start.setHours(0,0,0,0); }
  else { start = new Date(now); start.setDate(now.getDate() - (ranges[range]||7) + 1); start.setHours(0,0,0,0); }

  let filtered = (dailySeries || []).filter(x => x.date >= start && x.date <= now);

  function fmtDate(d) {
    try { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    catch (_) { return d.getDate() + '/' + (d.getMonth()+1); }
  }

  let labels = [], data = [];
  if (gran === 'weekly') {
    const weeks = new Map();
    filtered.forEach(x => {
      const mon = new Date(x.date);
      mon.setDate(x.date.getDate() - ((x.date.getDay() + 6) % 7));
      const key = mon.toISOString().slice(0,10);
      weeks.set(key, (weeks.get(key)||0) + x.minutes);
    });
    const entries = [...weeks.entries()];
    labels = entries.map(([k]) => fmtDate(new Date(k)));
    data   = entries.map(([, v]) => v);
  } else {
    labels = filtered.map(x => fmtDate(x.date));
    data   = filtered.map(x => x.minutes);
  }

  const opts = baseOpts();
  opts.plugins.legend.display = false;
  opts.scales.y.ticks.callback = v => String(v);
  opts.scales.y.title = {
    display: true, text: 'Minutes',
    color: cssVar('--color-chart-axis') || 'rgba(245,245,252,0.70)',
    font: { weight: '800', size: 10 },
  };
  opts.scales.y.suggestedMin = 0;
  opts.scales.x.title = { display: false };

  const w = canvas.getBoundingClientRect().width || 800;
  const dense = labels.length > 40;
  let maxTicks = dense ? 12 : 24, rot = 0, botPad = 30;
  if (w < 720)       { maxTicks = dense ? 8  : 12; rot = 45; botPad = 38; }
  else if (w < 980)  { maxTicks = dense ? 10 : 16; rot = dense ? 0 : 20; botPad = 34; }
  else if (w < 1260) { maxTicks = dense ? 12 : 20; botPad = 32; }
  else               { maxTicks = dense ? 14 : 24; }
  opts.scales.x.ticks.maxRotation   = rot;
  opts.scales.x.ticks.minRotation   = rot;
  opts.scales.x.ticks.autoSkip      = true;
  opts.scales.x.ticks.maxTicksLimit = maxTicks;
  opts.scales.x.ticks.includeBounds = true;
  opts.layout = { padding: { bottom: botPad } };

  const col  = cssVar('--color-chart-series-1')      || 'rgba(246,213,138,0.85)';
  const fill = cssVar('--color-chart-series-1-fill') || 'rgba(246,213,138,0.12)';

  return {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Minutes', data,
        borderColor: col, backgroundColor: fill,
        pointRadius: dense ? 0 : 2, tension: 0.35, fill: true }],
    },
    options: opts,
  };
}
// ── Exercise allocation — horizontal bar chart ───────────────────────────────
// Matches vanilla renderExerciseTreemap:
//   - alphabetical sort, minutes or share mode, bar selection highlighting,
//     rich tooltip, gold border on selected bar, dim on non-selected.
export function exerciseDonutConfig(canvas, alloc, onCategoryClick, allocMode, selectedCat) {
  const mode    = allocMode || 'minutes';
  const selCat  = selectedCat || '__all__';

  // Sort alphabetically (vanilla sort)
  const sorted  = (alloc || [])
    .slice()
    .sort((a,b) => String(a.category||'').localeCompare(String(b.category||''), undefined, { sensitivity: 'base' }))
    .filter(x => (x.minutes || 0) > 0);

  const total   = sorted.reduce((s, x) => s + (x.minutes || 0), 0) || 1;
  const labels  = sorted.map(x => x.category);
  const minutes = sorted.map(x => x.minutes || 0);
  const shares  = sorted.map(x => Math.round((x.minutes||0) / total * 100));
  const values  = mode === 'share' ? shares : minutes;

  // Bar colours: gold highlight on selected, dim on non-selected
  const PASTELS_      = getPastels();
  const PASTEL_BORDS_ = getPastelBorders();
  const selectedColor = cssVar('--color-chart-selected-bar') || 'rgba(246,213,138,0.55)';
  const unselColor    = cssVar('--color-chart-unselected-bar') || 'rgba(255,255,255,0.08)';

  const bgColors = labels.map((c, i) => {
    const base = PASTELS_[i % PASTELS_.length];
    if (selCat !== '__all__' && c !== selCat) {
      return base.replace(/[\d.]+\)$/, '0.22)');
    }
    return base;
  });
  const borderColors = labels.map(c =>
    c === selCat ? selectedColor : unselColor
  );

  const opts = baseOpts();
  opts.indexAxis = 'y';
  opts.plugins.legend.display = false;
  opts.interaction = { mode: 'nearest', axis: 'y', intersect: false };

  opts.scales.x.ticks.callback = v => mode === 'share' ? `${v}%` : `${v}m`;
  opts.scales.x.title = { display: false };
  opts.scales.x.suggestedMin = 0;
  opts.scales.y.ticks.callback = (v, i) => {
    const s = String(labels[i] != null ? labels[i] : v);
    return s.length > 16 ? s.slice(0, 15) + '\u2026' : s;
  };
  opts.layout = { padding: { top: 4, right: 8, bottom: 10, left: 0 } };

  // Rich tooltip: "Time: 5h 12m (32%)  Solved: 28"
  opts.plugins.tooltip.enabled = true;
  opts.plugins.tooltip.displayColors = false;
  opts.plugins.tooltip.callbacks = {
    title: (items) => {
      try { return String(sorted[items[0]?.dataIndex]?.category || ''); }
      catch (_) { return ''; }
    },
    label: (ctx) => {
      const item = sorted[ctx.dataIndex];
      const m    = item?.minutes || 0;
      const hrs  = Math.floor(m / 60);
      const rem  = m % 60;
      const fmt  = hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
      const sh   = Math.round((m / total) * 100);
      const slv  = item?.solved ?? 0;
      return [`Time: ${fmt} (${sh}%)`, `Solved: ${slv}`];
    },
  };

  if (typeof onCategoryClick === 'function') {
    opts.onClick = (_evt, elements) => {
      if (!elements || !elements.length) {
        onCategoryClick(null); return;
      }
      const cat = labels[elements[0].index];
      onCategoryClick(cat || null);
    };
    opts.onHover = (evt, elements) => {
      if (evt.native && evt.native.target)
        evt.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    };
  }

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: mode === 'share' ? 'Share' : 'Minutes', data: values,
        backgroundColor: bgColors, borderColor: borderColors,
        borderWidth: 1.5, borderRadius: 6 }],
    },
    options: opts,
  };
}
// ── MCQ per-difficulty chart ──────────────────────────────────────────────────
// avgScore is already 0-100 — do NOT multiply by 100.
// Categories sorted alphabetically to match vanilla renderMcqDifficultyChart.
export function mcqDifficultyChartConfig(canvas, mcqMatrix, difficulty) {
  const rows = (mcqMatrix||[]).slice()
    .sort((a,b) => String(a.category||'').localeCompare(String(b.category||''), undefined, { sensitivity: 'base' }));
  const labels = rows.map(x => x.category);
  const data   = rows.map(x => Number(x[difficulty]?.avgScore) || 0); // already 0-100

  const opts = baseOpts();
  opts.plugins.legend.display = false;
  opts.scales.y.suggestedMin = 0;
  opts.scales.y.suggestedMax = 100;
  opts.scales.y.ticks.callback = v => `${v}%`;
  opts.scales.y.title = {
    display: true, text: 'Avg score (%)',
    color: cssVar('--color-chart-axis') || 'rgba(245,245,252,0.70)',
    font: { weight: '800', size: 10 },
  };
  opts.scales.x.ticks.maxRotation = 45;
  opts.scales.x.ticks.minRotation = 45;
  opts.scales.x.ticks.padding = 12;
  opts.scales.x.ticks.autoSkip = true;
  opts.scales.x.ticks.maxTicksLimit = 8;
  opts.scales.x.ticks.callback = (v, i) => {
    const s = String(labels[i] != null ? labels[i] : v);
    return s.length > 12 ? s.slice(0, 11) + '…' : s;
  };
  opts.layout = { padding: { bottom: 10 } };

  const colors  = { Easy: 'rgba(130,230,190,0.70)', Medium: 'rgba(255,195,130,0.70)', Hard: 'rgba(255,150,170,0.70)' };
  const borders = { Easy: 'rgba(130,230,190,0.90)', Medium: 'rgba(255,195,130,0.90)', Hard: 'rgba(255,150,170,0.90)' };

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: difficulty, data,
        backgroundColor: colors[difficulty] || getPastels()[0],
        borderColor:     borders[difficulty] || getPastelBorders()[0],
        borderWidth: 1, borderRadius: 10 }],
    },
    options: opts,
  };
}

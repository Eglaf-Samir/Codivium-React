// dashboard.02.heatmap-analysis.js — Heatmap analysis and insight builders.

// -----------------------------
// Heatmap analysis (fallback)
// -----------------------------
function buildHeatmapFallbackInsightFromOverride(hm){
  const DEF = {
    mostlyPassingThreshold: 0.85,
    minCellCount: 4,
    minCategories: 5,
    stallLateGainEps: 0.05,
    topN: 3,
    maxActions: 3
  };

  const cats = hm && Array.isArray(hm.categories) ? hm.categories.map(String) : [];
  const values2d = hm && Array.isArray(hm.values) ? hm.values : [];
  const counts2d = hm && Array.isArray(hm.counts) ? hm.counts : null;

  const fixedCols = 5;
  const buckets = (hm && Array.isArray(hm.buckets) ? hm.buckets : null) || ["A1","A2","A3","A4","A5"];
  const b = buckets.slice(0, fixedCols);

  const hasCounts = !!(counts2d && Array.isArray(counts2d));
  const minCell = DEF.minCellCount;
  const T = DEF.mostlyPassingThreshold;

  // Compute weighted means per bucket (weights = cell counts where available)
  const bucketMean = [];
  const bucketN = [];
  const bucketCats = []; // number of categories contributing (after minCell guard when counts available)
  for (let c=0;c<fixedCols;c++){
    let sum=0, w=0, kCats=0;
    for (let r=0;r<cats.length;r++){
      const row = Array.isArray(values2d[r]) ? values2d[r] : [];
      const v = Number(row[c]);
      if (!isFinite(v)) continue;

      let n = 1;
      if (hasCounts){
        const crow = Array.isArray(counts2d[r]) ? counts2d[r] : [];
        const nn = Number(crow[c]);
        n = (isFinite(nn) ? Math.max(0, Math.floor(nn)) : 0);
        if (n < minCell) continue; // guard
      }
      if (n <= 0) continue;
      sum += v * n;
      w += n;
      kCats += 1;
    }
    bucketMean.push(w>0 ? (sum/w) : null);
    bucketN.push(w);
    bucketCats.push(kCats);
  }

  // Convergence summary
  const first = bucketMean[0];
  const last = bucketMean[fixedCols-1];
  const delta = (isFinite(first) && isFinite(last)) ? (last - first) : null;

  let reach = null;
  for (let c=0;c<fixedCols;c++){
    const mu = bucketMean[c];
    if (mu !== null && isFinite(mu) && mu >= T){
      reach = c+1; break;
    }
  }

  // Per-category metrics
  const rows = [];
  for (let r=0;r<cats.length;r++){
    const rowV = Array.isArray(values2d[r]) ? values2d[r] : [];
    const rowC = hasCounts ? (Array.isArray(counts2d[r]) ? counts2d[r] : []) : null;

    const v = [];
    const n = [];
    for (let c=0;c<fixedCols;c++){
      const vv = Number(rowV[c]);
      v.push(isFinite(vv) ? vv : null);
      if (hasCounts){
        const nn = Number(rowC[c]);
        n.push(isFinite(nn) ? Math.max(0, Math.floor(nn)) : 0);
      } else {
        n.push(v[c] === null ? 0 : 1);
      }
    }

    // Eligibility: we want at least A1 evidence
    const a1ok = (v[0] !== null) && (n[0] >= (hasCounts ? minCell : 1));

    // Reach attempt by threshold
    let reachK = null;
    for (let c=0;c<fixedCols;c++){
      if (v[c] === null) continue;
      if (hasCounts && n[c] < minCell) continue;
      if (v[c] >= T) { reachK = c+1; break; }
    }

    // Stall definition: small A3->A5 gain while still below threshold at A5
    let stalled = false;
    let lateGain = null;
    if (v[2] !== null && v[4] !== null){
      if ((!hasCounts || (n[2] >= minCell && n[4] >= minCell))){
        lateGain = v[4] - v[2];
        stalled = (lateGain !== null && lateGain < DEF.stallLateGainEps && v[4] < T);
      }
    }

    rows.push({
      category: cats[r] || `Category ${r+1}`,
      v, n,
      a1ok,
      reachK,
      stalled,
      lateGain
    });
  }

  const eligibleCats = hasCounts ? rows.filter(x => x.a1ok).length : rows.filter(x => x.v[0] !== null).length;
  const enoughCats = eligibleCats >= DEF.minCategories;

  const fmtPct = (x) => `${Math.round(x*100)}%`;
  const fmtPP = (x) => `${Math.round(x*100)}pp`;

  const snapshotBits = [];
  for (let c=0;c<fixedCols;c++){
    const mu = bucketMean[c];
    if (mu === null || !isFinite(mu)){
      snapshotBits.push(`${b[c]}: —`);
    } else {
      const nTxt = hasCounts ? ` (n=${bucketN[c]})` : "";
      snapshotBits.push(`${b[c]}: ${fmtPct(mu)}${nTxt}`);
    }
  }

  // Category callouts
  const topN = DEF.topN;

  const fastest = rows
    .filter(x => x.reachK !== null)
    .sort((a,b)=>a.reachK - b.reachK || (b.v[0]||0) - (a.v[0]||0))
    .slice(0, topN);

  const stalled = rows
    .filter(x => x.stalled)
    .sort((a,b)=>(a.v[4]||1) - (b.v[4]||1))
    .slice(0, topN);

  const lowA1 = rows
    .filter(x => x.a1ok)
    .sort((a,b)=>(a.v[0]||1) - (b.v[0]||1))
    .slice(0, topN);

  const mkFast = (x) => {
    const k = x.reachK;
    const a1 = x.v[0] !== null ? fmtPct(x.v[0]) : "—";
    const ak = x.v[k-1] !== null ? fmtPct(x.v[k-1]) : "—";
    return `${x.category}: reaches ≥${Math.round(T*100)}% by ${b[k-1]} (A1 ${a1} → ${b[k-1]} ${ak})`;
  };

  const mkStall = (x) => {
    const a3 = x.v[2] !== null ? fmtPct(x.v[2]) : "—";
    const a5 = x.v[4] !== null ? fmtPct(x.v[4]) : "—";
    const gain = (x.lateGain !== null && isFinite(x.lateGain)) ? fmtPP(x.lateGain) : "—";
    return `${x.category}: little late improvement (${b[2]} ${a3} → ${b[4]} ${a5}, +${gain})`;
  };

  const mkLowA1 = (x) => {
    const a1 = x.v[0] !== null ? fmtPct(x.v[0]) : "—";
    const a2 = x.v[1] !== null ? fmtPct(x.v[1]) : "—";
    return `${x.category}: low first attempt (A1 ${a1}; A2 ${a2})`;
  };

  const sections = [];

  // View context (premium heatmap modes)
  try {
    const view = String(__cvState.__heatmapView || 'focus');
    const modeId = String(__cvState.__heatmapFocusModeId || (__cvState.__heatmapFocus && __cvState.__heatmapFocus.defaultModeId) || 'impact');
    const modeObj = (__cvState.__heatmapFocus && Array.isArray(__cvState.__heatmapFocus.modes)) ? __cvState.__heatmapFocus.modes.find(m=>String(m.id)===modeId) : null;
    const modeLabel = modeObj ? (modeObj.label || modeObj.id) : modeId;
    const topN = (__cvState.__heatmapTopN && isFinite(__cvState.__heatmapTopN)) ? __cvState.__heatmapTopN : DEF.topN;

    let viewText = '';
    if (view === 'focus') viewText = `Focus view — Top ${topN} categories ranked by “${modeLabel}” (backend-driven).`;
    else if (view === 'all') viewText = 'All categories — virtualised list (scroll to browse the full grid).';
    else if (view === 'micro') viewText = 'Micro track only — heatmap for Micro Challenges categories.';
    else if (view === 'interview') viewText = 'Interview track only — heatmap for Interview Preparation categories.';
    else viewText = `View: ${view}.`;

    sections.push({
      heading: 'What you’re viewing',
      blocks: [
        { kind: 'p', text: viewText },
        { kind: 'note', text: 'If this panel is open in the right-side info pane, it will refresh automatically when you change the heatmap view.' }
      ]
    });
  } catch (e) { ciErr('ignored error', e); }

  sections.push({
    heading: "Snapshot",
    blocks: [
      { kind: "p", text: snapshotBits.join(" • ") },
      { kind: "note", text: "A1..A5 are attempt buckets. A5 means the 5th-attempt bucket (it does not mean 6+ attempts)." }
    ]
  });

  if (enoughCats && first !== null && last !== null){
    const reachTxt = (reach !== null) ? `You typically reach ≥${Math.round(T*100)}% by ${b[reach-1]}.` : `Even by ${b[4]}, your average is below ${Math.round(T*100)}%.`;
    const deltaTxt = (delta !== null) ? `Overall improvement: ${fmtPP(delta)} (from ${fmtPct(first)} to ${fmtPct(last)}).` : "";
    sections.push({
      heading: "Your convergence pattern",
      blocks: [
        { kind: "p", text: `${deltaTxt} ${reachTxt}`.trim() },
        { kind: "p", text: "Higher early buckets (A1/A2) usually means better planning and faster debugging. Flat curves often mean you are repeating similar mistakes across attempts." }
      ]
    });
  } else {
    sections.push({
      heading: "Your convergence pattern",
      blocks: [
        { kind: "note", text: hasCounts
          ? `Not enough evidence yet to summarize your pattern (need at least ${DEF.minCategories} categories with ≥${minCell} sessions in A1).`
          : "Not enough data yet to summarize your pattern. As you do more coding sessions, this section will become meaningful."
        }
      ]
    });
  }

  if (fastest.length || stalled.length || lowA1.length){
    const blocks = [];
    if (fastest.length) blocks.push({ kind: "bullets", items: ["Fastest to converge", ...fastest.map(mkFast)] });
    if (stalled.length) blocks.push({ kind: "bullets", items: ["Most stalled / slow", ...stalled.map(mkStall)] });
    if (lowA1.length) blocks.push({ kind: "bullets", items: ["Lowest A1 (first-attempt weakness)", ...lowA1.map(mkLowA1)] });

    sections.push({ heading: "Category callouts", blocks });
  }

  const guardLines = [
    `Mostly-passing threshold: ${Math.round(T*100)}% unit tests passed.`,
    hasCounts ? `Minimum evidence per cell: n ≥ ${minCell}.` : "Counts are not available in this dataset, so guards use a weaker fallback.",
    `Minimum categories before summary: ${DEF.minCategories}.`,
    `Stall rule (late gain): ${fmtPP(DEF.stallLateGainEps)} or less from A3→A5 while still below threshold.`,
  ];

  sections.push({
    heading: "Confidence & guards",
    blocks: [
      { kind: "bullets", items: guardLines }
    ]
  });

  const actions = [
    "Raise A1: pause briefly to plan edge cases and write a quick test checklist before coding.",
    "If you stall after A2: practice systematic debugging (small reproducible failing case → hypothesis → tiny change → rerun tests).",
    "Drill the lowest-A1 categories with short, repeated sets until A1/A2 rises (aim for fewer “blind” retries)."
  ].slice(0, DEF.maxActions);

  sections.push({
    heading: "What to do next",
    blocks: [{ kind: "bullets", items: actions }]
  });

  // CTA explanation (ties panel → action)
  sections.push({
    heading: 'Action button',
    blocks: [
      { kind: 'p', text: 'Use the panel CTA to start a short focus session in the highest-impact category shown by this view.' },
      { kind: 'note', text: 'The dashboard sends intent (track/category/timebox). The backend selects items and returns a session link.' }
    ]
  });

  return {
    title: "Convergence heatmap analysis",
    summary: "How quickly unit-test pass% improves across attempts (A1→A5), with Focus/All/Track modes.",
    sections,
    meta: { fallback: true, hasCounts }
  };
}


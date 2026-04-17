// dashboard.06.mcq-and-render.js — MCQ charts, chart rendering (depth/allocation/time/heatmap), CTA wiring.

// -----------------------------
// MCQ performance analysis (fallback)

// -----------------------------
function buildMcqPerformanceFallbackInsightFromMatrix(matrix, totals, key, weightedMcqScoreMaybe){
  const DEF = {
    minQuestionsPerBar: 20,
    minAttemptsPerBar: 2,
    minCategoriesForSummary: 5,
    difficultyCliffGapPP: 25,
    lowMax: 50,
    moderateMax: 70,
    topN: 3,
    maxActions: 3
  };

  const rows = Array.isArray(matrix) ? matrix.map(r => ({
    category: String(r.category || ''),
    basic: {
      score: Number(r.Easy && r.Easy.avgScore) || 0,
      attempts: Number(r.Easy && r.Easy.attemptCount) || 0,
      questions: Number(r.Easy && r.Easy.questionCount) || 0
    },
    intermediate: {
      score: Number(r.Medium && r.Medium.avgScore) || 0,
      attempts: Number(r.Medium && r.Medium.attemptCount) || 0,
      questions: Number(r.Medium && r.Medium.questionCount) || 0
    },
    advanced: {
      score: Number(r.Hard && r.Hard.avgScore) || 0,
      attempts: Number(r.Hard && r.Hard.attemptCount) || 0,
      questions: Number(r.Hard && r.Hard.questionCount) || 0
    }
  })).filter(x => x.category) : [];

  const wmcq = (weightedMcqScoreMaybe != null && isFinite(weightedMcqScoreMaybe)) ? Number(weightedMcqScoreMaybe) : null;
  const totalQ = Number(totals && totals.total) || 0;
  const totalC = Number(totals && totals.correct) || 0;
  const overallPct = (totalQ > 0) ? (100 * (totalC / totalQ)) : null;

  const hasEvidence = rows.some(r => (r.basic.questions + r.intermediate.questions + r.advanced.questions) > 0 || (r.basic.attempts + r.intermediate.attempts + r.advanced.attempts) > 0);

  const guardOk = (cell) => {
    if (!cell) return false;
    if (hasEvidence){
      if ((cell.questions || 0) >= DEF.minQuestionsPerBar) return true;
      return (cell.attempts || 0) >= DEF.minAttemptsPerBar;
    }
    // No evidence counts: treat all bars as eligible (we will still be cautious in wording).
    return true;
  };

  const avgWeighted = (pick) => {
    let num = 0, den = 0;
    for (const r of rows){
      const cell = pick(r);
      const s = Number(cell.score);
      if (!isFinite(s)) continue;
      const w = hasEvidence ? Math.max(0, Number(cell.questions) || 0) : 1;
      if (hasEvidence && w <= 0) continue;
      num += s * w;
      den += w;
    }
    return den > 0 ? (num / den) : null;
  };

  const avgBasic = avgWeighted(r => r.basic);
  const avgInter = avgWeighted(r => r.intermediate);
  const avgAdv = avgWeighted(r => r.advanced);

  const fmtPct = (x) => `${Math.round(x)}%`;
  const fmtPP = (x) => `${Math.round(x)}pp`;

  const band = (x) => {
    if (x == null || !isFinite(x)) return '—';
    if (x <= DEF.lowMax) return 'Low';
    if (x <= DEF.moderateMax) return 'Moderate';
    return 'Strong';
  };

  const eligibleCount = (which) => rows.filter(r => guardOk(r[which])).length;

  const listLowest = (which, label) => {
    const items = rows
      .filter(r => guardOk(r[which]))
      .sort((a,b)=>a[which].score - b[which].score)
      .slice(0, DEF.topN)
      .map(r => {
        const nTxt = hasEvidence ? `n=${r[which].questions || 0} questions` : 'n=—';
        return `${r.category} — ${fmtPct(r[which].score)} (${nTxt})`;
      });
    return items.length ? items : [`Not enough evidence yet to call out lowest ${label} categories.`];
  };

  const listHighest = (which, label) => {
    const items = rows
      .filter(r => guardOk(r[which]))
      .sort((a,b)=>b[which].score - a[which].score)
      .slice(0, DEF.topN)
      .map(r => {
        const nTxt = hasEvidence ? `n=${r[which].questions || 0} questions` : 'n=—';
        return `${r.category} — ${fmtPct(r[which].score)} (${nTxt})`;
      });
    return items.length ? items : [`Not enough evidence yet to call out strongest ${label} categories.`];
  };

  const cliffsRaw = rows
    .filter(r => guardOk(r.basic) && guardOk(r.advanced))
    .map(r => ({
      category: r.category,
      gap: (r.basic.score - r.advanced.score),
      b: r.basic.score,
      a: r.advanced.score
    }))
    .filter(x => isFinite(x.gap))
    .sort((a,b)=>b.gap - a.gap);

  const cliffs = cliffsRaw
    .filter(x => x.gap >= DEF.difficultyCliffGapPP)
    .slice(0, DEF.topN)
    .map(x => `${x.category} — Basic ${fmtPct(x.b)} → Advanced ${fmtPct(x.a)} (gap ${fmtPP(x.gap)})`);

  const sections = [];

  // Snapshot
  const snap = [];
  if (overallPct != null) snap.push(`Overall MCQ: ${totalC} correct out of ${totalQ} (${fmtPct(overallPct)})`);
  else snap.push('Overall MCQ: no question totals available yet.');

  if (wmcq != null) snap.push(`Weighted MCQ score: ${Math.round(wmcq)} (${band(wmcq)})`);

  if (avgBasic != null && avgInter != null && avgAdv != null){
    snap.push(`Average by difficulty (weighted by question count): Basic ${fmtPct(avgBasic)} • Intermediate ${fmtPct(avgInter)} • Advanced ${fmtPct(avgAdv)}`);
  } else {
    snap.push('Average by difficulty: not enough data to compute stable averages.');
  }

  sections.push({ heading: 'Snapshot', blocks: [{ kind: 'bullets', items: snap }] });

  const keyToWhich = { mcqEasy: 'basic', mcqMedium: 'intermediate', mcqHard: 'advanced' };
  const which = keyToWhich[key] || null;

  if (which){
    const label = (which === 'basic') ? 'Basic' : (which === 'intermediate') ? 'Intermediate' : 'Advanced';

    sections.push({
      heading: `${label} category callouts`,
      blocks: [
        { kind: 'bullets', items: ['Lowest', ...listLowest(which, label)] },
        { kind: 'bullets', items: ['Strongest', ...listHighest(which, label)] }
      ]
    });

    const diag = [];
    if (which === 'basic'){
      diag.push('Basic reflects fundamentals. Low Basic usually means missing definitions, rules, or common patterns.');
      diag.push('Fix Basic first: it drives speed and correctness in both MCQ and coding.');
    } else if (which === 'intermediate'){
      diag.push('Intermediate reflects applied understanding. If Intermediate is low while Basic is ok, focus on “why this works” and edge cases.');
      diag.push('Intermediate is often the fastest place to convert knowledge into reliable execution.');
    } else {
      diag.push('Advanced reflects interview-style reasoning. Low Advanced usually means weak edge-case logic or missing tricky variants.');
      diag.push('Pair Advanced MCQs with coding drills in the same category to build transfer.');
    }

    sections.push({ heading: 'Likely explanation', blocks: [{ kind: 'bullets', items: diag }] });

    const actions = [];
    actions.push(`Pick the lowest 1–2 ${label} categories and run a short cycle: review mistakes → 10–20 questions → re-check.`);
    actions.push('Write down the mistake type (misread, wrong rule, edge case, trap) and re-quiz until that mistake type disappears.');
    if (which === 'advanced') actions.push('For Advanced gaps: add 1 coding exercise after each MCQ set to force transfer.');

    sections.push({ heading: 'What to do next', blocks: [{ kind: 'bullets', items: actions.slice(0, DEF.maxActions) }] });

  } else {
    // Panel-level
    const eligibleAdv = eligibleCount('advanced');
    const eligibleAny = rows.filter(r => guardOk(r.basic) || guardOk(r.intermediate) || guardOk(r.advanced)).length;

    const notes = [];
    if (eligibleAny < DEF.minCategoriesForSummary){
      notes.push(`Not enough stable MCQ evidence yet to summarize patterns (need ≥${DEF.minCategoriesForSummary} categories with enough questions).`);
    }
    if (eligibleAdv < DEF.minCategoriesForSummary){
      notes.push('Advanced evidence is still thin. Treat Advanced category rankings as early signals until more questions accumulate.');
    }

    if (notes.length){
      sections.push({ heading: 'Note', blocks: [{ kind: 'note', text: notes.join(' ') }] });
    }

    const callouts = [];
    callouts.push({ kind: 'bullets', items: ['Lowest Advanced (priority gaps)', ...listLowest('advanced', 'Advanced')] });
    if (cliffs.length) callouts.push({ kind: 'bullets', items: ['Largest difficulty cliffs (Basic → Advanced)', ...cliffs] });
    else callouts.push({ kind: 'bullets', items: ['Largest difficulty cliffs (Basic → Advanced)', `No cliffs ≥ ${fmtPP(DEF.difficultyCliffGapPP)} found among categories with enough evidence.`] });
    callouts.push({ kind: 'bullets', items: ['Strongest Advanced (strengths)', ...listHighest('advanced', 'Advanced')] });

    sections.push({ heading: 'Category callouts', blocks: callouts });

    const diag = [];
    if (avgBasic != null && avgAdv != null){
      if (avgBasic <= DEF.lowMax) diag.push('Basic is low overall → focus on fundamentals first (definitions + common rules + small re-quiz sets).');
      else if (avgAdv <= DEF.lowMax && avgBasic >= DEF.moderateMax) diag.push('Advanced is low while Basic is ok → this often means edge-case reasoning is the bottleneck.');
      else diag.push('Your MCQ pattern looks mixed. Use the lowest Advanced categories as your next targets.');
    } else {
      diag.push('Not enough data yet for a stable global pattern. Keep doing short MCQ sets and this panel will become meaningful.');
    }

    if (cliffsRaw.length && cliffsRaw[0].gap >= DEF.difficultyCliffGapPP){
      diag.push('A large Basic→Advanced cliff usually means you know the surface rule but miss tricky variants.');
    }

    sections.push({ heading: 'Likely explanation', blocks: [{ kind: 'bullets', items: diag }] });

    const actions = [];
    actions.push('Start with the lowest Advanced categories: review mistakes, then do a short re-quiz set until accuracy stabilizes.');
    actions.push('If a category has a large cliff (Basic high, Advanced low), write down the tricky variants you missed and turn them into a checklist.');
    actions.push('Maintain breadth: keep sampling uncovered MCQ categories, but revisit weak ones until accuracy rises.');

    sections.push({ heading: 'What to do next', blocks: [{ kind: 'bullets', items: actions.slice(0, DEF.maxActions) }] });
  }

  const guards = [];
  guards.push(`Minimum evidence per bar: questions ≥ ${DEF.minQuestionsPerBar} (or attempts ≥ ${DEF.minAttemptsPerBar} if question counts are missing).`);
  guards.push(`Minimum categories before strong summaries: ${DEF.minCategoriesForSummary}.`);
  guards.push(`Difficulty cliff threshold: ${fmtPP(DEF.difficultyCliffGapPP)} (Basic − Advanced).`);
  guards.push('Remember: averages can look unstable when there are only a few quizzes. The evidence (n) is shown where available.');

  if (!hasEvidence) guards.push('Evidence counts are not present in this dataset, so guards are weaker and 0% may mean “no attempts yet”.');

  sections.push({ heading: 'Confidence & guards', blocks: [{ kind: 'bullets', items: guards }] });

  const title = which ? `MCQ ${which === 'basic' ? 'Basic' : which === 'intermediate' ? 'Intermediate' : 'Advanced'} analysis` : 'MCQ performance analysis';
  const summary = which
    ? `Category-level MCQ performance at ${which === 'basic' ? 'Basic' : which === 'intermediate' ? 'Intermediate' : 'Advanced'} difficulty.`
    : '';

  return { title, summary, sections, meta: { fallback: true, hasEvidence } };
}
function setScoresInfoPane(key){
  if (!SCORE_INFO_KEYS.has(key)) return;

  clearInfoPaneStaticText();

  let insight = (__cvState.__insights && __cvState.__insights[key]) ? __cvState.__insights[key] : null;

  const info = getInfoContent(key) || {};
  const title = (insight && insight.title) ? insight.title : (info.title || "Analysis");
  setText("infoPaneTitle", title);

  const sub = (insight && insight.summary) ? insight.summary : "";
  setText("infoPaneSub", sub);

  // If no structured insight is available (e.g., backend hasn't been updated yet),
  // fall back to the built-in interpretation so the score info buttons still work.
  if (!insight || typeof insight !== "object"){
    if (key === "dashboard_overview"){
      insight = buildDashboardOverviewInsightFromData(__cvState.__dashData || {});
      setText("infoPaneTitle", insight.title);
      setText("infoPaneSub", insight.summary || "");
    }
    // Special-case: if depth chart data exists, build a useful depth insight from it.
    else if (key === "panel_depth" && Array.isArray(__cvState.__depthOverride) && __cvState.__depthOverride.length){
      insight = buildDepthFallbackInsightFromOverride(__cvState.__depthOverride);
      setText("infoPaneTitle", insight.title);
      setText("infoPaneSub", insight.summary || "");
    } else if (key === "panel_heatmap"){
      // Ensure we have a matrix to analyze (either real override from payload or deterministic mock).
      if (!__cvState.__convergenceOverride || !Array.isArray(__cvState.__convergenceOverride.categories) || !Array.isArray(__cvState.__convergenceOverride.values)){
        buildConvergenceMatrix(); // also seeds __cvState.__convergenceOverride for mock data
      }
      if (__cvState.__convergenceOverride && Array.isArray(__cvState.__convergenceOverride.categories) && Array.isArray(__cvState.__convergenceOverride.values)){
        insight = buildHeatmapFallbackInsightFromOverride(__cvState.__convergenceOverride);
        setText("infoPaneTitle", insight.title);
        setText("infoPaneSub", insight.summary || "");
      }
    } else if (key === "panel_time"){
      if (typeof DAILY_PLATFORM_SERIES !== "undefined" && Array.isArray(DAILY_PLATFORM_SERIES)){
        insight = buildTimeOnPlatformFallbackInsightFromSeries(DAILY_PLATFORM_SERIES, timeRange, timeGran);
        setText("infoPaneTitle", insight.title);
        setText("infoPaneSub", insight.summary || "");
      }
    } else if (key === "panel_exercise"){
      if (typeof exerciseTimeByCategory !== "undefined" && Array.isArray(exerciseTimeByCategory)){
        insight = buildExerciseTimeFallbackInsightFromAllocation(exerciseTimeByCategory, allocMode, selectedAllocCategory);
        setText("infoPaneTitle", insight.title);
        setText("infoPaneSub", insight.summary || "");
      }
    } else if (key === "panel_mcq" || key === "mcqEasy" || key === "mcqMedium" || key === "mcqHard") {
      if (typeof mcqMatrix !== "undefined" && Array.isArray(mcqMatrix)) {
        const w = numFromEl("weightedMcqScore");
        insight = buildMcqPerformanceFallbackInsightFromMatrix(mcqMatrix, mcqOverallTotals || {correct:0,total:0}, key, w);
        setText("infoPaneTitle", insight.title);
        setText("infoPaneSub", insight.summary || "");
      }
    } else {
      // Prefer tailored interpretation, then fall back to static explainer text so the pane never looks broken.
      const fallback = (getAnalysisText(key) || "").trim();
      const staticBody = ((getInfoContent(key) || {}).body || "").trim();
      const text = fallback || staticBody || "Analysis for this score will be added soon.";
      insight = {
        title,
        summary: sub,
        sections: [{ heading: "Analysis", type: "fallback", blocks: [{ kind: "p", text }] }],
        meta: { fallback: true }
      };
    }
  }

  // Render insights into the proven interpretation container. In info-only mode we keep
  // the same container visible (tabs switch keys) to avoid edge cases with legacy flows
  // that clear/hide the alternate body container.
  const targetEl = cv$("infoPaneInterp");
  renderInsightObject(targetEl, insight);

  // Hide welcome pane if present (kept for compatibility)
  const welcome = document.getElementById("infoPaneWelcome");
  if (welcome) welcome.classList.add("isHidden");
}

  function setupInfoButtons() {
    const mount = getMount();
    if (!mount) return;

    // Bind once per mount (more reliable than a global document click handler,
    // and avoids edge cases where some environments suppress events outside the mount).
    const st = (typeof __cvMountState === 'function') ? __cvMountState(mount) : (mount.__cvState || (mount.__cvState = {}));
    if (st.infoButtonsBound) return;
    st.infoButtonsBound = true;

    // How it is calculated toggle inside the info pane
    const aggBtn = cv$("infoAggBtn");
    if (aggBtn && !aggBtn.__cvBound) {
      aggBtn.__cvBound = true;
      aggBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const body = cv$("infoAggBody");
        const expanded = aggBtn.getAttribute("aria-expanded") === "true";
        aggBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
        if (body) body.classList.toggle("isHidden", expanded);
      });
    }

    // Info buttons across the dashboard (SCORES ONLY for now)
    mount.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".infoBtn") : null;
      if (!btn) return;

      const key = btn.dataset ? btn.dataset.infoKey : null;
      if (!key) return;

      __cvState.__activeInfoKey = key;

      // Hide welcome pane if present (kept for compatibility)
      if (key !== "welcome") {
        const welcome = document.getElementById("infoPaneWelcome");
        if (welcome) welcome.classList.add("isHidden");
      }

      // Render score keys with structured insights; everything else uses the standard info pane.
      if (SCORE_INFO_KEYS.has(key)) setScoresInfoPane(key);
      else setInfoPane(key);
    });

  }

    // -----------------------------
  // Data (mock)
  // -----------------------------
  // Getter functions so cssVar() is read fresh on every render (picks up theme switches)
  function getPastels() {
    return [
      cssVar("--color-chart-bar-1")   || "rgba(246,213,138,0.55)",
      cssVar("--color-chart-bar-2")   || "rgba(94,234,212,0.45)",
      cssVar("--color-chart-bar-3")   || "rgba(129,140,248,0.42)",
      cssVar("--color-chart-bar-4")   || "rgba(251,113,133,0.38)",
      cssVar("--color-chart-bar-5")   || "rgba(253,224,71,0.35)",
    ];
  }
  function getPastelBorders() {
    return [
      cssVar("--color-chart-bar-border-1") || "rgba(246,213,138,0.35)",
      cssVar("--color-chart-bar-border-2") || "rgba(94,234,212,0.30)",
      cssVar("--color-chart-bar-border-3") || "rgba(129,140,248,0.30)",
      cssVar("--color-chart-bar-border-4") || "rgba(251,113,133,0.28)",
      cssVar("--color-chart-bar-border-5") || "rgba(253,224,71,0.28)",
    ];
  }
  // Aliases so existing code using PASTELS[i] and PASTEL_BORDERS[i] still works
  // by being reassigned at the start of each render cycle in renderAll()
  let PASTELS = getPastels();
  let PASTEL_BORDERS = getPastelBorders();

  // Premium distinct colors for category slices (no duplicates)
  const SLICE_COLORS = [
    "rgba(212,175,55,0.78)",   // Gold
    "rgba(59,130,246,0.75)",   // Blue
    "rgba(16,185,129,0.72)",   // Emerald
    "rgba(244,63,94,0.70)",    // Rose
    "rgba(245,158,11,0.74)",   // Amber
    "rgba(139,92,246,0.72)",   // Violet
    "rgba(20,184,166,0.70)",   // Teal
    "rgba(236,72,153,0.68)",   // Pink
    "rgba(99,102,241,0.70)",   // Indigo
    "rgba(34,197,94,0.68)",    // Green
    "rgba(250,204,21,0.68)",   // Yellow
    "rgba(6,182,212,0.68)",    // Cyan
    "rgba(249,115,22,0.70)",   // Orange
    "rgba(148,163,184,0.62)"   // Slate
  ];


  const PERIODS = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "dayBefore", label: "Day before" },
    { key: "wtd", label: "Week to date" },
    { key: "prevWeek", label: "Previous week" },
    { key: "twoWeeksAgo", label: "2 weeks ago" },
    { key: "mtd", label: "Month to date" },
    { key: "prevMonth", label: "Previous month" },
    { key: "twoMonthsAgo", label: "2 months ago" },
  ];

  const timeOnPlatformMinutes = {
    today: 62,
    yesterday: 48,
    dayBefore: 35,
    wtd: 310,
    prevWeek: 420,
    twoWeeksAgo: 380,
    mtd: 910,
    prevMonth: 1260,
    twoMonthsAgo: 980,
  };

  let CATEGORIES = []; // populated by applyDashboardData from exerciseTimeByCategory

  let exerciseTimeByCategory = [];

  let mcqMatrix = [];

  
  // Overall MCQ totals (mock)
  let mcqOverallTotals = { correct: 0, total: 0 };

let submissionMetrics = { firstTryPassRate: 0, avgAttemptsToAC: 0, medianTimeToACMinutes: 0 };

  // -----------------------------
  // Helpers
  // -----------------------------
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function cssVar(name) {
    // Prefer scoped CSS variables on the dashboard mount, fall back to document root.
    const mount = document.getElementById("ciMount");
    const target = mount || document.documentElement;
    return getComputedStyle(target).getPropertyValue(name).trim();
  }
  function parseIsoDate(s){
  // Parse YYYY-MM-DD safely across browsers (avoids Safari timezone quirks).
  if (typeof s !== "string") return new Date(s);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m){
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d);
  }
  return new Date(s);
}

function formatDuration(totalMinutes){
    const m = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h <= 0) return `${mm}m`;
    if (mm === 0) return `${h}h`;
    return `${h}h ${mm}m`;
  }
  function pct(n){ return `${Math.round(n)}%`; }

  function wrapLabel(label){
    // Wrap long / multi-word labels onto two lines where helpful.
    if (typeof label !== "string") return label;
    const s = label.trim();
    if (s.length <= 10) return s;
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return s;
    if (parts.length === 2) return [parts[0], parts[1]];
    // 3+ words: first word then rest
    return [parts[0], parts.slice(1).join(" ")];
  }




  function __cvShouldReduceMotion(){
    try {
      const low = document.documentElement && document.documentElement.getAttribute('data-cv-effects') === 'low';
      const prm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      return !!(low || prm);
    } catch (e) { return false; }
  }

  function __cvCanRenderCanvas(canvas){
    try {
      if (!canvas) return false;
      const r = canvas.getBoundingClientRect();
      return (r && r.width > 8 && r.height > 8);
    } catch (e) { return false; }
  }

  function baseChartOptions(){
    const tick = cssVar("--color-chart-axis") || "rgba(245,245,252,0.70)";
    const grid = cssVar("--color-chart-grid") || "rgba(255,255,255,0.08)";
    const font = cssVar("--font-ui") || cssVar("--font") || "serif";
    const opts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cssVar("--color-chart-label") || "rgba(245,245,252,0.72)", boxWidth: 10, boxHeight: 10, font: { family: font, weight: "700" } } },
        tooltip: {
          backgroundColor: cssVar("--color-chart-tooltip-bg") || "rgba(14,16,26,0.97)",
          borderColor: cssVar("--color-chart-tooltip-border") || "rgba(255,255,255,0.14)",
          borderWidth: 1,
          titleColor: cssVar("--color-chart-tooltip-title") || "rgba(245,245,252,0.92)",
          bodyColor: cssVar("--color-chart-tooltip-body") || "rgba(245,245,252,0.82)",
          cornerRadius: 12,
        },
      },
      scales: {
        x: { ticks: { color: tick, font: { family: font, weight: "700", size: 10 }, callback: function(value){ const label = this.getLabelForValue(value); return wrapLabel(label); } }, grid: { color: grid }, border: { display:false } },
        y: { ticks: { color: tick, font: { family: font, weight: "700", size: 10 } }, grid: { color: grid }, border: { display:false } },
      }
    };
    if (__cvShouldReduceMotion()) {
      opts.animation = false;
      opts.transitions = { active: { animation: { duration: 0 } }, resize: { animation: { duration: 0 } } };
    }
    return opts;

  }

    // -----------------------------
  // Scores
  // -----------------------------
  function computeBreadthScore(){
    const active = exerciseTimeByCategory.filter(x => x.minutes >= 30).length;
    const total = exerciseTimeByCategory.length || 1;
    return (active / total) * 100;
  }
  function computeDepthScores(){
    return [];
  }
  function computeWeightedMcqScore(){
    const w = { Easy: 1.0, Medium: 1.2, Hard: 1.5 };
    let num = 0, den = 0;
    for (const row of mcqMatrix){
      for (const d of ["Easy","Medium","Hard"]){
        num += row[d].avgScore * w[d];
        den += w[d];
      }
    }
    return den > 0 ? (num / den) : 0;
  }
  function computeCodiviumScore(breadth, depth){
    const B = Number(breadth);
    const D = Number(depth);
    if (!(B > 0) || !(D > 0)) return 0;
    return (2 * B * D) / (B + D);
  }

  function renderSnapshotNumbers(){
    setText("firstTryPassRate", pct(submissionMetrics.firstTryPassRate));
    setText("avgAttemptsToAC", submissionMetrics.avgAttemptsToAC.toFixed(1));
    setText("medianTimeToAC", formatDuration(submissionMetrics.medianTimeToACMinutes));
  }

  function renderTopScores(){
    let breadth = computeBreadthScore();
    if (__cvState.__metricsOverride && __cvState.__metricsOverride.breadthOverall != null) breadth = __cvState.__metricsOverride.breadthOverall;

    // Respect the coding track selector: use track-specific depth data when available.
    const trackDepth = (__cvState.__depthByTrack && __cvState.__selectedCodingTrack && __cvState.__selectedCodingTrack !== 'combined')
      ? (__cvState.__depthByTrack[__cvState.__selectedCodingTrack] || __cvState.__depthByTrack.combined)
      : (__cvState.__depthByTrack && __cvState.__depthByTrack.combined);

    const depthScores = (trackDepth && trackDepth.length)
      ? trackDepth.slice().sort((a,b)=>(b.depth||0)-(a.depth||0))
      : ((Array.isArray(__cvState.__depthOverride) && __cvState.__depthOverride.length)
          ? __cvState.__depthOverride.slice().sort((a,b)=>(b.depth||0)-(a.depth||0))
          : computeDepthScores());
    const depthAvgRaw = (__cvState.__depthAvgOverride != null)
      ? __cvState.__depthAvgOverride
      : (depthScores.reduce((a,b)=>a+(b.depth||0),0) / (depthScores.length||1));
    const maxDepthRaw = depthScores.reduce((m,x)=>Math.max(m, Number(x.depth)||0), 0);
    const depthScale = (maxDepthRaw > 0 && maxDepthRaw <= 1.2) ? 100 : 1;
    const depthAvg = depthAvgRaw * depthScale;
    let weightedMcq = computeWeightedMcqScore();
    if (__cvState.__metricsOverride && __cvState.__metricsOverride.weightedMcqScore != null) weightedMcq = __cvState.__metricsOverride.weightedMcqScore;
    let codivium = computeCodiviumScore(breadth, depthAvg);
    if (__cvState.__metricsOverride && __cvState.__metricsOverride.codiviumScore != null) codivium = __cvState.__metricsOverride.codiviumScore;

    // Visible scores
    setText("codiviumScore", Math.round(codivium));
    setText("breadthScore", Math.round(breadth));

    // Depth (D) and track depths (only set if backend/demo provides them)
    const dOverall = (__cvState.__metricsOverride && __cvState.__metricsOverride.depthOverall != null) ? __cvState.__metricsOverride.depthOverall : depthAvg;
    setText("depthOverallScore", Math.round(dOverall));
    const microDepth = (__cvState.__metricsOverride && __cvState.__metricsOverride.depthMicro != null) ? __cvState.__metricsOverride.depthMicro : null;
    const interviewDepth = (__cvState.__metricsOverride && __cvState.__metricsOverride.depthInterview != null) ? __cvState.__metricsOverride.depthInterview : null;
    if (microDepth != null) setText("microDepthScore", Math.round(microDepth));
    if (interviewDepth != null) setText("interviewDepthScore", Math.round(interviewDepth));

    // Points + efficiency (only set if provided)
    if (__cvState.__metricsOverride && __cvState.__metricsOverride.codiviumPointsAll != null) setText("codiviumPointsAll", Math.round(__cvState.__metricsOverride.codiviumPointsAll));
    if (__cvState.__metricsOverride && __cvState.__metricsOverride.codiviumPoints30 != null) setText("codiviumPoints30", Math.round(__cvState.__metricsOverride.codiviumPoints30));
    if (__cvState.__metricsOverride && __cvState.__metricsOverride.efficiencyPtsPerHr != null) setText("efficiencyPtsPerHr", (Math.round(__cvState.__metricsOverride.efficiencyPtsPerHr*10)/10).toFixed(1));

    // Breadth variants (use backend-provided values if available, else fallback to reasonable mock splits)
const interviewBreadth = (__cvState.__metricsOverride && __cvState.__metricsOverride.breadthInterview != null)
  ? __cvState.__metricsOverride.breadthInterview
  : clamp(breadth - 8, 0, 100);
const microBreadth = (__cvState.__metricsOverride && __cvState.__metricsOverride.breadthMicro != null)
  ? __cvState.__metricsOverride.breadthMicro
  : clamp(breadth - 4, 0, 100);
const mcqBreadth = (__cvState.__metricsOverride && __cvState.__metricsOverride.breadthMcq != null)
  ? __cvState.__metricsOverride.breadthMcq
  : clamp(breadth + 6, 0, 100);
setText("interviewBreadthScore", Math.round(interviewBreadth));
setText("microBreadthScore", Math.round(microBreadth));
setText("mcqBreadthScore", Math.round(mcqBreadth));

    // Hidden/internal values (for interpretations)
    setText("depthAvg", Math.round(depthAvg));
    setText("weightedMcqScore", Math.round(weightedMcq));

    return { breadth, depthScores, depthAvg, weightedMcq, codivium };
  }

  // -----------------------------
  // Convergence heatmap
  // -----------------------------
  const ATTEMPT_BUCKETS = ["A1","A2","A3","A4","A5"];

  function hashString(s){
    let h = 0;
    for (let i=0;i<s.length;i++){
      h = (h*31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function buildConvergenceMatrix(){
  const fixedCols = 5;

  // If the host app provides real convergence heatmap data, use it.
  if (__cvState.__convergenceOverride && Array.isArray(__cvState.__convergenceOverride.categories) && Array.isArray(__cvState.__convergenceOverride.values)) {
    const cats = __cvState.__convergenceOverride.categories;
    const vals = __cvState.__convergenceOverride.values;
    const cnts = Array.isArray(__cvState.__convergenceOverride.counts) ? __cvState.__convergenceOverride.counts : null;

    return cats.map((cat, r) => {
      const row = Array.isArray(vals[r]) ? vals[r] : [];
      const crow = (cnts && Array.isArray(cnts[r])) ? cnts[r] : [];

      const outVals = [];
      const outCnts = [];
      for (let c = 0; c < fixedCols; c++){
        const v = row[c];
        outVals.push((v === null || v === undefined) ? null : Number(v));

        const n = crow[c];
        const nn = Number(n);
        outCnts.push((n === null || n === undefined || !isFinite(nn)) ? 0 : Math.max(0, Math.floor(nn)));
      }

      return { category: String(cat), values: outVals, counts: outCnts, maxBucket: fixedCols };
    });
  }

  // Mock convergence curves with wider range: includes low performers and higher performers.
  // null means "no data" (attempt not reached often enough).
  const matrix = exerciseTimeByCategory.map((row) => {
    const h = hashString(row.category);

    // Start can be quite low for some categories (0.12..0.55)
    const start = 0.12 + ((h % 44) / 100);

    // Gains (some categories improve fast, others slowly)
    const gain1 = 0.08 + (((h >> 3) % 22) / 100);  // 0.08..0.29
    const gain2 = 0.05 + (((h >> 6) % 18) / 100);  // 0.05..0.22
    const gain3 = 0.03 + (((h >> 9) % 14) / 100);  // 0.03..0.16
    const gain4 = 0.02 + (((h >> 12) % 10) / 100); // 0.02..0.11

    // More frequent stalls to show visible patterns
    const stall2 = ((h >> 15) % 3) === 0;  // stall around A3
    const stall3 = ((h >> 17) % 4) === 0;  // stall around A4

    const a1 = clamp(start, 0, 1);
    const a2 = clamp(a1 + gain1, 0, 1);
    const a3 = clamp(a2 + (stall2 ? gain2 * 0.25 : gain2), 0, 1);
    const a4 = clamp(a3 + (stall3 ? gain3 * 0.30 : gain3), 0, 1);
    const a5 = clamp(a4 + gain4, 0, 1);

    // Simulate sparsity: many categories won't have A5 coverage
    const maxBucket = 1 + ((h >> 20) % 5); // 1..5

    const vals = [a1,a2,a3,a4,a5].map((v, idx) => ((idx+1) > maxBucket ? null : v));

    // Deterministic mock evidence counts per cell (declines with attempt #)
    const base = 3 + (((h >> 2) % 16)); // 3..18
    const decay = 0.72;
    const counts = [0,1,2,3,4].map((idx) => {
      if ((idx+1) > maxBucket) return 0;
      const n = Math.round(base * Math.pow(decay, idx));
      return Math.max(1, n);
    });

    return { category: row.category, values: vals, counts, maxBucket };
  });

  // Store an override so the info-pane analysis can read the same matrix the user sees.
  if (!__cvState.__convergenceOverride){
    __cvState.__convergenceOverride = {
      categories: matrix.map(r => String(r.category)),
      buckets: ATTEMPT_BUCKETS.slice(),
      values: matrix.map(r => (r.values || []).slice()),
      counts: matrix.map(r => (r.counts || []).slice())
    };
  } else if (__cvState.__convergenceOverride && (!__cvState.__convergenceOverride.counts || !Array.isArray(__cvState.__convergenceOverride.counts))){
    // If an override exists but has no counts, keep it but do not fake counts.
  }

  return matrix;
}
  function heatColor(v){
    // Premium metallic rainbow ramp (smooth):
    // RED → ORANGE → YELLOW → GREEN → BLUE → INDIGO → VIOLET
    //
    // Design goals:
    // - Smooth (no steps), premium (not neon), and still readable as "more vs less"
    // - Monotonic lightness: brightness increases with value
    // - Moderate chroma (jewel/metallic feel; sheen is provided by CSS overlay)
    //
    // Nonlinear mapping expands visible variation in the high range:
    //   v' = v^0.75
    const t0 = Math.max(0, Math.min(1, v));
    const t = Math.pow(t0, 0.75);

    // 7 anchors across [0,1]
    const hues = [10, 30, 55, 135, 210, 250, 290]; // degrees
    const n = hues.length - 1;
    const p = t * n;
    const i = Math.max(0, Math.min(n - 1, Math.floor(p)));
    const f = p - i;
    const hue = hues[i] + (hues[i + 1] - hues[i]) * f;

    // OKLCH (perceptual) params:
    // - L increases monotonically (dark → bright)
    // - C stays moderate (metallic / premium, avoids neon)
    const L = 0.22 + 0.56 * t;     // 0.22 .. 0.78
    const C = 0.11 + 0.03 * t;     // 0.11 .. 0.14

    function clamp01(x){ return Math.max(0, Math.min(1, x)); }

    // OKLCH → sRGB (via OKLab), based on Björn Ottosson's reference implementation
    function oklchToSrgb(L, C, hDeg){
      const h = (hDeg * Math.PI) / 180;
      const a = C * Math.cos(h);
      const bLab = C * Math.sin(h);

      const l_ = L + 0.3963377774 * a + 0.2158037573 * bLab;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * bLab;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * bLab;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      let rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

      rLin = clamp01(rLin);
      gLin = clamp01(gLin);
      bLin = clamp01(bLin);

      function compand(u){
        return (u <= 0.0031308) ? (12.92 * u) : (1.055 * Math.pow(u, 1/2.4) - 0.055);
      }

      const r = Math.round(compand(rLin) * 255);
      const g = Math.round(compand(gLin) * 255);
      const bOut = Math.round(compand(bLin) * 255);
      return { r, g, b: bOut };
    }

    const rgb = oklchToSrgb(L, C, hue);

    // Keep tiles readable (opacity handled here; metallic sheen is handled in CSS)
    const alpha = 0.94;
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
  }

  // Coding track selector: pills above the depth + allocation panels.
  // Drives __cvState.__selectedCodingTrack ("combined" | "micro" | "interview").
  // ── Helper: detect scores-only layout ──────────────────────────────────
  // Returns true when only the scores panel (no depth, heat, time, alloc, mcq) is visible.
  // Used to switch scoresPalette into the side-by-side tri-track expanded view.
  function __cvIsScoresOnlyLayout(){
    try {
      const st = __cvGetEffectiveUiState ? __cvGetEffectiveUiState() : null;
      if (!st || st.mode !== 'full') return false;
      const p = st.panels || {};
      return !!(p.scores && !p.depth && !p.heatmap && !p.time && !p.allocation && !p.mcq);
    } catch (_) { return false; }
  }

  // ── Expanded tri-track scores view (scores-only layout only) ────────────
  // Renders three side-by-side score columns (Combined / Micro / Interview)
  // inside the scoresPalette, each with its own data from __cvState.
  // The normal scoresScrollArea (tabs + chips) is hidden while this is active.
  function renderScoresExpanded(){
    const mount = getMount ? getMount() : document.getElementById('ciMount');
    if (!mount) return;
    const palette = mount.querySelector('.scoresPalette');
    if (!palette) return;

    const scrollArea = palette.querySelector('.scoresScrollArea');

    // Remove any stale expanded view first
    const existing = palette.querySelector('.cvScoresExpanded');
    if (existing) existing.remove();

    // Collect per-track metrics from state + overrides
    const ov = __cvState.__metricsOverride || {};
    const bt = __cvState.__depthByTrack || {};

    function trackDepthAvg(trackKey){
      const arr = bt[trackKey];
      if (!arr || !arr.length) return null;
      const sum = arr.reduce((a, b) => a + (Number(b.depth) || 0), 0);
      const raw = sum / arr.length;
      // Normalise 0-1 range to 0-100 like renderTopScores does
      const maxRaw = arr.reduce((m, x) => Math.max(m, Number(x.depth) || 0), 0);
      const scale = (maxRaw > 0 && maxRaw <= 1.2) ? 100 : 1;
      return Math.round(raw * scale);
    }

    const breadthAll  = ov.breadthOverall  != null ? Math.round(ov.breadthOverall)  : '—';
    const breadthMic  = ov.breadthMicro    != null ? Math.round(ov.breadthMicro)    : '—';
    const breadthInt  = ov.breadthInterview != null ? Math.round(ov.breadthInterview): '—';

    const depthAll = (() => {
      if (ov.depthOverall != null) return Math.round(ov.depthOverall);
      const v = trackDepthAvg('combined'); return v != null ? v : '—';
    })();
    const depthMic = (() => {
      if (ov.depthMicro != null) return Math.round(ov.depthMicro);
      const v = trackDepthAvg('micro'); return v != null ? v : '—';
    })();
    const depthInt = (() => {
      if (ov.depthInterview != null) return Math.round(ov.depthInterview);
      const v = trackDepthAvg('interview'); return v != null ? v : '—';
    })();

    const codiviumScore = ov.codiviumScore != null ? Math.round(ov.codiviumScore) : '—';
    const ptsAll  = ov.codiviumPointsAll != null ? Math.round(ov.codiviumPointsAll) : '—';
    const pts30   = ov.codiviumPoints30  != null ? Math.round(ov.codiviumPoints30)  : '—';
    const effic   = ov.efficiencyPtsPerHr != null
      ? (Math.round(ov.efficiencyPtsPerHr * 10) / 10).toFixed(1) : '—';

    function chip(title, value, infoKey, wide){
      return `<div class="scoreChip${wide ? ' scoreChipWide' : ''}">
        <div class="kpiTitle">${title}</div>
        <div class="kpiValue${wide ? '' : ' sm'}">${value}</div>
        ${infoKey ? `<button aria-label="Info" class="infoBtn chipInfo" data-info-key="${infoKey}" type="button">i</button>` : ''}
      </div>`;
    }

    const wrap = document.createElement('div');
    wrap.className = 'cvScoresExpanded';

    // Shared scores column (not track-specific)
    const sharedCol = document.createElement('div');
    sharedCol.className = 'cvScoresExpCol cvScoresExpColShared';
    sharedCol.innerHTML = `
      <div class="cvScoresExpColTitle">Overall</div>
      <div class="scoresGrid scoresGridMain">
        ${chip('Codivium Score (0–100)', codiviumScore, 'codiviumScore', true)}
        ${chip('Points (all-time)', ptsAll, 'codiviumPointsAll')}
        ${chip('Points (30D)', pts30, 'codiviumPoints30')}
        ${chip('Efficiency (pts/hr)', effic, 'efficiencyPtsPerHr')}
      </div>`;

    // Per-track columns
    const tracks = [
      { key: 'combined',  label: 'Combined',  breadth: breadthAll, depth: depthAll },
      { key: 'micro',     label: 'Micro',     breadth: breadthMic, depth: depthMic },
      { key: 'interview', label: 'Interview', breadth: breadthInt, depth: depthInt },
    ];

    wrap.appendChild(sharedCol);
    tracks.forEach(({ key, label, breadth, depth }) => {
      const hasMicro = !!(bt.micro && bt.micro.length);
      const hasInterview = !!(bt.interview && bt.interview.length);
      const unavailable = (key === 'micro' && !hasMicro) || (key === 'interview' && !hasInterview);

      const col = document.createElement('div');
      col.className = 'cvScoresExpCol' + (unavailable ? ' cvScoresExpColUnavail' : '');
      col.innerHTML = `
        <div class="cvScoresExpColTitle">${label}</div>
        <div class="scoresGrid">
          ${chip('Breadth', unavailable ? 'N/A' : breadth, null)}
          ${chip('Depth', unavailable ? 'N/A' : depth, null)}
        </div>
        ${unavailable ? '<p class="cvScoresExpUnavailNote">No data for this track</p>' : ''}`;
      wrap.appendChild(col);
    });

    // Hide the normal tab UI, show the expanded view
    if (scrollArea) scrollArea.classList.add('isHidden');
    palette.appendChild(wrap);
  }

  function teardownScoresExpanded(){
    const mount = getMount ? getMount() : document.getElementById('ciMount');
    if (!mount) return;
    const palette = mount.querySelector('.scoresPalette');
    if (!palette) return;
    const existing = palette.querySelector('.cvScoresExpanded');
    if (existing) existing.remove();
    const scrollArea = palette.querySelector('.scoresScrollArea');
    if (scrollArea) scrollArea.classList.remove('isHidden');
  }

  // Register a window-level hook so dashboard.00.core.js can call teardown
  // whenever panel visibility changes (e.g., switching away from scores_only).
  // The guard inside ensures we don't tear down when entering scores_only itself.
  window.__cv_teardownScoresExpanded = function(){
    try {
      // Only tear down when scores_only is no longer the active layout.
      if (__cvIsScoresOnlyLayout()) return;
      teardownScoresExpanded();
    } catch (_) {}
  };

  function setupCodingTrackSelector() {
    const mount = getMount ? getMount() : (document.getElementById('ciMount') || document.body);
    if (!mount) return;

    // Scores-only layout: show all three tracks simultaneously, no selector buttons.
    if (__cvIsScoresOnlyLayout()) {
      teardownScoresExpanded(); // clear stale first
      // Hide any pre-existing track selector row (injected by a prior full-dashboard render)
      try {
        const mount = getMount ? getMount() : document.getElementById('ciMount');
        if (mount) {
          mount.querySelectorAll('.cvTrackSelector').forEach(el => el.classList.add('isHidden'));
        }
      } catch (_) {}
      renderScoresExpanded();
      return;
    }

    // Restore any hidden track selector (coming back from scores-only)
    try {
      const mount = getMount ? getMount() : document.getElementById('ciMount');
      if (mount) {
        mount.querySelectorAll('.cvTrackSelector').forEach(el => el.classList.remove('isHidden'));
      }
    } catch (_) {}

    // All other layouts: ensure the expanded view is gone and the normal selector is present.
    teardownScoresExpanded();

    const leftCol = mount.querySelector('.colLeft');
    if (!leftCol) return;

    // Only inject once.
    if (leftCol.querySelector('.cvTrackSelector')) return;

    // Only show if per-track data is available.
    const hasMicro = !!(typeof __cvState.__allocationByTrack !== 'undefined' && __cvState.__allocationByTrack && __cvState.__allocationByTrack.micro && __cvState.__allocationByTrack.micro.length);
    const hasInterview = !!(typeof __cvState.__allocationByTrack !== 'undefined' && __cvState.__allocationByTrack && __cvState.__allocationByTrack.interview && __cvState.__allocationByTrack.interview.length);
    if (!hasMicro && !hasInterview) return; // v1 payload — nothing to filter

    const row = document.createElement('div');
    row.className = 'cvTrackSelector';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Coding track filter');
    row.innerHTML = `
      <span class="cvTrackLabel">Track:</span>
      <div class="segmented cvTrackPills" role="tablist" aria-label="Coding track">
        <button class="segBtn" data-cv-track="combined" type="button" aria-pressed="true">Combined</button>
        <button class="segBtn" data-cv-track="micro" type="button" aria-pressed="false">Micro</button>
        <button class="segBtn" data-cv-track="interview" type="button" aria-pressed="false">Interview</button>
      </div>`;

    // Disable unavailable tracks
    row.querySelectorAll('[data-cv-track]').forEach(btn => {
      const t = btn.getAttribute('data-cv-track');
      if (t === 'micro' && !hasMicro) { btn.disabled = true; btn.title = 'Micro data not available'; }
      if (t === 'interview' && !hasInterview) { btn.disabled = true; btn.title = 'Interview data not available'; }
    });

    leftCol.insertBefore(row, leftCol.firstChild);
    leftCol.__cvTrackSelector = true;

    // Bind clicks
    row.querySelectorAll('[data-cv-track]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-cv-track') || 'combined';
        if (typeof __cvState.__selectedCodingTrack !== 'undefined') {
          window.__cv_setSelectedTrack && window.__cv_setSelectedTrack(t);
        }
        row.querySelectorAll('[data-cv-track]').forEach(b => {
          b.classList.toggle('isActive', b.getAttribute('data-cv-track') === t);
          b.setAttribute('aria-pressed', String(b.getAttribute('data-cv-track') === t));
        });
        try {
          const top = renderTopScores();
          if (typeof renderDepthChart === 'function') renderDepthChart(top.depthScores || []);
        } catch (e) { ciErr && ciErr('track selector depth', e); }
        try { renderExerciseTreemap(); } catch (e) { ciErr && ciErr('track selector alloc', e); }
      });
    });

    refreshCodingTrackSelector(row);
  }
  function refreshCodingTrackSelector(row) {
    const sel = row || (getMount ? getMount() : document.getElementById('ciMount') || document.body);
    const pills = sel && sel.querySelectorAll('.cvTrackSelector [data-cv-track]');
    if (!pills) return;
    const cur = (typeof __cvState.__selectedCodingTrack !== 'undefined') ? __cvState.__selectedCodingTrack : 'combined';
    pills.forEach(b => {
      b.classList.toggle('isActive', b.getAttribute('data-cv-track') === cur);
      b.setAttribute('aria-pressed', String(b.getAttribute('data-cv-track') === cur));
    });
  }

  function setupHeatmapControls(){
    const wrap = document.querySelector('.heatmapWrap');
    if (!wrap || wrap.__cvHeatmapControls) return;
    const head = wrap.querySelector('.heatmapHead');
    if (!head) return;

    const controls = document.createElement('div');
    controls.className = 'heatmapControls';
    controls.innerHTML = `
      <div class="heatmapControlsRow">
        <div aria-label="Heatmap view" class="segmented heatmapViews" role="tablist">
          <button class="segBtn" data-heatmap-view="focus" type="button">Focus</button>
          <button class="segBtn" data-heatmap-view="all" type="button">All</button>
          <button class="segBtn" data-heatmap-view="micro" type="button">Micro</button>
          <button class="segBtn" data-heatmap-view="interview" type="button">Interview</button>
        </div>

        <div class="heatmapFocusControls" id="heatmapFocusControls">
          <label class="heatmapCtl">
            <span>Rank by</span>
            <select id="heatmapFocusMode" aria-label="Rank by"></select>
          </label>
          <label class="heatmapCtl">
            <span>Top</span>
            <input id="heatmapTopN" aria-label="Top N" inputmode="numeric" min="3" max="30" step="1" type="number" value="12"/>
          </label>
        </div>
      </div>
    `;

    wrap.insertBefore(controls, head);
    wrap.__cvHeatmapControls = true;

    // Bind view toggles
    controls.querySelectorAll('[data-heatmap-view]').forEach((btn) => {
      if (btn.__cvBound) return;
      btn.__cvBound = true;
      btn.addEventListener('click', () => {
        __cvState.__heatmapView = btn.getAttribute('data-heatmap-view') || 'focus';
        try { refreshHeatmapControls(); } catch (e) { ciErr('ignored error', e); }
        try { renderConvergenceHeatmap(); } catch (e) { ciErr('ignored error', e); }
        try { refreshInfoIfActive('panel_heatmap'); } catch (e) { ciErr('ignored error', e); }
      });
    });

    // Bind focus controls
    const sel = controls.querySelector('#heatmapFocusMode');
    const nInput = controls.querySelector('#heatmapTopN');

    if (sel && !sel.__cvBound){
      sel.__cvBound = true;
      sel.addEventListener('change', () => {
        __cvState.__heatmapFocusModeId = sel.value || __cvState.__heatmapFocusModeId;
        try { renderConvergenceHeatmap(); } catch (e) { ciErr('ignored error', e); }
        try { refreshInfoIfActive('panel_heatmap'); } catch (e) { ciErr('ignored error', e); }
      });
    }

    if (nInput && !nInput.__cvBound){
      nInput.__cvBound = true;
      const applyTopN = () => {
        const v = Number(nInput.value);
        if (!isFinite(v)) return;
        __cvState.__heatmapTopN = Math.max(3, Math.min(30, Math.floor(v)));
        nInput.value = String(__cvState.__heatmapTopN);
        try { renderConvergenceHeatmap(); } catch (e) { ciErr('ignored error', e); }
        try { refreshInfoIfActive('panel_heatmap'); } catch (e) { ciErr('ignored error', e); }
      };

      // Update automatically as the value changes (premium feel). Use a small debounce.
      let t = 0;
      nInput.addEventListener('input', () => {
        if (t) clearTimeout(t);
        t = setTimeout(() => { t = 0; applyTopN(); }, 180);
      });
      // Also apply on commit (enter/blur)
      nInput.addEventListener('change', applyTopN);
    }

    // Initial sync
    try { refreshHeatmapControls(); } catch (e) { ciErr('ignored error', e); }
  }

  function refreshHeatmapControls(){
    const wrap = document.querySelector('.heatmapWrap');
    if (!wrap) return;
    const controls = wrap.querySelector('.heatmapControls');
    if (!controls) return;

    // Active tab
    controls.querySelectorAll('[data-heatmap-view]').forEach((btn) => {
      btn.classList.toggle('isActive', (btn.getAttribute('data-heatmap-view') || '') === __cvState.__heatmapView);
    });

    // Disable track-specific tabs if v2 datasets are not available
    const hasMicro = !!(__cvState.__heatmapData && __cvState.__heatmapData.micro);
    const hasInterview = !!(__cvState.__heatmapData && __cvState.__heatmapData.interview);
    controls.querySelectorAll('[data-heatmap-view="micro"]').forEach((b)=>{ b.disabled = !hasMicro; b.title = hasMicro ? '' : 'Micro heatmap not available'; });
    controls.querySelectorAll('[data-heatmap-view="interview"]').forEach((b)=>{ b.disabled = !hasInterview; b.title = hasInterview ? '' : 'Interview heatmap not available'; });

    const focusWrap = controls.querySelector('#heatmapFocusControls');
    if (focusWrap) focusWrap.style.display = (__cvState.__heatmapView === 'focus') ? '' : 'none';

    // Populate mode list (backend-driven)
    const sel = controls.querySelector('#heatmapFocusMode');
    if (sel){
      const modes = (__cvState.__heatmapFocus && Array.isArray(__cvState.__heatmapFocus.modes)) ? __cvState.__heatmapFocus.modes : [];
      const prev = sel.value;

      // Populate once or when mode list changed
      const sig = modes.map(m=>m.id).join('|');
      if (sel.__sig !== sig){
        sel.__sig = sig;
        sel.textContent = '';
        if (!modes.length){
          const opt = document.createElement('option');
          opt.value = 'impact';
          opt.textContent = 'Impact';
          sel.appendChild(opt);
        } else {
          modes.forEach((m) => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.label || m.id;
            if (m.description) opt.title = m.description;
            sel.appendChild(opt);
          });
        }
      }

      // Selected mode
      const desired = String(__cvState.__heatmapFocusModeId || (__cvState.__heatmapFocus && __cvState.__heatmapFocus.defaultModeId) || 'impact');
      if (sel.value !== desired) sel.value = desired;
      __cvState.__heatmapFocusModeId = sel.value;

      // Top N defaults/options
      const nInput = controls.querySelector('#heatmapTopN');
      if (nInput){
        const defN = (__cvState.__heatmapFocus && __cvState.__heatmapFocus.topNDefault) ? Number(__cvState.__heatmapFocus.topNDefault) : 12;
        if (!(__cvState.__heatmapTopN && isFinite(__cvState.__heatmapTopN))) __cvState.__heatmapTopN = defN;
        nInput.value = String(__cvState.__heatmapTopN);
      }
    }
  }

  // -----------------------------
  // Panel CTAs (recommendedActions)
  // -----------------------------
  const PANEL_SELECTORS = {
    heatmap: '.heatmapPanel',
    allocation: '.donutPanel',
    depth: '.depthPanel',
    time: '.timePanel',
    mcq: '.mcqPanel'
  };

  function setupPanelCtas(){
    Object.keys(PANEL_SELECTORS).forEach((panelId) => {
      const panel = document.querySelector(PANEL_SELECTORS[panelId]);
      if (!panel) return;
      const head = panel.querySelector('.shellHead');
      if (!head) return;
      if (head.querySelector(`[data-panel-cta="${panelId}"]`)) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'panelCtaBtn';
      btn.setAttribute('data-panel-cta', panelId);
      btn.textContent = 'Start session';
      btn.style.display = 'none';

      // Ensure a right-aligned actions container (keeps layout consistent)
      let actions = head.querySelector('.shellActions');
      if (!actions){
        actions = document.createElement('div');
        actions.className = 'shellActions';
        const infoBtn = head.querySelector('.infoBtn');
        if (infoBtn && infoBtn.parentNode === head){
          actions.appendChild(infoBtn);
        }
        head.appendChild(actions);
      }

      // Insert CTA before the info button inside actions container
      const infoBtn2 = actions.querySelector('.infoBtn');
      if (infoBtn2) actions.insertBefore(btn, infoBtn2);
      else actions.appendChild(btn);

      btn.addEventListener('click', async () => {
        const action = getRecommendedAction(panelId);
        if (!action) return;
        try {
          btn.disabled = true;
          btn.classList.add('isBusy');
          await runRecommendedAction(action);
        } finally {
          btn.disabled = false;
          btn.classList.remove('isBusy');
        }
      });
    });
  }

  function getRecommendedAction(panelId){
    const list = Array.isArray(__cvState.__recommendedActions) ? __cvState.__recommendedActions : [];
    // Accept multiple naming conventions
    const norm = (x) => String(x || '').toLowerCase();
    const pid = norm(panelId);

    // Exact match
    let hit = list.find((a) => norm(a.panelId || a.panel || a.PanelId || a.Panel) === pid);
    if (hit) return hit;

    // Allow more specific keys like heatmap_focus
    if (pid === 'heatmap'){
      hit = list.find((a) => norm(a.panelId || a.panel || a.PanelId || a.Panel).indexOf('heatmap') >= 0);
      if (hit) return hit;
    }

    // Fallback: first item for that track/panel group
    return null;
  }

  function updatePanelCtas(){
    Object.keys(PANEL_SELECTORS).forEach((panelId) => {
      const btn = document.querySelector(`[data-panel-cta="${panelId}"]`);
      if (!btn) return;
      const action = getRecommendedAction(panelId);
      if (!action){
        btn.style.display = 'none';
        return;
      }
      const label = action.label || action.Label || action.ctaLabel || action.CtaLabel || 'Start session';
      btn.textContent = String(label);
      btn.style.display = '';
    });
  }

  async function runRecommendedAction(action){
    if (!action || typeof action !== 'object') return;

    const type = String(action.actionType || action.ActionType || 'start_session');
    if (type === 'link' || type === 'navigate'){
      const url = action.url || action.Url || action.href || action.Href;
      if (url) {
        const safeUrl = __cvNormalizeRedirectUrl(url);
        if (safeUrl) window.location.href = safeUrl;
      }
      return;
    }

    // start_session (Option B)
    const endpointRaw = String(action.endpoint || action.Endpoint || __cvState.__sessionStartEndpoint || '/api/sessions/start');
    const endpoint = __cvNormalizeSameOriginEndpoint(endpointRaw);
    if (!endpoint){
      alert('Blocked unsafe endpoint URL.');
      return;
    }
    const params = (action.params && typeof action.params === 'object') ? action.params :
                   (action.Params && typeof action.Params === 'object') ? action.Params :
                   {};

    // Build request body matching backend StartSessionRequest shape:
    //   actionId, panelId, track, category, difficulty, params (full object), source
    // Do NOT spread params into the top level — the backend expects params as its own
    // property so that routing hints (intent, timeboxMinutes, count, etc.) are preserved.
    const payload = {
      actionId: action.id || action.Id || null,
      panelId: action.panelId || action.panel || action.PanelId || action.Panel || null,
      track: action.track || action.Track || null,
      category: params.category || params.Category || null,
      difficulty: params.difficulty || params.Difficulty || null,
      params: params,
      source: 'dashboard'
    };

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e){
      alert('Could not start session (network error).');
      return;
    }

    let data = null;
    try { data = await res.json(); } catch (e) { ciErr('ignored error', e); }

    if (!res.ok){
      const msg = (data && (data.message || data.Message)) ? (data.message || data.Message) : 'Could not start session.';
      alert(String(msg));
      return;
    }

    const redirect = data && (data.redirectUrl || data.redirect_url || data.url || data.Url);
    if (redirect){
      const safeRedirect = __cvNormalizeRedirectUrl(redirect);
      if (safeRedirect) {
        window.location.href = safeRedirect;
      } else {
        alert('Blocked unsafe redirect URL.');
      }
      return;
    }

    // No redirect provided — treat as success but inform
    alert('Session created.');
  }

  // ─── Mock heatmap data seeder ──────────────────────────────────────────────
  // Seeds __cvState.__heatmapData.micro, __cvState.__heatmapData.interview and __cvState.__heatmapFocus.modes
  // when no real backend payload has provided them. This ensures the Micro and
  // Interview tab buttons are enabled and the "Rank by" dropdown is populated in
  // demo mode. Safe no-op when real data exists.
  function __seedMockHeatmapIfNeeded(){
    try {
      const hasMicro    = !!(__cvState.__heatmapData && __cvState.__heatmapData.micro);
      const hasInterview = !!(__cvState.__heatmapData && __cvState.__heatmapData.interview);
      const hasModes    = !!(__cvState.__heatmapFocus && __cvState.__heatmapFocus.modes && __cvState.__heatmapFocus.modes.length > 1);
      if (hasMicro && hasInterview && hasModes) return; // real data present

      // Build a deterministic per-category mock matrix with a different seed offset.
      const mkMockMatrix = (cats, seedOffset) => {
        return cats.map((cat) => {
          const h = (hashString(cat) + seedOffset) >>> 0;
          const start  = 0.10 + ((h % 50) / 100);
          const gain1  = 0.07 + (((h >> 3)  % 24) / 100);
          const gain2  = 0.05 + (((h >> 6)  % 18) / 100);
          const gain3  = 0.03 + (((h >> 9)  % 14) / 100);
          const gain4  = 0.02 + (((h >> 12) % 10) / 100);
          const stall2 = ((h >> 15) % 3) === 0;
          const stall3 = ((h >> 17) % 4) === 0;
          const a1 = Math.min(1, Math.max(0, start));
          const a2 = Math.min(1, a1 + gain1);
          const a3 = Math.min(1, a2 + (stall2 ? gain2 * 0.20 : gain2));
          const a4 = Math.min(1, a3 + (stall3 ? gain3 * 0.25 : gain3));
          const a5 = Math.min(1, a4 + gain4);
          const maxBucket = 1 + ((h >> 20) % 5);
          const vals   = [a1,a2,a3,a4,a5].map((v,i) => (i+1) > maxBucket ? null : v);
          const base   = 2 + ((h >> 2) % 14);
          const counts = [0,1,2,3,4].map((i) => (i+1) > maxBucket ? 0 : Math.max(1, Math.round(base * Math.pow(0.70, i))));
          return { category: cat, values: vals, counts };
        });
      };

      const allCats = exerciseTimeByCategory.map(r => r.category);
      // Micro: algorithm-heavy categories (first half or all)
      const microCats     = allCats.filter((_, i) => i % 2 === 0).concat(allCats.filter((_, i) => i % 3 === 0)).filter((c,i,a) => a.indexOf(c)===i).slice(0, Math.min(10, allCats.length));
      // Interview: design/breadth-heavy (second half or all)
      const interviewCats = allCats.filter((_, i) => i % 2 === 1).concat(allCats.filter((_, i) => i % 3 === 1)).filter((c,i,a) => a.indexOf(c)===i).slice(0, Math.min(10, allCats.length));

      if (!hasMicro || !hasInterview) {
        const microMatrix     = mkMockMatrix(microCats.length ? microCats : allCats, 0x1A2B3C);
        const interviewMatrix = mkMockMatrix(interviewCats.length ? interviewCats : allCats, 0xD4E5F6);

        const matrixToDataset = (m) => ({
          categories: m.map(r => r.category),
          buckets: ATTEMPT_BUCKETS.slice(),
          values:  m.map(r => r.values.slice()),
          counts:  m.map(r => r.counts.slice()),
          focusModes: null,
          defaultModeId: null,
          focusRankings: null,
          topNDefault: 8,
          topNOptions: [6, 8, 10, 12]
        });

        const existing = (__cvState.__heatmapData && typeof __cvState.__heatmapData === 'object') ? __cvState.__heatmapData : {};
        __cvState.__heatmapData = Object.assign({}, existing, {
          micro:     hasMicro     ? existing.micro     : matrixToDataset(microMatrix),
          interview: hasInterview ? existing.interview : matrixToDataset(interviewMatrix)
        });
      }

      if (!hasModes) {
        // Seed mock focus modes matching the backend's real mode definitions
        const MOCK_MODES = [
          { id: 'impact',           label: 'Impact (time × weakness)', description: 'Prioritises categories where time spent is high and early convergence is low.',       isDefault: true  },
          { id: 'worst_convergence',label: 'Worst convergence',        description: 'Lowest early attempt pass% (A1–A3).',                                                  isDefault: false },
          { id: 'most_time',        label: 'Most time spent',          description: 'Highest time allocation.',                                                              isDefault: false },
          { id: 'lowest_depth',     label: 'Lowest depth',             description: 'Lowest depth score by category.',                                                       isDefault: false },
          { id: 'highest_friction', label: 'Highest friction',         description: 'Proxy for slow progress: low early convergence scaled by time.',                        isDefault: false },
        ];

        // Build deterministic rankings from exerciseTimeByCategory for each mode
        const byImpact    = exerciseTimeByCategory.slice().sort((a,b) => {
          const convA = 1 - (0.30 + (hashString(a.category) % 40) / 100);
          const convB = 1 - (0.30 + (hashString(b.category) % 40) / 100);
          return (b.minutes * convB) - (a.minutes * convA);
        }).map(r => r.category);
        const byTime      = exerciseTimeByCategory.slice().sort((a,b) => b.minutes - a.minutes).map(r => r.category);
        const byDepth     = exerciseTimeByCategory.slice().sort((a,b) => {
          const dA = 40 + (hashString(a.category + 'depth') % 45);
          const dB = 40 + (hashString(b.category + 'depth') % 45);
          return dA - dB;
        }).map(r => r.category);
        const byConv      = exerciseTimeByCategory.slice().sort((a,b) => {
          const cA = 0.20 + (hashString(a.category + 'conv') % 50) / 100;
          const cB = 0.20 + (hashString(b.category + 'conv') % 50) / 100;
          return cA - cB;
        }).map(r => r.category);
        const byFriction  = exerciseTimeByCategory.slice().sort((a,b) => {
          const fA = b.minutes * (0.20 + (hashString(a.category + 'fric') % 50) / 100);
          const fB = a.minutes * (0.20 + (hashString(b.category + 'fric') % 50) / 100);
          return fA - fB;
        }).map(r => r.category);

        __cvState.__heatmapFocus = {
          modes: MOCK_MODES,
          defaultModeId: 'impact',
          rankings: {
            impact:           byImpact,
            worst_convergence: byConv,
            most_time:        byTime,
            lowest_depth:     byDepth,
            highest_friction: byFriction,
          },
          topNDefault: 12,
          topNOptions: [8, 10, 12, 14, 16]
        };
        if (!__cvState.__heatmapFocusModeId) __cvState.__heatmapFocusModeId = 'impact';
      }
    } catch (e) { ciErr('seedMockHeatmap', e); }
  }

  function renderConvergenceHeatmap(){
    const host = cv$("convergenceHeatmap");
    if (!host) return;

    // Seed mock micro/interview/focusModes data when no real payload provided it
    __seedMockHeatmapIfNeeded();

    // Ensure controls exist and are up to date
    safe('setupHeatmapControls', setupHeatmapControls);
    try { refreshHeatmapControls(); } catch (e) { ciErr('ignored error', e); }

    // Choose dataset by view
    const getDataset = () => {
      if (__cvState.__heatmapData && typeof __cvState.__heatmapData === 'object'){
        if (__cvState.__heatmapView === 'micro') return __cvState.__heatmapData.micro || __cvState.__heatmapData.combined || null;
        if (__cvState.__heatmapView === 'interview') return __cvState.__heatmapData.interview || __cvState.__heatmapData.combined || null;
        return __cvState.__heatmapData.combined || null;
      }
      // v1 fallback: use override or mock
      if (__cvState.__convergenceOverride && Array.isArray(__cvState.__convergenceOverride.categories) && Array.isArray(__cvState.__convergenceOverride.values)) {
        return {
          categories: __cvState.__convergenceOverride.categories.slice(),
          buckets: Array.isArray(__cvState.__convergenceOverride.buckets) ? __cvState.__convergenceOverride.buckets.slice() : ATTEMPT_BUCKETS.slice(),
          values: __cvState.__convergenceOverride.values,
          counts: Array.isArray(__cvState.__convergenceOverride.counts) ? __cvState.__convergenceOverride.counts : null
        };
      }
      const matrix = buildConvergenceMatrix();
      return {
        categories: matrix.map(r=>String(r.category)),
        buckets: ATTEMPT_BUCKETS.slice(),
        values: matrix.map(r=>(r.values||[]).slice()),
        counts: matrix.map(r=>(r.counts||[]).slice())
      };
    };

    const ds = getDataset();
    if (!ds || !Array.isArray(ds.categories) || !Array.isArray(ds.values) || !ds.categories.length){
      host.innerHTML = '<div class="heatmapEmpty">No heatmap data yet.</div>';
      return;
    }

    const buckets = Array.isArray(ds.buckets) && ds.buckets.length ? ds.buckets.slice(0,5) : ATTEMPT_BUCKETS.slice();
    renderHeatmapHeadBuckets(buckets);

    // Determine category order
    let orderedCats = ds.categories.slice();

    if (__cvState.__heatmapView === 'focus' && __cvState.__heatmapFocus && __cvState.__heatmapFocus.rankings){
      const modeId = String(__cvState.__heatmapFocusModeId || __cvState.__heatmapFocus.defaultModeId || 'impact');
      const arr = __cvState.__heatmapFocus.rankings[modeId] || __cvState.__heatmapFocus.rankings[modeId.toLowerCase()] || null;
      const ranked = Array.isArray(arr) ? arr.map(String) : [];
      const set = new Set(ds.categories.map(String));
      orderedCats = ranked.filter(c=>set.has(c));
      const n = Math.max(3, Math.min(30, Number(__cvState.__heatmapTopN)||12));
      orderedCats = orderedCats.slice(0, n);
      if (!orderedCats.length){
        orderedCats = ds.categories.slice(0, n);
      }
    }

    // Build row objects in the desired order
    const idxMap = new Map(ds.categories.map((c,i)=>[String(c), i]));
    const rows = orderedCats.map((cat) => {
      const i = idxMap.get(String(cat));
      const row = Array.isArray(ds.values[i]) ? ds.values[i] : [];
      const crow = (ds.counts && Array.isArray(ds.counts[i])) ? ds.counts[i] : [];
      const vals = [];
      const cnts = [];
      for (let k=0;k<5;k++){
        const v = row[k];
        vals.push((v === null || v === undefined) ? null : Number(v));
        const n = crow[k];
        const nn = Number(n);
        cnts.push((n === null || n === undefined || !isFinite(nn)) ? 0 : Math.max(0, Math.floor(nn)));
      }
      return { category: String(cat), values: vals, counts: cnts };
    });

    // Keep the info-pane analysis aligned with what the user currently sees.
    __cvState.__convergenceOverride = {
      categories: rows.map(r => String(r.category)),
      buckets: buckets.slice(),
      values: rows.map(r => (r.values || []).slice()),
      counts: rows.map(r => (r.counts || []).slice())
    };

    renderHeatmapVirtual(host, rows, buckets);
  }

  function renderHeatmapHeadBuckets(buckets){
    try {
      const head = document.querySelector('.heatmapHead');
      if (!head) return;
      const cells = head.querySelectorAll('.hCell');
      // cells[0] is empty label
      for (let i=1;i<Math.min(cells.length, 6);i++){
        const b = buckets[i-1] || ATTEMPT_BUCKETS[i-1];
        cells[i].textContent = String(b);
      }
    } catch (e) { ciErr('ignored error', e); }
  }

  function renderHeatmapVirtual(host, rows, buckets){
    // Virtualised row rendering (All categories + track tabs)
    // We render a fixed-height scroll region with a spacer.
    const ROW_H = 42; // keep aligned with CSS row sizing

    // Build structure once
    if (!host.__cvVirt){
      host.classList.add('heatmapVirt');
      host.innerHTML = '';
      const spacer = document.createElement('div');
      spacer.className = 'hVirtSpacer';
      const items = document.createElement('div');
      items.className = 'hVirtItems';
      host.appendChild(spacer);
      host.appendChild(items);

      const state = { spacer, items, rows: [], start: -1, end: -1, raf: 0 };
      host.__cvVirt = state;

      const onScroll = () => {
        if (state.raf) return;
        state.raf = requestAnimationFrame(() => {
          state.raf = 0;
          __renderSlice(true);
        });
      };
      host.addEventListener('scroll', onScroll, { passive: true });

      // Keep the static header aligned with the scrollable body (accounts for scrollbar width).
      state.syncHeadGutter = () => {
        try {
          const wrap = host.closest('.heatmapWrap');
          if (!wrap) return;
          const sbw = Math.max(0, (host.offsetWidth || 0) - (host.clientWidth || 0));
          wrap.style.setProperty('--cv-sbw', `${sbw}px`);
        } catch (e) { ciErr('ignored error', e); }
      };

      function __mkCell(category, bucketLabel, v, count){
        const cell = document.createElement('div');
        cell.className = 'hCell hHeat';
        if (v === null || typeof v !== 'number' || !isFinite(v)) {
          cell.classList.add('hEmpty');
          cell.style.setProperty('--heat', 'rgba(255,255,255,0.04)');
          cell.title = `${category} • ${bucketLabel} • no data`;
          const vSpan = document.createElement('span');
          vSpan.className = 'hVal';
          vSpan.style.opacity = '0.55';
          vSpan.textContent = '—';
          cell.appendChild(vSpan);
          return cell;
        }
        cell.style.setProperty('--heat', heatColor(v));
        const cTxt = (count && count > 0) ? ` • n=${count}` : '';
        cell.title = `${category} • ${bucketLabel} • ${(v*100).toFixed(0)}% tests passed${cTxt}`;
        const vSpan = document.createElement('span');
        vSpan.className = 'hVal';
        vSpan.textContent = `${(v*100).toFixed(0)}%`;
        cell.appendChild(vSpan);
        return cell;
      }

      function __mkRow(r){
        const rowEl = document.createElement('div');
        rowEl.className = 'hRow';

        const label = document.createElement('div');
        label.className = 'hCell hRowLabel';
        label.title = r.category;
        const lblSpan = document.createElement('span');
        lblSpan.className = 'hLabel';
        lblSpan.textContent = r.category;
        label.appendChild(lblSpan);
        rowEl.appendChild(label);

        for (let i=0;i<5;i++){
          const bucketLabel = buckets[i] || ATTEMPT_BUCKETS[i];
          const v = r.values[i];
          const c = r.counts ? r.counts[i] : 0;
          rowEl.appendChild(__mkCell(r.category, bucketLabel, v, c));
        }
        return rowEl;
      }

      function __renderSlice(force){
        const total = state.rows.length;
        const scrollTop = host.scrollTop || 0;
        const h = host.clientHeight || 0;
        const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 2);
        const visible = Math.ceil(h / ROW_H) + 4;
        const end = Math.min(total, start + visible);
        if (!force && start === state.start && end === state.end) return;
        state.start = start;
        state.end = end;

        // Clear and rebuild visible rows
        state.items.textContent = '';
        while (state.items.firstChild) state.items.removeChild(state.items.firstChild);

        const frag = document.createDocumentFragment();
        for (let i=start;i<end;i++){
          frag.appendChild(__mkRow(state.rows[i]));
        }
        state.items.appendChild(frag);
        state.items.style.transform = `translateY(${start * ROW_H}px)`;
      }

      // Expose methods
      state.setRows = (rws) => {
        state.rows = Array.isArray(rws) ? rws : [];
        state.spacer.style.height = `${state.rows.length * ROW_H}px`;
        // Note: don't forcibly reset scroll; users often inspect lower rows.
        __renderSlice(true);

        // After layout, sync header gutter.
        if (typeof state.syncHeadGutter === 'function'){
          requestAnimationFrame(() => { try { state.syncHeadGutter(); } catch (e) { ciErr('ignored error', e); } });
        }
      };

      state.renderNow = () => __renderSlice(true);
    }

    // Update rows
    host.__cvVirt.setRows(rows);
  }

  // -----------------------------
  // Charts
  // -----------------------------

  function __ensureTinyTooltip(){
    const mount = getMount();
    if (!mount) return null;
    let el = mount.querySelector('.ciTinyTip');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ciTinyTip isHidden';
    el.setAttribute('role', 'tooltip');
    mount.appendChild(el);
    return el;
  }

  // -----------------------------
  // Tooltips for dashboard buttons
  // -----------------------------
  function __btnTipText(el){
    if (!el) return '';
    // Explicit overrides
    if (el.classList && el.classList.contains('refreshDashboardBtn')) return 'Refresh dashboard';
    if (el.id === 'startTourBtn') return 'Start tour';
    if (el.classList && el.classList.contains('introLink') && !el.classList.contains('refreshDashboardBtn')) return 'Open intro';
    if (el.classList && el.classList.contains('pageInfoBtn')) return '';
    // Remove tooltips for the small "i" info buttons – their purpose is obvious.
    if (el.classList && el.classList.contains('infoBtn') && !el.classList.contains('refreshDashboardBtn')) return '';

    // Time panel controls
    if (el.hasAttribute && el.hasAttribute('data-time-range')){
      const k = String(el.getAttribute('data-time-range') || '').toLowerCase();
      const lbl = (k === '7d') ? 'last 7 days' : (k === '30d') ? 'last 30 days' : (k === '90d') ? 'last 90 days' : 'year to date';
      return `Time: ${lbl}`;
    }
    if (el.hasAttribute && el.hasAttribute('data-time-gran')){
      const k = String(el.getAttribute('data-time-gran') || '').toLowerCase();
      return (k === 'weekly') ? 'Time: weekly' : 'Time: daily';
    }

    // Allocation panel controls
    if (el.hasAttribute && el.hasAttribute('data-alloc-mode')){
      const k = String(el.getAttribute('data-alloc-mode') || '').toLowerCase();
      return (k === 'share') ? 'Category time: %' : 'Category time: minutes';
    }
    if (el.classList && el.classList.contains('treemapResetBtn')) return 'Clear selection';

    // Heatmap controls
    if (el.hasAttribute && el.hasAttribute('data-heatmap-view')){
      const k = String(el.getAttribute('data-heatmap-view') || '').toLowerCase();
      if (k === 'focus') return 'Heatmap: focus';
      if (k === 'micro') return 'Heatmap: micro';
      if (k === 'interview') return 'Heatmap: interview';
      return 'Heatmap: overall';
    }

    // Panel CTA button (added dynamically)
    if (el.classList && el.classList.contains('panelCtaBtn')){
      const pid = String(el.getAttribute('data-panel-cta') || '');
      if (pid === 'depth') return 'Start coding session';
      if (pid === 'heatmap') return 'Start coding session';
      if (pid === 'allocation') return 'Start coding session';
      if (pid === 'time') return 'Start coding session';
      if (pid === 'mcq') return 'Start MCQ quiz';
      return 'Start session';
    }

    // Fallback: only show tooltips when the element explicitly asks for it (data-tip/title/aria-label).
    // Avoid per-mousemove tooltips for every clickable element – it causes unnecessary layout work.
    const dt = (el.getAttribute && el.getAttribute('data-tip')) ? (el.getAttribute('data-tip') || '') : '';
    if (dt) return dt;
    const title = (el.getAttribute && el.getAttribute('title')) ? (el.getAttribute('title') || '') : '';
    if (title) return title;
    const aria = (el.getAttribute && el.getAttribute('aria-label')) ? (el.getAttribute('aria-label') || '') : '';
    if (aria) return aria;
    return '';
  }

  function setupDashboardButtonTooltips(){
    const mount = getMount();
    if (!mount) return;

    const st = __cvMountState(mount);
    if (st.btnTipsBound) return;

    const tip = __ensureTinyTooltip();
    if (!tip) return;

    st.btnTipsBound = true;

    // Use transform for positioning (cheaper than left/top updates every pointer move).
    safe('btn_tips_style', () => {
      tip.style.left = '0px';
      tip.style.top = '0px';
      tip.style.willChange = 'transform';
    });

    let activeEl = null;
    let activeText = '';
    let tipW = 200;
    let tipH = 28;

    let lastX = 0;
    let lastY = 0;
    let rafId = 0;

    const hide = () => {
      activeEl = null;
      activeText = '';
      tip.classList.add('isHidden');
    };

    const measure = () => {
      // Measure only when text changes (layout read).
      safe('btn_tips_measure', () => {
        const r = tip.getBoundingClientRect();
        tipW = Math.max(40, Math.round(r.width || tip.offsetWidth || 200));
        tipH = Math.max(16, Math.round(r.height || tip.offsetHeight || 28));
      });
    };

    const placeNow = () => {
      rafId = 0;
      if (tip.classList.contains('isHidden')) return;

      const pad = ((__cvConfig.tooltip || {}).pad) || 12;
      let x = lastX + 6;
      let y = lastY + 14;

      const vw = window.innerWidth || 1024;
      const vh = window.innerHeight || 768;

      if (x + tipW + pad > vw) x = lastX - tipW - 10;
      if (y + tipH + pad > vh) y = lastY - tipH - 10;

      x = Math.max(pad, x);
      y = Math.max(pad, y);

      // Using transform avoids layout/paint storms from left/top changes.
      try { tip.style.transform = `translate3d(${x}px, ${y}px, 0)`; } catch (e) { /* ignore */ }
    };

    const schedulePlace = (x, y) => {
      lastX = x;
      lastY = y;
      if (!rafId) rafId = requestAnimationFrame(placeNow);
    };

    const isSidebarLink = (el) => !!(el && el.classList && el.classList.contains('side-link'));

    const onOver = (e) => {
      const t = e.target;
      const el = (t && t.closest) ? t.closest('button, [role="button"], a') : null;
      if (!el || !mount.contains(el)) return;

      // Sidebar has its own CSS tooltip system; don't double-tooltip.
      if (isSidebarLink(el)) return;

      const isDisabled = (el.disabled === true) || (el.classList && el.classList.contains('is-disabled'));
      const text = __btnTipText(el);

      if (isDisabled && !text) { hide(); return; }
      if (!text) { hide(); return; }

      if (activeEl === el && activeText === text){
        schedulePlace(e.clientX, e.clientY);
        return;
      }

      activeEl = el;
      activeText = text;

      tip.textContent = String(text);
      tip.classList.remove('isHidden');
      measure();
      schedulePlace(e.clientX, e.clientY);
    };

    const onMove = (e) => {
      if (!activeEl) return;
      schedulePlace(e.clientX, e.clientY);
    };

    const onOut = (e) => {
      if (!activeEl) return;
      const rel = e.relatedTarget;
      if (rel && activeEl.contains && activeEl.contains(rel)) return;
      const stillIn = (rel && rel.closest) ? rel.closest('button, [role="button"], a') : null;
      if (stillIn === activeEl) return;
      hide();
    };

    const onLeave = hide;

    st.btnTipsHandlers = { onOver, onMove, onOut, onLeave };

    // Activate tooltip on pointerover; update position on pointermove.
    mount.addEventListener('pointerover', onOver, { passive: true, capture: true });
    mount.addEventListener('pointermove', onMove, { passive: true });
    mount.addEventListener('pointerout', onOut, { passive: true, capture: true });
    mount.addEventListener('mouseleave', onLeave, { passive: true });
  }

  function __bindBarXAxisTooltip(canvas, chart, labels){
    if (!canvas || !chart || !Array.isArray(labels)) return;
    if (canvas.__cvTinyTipBound) return;
    canvas.__cvTinyTipBound = true;

    const tip = __ensureTinyTooltip();
    if (!tip) return;

    let lastText = '';
    let tipW = 160;
    let tipH = 24;
    let raf = 0;
    let pending = null;

    const measure = () => {
      // Measure only when text changes (avoids forced layout on every move).
      try {
        const r = tip.getBoundingClientRect();
        if (r && r.width) tipW = r.width;
        if (r && r.height) tipH = r.height;
      } catch (_e) {}
    };

    const hide = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      pending = null;
      tip.classList.add('isHidden');
    };

    const applyPos = (clientX, clientY) => {
      const pad = ((__cvConfig.tooltip || {}).pad) || 12;
      let x = clientX + 6;
      let y = clientY + 14;

      const vw = window.innerWidth || 1024;
      const vh = window.innerHeight || 768;

      if (x + tipW + pad > vw) x = clientX - tipW - 10;
      if (y + tipH + pad > vh) y = clientY - tipH - 10;

      x = Math.max(pad, x);
      y = Math.max(pad, y);

      tip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const showText = (text) => {
      const s = String(text || '');
      if (!s) { hide(); return; }
      if (s !== lastText){
        lastText = s;
        tip.textContent = s;
        tip.classList.remove('isHidden');
        measure();
      } else {
        tip.classList.remove('isHidden');
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!pending) return;
        const p = pending;
        pending = null;
        showText(p.text);
        applyPos(p.x, p.y);
      });
    };

    canvas.addEventListener('mousemove', (e) => {
      try {
        let pts = null;
        try {
          pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
        } catch (err1) {
          try { pts = chart.getElementsAtEventForMode({ native: e }, 'nearest', { intersect: false }, true); }
          catch (_err2) { pts = null; }
        }
        if (!pts || !pts.length){ hide(); return; }
        const idx = pts[0].index;
        const label = (idx != null && labels[idx] != null) ? labels[idx] : '';
        if (!label){ hide(); return; }

        pending = { text: label, x: e.clientX, y: e.clientY };
        schedule();
      } catch (_err) { hide(); }
    }, { passive: true });

    canvas.addEventListener('mouseleave', hide, { passive: true });
  }



  function renderDepthChart(depthScores){
    const canvas = cv$("depthChart");
    if (!canvas || !hasChartJs() || !__cvCanRenderCanvas(canvas)) return;
    destroyChart("depth");

    const rows = (depthScores || []).slice().sort((a,b)=>String(a.category||"").localeCompare(String(b.category||""), undefined, { sensitivity: "base" }));
    const labels = rows.map(x => x.category);
    const raw = rows.map(x => Number(x.depth) || 0);
    const maxV = raw.reduce((a,b)=>Math.max(a,b),0);
    const depthScale = (maxV > 0 && maxV <= 1.2) ? 100 : 1;
    const values = raw.map(v => Math.round(v * depthScale));

    const opts = baseChartOptions();
    opts.plugins.legend.display = false;
    opts.scales.y.ticks.callback = (v) => `${v}%`;
    opts.scales.y.title = { display: true, text: "Depth (%)", color: cssVar("--color-chart-axis") || "rgba(245,245,252,0.70)", font: { family: (cssVar("--font-ui")||undefined), weight: "800", size: 10 } };
    opts.scales.y.suggestedMin = 0;
    opts.scales.y.suggestedMax = 100;
    // Push y-axis labels away from the bars (~2.5 mm = 9px at 96 dpi)
    opts.layout = { padding: { left: 9, top: 4, right: 4, bottom: 0 } };
    
    // Responsive axis density: adapt tick count/rotation to available width
    const __wrap = canvas.closest('.canvasWrap') || canvas.parentElement;
    const __w = (__wrap && __wrap.getBoundingClientRect) ? __wrap.getBoundingClientRect().width : canvas.getBoundingClientRect().width;

    let __maxTicks = 10;
    let __rot = 45;
    let __pad = 8;

    if (__w < 720){
      __maxTicks = 6;
      __rot = 60;
      __pad = 10;
    } else if (__w < 980){
      __maxTicks = 8;
      __rot = 45;
      __pad = 8;
    } else if (__w < 1260){
      __maxTicks = 10;
      __rot = 30;
      __pad = 8;
    } else {
      __maxTicks = 12;
      __rot = 0;
      __pad = 6;
    }

    opts.scales.x.ticks.maxRotation = __rot;
    opts.scales.x.ticks.minRotation = __rot;
    opts.scales.x.ticks.padding = __pad;
    opts.scales.x.ticks.autoSkip = true;
    opts.scales.x.ticks.maxTicksLimit = __maxTicks;
    opts.scales.x.ticks.callback = (v, i) => {
      try {
        const s = String(labels[i] ?? v);
        return s.length > 14 ? (s.slice(0, 13) + '…') : s;
      } catch (e) { return v; }
    };

charts.depth = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Depth",
          data: values,
          backgroundColor: labels.map((_,i)=>PASTELS[i%PASTELS.length]),
          borderColor: labels.map((_,i)=>PASTEL_BORDERS[i%PASTEL_BORDERS.length]),
          borderWidth: 1,
          borderRadius: 10,
        }]
      },
      options: opts
    });

    // Tiny tooltip: show full x-axis category name on hover.
    __bindBarXAxisTooltip(canvas, charts.depth, labels);

    // Click on a bar: open panel_depth info pane (mirrors exercise-treemap click behaviour).
    if (!canvas.__cvDepthClickBound) {
      canvas.__cvDepthClickBound = true;
      canvas.addEventListener('click', (e) => {
        try {
          const chart = charts.depth;
          if (!chart) return;
          let pts = null;
          try { pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true); }
          catch (_) { return; }
          if (!pts || !pts.length) return;
          // Open the depth info pane entry
          if (typeof setInfoPane === 'function') {
            __cvState.__activeInfoKey = 'panel_depth';
            setInfoPane('panel_depth');
          }
        } catch (_) {}
      });
      canvas.style.cursor = 'pointer';
    }
  }

    // ---------- Time on platform (single chart with toggles) ----------
  let timeRange = "7d";     // "7d" | "30d" | "90d" | "ytd"
  let timeGran = "daily";   // "daily" | "weekly"

  function mulberry32(seed){
    let a = seed >>> 0;
    return function(){
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function formatShortDate(d){
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function startOfWeekMonday(d){
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mon=0..Sun=6
    x.setHours(0,0,0,0);
    x.setDate(x.getDate() - day);
    return x;
  }

  function buildDailyPlatformSeries(daysBack = 370){
    // Deterministic "mock-realistic" series: weekday bias + gentle trend + occasional rest days.
    const now = new Date();
    now.setHours(0,0,0,0);

    const rng = mulberry32(0xC0D1BEEF); // constant seed
    const series = [];

    for (let i = daysBack - 1; i >= 0; i--){
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const isWeekend = (d.getDay() === 0 || d.getDay() === 6);
      const base = isWeekend ? 18 : 34;

      const progress = (daysBack - 1 - i) / Math.max(1, daysBack - 1);
      const trend = 10 * progress; // +0..+10 over the year

      let minutes = Math.round(base + trend + (rng() - 0.5) * 18);

      // Rest day probability
      const restProb = isWeekend ? 0.20 : 0.12;
      if (rng() < restProb) minutes = 0;

      // Clamp to sensible
      minutes = Math.max(0, Math.min(120, minutes));
      series.push({ date: d, minutes });
    }
    return series;
  }

  let DAILY_PLATFORM_SERIES = []; // populated by applyDashboardData from payload

  function filterSeriesByRange(series, rangeKey){
    const now = new Date();
    now.setHours(0,0,0,0);

    let start;
    if (rangeKey === "7d"){
      start = new Date(now); start.setDate(now.getDate() - 6);
    } else if (rangeKey === "30d"){
      start = new Date(now); start.setDate(now.getDate() - 29);
    } else if (rangeKey === "90d"){
      start = new Date(now); start.setDate(now.getDate() - 89);
    } else { // ytd
      start = new Date(now.getFullYear(), 0, 1);
    }

    return series.filter(x => x.date >= start && x.date <= now);
  }

  function aggregateWeekly(series){
    // Aggregate to Monday-start weeks
    const buckets = new Map();
    for (const x of series){
      const wk = startOfWeekMonday(x.date).getTime();
      const cur = buckets.get(wk) || 0;
      buckets.set(wk, cur + x.minutes);
    }
    const keys = Array.from(buckets.keys()).sort((a,b)=>a-b);
    return keys.map(k => ({ date: new Date(k), minutes: buckets.get(k) || 0 }));
  }

  function setTimeToggleActive(){
    qAll('[data-time-range]').forEach(btn => {
      btn.classList.toggle('isActive', btn.getAttribute('data-time-range') === timeRange);
    });
    qAll('[data-time-gran]').forEach(btn => {
      btn.classList.toggle('isActive', btn.getAttribute('data-time-gran') === timeGran);
    });
  }

  function renderTimeKpis(){
    // KPIs derived from daily series (uses all available data)
    const now = new Date();
    now.setHours(0,0,0,0);

    const startWeek = startOfWeekMonday(now);
    const weekSeries = DAILY_PLATFORM_SERIES.filter(x => x.date >= startWeek && x.date <= now);
    const thisWeekMin = weekSeries.reduce((a,b)=>a+b.minutes,0);

    const start7 = new Date(now); start7.setDate(now.getDate() - 6);
    const last7 = DAILY_PLATFORM_SERIES.filter(x => x.date >= start7 && x.date <= now);
    const last7Total = last7.reduce((a,b)=>a+b.minutes,0);
    const last7Avg = last7Total / 7.0;
    const daysPracticed = last7.filter(x => x.minutes > 0).length;

    setText("timeThisWeek", `This week: ${formatDuration(thisWeekMin)}`);
    setText("timeLast7Avg", `Avg/day (7d): ${Math.round(last7Avg)}m`);
    setText("timeDays7", `Days practiced (7d): ${daysPracticed}/7`);
  }

  function renderTimePlatformChart(){
    const canvas = cv$("timePlatformChart");
    if (!canvas || !hasChartJs() || !__cvCanRenderCanvas(canvas)) return;

    destroyChart("timePlatform");
    setTimeToggleActive();
    renderTimeKpis();

    // Build series for current range
    let series = filterSeriesByRange(DAILY_PLATFORM_SERIES, timeRange);
    if (timeGran === "weekly"){
      series = aggregateWeekly(series);
    }

    const labels = series.map(x => formatShortDate(x.date));
    const minutes = series.map(x => x.minutes);

    const total = minutes.reduce((a,b)=>a+b,0);
    setText("timePlatformBadge", `Total shown: ${formatDuration(total)}`);

    const opts = baseChartOptions();
    opts.plugins.legend.display = false;
    // Y-axis units: keep ticks compact and put the unit in the axis title.
    opts.scales.y.ticks.callback = (v) => `${v}`;

    // Axis titles + ensure x labels are visible
    opts.scales.y.title = { display: true, text: "Minutes", color: cssVar("--color-chart-axis") || "rgba(245,245,252,0.70)", font: { family: (cssVar("--font-ui")||undefined), weight: "800", size: 10 } };
    opts.scales.x.display = true;
    opts.scales.x.ticks.display = true;
    // The x-axis title competes for vertical space and can cause label clipping in tight layouts.
    // Keep the chart compact by hiding it.
    opts.scales.x.title = { display: false };
    // Raise x-axis tick labels slightly (avoid bottom clipping in tight layouts).
    opts.scales.x.ticks.padding = 0;
    opts.layout = opts.layout || {};
    // Give the x-axis extra breathing room so labels aren't clipped.
    // (Increasing bottom padding raises the entire x-scale within the canvas.)
    opts.layout.padding = Object.assign({ bottom: 30 }, opts.layout.padding || {});


    
    // Responsive axis density: adapt tick count/rotation to container width
    const __wrap = canvas.closest('.canvasWrap') || canvas.parentElement;
    const __w = (__wrap && __wrap.getBoundingClientRect) ? __wrap.getBoundingClientRect().width : canvas.getBoundingClientRect().width;

    const dense = labels.length > 40;

    let __maxTicks = dense ? 12 : 24;
    let __rot = dense ? 0 : 0;
    let __bottomPad = 30;

    if (__w < 720){
      __maxTicks = dense ? 8 : 12;
      __rot = 45;
      __bottomPad = 38;
    } else if (__w < 980){
      __maxTicks = dense ? 10 : 16;
      __rot = dense ? 0 : 20;
      __bottomPad = 34;
    } else if (__w < 1260){
      __maxTicks = dense ? 12 : 20;
      __rot = dense ? 0 : 0;
      __bottomPad = 32;
    } else {
      __maxTicks = dense ? 14 : 24;
      __rot = dense ? 0 : 0;
      __bottomPad = 30;
    }

    opts.layout = opts.layout || {};
    opts.layout.padding = Object.assign({ bottom: __bottomPad }, opts.layout.padding || {});
    opts.scales.x.ticks.maxRotation = __rot;
    opts.scales.x.ticks.minRotation = __rot;
    opts.scales.x.ticks.autoSkip = true;
    opts.scales.x.ticks.maxTicksLimit = __maxTicks;
    opts.scales.x.ticks.includeBounds = true;

charts.timePlatform = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Minutes",
          data: minutes,
          borderColor: cssVar("--color-chart-series-1") || "rgba(246,213,138,0.85)",
          backgroundColor: cssVar("--color-chart-series-1-fill") || "rgba(246,213,138,0.12)",
          pointRadius: dense ? 0 : 2,
          tension: 0.35,
          fill: true,
        }]
      },
      options: opts
    });

    // Tiny tooltip: show date label on hover (same pattern as depth/exercise/MCQ charts)
    __bindBarXAxisTooltip(canvas, charts.timePlatform, labels);
  }

  function setupTimeControls(){
    const mount = getMount();
    if (!mount) return;

    const st = __cvMountState(mount);
    if (st.timeControlsBound) return;
    st.timeControlsBound = true;

    const onClick = (e) => {
      const t = e.target;

      const rangeBtn = (t && t.closest) ? t.closest("[data-time-range]") : null;
      if (rangeBtn && mount.contains(rangeBtn)){
        e.preventDefault();
        timeRange = rangeBtn.getAttribute("data-time-range") || "30d";
        renderTimePlatformChart();
        safe('refresh_info_time', () => { if (typeof refreshInfoIfActive === 'function') refreshInfoIfActive('panel_time'); });
        return;
      }

      const granBtn = (t && t.closest) ? t.closest("[data-time-gran]") : null;
      if (granBtn && mount.contains(granBtn)){
        e.preventDefault();
        timeGran = granBtn.getAttribute("data-time-gran") || "daily";
        renderTimePlatformChart();
        safe('refresh_info_time', () => { if (typeof refreshInfoIfActive === 'function') refreshInfoIfActive('panel_time'); });
        return;
      }
    };

    st.timeControlsOnClick = onClick;
    mount.addEventListener("click", onClick, { passive: false });
  }

  // ---------- Exercise allocation (ranked bars) state ----------
  let allocMode = "minutes"; // "minutes" | "share"
  let selectedAllocCategory = "__all__";


function renderExerciseDonut(){
    // (Deprecated) kept for compatibility; treemap is used instead.
    renderExerciseTreemap();
  }

  function renderExerciseTreemap(){
    // NOTE: This function name is retained for compatibility with renderAll(), but it renders
    // a ranked horizontal bar chart (allocation) instead of a treemap.
    const canvas = cv$("exerciseAllocChart");
    if (!canvas || !hasChartJs() || !__cvCanRenderCanvas(canvas)) return;

    destroyChart("exerciseDonut");

    // Respect the coding track selector: use track-specific allocation when available.
    const trackAlloc = (__cvState.__allocationByTrack && __cvState.__selectedCodingTrack && __cvState.__selectedCodingTrack !== 'combined')
      ? (__cvState.__allocationByTrack[__cvState.__selectedCodingTrack] || __cvState.__allocationByTrack.combined)
      : (__cvState.__allocationByTrack && __cvState.__allocationByTrack.combined);
    if (trackAlloc && trackAlloc.length) {
      exerciseTimeByCategory = trackAlloc;
    }

    const total = exerciseTimeByCategory.reduce((a,b)=>a+b.minutes,0);
    setText("exerciseTotalBadge", `Total ${formatDuration(total)}`);
    // Update hint for current mode
    // Allocation footer hint has been removed (tooltips + click-to-focus are sufficient).
    const h = cv$("allocFooterHint");
    if (h) h.textContent = "";

    // Sync toggle active state
    qAll('[data-alloc-mode]').forEach(b => {
      b.classList.toggle('isActive', b.getAttribute('data-alloc-mode') === allocMode);
    });

    // Sort alphabetically by category (per UX request)
    const sorted = exerciseTimeByCategory
      .slice()
      .sort((a,b) => String(a.category||"").localeCompare(String(b.category||""), undefined, { sensitivity: "base" }))
      .filter(x => x.minutes > 0);

    const labels = sorted.map(x => x.category);
    const minutes = sorted.map(x => x.minutes);
    const shares = sorted.map(x => total > 0 ? (x.minutes / total) * 100 : 0);

    const values = (allocMode === "share") ? shares : minutes;

    // Premium bar colors: base palette with selection highlight
    const colors = labels.map((c, i) => {
      const base = SLICE_COLORS[i % SLICE_COLORS.length] || "rgba(255,255,255,0.12)";
      const isSel = (selectedAllocCategory === c);
      if (selectedAllocCategory !== "__all__" && !isSel){
        // dim non-selected
        return base.replace("0.85", "0.22").replace("0.75", "0.22").replace("0.95","0.22");
      }
      return base;
    });

    const borderColors = labels.map((c) => {
      const isSel = (selectedAllocCategory === c);
      return isSel ? (cssVar("--color-chart-selected-bar") || "rgba(246,213,138,0.55)") : (cssVar("--color-chart-unselected-bar") || "rgba(255,255,255,0.08)");
    });

    const opts = baseChartOptions();
    // Interaction + layout: improve clickability and avoid bottom clipping
    // Make hover tooltips easier to trigger (bars can be thin when many categories)
    opts.interaction = { mode: "nearest", axis: "y", intersect: false };
    opts.layout = { padding: { top: 4, right: 8, bottom: 10, left: 0 } };
    opts.onHover = (evt, elements) => {
      const c = evt?.native?.target;
      if (c && c.style) c.style.cursor = (elements && elements.length) ? "pointer" : "default";
    };

    opts.indexAxis = "y";
    opts.plugins.legend.display = false;

    // Improve tooltip to show both minutes and share, plus solved
    opts.plugins.tooltip.enabled = true;
    opts.plugins.tooltip.displayColors = false;
    opts.plugins.tooltip.callbacks = {
      title: (items) => {
        try {
          const idx = items?.[0]?.dataIndex ?? 0;
          const item = sorted[idx];
          return item?.category ? String(item.category) : "";
        } catch (e) { return ""; }
      },
      label: (ctx) => {
        const idx = ctx.dataIndex;
        const item = sorted[idx];
        const m = item.minutes;
        const share = total > 0 ? Math.round((m/total)*100) : 0;
        const solved = item.solved ?? 0;
        return [`Time: ${formatDuration(m)} (${share}%)`, `Solved: ${solved}`];
      }
    };

    // Axes formatting
    opts.scales.x.ticks.callback = (v) => {
      if (allocMode === "share") return `${Number(v).toFixed(0)}%`;
      return `${v}m`;
    };
    opts.scales.x.ticks.padding = 2;
    opts.scales.y.ticks.padding = 2;
    
    // On narrower layouts, truncate long category labels on the y-axis to prevent spill.
    const __wrap2 = canvas.closest('.canvasWrap') || canvas.parentElement;
    const __w2 = (__wrap2 && __wrap2.getBoundingClientRect) ? __wrap2.getBoundingClientRect().width : canvas.getBoundingClientRect().width;
    const __lim = (__w2 < 720) ? 16 : (__w2 < 980) ? 20 : 28;
    opts.scales.y.ticks.callback = (v, i) => {
      try {
        const s = String(labels[i] ?? v);
        return s.length > __lim ? (s.slice(0, __lim - 1) + '…') : s;
      } catch (e) { return v; }
    };
opts.scales.y.ticks.font = Object.assign({}, opts.scales.y.ticks.font || {}, { size: 9 });
    opts.scales.x.ticks.font = Object.assign({}, opts.scales.x.ticks.font || {}, { size: 9 });
    if (allocMode === "share") {
      const maxShare = Math.max.apply(null, shares.concat([0]));
      const axisMax = Math.max(10, Math.ceil(maxShare / 10) * 10);
      opts.scales.x.min = 0;
      opts.scales.x.max = axisMax;
    } else {
      delete opts.scales.x.min;
      delete opts.scales.x.max;
    }

    opts.scales.y.ticks.font = Object.assign({}, opts.scales.y.ticks.font || {}, { size: 10 });
    
    if (labels.length > 14){
      opts.scales.y.ticks.font = Object.assign({}, opts.scales.y.ticks.font || {}, { size: 9 });
    }
opts.scales.x.ticks.font = Object.assign({}, opts.scales.x.ticks.font || {}, { size: 10 });

    // Subtle grid for premium feel
    opts.scales.x.grid.color = cssVar("--color-chart-grid") || "rgba(255,255,255,0.05)";
    opts.scales.y.grid.display = false;

    // Click-to-focus: use the elements array from the callback (correct Chart.js v3 API)
    opts.onClick = (evt, elements) => {
      if (!elements || !elements.length){
        selectedAllocCategory = "__all__";
        renderExerciseTreemap();
        try { refreshInfoIfActive('panel_exercise'); } catch (e) { ciErr('ignored error', e); }
        return;
      }
      const i = elements[0].index;
      const cat = labels[i];
      selectedAllocCategory = (selectedAllocCategory === cat) ? "__all__" : cat;
      renderExerciseTreemap();
      try { refreshInfoIfActive('panel_exercise'); } catch (e) { ciErr('ignored error', e); }
    };

    charts.exerciseDonut = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: (allocMode === "share") ? "Share" : "Minutes",
          data: values.map(v => (allocMode === "share" ? Math.round(v*10)/10 : Math.round(v))),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderSkipped: false,
          barThickness: (labels.length > 16 ? 6 : labels.length > 12 ? 8 : labels.length > 9 ? 10 : 12),
          maxBarThickness: (labels.length > 16 ? 10 : labels.length > 12 ? 12 : 14),
          borderRadius: 0
        }]
      },
      options: opts
    });

    // Tiny tooltip: show the category label (axis label) on hover for this bar chart too.
    __bindBarXAxisTooltip(canvas, charts.exerciseDonut, labels);

    updateAllocDetail(sorted, total);
  }

  function updateAllocDetail(sorted, total){
    const footer = cv$("allocFooter");
    const detail = cv$("categoryDetail");
    const canvas = cv$("exerciseAllocChart");
    const allocPlot = canvas ? canvas.closest('.allocPlot') : null;
    if (!footer || !detail) return;

    if (selectedAllocCategory === "__all__"){
      if (allocPlot) allocPlot.style.display = "";
      footer.style.display = "none";
      detail.classList.add("isHidden");
      return;
    }

    const item = sorted.find(x => x.category === selectedAllocCategory);
    if (!item){
      if (allocPlot) allocPlot.style.display = "";
      footer.style.display = "none";
      detail.classList.add("isHidden");
      return;
    }

    // Hide bar chart, show detail card
    if (allocPlot) allocPlot.style.display = "none";
    footer.style.display = "flex";
    footer.style.flexDirection = "column";
    footer.style.flex = "1 1 auto";
    detail.classList.remove("isHidden");

    // Show category name header
    let catLabel = footer.querySelector('.allocDetailCatName');
    if (!catLabel){
      catLabel = document.createElement('div');
      catLabel.className = 'allocDetailCatName';
      catLabel.style.cssText = 'font-weight:800;font-size:13px;color:rgba(246,213,138,0.95);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(246,213,138,0.18)';
      footer.insertBefore(catLabel, detail);
    }
    catLabel.textContent = selectedAllocCategory;

    const m = item.minutes;
    const share = total > 0 ? Math.round((m/total)*100) : 0;
    setText("categoryDetailTime", formatDuration(m));
    setText("categoryDetailShare", `${share}%`);
    setText("categoryDetailSolved", String(item.solved ?? 0));
  }



  function setupExerciseTreemap(){
    const mount = getMount();
    if (!mount) return;

    const st = __cvMountState(mount);
    if (st.allocControlsBound) return;
    st.allocControlsBound = true;

    const onClick = (e) => {
      const t = e.target;

      const modeBtn = (t && t.closest) ? t.closest("[data-alloc-mode]") : null;
      if (modeBtn && mount.contains(modeBtn)){
        e.preventDefault();
        allocMode = modeBtn.getAttribute("data-alloc-mode") || "minutes";
        // Update active states (scope to mount)
        try {
          Array.prototype.slice.call(mount.querySelectorAll("[data-alloc-mode]")).forEach(b => {
            b.classList.toggle("isActive", b.getAttribute("data-alloc-mode") === allocMode);
          });
        } catch (e2) { ciErr('alloc_mode_active', e2); }

        renderExerciseTreemap();
        safe('refresh_info_alloc', () => { if (typeof refreshInfoIfActive === 'function') refreshInfoIfActive('panel_exercise'); });
        return;
      }

      const resetBtn = (t && t.closest) ? t.closest("#allocResetBtn") : null;
      if (resetBtn && mount.contains(resetBtn)){
        e.preventDefault();
        selectedAllocCategory = "__all__";
        // Restore chart before re-render
        const cvs = mount.querySelector('#exerciseAllocChart');
        const plot = cvs ? cvs.closest('.allocPlot') : null;
        if (plot) plot.style.display = "";
        renderExerciseTreemap();
        safe('refresh_info_alloc', () => { if (typeof refreshInfoIfActive === 'function') refreshInfoIfActive('panel_exercise'); });
      }
    };

    st.allocControlsOnClick = onClick;
    mount.addEventListener("click", onClick, { passive: false });
  }





  function renderMcqOverallBar(){
    const fill = cv$("mcqOverallFill");
    const pctEl = cv$("mcqOverallPct");
    const meta = cv$("mcqOverallMeta");
    if (!fill || !pctEl) return;

    const total = mcqOverallTotals.total || 1;
    const correct = mcqOverallTotals.correct || 0;
    const p = Math.round((correct / total) * 100);

    fill.style.width = `${Math.max(0, Math.min(100, p))}%`;

    // Put full text inside the bar; percentage at the end in parentheses
    pctEl.textContent = `${correct} questions answered correctly out of a total of ${total} (${p}%)`;

    // Remove resilience event listeners (avoid leaks on unmount)
    try {
      if (st && st.resilienceHandlers){
        const h = st.resilienceHandlers;
        if (h.onVisibility) document.removeEventListener('visibilitychange', h.onVisibility, true);
        if (h.onFocus) window.removeEventListener('focus', h.onFocus, true);
        if (h.onPageShow) window.removeEventListener('pageshow', h.onPageShow, true);
        if (h.onTransitionEnd) document.removeEventListener('transitionend', h.onTransitionEnd, true);
        st.resilienceHandlers = null;
      }
    } catch (e) { ciErr('destroy_resilience_handlers', e); }

    // Release global handlers
    try {
      const g = window.__cvGlobals;
      if (g && typeof g.releaseHelpEsc === 'function') g.releaseHelpEsc();
    } catch (e) { ciErr('destroy_releaseHelpEsc', e); }

    // Safety: remove any lingering tour key handlers
    try {
      const g = window.__cvGlobals;
      if (g && g.tourKeyHandlers && g.tourKeyHandlers.size){
        for (const fn of Array.from(g.tourKeyHandlers)){
          try { document.removeEventListener('keydown', fn, true); } catch (_e) {}
        }
        try { g.tourKeyHandlers.clear(); } catch (_e) {}
      }
    } catch (e) { ciErr('destroy_tourKeyHandlers', e); }

    if (meta) meta.textContent = "";
  }

function renderMcqDifficultyChart(canvasId, difficulty, colorIdx){
    const canvas = cv$(canvasId);
    if (!canvas || !hasChartJs() || !__cvCanRenderCanvas(canvas)) return null;

    const rows = (mcqMatrix || []).slice().sort((a,b)=>String(a.category||"").localeCompare(String(b.category||""), undefined, { sensitivity: "base" }));
    const labels = rows.map(r => r.category);
    const values = rows.map(r => r[difficulty].avgScore);

    const opts = baseChartOptions();
    opts.plugins.legend.display = false;
    opts.scales.y.ticks.callback = (v) => `${v}%`;
    opts.scales.y.title = { display: true, text: "Avg score (%)", color: cssVar("--color-chart-axis") || "rgba(245,245,252,0.70)", font: { family: (cssVar("--font-ui")||undefined), weight: "800", size: 10 } };
    opts.scales.y.suggestedMin = 0;
    opts.scales.y.suggestedMax = 100;
    opts.scales.y.suggestedMax = 100;
    opts.scales.x.ticks.maxRotation = 45;
    opts.scales.x.ticks.minRotation = 45;
    // Bring x-axis tick labels slightly further away from the axis for readability.
    // Lower x-axis labels slightly (~1mm) so they sit a touch further from the axis.
    opts.scales.x.ticks.padding = 12;
    opts.scales.x.ticks.autoSkip = true;
    opts.scales.x.ticks.maxTicksLimit = 8;
    opts.scales.x.ticks.callback = (v, i) => {
      try {
        const s = String(labels[i] ?? v);
        return s.length > 12 ? (s.slice(0, 11) + '…') : s;
      } catch (e) { return v; }
    };

    const ch = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: difficulty,
          data: values,
          backgroundColor: labels.map(()=>PASTELS[colorIdx%PASTELS.length]),
          borderColor: labels.map(()=>PASTEL_BORDERS[colorIdx%PASTEL_BORDERS.length]),
          borderWidth: 1,
          borderRadius: 10,
        }]
      },
      options: opts
    });

    // Tiny tooltip: show full x-axis category name on hover.
    __bindBarXAxisTooltip(canvas, ch, labels);
    return ch;
  }

  function renderMcqCharts(){
    destroyChart("mcqEasy");
    destroyChart("mcqMedium");
    destroyChart("mcqHard");
    charts.mcqEasy = renderMcqDifficultyChart("mcqEasyChart", "Easy", 1);
    charts.mcqMedium = renderMcqDifficultyChart("mcqMediumChart", "Medium", 0);
    charts.mcqHard = renderMcqDifficultyChart("mcqHardChart", "Hard", 3);
  }


  function __cvFormatDdMmmYYYY(dateObj){
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dateObj);
    } catch (e) {
      const d = String(dateObj.getDate()).padStart(2, "0");
      const mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const m = mons[dateObj.getMonth()] || "";
      const y = dateObj.getFullYear();
      return `${d} ${m} ${y}`;
    }
  }

  function __cvParseDateMaybe(raw){
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function renderAll(){
    // Refresh palette arrays so theme-switched colours take effect immediately
    PASTELS = getPastels();
    PASTEL_BORDERS = getPastelBorders();
    const anchor = cv$("anchorDate");
    const anchorDate = __cvParseDateMaybe(__cvState.__anchorDateValue) || new Date();
    const anchorText = __cvFormatDdMmmYYYY(anchorDate);
    if (anchor) anchor.textContent = anchorText ? `Anchor date: ${anchorText}` : "";

    // If the UI is in summary (info-only) mode, skip heavy chart rendering.
    try {
      if (typeof __cvGetEffectiveUiState === 'function') {
        const ui = __cvGetEffectiveUiState();
        if (ui && ui.mode === 'info_only') {
          try { if (typeof refreshActiveInfoPane === 'function') refreshActiveInfoPane(); } catch (_) {}
          return;
        }
      }
    } catch (_) { /* ignore */ }

    const __chartOk = hasChartJs();
    if (!__chartOk){
      try {
        const __allowCdn = String(document.documentElement.getAttribute('data-cv-allow-cdn') || '').toLowerCase() === 'true';
        if (!__allowCdn && typeof __cvAddRuntimeAlert === 'function'){
          __cvAddRuntimeAlert('missing_chartjs', 'Chart.js is missing and CDN loading is disabled. Charts are unavailable until vendor assets are added.', 'warn');
        }
      } catch (_) {}
    }

    safeInvoke("setupInfoButtons", () => setupInfoButtons());
    safeInvoke("setupDashboardButtonTooltips", () => setupDashboardButtonTooltips());

    safeInvoke("setupRefreshDashboardButton", () => setupRefreshDashboardButton());
    safeInvoke("renderSnapshotNumbers", () => renderSnapshotNumbers());
    safeInvoke("setupCodingTrackSelector", () => setupCodingTrackSelector());

    const top = (() => {
      try { return renderTopScores(); }
      catch (err) { console.error("[Codivium] renderTopScores failed", err); return { depthScores: [] }; }
    })();
    if (__chartOk) safeInvoke("renderDepthChart", () => renderDepthChart(top.depthScores || []));

    safeInvoke("setupExerciseTreemap", () => setupExerciseTreemap());
    safeInvoke("renderConvergenceHeatmap", () => renderConvergenceHeatmap());
    safeInvoke("setupTimeControls", () => setupTimeControls());
    if (__chartOk) safeInvoke("renderTimePlatformChart", () => renderTimePlatformChart());
    safeInvoke("renderExerciseTreemap", () => renderExerciseTreemap());
    safeInvoke("renderMcqOverallBar", () => renderMcqOverallBar());
    if (__chartOk) safeInvoke("renderMcqCharts", () => renderMcqCharts());
    safeInvoke("updatePanelCtas", () => updatePanelCtas());
  }

  // -----------------------------
  // Chart resilience: refresh charts when the page/tab visibility changes,
  // or when containers resize (e.g., browser tab switch, sidebar changes).
  // -----------------------------

  // Theme change: re-render all charts so axis/grid/label colours update immediately.
  document.addEventListener('cv:theme-change', function() {
    safeInvoke('renderAll-theme', function() { renderAll(); });
  });

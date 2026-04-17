// src/insights/utils/metrics.js
// Pure functions that derive all KPI values from a raw dashboard payload.
// Extracted from dashboard.00d.data.js + dashboard.06.mcq-and-render.js.
// No DOM access — inputs are plain objects, output is a plain metrics object.

// ── Helpers ──────────────────────────────────────────────────────────────────
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function num(v) { return (v == null) ? null : Number(v); }
function pick(obj, ...keys) {
  for (const k of keys) if (obj[k] !== undefined) return num(obj[k]);
  return null;
}
function parseIsoDate(s) {
  if (!s) return null;
  try {
    const d = new Date(String(s).trim());
    return isNaN(d.getTime()) ? null : d;
  } catch (_) { return null; }
}
export function pct(v) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return Math.round(n) + '%';
}
export function formatDuration(minutes) {
  if (!isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return Math.round(minutes) + 'm';
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Extraction helpers (mirrors __extractAlloc / __extractDepth) ──────────────
function extractAlloc(src) {
  if (!src) return null;
  const a = src.allocation || src.Allocation || src.allocationByCategory || src.AllocationByCategory;
  if (!Array.isArray(a)) return null;
  return a.map(x => ({
    category: String(x.category ?? x.Category ?? ''),
    minutes:  Number(x.minutes  ?? x.Minutes)  || 0,
    solved:   Number(x.solved   ?? x.Solved)   || 0,
  })).filter(x => x.category);
}
function extractDepth(src) {
  if (!src) return null;
  const c = (src.depth && typeof src.depth === 'object') ? src.depth : src;
  const items = c.depthByCategory || c.DepthByCategory;
  if (!Array.isArray(items)) return null;
  return items.map(x => ({
    category: String(x.category ?? x.Category ?? ''),
    depth:    Number(x.depth    ?? x.Depth    ?? 0),
  })).filter(x => x.category);
}

// ── Score computation (mirrors computeBreadthScore / computeCodiviumScore) ───
function extractHeatmap(src) {
  if (!src) return null;
  // Support both nested { convergenceHeatmap: {...} } and flat heatmap object
  const h = src.convergenceHeatmap || src.ConvergenceHeatmap ||
            src.heatmap          || src.Heatmap            || null;
  if (!h || !Array.isArray(h.categories) || !Array.isArray(h.values)) return null;
  return {
    categories: h.categories.map(String),
    buckets:    Array.isArray(h.buckets) ? h.buckets.map(String) : ['A1','A2','A3','A4','A5'],
    values:     h.values,
    counts:     Array.isArray(h.counts) ? h.counts : null,
  };
}

function computeBreadth(alloc) {
  if (!alloc || !alloc.length) return 0;
  const active = alloc.filter(x => x.minutes >= 30).length;
  return (active / alloc.length) * 100;
}
function computeDepthAvg(depthScores) {
  if (!depthScores || !depthScores.length) return 0;
  const raw = depthScores.reduce((a, b) => a + (b.depth || 0), 0) / depthScores.length;
  const maxRaw = depthScores.reduce((m, x) => Math.max(m, Number(x.depth) || 0), 0);
  const scale  = (maxRaw > 0 && maxRaw <= 1.2) ? 100 : 1;
  return raw * scale;
}
function computeCodivium(breadth, depth) {
  const B = Number(breadth), D = Number(depth);
  if (!(B > 0) || !(D > 0)) return 0;
  return (2 * B * D) / (B + D);
}

// ── MCQ computation ──────────────────────────────────────────────────────────
function computeWeightedMcq(mcqMatrix) {
  if (!mcqMatrix || !mcqMatrix.length) return 0;
  const w = { Easy: 1.0, Medium: 1.2, Hard: 1.5 };
  let num = 0, den = 0;
  for (const row of mcqMatrix) {
    for (const d of ['Easy', 'Medium', 'Hard']) {
      num += (row[d]?.avgScore || 0) * w[d];
      den += w[d];
    }
  }
  return den > 0 ? (num / den) : 0;
}

// ── Main export ──────────────────────────────────────────────────────────────
/**
 * Derive all dashboard KPI values from a raw payload.
 * Returns a plain object with all values panels need.
 * @param {object} payload - raw API payload
 * @param {string} selectedTrack - 'combined' | 'micro' | 'interview'
 * @returns {object} metrics
 */
export function computeDashboardMetrics(payload, selectedTrack = 'combined') {
  if (!payload || typeof payload !== 'object') return {};

  // ── Payload normalisation (v1 and v2) ─────────────────────────────────────
  const isV2 = !!(payload.micro || payload.interview || payload.mcq ||
                  payload.Micro || payload.Interview || payload.Mcq);

  const overallSrc  = isV2 ? (payload.overall || payload.Overall || payload.summary || payload.Summary || {}) : payload;
  const codingSrc   = isV2 ? (payload.combinedCoding || payload.CombinedCoding || payload.coding || payload.Coding || payload.combined || payload.Combined || {}) : payload;
  const microSrc    = isV2 ? (payload.micro || payload.Micro || {}) : null;
  const interviewSrc = isV2 ? (payload.interview || payload.Interview || {}) : null;
  const mcqSrc      = isV2 ? (payload.mcq || payload.Mcq || {}) : payload;

  // ── Allocation ────────────────────────────────────────────────────────────
  const allocRaw = codingSrc.allocation || codingSrc.Allocation ||
                   codingSrc.allocationByCategory || codingSrc.AllocationByCategory || [];
  const alloc = Array.isArray(allocRaw)
    ? allocRaw.map(x => ({
        category: String(x.category ?? x.Category ?? ''),
        minutes:  Number(x.minutes  ?? x.Minutes)  || 0,
        solved:   Number(x.solved   ?? x.Solved)   || 0,
      })).filter(x => x.category)
    : [];

  const allocByTrack = {
    combined:  extractAlloc(codingSrc)  || alloc,
    micro:     extractAlloc(microSrc),
    interview: extractAlloc(interviewSrc),
  };
  const activeAlloc = allocByTrack[selectedTrack] || alloc;

  // ── Depth ─────────────────────────────────────────────────────────────────
  const depthByTrack = {
    combined:  extractDepth(codingSrc),
    micro:     extractDepth(microSrc),
    interview: extractDepth(interviewSrc),
  };
  const activeDepth = depthByTrack[selectedTrack] || depthByTrack.combined || [];

  // ── MCQ matrix ────────────────────────────────────────────────────────────
  let mcqMatrix = [];
  let mcqOverallTotals = { correct: 0, total: 0 };
  const mcqObj = mcqSrc?.mcq || mcqSrc?.Mcq || (
    (mcqSrc?.byDifficulty || mcqSrc?.overall || mcqSrc?.basic) ? mcqSrc : null
  );
  if (mcqObj) {
    const byDiff = mcqObj.byDifficulty || mcqObj.ByDifficulty || null;
    const basicMap = byDiff ? (byDiff.basic || byDiff.Basic || {}) : (mcqObj.basic || mcqObj.Basic || {});
    const interMap = byDiff ? (byDiff.intermediate || byDiff.Intermediate || {}) : (mcqObj.intermediate || mcqObj.Intermediate || {});
    const advMap   = byDiff ? (byDiff.advanced || byDiff.Advanced || {}) : (mcqObj.advanced || mcqObj.Advanced || {});

    const cats = (alloc.length ? alloc.map(x => x.category) :
      [...new Set([...Object.keys(basicMap||{}), ...Object.keys(interMap||{}), ...Object.keys(advMap||{})])]);

    const mk = (score) => ({ avgScore: Number(score) || 0, attemptCount: 0, questionCount: 0 });
    mcqMatrix = cats.map(category => ({
      category,
      Easy:   mk(basicMap[category]),
      Medium: mk(interMap[category]),
      Hard:   mk(advMap[category]),
    }));

    const overall = mcqObj.overallCorrect || mcqObj.OverallCorrect || mcqObj.overall || mcqObj.Overall || null;
    if (overall) {
      mcqOverallTotals = {
        correct: Number(overall.correct ?? overall.Correct) || 0,
        total:   Number(overall.total   ?? overall.Total)   || 0,
      };
    }
  }

  // ── Time series ───────────────────────────────────────────────────────────
  const topObj = overallSrc.timeOnPlatform || overallSrc.TimeOnPlatform || null;
  const dailyRaw = topObj?.daily || topObj?.Daily || overallSrc.dailyPlatform || overallSrc.DailyPlatform || [];
  let dailySeries = [];
  if (Array.isArray(dailyRaw) && dailyRaw.length) {
    const mapped = dailyRaw.map(p => ({
      date: parseIsoDate(p.date ?? p.Date),
      minutes: Number(p.minutes ?? p.Minutes) || 0,
    })).filter(x => x.date);

    const map = new Map();
    mapped.forEach(x => {
      const key = `${x.date.getFullYear()}-${String(x.date.getMonth()+1).padStart(2,'0')}-${String(x.date.getDate()).padStart(2,'0')}`;
      map.set(key, (map.get(key) || 0) + x.minutes);
    });
    const now = new Date(); now.setHours(0,0,0,0);
    const start = new Date(now); start.setDate(now.getDate() - 369);
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dailySeries.push({ date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), minutes: map.get(key) || 0 });
    }
  }

  // ── Server-provided metric overrides ─────────────────────────────────────
  const mOver = (overallSrc.metrics && typeof overallSrc.metrics === 'object') ? overallSrc.metrics : {};
  const cod      = pick(mOver, 'codiviumScore',     'codivium_score');
  const bAll     = pick(mOver, 'breadthOverall',    'overall_breadth',    'overallBreadth');
  const bInt     = pick(mOver, 'breadthInterview',  'interview_breadth',  'interviewBreadth');
  const bMic     = pick(mOver, 'breadthMicro',      'micro_challenge_breadth', 'microBreadth');
  const bMcq     = pick(mOver, 'breadthMcq',        'mcq_breadth',        'mcqBreadth');
  const ft       = pick(mOver, 'firstTryPassRate',  'first_try_pass',     'firstTryPass');
  const avgA     = pick(mOver, 'avgAttemptsToAC',   'avg_attempts',       'avgAttempts');
  const medT     = pick(mOver, 'medianTimeToACMinutes', 'median_time',    'medianTime');
  const wMcq     = pick(mOver, 'weightedMcqScore',  'weighted_mcq_score', 'weightedMcq');
  const ptsAll   = pick(mOver, 'codiviumPointsAll', 'codivium_points_all','pointsAll');
  const pts30    = pick(mOver, 'codiviumPoints30',  'codivium_points_30', 'points30');
  const effHr    = pick(mOver, 'efficiencyPtsPerHr','efficiency_pts_per_hr','efficiencyPtsHr');
  const dAll     = pick(mOver, 'depthOverall',      'depth_overall',      'depthOverallScore');
  const dMic     = pick(mOver, 'depthMicro',        'depth_micro',        'microDepth');
  const dInt     = pick(mOver, 'depthInterview',    'depth_interview',    'interviewDepth');

  // ── Derived scores ────────────────────────────────────────────────────────
  const breadth    = bAll != null ? bAll : computeBreadth(activeAlloc);
  const depthScores = activeDepth.length ? activeDepth.slice().sort((a,b) => (b.depth||0)-(a.depth||0)) : [];
  const depthAvg   = dAll != null ? dAll : computeDepthAvg(depthScores);
  const weightedMcq = wMcq != null ? wMcq : computeWeightedMcq(mcqMatrix);
  const codivium   = cod != null ? cod : computeCodivium(breadth, depthAvg);

  const microBreadth    = bMic != null ? bMic : clamp(breadth - 4, 0, 100);
  const interviewBreadth = bInt != null ? bInt : clamp(breadth - 8, 0, 100);
  const mcqBreadth      = bMcq != null ? bMcq : clamp(breadth + 6, 0, 100);

  // ── Time KPIs ─────────────────────────────────────────────────────────────
  const now7 = new Date(); now7.setHours(23,59,59,999);
  const start7 = new Date(now7); start7.setDate(now7.getDate() - 6); start7.setHours(0,0,0,0);
  const last7 = dailySeries.filter(x => x.date >= start7);
  const last7Total = last7.reduce((s, x) => s + x.minutes, 0);
  const last7Avg   = last7.length ? last7Total / 7 : 0;
  const totalMins  = dailySeries.reduce((s, x) => s + x.minutes, 0);
  const activeDays7 = last7.filter(x => x.minutes > 0).length;

  // ── MCQ overall bar ───────────────────────────────────────────────────────
  const mcqOverallPct  = mcqOverallTotals.total > 0
    ? Math.round((mcqOverallTotals.correct / mcqOverallTotals.total) * 100) + '%'
    : '—';
  const mcqOverallMeta = mcqOverallTotals.total > 0
    ? `${mcqOverallTotals.correct} / ${mcqOverallTotals.total}`
    : '';

  // ── Final metrics object ──────────────────────────────────────────────────
  return {
    // Scores
    codiviumScore:         Math.round(codivium),
    breadthScore:          Math.round(breadth),
    depthOverallScore:     Math.round(depthAvg),
    microBreadthScore:     Math.round(microBreadth),
    microDepthScore:       dMic != null ? Math.round(dMic) : null,
    interviewBreadthScore: Math.round(interviewBreadth),
    interviewDepthScore:   dInt != null ? Math.round(dInt) : null,
    mcqBreadthScore:       Math.round(mcqBreadth),
    weightedMcqScore:      Math.round(weightedMcq),
    // Points and efficiency
    codiviumPointsAll:     ptsAll != null ? Math.round(ptsAll) : null,
    codiviumPoints30:      pts30  != null ? Math.round(pts30)  : null,
    efficiencyPtsPerHr:    effHr  != null ? (Math.round(effHr * 10) / 10).toFixed(1) : null,
    // Submission metrics
    firstTryPassRate:      ft   != null ? pct(ft)   : '—',
    avgAttemptsToAC:       avgA != null ? Number(avgA).toFixed(1) : '—',
    medianTimeToAC:        medT != null ? formatDuration(medT) : '—',
    exerciseTotalBadge:    alloc.reduce((s, x) => s + x.solved, 0) || null,
    // Time KPIs
    timeThisWeek:      formatDuration(last7Total),
    timeDays7:         String(activeDays7),
    timeLast7Avg:      formatDuration(last7Avg),
    timePlatformBadge: formatDuration(totalMins),
    // MCQ
    mcqOverallPct,
    mcqOverallMeta,
    // Data series for charts
    depthScores,
    mcqMatrix,
    dailySeries,
    alloc: activeAlloc,
    allocByTrack,
    depthByTrack,
    // Heatmap
    // Heatmap — extract from the active track source
    // Recommended actions (CTA buttons per panel)
    recommendedActions: (() => {
      const ra = overallSrc.recommendedActions || overallSrc.recommended_actions ||
                 payload.recommendedActions || payload.recommended_actions || [];
      if (!Array.isArray(ra)) return {};
      const map = {};
      ra.forEach(a => { if (a && a.panelId) map[String(a.panelId)] = a; });
      return map;
    })(),
    heatmapData: extractHeatmap(
      selectedTrack === 'micro'     ? microSrc :
      selectedTrack === 'interview' ? interviewSrc :
      codingSrc
    ),
    // Anchor date
    anchorDate: payload.anchorDate || payload.anchor_date ||
                payload.meta?.anchorDate || payload.snapshotDate || null,
  };
}

// ── Client-side CTA action builder ───────────────────────────────────────────
// Generates the same action objects vanilla's backend produces.
// Used when payload.overall.recommendedActions is absent.
// Returns: { [panelId]: { panelId, label, actionType, track, params } }
export function computeCtaActions(payload, metrics, alloc, mcqMatrix, depthScores, heatmapData) {
  const m   = metrics  || {};
  const alc = Array.isArray(alloc)       ? alloc       : [];
  const mqx = Array.isArray(mcqMatrix)   ? mcqMatrix   : [];
  const dsc = Array.isArray(depthScores) ? depthScores : [];

  // If backend provided full recommendedActions array, use them verbatim
  const backendRa = (() => {
    const overall = (payload?.overall?.metrics && payload.overall) || {};
    const ra = overall.recommendedActions || overall.recommended_actions ||
               payload?.recommendedActions || payload?.recommended_actions || [];
    return Array.isArray(ra) ? ra : [];
  })();

  const map = {};
  backendRa.forEach(a => { if (a?.panelId) map[String(a.panelId)] = a; });

  // ── Scores ─────────────────────────────────────────────────────────────────
  if (!map.scores) {
    const b = m.breadthScore  != null ? Number(m.breadthScore)  : null;
    const d = m.depthOverallScore != null ? Number(m.depthOverallScore) : null;
    const intent = (b != null && d != null && b < d) ? 'breadth_sweep' :
                   (b != null && d != null && d < b) ? 'depth_focus'   : 'balanced_practice';
    map.scores = {
      panelId: 'scores', label: 'Start session', actionType: 'start_session',
      track: 'combined', params: { intent, timeboxMinutes: 30 },
    };
  }

  // ── Depth — focus on weakest depth category ───────────────────────────────
  if (!map.depth) {
    const sorted = dsc.slice().sort((a,b) => (Number(a.depth)||0) - (Number(b.depth)||0));
    const weakest = sorted.find(x => (Number(x.depth)||0) > 0) || sorted[0];
    map.depth = {
      panelId: 'depth', label: 'Start coding session', actionType: 'start_session',
      track: 'combined',
      params: {
        intent: 'depth_focus',
        category: weakest?.category || null,
        timeboxMinutes: 30,
      },
    };
  }

  // ── Heatmap — worst early-convergence category ────────────────────────────
  if (!map.heatmap) {
    let worstCat = null;
    if (heatmapData?.categories?.length && heatmapData?.values?.length) {
      let worstScore = Infinity;
      heatmapData.categories.forEach((cat, i) => {
        const vals = (heatmapData.values[i] || []).slice(0, 3).filter(v => v != null && isFinite(v));
        const avg  = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 1;
        if (avg < worstScore) { worstScore = avg; worstCat = cat; }
      });
    }
    map.heatmap = {
      panelId: 'heatmap', label: 'Start coding session', actionType: 'start_session',
      track: 'combined',
      params: {
        intent: 'convergence_fix',
        category: worstCat,
        difficulty: 'Easy',
        timeboxMinutes: 25,
      },
    };
  }

  // ── Time — daily practice session ─────────────────────────────────────────
  if (!map.time) {
    map.time = {
      panelId: 'time', label: 'Start coding session', actionType: 'start_session',
      track: 'combined',
      params: { intent: 'daily_practice', timeboxMinutes: 30 },
    };
  }

  // ── Allocation — focus category with most time ────────────────────────────
  if (!map.allocation) {
    const sorted = alc.slice().sort((a,b) => (b.minutes||0) - (a.minutes||0));
    const topCat = sorted[0]?.category || null;
    map.allocation = {
      panelId: 'allocation', label: 'Start coding session', actionType: 'start_session',
      track: 'combined',
      params: { intent: 'allocation_rebalance', category: topCat, timeboxMinutes: 30 },
    };
  }

  // ── MCQ — drill weakest difficulty ────────────────────────────────────────
  if (!map.mcq) {
    let weakestDiff = 'Easy';
    let weakestAvg  = Infinity;
    for (const diff of ['Easy', 'Medium', 'Hard']) {
      const vals = mqx.map(r => Number(r[diff]?.avgScore)).filter(isFinite);
      if (vals.length) {
        const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
        if (avg < weakestAvg) { weakestAvg = avg; weakestDiff = diff; }
      }
    }
    map.mcq = {
      panelId: 'mcq', label: 'Start MCQ quiz', actionType: 'start_session',
      params: {
        intent: 'mcq_drill',
        difficulty: weakestDiff,
        count: 10,
      },
    };
  }

  return map;
}

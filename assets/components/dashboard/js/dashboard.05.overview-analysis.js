// dashboard.05.overview-analysis.js — Overview / score analysis and insight builders.

// -----------------------------
// Dashboard overview analysis (fallback)
// -----------------------------
function buildDashboardOverviewInsightFromData(payload){
  const getObj = (o, k1, k2) => (o && typeof o === 'object' && (o[k1] || o[k2])) ? (o[k1] || o[k2]) : null;
  const num = (v) => (v === null || v === undefined) ? null : (isFinite(Number(v)) ? Number(v) : null);

  const isV2 = !!(payload && typeof payload === 'object' && (payload.micro || payload.interview || payload.mcq || payload.Micro || payload.Interview || payload.Mcq));
  const overall = isV2 ? (payload.overall || payload.Overall || payload.summary || payload.Summary || {}) : (payload || {});
  const metrics = getObj(overall, 'metrics', 'Metrics') || {};

  const cod = num(metrics.codiviumScore ?? metrics.codivium_score ?? (typeof __cvState.__metricsOverride === 'object' ? __cvState.__metricsOverride.codiviumScore : null));
  const bAll = num(metrics.breadthOverall ?? metrics.overallBreadth ?? metrics.overall_breadth ?? (typeof __cvState.__metricsOverride === 'object' ? __cvState.__metricsOverride.breadthOverall : null));
  const bMic = num(metrics.breadthMicro ?? metrics.microBreadth ?? metrics.micro_challenge_breadth ?? (typeof __cvState.__metricsOverride === 'object' ? __cvState.__metricsOverride.breadthMicro : null));
  const bInt = num(metrics.breadthInterview ?? metrics.interviewBreadth ?? metrics.interview_breadth ?? (typeof __cvState.__metricsOverride === 'object' ? __cvState.__metricsOverride.breadthInterview : null));
  const bMcq = num(metrics.breadthMcq ?? metrics.mcqBreadth ?? metrics.mcq_breadth ?? (typeof __cvState.__metricsOverride === 'object' ? __cvState.__metricsOverride.breadthMcq : null));
  const wMcq = num(metrics.weightedMcqScore ?? metrics.weighted_mcq_score ?? (typeof __cvState.__metricsOverride === 'object' ? __cvState.__metricsOverride.weightedMcqScore : null));

  const ft = num(metrics.firstTryPassRate ?? metrics.first_try_pass ?? (submissionMetrics && submissionMetrics.firstTryPassRate));
  const avgA = num(metrics.avgAttemptsToAC ?? metrics.avg_attempts ?? (submissionMetrics && submissionMetrics.avgAttemptsToAC));
  const medT = num(metrics.medianTimeToACMinutes ?? metrics.median_time ?? (submissionMetrics && submissionMetrics.medianTimeToACMinutes));

  // Time overview (use full available series)
  const daily = (typeof DAILY_PLATFORM_SERIES !== 'undefined' && Array.isArray(DAILY_PLATFORM_SERIES)) ? DAILY_PLATFORM_SERIES : [];
  const totalMin = daily.reduce((a,b)=>a+(Number(b.minutes)||0),0);
  const last7 = daily.slice(-7);
  const last7Total = last7.reduce((a,b)=>a+(Number(b.minutes)||0),0);
  const last7Days = last7.filter(x => (Number(x.minutes)||0) > 0).length;

  // Focus cues
  const topTime = (typeof exerciseTimeByCategory !== 'undefined' && Array.isArray(exerciseTimeByCategory))
    ? exerciseTimeByCategory.slice().sort((a,b)=>(b.minutes||0)-(a.minutes||0))[0]
    : null;

  let focusCat = null;
  if (__cvState.__heatmapFocus && __cvState.__heatmapFocus.rankings){
    const modeId = String(__cvState.__heatmapFocusModeId || __cvState.__heatmapFocus.defaultModeId || 'impact');
    const list = __cvState.__heatmapFocus.rankings[modeId] || __cvState.__heatmapFocus.rankings[modeId.toLowerCase()] || null;
    if (Array.isArray(list) && list.length) focusCat = String(list[0]);
  }

  // MCQ weakness cue (use Advanced/Hard average by category)
  let weakestMcq = null;
  if (typeof mcqMatrix !== 'undefined' && Array.isArray(mcqMatrix) && mcqMatrix.length){
    const rows = mcqMatrix.map(r => ({
      cat: String(r.category||''),
      hard: Number(r.Hard && r.Hard.avgScore) || 0,
      q: Number(r.Hard && r.Hard.questionCount) || 0
    })).filter(x=>x.cat);
    rows.sort((a,b)=>a.hard-b.hard);
    weakestMcq = rows[0] || null;
  }

  const fmt = (x) => (x === null || x === undefined || !isFinite(x)) ? '—' : String(Math.round(x));
  const fmtPct = (x) => (x === null || x === undefined || !isFinite(x)) ? '—' : `${Math.round(x)}%`;
  const fmtMin = (m) => (typeof formatDuration === 'function') ? formatDuration(m) : `${Math.round(m)}m`;

  const sections = [];
  sections.push({
    heading: 'At a glance',
    blocks: [{ kind: 'bullets', items: [
      `Codivium score: ${fmt(cod)}`,
      `Breadth — overall ${fmt(bAll)} • Micro ${fmt(bMic)} • Interview ${fmt(bInt)} • MCQ ${fmt(bMcq)}`,
      `Weighted MCQ: ${fmt(wMcq)}`,
      `Solve quality — first-try pass ${fmtPct(ft)} • avg attempts ${avgA!=null?avgA.toFixed(2):'—'} • median time ${medT!=null?Math.round(medT)+'m':'—'}`,
    ] }]
  });

  sections.push({
    heading: 'Consistency',
    blocks: [{ kind: 'bullets', items: [
      `Total time captured: ${fmtMin(totalMin)}`,
      `Last 7 days: ${fmtMin(last7Total)} • active days ${last7Days}/7`,
      'Use Time on platform to confirm whether your cadence is stable or bursty.'
    ] }]
  });

  const focusBits = [];
  if (focusCat) focusBits.push(`Heatmap focus suggests: ${focusCat}`);
  if (topTime && topTime.category) focusBits.push(`Most time invested: ${topTime.category} (${fmtMin(topTime.minutes||0)})`);
  if (weakestMcq && weakestMcq.cat) focusBits.push(`Weakest Advanced MCQ category: ${weakestMcq.cat} (${fmtPct(weakestMcq.hard)})`);
  if (!focusBits.length) focusBits.push('As you accumulate more data, this overview will call out your highest-impact focus areas.');

  sections.push({ heading: 'Focus signals', blocks: [{ kind: 'bullets', items: focusBits }] });

  // CTA explanation (premium but simple)
  sections.push({
    heading: 'Using the action buttons',
    blocks: [
      { kind: 'p', text: 'Each panel includes a single action button (CTA). It launches a short, pre-selected practice session that targets what the panel is telling you.' },
      { kind: 'bullets', items: [
        'Heatmap CTA → fix the highest-impact weak category (focus set).',
        'Allocation CTA → rebalance time toward under-covered categories.',
        'Depth CTA → deepen one shallow category with a laddered set.',
        'MCQ CTA → targeted quiz in the weakest band.'
      ]},
      { kind: 'note', text: 'The dashboard sends intent (track/category/difficulty/timebox). The backend selects the exact items and returns a session link.' }
    ]
  });

  // Next best action (if present)
  const ra = Array.isArray(__cvState.__recommendedActions) ? __cvState.__recommendedActions : [];
  const next = ra[0] || null;
  if (next && (next.label || next.Label)){
    sections.push({
      heading: 'Suggested next step',
      blocks: [{ kind: 'p', text: String(next.label || next.Label) }]
    });
  }

  return {
    title: 'Dashboard summary',
    summary: 'A single synthesis across scores, charts, and action levers.',
    sections,
    meta: { fallback: true }
  };
}




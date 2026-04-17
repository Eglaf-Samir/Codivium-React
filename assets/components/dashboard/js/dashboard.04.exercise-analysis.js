// dashboard.04.exercise-analysis.js — Exercise allocation analysis and insight builders.

// -----------------------------
// Exercise time by category analysis (fallback)
// -----------------------------
function buildExerciseTimeFallbackInsightFromAllocation(alloc, mode, selectedCategory){
  const DEF = {
    minTotalMinutes: 60,
    minMinutesPerCategory: 20,
    concentrationTop1Share: 0.45,
    concentrationTop3Share: 0.75,
    minSolvedForEfficiency: 3,
    topN: 3,
    maxActions: 3
  };

  const rows = Array.isArray(alloc) ? alloc.map(x => ({
    category: String(x.category || ''),
    minutes: Number(x.minutes) || 0,
    solved: Number(x.solved) || 0
  })).filter(x => x.category) : [];

  const total = rows.reduce((a,b)=>a+b.minutes,0);

  const fmtMin = (m) => {
    const mm = Math.max(0, Math.round(Number(m)||0));
    if (typeof formatDuration === 'function') return formatDuration(mm);
    return `${mm}m`;
  };

  const sorted = rows.slice().sort((a,b)=>b.minutes-a.minutes).filter(x=>x.minutes>0);
  const activeCats = sorted.length;

  const top1 = sorted.length ? sorted[0] : null;
  const top1Share = (top1 && total>0) ? (top1.minutes/total) : 0;
  const top3Min = sorted.slice(0,3).reduce((a,b)=>a+b.minutes,0);
  const top3Share = total>0 ? (top3Min/total) : 0;

  const mkLine = (x) => {
    const share = total>0 ? Math.round((x.minutes/total)*100) : 0;
    return `${x.category} — ${fmtMin(x.minutes)} (${share}%) • solved ${x.solved}`;
  };

  const topList = sorted.slice(0, DEF.topN).map(mkLine);

  const struggle = sorted
    .filter(x => x.minutes >= DEF.minMinutesPerCategory && (x.solved || 0) === 0)
    .slice(0, DEF.topN)
    .map(x => `${x.category} — ${fmtMin(x.minutes)} spent, 0 accepted solves yet`);

  const eff = sorted
    .filter(x => (x.solved || 0) >= DEF.minSolvedForEfficiency)
    .map(x => ({ cat: x.category, mps: x.minutes / Math.max(1, x.solved), solved: x.solved }))
    .sort((a,b)=>b.mps-a.mps)
    .slice(0, DEF.topN)
    .map(x => `${x.cat} — ~${Math.round(x.mps)}m per accepted solve (across ${x.solved} solves)`);

  const diagnosis = [];
  if (total < DEF.minTotalMinutes) diagnosis.push(`Low total time in this dataset (${fmtMin(total)}). Treat distribution insights as early signals.`);

  if (top1Share >= DEF.concentrationTop1Share) diagnosis.push(`Time is highly concentrated: top category is ~${Math.round(top1Share*100)}% of your total.`);
  else if (top3Share < 0.55) diagnosis.push('Time is spread broadly across categories. This is good for exploration, but depth may grow slowly.');
  else diagnosis.push('Allocation is reasonably balanced: you have focus without total neglect of other areas.');

  if (struggle.length) diagnosis.push('Some categories show high time with no accepted solves yet (possible struggle zones).');

  const selNote = (selectedCategory && selectedCategory !== '__all__')
    ? `You currently have a category selected in the chart: ${selectedCategory}. Use ALL to clear selection.`
    : null;

  const sections = [];
  sections.push({
    heading: 'What you’re viewing',
    blocks: [
      { kind: 'p', text: `Mode: ${mode === 'share' ? 'Share (%)' : 'Minutes'}${selNote ? ' • Selection active' : ''}.` },
      { kind: 'note', text: 'If this panel is open in the right-side info pane, it will refresh automatically when you toggle Minutes/Share or select a category.' }
    ]
  });
  sections.push({
    heading: 'Snapshot',
    blocks: [
      { kind: 'bullets', items: [
        `Total time: ${fmtMin(total)} across ${activeCats} active categories`,
        (top1 ? `Top category share: ${Math.round(top1Share*100)}% • Top 3 share: ${Math.round(top3Share*100)}%` : 'No category time yet.'),
        ...(selNote ? [selNote] : [])
      ]}
    ]
  });

  sections.push({ heading: 'Most time invested', blocks: [ { kind: 'bullets', items: topList.length ? topList : ['No time data yet.'] } ] });

  if (struggle.length){
    sections.push({ heading: 'Potential struggle zones', blocks: [ { kind: 'bullets', items: struggle } ] });
  }

  if (eff.length){
    sections.push({ heading: 'Minutes per accepted solve (guarded)', blocks: [ { kind: 'bullets', items: eff } ] });
  }

  sections.push({ heading: 'Likely explanation', blocks: [ { kind: 'bullets', items: diagnosis } ] });

  const actions = [];
  if (top1Share >= DEF.concentrationTop1Share) actions.push('If this focus is intentional, keep it for a short cycle (7–14 days). If not, schedule a weekly sweep of 1–2 other categories.');
  else if (top3Share < 0.55) actions.push('Pick 1–2 priority categories and do deliberate reps until you see depth and heatmap improvement.');
  else actions.push('Maintain this distribution and choose one category to push slightly higher each week.');

  if (struggle.length) actions.push('For struggle zones: step down difficulty, write smaller tests, and repeat short sets until you can get at least one clean accepted solve.');
  if (eff.length) actions.push('If minutes per accepted solve is high in a category, focus on pattern review + deliberate debugging rather than just doing more volume.');

  sections.push({ heading: 'What to do next', blocks: [ { kind: 'bullets', items: actions.slice(0, DEF.maxActions) } ] });

  sections.push({
    heading: 'Action button',
    blocks: [
      { kind: 'p', text: 'Use the panel CTA to start a session that nudges your distribution toward the most valuable under-covered area.' },
      { kind: 'note', text: 'The dashboard sends intent (category/timebox/track). The backend selects items and returns a session link.' }
    ]
  });

  sections.push({
    heading: 'Confidence & guards',
    blocks: [ { kind: 'bullets', items: [
      `Distribution callouts only activate after at least ${fmtMin(DEF.minTotalMinutes)} total time.`,
      `A category is treated as a “struggle zone” only when minutes ≥ ${fmtMin(DEF.minMinutesPerCategory)} and solved = 0.`,
      `Minutes-per-solve is shown only when solved ≥ ${DEF.minSolvedForEfficiency} (to reduce noise).`,
      'Minutes include all coding time passed into the dashboard (solved or not). Solved counts accepted solves only.'
    ] } ]
  });

  return {
    title: 'Exercise time by category analysis',
    summary: 'How your coding time is distributed across categories (including unsolved time).',
    sections,
    meta: { fallback: true }
  };
}


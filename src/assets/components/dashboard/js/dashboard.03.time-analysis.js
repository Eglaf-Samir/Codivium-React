// dashboard.03.time-analysis.js — Time-on-platform analysis and insight builders.

// -----------------------------
// Time on platform analysis (fallback)
// -----------------------------
function buildTimeOnPlatformFallbackInsightFromSeries(dailySeries, rangeKey, granKey){
  const DEF = {
    minActiveDaysForTrend: 6,
    minWeeksForTrend: 4,
    spikeShareThreshold: 0.35,
    trendRelThreshold: 0.15,
    maxActions: 3
  };

  const safeArr = Array.isArray(dailySeries) ? dailySeries : [];
  const dailyInRange = (typeof filterSeriesByRange === 'function') ? filterSeriesByRange(safeArr, rangeKey) : safeArr;

  let viewSeries = dailyInRange;
  if (granKey === 'weekly' && typeof aggregateWeekly === 'function') viewSeries = aggregateWeekly(dailyInRange);

  const unitLabel = (granKey === 'weekly') ? 'week' : 'day';
  const unitLabelCap = (granKey === 'weekly') ? 'Week' : 'Day';
  const rangeLabel = (rangeKey === '7d') ? 'Last 7 days' : (rangeKey === '30d') ? 'Last 30 days' : (rangeKey === '90d') ? 'Last 90 days' : 'Year to date';

  const minutesList = viewSeries.map(x => Number(x.minutes) || 0);
  const total = minutesList.reduce((a,b)=>a+b,0);
  const units = Math.max(1, minutesList.length);
  const avg = total / units;

  const median = (vals) => {
    const a = (vals || []).slice().sort((x,y)=>x-y);
    if (!a.length) return 0;
    const m = Math.floor(a.length/2);
    return (a.length % 2) ? a[m] : (a[m-1] + a[m]) / 2;
  };

  const med = median(minutesList);
  const activeUnits = minutesList.filter(m => m > 0).length;
  const activeShare = activeUnits / units;

  let maxMin = 0;
  for (let i=0;i<minutesList.length;i++) maxMin = Math.max(maxMin, minutesList[i]);
  const spikeShare = total > 0 ? (maxMin / total) : 0;
  const isSpiky = (units >= 3) && (spikeShare >= DEF.spikeShareThreshold);

  const streakStats = (vals) => {
    let cur = 0;
    for (let i = vals.length - 1; i >= 0; i--){
      if (vals[i] > 0) cur += 1;
      else break;
    }
    let best = 0;
    let run = 0;
    for (let i=0;i<vals.length;i++){
      if (vals[i] > 0){
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    return { current: cur, longest: best };
  };

  const st = streakStats(minutesList);

  // Trend: compare a recent window to the previous window.
  let trend = null;
  try {
    if (granKey === 'weekly'){
      const weeks = minutesList.slice();
      const n = Math.min(4, Math.floor(weeks.length / 2));
      if (weeks.length >= 2*n && n >= DEF.minWeeksForTrend){
        const recent = weeks.slice(-n).reduce((a,b)=>a+b,0);
        const prev = weeks.slice(-2*n, -n).reduce((a,b)=>a+b,0);
        trend = { label: `${n} weeks vs previous ${n}`, recent, prev, rel: (prev > 0 ? (recent - prev)/prev : null) };
      }
    } else {
      const N = (rangeKey === '7d') ? 7 : (rangeKey === '30d') ? 30 : (rangeKey === '90d') ? 30 : 30;
      const full = safeArr.map(x => ({ minutes: Number(x.minutes)||0 }));
      const lastN = full.slice(-N);
      const prevN = full.slice(-2*N, -N);
      const recent = lastN.reduce((a,b)=>a+b.minutes,0);
      const prev = prevN.reduce((a,b)=>a+b.minutes,0);
      const activeRecent = lastN.filter(x=>x.minutes>0).length;
      if (prevN.length === N && activeRecent >= DEF.minActiveDaysForTrend){
        trend = { label: `${N} days vs previous ${N}`, recent, prev, rel: (prev > 0 ? (recent - prev)/prev : null) };
      }
    }
  } catch (_){
    trend = null;
  }

  const fmtMin = (m) => {
    const mm = Math.max(0, Math.round(Number(m)||0));
    if (typeof formatDuration === 'function') return formatDuration(mm);
    return `${mm}m`;
  };

  const diagnosisLines = [];
  if (activeUnits <= Math.max(1, Math.round(units * 0.3))) diagnosisLines.push(`Consistency is low in this window (${activeUnits}/${units} ${unitLabel}s).`);
  else if (activeUnits >= Math.round(units * 0.7)) diagnosisLines.push(`Consistency is strong in this window (${activeUnits}/${units} ${unitLabel}s active).`);
  else diagnosisLines.push(`Consistency is moderate in this window (${activeUnits}/${units} ${unitLabel}s active).`);

  if (avg < 20) diagnosisLines.push('Practice volume is light. Short, repeatable sessions tend to beat occasional long sessions.');
  else if (avg < 45) diagnosisLines.push('Practice volume is moderate. Keep it steady and increase slowly if you want faster progress.');
  else diagnosisLines.push('Practice volume is high. Protect quality: keep sessions deliberate, not just long.');

  if (isSpiky) diagnosisLines.push(`Time is spiky: your biggest ${unitLabel} is ${Math.round(spikeShare*100)}% of the total shown.`);

  const sections = [];
  sections.push({
    heading: 'What you’re viewing',
    blocks: [
      { kind: 'p', text: `${rangeLabel} • ${granKey === 'weekly' ? 'Weekly' : 'Daily'} aggregation.` },
      { kind: 'note', text: 'If this panel is open in the right-side info pane, it will refresh automatically when you change the range or aggregation.' }
    ]
  });
  sections.push({
    heading: 'Snapshot',
    blocks: [
      { kind: 'bullets', items: [
        `${rangeLabel} shown: ${fmtMin(total)} total`,
        `${unitLabelCap} average: ${Math.round(avg)}m • median: ${Math.round(med)}m`,
        `${unitLabelCap}s practiced: ${activeUnits}/${units} (${Math.round(activeShare*100)}%)`,
        `Current streak: ${st.current} ${unitLabel}${st.current===1?'':'s'} • longest streak in window: ${st.longest}`,
        `Biggest ${unitLabel}: ${fmtMin(maxMin)}`
      ]}
    ]
  });

  if (trend){
    const rel = trend.rel;
    let line;
    if (rel === null){
      line = `Recent total: ${fmtMin(trend.recent)} (no earlier baseline to compare).`;
    } else {
      const dir = rel > 0 ? 'up' : (rel < 0 ? 'down' : 'flat');
      line = `Trend (${trend.label}): ${fmtMin(trend.recent)} vs ${fmtMin(trend.prev)} (${dir} ${Math.abs(Math.round(rel*100))}%).`;
    }
    sections.push({ heading: 'Trend', blocks: [{ kind: 'p', text: line }] });
  } else {
    sections.push({ heading: 'Trend', blocks: [{ kind: 'p', text: 'Not enough stable history in the current view to compute a reliable trend comparison.' }] });
  }

  sections.push({ heading: 'Likely explanation', blocks: [{ kind: 'bullets', items: diagnosisLines }] });

  const actions = [];
  if (activeUnits <= Math.max(1, Math.round(units*0.3))) actions.push('Start with a minimum habit: 20–30 minutes on 4 days this week.');
  else actions.push('Keep the habit stable: protect your active days/weeks before increasing session length.');

  if (isSpiky) actions.push('If you have one big spike, split it into smaller sessions across the week for better retention.');
  if (trend && trend.rel !== null && trend.rel < -DEF.trendRelThreshold) actions.push('You are trending down recently. Schedule two short “minimum viable” sessions to stop drift.');
  if (trend && trend.rel !== null && trend.rel > DEF.trendRelThreshold) actions.push('You are trending up. Keep goals stable so the habit sticks.');

  sections.push({ heading: 'What to do next', blocks: [{ kind: 'bullets', items: actions.slice(0, DEF.maxActions) }] });

  sections.push({
    heading: 'Action button',
    blocks: [
      { kind: 'p', text: 'Use the panel CTA to start a short time-boxed session and keep your cadence consistent.' },
      { kind: 'note', text: 'The CTA launches a session via the backend: the dashboard sends intent and redirects to the session link.' }
    ]
  });

  sections.push({
    heading: 'Confidence & guards',
    blocks: [{ kind: 'bullets', items: [
      'This panel uses the selected range and Daily/Weekly aggregation you chose.',
      `Trend is only computed when there is enough evidence (≥${DEF.minActiveDaysForTrend} active days for daily trend, or ≥${DEF.minWeeksForTrend} weeks for weekly trend).`,
      `A “spike” callout is only shown when the largest ${unitLabel} is at least ${Math.round(DEF.spikeShareThreshold*100)}% of the total shown.`,
      'Time on platform currently reflects coding + MCQ time that is passed into the dashboard. Tutorials and mini-projects will be added once tracked.'
    ]}]
  });

  return {
    title: 'Time on platform analysis',
    summary: 'Cadence, consistency, and momentum over your selected time window.',
    sections,
    meta: { fallback: true }
  };
}

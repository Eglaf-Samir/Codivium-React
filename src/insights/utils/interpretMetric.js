// src/insights/utils/interpretMetric.js
// Returns structured insight objects matching vanilla renderInsightObject() format.
// Shape: { sections: [{ heading, blocks: [{ kind:'p'|'bullets'|'note', text?, items? }] }] }
// Falls back to a plain string for simple cases.

// ── Helpers ───────────────────────────────────────────────────────────────────
function n(v) {
  if (v == null) return null;
  const num = typeof v === 'string' ? parseFloat(v.replace('%', '')) : Number(v);
  return isFinite(num) ? num : null;
}
function pct(v, decimals = 1) {
  const x = n(v);
  return x == null ? '—' : x.toFixed(decimals) + '%';
}
function round1(v) { const x = n(v); return x == null ? '—' : (Math.round(x * 10) / 10).toFixed(1); }
function round0(v) { const x = n(v); return x == null ? '—' : String(Math.round(x)); }

// Build helpers
const p = (text) => ({ kind: 'p', text: String(text || '') });
const bullets = (...items) => ({ kind: 'bullets', items: items.filter(Boolean).map(String) });
const note = (text) => ({ kind: 'note', text: String(text || '') });
function section(heading, ...blocks) { return { heading, blocks }; }

// ── Main export ───────────────────────────────────────────────────────────────
export function interpretMetric(key, metrics, alloc, mcqMatrix, dailySeries) {
  const m   = metrics || {};
  const alc = Array.isArray(alloc) ? alloc : [];
  const mqx = Array.isArray(mcqMatrix) ? mcqMatrix : [];
  const ds  = Array.isArray(dailySeries) ? dailySeries : [];

  switch (key) {

    // ── SCORES PANEL ──────────────────────────────────────────────────────────
    case 'panel_scores':
    case 'breadthScore': {
      const breadth    = n(m.breadthScore);
      const depth      = n(m.depthOverallScore);
      const microB     = n(m.microBreadthScore);
      const interviewB = n(m.interviewBreadthScore);
      const mcqB       = n(m.mcqBreadthScore);
      const wmcq       = n(m.weightedMcqScore);
      const cod        = n(m.codiviumScore);

      // Covered / total categories from alloc
      const totalCats   = alc.length || null;
      const coveredCats = alc.filter(x => (x.minutes || 0) >= 30).length;

      const breadthLine = breadth != null
        ? `Overall coding breadth: ${pct(breadth)} ${totalCats ? `(${coveredCats}/${totalCats})` : ''}`
        : null;
      const microLine     = microB     != null ? `Micro breadth: ${pct(microB)}` : null;
      const interviewLine = interviewB != null ? `Interview breadth: ${pct(interviewB)}` : null;
      const mcqLine       = mcqB != null
        ? `MCQ breadth: ${pct(mcqB)}${wmcq != null ? ` (interpret alongside Weighted MCQ: ${round0(wmcq)})` : ''}`
        : null;

      const summaryBullets = [breadthLine, microLine, interviewLine, mcqLine].filter(Boolean);

      // Balance: Micro vs Interview
      let balanceText = null;
      if (microB != null && interviewB != null) {
        const diff = Math.abs(microB - interviewB);
        if (diff <= 8) {
          balanceText = 'Micro and interview coverage are broadly balanced — you\'re practicing and applying across similar category ranges.\nCodivium best practice: when you cover a category in micro, convert it into an interview solve soon after to lock in transfer.';
        } else if (microB > interviewB) {
          balanceText = `Micro breadth is ahead of interview breadth by ${pct(diff)} — good micro coverage, but try to convert more micro categories into interview-style solves to strengthen transfer.`;
        } else {
          balanceText = `Interview breadth is ahead of micro breadth by ${pct(diff)} — strong interview coverage; use micro drills to deepen weaker categories faster.`;
        }
      }

      // Alignment: MCQ vs Coding
      let alignText = null;
      if (mcqB != null && breadth != null) {
        const bothLow  = mcqB < 50 && breadth < 50;
        const mcqLow   = mcqB < 55;
        const codLow   = breadth < 55;
        if (bothLow) {
          alignText = 'MCQ and coding breadth are both developing — focus on covering a few new categories each week and validating transfer with interview-style problems.\nReminder: MCQ breadth measures exposure; Weighted MCQ measures accuracy and understanding quality.';
        } else if (mcqLow) {
          alignText = 'MCQ breadth lags coding breadth — add quizzes for categories you\'ve solved to verify conceptual understanding.\nReminder: MCQ breadth measures exposure; Weighted MCQ measures accuracy and understanding quality.';
        } else if (codLow) {
          alignText = 'Coding breadth lags MCQ breadth — your conceptual coverage is ahead; now convert MCQ categories into coding practice to lock in application.\nReminder: MCQ breadth measures exposure; Weighted MCQ measures accuracy and understanding quality.';
        } else {
          alignText = 'MCQ and coding breadth are both developing well. Keep rotating new categories and validating each with both MCQ and a coding solve.\nReminder: MCQ breadth measures exposure; Weighted MCQ measures accuracy and understanding quality.';
        }
      }

      // Overall verdict
      let verdict = null;
      if (breadth != null && depth != null) {
        if (breadth < 40 && depth > 70) verdict = 'Deep-focus cycle: great for mastery, but add a weekly sweep to prevent blind spots.';
        else if (breadth > 70 && depth < 50) verdict = 'High breadth, low depth: choose 1–2 categories and run deliberate reps to build depth.';
        else if (breadth > 70 && depth > 70) verdict = 'Excellent balance: wide coverage and deep focus. Maintain with small weekly rotations.';
        else verdict = 'Aim for balance: breadth prevents gaps; depth builds mastery in priority topics.';
      }

      const sections = [];
      if (summaryBullets.length) sections.push(section('Summary', bullets(...summaryBullets)));
      if (balanceText) sections.push(section('Balance: Micro vs Interview', p(balanceText)));
      if (alignText)   sections.push(section('Alignment: MCQ vs Coding', p(alignText)));
      if (verdict)     sections.push(section('Overall', p(verdict)));
      if (!sections.length) return 'Click the i button after your data loads for a personalised analysis.';
      return { sections };
    }

    // ── DEPTH PANEL ───────────────────────────────────────────────────────────
    case 'depthAvg':
    case 'depthOverallScore':
    case 'panel_depth': {
      const depthScores = m.depthScores;
      if (Array.isArray(depthScores) && depthScores.length) {
        // Reuse vanilla's buildDepthFallbackInsightFromOverride logic
        return buildDepthInsight(depthScores);
      }
      const depthAvg = n(m.depthOverallScore);
      if (depthAvg != null) {
        if (depthAvg < 45) return { sections: [section('Depth analysis', p('Depth is low: time is spread thin. Pick a focus category and increase deliberate reps.'))] };
        if (depthAvg < 70) return { sections: [section('Depth analysis', p('Depth is moderate: push one category higher for a week, then rotate.'))] };
        return { sections: [section('Depth analysis', p('Depth is high: strong focus. Periodically broaden breadth to prevent gaps.'))] };
      }
      return 'Depth interpretation will appear after values load.';
    }

    // ── MCQ PANEL ─────────────────────────────────────────────────────────────
    case 'weightedMcqScore':
    case 'panel_mcq': {
      const wmcq = n(m.weightedMcqScore);
      const mcqB = n(m.mcqBreadthScore);

      const summaryItems = [];
      if (wmcq != null) summaryItems.push(`Weighted MCQ score: ${round0(wmcq)}`);
      if (mcqB != null) summaryItems.push(`MCQ breadth: ${pct(mcqB)}`);

      // Per-difficulty from mcqMatrix
      const diffSummary = [];
      for (const diff of ['Easy', 'Medium', 'Hard']) {
        const vals = mqx.map(r => n(r[diff]?.avgScore)).filter(x => x != null);
        if (vals.length) {
          const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
          const lowest = mqx.reduce((min, r) => {
            const s = n(r[diff]?.avgScore); return (s != null && (min == null || s < min.s)) ? {cat: r.category, s} : min;
          }, null);
          diffSummary.push(`${diff}: avg ${round0(avg)}%${lowest ? ` — weakest: ${lowest.cat} (${round0(lowest.s)}%)` : ''}`);
        }
      }

      let verdict = null;
      if (wmcq != null) {
        if (wmcq < 55) verdict = 'MCQ below target: review fundamentals and drill weakest Medium/Hard categories.';
        else if (wmcq < 75) verdict = 'MCQ improving: focus on lowest Hard bars and revise mistakes into spaced repetition.';
        else verdict = 'MCQ strong: maintain with occasional hard drills; focus more on coding execution speed.';
      }

      const sections = [];
      if (summaryItems.length || diffSummary.length)
        sections.push(section('Summary', bullets(...summaryItems, ...diffSummary)));
      if (verdict) sections.push(section('Overall', p(verdict)));
      sections.push(section('Reminder', note('MCQ breadth measures exposure; Weighted MCQ measures accuracy and difficulty-weighted understanding quality.')));
      return { sections };
    }

    // ── MCQ DIFFICULTY CHARTS ─────────────────────────────────────────────────
    case 'mcqEasy':
    case 'mcqMedium':
    case 'mcqHard': {
      const diff = key === 'mcqEasy' ? 'Easy' : key === 'mcqMedium' ? 'Medium' : 'Hard';
      const vals = mqx.map(r => ({ cat: r.category, s: n(r[diff]?.avgScore) })).filter(x => x.s != null);
      if (!vals.length) return `${diff} MCQ data will appear after values load.`;
      vals.sort((a,b) => a.s - b.s);
      const avg   = vals.reduce((a,b)=>a+b.s,0) / vals.length;
      const worst = vals.slice(0,3).map(x => `${x.cat}: ${round0(x.s)}%`);
      const best  = vals.slice(-3).reverse().map(x => `${x.cat}: ${round0(x.s)}%`);
      let verdict = avg < 60
        ? `${diff} average is ${round0(avg)}%. Rebuild fundamentals in the weakest categories before moving up in difficulty.`
        : avg < 78
        ? `${diff} average is ${round0(avg)}%. Drill mistakes from the weakest categories into spaced repetition.`
        : `${diff} average is strong at ${round0(avg)}%. Maintain hygiene while pushing harder coding sets.`;
      return { sections: [
        section('Summary', bullets(`Average score: ${round0(avg)}%`, `Categories: ${vals.length}`)),
        section('Weakest (priority)', bullets(...worst)),
        section('Strongest', bullets(...best)),
        section('Next step', p(verdict)),
      ]};
    }

    // ── TIME PANEL ────────────────────────────────────────────────────────────
    case 'panel_time': {
      if (!ds.length) return 'Time interpretation will appear after values load.';
      const now = new Date(); now.setHours(0,0,0,0);
      const s7  = new Date(now); s7.setDate(now.getDate() - 6);
      const s30 = new Date(now); s30.setDate(now.getDate() - 29);
      const last7  = ds.filter(x => x.date >= s7);
      const last30 = ds.filter(x => x.date >= s30);
      const t7   = last7.reduce((a,b)=>a+(b.minutes||0),0);
      const t30  = last30.reduce((a,b)=>a+(b.minutes||0),0);
      const days7  = last7.filter(x=>(x.minutes||0)>0).length;
      const days30 = last30.filter(x=>(x.minutes||0)>0).length;
      const avg7 = t7 / 7;
      const fmtMins = m => m < 60 ? `${Math.round(m)}m` : `${Math.floor(m/60)}h ${Math.round(m%60)}m`;
      const verdict = days7 <= 2
        ? 'Consistency is low in the last 7 days. Aim for short daily sessions (25–45m) to build momentum.'
        : avg7 < 20
        ? 'Practice volume is light. Increase session length or add one extra day this week.'
        : 'Good cadence: keep consistency and use Weekly view to confirm the trend is stable.';
      return { sections: [
        section('Last 7 days', bullets(
          `Total: ${fmtMins(t7)}`,
          `Active days: ${days7} / 7`,
          `Daily average: ${fmtMins(avg7)}`
        )),
        section('Last 30 days', bullets(
          `Total: ${fmtMins(t30)}`,
          `Active days: ${days30} / 30`
        )),
        section('Assessment', p(verdict)),
      ]};
    }

    // ── ALLOCATION PANEL ─────────────────────────────────────────────────────
    case 'panel_exercise': {
      if (!alc.length) return 'Allocation interpretation will appear after values load.';
      const total  = alc.reduce((a,b)=>a+(b.minutes||0),0) || 1;
      const sorted = alc.slice().sort((a,b)=>(b.minutes||0)-(a.minutes||0));
      const top3   = sorted.slice(0,3).map(x => {
        const pct = ((x.minutes||0)/total*100).toFixed(1);
        const hrs = Math.floor(x.minutes/60), mins = Math.round(x.minutes%60);
        return `${x.category}: ${pct}% (${hrs > 0 ? hrs+'h ' : ''}${mins}m, ${x.solved||0} solved)`;
      });
      const least  = sorted.slice(-3).reverse().map(x => `${x.category}: ${((x.minutes||0)/total*100).toFixed(1)}%`);
      const topShare = (sorted[0]?.minutes||0)/total*100;
      const top3Share = sorted.slice(0,3).reduce((a,b)=>a+(b.minutes||0),0)/total*100;
      const verdict = topShare > 55
        ? 'Time is highly concentrated in one category. Great for short deep-focus cycles — add a weekly sweep to avoid gaps.'
        : top3Share < 55
        ? 'Time is spread broadly. Pick 1–2 priority categories and increase deliberate reps to build depth.'
        : 'Allocation looks balanced. Maintain with small rotations and spend extra time on categories with weak MCQ scores.';
      return { sections: [
        section('Most time invested', bullets(...top3)),
        section('Least time invested', bullets(...least)),
        section('Assessment', p(verdict)),
      ]};
    }

    // ── HEATMAP PANEL ────────────────────────────────────────────────────────
    case 'panel_heatmap': {
      if (!mqx.length) {
        return { sections: [
          section('Heatmap', p('Pass-rate data will appear here once your MCQ history loads.')),
        ]};
      }

      const cols = ['A1','A2','A3','A4','A5'];

      // Per-category analysis
      const cats = mqx.map(row => {
        const a1 = n(row['A1']?.avgScore);
        const a5 = n(row['A5']?.avgScore);
        const allVals = cols.map(c => n(row[c]?.avgScore)).filter(x => x != null);
        const avgAll = allVals.length ? allVals.reduce((a,b)=>a+b,0)/allVals.length : null;
        const slope  = (a1 != null && a5 != null) ? a5 - a1 : null;
        return { cat: row.category, a1, a5, avgAll, slope, allVals };
      }).filter(x => x.allVals.length > 0);

      if (!cats.length) return { sections: [section('Heatmap', p('No MCQ pass-rate data yet.'))] };

      // A1 (first-attempt correctness) — lowest = biggest planning/understanding gaps
      const byA1    = cats.filter(x => x.a1 != null).sort((a,b) => a.a1 - b.a1);
      const weakA1  = byA1.slice(0, 3);
      const strongA1= byA1.slice(-3).reverse();

      // Learning-in-session: categories where A5 >> A1 (steep positive slope)
      const byCurve = cats.filter(x => x.slope != null).sort((a,b) => b.slope - a.slope);
      const steepLearners = byCurve.filter(x => x.slope > 15).slice(0, 3);
      // Flat/resistant: pass rate barely improves across attempts
      const flatResistant  = byCurve.filter(x => x.slope != null && x.slope < 5 && x.a1 != null && x.a1 < 60).slice(-3).reverse();

      // Overall A1 average across all categories
      const a1Vals = cats.filter(x => x.a1 != null).map(x => x.a1);
      const overallA1 = a1Vals.length ? a1Vals.reduce((a,b)=>a+b,0)/a1Vals.length : null;

      const sections2 = [];

      // Weakest A1 — highest priority
      if (weakA1.length) {
        sections2.push(section(
          `Weakest first-attempt correctness (A1)`,
          bullets(...weakA1.map(x => `${x.cat}: ${round0(x.a1)}% first-try${x.a5 != null ? ` → ${round0(x.a5)}% by A5` : ''}`)),
          p(overallA1 != null
            ? `Your overall first-attempt average is ${round0(overallA1)}%. ${
                overallA1 < 40
                  ? 'Low first-try correctness across the board — the problem is planning, not execution. Before submitting, trace 2 edge cases and restate the constraint in your own words.'
                  : overallA1 < 60
                  ? 'Room to improve first-try rate. Slow down pre-submit: re-read constraints, identify the pattern, and check base cases before writing code.'
                  : 'Solid first-try average. Focus deliberate reps on the weakest categories above.'
              }`
            : 'Focus deliberate reps on the categories above to improve first-try correctness.')
        ));
      }

      // Steep learners — good in-session improvement but still starting low
      if (steepLearners.length) {
        sections2.push(section(
          'Learning in-session (A1 → A5 steep rise)',
          bullets(...steepLearners.map(x => `${x.cat}: ${round0(x.a1)}% → ${round0(x.a5)}% (+${round0(x.slope)}pp)`)),
          p(`These categories show strong in-session learning — you work it out across attempts. That's good, but the improvement needs to move to A1. Run a focused recall drill on these 24h after your next session to lock in the pattern before it fades.`)
        ));
      }

      // Flat/resistant — pass rate barely moves even after multiple attempts
      if (flatResistant.length) {
        sections2.push(section(
          'Resistant categories (low A1, flat curve)',
          bullets(...flatResistant.map(x => `${x.cat}: A1 ${round0(x.a1)}%${x.a5 != null ? ` · A5 ${round0(x.a5)}%` : ''} — barely improving`)),
          p(`These categories are not improving through repetition alone — you're hitting the same wall each attempt. Switch approach: read the explanation before attempting, map the pattern explicitly, then retry. Repeated failure without strategy change does not produce learning.`)
        ));
      }

      // Strongest A1 — acknowledge and redirect
      if (strongA1.length) {
        sections2.push(section(
          'Strongest first-attempt correctness',
          bullets(...strongA1.map(x => `${x.cat}: ${round0(x.a1)}%${x.avgAll != null ? ` (avg all attempts: ${round0(x.avgAll)}%)` : ''}`))
        ));
      }

      if (!sections2.length) return { sections: [section('Heatmap', p('Complete more MCQ sessions to surface specific patterns.'))] };
      return { sections: sections2 };
    }

    // ── INDIVIDUAL SCORE CHIPS ───────────────────────────────────────────────
    case 'codiviumScore': {
      const cod = n(m.codiviumScore);
      const b   = n(m.breadthScore);
      const d   = n(m.depthOverallScore);
      if (cod == null) return 'Score will appear after values load.';
      const band = cod < 20 ? 'Getting started' : cod < 40 ? 'Building foundations' : cod < 60 ? 'Developing consistency' : cod < 80 ? 'Strong performance' : 'Advanced trajectory';
      return { sections: [
        section('Your Codivium Score', bullets(`Score: ${round0(cod)} / 100`, `Band: ${band}`, ...(b!=null&&d!=null ? [`Breadth: ${round0(b)} · Depth: ${round0(d)}`] : []))),
        section('How to improve', p(b!=null&&d!=null&&b<d ? 'Breadth is the current bottleneck — rotate new categories into your weekly plan.' : b!=null&&d!=null&&d<b ? 'Depth is the current bottleneck — pick 1–2 categories and run focused reps.' : 'Use this score for week-to-week trend. If it stalls, check Breadth/Depth/MCQ to locate the bottleneck.')),
      ]};
    }

    case 'codiviumPointsAll':
    case 'codiviumPoints30': {
      const all = n(m.codiviumPointsAll);
      const d30 = n(m.codiviumPoints30);
      const eff = n(m.efficiencyPtsPerHr);
      return { sections: [
        section('Your points', bullets(
          ...(all!=null ? [`All-time: ${round0(all)} pts`] : []),
          ...(d30!=null ? [`Last 30 days: ${round0(d30)} pts`] : []),
          ...(eff!=null ? [`Efficiency: ${round1(eff)} pts/hr`] : [])
        )),
        section('How points work', p('Points accumulate from accepted solves. Harder categories, higher difficulty levels, and stronger convergence (heatmap pass rates) each add multipliers.')),
      ]};
    }

    case 'efficiencyPtsPerHr': {
      const eff = n(m.efficiencyPtsPerHr);
      if (eff == null) return 'Efficiency data will appear after values load.';
      const verdict = eff < 10 ? 'Efficiency is low: work on first-try correctness and reduce re-attempt time.' : eff < 25 ? 'Efficiency is building: keep improving first-try rate to push this higher.' : 'Good efficiency: maintain quality and push into harder categories.';
      return { sections: [
        section('Efficiency', bullets(`${round1(eff)} pts / hr`)),
        section('Assessment', p(verdict)),
        section('How to improve', p('Higher first-try pass rate, faster solve time, and harder categories all increase efficiency.')),
      ]};
    }

    case 'firstTryPassRate': {
      const ft = n(m.firstTryPassRate);
      if (ft == null) return 'Interpretation will appear after values load.';
      const v = ft > 1 ? ft : ft * 100;
      const verdict = v < 30 ? 'Low first-try correctness: plan more, write edge cases first, and slow down pre-submit.' : v < 55 ? 'Improving first-try rate: add a quick checklist and practice explaining your approach.' : 'Excellent first-try: now optimize speed under harder difficulty.';
      return { sections: [
        section('First-try pass rate', bullets(`${pct(v)}`)),
        section('Assessment', p(verdict)),
        section('How to improve', p('Before submitting: re-read constraints, trace 2 edge cases on paper, check your base cases.')),
      ]};
    }

    case 'avgAttemptsToAC': {
      const avg = n(m.avgAttemptsToAC);
      if (avg == null) return 'Interpretation will appear after values load.';
      const avgN = typeof avg === 'string' ? parseFloat(avg) : avg;
      const verdict = avgN > 3.5 ? 'High attempts: add debugging structure and test hypotheses per change.' : avgN > 2.2 ? 'Moderate attempts: improve pre-submit checks and edge-case reasoning.' : 'Great attempts-to-success: increase difficulty to keep progressing.';
      return { sections: [
        section('Avg attempts to accepted', bullets(`${round1(avgN)} attempts`)),
        section('Assessment', p(verdict)),
      ]};
    }

    case 'medianTimeToAC': {
      const medT = m.medianTimeToAC;
      const medN = medT ? parseFloat(String(medT).replace(/[^0-9.]/g,'')) : null;
      if (!medT || medT === '—') return 'Interpretation will appear after values load.';
      const verdict = String(medT).includes('h') || (medN && medN > 45) ? 'High median time: drill patterns and break problems into steps to build speed.' : medN && medN > 25 ? 'Moderate speed: practice faster mapping from problem → pattern once correctness is stable.' : 'Strong speed: maintain with timed sets and harder categories.';
      return { sections: [
        section('Median time to accepted', bullets(`${medT}`)),
        section('Assessment', p(verdict)),
      ]};
    }

    case 'microBreadthScore': {
      const microB = n(m.microBreadthScore);
      if (microB == null) return 'Micro breadth will appear after values load.';
      const verdict = microB < 30 ? 'Micro breadth is low: rotate new categories in micro challenges to build agility.' : microB < 60 ? 'Micro breadth is moderate: keep rotating weekly to prevent micro blind spots.' : 'Micro breadth is strong: maintain while pushing depth in 1 focus category.';
      return { sections: [
        section('Micro breadth', bullets(`${pct(microB)}`)),
        section('Assessment', p(verdict)),
      ]};
    }

    case 'interviewBreadthScore': {
      const intB = n(m.interviewBreadthScore);
      if (intB == null) return 'Interview breadth will appear after values load.';
      const verdict = intB < 30 ? 'Interview breadth is low: add missing high-frequency interview topics into your weekly plan.' : intB < 60 ? 'Interview breadth is moderate: schedule a weekly sweep to cover remaining categories.' : 'Interview breadth is strong: now focus on harder difficulty and speed.';
      return { sections: [
        section('Interview breadth', bullets(`${pct(intB)}`)),
        section('Assessment', p(verdict)),
      ]};
    }

    case 'mcqBreadthScore': {
      const mcqB = n(m.mcqBreadthScore);
      const wmcq = n(m.weightedMcqScore);
      if (mcqB == null) return 'MCQ breadth will appear after values load.';
      const verdict = mcqB < 30 ? 'MCQ breadth is low: quiz a wider set of categories to reveal hidden knowledge gaps.' : mcqB < 60 ? 'MCQ breadth is moderate: add 1–2 new categories per week to expand coverage.' : 'MCQ breadth is strong: keep coverage while improving weakest Advanced categories.';
      return { sections: [
        section('MCQ breadth', bullets(`Coverage: ${pct(mcqB)}`, ...(wmcq!=null ? [`Weighted MCQ score: ${round0(wmcq)}`] : []))),
        section('Assessment', p(verdict)),
        section('Reminder', note('MCQ breadth measures exposure; Weighted MCQ measures accuracy and understanding quality.')),
      ]};
    }

    case 'microDepthScore': {
      const v = n(m.microDepthScore);
      if (v == null) return 'Micro depth will appear after values load.';
      return { sections: [
        section('Micro depth', bullets(`Average depth: ${round0(v)}`)),
        section('Assessment', p(v < 40 ? 'Micro depth is low: increase reps in micro categories to build mastery.' : v < 70 ? 'Micro depth is moderate: push 1–2 categories deeper with focused practice cycles.' : 'Micro depth is strong: rotate to broaden micro coverage alongside maintaining depth.')),
      ]};
    }

    case 'interviewDepthScore': {
      const v = n(m.interviewDepthScore);
      if (v == null) return 'Interview depth will appear after values load.';
      return { sections: [
        section('Interview depth', bullets(`Average depth: ${round0(v)}`)),
        section('Assessment', p(v < 40 ? 'Interview depth is low: convert micro categories into interview-style solves to build transfer depth.' : v < 70 ? 'Interview depth is moderate: schedule focused interview sessions in your 2–3 core categories.' : 'Interview depth is strong: focus on speed and harder difficulty in interview sessions.')),
      ]};
    }

    // ── DASHBOARD OVERVIEW ───────────────────────────────────────────────────
    case 'dashboard_overview': {
      const cod  = n(m.codiviumScore);
      const b    = n(m.breadthScore);
      const d    = n(m.depthOverallScore);
      const wmcq = n(m.weightedMcqScore);
      const items = [];
      if (cod  != null) items.push(`Codivium score: ${round0(cod)}`);
      if (b    != null) items.push(`Breadth: ${pct(b)}`);
      if (d    != null) items.push(`Depth avg: ${round0(d)}`);
      if (wmcq != null) items.push(`Weighted MCQ: ${round0(wmcq)}`);
      let verdict = 'Overview analysis will appear after data loads.';
      if (b != null && d != null) {
        if (b < 50 && d < 50) verdict = 'Both breadth and depth are developing — expand category coverage while increasing deliberate reps in 1–2 priority areas.';
        else if (b < 50)      verdict = 'Breadth is the current bottleneck — rotate new categories into your weekly plan.';
        else if (d < 50)      verdict = 'Depth is the current bottleneck — pick 1–2 categories and run focused reps until depth rises.';
        else                  verdict = 'Scores are balanced — maintain with small weekly rotations and use MCQ to close knowledge gaps.';
      }
      return { sections: [
        ...(items.length ? [section('Snapshot', bullets(...items))] : []),
        section('Assessment', p(verdict)),
      ]};
    }

    default:
      return 'Use the chart to find the weakest area first, then do deliberate practice: review mistakes → drill 10 items → re-check after 48h.';
  }
}

// ── Depth insight builder (mirrors vanilla buildDepthFallbackInsightFromOverride) ────
function buildDepthInsight(depthScores) {
  const items   = depthScores.filter(x => (Number(x.depth)||0) > 0);
  const all     = depthScores;
  const touched = items.slice().sort((a,b) => (Number(b.depth)||0) - (Number(a.depth)||0));
  const avail   = all.length;
  const touched_n = touched.length;
  const untouched = Math.max(0, avail - touched_n);
  const depths  = touched.map(x => Number(x.depth)||0).sort((a,b)=>a-b);

  function perc(arr, p) {
    if (!arr.length) return 0;
    const idx = (arr.length-1) * Math.min(1, Math.max(0, p));
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? arr[lo] : arr[lo]*(1-(idx-lo)) + arr[hi]*(idx-lo);
  }
  const pFocus = perc(depths, 0.80), pBuild = perc(depths, 0.50), pEmerg = perc(depths, 0.20);
  function band(v) {
    if (v <= 0) return 'Untouched';
    if (pFocus>0 && v >= pFocus) return 'Focus';
    if (pBuild>0 && v >= pBuild) return 'Building';
    return 'Emerging';
  }
  const focusCnt = touched.filter(x => band(Number(x.depth)||0) === 'Focus').length;
  const buildCnt = touched.filter(x => band(Number(x.depth)||0) === 'Building').length;
  const emergCnt = touched.filter(x => band(Number(x.depth)||0) === 'Emerging').length;
  const total = touched.reduce((a,b)=>a+(Number(b.depth)||0), 0);
  const top1 = total>0 ? (Number(touched[0]?.depth)||0)/total : 0;
  const top3 = total>0 ? touched.slice(0,3).reduce((a,b)=>a+(Number(b.depth)||0),0)/total : 0;
  const topCats = touched.slice(0,5).map(x => `${x.category} — depth ${(Math.round((Number(x.depth)||0)*10)/10).toFixed(1)} (${band(Number(x.depth)||0)})`);
  const oppCats = touched.slice().sort((a,b)=>(Number(a.depth)||0)-(Number(b.depth)||0)).slice(0,5)
    .map(x => `${x.category} — depth ${(Math.round((Number(x.depth)||0)*10)/10).toFixed(1)} (${band(Number(x.depth)||0)})`);
  const likely = (top1>=0.55||top3>=0.80)
    ? 'Your depth is concentrated in a small number of categories. Great for mastery — keep a light sweep elsewhere to avoid gaps.'
    : 'Your depth is spread across multiple categories. You may benefit from a short focus cycle to push 1–2 categories deeper.';
  return { sections: [
    section('Snapshot', bullets(
      `Touched: ${touched_n} / ${avail} (Untouched: ${untouched})`,
      `Focus: ${focusCnt}  Building: ${buildCnt}  Emerging: ${emergCnt}`,
      `Concentration: top-1 ${(top1*100).toFixed(0)}%  top-3 ${(top3*100).toFixed(0)}%`
    )),
    section('Top categories', bullets(...(topCats.length ? topCats : ['No depth data yet.']))),
    section('Opportunities', bullets(...(oppCats.length ? oppCats : ['Complete more categories to surface opportunities.']))),
    section('Likely explanation', p(likely)),
    section('Recommended next steps', bullets(
      'Pick 1–2 Focus categories for a 7–14 day cycle and aim to increase depth there.',
      'Keep a light sweep: 1 short session in 1–2 non-focus categories per week.',
      'Use micro → interview transfer in the same category to lock in depth with application.'
    )),
  ]};
}

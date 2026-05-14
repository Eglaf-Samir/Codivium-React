// mcq-shared/mcqQuality.js
//
// Single source of truth for the MCQ session quality label (per Doc Section
// 13 — "Foundation / Consolidation / Proficient / Fluent"). Both the
// summary screen and the backend payload builder import from here so the
// stored QualityLabel column and the on-screen badge can never disagree.
//
// Thresholds below are the platform-wide stable defaults. They were tuned
// for the current MCQ format (4 difficulty tiers, single/multi-correct,
// average question length 1–3 sentences). When adaptive practice is added,
// override `MCQ_QUALITY_THRESHOLDS` from the adaptive config and the rest
// of the app stays in sync.

export const MCQ_QUALITY_THRESHOLDS = {
  // Average response time in seconds (across non-peeked answers).
  // The label is the first row where `avgSeconds < maxAvgSec` matches.
  // `tone` is the badge / accent color (used by SummaryView + future
  // dashboard surfaces).
  tiers: [
    { label: 'Fluent',        maxAvgSec: 10, tone: 'rgba(94,200,172,0.95)',  hintTemplate: 'Decisive — avg {avg}s per question.' },
    { label: 'Proficient',    maxAvgSec: 20, tone: 'rgba(130,200,255,0.95)', hintTemplate: 'Confident — avg {avg}s per question.' },
    { label: 'Consolidation', maxAvgSec: 40, tone: 'rgba(246,213,138,0.95)', hintTemplate: 'Working through it — avg {avg}s per question.' },
    // Catch-all bottom tier — no maxAvgSec means "everything above the
    // previous threshold lands here".
    { label: 'Foundation',    maxAvgSec: Infinity, tone: 'rgba(255,150,170,0.95)',
      hintTemplate: 'Taking time — avg {avg}s per question. That is OK; consistency beats speed early on.' },
  ],
};

// Compute the quality summary from a list of answer entries (the same
// shape the quiz reducer stores in `state.answers`). Returns null when
// there is nothing to score (no non-peeked answers or no timing data).
export function computeMcqQuality(answers) {
  const times = (answers || [])
    .filter(a => !a.isPeek && typeof a.responseTimeSeconds === 'number')
    .map(a => a.responseTimeSeconds);
  if (!times.length) return null;
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const tier = MCQ_QUALITY_THRESHOLDS.tiers.find(t => avg < t.maxAvgSec)
    || MCQ_QUALITY_THRESHOLDS.tiers[MCQ_QUALITY_THRESHOLDS.tiers.length - 1];
  return {
    label: tier.label,
    tone:  tier.tone,
    hint:  tier.hintTemplate.replace('{avg}', avg.toFixed(1)),
    averageResponseTimeSeconds: Number(avg.toFixed(2)),
  };
}

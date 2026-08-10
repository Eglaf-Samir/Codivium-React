// src/insights/utils/validatePayload.js
// Lightweight runtime structural check for payloads arriving via
// window.CodiviumInsights.update(payload) / applyData(payload).
//
// Does NOT enforce a full JSON-schema — only checks what
// computeDashboardMetrics()/isDashboardEmpty() (utils/metrics.js) actually
// read, and accepts both the v2 shape (overall/combinedCoding/micro/
// interview/mcq) and a flat v1 shape (allocation/depthByCategory/
// convergenceHeatmap directly on the root object).
//
// Two severities:
//  - errors (valid: false): the payload has none of the recognised fields
//    at all (almost certainly not a dashboard payload — an error-response
//    body handed to applyData() by mistake), OR a recognised field has a
//    fundamentally wrong type (object expected, array expected). Both
//    should be treated as a failed update, not rendered.
//  - warnings (valid stays true): reserved for non-fatal issues. None
//    implemented yet — every check below is structural and therefore
//    fatal; this array exists so a future soft check has somewhere to go.

const RECOGNISED_TOP_LEVEL_KEYS = [
  'overall',
  'combinedCoding', 'coding', 'combined',
  'micro', 'interview', 'mcq',
  'allocation', 'depthByCategory',
  'convergenceHeatmap',
];

function isArr(v) { return Array.isArray(v); }
function isObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
function typeLabel(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }

// Structural check for any "allocation-shaped" block: combinedCoding,
// micro, interview, or the top-level payload itself (v1 flat shape).
// `source` may legitimately be `undefined` (block optional, not supplied) —
// that is NOT an error. If present at all, it must be an object, and any
// of its own allocation-shaped fields must have the right type.
function checkAllocationShapedBlock(source, label, errors) {
  if (source === undefined) return;
  if (!isObj(source)) {
    errors.push(`${label} must be an object (got ${typeLabel(source)})`);
    return;
  }
  if ('allocation' in source && !isArr(source.allocation)) {
    errors.push(`${label}.allocation must be an array (got ${typeLabel(source.allocation)})`);
  }
  if ('depthByCategory' in source && !isArr(source.depthByCategory)) {
    errors.push(`${label}.depthByCategory must be an array (got ${typeLabel(source.depthByCategory)})`);
  }
  const hm = source.convergenceHeatmap;
  if (hm !== undefined) {
    if (!isObj(hm)) {
      errors.push(`${label}.convergenceHeatmap must be an object (got ${typeLabel(hm)})`);
    } else {
      for (const k of ['categories', 'buckets', 'values']) {
        if (k in hm && !isArr(hm[k])) {
          errors.push(`${label}.convergenceHeatmap.${k} must be an array (got ${typeLabel(hm[k])})`);
        }
      }
    }
  }
}

/**
 * @param {*} payload
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateDashboardPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['payload is not an object'], warnings: [] };
  }

  // A genuinely empty object (`{}`, zero own keys) is the established
  // "no activity yet" signal (isDashboardEmpty({}) is true by design — see
  // utils/metrics.js) and is the shape a brand-new user's payload may
  // legitimately arrive as. Only reject *non-empty* objects that carry keys
  // but none of them look like any known dashboard field — e.g. an
  // error-response body such as { error: 'Unauthorized', statusCode: 401 }.
  const hasNoKeys = Object.keys(payload).length === 0;
  const hasRecognisedShape = hasNoKeys || RECOGNISED_TOP_LEVEL_KEYS.some(k => payload[k] !== undefined);
  if (!hasRecognisedShape) {
    return {
      valid: false,
      errors: [
        'payload has none of the recognised dashboard fields ' +
        '(overall/combinedCoding/micro/interview/mcq/allocation/...) — ' +
        'this does not look like a dashboard payload',
      ],
      warnings: [],
    };
  }

  const errors = [];
  const warnings = [];

  const overall = payload.overall;
  if (overall !== undefined) {
    if (!isObj(overall)) {
      errors.push(`overall must be an object (got ${typeLabel(overall)})`);
    } else if (overall.metrics !== undefined && !isObj(overall.metrics)) {
      errors.push(`overall.metrics must be an object (got ${typeLabel(overall.metrics)})`);
    }
  }

  // combinedCoding/coding/combined, micro, interview, AND the top-level
  // payload itself (the v1 flat shape). Always safe to run even for a v2
  // payload: it only checks allocation/depthByCategory/convergenceHeatmap
  // if THOSE keys exist directly on the object being checked, and a v2
  // payload's root object doesn't carry them (they live nested inside
  // combinedCoding etc.).
  checkAllocationShapedBlock(
    payload.combinedCoding ?? payload.coding ?? payload.combined,
    'combinedCoding', errors
  );
  checkAllocationShapedBlock(payload.micro, 'micro', errors);
  checkAllocationShapedBlock(payload.interview, 'interview', errors);
  checkAllocationShapedBlock(payload, 'payload', errors);

  const mcq = payload.mcq;
  if (mcq !== undefined) {
    if (!isObj(mcq)) {
      errors.push(`mcq must be an object (got ${typeLabel(mcq)})`);
    } else {
      const mcqBlock = mcq.mcq ?? mcq;
      const byDiff = mcqBlock?.byDifficulty;
      if (byDiff !== undefined && !isObj(byDiff)) {
        errors.push(`mcq(.mcq).byDifficulty must be an object (got ${typeLabel(byDiff)})`);
      }
      const byDiffEv = mcqBlock?.byDifficultyEvidence;
      if (byDiffEv !== undefined && !isObj(byDiffEv)) {
        errors.push(`mcq(.mcq).byDifficultyEvidence must be an object (got ${typeLabel(byDiffEv)})`);
      }
      const overallCorrect = mcqBlock?.overallCorrect;
      if (overallCorrect !== undefined && !isObj(overallCorrect)) {
        errors.push(`mcq(.mcq).overallCorrect must be an object (got ${typeLabel(overallCorrect)})`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

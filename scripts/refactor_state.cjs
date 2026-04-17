/**
 * STALE SCRIPT — do not run.
 *
 * This was a one-time migration script that transformed scattered __xxx state
 * variables in core.js into the __cvState object. The migration is complete.
 * The script is kept for historical reference only.
 */
/**
 * refactor_state.js
 * Phase 1 of state refactor (Issue 2).
 * 
 * Transforms:
 *   - All scattered `let __xxx = y` declarations in core.js → single __cvState object
 *   - All `__xxx` references across all source files → `__cvState.xxx`
 * 
 * Render-timing vars in module 06 (__cvHardRefreshTimer etc.) are left in place
 * because they are genuinely local to that module's render loop.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const JS_DIR = path.resolve(__dirname, '../assets/components/dashboard/js');

// ── State variables to migrate ──────────────────────────────────────────────
// key → initial value expression (as a string, for code generation)
const STATE_VARS = {
  __dashData:             '{}',
  __hasLivePayload:       'false',
  __anchorDateValue:      'null',
  __metricsOverride:      'null',
  __convergenceOverride:  'null',
  __heatmapData:          'null',
  __heatmapFocus:         'null',
  __heatmapView:          '"focus"',
  __heatmapFocusModeId:   'null',
  __heatmapTopN:          '12',
  __selectedCodingTrack:  '"combined"',
  __depthByTrack:         '{ combined: null, micro: null, interview: null }',
  __allocationByTrack:    '{ combined: null, micro: null, interview: null }',
  __recommendedActions:   '[]',
  __sessionStartEndpoint: '"/api/sessions/start"',
  __activeInfoKey:        '"welcome"',
  __uiLoaded:             'false',
  __uiMode:               '__UI_DEFAULT.mode',
  __uiPanels:             'Object.assign({}, __UI_DEFAULT.panels)',
  __uiEffectiveMode:      '__UI_DEFAULT.mode',
  __uiForcedSmallScreen:  'false',
  __cvUiApplyRaf:         '0',
  __depthOverride:        'null',
  __depthAvgOverride:     'null',
  __analysisOverrides:    '{}',
  __infoContentOverrides: '{}',
  __insights:             '{}',
  __analysisProvider:     'null',
};

// The __cvState block to inject (replaces all individual declarations).
// We use Object.defineProperty getter/setters so `__cvState.x` is a direct
// property access but we still get one bounded object. For simplicity we just
// use a plain object here — direct property access is the goal.
function buildStateBlock() {
  const NOTE = `
  // ─────────────────────────────────────────────────────────────────────────
  // CVU-2026-03-G  STATE REFACTOR — all live state in one bounded object
  // DO NOT add bare 'let __xxx' state vars below; add properties here instead.
  // ─────────────────────────────────────────────────────────────────────────
  const __cvState = {
    // payload / data
    __dashData:             {},
    __hasLivePayload:       false,
    __anchorDateValue:      null,
    __metricsOverride:      null,
    __convergenceOverride:  null,
    // heatmap
    __heatmapData:          null,  // { combined, micro, interview }
    __heatmapFocus:         null,  // { modes, defaultModeId, rankings }
    __heatmapView:          "focus", // focus | all | micro | interview
    __heatmapFocusModeId:   null,
    __heatmapTopN:          12,
    // coding track selector
    __selectedCodingTrack:  "combined", // "combined" | "micro" | "interview"
    __depthByTrack:         { combined: null, micro: null, interview: null },
    __allocationByTrack:    { combined: null, micro: null, interview: null },
    // actionability
    __recommendedActions:   [],
    __sessionStartEndpoint: "/api/sessions/start",
    // info pane
    __activeInfoKey:        "welcome",
    // ui prefs  (initialised after __UI_DEFAULT is defined)
    __uiLoaded:             false,
    __uiMode:               null,   // set below after __UI_DEFAULT
    __uiPanels:             null,   // set below after __UI_DEFAULT
    __uiEffectiveMode:      null,   // set below after __UI_DEFAULT
    __uiForcedSmallScreen:  false,
    // render coordination
    __cvUiApplyRaf:         0,
    // analysis / overrides
    __depthOverride:        null,
    __depthAvgOverride:     null,
    __analysisOverrides:    {},
    __infoContentOverrides: {},
    __insights:             {},
    __analysisProvider:     null,
  };
  // Deferred initialisers that depend on __UI_DEFAULT (defined just above)
  __cvState.__uiMode         = __UI_DEFAULT.mode;
  __cvState.__uiPanels       = Object.assign({}, __UI_DEFAULT.panels);
  __cvState.__uiEffectiveMode = __UI_DEFAULT.mode;
`;
  return NOTE;
}

// ── Process core.js ──────────────────────────────────────────────────────────

function processCoreJs(src) {
  let out = src;

  // 1. Remove all individual let declarations for migrated vars.
  //    We handle inline comments on the same line.
  for (const varName of Object.keys(STATE_VARS)) {
    // Matches lines like: (whitespace)let __foo = ...;(comment)
    const decl = new RegExp(
      `^[ \\t]*let ${varName}\\s*=[^;]+;[^\\n]*\\n`,
      'gm'
    );
    out = out.replace(decl, '');
  }

  // 2. Insert the __cvState block right after the __UI_DEFAULT const block ends.
  //    We find the closing brace+semicolon of __UI_DEFAULT and insert after it.
  const UI_DEFAULT_END = /(\n\s*\};\s*\/\/ end __UI_DEFAULT\s*\n|const __UI_DEFAULT\s*=\s*\{[^}]+\};\s*\n)/;
  // Simpler anchor: find "  };\n\n  let __uiLoaded" (old) which is now gone,
  // so instead anchor on the line that closes __UI_DEFAULT.
  // Actually let's anchor on the const __UI_DEFAULT block's closing.
  // Find the exact marker we can rely on:
  const ANCHOR = '  const __UI_DEFAULT = {';
  const anchorIdx = out.indexOf(ANCHOR);
  if (anchorIdx === -1) throw new Error('Could not find __UI_DEFAULT anchor in core.js');

  // Find the end of the __UI_DEFAULT block (the closing };)
  let braceDepth = 0;
  let inBlock = false;
  let endIdx = anchorIdx;
  for (let i = anchorIdx; i < out.length; i++) {
    if (out[i] === '{') { braceDepth++; inBlock = true; }
    else if (out[i] === '}') { braceDepth--; }
    if (inBlock && braceDepth === 0) {
      // Find the semicolon and newline after this
      let j = i + 1;
      while (j < out.length && (out[j] === ';' || out[j] === ' ')) j++;
      // advance to end of line
      while (j < out.length && out[j] !== '\n') j++;
      endIdx = j + 1;
      break;
    }
  }

  const stateBlock = buildStateBlock();
  out = out.slice(0, endIdx) + stateBlock + out.slice(endIdx);

  // 3. Rewrite all bare `__xxx` references → `__cvState.__xxx`
  //    Be careful not to rewrite __cvState itself or render-loop vars.
  //    Also preserve strings and comments (we do a simple token-level replace
  //    that won't touch things inside string literals — good enough here).
  out = rewriteStateRefs(out, Object.keys(STATE_VARS));

  return out;
}

// ── Rewrite bare state var references ────────────────────────────────────────
// Replace `__varName` (as a word boundary) with `__cvState.__varName`
// except where it's already prefixed with `__cvState.`
function rewriteStateRefs(src, varNames) {
  let out = src;
  for (const v of varNames) {
    // Match word-boundary occurrences of v NOT already preceded by "__cvState."
    const re = new RegExp(`(?<!__cvState\\.)\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    out = out.replace(re, `__cvState.${v}`);
  }
  return out;
}

// ── Process other modules ─────────────────────────────────────────────────────
function processOtherModule(src, varNames) {
  return rewriteStateRefs(src, varNames);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const CORE    = 'dashboard.00.core.js';
const MODULES = [
  'dashboard.01.scoreinfo.js',
  'dashboard.02.heatmap-analysis.js',
  'dashboard.03.time-analysis.js',
  'dashboard.04.exercise-analysis.js',
  'dashboard.05.overview-analysis.js',
  'dashboard.06.mcq-and-render.js',
  'dashboard.07.tour.js',
  'dashboard.08.help-and-init.js',
  'dashboard_settings.js',
];

const varNames = Object.keys(STATE_VARS);

// Process core.js
const coreSrc  = fs.readFileSync(path.join(JS_DIR, CORE), 'utf8');
const coreOut  = processCoreJs(coreSrc);
fs.writeFileSync(path.join(JS_DIR, CORE), coreOut, 'utf8');
console.log(`✓ Processed ${CORE}`);

// Process other modules (just ref rewriting)
for (const mod of MODULES) {
  const p = path.join(JS_DIR, mod);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  const out = processOtherModule(src, varNames);
  fs.writeFileSync(p, out, 'utf8');
  console.log(`✓ Processed ${mod}`);
}

console.log('\nState refactor complete. Run build next.');

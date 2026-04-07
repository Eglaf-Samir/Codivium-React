(function(){'use strict';
// dashboard.00.config.js — Constants and configuration (IIFE scope, no DOM).
// -----------------------------
// Config (extensible knobs)
// -----------------------------
//
// You may set window.CodiviumInsightsConfig BEFORE loading the dashboard bundle.
// Example:
//   window.CodiviumInsightsConfig = { refresh: { softMaxMs: 1800 } };
//
// Or at runtime:
//   CodiviumInsights.setConfig({ tooltip: { offsetX: 4, offsetY: 10 } });

const __cvConfig = (function(){
  try {
    const base = (typeof window !== 'undefined' && window.CodiviumInsightsConfig)
      ? window.CodiviumInsightsConfig
      : {};
    const cfg = {
      // Set to true to expose window.__cvDebug and window.CodiviumInsights.__state.
      // Never enable in production; integrators can override via window.CodiviumInsightsConfig.
      debug: base.debug === true,

      refresh: {
        // Max frequency of automatic refreshes (ms). Smaller = more responsive, larger = less thrash.
        softMaxMs: 2200,
        hardMaxMs: 2600,
        hardDelayMs: 480,

        // Global floor for refresh requests (ms), and how long we wait for scroll to settle (ms).
        minIntervalMs: 30000,
        scrollStableMaxMs: 2500,
      },
      resilience: {
        // Ignore resize/transition events briefly after a layout toggle (ms).
        ignoreAfterToggleMs: 180,

        // Ignore resize/transition events during initial mount (ms).
        initialIgnoreMs: 2600,
      },
      tooltip: {
        // Tiny chart tooltip (px)
        pad: 12,
        offsetX: 6,
        offsetY: 14,
        flipX: 10,
        flipY: 10,
      },
    };

    // Shallow merge user-provided top-level sections + nested leaf objects.
    const merge = (t, p) => {
      if (!p || typeof p !== 'object') return t;
      for (const k of Object.keys(p)){
        const v = p[k];
        if (v && typeof v === 'object' && !Array.isArray(v)){
          t[k] = t[k] || {};
          Object.assign(t[k], v);
        } else {
          t[k] = v;
        }
      }
      return t;
    };

    merge(cfg, base);
    if (typeof window !== 'undefined') window.CodiviumInsightsConfig = cfg;
    return cfg;
  } catch (_e) {
    return {
      refresh: { softMaxMs: 2200, hardMaxMs: 2600, hardDelayMs: 480, minIntervalMs: 30000, scrollStableMaxMs: 2500 },
      resilience: { ignoreAfterToggleMs: 180, initialIgnoreMs: 2600 },
      tooltip: { pad: 12, offsetX: 6, offsetY: 14, flipX: 10, flipY: 10 },
    };
  }
})();

(function(){
  try {
    if (typeof window === 'undefined') return;
    window.CodiviumInsights = window.CodiviumInsights || {};

    if (!window.CodiviumInsights.getConfig){
      window.CodiviumInsights.getConfig = function(){
        try { return JSON.parse(JSON.stringify(window.CodiviumInsightsConfig || __cvConfig)); }
        catch (_e) { return window.CodiviumInsightsConfig || __cvConfig; }
      };
    }

    if (!window.CodiviumInsights.setConfig){
      window.CodiviumInsights.setConfig = function(patch){
        try {
          if (!patch || typeof patch !== 'object') return;
          const cfg = window.CodiviumInsightsConfig || __cvConfig;
          for (const k of Object.keys(patch)){
            const v = patch[k];
            if (v && typeof v === 'object' && !Array.isArray(v)){
              cfg[k] = cfg[k] || {};
              Object.assign(cfg[k], v);
            } else {
              cfg[k] = v;
            }
          }
          window.CodiviumInsightsConfig = cfg;
        } catch (_e) {}
      };
    }
  } catch (_e) {}
})();

// dashboard.00a.utils.js — Debug helpers, DOM utilities, charts object, runtime alerts
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

// dashboard.00.core.js — Core: UI state, layout engine, presets, dock, applyDashboardData.
  // Debug / safety helpers
  const CI_DEBUG = (() => {
    try {
      if (/(?:\?|&)debug=1(?:&|$)/.test(location.search)) return true;
      return (localStorage && localStorage.getItem('ci_debug') === '1');
    } catch (e) { return false; }
  })();
  function ciLog(){ if (CI_DEBUG) console.log.apply(console, arguments); }
  function ciWarn(){ if (CI_DEBUG) console.warn.apply(console, arguments); }
  function ciErr(){ if (CI_DEBUG) console.error.apply(console, arguments); }

  // Expose a tiny debug controller in dev builds.
  // Usage: __cvDebug.enable() / __cvDebug.disable() / __cvDebug.toggle()
  try {
    if (__cvConfig.debug) window.__cvDebug = {
      enabled: CI_DEBUG,
      enable: function(){ try { localStorage.setItem('ci_debug','1'); } catch(_) {} this.enabled = true; location.reload(); },
      disable: function(){ try { localStorage.removeItem('ci_debug'); } catch(_) {} this.enabled = false; location.reload(); },
      toggle: function(){ (this.enabled ? this.disable() : this.enable()); }
    };
  } catch (_e) {}
  function safe(label, fn){
    try { return fn(); } catch (e) { ciErr(label, e); return undefined; }
  }

  /**
   * Element ID mapping table.
   * Keys are stable logical IDs used throughout the JS. Values are actual DOM element IDs.
   * This build uses an identity mapping; teams can remap values later without touching logic.
   */
  const IDS = {
    "mount": "ciMount",
    "allocFooterHint": "allocFooterHint",
    "anchorDate": "anchorDate",
    "avgAttemptsToAC": "avgAttemptsToAC",
    "breadthScore": "breadthScore",
    "categoryDetail": "categoryDetail",
    "categoryDetailShare": "categoryDetailShare",
    "categoryDetailSolved": "categoryDetailSolved",
    "categoryDetailTime": "categoryDetailTime",
    "codiviumScore": "codiviumScore",
    "convergenceHeatmap": "convergenceHeatmap",
    "depthAvg": "depthAvg",
    "depthChart": "depthChart",
    "exerciseAllocChart": "exerciseAllocChart",
    "exerciseTotalBadge": "exerciseTotalBadge",
    "firstTryPassRate": "firstTryPassRate",
    "infoPaneBody": "infoPaneBody",
    "infoPaneInterp": "infoPaneInterp",
    "infoPaneSub": "infoPaneSub",
    "infoPaneTitle": "infoPaneTitle",
    "interviewBreadthScore": "interviewBreadthScore",
    "mcqBreadthScore": "mcqBreadthScore",
    "mcqOverallFill": "mcqOverallFill",
    "mcqOverallMeta": "mcqOverallMeta",
    "mcqOverallPct": "mcqOverallPct",
    "medianTimeToAC": "medianTimeToAC",
    "microBreadthScore": "microBreadthScore",
    "timeDays7": "timeDays7",
    "timeLast7Avg": "timeLast7Avg",
    "timePlatformBadge": "timePlatformBadge",
    "timePlatformChart": "timePlatformChart",
    "timeThisWeek": "timeThisWeek",
    "weightedMcqScore": "weightedMcqScore",
    "codiviumPointsAll": "codiviumPointsAll",
    "codiviumPoints30": "codiviumPoints30",
    "efficiencyPtsPerHr": "efficiencyPtsPerHr",
    "depthOverallScore": "depthOverallScore",
    "microDepthScore": "microDepthScore",
    "interviewDepthScore": "interviewDepthScore",
  };

  /** @param {string} keyOrId */
  function resolveId(keyOrId){
    return IDS[keyOrId] || keyOrId;
  }



  /** @returns {HTMLElement|null} */
  function getMount(){
    return document.getElementById(IDS.mount);
  }

  /**
   * Per-mount state bucket (SPA-safe). Avoids window-level "Bound" flags and
   * keeps event handler references so they can be removed cleanly.
   *
   * @param {HTMLElement|null} mount
   * @returns {Record<string, any>}
   */
  function __cvMountState(mount){
    try {
      if (!mount) return {};
      if (!mount.__cvState || typeof mount.__cvState !== 'object'){
        Object.defineProperty(mount, '__cvState', { value: {}, configurable: true });
      }
      return mount.__cvState;
    } catch (e) {
      try { if (mount && mount.__cvState) return mount.__cvState; } catch (_) {}
      return {};
    }
  }

  /** @param {string} selector @returns {Element[]} */
  function qAll(selector){
    const mount = getMount();
    if (!mount) return [];
    return Array.prototype.slice.call(mount.querySelectorAll(selector));
  }

  /**
   * Dashboard data contract (TypeScript-style via JSDoc).
   * This defines the preferred production payload shape when passing real data.
   *
   * @typedef { date: string, minutes: number } TimePoint
   * @typedef { category: string, minutes: number, solved: number } AllocationRow
   * @typedef { categories: string[], buckets: string[], values: Array<Array<number|null>>, counts?: Array<Array<number>>, p25?: Array<Array<number|null>>, p50?: Array<Array<number|null>>, p75?: Array<Array<number|null>> } ConvergenceHeatmapData
   * @typedef {
   *   metrics?: {
   *     codiviumScore?: number,
   *     breadthOverall?: number,
   *     breadthMicro?: number,
   *     breadthInterview?: number,
   *     breadthMcq?: number,
   *     firstTryPassRate?: number,
   *     avgAttemptsToAC?: number,
   *     medianTimeToACMinutes?: number,
   *     weightedMcqScore?: number
   *     codiviumPointsAll?: number,
   *     codiviumPoints30?: number,
   *     efficiencyPtsPerHr?: number,
   *     depthOverall?: number,
   *     depthMicro?: number,
   *     depthInterview?: number
   *   },
   *   timeOnPlatform?: { daily: TimePoint[] },
   *   allocation?: AllocationRow[],
   *   convergenceHeatmap?: ConvergenceHeatmapData,
   *   mcq?: {
   *     byDifficulty: {
   *       basic: Record<string, number>,
   *       intermediate: Record<string, number>,
   *       advanced: Record<string, number>
   *     },
   *     overallCorrect?: { correct: number, total: number }
   *   },
   *   analysisOverrides?: Record<string, string>,
   *   infoContentOverrides?: Record<string, { title?: string, sub?: string, body?: string }>,
   *   analysisProvider?: (infoKey: string, data: any) => string
   * } DashboardData
   */

  // ---------- DOM helpers ----------
  const cv$ = (keyOrId) => document.getElementById(resolveId(keyOrId));
  const setText = (id, value) => {
    const el = cv$(id);
    if (!el) return;
    el.textContent = String(value);
  };
  const hasChartJs = () => (typeof Chart !== 'undefined');
  const safeInvoke = (label, fn) => {
    try { fn(); }
    catch (err) { console.error(`[Codivium] ${label} failed`, err); }
  };



  // -----------------------------
  // Runtime alerts + DOM validation (strict mode safety)
  // -----------------------------
  function __cvEnsureRuntimeAlertsHost(){
    const mount = getMount();
    if (!mount) return null;
    let host = mount.querySelector('.cvRuntimeAlerts');
    if (!host){
      host = document.createElement('div');
      host.className = 'cvRuntimeAlerts';
      mount.insertBefore(host, mount.firstChild);
    }
    return host;
  }

  function __cvAddRuntimeAlert(code, message, level){
    const host = __cvEnsureRuntimeAlertsHost();
    if (!host) return;
    const c = String(code || 'alert');
    let item = host.querySelector('[data-code="' + c.replace(/"/g,'') + '"]');
    if (!item){
      item = document.createElement('div');
      item.className = 'cvRuntimeAlert' + (level ? (' is-' + String(level)) : '');
      item.setAttribute('data-code', c);
      host.appendChild(item);
    }
    item.textContent = String(message || '');
  }

  function __cvClearRuntimeAlert(code){
    const mount = getMount();
    if (!mount) return;
    const host = mount.querySelector('.cvRuntimeAlerts');
    if (!host) return;
    const c = String(code || '');
    const item = host.querySelector('[data-code="' + c.replace(/"/g,'') + '"]');
    if (item) item.remove();
    if (!host.children.length) host.remove();
  }

  function __cvValidateDom(){
    const missing = [];
    const mount = getMount();
    if (!mount) missing.push('#' + resolveId('mount'));

    const req = ['#insightsForm', '.insights-layout', '#infoPane'];
    if (mount){
      req.forEach((sel) => {
        try { if (!mount.querySelector(sel)) missing.push(sel); } catch (_e) {}
      });
    }

    if (missing.length){
      __cvAddRuntimeAlert('dom_missing', 'Dashboard DOM is missing required elements: ' + missing.join(', '), 'warn');
      ciWarn('DOM missing required elements:', missing);
      return false;
    }

    __cvClearRuntimeAlert('dom_missing');
    return true;
  }

// ---------- Chart instances ----------
  const charts = {
    depth: null,
    timePlatform: null,
    exerciseDonut: null,
    mcqEasy: null,
    mcqMedium: null,
    mcqHard: null,
  };
  const destroyChart = (key) => {
    const ch = charts[key];
    if (!ch) return;
    // Clear per-canvas flags so listeners rebind to the fresh chart instance.
    try { if (ch.canvas) ch.canvas.__cvTinyTipBound = false; } catch (_) {}
    try { if (ch.canvas) ch.canvas.__cvDepthClickBound = false; } catch (_) {}
    try { ch.destroy(); } catch (_) {}
    charts[key] = null;
  };

  // ---------- Metric explanations ----------
  const INFO_CONTENT = {
    avgAttemptsToAC: {
      title: "Avg attempts",
      sub: "Average submissions required for success.",
      body:
        "What it is\\nAverage number of submission attempts before reaching an accepted solution.\\n\\nWhat it shows\\n• Debugging efficiency\\n• How often you need multiple iterations\\n\\nHow to use it\\nAim to reduce attempts by improving pre-submit checks and adding structured debugging per change.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."
    },
    mcqBreadthScore: {
      title: "MCQ breadth",
      sub: "Coverage of categories tested via MCQs.",
      body:
        "What it is\\nBreadth for MCQ practice: how widely you’ve tested knowledge across categories.\\n\\nWhat it shows\\n• Whether you are repeatedly quizzing the same topics\\n\\nHow to use it\\nUse MCQ breadth to ensure knowledge coverage matches your coding coverage (and reveals hidden gaps).\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."
    },
    mcqHard: {
      title: "MCQ — Advanced",
      sub: "High-signal interview-style knowledge checks.",
      body:
        "What it is\\nAdvanced-difficulty MCQ scores per category.\\n\\nWhat it shows\\n• Whether you can reason under pressure and subtle edge cases\\n\\nHow to use it\\nUse Advanced lows to target revision + timed drills. Don’t chase hard if Basic/Intermediate is weak.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."
    },
    mcqEasy: {
      title: "MCQ — Basic",
      sub: "Foundational knowledge by category.",
      body:
        "What it is\\nBasic-difficulty MCQ scores per category.\\n\\nWhat it shows\\n• Which fundamentals are solid vs shaky\\n\\nHow to use it\\nIf Basic is low in any category, prioritize fixing definitions/patterns before harder drills.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."
    },
    panel_exercise: {
      title: "Exercise time by category",
      sub: "Where your coding time is going.",
      body:
        "What it is\\nA ranked breakdown of time spent solving exercises by category.\\n\\nWhat it shows\\n• Minutes per category (ranked)\\n• Share of total time (Share toggle)\\n• Category snapshot (time, share, completed)\\n\\nHow to use it\\nClick a bar to focus a category. Use Share to see distribution. Use ALL to clear selection. Rebalance if one category dominates for too long.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."
    },
    tour_layout_presets: {
      title: "Layout Presets",
      sub: "Switch between dashboard views instantly.",
      body: "What they are\nThe buttons on the left edge of the screen are layout presets. Each one configures the dashboard to show a different combination of panels.\n\nWhat they show\n• Full Dashboard — all panels visible\n• Coding Core — scores, heatmap, depth, time (no MCQ)\n• Heatmap Focus — just the convergence heatmap\n• Scores Only — scores panel in expanded tri-track view\n• MCQ Only — full-height MCQ performance chart\n• Summary View — info and analysis pane only\n\nHow to use them\nClick any preset to switch instantly. The active preset is highlighted in gold. Your preferred layout is saved and restored on the next visit."
    },
    tour_info_toggle: {
      title: "Info Panel Toggle",
      sub: "Show or hide the analysis side panel.",
      body: "What it is\nThe Info button (top-right of the dashboard header) opens and closes the info and analysis panel on the right side of the screen.\n\nWhat it shows\nWhen open: personalised analysis, score explanations, actionable recommendations, and scoring detail for the last metric or panel you clicked.\n\nHow to use it\nClick any i button on a metric or panel, then use this toggle to open the panel if it isn't already visible. The button is gold when the panel is open."
    },
    tour_i_buttons: {
      title: "Info (i) Buttons",
      sub: "Open detailed analysis for any metric.",
      body: "What they are\nSmall i buttons appear next to every score chip and panel heading. Clicking one loads the explanation and your personalised analysis for that metric into the info panel on the right.\n\nWhat they show\n• What the metric measures and how it is calculated\n• What your current value means\n• Concrete actions to improve it\n\nHow to use them\nClick the i on any score you want to understand better. Use the back/forward arrows inside the info panel to navigate between explanations you have opened."
    },
    tour_cta_buttons: {
      title: "Action Buttons (CTAs)",
      sub: "Start a targeted practice session from any panel.",
      body: "What they are\nEach analytics panel has a single action button at the bottom. It pre-selects a practice session based on what that panel is currently telling you.\n\nExamples\n• Scores panel → a session targeting your weakest overall category\n• Heatmap panel → practice on the lowest early-convergence categories\n• Time panel → a short consistency session for today\n• MCQ panel → a quiz targeting your weakest difficulty tier\n\nHow they work\nClicking a CTA sends your current panel state to the backend, which selects the best session parameters and returns a direct session link. You don't need to configure anything manually."
    },
    tour_faq: {
      title: "Dashboard FAQ",
      sub: "Answers to common questions about the dashboard.",
      body: "What it covers\n• How each score is calculated\n• What the different bands mean\n• How breadth, depth, and convergence relate to each other\n• How to interpret low or stalled scores\n• How the heatmap buckets work\n\nHow to use it\nOpen the FAQ whenever a metric value surprises you or you want to understand the methodology behind a score. The FAQ also includes the full KaTeX scoring specification."
    },
    tour_glossary: {
      title: "Glossary of Terms",
      sub: "Definitions for every term used in the dashboard.",
      body: "What it covers\n• All score names and abbreviations\n• Breadth, depth, convergence, and efficiency\n• Track terminology (micro, interview, combined)\n• Difficulty tiers (basic, intermediate, advanced)\n• Attempt, session, and first-try definitions\n\nHow to use it\nOpen the Glossary when a term in a score explanation or the FAQ is unfamiliar. The Glossary and FAQ cross-reference each other."
    },
    welcome: {
      title: "Welcome to Performance Insights",
      sub: "How to read this dashboard.",
      body:
        "What it is\\nA performance dashboard that summarizes your practice across Codivium (coding + MCQ).\\n\\nWhat it shows\\n• Coverage (breadth) and focus (depth)\\n• Time and consistency patterns\\n• MCQ performance by difficulty\\n• Convergence quality via the heatmap\\n\\nHow to use it\\nStart at Scores → check Heatmap for weakest categories → use Allocation to rebalance time → use MCQ to close knowledge gaps.\\n\\nAction buttons (CTAs)\\nEach panel includes a single action button. It launches a short, pre-selected practice session that targets what that panel is telling you. The dashboard sends intent; the backend selects the exact items and returns a session link.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation.\n\nTip\nDuring the tour (and when clicking any i icon), your personalized analysis appears in the right-side info panel."
    },
    panel_scores: {
      title: "Scores",
      sub: "High-level summary of practice coverage and performance.",
      body:
        "What it is\nA compact group of scores that summarizes your current practice state.\n\n" +
        "What it shows\n• Breadth: coverage across practice categories\n• Depth Avg: how concentrated your practice is\n• CODIVIUM: blended overall index\n• Weighted MCQ: difficulty-weighted MCQ signal\n\n" +
        "How to use it\nUse Breadth to avoid blind spots, Depth to build mastery, and CODIVIUM for weekly trend."
    },
    breadthScore: {

          title: "Overall breadth",

          sub: "Coverage across categories.",

          body:

            "What it is\\nA coverage score: how many categories you have touched recently.\\n\\nWhat it shows\\n• Whether you are neglecting topics\\n• Whether your practice is diversified\\n\\nHow to use it\\nUse breadth to avoid blind spots. During deep-focus cycles, keep a weekly sweep of other categories.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."

        },
    codiviumScore: {

          title: "Overall Codivium score",

          sub: "A blended overall index for trending.",

          body:

            "What it is\nA mastery score (0–100) computed from breadth (B) and depth (D) using a harmonic mean: CodiviumScore = 2BD/(B+D).\n\nWhat it shows\n• Balanced progress across categories (coverage + depth)\n• A score that cannot be inflated by breadth alone or depth alone\n\nHow to use it\nTrack weekly. If it stalls, check Overall Breadth (B) and Overall Depth (D) to see what is limiting you.\n\nAnalysis of your results\nUse the Analysis panel below for a tailored interpretation."

        },
    firstTryPassRate: {

          title: "First-try pass",

          sub: "Correctness on the first submission.",

          body:

            "What it is\\nThe % of solved exercises where you passed all tests on the first submission.\\n\\nWhat it shows\\n• How often you are correct without iteration\\n• Indicator of planning and edge-case discipline\\n\\nHow to use it\\nIf low, slow down pre-submit: write edge cases first and test hypotheses systematically.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."

        },
    medianTimeToAC: {

          title: "Median time",

          sub: "Typical time-to-correct for solved exercises.",

          body:

            "What it is\\nMedian minutes to reach a correct solution for solved exercises.\\n\\nWhat it shows\\n• Typical solve speed (robust to outliers)\\n\\nHow to use it\\nIf high, drill patterns and break problems into steps. Once correctness stabilizes, add timed sets.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."

        },
    panel_mcq: {

          title: "MCQ performance",

          sub: "Knowledge-check performance across difficulties.",

          body:

            "What it is\\nThree bar charts summarizing MCQ scores by category for Basic, Intermediate, and Advanced difficulty.\\n\\nWhat it shows\\n• Category-level MCQ strengths/weaknesses\\n• Difficulty progression\\n• A weighted MCQ score summary\\n\\nHow to use it\\nStart with the lowest Advanced bars, then Intermediate. Use Basic to fix fundamentals. Re-test after spaced repetition.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."

        },
    mcqMedium: {

          title: "MCQ — Intermediate",

          sub: "Applied knowledge by category.",

          body:

            "What it is\\nIntermediate-difficulty MCQ scores per category.\\n\\nWhat it shows\\n• How well you can apply fundamentals under mild complexity\\n\\nHow to use it\\nUse Intermediate to bridge from knowledge → execution: review mistakes, then do short practice sets in weak categories.\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."

        },
  
    panel_heatmap: {
      title: "Convergence heatmap",
      sub: "How quickly test pass% improves across attempts.",
      body:
        "What it is\nA heatmap showing average unit test pass% at each attempt bucket (A1→A5).\n\n\n\nA5 label\nIn this dashboard, the A5 column is the 5th-attempt bucket (it does not mean 6+ attempts)." +
        "What it shows\n• Fast convergence: values rise quickly by A2/A3\n• Debugging efficiency: steep early improvements\n• Stagnation: little change across attempts\n\n" +
        "How to use it\nStart with categories that stay low after A2. Review patterns, then drill targeted exercises until A1/A2 rises."
    },

    interviewBreadthScore: {


          title: "Interview breadth",


          sub: "Coverage across interview-prep categories.",


          body:


            "What it is\\nBreadth specifically for interview prep.\\n\\nWhat it shows\\n• Whether you’re covering the interview-relevant topic set\\n\\nHow to use it\\nIf low, prioritize missing high-frequency categories (e.g., Trees/Graphs/DP depending on your target roles).\\n\\nAnalysis of your results\\nUse the Analysis panel below for a tailored interpretation."


        },
    codiviumPointsAll: {
      title: "Codivium Points (all-time)",
      sub: "Uncapped progression signal.",
      body:
        "What it is\nUncapped points that reward verified volume over your full history.\n\nHow it’s computed\nPoints_all = CodingPoints_all + RedoPoints_all + P_mcq*sqrt(U_all).\nDefaults: P0=4.0, Predo=2.5, Pmcq=0.8, redo spacing G=7 days.\n\nHow to use it\nUse this to measure accumulation and persistence. It is intentionally not capped and should be read alongside Codivium Score (mastery)."
    },
    codiviumPoints30: {
      title: "Codivium Points (30D)",
      sub: "Recent momentum (last 30 days).",
      body:
        "What it is\nUncapped points accrued in the last 30 days (coding solves + redos).\n\nHow it’s computed\nPoints_30 = CodingPoints_30 + RedoPoints_30.\n\nHow to use it\nUse this as a momentum indicator. If Points_30 is rising but Codivium Score is flat, you may be accumulating volume without balanced breadth/depth."
    },
    efficiencyPtsPerHr: {
      title: "Efficiency (pts/hr)",
      sub: "Rate of producing verified outcomes.",
      body:
        "What it is\nAn uncapped rate metric: pts/hr = 60 * (Σ w_i q_i)/(ε + Σ w_i t_i).\n\nNotes\n• Uses accepted coding outcomes only.\n• Designed so time is not double-counted.\nDefault: ε=1 minute.\n\nHow to use it\nUse this to check whether you’re converting time into verified outcomes efficiently."
    },
    depthOverallScore: {
      title: "Overall Depth (D)",
      sub: "Overall coding depth used in Codivium Score.",
      body:
        "What it is\nOverall depth D used in the mastery score: D = 0.5*D_micro + 0.5*D_interview.\n\nWhat it shows\n• How much verified coding evidence you have accumulated (mapped to 0–100).\n\nHow to use it\nIf D is low, deepen 1–2 weak categories while maintaining breadth."
    },
    microDepthScore: {
      title: "Micro Depth",
      sub: "Depth within the Micro track.",
      body:
        "What it is\nDepth D_micro derived from recency-weighted evidence in Micro challenges.\n\nHow to use it\nUse this to confirm your micro practice is building real depth, not just scattered exposure."
    },
    interviewDepthScore: {
      title: "Interview Depth",
      sub: "Depth within the Interview track.",
      body:
        "What it is\nDepth D_interview derived from recency-weighted evidence in Interview prep.\n\nHow to use it\nUse this to validate that your depth transfers to interview-style tasks."
    },


};

const INFO_DETAIL = {
  welcome: {
    body: "What it is\nA guided overview of this dashboard and how to use it.\n\nWhat it shows\n• The purpose of each panel\n• How the panels connect (time → allocation → convergence → MCQ)\n\nHow to interpret\nUse this page as a feedback loop: (1) consistency (time), (2) focus (allocation/depth), (3) efficiency (convergence), (4) knowledge (MCQ).\n\nHow to use it\nClick any i icon for that panel/metric. Use the Analysis panel for your personalized interpretation.",
    agg: ""
  },
  panel_scores: {
    body: "What it is\nA compact snapshot of mastery (Codivium Score), progression (Points), rate (Efficiency), and supporting signals.\n\nWhat it shows\n• Codivium Score (0–100): mastery via balance of breadth (B) and depth (D)\n• Codivium Points (all / 30D): uncapped progression\n• Efficiency (pts/hr): rate of producing verified outcomes\n• Breadth by track (Micro / Interview / MCQ)\n• Solve quality (first‑try pass, avg attempts, median time)\n• Weighted MCQ score (0–100 diagnostic)\n\nHow to interpret\nUse Codivium Score for mastery, Points for volume, and Efficiency for conversion of time into verified outcomes.\n\nHow to use it\nIf Codivium Score stalls: inspect B vs D and then drill the shallowest categories while keeping breadth moving.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Aggregation\n• Codivium Score: CodiviumScore = 2BD/(B+D), where B is a weighted combination of track breadths and D is a weighted combination of coding depth.\n• Codivium Points: uncapped; all-time and last-30-days variants.\n• Efficiency: pts/hr based on accepted coding outcomes; uses a stabilizer ε=1 minute.\n• Breadth/Depth: evidence-based and recency-weighted (half-life default 15 days)."
  },
  codiviumScore: {
    body: "What it is\nA mastery score capped at 0–100, computed as the harmonic mean of overall breadth B and overall depth D.\n\nWhat it shows\n• Balanced progress (coverage + depth)\n• A score that cannot be inflated by breadth alone or depth alone\n\nHow to interpret\nIf the score is limited, check whether B (coverage/balance/confidence) or D (coding depth) is the bottleneck.\n\nHow to use it\nTrack weekly. Use Depth by category + Heatmap to decide what to practice next.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "CodiviumScore = 2BD/(B+D) with CodiviumScore=0 if B=0 or D=0.\nB = 0.4*B_micro + 0.4*B_interview + 0.2*B_mcq.\nD = 0.5*D_micro + 0.5*D_interview.\nBreadth/Depth are evidence-based and recency-weighted; see the scoring specification for defaults."
  },
  breadthScore: {
    body: "What it is\nOverall breadth across Codivium categories.\n\nWhat it shows\n• How widely you’re covering the topic universe.\n\nHow to interpret\nLow breadth = blind spots risk. High breadth = strong coverage (but ensure you also build depth).\n\nHow to use it\nDuring deep-focus cycles, keep at least a weekly sweep across other categories.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Breadth is computed as: (# categories with activity) / (# categories in universe) × 100.\nActivity can be defined as: solved exercise, attempted exercise, or MCQ attempt (depending on your scoring config)."
  },
  microBreadthScore: {
    body: "What it is\nBreadth coverage for Micro Challenges.\n\nWhat it shows\n• Whether your micro practice spans many categories or stays narrow.\n\nHow to interpret\nLow = narrow training (fast depth but gaps). High = agile coverage.\n\nHow to use it\nRotate 1–2 new categories weekly if this stays low.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Computed like overall breadth but restricted to Micro Challenge sessions only.\nCategories are counted if there is qualifying activity in that track."
  },
  interviewBreadthScore: {
    body: "What it is\nBreadth coverage for Interview Prep exercises.\n\nWhat it shows\n• Whether you’re covering the interview topic set.\n\nHow to interpret\nIf this is low, you may be missing high-frequency interview topics.\n\nHow to use it\nAdd missing categories into your weekly plan and re-check after 1–2 cycles.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Computed like overall breadth but restricted to Interview Prep sessions only."
  },
  mcqBreadthScore: {
    body: "What it is\nBreadth of categories you’ve tested via MCQs.\n\nWhat it shows\n• Whether you’re repeatedly quizzing the same topics.\n\nHow to interpret\nLow MCQ breadth often hides conceptual gaps.\n\nHow to use it\nExpand MCQ breadth until it roughly matches your coding breadth.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Computed as the proportion of categories with ≥1 MCQ attempt (in the configured horizon)."
  },
  firstTryPassRate: {
    body: "What it is\nThe % of solved exercises accepted on the first submission.\n\nWhat it shows\n• Planning quality\n• Edge-case discipline\n\nHow to interpret\nLow = you’re iterating a lot; focus on pre-submit checks. High = strong correctness.\n\nHow to use it\nBefore submitting: list edge cases, sanity-check complexity, and run mental tests.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "First‑try pass = (count of solved sessions with attempts==1) / (count of solved sessions) × 100.\nAttempts are counted as the number of submissions before accepted."
  },
  avgAttemptsToAC: {
    body: "What it is\nAverage number of submissions required to reach an accepted solution.\n\nWhat it shows\n• Debugging efficiency\n• Iteration discipline\n\nHow to interpret\nHigh values indicate repeated trial-and-error. Aim for fewer, higher-quality iterations.\n\nHow to use it\nUse structured debugging: isolate hypothesis → change one thing → re-test.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Avg attempts = mean(attemptCount) over solved sessions.\nAttemptCount is the number of submissions until accepted."
  },
  medianTimeToAC: {
    body: "What it is\nMedian minutes to reach a correct solution for solved exercises.\n\nWhat it shows\n• Typical solve speed (robust to outliers)\n\nHow to interpret\nIf median is high, you may be missing patterns or spending time debugging.\n\nHow to use it\nBuild pattern fluency, then add timed sets once correctness is stable.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Median time is computed over solved sessions using time-to-accepted minutes.\nIf you track attempt timestamps, time-to-accepted is derived from session start to accepted submission."
  },
  panel_depth: {
    body: "What it is\nA per-category depth score showing how strongly you’re building mastery.\n\nWhat it shows\n• Where your practice is concentrated\n• Which categories have sustained progress\n\nHow to interpret\nDepth should be intentionally uneven: 1–2 focus categories high, others maintained.\nIf everything is low, you’re sampling without building mastery.\n\nOutliers (relative to you)\nThe Analysis panel may call out unusually high/low categories vs your own baseline (robust median/MAD), only when there’s enough evidence.\n\nHow to use it\nPick a focus cycle (7–14 days). Push depth in 1–2 categories, keep a light sweep elsewhere.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Depth is computed server-side from solved sessions by category.\nTypical ingredients: solved count, difficulty weights, and diminishing returns scaling so depth can grow over time without being capped by category size.\n\nOutliers\nWhen available, outliers are identified using robust statistics (median + MAD) and evidence thresholds to avoid over-interpreting small samples."
  },
  panel_heatmap: {
    body: "What it is\nA convergence heatmap showing average unit-test pass% at each attempt bucket (A1→A5).\n\nWhat it shows\n• Fast convergence: values rise quickly by A2/A3\n• Debugging efficiency: steep early improvements\n• Stagnation: little change across attempts\n\nHow to interpret\nHigh A1/A2 means you’re closer to correct early. If values stay low after A2, you likely need pattern review or better edge-case coverage.\n\nHow to use it\nStart with categories that stay low after A2. Review mistakes → drill targeted exercises → re-check after 48h.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "For each solved session:\n1) For each submission attempt, compute passRatio = testsPassed / testsTotal.\n2) Bucket attempts into A1..A5 by attempt index (1st, 2nd, 3rd, 4th, 5th+).\n3) Aggregate per category per bucket (mean passRatio; optional counts/percentiles).\nCells are displayed as passRatio × 100."
  },
  panel_time: {
    body: "What it is\nA time-series of your active practice minutes on Codivium.\n\nWhat it shows\n• Daily/weekly cadence\n• Short/medium/long trend (7D/30D/90D/YTD)\n\nHow to interpret\nStable weekly totals beat spikes. If 7D is low but 30D is ok, you’re drifting recently.\n\nHow to use it\nUse 7D to build habit, 30D/90D to assess momentum. Switch to Weekly to smooth noise.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Daily minutes are summed per calendar day from the time values passed into the dashboard (coding + MCQ).\nWeekly view groups by week-start (typically Monday) and sums daily minutes.\nRanges:\n• 7D/30D/90D = rolling windows ending today.\n• YTD = from Jan 1 to today.\n\nWhat is included today\n• Coding minutes from all coding sessions (solved or not), as provided by your session timers.\n• MCQ minutes when provided.\n\nNot included yet\nTutorial reading time and mini-project work will appear here once those activities start reporting time."
  },
  panel_exercise: {
    body: "What it is\nA ranked breakdown of time spent solving exercises by category.\n\nWhat it shows\n• Minutes per category (ranked)\n• Share of total time (Share toggle)\n• Solved count per category\n\nHow to interpret\nIf one category dominates for weeks, you may be neglecting others. If everything is flat, pick a focus.\n\nHow to use it\nClick a bar to focus a category. Use Share to see distribution. Use ALL to clear selection.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Minutes are summed over all coding sessions by category (solved or not), using the time values passed into the dashboard.\nSolved is the count of accepted (AC) solves in that category.\nShare = categoryMinutes / totalMinutes × 100.\nRanking is descending by minutes."
  },
  panel_mcq: {
    body: "What it is\nA summary of MCQ performance by category and difficulty.\n\nWhat it shows\n• Basic / Intermediate / Advanced scores per category\n• Where knowledge breaks at higher difficulty\n\nHow to interpret\nIf Basic is low, fix fundamentals first. If only Advanced is low, practice edge cases and reasoning.\n\nHow to use it\nStart from the weakest category at the hardest sustainable level. Re-check after spaced repetition.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Per category and difficulty, the dashboard shows the average percent correct (0–100).\nOverall MCQ progress bar uses correct/total across the configured question bank (or attempted total if bank total unknown)."
  },
  mcqEasy: {
    body: "What it is\nBasic MCQ performance per category.\n\nWhat it shows\n• Foundational knowledge strength by topic\n\nHow to interpret\nLow Basic scores indicate fundamental gaps that will hurt coding speed and correctness.\n\nHow to use it\nReview notes, do small practice sets, then re-test.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Basic = difficulty level 1. Values are average percent correct per category.\nIf question counts are known, averages can be weighted by question count."
  },
  mcqMedium: {
    body: "What it is\nIntermediate MCQ performance per category.\n\nWhat it shows\n• Applied knowledge under mild complexity\n\nHow to interpret\nIf Intermediate is low while Basic is ok, focus on applying patterns, not memorizing facts.\n\nHow to use it\nDrill mistakes into spaced repetition and test again.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Intermediate = difficulty level 2. Values are average percent correct per category."
  },
  mcqHard: {
    body: "What it is\nAdvanced MCQ performance per category.\n\nWhat it shows\n• Interview-style reasoning and edge cases\n\nHow to interpret\nLow Advanced scores usually mean weak edge-case reasoning or missing pattern variants.\n\nHow to use it\nTarget the lowest categories first; pair revision with timed coding drills.\n\nAnalysis of your results\nYour personalized interpretation appears below.",
    agg: "Advanced = difficulty level 3. Values are average percent correct per category."
  },
};



  function numFromEl(id){
    const el = cv$(id);
    if (!el) return null;
    const t = (el.textContent || "").trim();
    const n = parseFloat(t.replace(/[^0-9.\-]/g,""));
    return Number.isFinite(n) ? n : null;
  }

  /* interpretMetric(key) — maps a DOM metric key to a plain-English coaching string.
   Each case reads current score values from the DOM and returns the most relevant tip.
   Key groups:
     Breadth/depth   : breadthScore, depthAvg, panel_scores, panel_depth
     MCQ             : weightedMcqScore, panel_mcq, firstTryPassRate, avgAttemptsToAC
     Time/speed      : medianTimeToAC, panel_time
     Exercise volume : panel_exercise, panel_overview
     Track-specific  : microBreadthScore, interviewBreadthScore, mcqBreadthScore
     Summary score   : codiviumScore
*/
function interpretMetric(key){
    const breadth = numFromEl("breadthScore");
    const depthAvg = numFromEl("depthAvg");
    const wmcq = numFromEl("weightedMcqScore");
    const firstTry = numFromEl("firstTryPassRate");
    const avgAttempts = numFromEl("avgAttemptsToAC");
    const medTime = numFromEl("medianTimeToAC");
    const microB = numFromEl("microBreadthScore");
    const interviewB = numFromEl("interviewBreadthScore");
    const mcqB = numFromEl("mcqBreadthScore");
    const cod = numFromEl("codiviumScore");

    switch(key){
      case "breadthScore":
      case "panel_scores":
        if (breadth != null && depthAvg != null){
          if (breadth < 40 && depthAvg > 70) return "Deep-focus cycle: great for mastery, but add a weekly sweep to prevent blind spots.";
          if (breadth > 70 && depthAvg < 50) return "High breadth, low depth: choose 1–2 categories and run deliberate reps to build depth.";
          if (breadth > 70 && depthAvg > 70) return "Excellent balance: wide coverage and deep focus. Maintain with small weekly rotations.";
          return "Aim for balance: breadth prevents gaps; depth builds mastery in priority topics.";
        }
        return "Click metrics after values load for a tailored interpretation.";
      case "depthAvg":
      case "panel_depth":
        if (depthAvg != null){
          if (depthAvg < 45) return "Depth is low: time is spread thin. Pick a focus category and increase deliberate reps.";
          if (depthAvg < 70) return "Depth is moderate: push one category higher for a week, then rotate.";
          return "Depth is high: strong focus. Periodically broaden breadth to prevent gaps.";
        }
        return "Depth interpretation will appear after values load.";
      case "weightedMcqScore":
      case "panel_mcq":
        if (wmcq != null){
          if (wmcq < 55) return "MCQ below target: review fundamentals and drill weakest Medium/Hard categories.";
          if (wmcq < 75) return "MCQ improving: focus on lowest Hard bars and revise mistakes into spaced repetition.";
          return "MCQ strong: maintain with occasional hard drills; focus more on coding execution speed.";
        }
        return "Weighted MCQ interpretation will appear after values load.";
      case "firstTryPassRate":
        if (firstTry != null){
          if (firstTry < 30) return "Low first-try correctness: plan more, write edge cases first, and slow down pre-submit.";
          if (firstTry < 55) return "Improving first-try rate: add a quick checklist and practice explaining approach.";
          return "Excellent first-try: now optimize speed under harder difficulty.";
        }
        return "Interpretation will appear after values load.";
      case "avgAttemptsToAC":
        if (avgAttempts != null){
          if (avgAttempts > 3.5) return "High attempts-to-success: add debugging structure and test hypotheses per change.";
          if (avgAttempts > 2.2) return "Moderate attempts: improve pre-submit checks and edge-case reasoning.";
          return "Great attempts-to-success: increase difficulty to keep progressing.";
        }
        return "Interpretation will appear after values load.";
      case "medianTimeToAC":
        if (medTime != null){
          if (medTime > 45) return "High median time: drill patterns and break problems into steps to build speed.";
          if (medTime > 25) return "Moderate speed: practice faster mapping from problem → pattern once correctness is stable.";
          return "Strong speed: maintain with timed sets and harder categories.";
        }
        return "Interpretation will appear after values load.";

      case "microBreadthScore":
        if (microB != null){
          if (microB < 30) return "Micro breadth is low: rotate new categories in micro challenges to build agility.";
          if (microB < 60) return "Micro breadth is moderate: keep rotating weekly to prevent micro blind spots.";
          return "Micro breadth is strong: maintain while pushing depth in 1 focus category.";
        }
        return "Micro breadth interpretation will appear after values load.";
      case "interviewBreadthScore":
        if (interviewB != null){
          if (interviewB < 30) return "Interview breadth is low: add missing high-frequency interview topics into your weekly plan.";
          if (interviewB < 60) return "Interview breadth is moderate: schedule a weekly sweep to cover remaining categories.";
          return "Interview breadth is strong: now focus on harder difficulty and speed.";
        }
        return "Interview breadth interpretation will appear after values load.";
      case "mcqBreadthScore":
        if (mcqB != null){
          if (mcqB < 30) return "MCQ breadth is low: quiz a wider set of categories to reveal hidden knowledge gaps.";
          if (mcqB < 60) return "MCQ breadth is moderate: add 1–2 new categories per week to expand coverage.";
          return "MCQ breadth is strong: keep coverage while improving weakest Advanced categories.";
        }
        return "MCQ breadth interpretation will appear after values load.";
      case "codiviumScore":
        if (cod != null){
          return "Use this score for week-to-week trend. If it stalls, check Breadth/Depth/MCQ to locate the bottleneck.";
        }
        return "Codivium score interpretation will appear after values load.";
      case "panel_time":
        if (typeof DAILY_PLATFORM_SERIES !== "undefined" && Array.isArray(DAILY_PLATFORM_SERIES)){
          const now = new Date(); now.setHours(0,0,0,0);
          const start7 = new Date(now); start7.setDate(now.getDate() - 6);
          const last7 = DAILY_PLATFORM_SERIES.filter(x => x.date >= start7 && x.date <= now);
          const total7 = last7.reduce((a,b)=>a+(b.minutes||0),0);
          const days = last7.filter(x => (x.minutes||0) > 0).length;
          const avg = total7 / 7.0;
          if (days <= 2) return "Consistency is low in the last 7 days. Aim for short daily sessions (25–45m) to build momentum.";
          if (avg < 20) return "Practice volume is light. Increase session length or add one extra day this week.";
          return "Good cadence: keep consistency and use Weekly view to confirm the trend is stable.";
        }
        return "Time interpretation will appear after values load.";
      case "panel_exercise":
        if (typeof exerciseTimeByCategory !== "undefined" && Array.isArray(exerciseTimeByCategory)){
          const total = exerciseTimeByCategory.reduce((a,b)=>a+(b.minutes||0),0) || 1;
          const sorted = exerciseTimeByCategory.slice().sort((a,b)=> (b.minutes||0)-(a.minutes||0));
          const top = sorted[0];
          const topShare = top ? (top.minutes||0)/total*100 : 0;
          const top3Share = sorted.slice(0,3).reduce((a,b)=>a+(b.minutes||0),0)/total*100;
          if (topShare > 55) return "Time is highly concentrated in one category. Great for short deep-focus cycles—add a weekly sweep to avoid gaps.";
          if (top3Share < 55) return "Time is spread broadly. Pick 1–2 priority categories and increase deliberate reps to build depth.";
          return "Allocation looks balanced. Maintain with small rotations and spend extra time on categories with weak convergence/MCQ.";
        }
        return "Allocation interpretation will appear after values load.";
      case "mcqEasy":
      case "mcqMedium":
      case "mcqHard":
        if (typeof mcqMatrix !== "undefined" && Array.isArray(mcqMatrix)){
          const diff = (key === "mcqEasy") ? "Easy" : (key === "mcqMedium" ? "Medium" : "Hard");
          const vals = mcqMatrix.map(r => ({ cat: r.category, s: r[diff]?.avgScore ?? null })).filter(x => x.s != null);
          if (vals.length){
            vals.sort((a,b)=>a.s-b.s);
            const low = vals[0];
            const high = vals[vals.length-1];
            const avgS = vals.reduce((a,b)=>a+b.s,0)/vals.length;
            if (avgS < 60) return `${diff} MCQ average is low (${Math.round(avgS)}%). Start with ${low.cat} (${Math.round(low.s)}%) and rebuild fundamentals.`;
            if (avgS < 78) return `${diff} MCQ is improving (${Math.round(avgS)}%). Lowest: ${low.cat} (${Math.round(low.s)}%). Keep drilling mistakes into spaced repetition.`;
            return `${diff} MCQ is strong (${Math.round(avgS)}%). Lowest: ${low.cat} (${Math.round(low.s)}%). Push harder coding sets while maintaining MCQ hygiene.`;
          }
        }
        return "MCQ difficulty interpretation will appear after values load.";

      default:
        return "Use the chart to find the weakest area first, then do deliberate practice: review mistakes → drill 10 items → re-check after 48h.";
    }
  }

    // -----------------------------
  // Production integration state
  // -----------------------------
  /** @type {DashboardData} */
  // v2 (namespaced) heatmap support

  // Coding track selector — drives depth + allocation charts independently of the heatmap view.
  // combined = merged micro+interview (default), micro = micro only, interview = interview only.

  // Per-track depth and allocation caches (populated by applyDashboardData).

  // Info pane open/closed state (persisted to localStorage via __cvState.__uiPanels.infoPane).
  // Exposed via toggleInfoPane() for the collapse button in the info pane header.
  function __cvToggleInfoPane() {
    __cvEnsureUiPrefsLoaded();
    const next = !(__cvState.__uiPanels && __cvState.__uiPanels.infoPane !== false);
    const updated = Object.assign({}, __cvState.__uiPanels || {}, { infoPane: next });
    if (window.CodiviumInsights && typeof window.CodiviumInsights.setUiPrefs === 'function') {
      window.CodiviumInsights.setUiPrefs({ mode: __cvState.__uiMode, panels: updated });
    }
  }

  // Actionability (recommendedActions → start-session endpoint)

  // Track which info key is currently shown in the right-side pane.
  // Used to keep the pane in sync when the user changes panel views (heatmap/time/allocation).


  // -----------------------------
  // UI preferences (panel visibility + summary view)
  // -----------------------------
  const __UI_STORAGE_KEY = "cv.dashboard.ui";
  const __UI_DEFAULT = {
    mode: "full",
    panels: {
      scores: true,
      depth: true,
      heatmap: true,
      time: true,
      allocation: true,
      mcq: true,
      infoPane: true,
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CVU-2026-03-G  STATE REFACTOR — all live state in one bounded object
  // DO NOT add bare 'let __xxx' state vars below; add properties here instead.
  // ─────────────────────────────────────────────────────────────────────────

// dashboard.00b.state.js — __cvState declaration, UI prefs read/write, normalise helpers
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

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
    __allowedModes:         null,   // null = unrestricted; string[] = e.g. ['info_only'] or ['full','info_only']
    // render coordination
    __cvUiApplyRaf:         0,
    // refresh / visibility (managed by dashboard.06b.refresh)
    __hardRefreshTimer:     null,
    __hardRefreshToken:     0,
    __softRefreshTimer:     null,
    __lastRefreshAt:        0,
    __wasEverHidden:        false,
    __resilienceIgnoreUntil: 0,   // set to Date.now() + initialIgnoreMs after config loads
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


  function __cvNormalizeUiMode(mode){
    const m = String(mode || "").trim().toLowerCase();
    if (m === "info_only" || m === "info-only" || m === "summary" || m === "summary_only" || m === "summary-only") return "info_only";
    return "full";
  }

  function __cvNormalizeSelectedTrack(track){
    const t = String(track || '').trim().toLowerCase();
    if (t === 'micro' || t === 'interview') return t;
    return 'combined';
  }

  function __cvNormalizePanels(panels){
    const out = Object.assign({}, __UI_DEFAULT.panels);
    if (!panels || typeof panels !== "object") return out;
    for (const k of Object.keys(out)){
      const v = panels[k];
      if (typeof v === "boolean") out[k] = v;
      else if (typeof v === "number") out[k] = !!v;
      else if (typeof v === "string"){
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "yes" || s === "on") out[k] = true;
        else if (s === "0" || s === "false" || s === "no" || s === "off") out[k] = false;
      }
    }
    return out;
  }

  function __cvReadUiFromLocalStorage(){
    try {
      if (!window.localStorage) return null;
      const raw = window.localStorage.getItem(__UI_STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      const mode = __cvNormalizeUiMode(obj.mode);
      const panels = __cvNormalizePanels(obj.panels);
      const selectedTrack = __cvNormalizeSelectedTrack(obj.selectedTrack);
      return { mode, panels, selectedTrack };
    } catch (e) { return null; }
  }

  function __cvWriteUiToLocalStorage(ui){
    try {
      if (!window.localStorage) return;
      if (!ui || typeof ui !== "object") return;
      const out = {
        mode: __cvNormalizeUiMode(ui.mode),
        panels: __cvNormalizePanels(ui.panels),
        // Preserve selectedTrack: use supplied value, else fall back to current state
        selectedTrack: __cvNormalizeSelectedTrack(
          ui.selectedTrack !== undefined ? ui.selectedTrack : __cvState.__selectedCodingTrack
        )
      };
      window.localStorage.setItem(__UI_STORAGE_KEY, JSON.stringify(out));
    } catch (e) {
      // ignore
    }
  }

  function __cvReadUiFromPayload(payload, overallSrc){
    try {
      const rootMeta = (payload && (payload.meta || payload.Meta) && typeof (payload.meta || payload.Meta) === "object") ? (payload.meta || payload.Meta) : null;
      const overallMeta = (overallSrc && (overallSrc.meta || overallSrc.Meta) && typeof (overallSrc.meta || overallSrc.Meta) === "object") ? (overallSrc.meta || overallSrc.Meta) : null;

      const uiObj = (rootMeta && (rootMeta.ui || rootMeta.Ui) && typeof (rootMeta.ui || rootMeta.Ui) === "object") ? (rootMeta.ui || rootMeta.Ui) :
                    (overallMeta && (overallMeta.ui || overallMeta.Ui) && typeof (overallMeta.ui || overallMeta.Ui) === "object") ? (overallMeta.ui || overallMeta.Ui) :
                    null;

      if (!uiObj) return null;

      const mode = __cvNormalizeUiMode(uiObj.mode);
      const panels = __cvNormalizePanels(uiObj.panels);
      // selectedTrack is optional inside meta.ui; fall through to 'combined' if absent
      const selectedTrack = (uiObj.selectedTrack || uiObj.SelectedTrack)
        ? __cvNormalizeSelectedTrack(uiObj.selectedTrack || uiObj.SelectedTrack)
        : null;
      return { mode, panels, selectedTrack };
    } catch (e) { return null; }
  }

  function __cvEnsureUiPrefsLoaded(){
    if (__cvState.__uiLoaded) return;
    __cvState.__uiLoaded = true;
    const ls = __cvReadUiFromLocalStorage();
    if (ls) {
      __cvState.__uiMode = ls.mode;
      __cvState.__uiPanels = Object.assign({}, ls.panels);
      // Restore selected track if stored (falls back to 'combined' via normalise)
      if (ls.selectedTrack) __cvState.__selectedCodingTrack = ls.selectedTrack;
    }
  }

// dashboard.00c.layout.js — Panel visibility, layout presets, grid, mode application
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

function __cvApplyPanelVisibility(){
    const mount = getMount();
    if (!mount) return;

    const panels = (__cvState.__uiPanels && typeof __cvState.__uiPanels === "object") ? __cvState.__uiPanels : __UI_DEFAULT.panels;

    const setVisible = (selector, isVisible) => {
      try {
        mount.querySelectorAll(selector).forEach((el) => {
          el.classList.toggle("isHidden", !isVisible);
          el.setAttribute("aria-hidden", (!isVisible).toString());
        });
      } catch (_) {}
    };

    setVisible(".scoresPalette", !!panels.scores);
    setVisible(".depthPanel", !!panels.depth);
    setVisible(".heatmapPanel", !!panels.heatmap);
    setVisible(".timePanel", !!panels.time);
    setVisible(".donutPanel", !!panels.allocation);
    setVisible(".mcqPanel", !!panels.mcq);
    setVisible("#infoPane", !!panels.infoPane);

    const leftOn = !!(panels.scores || panels.depth);
    const rightOn = !!(panels.time || panels.allocation);

    setVisible(".colLeft", leftOn);
    setVisible(".colRight", rightOn);

    // If the scores-expanded tri-track view is active but scores_only is no longer
    // the current layout, tear it down so .scoresScrollArea becomes visible again.
    // (window.__cv_teardownScoresExpanded is registered by dashboard.06.mcq-and-render.js)
    try {
      if (typeof window.__cv_teardownScoresExpanded === 'function') {
        window.__cv_teardownScoresExpanded();
      }
    } catch (_) {}

    // Stamp a data-cv-panels attribute on #ciMount so CSS can target single-panel
    // layouts without relying on data-cv-focus (which is never set by JS).
    try {
      const mount = getMount();
      if (mount) {
        const active = [];
        if (panels.scores)     active.push('scores');
        if (panels.depth)      active.push('depth');
        if (panels.heatmap)    active.push('heatmap');
        if (panels.time)       active.push('time');
        if (panels.allocation) active.push('alloc');
        if (panels.mcq)        active.push('mcq');
        mount.setAttribute('data-cv-panels', active.join(' ') || 'none');
      }
    } catch (_) {}
  }

  // -----------------------------
  // UI mode + dynamic layout (G03)
  // -----------------------------
  const __CV_AUTO_SUMMARY_MAX_W = 900; // below this, force info-only summary view

  function __cvGetViewportWidth(){
    try { return Math.max(0, Math.floor(window.innerWidth || 0)); } catch (e) { return 0; }
  }

  function __cvGetBreakpoint(width){
    const w = Number(width) || __cvGetViewportWidth();
    if (w <= 1100) return 'narrow';
    if (w <= 1400) return 'medium';
    return 'wide';
  }

  function __cvClampToAllowedMode(mode, allowed){
    if (!allowed || !Array.isArray(allowed) || allowed.length === 0) return mode;
    const normalised = allowed.map((m) => __cvNormalizeUiMode(m));
    if (normalised.includes(mode)) return mode;
    return normalised[0] || 'full';
  }

  function __cvGetEffectiveUiState(){
    __cvEnsureUiPrefsLoaded();
    const vw = __cvGetViewportWidth();
    const bp = __cvGetBreakpoint(vw);
    const forced = vw > 0 && vw < __CV_AUTO_SUMMARY_MAX_W;
    const rawMode = __cvNormalizeUiMode(__cvState.__uiMode);
    // allowedModes: server constraint — clamp *before* forced-small-screen override
    const clamped = __cvClampToAllowedMode(rawMode, __cvState.__allowedModes);
    const mode = forced ? 'info_only' : clamped;
    const panels = __cvNormalizePanels(__cvState.__uiPanels);
    return {
      width: vw,
      breakpoint: bp,
      forcedSmallScreen: forced,
      mode,
      panels
    };
  }

  function __cvIsHidden(el){
    if (!el) return true;
    try {
      if (el.classList && el.classList.contains('isHidden')) return true;
      const anc = el.closest && el.closest('.isHidden');
      if (anc) return true;
      const cs = window.getComputedStyle(el);
      if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return true;
      return false;
    } catch (e) { return true; }
  }

  function __cvEnsureSummaryBanner(mount){
    try {
      if (!mount) return null;
      const infoPane = mount.querySelector('#infoPane');
      if (!infoPane) return null;
      let banner = infoPane.querySelector('#cvSummaryBanner');
      if (!banner){
        banner = document.createElement('div');
        banner.id = 'cvSummaryBanner';
        banner.className = 'cvSummaryBanner isHidden';
        banner.setAttribute('role', 'note');
        banner.innerHTML = '<strong>Summary view</strong> on small screens. Use a desktop for the full dashboard.';
        const head = infoPane.querySelector('.infoPaneHead');
        if (head && head.parentNode) head.parentNode.insertBefore(banner, head.nextSibling);
        else infoPane.insertBefore(banner, infoPane.firstChild);
      }
      return banner;
    } catch (e) { return null; }
  }

  function __cvEnsureInfoPaneNavigator(mount){
    try {
      if (!mount) return null;
      const infoPane = mount.querySelector('#infoPane');
      if (!infoPane) return null;
      let strip = infoPane.querySelector('#cvInfoPaneTabs');
      if (strip) return strip;

      strip = document.createElement('div');
      strip.id = 'cvInfoPaneTabs';
      strip.className = 'infoPaneTabs isHidden';
      strip.setAttribute('role', 'tablist');
      strip.setAttribute('aria-label', 'Dashboard summaries');

      const tabs = [
        { key: 'dashboard_overview', label: 'Overview' },
        { key: 'panel_scores', label: 'Scores' },
        { key: 'panel_heatmap', label: 'Heatmap' },
        { key: 'panel_depth', label: 'Depth' },
        { key: 'panel_time', label: 'Time' },
        { key: 'panel_exercise', label: 'Allocation' },
        { key: 'panel_mcq', label: 'MCQ' }
      ];

      for (const t of tabs){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'infoPaneTabBtn';
        btn.textContent = t.label;
        btn.setAttribute('data-info-key', t.key);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          __cvState.__activeInfoKey = t.key;
          try { if (typeof setScoresInfoPane === 'function') setScoresInfoPane(t.key); } catch (_) {}
          __cvSyncInfoPaneNavigatorActive(t.key);
        });
        strip.appendChild(btn);
      }

      const head = infoPane.querySelector('.infoPaneHead');
      if (head && head.parentNode) head.parentNode.insertBefore(strip, head.nextSibling);
      else infoPane.insertBefore(strip, infoPane.firstChild);

      return strip;
    } catch (e) { return null; }
  }



  // -----------------------------
  // Layout preset toggle buttons (header layout switcher)
  // -----------------------------

  // NOTE: Button order is intentional: Full dashboard on the far left.
  const __CV_LAYOUT_PRESETS = [
    {
      id: 'full',
      label: 'Full Dashboard',
      ui: {
        mode: 'full',
        panels: {
          scores: true,
          depth: true,
          heatmap: true,
          time: true,
          allocation: true,
          mcq: true,
          infoPane: true
        }
      }
    },
    {
      id: 'coding_core',
      label: 'Coding Core',
      ui: {
        mode: 'full',
        panels: {
          scores: true,
          depth: true,
          heatmap: true,
          time: true,
          allocation: true,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'heatmap_focus',
      label: 'Heatmap Focus',
      ui: {
        mode: 'full',
        panels: {
          scores: false,
          depth: false,
          heatmap: true,
          time: false,
          allocation: false,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'scores_only',
      label: 'Scores Only',
      ui: {
        mode: 'full',
        panels: {
          scores: true,
          depth: false,
          heatmap: false,
          time: false,
          allocation: false,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'info_only',
      label: 'Summary View',
      ui: {
        mode: 'info_only',
        panels: {
          scores: false,
          depth: false,
          heatmap: false,
          time: false,
          allocation: false,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'mcq_only',
      label: 'MCQ Only',
      ui: {
        mode: 'full',
        panels: {
          scores: false,
          depth: false,
          heatmap: false,
          time: false,
          allocation: false,
          mcq: true,
          infoPane: true
        }
      }
    }
  ];

  function __cvLayoutPresetIconSvg(presetId){
    // Icons should accurately represent which dashboard components are visible.
    // Components considered (user spec):
    // (i) side window (info pane)  (ii) MCQ performance  (iii) heat map
    // (iv) time on platform  (v) scores  (vi) time by category.

    const base = '<svg class="cvLayoutIco" width="34" height="34" viewBox="0 0 64 64" aria-hidden="true" focusable="false">';
    const end = '</svg>';
    const r = (x, y, w, h, cls) => '<rect ' + (cls ? ('class="' + cls + '" ') : '') + 'x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="0" ry="0" />';
    const frame = r(6, 6, 52, 52, 'cvLayoutFrame');

    // Geometry: main area + right-side info pane.
    const MAIN_X = 10, MAIN_Y = 10, MAIN_W = 34, MAIN_H = 44;
    const PANE_X = 46, PANE_Y = 10, PANE_W = 8, PANE_H = 44;
    const pane = r(PANE_X, PANE_Y, PANE_W, PANE_H, 'cvLayoutPane');

    // 1) Summary view (info-only): header strip + info pane content (same width).
    if (presetId === 'info_only'){
      return base + frame +
        r(10, 10, 44, 10) +
        r(10, 22, 44, 32) +
        end;
    }

    // Helper: three-column layout (Scores | Heatmap | Time/Allocation)
    const L_X = 10, L_W = 10;
    const M_X = 21, M_W = 12;
    const R_X = 34, R_W = 10;

    // Scores-only: just the Scores window + side pane.
    if (presetId === 'scores_only'){
      return base + frame + r(MAIN_X, MAIN_Y, MAIN_W, MAIN_H) + pane + end;
    }

    // Heatmap focus: just the Heatmap window + side pane.
    // Render a heatmap-like grid inside the main block to differentiate it.
    if (presetId === 'heatmap_focus'){
      const cells = [
        r(MAIN_X + 2, MAIN_Y + 3, 6, 6), r(MAIN_X + 10, MAIN_Y + 3, 6, 6), r(MAIN_X + 18, MAIN_Y + 3, 6, 6),
        r(MAIN_X + 2, MAIN_Y + 12, 6, 6), r(MAIN_X + 10, MAIN_Y + 12, 6, 6), r(MAIN_X + 18, MAIN_Y + 12, 6, 6),
      ].join('');
      return base + frame + r(MAIN_X, MAIN_Y, MAIN_W, MAIN_H) + cells + pane + end;
    }

    // Coding core: Scores + Heatmap + Time on platform + Time by category + side pane.
    // (No MCQ panel.)
    if (presetId === 'coding_core'){
      return base + frame +
        // Left: Scores (top) + (Depth lives here too, represented as second block)
        r(L_X, MAIN_Y, L_W, 18) + r(L_X, MAIN_Y + 19, L_W, 25) +
        // Middle: Heatmap
        r(M_X, MAIN_Y, M_W, MAIN_H) +
        // Right: Time (top) + Time by category (bottom)
        r(R_X, MAIN_Y, R_W, 18) + r(R_X, MAIN_Y + 19, R_W, 25) +
        pane + end;
    }

    // MCQ-only: full-width MCQ panel + side info pane.
    if (presetId === 'mcq_only'){
      const bw = 8, bx1 = MAIN_X + 2, bx2 = MAIN_X + 13, bx3 = MAIN_X + 24;
      return base + frame +
        r(MAIN_X, MAIN_Y, MAIN_W, MAIN_H) +
        r(bx1, MAIN_Y + 4, bw, 36) +
        r(bx2, MAIN_Y + 12, bw, 28) +
        r(bx3, MAIN_Y + 20, bw, 20) +
        pane + end;
    }

    // Full dashboard: Coding core + MCQ performance row spanning the main area.
    return base + frame +
      // Top area (Scores / Heatmap / Time+Allocation)
      r(L_X, MAIN_Y, L_W, 12) + r(L_X, MAIN_Y + 13, L_W, 19) +
      r(M_X, MAIN_Y, M_W, 22) +
      r(R_X, MAIN_Y, R_W, 12) + r(R_X, MAIN_Y + 13, R_W, 19) +
      // Bottom row: MCQ
      r(MAIN_X, MAIN_Y + 28, MAIN_W, 16) +
      pane + end;
  }

  function __cvPresetMatchesState(preset, state){
    try {
      if (!preset || !state) return false;
      const pm = __cvNormalizeUiMode((preset.ui && preset.ui.mode) || 'full');
      if (pm !== state.mode) return false;
      if (state.mode === 'info_only') return preset.id === 'info_only';
      const pp = __cvNormalizePanels((preset.ui && preset.ui.panels) || null);
      const sp = __cvNormalizePanels(state.panels || null);
      for (const k of Object.keys(pp)){
        if (pp[k] !== sp[k]) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  function __cvEnsureLayoutPresetDock(mount, state){
    try {
      if (!mount) return null;
      const st = state || __cvGetEffectiveUiState();
      let dock = mount.querySelector('#cvLayoutPresetDock');

      if (!dock){
        dock = document.createElement('div');
        dock.id = 'cvLayoutPresetDock';
        dock.className = 'cvLayoutPresetDock';
        dock.setAttribute('role', 'group');
        dock.setAttribute('aria-label', 'Dashboard layout presets');

        for (const p of __CV_LAYOUT_PRESETS){
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cvLayoutBtn';
          btn.setAttribute('data-layout-preset', p.id);
          btn.setAttribute('aria-label', p.label);
          btn.setAttribute('aria-pressed', 'false');
          // title tooltip removed — label text now shown directly on the button
          const labelSpan = document.createElement('span');
          labelSpan.className = 'cvLayoutBtnLabel';
          // Split label at first space so two-word labels render on two lines
          const _lblWords = p.label.split(' ');
          if (_lblWords.length >= 2) {
            labelSpan.innerHTML = _lblWords[0] + '<br>' + _lblWords.slice(1).join(' ');
          } else {
            labelSpan.textContent = p.label;
          }
          btn.innerHTML = '';
          btn.appendChild(labelSpan);
          const iconWrapper = document.createElement('span');
          iconWrapper.className = 'cvLayoutBtnIcon';
          iconWrapper.innerHTML = __cvLayoutPresetIconSvg(p.id);
          btn.appendChild(iconWrapper);

          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eff = __cvGetEffectiveUiState();
            if (eff.forcedSmallScreen && p.id !== 'info_only') return;
            try {
              const cfg = window.CodiviumInsightsConfig || {};
              const ms = (cfg.resilience && cfg.resilience.ignoreAfterToggleMs) || 180;
              if (typeof window.__cvSetResilienceIgnoreUntil === 'function') window.__cvSetResilienceIgnoreUntil(ms);
            } catch (_) {}
            try {
              if (window.CodiviumInsights && typeof window.CodiviumInsights.setUiPrefs === 'function'){
                window.CodiviumInsights.setUiPrefs(p.ui);
              }
            } catch (_) {}
          });

          dock.appendChild(btn);
        }
      }

      // Dock on document.body: position:fixed is always viewport-relative.
      dock.classList.remove('isInInfoPane');
      dock.classList.add('isInHeader');
      if (dock.parentNode !== document.body){
        document.body.appendChild(dock);
      }

      return dock;
    } catch (e) { return null; }
  }

  function __cvSyncLayoutPresetDock(state){
    try {
      const mount = getMount();
      if (!mount) return;
      const st = state || __cvGetEffectiveUiState();
      const dock = __cvEnsureLayoutPresetDock(mount, st);
      if (!dock) return;

      const forced = !!st.forcedSmallScreen;
      dock.classList.toggle('isForced', forced);

      dock.querySelectorAll('button[data-layout-preset]').forEach((btn) => {
        const id = btn.getAttribute('data-layout-preset');
        const preset = __CV_LAYOUT_PRESETS.find((p) => p.id === id);
        const on = __cvPresetMatchesState(preset, st);
        const presetMode = __cvNormalizeUiMode((preset && preset.ui && preset.ui.mode) || 'full');
        const allowed = __cvState.__allowedModes;
        const modeBlocked = allowed && Array.isArray(allowed) && allowed.length > 0 &&
                            !allowed.map((m) => __cvNormalizeUiMode(m)).includes(presetMode);
        const dis = (forced && id !== 'info_only') || !!modeBlocked;

        btn.classList.toggle('isOn', on);
        btn.classList.toggle('isDisabled', dis);
        btn.classList.toggle('isHidden', !!modeBlocked);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-hidden', modeBlocked ? 'true' : 'false');
        if (dis) btn.setAttribute('disabled', 'disabled');
        else btn.removeAttribute('disabled');
      });
    } catch (e) { /* ignore */ }
  }
  function __cvSyncInfoPaneNavigatorActive(activeKey){
    try {
      const mount = getMount();
      if (!mount) return;
      const strip = mount.querySelector('#cvInfoPaneTabs');
      if (!strip) return;
      strip.querySelectorAll('button[data-info-key]').forEach((btn) => {
        const k = btn.getAttribute('data-info-key');
        const on = (k === activeKey);
        btn.classList.toggle('isActive', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    } catch (e) { /* ignore */ }
  }

  function __cvApplyInfoPaneLayoutForMode(mount, mode){
    try {
      if (!mount) return;
      const infoPane = mount.querySelector('#infoPane');
      if (!infoPane) return;
      const strip = mount.querySelector('#cvInfoPaneTabs');
      const hint = infoPane.querySelector('#infoPaneHint');
      const agg = infoPane.querySelector('#infoAgg');
      const interpWrap = infoPane.querySelector('.infoPaneInterp');
      const body = infoPane.querySelector('#infoPaneBody');

      const isInfoOnly = (mode === 'info_only');
      if (strip) strip.classList.toggle('isHidden', !isInfoOnly);
      if (hint) hint.classList.toggle('isHidden', isInfoOnly);
      if (agg) agg.classList.toggle('isHidden', isInfoOnly);

      // In Summary View we still want the main body text visible.
      // Keep both the body and interp sections available; we hide hint/agg instead.
      if (interpWrap) interpWrap.classList.remove('isHidden');
      if (body) body.classList.remove('isHidden');
    } catch (e) { /* ignore */ }
  }

  function __cvApplyDynamicGridLayout(mount, bp){
    try {
      if (!mount) return;
      const formBody = mount.querySelector('.form-body');
      if (!formBody) return;

      const leftEl = mount.querySelector('.colLeft');
      const rightEl = mount.querySelector('.colRight');
      const heatEl = mount.querySelector('.heatmapPanel');
      const mcqEl = mount.querySelector('.mcqPanel');

      const leftOn = leftEl && !__cvIsHidden(leftEl);
      const rightOn = rightEl && !__cvIsHidden(rightEl);
      const heatOn = heatEl && !__cvIsHidden(heatEl);
      const mcqOn = mcqEl && !__cvIsHidden(mcqEl);

      if (!leftOn && !rightOn && !heatOn && !mcqOn) return;

      let rows = [];
      let colCount = 1;
      let colTemplate = '1fr';

      if (bp === 'wide'){
        const top = [];
        if (leftOn) top.push('left');
        if (heatOn) top.push('heat');
        if (rightOn) top.push('right');
        if (!top.length){
          if (mcqOn) top.push('mcq');
          else return;
        }
        rows.push(top);
        colCount = top.length;
        if (colCount === 3) {
          const storedCols = mount.style.getPropertyValue('--cv-heat-cols');
          colTemplate = (storedCols && storedCols.trim()) ? storedCols.trim() : '26.7fr 23.1fr 48.4fr';
        }
        else if (colCount === 2) colTemplate = 'minmax(520px, 1fr) minmax(520px, 1fr)';
        else colTemplate = '1fr';
        if (mcqOn && !(top.length === 1 && top[0] === 'mcq')) rows.push(new Array(colCount).fill('mcq'));
      }
      else if (bp === 'medium'){
        const top = [];
        if (leftOn) top.push('left');
        if (rightOn) top.push('right');
        if (!top.length){
          if (heatOn) top.push('heat');
          else if (mcqOn) top.push('mcq');
          else return;
        }
        rows.push(top);
        colCount = top.length;
        colTemplate = (colCount === 2) ? 'minmax(520px, 1fr) minmax(520px, 1fr)' : '1fr';
        if (heatOn && !top.includes('heat')) rows.push(new Array(colCount).fill('heat'));
        if (mcqOn && !(top.length === 1 && top[0] === 'mcq')) rows.push(new Array(colCount).fill('mcq'));
      }
      else {
        const stack = [];
        if (leftOn) stack.push('left');
        if (heatOn) stack.push('heat');
        if (rightOn) stack.push('right');
        if (mcqOn) stack.push('mcq');
        if (!stack.length) return;
        rows = stack.map((a) => [a]);
        colCount = 1;
        colTemplate = '1fr';
      }

      const areas = rows.map((r) => `"${r.join(' ')}"`).join('\n');

      // Row template: use fr ratios that match the CSS so the inline style
      // and the stylesheet agree. repeat(N, auto) was overriding the CSS fr values.
      // Rows array structure: every row that contains 'mcq' gets the MCQ fr weight;
      // all other rows (analytics) share the top fr weight equally.
      const TOP_FR  = 2.73;
      const MCQ_FR  = 1.3;

      // If the user has dragged the MCQ splitter, --cv-mcq-h is set on #ciMount.
      // Use that px value directly as the MCQ row size so the drag survives layout
      // passes — otherwise the fr ratio would overwrite the user's choice.
      const storedMcqH = mount.style.getPropertyValue('--cv-mcq-h');
      const mcqRowSize = (storedMcqH && parseFloat(storedMcqH) > 0)
        ? storedMcqH.trim()
        : `minmax(0, ${MCQ_FR}fr)`;

      const rowTemplate = rows
        .map((r) => r.includes('mcq') ? mcqRowSize : `minmax(0, ${TOP_FR}fr)`)
        .join(' ');

      formBody.style.setProperty('grid-template-areas', areas);
      formBody.style.setProperty('grid-template-columns', colTemplate);
      formBody.style.setProperty('grid-template-rows', rowTemplate);
    } catch (e) { /* ignore */ }
  }


  // (dead function removed — no longer needed after !important refactor)


  // ── Info-pane side toggle ───────────────────────────────────────────────
  // A small button shown in form-head-right whenever the layout has the info
  // pane as a collapsible side window (i.e. mode=full, any preset except info_only).
  // Hides itself in info_only mode where the pane IS the main view.

  function __cvSyncInfoPaneToggle(state) {
    try {
      const mount = getMount();
      if (!mount) return;

      let btn = mount.querySelector('#cvInfoPaneToggleBtn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'cvInfoPaneToggleBtn';
        btn.type = 'button';
        btn.className = 'cvInfoPaneToggleBtn';
        btn.setAttribute('aria-label', 'Toggle info panel');
        btn.innerHTML =
          '<svg class="cvInfoPaneToggleIco" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
          '<rect x="2" y="2" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6"/>' +
          '<rect x="13" y="2" width="5" height="16" rx="0" fill="currentColor" opacity="0.3"/>' +
          '<line x1="13" y1="2" x2="13" y2="18" stroke="currentColor" strokeWidth="1.4"/>' +
          '</svg>' +
          '<span class="cvInfoPaneToggleTxt">Info</span>';
        btn.addEventListener('click', function() {
          try {
            if (window.CodiviumInsights && typeof window.CodiviumInsights.toggleInfoPane === 'function') {
              window.CodiviumInsights.toggleInfoPane();
            }
          } catch (_) {}
        });

        // Insert into form-head-right
        const headRight = mount.querySelector('.form-head-right');
        if (headRight) {
          headRight.insertBefore(btn, headRight.firstChild);
        }
      }

      const isInfoOnly = state && state.mode === 'info_only';
      const paneOpen = state && state.panels && state.panels.infoPane !== false;

      // Hide entirely in info_only mode
      btn.classList.toggle('isHidden', !!isInfoOnly);

      // Reflect open/closed state
      btn.classList.toggle('isPaneOpen', !isInfoOnly && !!paneOpen);
      btn.setAttribute('aria-pressed', (!isInfoOnly && !!paneOpen) ? 'true' : 'false');

      // Update label
      const txt = btn.querySelector('.cvInfoPaneToggleTxt');
      if (txt) txt.textContent = paneOpen ? 'Info' : 'Info';

    } catch (e) { /* silent */ }
  }

  function __cvApplyUiModeAndLayout(){
    const mount = getMount();
    if (!mount) return;

    const state = __cvGetEffectiveUiState();
    __cvState.__uiEffectiveMode = state.mode;
    __cvState.__uiForcedSmallScreen = state.forcedSmallScreen;

    // data-layout attr — authoritative signal read by dashboard.layout.css
    mount.setAttribute('data-layout', state.mode); // e.g. "info_only" | "full"

    // Mode classes — kept for backward compat; new CSS uses data-layout instead
    // Note: data-layout attribute (set above) is the canonical CSS authority.
    // cv-mode-* classes removed (R16 cleanup) — they were never used in CSS rules.
    mount.classList.toggle('cv-forced-summary', !!state.forcedSmallScreen);
    // Propagate mode to body so the dock (which lives on body) can be repositioned
    try { document.body.classList.toggle('cv-body-info-only', state.mode === 'info_only'); } catch (_) {}

    const formBody = mount.querySelector('.form-body');
    const infoPane = mount.querySelector('#infoPane');

    // Ensure the summary banner exists and toggle it only when forced by small screens.
    const banner = __cvEnsureSummaryBanner(mount);
    if (banner) banner.classList.toggle('isHidden', !state.forcedSmallScreen);

    // Ensure info-pane navigator exists.
    __cvEnsureInfoPaneNavigator(mount);

    // Ensure layout preset dock exists and reflects the current mode/panels.
    __cvSyncLayoutPresetDock(state);

    // Sync the info-pane side toggle button in form-head-right.
    __cvSyncInfoPaneToggle(state);

    if (state.mode === 'info_only'){
      // Disable the tour in Summary View.
      try {
        const tourBtn = mount.querySelector('#startTourBtn');
        if (tourBtn){
          tourBtn.setAttribute('disabled', 'disabled');
          tourBtn.setAttribute('aria-disabled', 'true');
          tourBtn.tabIndex = -1;
        }
      } catch (_) {}

      // Clear dynamic-grid inline styles so CSS info_only rules take full control.
      try {
        if (formBody) {
          formBody.style.removeProperty('grid-template-areas');
          formBody.style.removeProperty('grid-template-columns');
          formBody.style.removeProperty('grid-template-rows');
        }
      } catch (_) {}

      if (formBody) formBody.classList.add('isHidden');
      if (infoPane){
        infoPane.classList.remove('isHidden');
        infoPane.setAttribute('aria-hidden', 'false');
      }

      // Ensure the summary is visible (no "halfway down" surprise after scrolling in full mode).
      try {
        const outer = mount.closest('.grid-scroll') || document.querySelector('#gridScroll');
        if (outer && typeof outer.scrollTop === 'number') outer.scrollTop = 0;
        const ips = mount.querySelector('#infoPaneScroll');
        if (ips && typeof ips.scrollTop === 'number') ips.scrollTop = 0;
      } catch (_) {}

      __cvApplyInfoPaneLayoutForMode(mount, 'info_only');

      // Default to an overview summary.
      if (!__cvState.__activeInfoKey || __cvState.__activeInfoKey === 'welcome') __cvState.__activeInfoKey = 'dashboard_overview';

      // Render the correct info content for the active key.
      try {
        // Prefer the structured score renderer (it has a robust fallback for dashboard_overview).
        if (typeof setScoresInfoPane === 'function') {
          // Guard against rare TDZ issues by checking SCORE_INFO_KEYS presence safely.
          const canUseScoreKeys = (typeof SCORE_INFO_KEYS !== 'undefined' && SCORE_INFO_KEYS && typeof SCORE_INFO_KEYS.has === 'function');
          if (!canUseScoreKeys || SCORE_INFO_KEYS.has(__cvState.__activeInfoKey)) {
            setScoresInfoPane(__cvState.__activeInfoKey);
          } else if (typeof setInfoPane === 'function') {
            setInfoPane(__cvState.__activeInfoKey);
          }
        } else if (typeof refreshInfoIfActive === 'function') {
          refreshInfoIfActive(__cvState.__activeInfoKey);
        }
      } catch (_) {}
      __cvSyncInfoPaneNavigatorActive(__cvState.__activeInfoKey);

      // In info-only mode, ignore stored panel toggles for the info pane (it must remain visible).
      return;
    }

    // Full mode: ensure tour button is enabled.
    try {
      const tourBtn = mount.querySelector('#startTourBtn');
      if (tourBtn){
        tourBtn.removeAttribute('disabled');
        tourBtn.setAttribute('aria-disabled', 'false');
        tourBtn.tabIndex = 0;
      }
    } catch (_) {}

    // Full mode: apply per-panel toggles and rebuild grid.
    if (formBody) formBody.classList.remove('isHidden');
    __cvApplyPanelVisibility();
    __cvApplyInfoPaneLayoutForMode(mount, 'full');
    __cvApplyDynamicGridLayout(mount, state.breakpoint);

    // Keep navigator state in sync if the active key is one of the tab keys.
    __cvSyncInfoPaneNavigatorActive(__cvState.__activeInfoKey);

    // Initialise / teardown drag-resize splitters based on current mode and breakpoint.
    try { __cvInitPanelResizers(); } catch (_) {}
  }

  
  // Coalesce multiple UI changes into a single layout pass.
  function __cvRequestUiApply(reason, afterApply){
    try {
      if (__cvState.__cvUiApplyRaf) {
        // A rAF is already pending. If a new afterApply callback was provided,
        // chain it onto the existing pending apply by cancelling and rescheduling.
        if (typeof afterApply === 'function') {
          cancelAnimationFrame(__cvState.__cvUiApplyRaf);
          __cvState.__cvUiApplyRaf = 0;
        } else {
          return; // No callback and rAF already queued — coalesce.
        }
      }
      __cvState.__cvUiApplyRaf = requestAnimationFrame(() => {
        __cvState.__cvUiApplyRaf = 0;
        try { __cvApplyUiModeAndLayout(); } catch (e) { ciErr('ui_apply', reason, e); }
        // Run post-apply callback AFTER layout is applied (panels shown/hidden).
        if (typeof afterApply === 'function') {
          try { afterApply(); } catch (e) { ciErr('ui_apply_after', reason, e); }
        }
      });
    } catch (e) {
      // Fallback: apply immediately if rAF is unavailable
      try { __cvApplyUiModeAndLayout(); } catch (err) { ciErr('ui_apply_fallback', reason, err); }
      if (typeof afterApply === 'function') { try { afterApply(); } catch (_) {} }
    }
  }

function __cvBindUiLayoutListeners(){
    const mount = getMount();
    if (!mount) return;
    const st = __cvMountState(mount);
    if (st.uiLayoutBound) return;
    st.uiLayoutBound = true;

    const onResize = () => {
      __cvRequestUiApply('resize');
    };

    st.uiLayoutOnResize = onResize;
    try { window.addEventListener('resize', onResize, { passive: true }); } catch (e) { window.addEventListener('resize', onResize); }
  }




  // Expose minimal UI-pref API for future settings integration (optional)
  window.CodiviumInsights = window.CodiviumInsights || {};
  // Expose bounded state object for test introspection (read-only reference).
  if (__cvConfig.debug) window.CodiviumInsights.__state = __cvState;

  window.CodiviumInsights.getUiPrefs = function(){
    __cvEnsureUiPrefsLoaded();
    return { mode: __cvState.__uiMode, panels: Object.assign({}, __cvState.__uiPanels) };
  };

  // Toggle the info pane open/closed (used by the collapse button in the info pane header).
  window.CodiviumInsights.toggleInfoPane = function(){ __cvToggleInfoPane(); };

  // Coding track selector setter (used by the track pills in dashboard.06).
  window.__cv_setSelectedTrack = function(track) {
    const valid = ['combined', 'micro', 'interview'];
    if (!valid.includes(track)) return;
    __cvState.__selectedCodingTrack = track;
    // Persist alongside existing ui prefs so selection survives page reload
    try {
      __cvWriteUiToLocalStorage({
        mode:  __cvState.__uiMode,
        panels: __cvState.__uiPanels,
        selectedTrack: track
      });
    } catch (_) {}
  };
  window.CodiviumInsights.getSelectedTrack = function(){ return __cvState.__selectedCodingTrack; };
  window.CodiviumInsights.setSelectedTrack = function(track){ window.__cv_setSelectedTrack(track); };

  window.CodiviumInsights.getEffectiveUiState = function(){
    try { return __cvGetEffectiveUiState(); } catch (e) { return { mode: __cvState.__uiMode, panels: Object.assign({}, __cvState.__uiPanels) }; }
  };
  window.CodiviumInsights.setUiPrefs = function(ui){
    __cvEnsureUiPrefsLoaded();
    safe('bind_ui_layout_listeners', () => { if (typeof __cvBindUiLayoutListeners === 'function') __cvBindUiLayoutListeners(); });
    if (!ui || typeof ui !== "object") return;
    // Clamp mode to server-allowed set before storing
    const requestedMode = __cvNormalizeUiMode(ui.mode);
    __cvState.__uiMode = __cvClampToAllowedMode(requestedMode, __cvState.__allowedModes);
    __cvState.__uiPanels = __cvNormalizePanels(ui.panels);
    __cvWriteUiToLocalStorage({ mode: __cvState.__uiMode, panels: __cvState.__uiPanels });
    // Pass refresh() as afterApply so it fires AFTER __cvApplyUiModeAndLayout removes
    // isHidden (display:none) from newly-shown panels. Without this, refresh() fires
    // before the panel is visible and charts measure 0px, then are never retried.
    const doRefresh = () => {
      if (window.CodiviumInsights && typeof window.CodiviumInsights.refresh === 'function') {
        window.CodiviumInsights.refresh();
      }
    };
    if (typeof __cvRequestUiApply === 'function') __cvRequestUiApply('set_ui_prefs', doRefresh);
    else {
      if (typeof __cvApplyUiModeAndLayout === 'function') __cvApplyUiModeAndLayout();
      else __cvApplyPanelVisibility();
      safe('refresh_after_set_ui_prefs', doRefresh);
    }
  };

  /** @type {(infoKey: string, data: any) => string | null} */

// dashboard.00d.data.js — getInfoContent, getAnalysisText, applyDashboardData, refresh
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

function getInfoContent(key){
    const base = INFO_CONTENT[key] || null;
    const detail = (typeof INFO_DETAIL !== 'undefined' && INFO_DETAIL[key]) ? INFO_DETAIL[key] : null;
    const override = (__cvState.__infoContentOverrides && __cvState.__infoContentOverrides[key]) ? __cvState.__infoContentOverrides[key] : null;
    if (!base && !detail && !override) return null;
    return Object.assign({}, base || {}, detail || {}, override || {});
  }

  function getAnalysisText(key){
    if (__cvState.__analysisOverrides && typeof __cvState.__analysisOverrides[key] === "string") return __cvState.__analysisOverrides[key];
    if (typeof __cvState.__analysisProvider === "function") {
      try {
        const v = __cvState.__analysisProvider(key, __cvState.__dashData);
        if (typeof v === "string") return v;
      } catch (e) {
        // fail open to built-in interpretation
      }
    }
    return interpretMetric(key) || "";
  }

  /**
   * Apply a production payload to the dashboard's internal data model.
   * This keeps visuals identical but allows real data injection.
   *
   * @param {DashboardData} payload
   */
  function applyDashboardData(payload){
    if (!payload || typeof payload !== "object") return;

    __cvState.__dashData = payload;

    __cvEnsureUiPrefsLoaded();

    // Detect v2 (track-namespaced) payloads
    const __isV2 = !!(payload && typeof payload === "object" && (payload.micro || payload.interview || payload.mcq || payload.Micro || payload.Interview || payload.Mcq));

    // Sources by namespace
    const __overallSrc = __isV2 ? (payload.overall || payload.Overall || payload.summary || payload.Summary || {}) : payload;
    const __codingSrc  = __isV2 ? (payload.combinedCoding || payload.CombinedCoding || payload.coding || payload.Coding || payload.combined || payload.Combined || {}) : payload;
    const __microSrc   = __isV2 ? (payload.micro || payload.Micro || {}) : null;
    const __interviewSrc = __isV2 ? (payload.interview || payload.Interview || {}) : null;
    const __mcqSrc     = __isV2 ? (payload.mcq || payload.Mcq || {}) : payload;

    // Endpoint override (optional)
    const ep = (payload && payload.meta && (payload.meta.sessionStartEndpoint || payload.meta.session_start_endpoint)) ||
               (__overallSrc && __overallSrc.meta && (__overallSrc.meta.sessionStartEndpoint || __overallSrc.meta.session_start_endpoint)) ||
               (payload && (payload.sessionStartEndpoint || payload.session_start_endpoint)) || null;
    if (ep) __cvState.__sessionStartEndpoint = String(ep);

    // Reset v2-only structures if not v2
    if (!__isV2){
      __cvState.__heatmapData = null;
      __cvState.__heatmapFocus = null;
    }

    // Anchor date (optional): supports anchorDate / anchor_date / meta.anchorDate / snapshotDate.
    const ad =
      (payload.anchorDate ?? payload.anchor_date ??
       (payload.meta && (payload.meta.anchorDate ?? payload.meta.anchor_date)) ??
       payload.snapshotDate ?? payload.snapshot_date ?? null);
    __cvState.__anchorDateValue = ad ? String(ad) : null;


    // UI prefs (optional): payload.meta.ui.mode and .panels are only applied
    // when the user has NOT saved a personal layout preference — prevents the
    // demo/default payload from overwriting a saved layout choice on every load.
    // selectedTrack always comes from the payload when present (it is content-
    // driven, not a user layout preference).
    const uiFromPayload = __cvReadUiFromPayload(payload, __overallSrc);
    const hasUserPref = !!(window.localStorage && window.localStorage.getItem(__UI_STORAGE_KEY));
    if (uiFromPayload){
      if (!hasUserPref){
        __cvState.__uiMode = uiFromPayload.mode;
        __cvState.__uiPanels = Object.assign({}, uiFromPayload.panels);
        __cvWriteUiToLocalStorage({ mode: __cvState.__uiMode, panels: __cvState.__uiPanels });
      }
      // selectedTrack always applies from payload regardless of stored prefs
      if (uiFromPayload.selectedTrack) __cvState.__selectedCodingTrack = uiFromPayload.selectedTrack;
    }

    // allowedModes: server-side mode restriction (optional). Clamping enforced in __cvGetEffectiveUiState.
    try {
      const _meta = payload && typeof payload === 'object' && payload.meta && typeof payload.meta === 'object' ? payload.meta : null;
      const am = _meta && (_meta.allowedModes || _meta.AllowedModes);
      __cvState.__allowedModes = (Array.isArray(am) && am.length > 0)
        ? am.map((m) => __cvNormalizeUiMode(m))
        : null;
    } catch (_) { __cvState.__allowedModes = null; }


    // Overrides for the info pane (dynamic "Analysis of your results")
    if (payload.analysisOverrides && typeof payload.analysisOverrides === "object"){
      __cvState.__analysisOverrides = payload.analysisOverrides;
    }
    if (payload.infoContentOverrides && typeof payload.infoContentOverrides === "object"){
      __cvState.__infoContentOverrides = payload.infoContentOverrides;
    }

    // Structured insights (Option B). Accept both camelCase and PascalCase payloads.
    const insightsObj =
      (__overallSrc.insights && typeof __overallSrc.insights === "object") ? __overallSrc.insights :
      (__overallSrc.Insights && typeof __overallSrc.Insights === "object") ? __overallSrc.Insights :
      null;
    if (insightsObj) __cvState.__insights = insightsObj;
    if (typeof payload.analysisProvider === "function" || typeof __overallSrc.analysisProvider === "function"){
      __cvState.__analysisProvider = (typeof __overallSrc.analysisProvider === "function") ? __overallSrc.analysisProvider : payload.analysisProvider;
    }

    // Charts / metrics data
    // Allocation by category (exercise time): accept multiple payload shapes/casing.
const alloc =
  (__codingSrc.allocation && Array.isArray(__codingSrc.allocation)) ? __codingSrc.allocation :
  (__codingSrc.Allocation && Array.isArray(__codingSrc.Allocation)) ? __codingSrc.Allocation :
  (__codingSrc.allocationByCategory && Array.isArray(__codingSrc.allocationByCategory)) ? __codingSrc.allocationByCategory :
  (__codingSrc.AllocationByCategory && Array.isArray(__codingSrc.AllocationByCategory)) ? __codingSrc.AllocationByCategory :
  (__codingSrc.allocation && __codingSrc.allocation.rows && Array.isArray(__codingSrc.allocation.rows)) ? __codingSrc.allocation.rows :
  (__codingSrc.Allocation && __codingSrc.Allocation.Rows && Array.isArray(__codingSrc.Allocation.Rows)) ? __codingSrc.Allocation.Rows :
  null;

if (alloc){
  exerciseTimeByCategory = alloc.map((x) => ({
    category: String(x.category ?? x.Category ?? ""),
    minutes: Number(x.minutes ?? x.Minutes) || 0,
    solved: Number(x.solved ?? x.Solved) || 0,
  })).filter(x => x.category);

  // Keep category list in sync (used by MCQ and heatmap defaults)
  CATEGORIES = exerciseTimeByCategory.map(x => x.category);
}

// Cache per-track allocation (used by the coding track selector).
function __extractAlloc(src) {
  if (!src) return null;
  const a = src.allocation || src.Allocation || src.allocationByCategory || src.AllocationByCategory;
  if (!Array.isArray(a)) return null;
  return a.map(x => ({
    category: String(x.category ?? x.Category ?? ""),
    minutes: Number(x.minutes ?? x.Minutes) || 0,
    solved: Number(x.solved ?? x.Solved) || 0,
  })).filter(x => x.category);
}
function __extractDepth(src) {
  if (!src) return null;
  const container = (src.depth && typeof src.depth === "object") ? src.depth : src;
  const items = container.depthByCategory || container.DepthByCategory;
  if (Array.isArray(items)) {
    return items.map(x => ({ category: String(x.category ?? x.Category ?? ""), depth: Number(x.depth ?? x.Depth ?? 0) })).filter(x => x.category);
  }
  return null;
}
__cvState.__allocationByTrack.combined = __extractAlloc(__codingSrc) || alloc;
__cvState.__allocationByTrack.micro    = __extractAlloc(__isV2 ? (payload.micro || payload.Micro) : null);
__cvState.__allocationByTrack.interview = __extractAlloc(__isV2 ? (payload.interview || payload.Interview) : null);

    // MCQ payload: accept multiple shapes/casing.
const mcq =
  (__mcqSrc && __mcqSrc.mcq && typeof __mcqSrc.mcq === "object") ? __mcqSrc.mcq :
  (__mcqSrc && __mcqSrc.Mcq && typeof __mcqSrc.Mcq === "object") ? __mcqSrc.Mcq :
  (__mcqSrc && typeof __mcqSrc === "object" && (
    __mcqSrc.byDifficulty || __mcqSrc.ByDifficulty ||
    __mcqSrc.overall || __mcqSrc.Overall ||
    __mcqSrc.basic || __mcqSrc.Basic ||
    __mcqSrc.intermediate || __mcqSrc.Intermediate ||
    __mcqSrc.advanced || __mcqSrc.Advanced
  )) ? __mcqSrc :
  null;

if (mcq){
  const byDiff =
    (mcq.byDifficulty && typeof mcq.byDifficulty === "object") ? mcq.byDifficulty :
    (mcq.ByDifficulty && typeof mcq.ByDifficulty === "object") ? mcq.ByDifficulty :
    null;

  const basicMap =
    byDiff ? (byDiff.basic || byDiff.Basic || {}) :
    (mcq.basic || mcq.Basic || {});

  const interMap =
    byDiff ? (byDiff.intermediate || byDiff.Intermediate || {}) :
    (mcq.intermediate || mcq.Intermediate || {});

  const advMap =
    byDiff ? (byDiff.advanced || byDiff.Advanced || {}) :
    (mcq.advanced || mcq.Advanced || {});

  const cats = (Array.isArray(CATEGORIES) && CATEGORIES.length)
    ? CATEGORIES.slice()
    : Array.from(new Set([].concat(Object.keys(basicMap||{}), Object.keys(interMap||{}), Object.keys(advMap||{}))));

  const byEv =
    (mcq.byDifficultyEvidence && typeof mcq.byDifficultyEvidence === "object") ? mcq.byDifficultyEvidence :
    (mcq.ByDifficultyEvidence && typeof mcq.ByDifficultyEvidence === "object") ? mcq.ByDifficultyEvidence :
    null;

  const evBasicMap = byEv ? (byEv.basic || byEv.Basic || {}) : (mcq.basicEvidence || mcq.BasicEvidence || {});
  const evInterMap = byEv ? (byEv.intermediate || byEv.Intermediate || {}) : (mcq.intermediateEvidence || mcq.IntermediateEvidence || {});
  const evAdvMap = byEv ? (byEv.advanced || byEv.Advanced || {}) : (mcq.advancedEvidence || mcq.AdvancedEvidence || {});

  const getEv = (map, category) => {
    const e = map && map[category];
    if (!e || typeof e !== "object") return { attempts: 0, questions: 0 };
    const a = Number(e.attempts ?? e.Attempts) || 0;
    const q = Number(e.questions ?? e.Questions) || 0;
    return { attempts: a, questions: q };
  };

  const mk = (score, ev) => ({
    avgScore: Number(score) || 0,
    attemptCount: Number(ev && ev.attempts) || 0,
    questionCount: Number(ev && ev.questions) || 0,
    last7Delta: 0
  });

  mcqMatrix = cats.map((category) => ({
    category,
    Easy: mk(basicMap[category], getEv(evBasicMap, category)),
    Medium: mk(interMap[category], getEv(evInterMap, category)),
    Hard: mk(advMap[category], getEv(evAdvMap, category)),
  }));

  const overall =
    (mcq.overallCorrect && typeof mcq.overallCorrect === "object") ? mcq.overallCorrect :
    (mcq.OverallCorrect && typeof mcq.OverallCorrect === "object") ? mcq.OverallCorrect :
    (mcq.overall && typeof mcq.overall === "object") ? mcq.overall :
    (mcq.Overall && typeof mcq.Overall === "object") ? mcq.Overall :
    null;

  if (overall){
    mcqOverallTotals = {
      correct: Number(overall.correct ?? overall.Correct) || 0,
      total: Number(overall.total ?? overall.Total) || 0
    };
  }
}

    // Time on platform: accept multiple shapes/casing and parse ISO dates safely.
const top =
  (__overallSrc.timeOnPlatform && typeof __overallSrc.timeOnPlatform === "object") ? __overallSrc.timeOnPlatform :
  (__overallSrc.TimeOnPlatform && typeof __overallSrc.TimeOnPlatform === "object") ? __overallSrc.TimeOnPlatform :
  null;

const daily =
  (top && Array.isArray(top.daily)) ? top.daily :
  (top && Array.isArray(top.Daily)) ? top.Daily :
  (__overallSrc.dailyPlatform && Array.isArray(__overallSrc.dailyPlatform)) ? __overallSrc.dailyPlatform :
  (__overallSrc.DailyPlatform && Array.isArray(__overallSrc.DailyPlatform)) ? __overallSrc.DailyPlatform :
  null;

if (daily){
  const mapped = daily.map((p) => ({
    date: parseIsoDate(p.date ?? p.Date),
    minutes: Number(p.minutes ?? p.Minutes) || 0
  })).filter(x => x.date instanceof Date && !isNaN(x.date.getTime()));

  // Densify last ~370 days so UI toggles and KPIs remain stable even if backend sends sparse days.
  const map = new Map();
  mapped.forEach(x => {
    const key = `${x.date.getFullYear()}-${String(x.date.getMonth()+1).padStart(2,'0')}-${String(x.date.getDate()).padStart(2,'0')}`;
    map.set(key, (map.get(key) || 0) + x.minutes);
  });

  const now = new Date(); now.setHours(0,0,0,0);
  const start = new Date(now); start.setDate(now.getDate() - 369);

  const out = [];
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)){
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    out.push({ date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), minutes: map.get(key) || 0 });
  }
  DAILY_PLATFORM_SERIES = out;
}

    
if (__overallSrc.metrics && typeof __overallSrc.metrics === "object"){
  // Accept both camelCase and snake_case metric keys
  const m = __overallSrc.metrics;

  const num = (v) => (v === null || v === undefined) ? null : Number(v);
  const pick = (...keys) => {
    for (const k of keys){
      if (m[k] !== undefined) return num(m[k]);
    }
    return null;
  };

  const cod = pick("codiviumScore","codivium_score");
  const bAll = pick("breadthOverall","overall_breadth","overallBreadth");
  const bInt = pick("breadthInterview","interview_breadth","interviewBreadth");
  const bMic = pick("breadthMicro","micro_challenge_breadth","microBreadth","micro_challengeBreadth");
  const bMcq = pick("breadthMcq","mcq_breadth","mcqBreadth");
  const ft = pick("firstTryPassRate","first_try_pass","firstTryPass");
  const avgA = pick("avgAttemptsToAC","avg_attempts","avgAttempts");
  const medT = pick("medianTimeToACMinutes","median_time","medianTime");
  const wMcq = pick("weightedMcqScore","weighted_mcq_score","weightedMcq");

  const ptsAll = pick("codiviumPointsAll","codivium_points_all","pointsAll","points_all");
  const pts30  = pick("codiviumPoints30","codivium_points_30","points30","points_30");
  const effHr  = pick("efficiencyPtsPerHr","efficiency_pts_per_hr","efficiencyPtsHr","ptsPerHr","efficiency");
  const dAll   = pick("depthOverall","depth_overall","depthOverallScore","overallDepth");
  const dMic   = pick("depthMicro","depth_micro","microDepth");
  const dInt   = pick("depthInterview","depth_interview","interviewDepth");

  __cvState.__metricsOverride = {
    codiviumScore: cod,
    breadthOverall: bAll,
    breadthInterview: bInt,
    breadthMicro: bMic,
    breadthMcq: bMcq,
    weightedMcqScore: wMcq,
    // Points, efficiency and depth variants — needed by renderScoresExpanded
    codiviumPointsAll: ptsAll,
    codiviumPoints30: pts30,
    efficiencyPtsPerHr: effHr,
    depthOverall: dAll,
    depthMicro: dMic,
    depthInterview: dInt,
  };

  // Update the submission snapshot metrics if provided
  if (ft != null) submissionMetrics.firstTryPassRate = ft;
  if (avgA != null) submissionMetrics.avgAttemptsToAC = avgA;
  if (medT != null) submissionMetrics.medianTimeToACMinutes = medT;

  // Also reflect directly into pills for interpretation fallback (safe)
  if (cod != null) setText("codiviumScore", Math.round(cod));
  if (bAll != null) setText("breadthScore", Math.round(bAll));
  if (bInt != null) setText("interviewBreadthScore", Math.round(bInt));
  if (bMic != null) setText("microBreadthScore", Math.round(bMic));
  if (bMcq != null) setText("mcqBreadthScore", Math.round(bMcq));
  if (wMcq != null) setText("weightedMcqScore", Math.round(wMcq));
  if (ptsAll != null) setText("codiviumPointsAll", Math.round(ptsAll));
  if (pts30 != null) setText("codiviumPoints30", Math.round(pts30));
  if (effHr != null) setText("efficiencyPtsPerHr", (Math.round(effHr*10)/10).toFixed(1));
  if (dAll != null) setText("depthOverallScore", Math.round(dAll));
  if (dMic != null) setText("microDepthScore", Math.round(dMic));
  if (dInt != null) setText("interviewDepthScore", Math.round(dInt));
}

// Convergence heatmap
function __extractHeatmapFromAny(obj){
  if (!obj || typeof obj !== "object") return null;
  // Accept either {convergenceHeatmap:{...}} or the heatmap object directly
  const hm = (obj.convergenceHeatmap && typeof obj.convergenceHeatmap === "object") ? obj.convergenceHeatmap :
             (obj.ConvergenceHeatmap && typeof obj.ConvergenceHeatmap === "object") ? obj.ConvergenceHeatmap :
             obj;

  const categories = hm.categories || hm.Categories || null;
  const buckets = hm.buckets || hm.Buckets || null;
  const values = hm.values || hm.Values || null;
  const counts = hm.counts || hm.Counts || null;

  // Focus/ranking metadata (v2)
  const focus = (hm.focus && typeof hm.focus === "object") ? hm.focus : (hm.Focus && typeof hm.Focus === "object") ? hm.Focus : null;
  const focusModes =
    (focus && Array.isArray(focus.modes)) ? focus.modes :
    (focus && Array.isArray(focus.Modes)) ? focus.Modes :
    (Array.isArray(hm.focusModes)) ? hm.focusModes :
    (Array.isArray(hm.FocusModes)) ? hm.FocusModes :
    null;

  const defaultModeId =
    (focus && (focus.defaultModeId || focus.DefaultModeId || focus.default_mode || focus.defaultMode)) ? String(focus.defaultModeId || focus.DefaultModeId || focus.default_mode || focus.defaultMode) :
    (hm.defaultModeId || hm.DefaultModeId || hm.default_mode || hm.defaultMode) ? String(hm.defaultModeId || hm.DefaultModeId || hm.default_mode || hm.defaultMode) :
    null;

  const rankings =
    (focus && focus.rankings && typeof focus.rankings === "object") ? focus.rankings :
    (focus && focus.Rankings && typeof focus.Rankings === "object") ? focus.Rankings :
    (hm.focusRankings && typeof hm.focusRankings === "object") ? hm.focusRankings :
    (hm.FocusRankings && typeof hm.FocusRankings === "object") ? hm.FocusRankings :
    null;

  const topNDefault =
    (focus && (focus.topNDefault || focus.top_n_default)) ? Number(focus.topNDefault || focus.top_n_default) :
    (hm.topNDefault || hm.top_n_default) ? Number(hm.topNDefault || hm.top_n_default) :
    null;

  const topNOptions =
    (focus && Array.isArray(focus.topNOptions)) ? focus.topNOptions :
    (focus && Array.isArray(focus.top_n_options)) ? focus.top_n_options :
    (Array.isArray(hm.topNOptions)) ? hm.topNOptions :
    (Array.isArray(hm.top_n_options)) ? hm.top_n_options :
    null;

  if (!Array.isArray(categories) || !Array.isArray(values)) return null;

  return {
    categories: categories.map(String),
    buckets: Array.isArray(buckets) ? buckets.map(String) : null,
    values: values,
    counts: Array.isArray(counts) ? counts : null,
    focusModes: focusModes,
    defaultModeId: defaultModeId,
    focusRankings: rankings,
    topNDefault: (isFinite(topNDefault) && topNDefault > 0) ? topNDefault : null,
    topNOptions: Array.isArray(topNOptions) ? topNOptions.map((x)=>Number(x)).filter((n)=>isFinite(n) && n>0) : null,
  };
}

// Combined (coding) heatmap drives the main heatmap view
const __combinedHm = __extractHeatmapFromAny(__codingSrc);
if (__combinedHm){
  __cvState.__convergenceOverride = {
    categories: __combinedHm.categories,
    buckets: __combinedHm.buckets,
    values: __combinedHm.values,
    counts: __combinedHm.counts
  };

  if (__isV2){
    const microHm = __extractHeatmapFromAny(__microSrc || {});
    const interviewHm = __extractHeatmapFromAny(__interviewSrc || {});
    __cvState.__heatmapData = {
      combined: __combinedHm,
      micro: microHm || null,
      interview: interviewHm || null
    };

    // Focus configuration (backend-driven ranking)
    const modes = Array.isArray(__combinedHm.focusModes) ? __combinedHm.focusModes : null;
    const defaultId = __combinedHm.defaultModeId || (modes && modes[0] && (modes[0].id || modes[0].Id)) || null;
    const rankings = __combinedHm.focusRankings || null;

    __cvState.__heatmapFocus = {
      modes: modes ? modes.map((m)=>({
        id: String(m.id || m.Id || ''),
        label: String(m.label || m.Label || m.id || m.Id || ''),
        description: String(m.description || m.Description || ''),
        isDefault: !!(m.isDefault || m.IsDefault)
      })).filter(x=>x.id) : [],
      defaultModeId: String(defaultId || ''),
      rankings: (rankings && typeof rankings === 'object') ? rankings : {},
      topNDefault: __combinedHm.topNDefault || 12,
      topNOptions: __combinedHm.topNOptions || [8,10,12,14,16]
    };

    if (!__cvState.__heatmapFocusModeId){
      const pick = (__cvState.__heatmapFocus.modes || []).find(x=>x.isDefault) || (__cvState.__heatmapFocus.modes || [])[0] || null;
      __cvState.__heatmapFocusModeId = pick ? pick.id : (__cvState.__heatmapFocus.defaultModeId || 'impact');
    }
    if (!(__cvState.__heatmapTopN && isFinite(__cvState.__heatmapTopN))){
      __cvState.__heatmapTopN = __cvState.__heatmapFocus.topNDefault || 12;
    }
  }
}

// Depth by category (dashboard depth chart)
// Accept either:
// - source.depthByCategory: [{category, depth}, ...] OR { [category]: depth }
// - source.depth: { depthByCategory: ..., depthAvg: ... }
const depthSource = (__codingSrc && typeof __codingSrc === "object") ? __codingSrc : payload;
const depthContainer = depthSource.depth && typeof depthSource.depth === "object" ? depthSource.depth : depthSource;

const depthItems = depthContainer.depthByCategory || depthContainer.DepthByCategory || null;
const depthAvg = depthContainer.depthAvg ?? depthContainer.DepthAvg ?? null;

if (Array.isArray(depthItems)){
  __cvState.__depthOverride = depthItems
    .map((x) => ({
      category: String(x.category ?? x.Category ?? ""),
      depth: Number(x.depth ?? x.Depth ?? 0)
    }))
    .filter(x => x.category.length > 0);
} else if (depthItems && typeof depthItems === "object"){
  __cvState.__depthOverride = Object.keys(depthItems).map((k) => ({ category: String(k), depth: Number(depthItems[k]) || 0 }));
}

if (depthAvg != null) __cvState.__depthAvgOverride = Number(depthAvg) || 0;
else if (Array.isArray(__cvState.__depthOverride) && __cvState.__depthOverride.length){
  __cvState.__depthAvgOverride = __cvState.__depthOverride.reduce((a,b)=>a+(b.depth||0),0) / __cvState.__depthOverride.length;
}

// Cache per-track depth (used by the coding track selector).
__cvState.__depthByTrack.combined  = __extractDepth(__codingSrc) || __cvState.__depthOverride;
__cvState.__depthByTrack.micro     = __extractDepth(__isV2 ? (payload.micro || payload.Micro) : null);
__cvState.__depthByTrack.interview = __extractDepth(__isV2 ? (payload.interview || payload.Interview) : null);

// Recommended actions (Option C)
const ra = (__overallSrc && Array.isArray(__overallSrc.recommendedActions)) ? __overallSrc.recommendedActions :
           (__overallSrc && Array.isArray(__overallSrc.RecommendedActions)) ? __overallSrc.RecommendedActions :
           (payload && Array.isArray(payload.recommendedActions)) ? payload.recommendedActions :
           (payload && Array.isArray(payload.RecommendedActions)) ? payload.RecommendedActions :
           [];
__cvState.__recommendedActions = Array.isArray(ra) ? ra.slice() : [];
    // Apply UI mode + panel visibility + dynamic layout on every payload update (safe no-op if mount missing)
    if (typeof __cvApplyUiModeAndLayout === 'function') __cvApplyUiModeAndLayout();
    else __cvApplyPanelVisibility();


  // End of applyDashboardData
  }

function setInfoPane(key) {
    const data = getInfoContent(key);
    if (!data) return;
    setText("infoPaneTitle", data.title || "Metric details");
    setText("infoPaneSub", data.sub || "");
    const bodyEl = cv$("infoPaneBody");
    if (bodyEl) {
      const body = (data.body || "").replace(/\\n/g, "\n");
      bodyEl.textContent = body;
}
const aggWrap = cv$("infoAgg");
const aggBtn = cv$("infoAggBtn");
const aggBody = cv$("infoAggBody");
const aggText = (data.agg || data.aggregation || "").replace(/\n/g, "\n");

if (aggWrap && aggBtn && aggBody) {
  if (aggText && aggText.trim().length > 0) {
    aggWrap.style.display = "";
    aggBtn.style.display = "";
    aggBtn.setAttribute("aria-expanded", "false");
    aggBody.classList.add("isHidden");
    aggBody.textContent = aggText;
} else {
    aggWrap.style.display = "none";
    aggBtn.setAttribute("aria-expanded", "false");
    aggBody.classList.add("isHidden");
    aggBody.textContent = "";
  }
}
    const interpEl = cv$("infoPaneInterp");
    if (interpEl) interpEl.textContent = getAnalysisText(key) || "";
}

  function refreshInfoIfActive(key){
    if (!key) return;
    if (__cvState.__activeInfoKey !== key) return;
    try {
      if (SCORE_INFO_KEYS.has(key)) setScoresInfoPane(key);
      else setInfoPane(key);
    } catch (e) { ciErr('ignored error', e); }
  }

  function refreshActiveInfoPane(){
    if (!__cvState.__activeInfoKey) return;
    refreshInfoIfActive(__cvState.__activeInfoKey);
  }

  

// =============================================================
// PANEL RESIZER — DRAG-TO-RESIZE
// =============================================================

// dashboard.00e.resizers.js — Splitter factories, drag handlers, resizer init/cleanup
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

const __CV_RESIZERS_KEY       = 'cv.dashboard.resizers';
  const __CV_RESIZER_INFO_W_MIN = 300;
  const __CV_RESIZER_INFO_W_MAX = 680;
  const __CV_RESIZER_MCQ_H_MIN  = 160;
  const __CV_RESIZER_MCQ_H_MAX  = 620;

  function __cvReadResizerState(){
    try {
      if (!window.localStorage) return {};
      const raw = window.localStorage.getItem(__CV_RESIZERS_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }

  function __cvWriteResizerState(patch){
    try {
      if (!window.localStorage) return;
      const existing = __cvReadResizerState();
      window.localStorage.setItem(__CV_RESIZERS_KEY,
        JSON.stringify(Object.assign({}, existing, patch)));
    } catch (e) {}
  }

  function __cvRestoreResizerState(mount){
    const st = __cvReadResizerState();
    // Use saved value if above minimum, otherwise apply default (40% wider than legacy 14.4%)
    const infoWDefault = 380;
    const infoW = (st.infoW && st.infoW >= __CV_RESIZER_INFO_W_MIN) ? st.infoW : infoWDefault;
    mount.style.setProperty('--cv-info-w', infoW + 'px');
    if (st.mcqH)     mount.style.setProperty('--cv-mcq-h',     st.mcqH  + 'px');
    // heatCols is stored as fr values (e.g. "26.7fr 23.1fr 48.4fr")
    if (st.heatCols) mount.style.setProperty('--cv-heat-cols', st.heatCols);
    // Col-panel flex: restore directly as inline important style on each panel
    const restore = [
      ['.scoresPalette', st.scoresFlex],
      ['.depthPanel',    st.depthFlex],
      ['.timePanel',     st.timeFlex],
      ['.donutPanel',    st.donutFlex],
    ];
    restore.forEach(([sel, val]) => {
      if (val != null){
        const el = mount.querySelector(sel);
        if (el) el.style.setProperty('flex', val + ' 1 0', 'important');
      }
    });
  }

  // Returns the current breakpoint for the mount (duplicates __cvGetBreakpoint for use
  // inside the resizer module without a hard dependency on its exact location).
  function __cvResizerBreakpoint(){
    try { return __cvGetEffectiveUiState().breakpoint; } catch (_) { return 'wide'; }
  }

  // Re-positions absolutely-placed form-body splitters to the true midpoint of each gap.
  // Only runs when breakpoint is 'wide' — heatmap splitters don't exist in other layouts.
  function __cvPositionGridSplitters(mount){
    const formBody = mount.querySelector('.form-body');
    if (!formBody) return;
    const fbRect = formBody.getBoundingClientRect();
    const bp = __cvResizerBreakpoint();

    // MCQ row boundary — midpoint between bottom of analytics area and top of MCQ panel
    const mcqEl  = mount.querySelector('.mcqPanel');
    const colL   = mount.querySelector('.colLeft');
    const mcqSpl = formBody.querySelector('#cvSplitterMcq');
    if (mcqEl && mcqSpl){
      const mcqTop    = mcqEl.getBoundingClientRect().top    - fbRect.top;
      const refBottom = colL
        ? (colL.getBoundingClientRect().bottom - fbRect.top)
        : (mcqTop - 9);
      mcqSpl.style.top = Math.max(0, ((refBottom + mcqTop) / 2) - 12) + 'px';
    }

    // Heatmap column splitters — only valid in wide layout
    if (bp !== 'wide') return;
    const heatEl = mount.querySelector('.heatmapPanel');
    const colR   = mount.querySelector('.colRight');
    const heatL  = formBody.querySelector('#cvSplitterHeatL');
    const heatR  = formBody.querySelector('#cvSplitterHeatR');
    if (!heatEl) return;
    const hRect  = heatEl.getBoundingClientRect();
    const topOff = hRect.top  - fbRect.top;
    const rowH   = hRect.height;
    if (heatL && colL){
      const lRect = colL.getBoundingClientRect();
      const midX  = (lRect.right + hRect.left) / 2 - fbRect.left;
      heatL.style.left   = (midX - 12) + 'px';
      heatL.style.top    = topOff + 'px';
      heatL.style.height = rowH  + 'px';
    }
    if (heatR && colR){
      const rRect = colR.getBoundingClientRect();
      const midX  = (hRect.right + rRect.left) / 2 - fbRect.left;
      heatR.style.left   = (midX - 12) + 'px';
      heatR.style.top    = topOff + 'px';
      heatR.style.height = rowH  + 'px';
    }
  }

  function __cvBindSplitterGlow(splitter, isVertical){
    splitter.addEventListener('mousemove', (e) => {
      try {
        const r = splitter.getBoundingClientRect();
        if (isVertical){
          splitter.style.setProperty('--sp-y',
            ((e.clientY - r.top) / Math.max(1, r.height) * 100).toFixed(1) + '%');
        } else {
          splitter.style.setProperty('--sp-x',
            ((e.clientX - r.left) / Math.max(1, r.width) * 100).toFixed(1) + '%');
        }
      } catch (_) {}
    }, { passive: true });
  }

  function __cvMakeSplitter(id, extraClass, ariaLabel, ariaOrientation){
    const el = document.createElement('div');
    el.id = id;
    el.className = 'cvSplitter ' + extraClass;
    el.setAttribute('role',             'separator');
    el.setAttribute('aria-label',       ariaLabel);
    el.setAttribute('aria-orientation', ariaOrientation);
    el.setAttribute('tabindex',         '0');
    el.innerHTML = '<div class="cvSplitLine"></div>';
    return el;
  }

  function __cvStartDrag(splitter, mount){
    splitter.classList.add('cv-active');
    mount.classList.add('cv-splitting');
  }
  function __cvEndDrag(splitter, mount){
    splitter.classList.remove('cv-active');
    mount.classList.remove('cv-splitting');
  }

  // ── Info-pane vertical splitter ──────────────────────────────────────
  function __cvInitInfoPaneSplitter(mount){
    const layout   = mount.querySelector('.insights-layout');
    const infoPane = mount.querySelector('#infoPane');
    if (!layout || !infoPane) return;
    if (layout.querySelector('#cvSplitterInfoPane')) return;

    const splitter = __cvMakeSplitter('cvSplitterInfoPane', 'cvSplitterV',
      'Drag to resize the analysis pane', 'vertical');
    layout.insertBefore(splitter, infoPane);
    __cvBindSplitterGlow(splitter, true);

    let dragging = false, startX = 0, startW = 0;

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startX = e.clientX;
      try { startW = parseFloat(getComputedStyle(infoPane).width) || 380; } catch (_) { startW = 380; }
      splitter.setPointerCapture(e.pointerId);
      __cvStartDrag(splitter, mount);
    });
    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const newW = Math.max(__CV_RESIZER_INFO_W_MIN,
        Math.min(__CV_RESIZER_INFO_W_MAX, startW + (startX - e.clientX)));
      mount.style.setProperty('--cv-info-w', newW + 'px');
      // Reposition absolute splitters so they track the resizing form-body
      __cvPositionGridSplitters(mount);
    }, { passive: true });
    const onEnd = () => {
      if (!dragging) return; dragging = false;
      __cvEndDrag(splitter, mount);
      try {
        __cvWriteResizerState({
          infoW: Math.round(parseFloat(getComputedStyle(infoPane).width) || startW)
        });
      } catch (_) {}
    };
    splitter.addEventListener('pointerup',     onEnd);
    splitter.addEventListener('pointercancel', onEnd);
  }

  // ── MCQ row-boundary horizontal splitter ─────────────────────────────
  function __cvInitMcqSplitter(mount){
    const formBody = mount.querySelector('.form-body');
    const mcqPanel = mount.querySelector('.mcqPanel');
    if (!formBody || !mcqPanel) return;
    if (formBody.querySelector('#cvSplitterMcq')) return;

    const splitter = __cvMakeSplitter('cvSplitterMcq', 'cvSplitterH',
      'Drag to resize MCQ panel', 'horizontal');
    formBody.appendChild(splitter);
    __cvBindSplitterGlow(splitter, false);
    __cvPositionGridSplitters(mount);

    let dragging = false, startY = 0, startH = 0, baseRows = [];

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startY = e.clientY;
      try { startH = parseFloat(getComputedStyle(mcqPanel).height) || 280; } catch (_) { startH = 280; }
      try {
        const raw = formBody.style.getPropertyValue('grid-template-rows') || '';
        const tokens = raw.match(/minmax\([^)]+\)|\d+(?:\.\d+)?(?:px|fr|%)/g) || [];
        baseRows = tokens.length > 1 ? tokens.slice(0, -1) : ['minmax(0, 2.73fr)'];
      } catch (_) { baseRows = ['minmax(0, 2.73fr)']; }
      splitter.setPointerCapture(e.pointerId);
      __cvStartDrag(splitter, mount);
    });
    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const newH = Math.max(__CV_RESIZER_MCQ_H_MIN,
        Math.min(__CV_RESIZER_MCQ_H_MAX, startH - (e.clientY - startY)));
      mount.style.setProperty('--cv-mcq-h', newH + 'px');
      formBody.style.setProperty('grid-template-rows',
        [...baseRows, newH + 'px'].join(' '));
      __cvPositionGridSplitters(mount);
    }, { passive: true });
    const onEnd = () => {
      if (!dragging) return; dragging = false;
      __cvEndDrag(splitter, mount);
      try {
        __cvWriteResizerState({
          mcqH: Math.round(
            parseFloat(mount.style.getPropertyValue('--cv-mcq-h')) || startH)
        });
      } catch (_) {}
    };
    splitter.addEventListener('pointerup',     onEnd);
    splitter.addEventListener('pointercancel', onEnd);
  }

  // ── Heatmap left + right vertical column splitters ───────────────────
  // Only injected on 'wide' breakpoint. Stores fr ratios so grid always
  // reflows proportionally when the insights-form container changes width.
  function __cvInitHeatSplitters(mount){
    const formBody = mount.querySelector('.form-body');
    const heatEl   = mount.querySelector('.heatmapPanel');
    if (!formBody || !heatEl) return;
    if (__cvResizerBreakpoint() !== 'wide') return; // not relevant outside wide layout

    ['HeatL', 'HeatR'].forEach((side) => {
      const id = 'cvSplitter' + side;
      if (formBody.querySelector('#' + id)) return;
      const splitter = __cvMakeSplitter(id, 'cvSplitterV',
        side === 'HeatL' ? 'Drag to resize left column' : 'Drag to resize right column',
        'vertical');
      formBody.appendChild(splitter);
      __cvBindSplitterGlow(splitter, true);
    });
    __cvPositionGridSplitters(mount);

    [['HeatL', 'left'], ['HeatR', 'right']].forEach(([side, which]) => {
      const splitter = formBody.querySelector('#cvSplitter' + side);
      if (!splitter) return;
      let dragging = false, startX = 0, startCols = [];

      splitter.addEventListener('pointerdown', (e) => {
        e.preventDefault(); dragging = true; startX = e.clientX;
        try {
          startCols = ['.colLeft', '.heatmapPanel', '.colRight']
            .map((s) => mount.querySelector(s))
            .filter(Boolean)
            .map((el) => el.getBoundingClientRect().width);
          if (startCols.length !== 3) startCols = [300, 260, 440];
        } catch (_) { startCols = [300, 260, 440]; }
        splitter.setPointerCapture(e.pointerId);
        __cvStartDrag(splitter, mount);
      });
      splitter.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        let [lw, mw, rw] = startCols;
        if (which === 'left'){
          lw = Math.max(80, lw + dx);
          mw = Math.max(80, startCols[0] + startCols[1] - lw);
        } else {
          rw = Math.max(80, rw - dx);
          mw = Math.max(80, startCols[1] + startCols[2] - rw);
        }
        // Store and apply as fr ratios so grid always reflows with container width.
        const total = lw + mw + rw;
        const frL = (lw / total * 100).toFixed(3);
        const frM = (mw / total * 100).toFixed(3);
        const frR = (rw / total * 100).toFixed(3);
        const tpl = frL + 'fr ' + frM + 'fr ' + frR + 'fr';
        formBody.style.setProperty('grid-template-columns', tpl);
        mount.style.setProperty('--cv-heat-cols', tpl);
        __cvPositionGridSplitters(mount);
      }, { passive: true });
      const onEnd = () => {
        if (!dragging) return; dragging = false;
        __cvEndDrag(splitter, mount);
        try {
          __cvWriteResizerState({
            heatCols: mount.style.getPropertyValue('--cv-heat-cols')
          });
        } catch (_) {}
      };
      splitter.addEventListener('pointerup',     onEnd);
      splitter.addEventListener('pointercancel', onEnd);
    });
  }

  // ── Generic in-column horizontal flex splitter ───────────────────────
  // Writes flex directly as important inline style on the panels so it beats
  // all !important stylesheet rules. Uses the actual panel rects (excluding
  // the splitter itself) to compute the drag delta correctly.
  function __cvInitColSplitter(mount, colSel, id, selTop, selBot, storeTop, storeBot){
    const colEl = mount.querySelector(colSel);
    const topEl = colEl && colEl.querySelector(selTop);
    const botEl = colEl && colEl.querySelector(selBot);
    if (!colEl || !topEl || !botEl) return;
    if (colEl.querySelector('#' + id)) return;

    const splitter = __cvMakeSplitter(id, 'cvSplitterH', 'Drag to resize panels', 'horizontal');
    colEl.insertBefore(splitter, botEl);
    __cvBindSplitterGlow(splitter, false);

    let dragging = false, startY = 0, startTopH = 0, startBotH = 0;

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startY = e.clientY;
      // Measure only the panel heights (not the splitter itself)
      startTopH = topEl.getBoundingClientRect().height;
      startBotH = botEl.getBoundingClientRect().height;
      splitter.setPointerCapture(e.pointerId);
      __cvStartDrag(splitter, mount);
    });
    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy      = e.clientY - startY;
      const newTopH = Math.max(80, startTopH + dy);
      const newBotH = Math.max(80, startBotH - dy);
      const total   = newTopH + newBotH;
      const fTop    = parseFloat((newTopH / total * 100).toFixed(3));
      const fBot    = parseFloat((newBotH / total * 100).toFixed(3));
      // inline !important beats all stylesheet rules including !important
      topEl.style.setProperty('flex', fTop + ' 1 0', 'important');
      botEl.style.setProperty('flex', fBot + ' 1 0', 'important');
    }, { passive: true });
    const onEnd = () => {
      if (!dragging) return; dragging = false;
      __cvEndDrag(splitter, mount);
      try {
        const patch = {};
        patch[storeTop] = parseFloat(topEl.style.flex) || 0;
        patch[storeBot] = parseFloat(botEl.style.flex) || 0;
        __cvWriteResizerState(patch);
      } catch (_) {}
    };
    splitter.addEventListener('pointerup',     onEnd);
    splitter.addEventListener('pointercancel', onEnd);
  }

  // ── Cleanup all splitters ────────────────────────────────────────────
  function __cvCleanupResizers(mount){
    ['#cvSplitterInfoPane','#cvSplitterMcq','#cvSplitterHeatL',
     '#cvSplitterHeatR','#cvSplitterScoresDep','#cvSplitterTimeDon']
      .forEach((sel) => {
        try { const el = mount.querySelector(sel); if (el) el.remove(); } catch (_) {}
      });
  }

  // ── Main entry point ─────────────────────────────────────────────────
  // True only when every main panel is visible — i.e. the full dashboard layout.
  function __cvIsFullDashboard(st){
    if (!st || st.mode !== 'full') return false;
    const p = st.panels || {};
    return !!(p.scores && p.depth && p.heatmap && p.time && p.allocation && p.mcq);
  }

  function __cvInitPanelResizers(){
    const mount = getMount();
    if (!mount) return;
    const st = __cvGetEffectiveUiState();

    if (st.mode === 'info_only' || st.breakpoint === 'narrow'){
      __cvCleanupResizers(mount);
      return;
    }

    __cvRestoreResizerState(mount);
    // Info-pane splitter present on all layouts (except summary/narrow above).
    __cvInitInfoPaneSplitter(mount);

    if (__cvIsFullDashboard(st)){
      __cvInitMcqSplitter(mount);
      if (st.breakpoint === 'wide'){
        __cvInitHeatSplitters(mount);
      } else {
        try { const el = mount.querySelector('#cvSplitterHeatL'); if (el) el.remove(); } catch (_) {}
        try { const el = mount.querySelector('#cvSplitterHeatR'); if (el) el.remove(); } catch (_) {}
      }
      __cvInitColSplitter(mount, '.colLeft',  'cvSplitterScoresDep',
        '.scoresPalette', '.depthPanel',  'scoresFlex', 'depthFlex');
      __cvInitColSplitter(mount, '.colRight', 'cvSplitterTimeDon',
        '.timePanel',     '.donutPanel',  'timeFlex',   'donutFlex');
      setTimeout(() => __cvPositionGridSplitters(mount), 0);
    } else {
      // Non-full layout — remove all panel-level splitters.
      ['#cvSplitterMcq','#cvSplitterHeatL','#cvSplitterHeatR',
       '#cvSplitterScoresDep','#cvSplitterTimeDon']
        .forEach((sel) => {
          try { const el = mount.querySelector(sel); if (el) el.remove(); } catch (_) {}
        });
    }
  }

// dashboard.01.scoreinfo.js — Score info panel content registry.

// -----------------------------
// Score-only Insights Rendering (Option B)
// -----------------------------
const SCORE_INFO_KEYS = new Set(["tour_layout_presets","tour_info_toggle","tour_i_buttons","tour_cta_buttons","tour_faq","tour_glossary","dashboard_overview","panel_scores","panel_depth","codiviumScore","medianTimeToAC","avgAttemptsToAC","firstTryPassRate","breadthScore","microBreadthScore","interviewBreadthScore","mcqBreadthScore","panel_heatmap","panel_time","panel_exercise","panel_mcq","mcqEasy","mcqMedium","mcqHard","codiviumPointsAll","codiviumPoints30","efficiencyPtsPerHr","depthOverallScore","microDepthScore","interviewDepthScore"]);

function clearInfoPaneStaticText(){
  // The tour windows keep their explanatory text; the always-visible info pane shows analysis only.
  const bodyEl = cv$("infoPaneBody");
  if (bodyEl) bodyEl.textContent = "";
  const aggWrap = cv$("infoAgg");
  if (aggWrap) aggWrap.style.display = "none";
}

function renderInsightObject(container, insight){
  if (!container) return;

  // Clear
  container.textContent = "";
  while (container.firstChild) container.removeChild(container.firstChild);

  if (!insight || typeof insight !== "object"){
    container.textContent = "Analysis for this score will be added soon.";
    return;
  }

  const sections = Array.isArray(insight.sections) ? insight.sections : [];
  const MAX_SECTIONS_COLLAPSED = 3;
  const needsMore = sections.length > MAX_SECTIONS_COLLAPSED;

  const frag = document.createDocumentFragment();

  const mkHeading = (text) => {
    const el = document.createElement("div");
    el.className = "ciInsightHeading";
    el.textContent = String(text || "");
    return el;
  };

  const mkPara = (text) => {
    const el = document.createElement("div");
    el.className = "ciInsightPara";
    el.textContent = String(text || "");
    return el;
  };

  const mkNote = (text) => {
    const el = document.createElement("div");
    el.className = "ciInsightNote";
    el.textContent = String(text || "");
    return el;
  };

  const mkBullets = (items) => {
    const ul = document.createElement("ul");
    ul.className = "ciInsightList";
    (items || []).forEach((it) => {
      const li = document.createElement("li");
      li.textContent = String(it || "");
      ul.appendChild(li);
    });
    return ul;
  };

  const renderBlocks = (blocks, parent) => {
    (blocks || []).forEach((b) => {
      if (!b || typeof b !== "object") return;
      const kind = String(b.kind || "p");
      if (kind === "bullets") parent.appendChild(mkBullets(b.items || []));
      else if (kind === "note") parent.appendChild(mkNote(b.text || ""));
      else parent.appendChild(mkPara(b.text || ""));
    });
  };

  const renderSection = (sec, parent) => {
    if (!sec || typeof sec !== "object") return;
    if (sec.heading) parent.appendChild(mkHeading(sec.heading));
    renderBlocks(sec.blocks, parent);
  };

  const main = document.createElement("div");
  main.className = "ciInsightWrap";

  const more = document.createElement("div");
  more.className = "ciInsightMore isHidden";

  sections.forEach((sec, idx) => {
    if (!needsMore || idx < MAX_SECTIONS_COLLAPSED) renderSection(sec, main);
    else renderSection(sec, more);
  });

  if (needsMore){
    main.appendChild(more);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ciMoreBtn";
    btn.textContent = "Show more";
    btn.addEventListener("click", () => {
      const isHidden = more.classList.contains("isHidden");
      if (isHidden){
        more.classList.remove("isHidden");
        btn.textContent = "Show less";
      } else {
        more.classList.add("isHidden");
        btn.textContent = "Show more";
      }
    });

    frag.appendChild(main);
    frag.appendChild(btn);
  } else {
    frag.appendChild(main);
  }

  container.appendChild(frag);
}


  // --- Glossary tooltips for beginners ---
  // We keep analysis content as plain text and add safe tooltips in the UI by wrapping key terms
  // in <abbr> elements. This avoids trusting backend HTML.
  const __CI_GLOSSARY = [
    { re: /\bEvidence\b/gi, title: "Evidence = how much data this insight is based on (e.g., number of solves or attempts). More evidence usually means more reliable insights." },
    { re: /\bStable\b/gi, title: "Stable = less likely to swing up/down with a small amount of new activity." },
    { re: /\bCatalog\b/gi, title: "Catalog = the set of categories currently available on Codivium right now (your breadth is measured against this current list)." },
    { re: /\bFreshness\b/gi, title: "Freshness = whether the interpretation is based on recent activity or your full history. Right now we use your full history." },
    { re: /\bBand\b/gi, title: "Band = a simple label describing where this metric sits relative to thresholds (a quick way to interpret the number)." },

    // Band values (shown when relevant)
    { re: /Ramp-up/gi, title: "Ramp-up = you are just getting started covering categories (very early coverage)." },
    { re: /Foundation/gi, title: "Foundation = you have started covering categories, but there are still many gaps." },
    { re: /Developing\s+breadth/gi, title: "Developing breadth = you are covering a growing range of categories; keep expanding while consolidating weak areas." },
    { re: /Strong\s+breadth/gi, title: "Strong breadth = you cover most categories; focus on converting exposure into consistent performance." },
    { re: /Comprehensive/gi, title: "Comprehensive = you cover almost all categories currently available." },
    { re: /Unavailable/gi, title: "Unavailable = there are currently no categories available for this track (so breadth cannot be computed meaningfully)." },

    // Codivium Score band values
    { re: /Getting started/gi, title: "Getting started = you are ramping up. Focus on consistent clean solves and building coverage." },
    { re: /Building foundations/gi, title: "Building foundations = you have a base. Widen coverage and improve correctness/efficiency." },
    { re: /Developing consistency/gi, title: "Developing consistency = performance is becoming repeatable. Keep improving first-try correctness and expand." },
    { re: /Strong performance/gi, title: "Strong performance = solid results across many areas. Push harder categories and interview transfer." },
    { re: /Advanced trajectory/gi, title: "Advanced trajectory = strong overall trajectory. Maintain breadth and push difficulty with high correctness." },


    // Additional beginner-friendly terms

    { re: /\bCoverage\b/gi, title: "Coverage = breadth. It means how many categories you have touched out of what is currently available. Coverage ≠ mastery." },
    { re: /\bconcentration\b/gi, title: "Concentration = how much of your total depth sits in your top categories (e.g., top-1 or top-3 share). Some concentration is normal during focus cycles; extreme concentration can hide gaps." },
    { re: /\bOutliers?\b/gi, title: "Outliers = categories unusually high or low compared to your own baseline. We compute this robustly (median + MAD) and only show it when there is enough evidence, to avoid false alarms." },
    { re: /\bAC\b/g, title: "AC = Accepted. Your solution passed all tests. Depth is based on accepted solves (verified work)." },
    { re: /\bsigma\b/gi, title: "Sigma (σ) = a measure of spread. Here it is a robust sigma derived from MAD, used to express how far a category is from your baseline." },
    { re: /σ/g, title: "σ (sigma) = a measure of spread. Here it is a robust sigma derived from MAD." },
    { re: /Weighted\s+MCQ/gi, title: "Weighted MCQ = MCQ score averaged with difficulty weights (Advanced contributes more than Basic). It is not the same as raw accuracy." },
    { re: /\bMAD\b/g, title: "MAD = median absolute deviation. It measures typical distance from the median and is more robust than standard deviation when there are outliers." },
    { re: /median\s+absolute\s+deviation/gi, title: "Median absolute deviation (MAD) = typical distance from the median. It is robust (less sensitive to extreme values) and is used here to detect outliers safely." },

    { re: /\bPercentile\b/gi, title: "Percentiles show the spread of your results. p50 is the median; p75 means 75% of your solves were at or below that value." },
    { re: /\bp25\b/gi, title: "p25 = 25th percentile (a faster-than-typical solve)." },
    { re: /\bp50\b/gi, title: "p50 = median (typical value)." },
    { re: /\bp75\b/gi, title: "p75 = 75th percentile (a slower-than-typical solve; useful for spotting long outliers)." },
    { re: /First-attempt failure rate/gi, title: "First-attempt failure rate = among solved sessions, how often the first submission was NOT accepted. Lower is better." },
    { re: /Difficulty cliff/gi, title: "Difficulty cliff = performance drops noticeably when moving from Basic to Advanced problems." },
    { re: /Transfer gap/gi, title: "Transfer gap = performance is stronger in drills (micro) than in interview-style problems. The fix is practicing transfer." },
    
    { re: /\bDepth\b/gi, title: "Depth = how much verified coding work you’ve done in a category. It grows when you complete (AC) problems, especially at higher difficulty and with strong convergence." },
    { re: /\bTouched\b/gi, title: "Touched categories = categories where you have some depth (you’ve completed at least one accepted solve)." },
    { re: /\bUntouched\b/gi, title: "Untouched categories = categories in the current coding catalog where you have not yet built depth (no accepted solves yet)." },
    { re: /\bVolatility\b/gi, title: "Volatility = how much a metric may swing with a small amount of new activity. Low sample sizes are more volatile." },
    { re: /\bFocus\b/gi, title: "Focus band = your highest-depth categories (top part of your own depth distribution)." },
    { re: /\bEmerging\b/gi, title: "Emerging band = categories with some depth, but still early compared to your strongest areas." },
    { re: /\bBuilding\b/gi, title: "Building band = categories where depth is developing (middle of your depth distribution)." },
    { re: /\bConcentrated\b/gi, title: "Concentrated = most of your depth sits in a small number of categories. Good for specialization, but it can leave gaps." },
    { re: /\bOpportunity\b/gi, title: "Opportunity categories = categories you’ve started, but where depth is still low. They’re often the easiest wins to improve next." },
{ re: /Likely explanation/gi, title: "Likely explanation = a best-guess interpretation based on your current data. It is not a certainty." }
  ];

  function __ciWrapGlossaryTerms(root){
    if (!root) return;

    // Snapshot text nodes first; we will replace nodes in-place.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    const wrapNode = (textNode, regex, title) => {
      if (!textNode || !textNode.parentNode) return;
      if (textNode.parentNode && textNode.parentNode.nodeName === "ABBR") return;

      const text = textNode.nodeValue;
      regex.lastIndex = 0;
      const match = regex.exec(text);
      if (!match) return;

      const frag = document.createDocumentFragment();
      let last = 0;
      regex.lastIndex = 0;

      let m;
      while ((m = regex.exec(text))){
        const start = m.index;
        const end = start + m[0].length;

        if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));

        const ab = document.createElement("abbr");
        ab.className = "ciGlossTerm";
        ab.title = title;
        ab.textContent = text.slice(start, end);
        frag.appendChild(ab);

        last = end;
      }

      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));

      textNode.parentNode.replaceChild(frag, textNode);
    };

    // Apply glossary replacements term-by-term for deterministic behavior.
    __CI_GLOSSARY.forEach(term => {
      nodes.forEach(tn => wrapNode(tn, term.re, term.title));
    });
  }



function buildDepthFallbackInsightFromOverride(depthItems){
  const items = Array.isArray(depthItems) ? depthItems.filter(x => (x && Number(x.depth) > 0)) : [];
  const all = Array.isArray(depthItems) ? depthItems : [];
  const touched = items.slice().sort((a,b)=>(Number(b.depth)||0)-(Number(a.depth)||0));
  const available = all.length;
  const touchedCount = touched.length;
  const untouchedCount = Math.max(0, available - touchedCount);
  const depths = touched.map(x => Number(x.depth)||0).sort((a,b)=>a-b);

  function percentile(sorted, p){
    if (!sorted.length) return 0;
    const clamped = Math.min(1, Math.max(0, p));
    const idx = (sorted.length - 1) * clamped;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    const w = idx - lo;
    return sorted[lo] * (1-w) + sorted[hi] * w;
  }
  const pFocus = percentile(depths, 0.80);
  const pBuild = percentile(depths, 0.50);
  const pEmerg = percentile(depths, 0.20);

  function bandFor(v){
    if (v <= 0) return "Untouched";
    if (pFocus>0 && v >= pFocus) return "Focus";
    if (pBuild>0 && v >= pBuild) return "Building";
    if (pEmerg>0 && v >= pEmerg) return "Emerging";
    return "Emerging";
  }

  const focusCount = touched.filter(x => bandFor(Number(x.depth)||0) === "Focus").length;
  const buildCount = touched.filter(x => bandFor(Number(x.depth)||0) === "Building").length;
  const emergCount = touched.filter(x => bandFor(Number(x.depth)||0) === "Emerging").length;

  const total = touched.reduce((a,b)=>a+(Number(b.depth)||0),0);
  const top1 = total>0 ? (Number(touched[0]?.depth)||0)/total : 0;
  const top3 = total>0 ? touched.slice(0,3).reduce((a,b)=>a+(Number(b.depth)||0),0)/total : 0;

  const topCats = touched.slice(0,5).map(x => `${String(x.category)} — depth ${Math.round((Number(x.depth)||0)*10)/10} (${bandFor(Number(x.depth)||0)})`);
  const oppCats = touched.slice().sort((a,b)=>(Number(a.depth)||0)-(Number(b.depth)||0)).slice(0,5)
    .map(x => `${String(x.category)} — depth ${Math.round((Number(x.depth)||0)*10)/10} (${bandFor(Number(x.depth)||0)})`);

  // Robust outliers (Option A style): median + MAD
  const baselineMedian = percentile(depths, 0.50);
  const absDevs = touched.map(x => Math.abs((Number(x.depth)||0) - baselineMedian)).sort((a,b)=>a-b);
  const mad = percentile(absDevs, 0.50);
  const robustSigma = 1.4826 * mad;
  const outZ = 1.5;
  const outMinAbsGap = 5.0;
  const outMax = 3;

  let highOut = [], lowOut = [];
  let outSuppressed = null;
  if (touchedCount < 5){
    outSuppressed = "Not enough touched categories yet for robust outliers (need at least 5).";
  } else if (!isFinite(robustSigma) || robustSigma <= 1e-6){
    outSuppressed = "Depth values are very similar right now, so outliers are suppressed to avoid over-interpreting tiny differences.";
  } else {
    for (const x of touched){
      const v = Number(x.depth)||0;
      const gap = v - baselineMedian;
      const absGap = Math.abs(gap);
      if (absGap < outMinAbsGap) continue;
      const z = gap / robustSigma;
      if (z >= outZ) highOut.push({cat: String(x.category), depth: v, z});
      else if (z <= -outZ) lowOut.push({cat: String(x.category), depth: v, z});
    }
    highOut.sort((a,b)=>b.z-a.z);
    lowOut.sort((a,b)=>a.z-b.z);
    highOut = highOut.slice(0,outMax);
    lowOut = lowOut.slice(0,outMax);
  }

  const likely = (top1 >= 0.55 || top3 >= 0.80)
    ? "Your depth is concentrated in a small number of categories. That can be great for mastery—just keep a light sweep elsewhere to avoid gaps."
    : "Your depth is spread across multiple categories. That builds coverage, but you may benefit from a short focus cycle to push 1–2 categories deeper.";

  const actions = [
    "Pick 1–2 Focus categories for a 7–14 day cycle and aim to increase depth there.",
    "Keep a light sweep: 1 short session in 1–2 non-focus categories per week.",
    "Use micro → interview transfer in the same category to lock in depth with application."
  ];

  return {
    title: "Depth by category",
    summary: `${touchedCount} touched • ${untouchedCount} untouched • Focus ${focusCount}`,
    sections: [
      { heading: "Snapshot", type: "snapshot", blocks: [
        { kind: "bullets", items: [
          `Touched categories: ${touchedCount} / ${available} (Untouched: ${untouchedCount})`,
          `Focus: ${focusCount} • Building: ${buildCount} • Emerging: ${emergCount}`,
          `Concentration: top1 ${(top1*100).toFixed(0)}% • top3 ${(top3*100).toFixed(0)}%`
        ]}
      ]},
      { heading: "Depth outliers (robust)", type: "diagnosis", blocks: [
        { kind: "p", text: "Outliers compare categories to your typical depth baseline (median), using a robust spread estimate (MAD). This is a client-side fallback and does not have per-category evidence counts." },
        ...(outSuppressed ? [{ kind: "callout", text: outSuppressed }] : []),
        ...(!outSuppressed && highOut.length ? [{ kind: "bullets", items: ["High outliers (strengths):", ...highOut.map(x => `${x.cat} — depth ${Math.round(x.depth*10)/10} (+${x.z.toFixed(1)}σ vs baseline)`) ] }] : []),
        ...(!outSuppressed && lowOut.length ? [{ kind: "bullets", items: ["Low outliers (priority gaps):", ...lowOut.map(x => `${x.cat} — depth ${Math.round(x.depth*10)/10} (${x.z.toFixed(1)}σ vs baseline)`) ] }] : []),
        ...(!outSuppressed && !highOut.length && !lowOut.length ? [{ kind: "p", text: `No clear outliers beyond the thresholds (≥${outZ}σ and ≥${outMinAbsGap} depth gap).` }] : []),
        ...(!outSuppressed && (highOut.length || lowOut.length) ? [{ kind: "p", text: `Baseline median: ${Math.round(baselineMedian*10)/10} • Robust σ: ${Math.round(robustSigma*10)/10}.` }] : [])
      ]},
      { heading: "Top categories", type: "section", blocks: [
        { kind: "bullets", items: topCats.length ? topCats : ["No non-zero depth values found."] }
      ]},
      { heading: "Opportunities", type: "section", blocks: [
        { kind: "bullets", items: oppCats.length ? oppCats : ["No opportunities yet — add more depth in at least one category."] }
      ]},
      { heading: "Likely explanation", type: "diagnosis", blocks: [
        { kind: "p", text: `${likely}` }
      ]},
      { heading: "Recommended next steps", type: "actions", blocks: [
        { kind: "bullets", items: actions }
      ]},
      { heading: "Guards", type: "guards", blocks: [
        { kind: "bullets", items: [
          "Catalog basis: uses the categories shown in your depth chart.",
          "Freshness: This interpretation uses data across your full history."
        ] }
      ]}
    ],
    meta: { fallback: true }
  };
}

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

// dashboard.06b.refresh.js
// STATUS: LIVE — source file (do not deploy directly; deploy dashboard.bundle.js)
// OWNER: CodiviumInsights public API — init, update, refresh, destroy, setUiPrefs,
//        getUiPrefs, toggleInfoPane, setSelectedTrack, getSelectedTrack,
//        setAnalysisOverrides, setInfoContentOverrides
// NOT owned here: layout engine (core.js), chart rendering (06.mcq-and-render.js)
// GENERATED: No — this is an authored source file

// ============================================================
// dashboard.06b.refresh.js
// OWNER: Refresh / resilience / visibility system
// Depends on: dashboard.00.core.js (__cvState, __cvConfig, safeInvoke, ciErr)
//             dashboard.06.mcq-and-render.js (renderAll, __cvRefreshChartsInPlace)
// ============================================================
// __cvState.__hardRefreshTimer, __cvState.__hardRefreshToken now live in __cvState (dashboard.00.core.js)

function __cvIsElementVisible(el){
  if (!el) return false;
  let rect;
  try { rect = el.getBoundingClientRect(); } catch (e) { return false; }
  if (!rect || rect.width < 8 || rect.height < 8) return false;
  let cs;
  try { cs = window.getComputedStyle(el); } catch (e) { cs = null; }
  if (cs){
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const op = Number(cs.opacity || '1');
    if (!isNaN(op) && op < 0.02) return false;
  }
  return true;
}


// Checks that all visible chart canvases have real pixel dimensions right now.
// Used by __cvHardRefreshWhenVisible and __cvRenderWhenSized to decide whether
// a layout transition has fully completed and all charts could be created.
function allCanvasesRendered() {
  var mount = (typeof getMount === 'function') ? getMount() : null;
  if (!mount) return false;
  var ids = (typeof __CV_CHART_CANVAS_IDS !== 'undefined') ? __CV_CHART_CANVAS_IDS :
    ['depthChart','timePlatformChart','exerciseAllocChart','mcqEasyChart','mcqMediumChart','mcqHardChart'];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var el = mount.querySelector('#' + id) ||
             (typeof cv$ === 'function' ? cv$(id) : document.getElementById(id));
    if (!el) continue;
    // Skip canvases inside hidden panels (display:none — they are intentionally not rendered).
    var panel = el.closest && el.closest('.panel');
    if (panel && panel.classList && panel.classList.contains('isHidden')) continue;
    try {
      var r = el.getBoundingClientRect();
      if (!r || r.width < 8 || r.height < 8) return false;
    } catch (_) { return false; }
  }
  return true;
}

function __cvHardRefreshWhenVisible(token){
  const mount = getMount();
  let tries = 0;
  const maxTries = 14; // ~3.5s total; covers SPA tab transitions/animations

  const tick = () => {
    if (token !== __cvState.__hardRefreshToken) return;
    tries++;

    if (__cvIsElementVisible(mount)){
      try { renderAll(); } catch (e) { ciErr('ignored error', e); }
      try { __cvStampRefresh('hard'); } catch (e) { ciErr('ignored error', e); }

      // After renderAll(), check if any chart canvases are still 0px.
      // This happens when a layout switch reveals a previously-hidden panel
      // (e.g. switching TO a layout with MCQ from one without it):
      // display:none was just lifted, but the browser needs at least one more
      // frame before the canvas has real dimensions.
      // If any are still 0px, delegate to __cvRenderWhenSized which uses a
      // ResizeObserver to re-run renderAll() once dimensions are real.
      // If any visible chart canvas is still 0px after renderAll(), a panel was
      // just revealed from display:none (e.g. MCQ panel shown by layout switch).
      // Delegate to __cvRenderWhenSized which watches canvas containers via
      // ResizeObserver and re-runs renderAll() once they have real dimensions.
      try {
        if (typeof __cvRenderWhenSized === 'function' && !allCanvasesRendered()) {
          __cvRenderWhenSized('hard_refresh_followup');
          return;
        }
      } catch (_) {}

      // All canvases already rendered — do the settle-check passes as before.
      let lastRect = null;
      try { lastRect = mount.getBoundingClientRect(); } catch (e) { lastRect = null; }
      const maybeRefresh = () => {
        if (token !== __cvState.__hardRefreshToken) return;
        let r = null;
        try { r = mount.getBoundingClientRect(); } catch (e) { r = null; }
        if (!r || !lastRect) {
          try { __cvRefreshChartsInPlace(); } catch (e) { ciErr('ignored error', e); }
          return;
        }
        const dw = Math.abs((r.width||0) - (lastRect.width||0));
        const dh = Math.abs((r.height||0) - (lastRect.height||0));
        if (dw > 1 || dh > 1) {
          lastRect = r;
          try { __cvRefreshChartsInPlace(); } catch (e) { ciErr('ignored error', e); }
        }
      };
      setTimeout(maybeRefresh, 350);
      setTimeout(maybeRefresh, 1250);
      return;
    }

    if (tries < maxTries) setTimeout(tick, 250);
  };

  tick();
}


// ── Boot render: wait for all panel containers to have real dimensions ──────────────────────
//
// Root cause of blank/partial charts:
//  - renderAll() checks __cvCanRenderCanvas(canvas) — if the canvas container (canvasWrap)
//    is 0px (CSS grid fr-unit not yet resolved), that chart is skipped and never created.
//    __cvRefreshChartsInPlace only resizes EXISTING chart objects, so skipped charts stay blank.
//  - The heatmap uses a virtualised renderer that reads host.clientHeight at render time.
//    If that height is 0 or partial, only a few rows are painted.
//  - Multiple observers firing renderAll() independently causes concurrent renders / flicker.
//
// Fix: one unified coordinator.
//  1. Observe ALL canvasWraps + the heatmapWrap host with a single ResizeObserver.
//  2. Coalesce all resize events through a single rAF-debounced renderAll() call.
//  3. Keep re-rendering as long as new size changes arrive (grid settling in stages).
//  4. Once stable (no new events for one render cycle), disconnect and hand off
//     to the resilience system.
//  5. For the heatmap specifically: after the first successful renderAll(), install a
//     dedicated height-change observer that calls __renderSlice only (not full renderAll).

// Canvases that Chart.js renders into — observing their .canvasWrap parents.
var __CV_CHART_CANVAS_IDS = [
  'depthChart',
  'timePlatformChart',
  'exerciseAllocChart',
  'mcqEasyChart',
  'mcqMediumChart',
  'mcqHardChart'
];

function __cvRenderWhenSized(reason) {
  // One rAF to commit __cvApplyUiModeAndLayout's inline grid-template-* writes.
  requestAnimationFrame(function () {

    var mount = getMount();
    if (!mount) return;

    // Collect the containers we need to watch:
    //   - .canvasWrap parents of each chart canvas
    //   - .heatmapWrap (virtualised heatmap — depends on clientHeight)
    var targets = [];

    __CV_CHART_CANVAS_IDS.forEach(function (id) {
      var el = mount.querySelector('#' + id) ||
               (typeof cv$ === 'function' ? cv$(id) : document.getElementById(id));
      if (!el) return;
      var wrap = (el.closest && el.closest('.canvasWrap')) || el.parentElement || el;
      if (targets.indexOf(wrap) === -1) targets.push(wrap);
    });

    var heatHost = mount.querySelector('#convergenceHeatmap');
    if (heatHost && targets.indexOf(heatHost) === -1) targets.push(heatHost);

    if (!targets.length || typeof ResizeObserver === 'undefined') {
      // No targets found or old browser — render immediately and exit.
      try { renderAll(); } catch (e) { ciErr('render_when_sized_immediate', e); }
      try { __cvStampRefresh('hard'); } catch (_) {}
      return;
    }

    // Coalescing state: all resize callbacks schedule through a single pending rAF.
    var pendingRaf   = 0;
    var disconnected = false;
    var ro;

    // Track which targets have reported real dimensions at least once.
    // Only disconnect once ALL targets have been seen with real dimensions
    // AND at least one renderAll() has fired after the last one became real.
    var seenReal = new Set();



    function scheduleRender() {
      if (disconnected) return;
      if (pendingRaf) return;             // Already scheduled — coalesce.
      pendingRaf = requestAnimationFrame(function () {
        pendingRaf = 0;
        if (disconnected) return;
        try { renderAll(); } catch (e) { ciErr('render_when_sized_pass', e); }
        try { __cvStampRefresh('hard'); } catch (_) {}

        // Disconnect only when ALL chart canvases have real dimensions RIGHT NOW,
        // post-renderAll(). This is the only reliable signal that the grid has
        // fully resolved and every chart had a real container when it was created.
        if (allCanvasesRendered()) {
          disconnect();
        }
        // Otherwise, stay connected — the ResizeObserver will fire again when the
        // remaining canvases (e.g. MCQ in bottom grid row) get real dimensions.
      });
    }

    function disconnect() {
      if (disconnected) return;
      disconnected = true;
      if (pendingRaf) { cancelAnimationFrame(pendingRaf); pendingRaf = 0; }
      try { if (ro) ro.disconnect(); } catch (_) {}
      __cvWatchHeatmapHeight(mount);
    }

    try {
      ro = new ResizeObserver(function (entries) {
        if (disconnected) return;
        var anyReal = false;
        for (var i = 0; i < entries.length; i++) {
          var r = entries[i].contentRect;
          if (r && r.width > 8 && r.height > 8) { anyReal = true; break; }
        }
        if (!anyReal) return;
        scheduleRender();
      });

      targets.forEach(function (el) { ro.observe(el); });
    } catch (e) {
      ciErr('render_when_sized_ro_bind', e);
      try { renderAll(); } catch (e2) { ciErr('render_when_sized_fallback', e2); }
      return;
    }

    // Initial render pass — handles the case where all panels are already sized.
    scheduleRender();

    // Safety net: if not all targets become real within 8s, render whatever we have.
    setTimeout(function () {
      if (disconnected) return;
      disconnect();
      try { renderAll(); } catch (e) { ciErr('render_when_sized_timeout', e); }
    }, 8000);
  });
}

// Install a ResizeObserver specifically on the heatmap host that re-fires
// the virtualised slice calculation when the container height changes.
// This is lightweight — it does NOT call renderAll(), only recalculates visible rows.
function __cvWatchHeatmapHeight(mount) {
  if (typeof ResizeObserver === 'undefined') return;
  var host = mount && mount.querySelector('#convergenceHeatmap');
  if (!host) return;
  // Only install once.
  if (host.__cvHeightWatcher) return;
  host.__cvHeightWatcher = true;

  var lastH = host.clientHeight || 0;
  try {
    var hro = new ResizeObserver(function () {
      var h = host.clientHeight || 0;
      if (Math.abs(h - lastH) < 2) return;  // Ignore sub-pixel noise.
      lastH = h;
      // Re-fire the virtualised slice calculation with the new height.
      if (host.__cvVirt && typeof host.__cvVirt.renderNow === 'function') {
        requestAnimationFrame(function () {
          try { host.__cvVirt.renderNow(); } catch (e) { ciErr('heatmap_height_ro', e); }
        });
      }
    });
    hro.observe(host);
  } catch (e) { ciErr('heatmap_height_ro_bind', e); }
}

function __cvScheduleHardRefresh(reason){
  __cvState.__hardRefreshToken++;
  const token = __cvState.__hardRefreshToken;
  if (__cvState.__hardRefreshTimer) clearTimeout(__cvState.__hardRefreshTimer);

  const r = String(reason || "");
  const isManual = r.indexOf("manual") !== -1;

  const now = Date.now();
  const since = now - (__cvState.__lastRefreshAt || 0);
  const remaining = (__cvState.__lastRefreshAt && !isManual) ? Math.max(0, __cvMinRefreshIntervalMs - since) : 0;
  const delay = Math.max(80, remaining);

  __cvState.__hardRefreshTimer = setTimeout(() => {
    __cvState.__hardRefreshTimer = null;
    __cvHardRefreshWhenVisible(token);
  }, delay);
}


function setupRefreshDashboardButton(){
  const btns = qAll('.refreshDashboardBtn');
  if (!btns || !btns.length) return;
  btns.forEach((b) => {
    if (b.__cvBound) return;
    b.__cvBound = true;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        __cvRequestRefresh('hard', 'manual_button', { immediate: true });
      } catch (err) { ciErr('ignored error', err); }
    });
  });
}

function setupScoresTabs(){
  const btnSummary = document.getElementById('scoresTabBtnSummary');
  const btnBreakdown = document.getElementById('scoresTabBtnBreakdown');
  const panelSummary = document.getElementById('scoresTabSummary');
  const panelBreakdown = document.getElementById('scoresTabBreakdown');
  if (!btnSummary || !btnBreakdown || !panelSummary || !panelBreakdown) return;

  // Guard: bind once
  if (btnSummary.__cvBound || btnBreakdown.__cvBound) return;
  btnSummary.__cvBound = true;
  btnBreakdown.__cvBound = true;

  const KEY = '__cvScoresTab';

  function setActive(which){
    const isSummary = String(which || 'summary') === 'summary';

    btnSummary.classList.toggle('isActive', isSummary);
    btnBreakdown.classList.toggle('isActive', !isSummary);

    btnSummary.setAttribute('aria-selected', isSummary ? 'true' : 'false');
    btnBreakdown.setAttribute('aria-selected', !isSummary ? 'true' : 'false');

    panelSummary.hidden = !isSummary;
    panelBreakdown.hidden = isSummary;

    try { sessionStorage.setItem(KEY, isSummary ? 'summary' : 'breakdown'); } catch (e) { ciErr('ignored error', e); }
  }

  // Default: summary; restore last in-session state if available
  let initial = 'summary';
  try {
    const s = sessionStorage.getItem(KEY);
    if (s === 'breakdown' || s === 'summary') initial = s;
  } catch (e) { ciErr('ignored error', e); }
  setActive(initial);

  btnSummary.addEventListener('click', (e) => {
    e.preventDefault();
    setActive('summary');
  });
  btnBreakdown.addEventListener('click', (e) => {
    e.preventDefault();
    setActive('breakdown');
  });
}
// __cvState.__softRefreshTimer, __cvState.__lastRefreshAt now live in __cvState (dashboard.00.core.js)

function __cvStampRefresh(kind){
  try { __cvState.__lastRefreshAt = Date.now(); } catch (_) { __cvState.__lastRefreshAt = Date.now(); }
  // Future: record kind/reason for debug HUD
}

function __cvRequestRefresh(kind, reason, opts){
  kind = String(kind || 'soft');
  const r = String(reason || '');
  const o = (opts && typeof opts === 'object') ? opts : {};
  const immediate = !!o.immediate;

  if (kind === 'hard') {
    if (immediate) {
      try { renderAll(); __cvStampRefresh('hard'); } catch (e) { ciErr('ignored error', e); }
    }
    try { __cvScheduleHardRefresh(r || 'requested_hard'); } catch (e) { ciErr('ignored error', e); }
    return;
  }

  // default soft
  if (immediate) {
    try { __cvRefreshChartsInPlace(); } catch (e) { ciErr('ignored error', e); }
  } else {
    try { __cvScheduleSoftRefresh(r || 'requested_soft'); } catch (e) { ciErr('ignored error', e); }
  }
}

const __cvMinRefreshIntervalMs = ((__cvConfig.refresh || {}).minIntervalMs) || 30000; // 30s (reduces heatmap jumpiness / keeps reading stable)
// During initial page load, container sizes can shift as fonts/styles settle.
// A soft refresh triggered too early can cause brief Chart.js flicker.
// We ignore non-manual soft refresh triggers during this short settle window.
// During initial page load, container sizes can shift as fonts/styles settle.
// A refresh triggered too early can cause brief Chart.js flicker.
// We ignore resilience-triggered refreshes during this settle window.
const __cvBootSettleUntil = Date.now() + 2200;

// Some browsers fire focus/resize/observer callbacks immediately on load.
// Arming resilience too early causes an extra "mini refresh" before the first
// stable paint. Delay arming slightly to avoid any visible flicker.
// __cvState.__resilienceIgnoreUntil now lives in __cvState.__resilienceIgnoreUntil (dashboard.00.core.js)
// Initialise it here since __cvConfig is available at this point.
__cvState.__resilienceIgnoreUntil = Date.now() + (((__cvConfig.resilience || {}).initialIgnoreMs) || 2600);
try {
  if (typeof window !== 'undefined'){
    window.__cvSetResilienceIgnoreUntil = window.__cvSetResilienceIgnoreUntil || function(ms){
      try { __cvState.__resilienceIgnoreUntil = Date.now() + Math.max(0, (ms | 0)); } catch (_e) {}
    };
  }
} catch (_e) {}
// __cvState.__wasEverHidden now lives in __cvState.__wasEverHidden (dashboard.00.core.js)


  function __cvRefreshChartsInPlace(){
    // Chart.js instances: resize + redraw without rebuilding data.
    try {
      Object.keys(charts || {}).forEach((k) => {
        const c = charts[k];
        if (!c) return;
        if (typeof c.resize === "function") c.resize();
        if (typeof c.update === "function") c.update("none");
      });
    } catch (e) { ciErr('ignored error', e); }

    // Non-Chart.js visuals that depend on container size
    try { renderConvergenceHeatmap(); } catch (e) { ciErr('ignored error', e); }
    // Exercise allocation is a Chart.js instance (charts.exerciseDonut) and is already
    // handled by the Chart.js resize/update loop above. Rebuilding it here causes visible
    // multi-pass redraws on page refresh.
  
    __cvStampRefresh('soft');
  }

  function __cvScheduleSoftRefresh(reason){
    if (__cvState.__softRefreshTimer) return;

    const r = String(reason || "");
    const isManual = r.indexOf("manual") !== -1;

    // Avoid doing a Chart.js resize/update pass during the initial layout settle phase.
    // This is the main cause of "one quick flicker" on page refresh.
    if (!isManual && Date.now() < __cvBootSettleUntil) return;

    const now = Date.now();
    const since = now - (__cvState.__lastRefreshAt || 0);
    const remaining = (__cvState.__lastRefreshAt && !isManual) ? Math.max(0, __cvMinRefreshIntervalMs - since) : 0;
    const delay = Math.max(120, remaining);

    __cvState.__softRefreshTimer = setTimeout(() => {
      __cvState.__softRefreshTimer = null;
      __cvRefreshChartsInPlace();
    }, delay);
  }

  function __cvSetupResilience(){
    const mount = getMount();
    if (!mount) return;

    const st = __cvMountState(mount);
    if (st.resilienceBound) return;
    st.resilienceBound = true;

    const onVis = () => {
      if (document.visibilityState === "hidden") { __cvState.__wasEverHidden = true; return; }
      if (document.visibilityState === "visible" && __cvState.__wasEverHidden) __cvRequestRefresh('hard', 'visibility');
    };

    const onFocus = () => {
      if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
      __cvRequestRefresh('hard', 'focus');
    };

    const onPageShow = (e) => {
      if (e && e.persisted) __cvRequestRefresh('hard', 'pageshow_persisted');
    };

    const onResize = () => {
      if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
      __cvRequestRefresh('soft', 'resize');
    };

    const onTransitionEnd = (e) => {
      if (Date.now() < __cvState.__resilienceIgnoreUntil) return;

      try {
        if (!e || !e.target) return;
        const t = e.target;
        if (!mount.contains(t)) return;

        const prop = String(e.propertyName || "").toLowerCase();
        // Only react to layout-affecting properties (avoid hover-only transitions).
        const okProp = (
          prop === "width" ||
          prop === "height" ||
          prop === "max-width" ||
          prop === "max-height" ||
          prop === "flex-basis" ||
          prop === "transform"
        );
        if (!okProp) return;

        // Ignore common hover/interaction elements to avoid thrash.
        if (t.closest && t.closest(".side-link, .cvLayoutBtn, .cvFocusBtn, .infoBtn, button, a")) return;

        // Only refresh when a layout container finishes transitioning.
        if (t.closest) {
          const okHost = t.closest(".sidebar, .insights-layout, .canvasWrap, .treemapWrap, #infoPane, #insightsForm");
          if (!okHost) return;
        }

        __cvRequestRefresh('soft', 'transitionend');
      } catch (err) { ciErr('transitionend', err); }
    };

    st.resilienceHandlers = { onVis, onFocus, onPageShow, onResize, onTransitionEnd };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("resize", onResize);
    document.addEventListener("transitionend", onTransitionEnd, true);

    // Container resize (more precise than window resize)
    if (typeof ResizeObserver !== "undefined") {
      try {
        const ro = new ResizeObserver(() => {
          if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
          __cvRequestRefresh('soft', 'resize_observer');
        });
        st.resilienceRO = ro;
        Array.prototype.slice.call(mount.querySelectorAll(".canvasWrap, .treemapWrap")).forEach((el) => ro.observe(el));
      } catch (e) { ciErr('resize_observer_bind', e); }
    }

    // If the user scrolls away and back, some canvases can become stale in certain browsers.
    if (typeof IntersectionObserver !== "undefined") {
      try {
        const io = new IntersectionObserver((entries) => {
          if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
          for (const ent of entries) {
            if (ent && ent.isIntersecting) { __cvRequestRefresh('hard', 'intersection'); break; }
          }
        }, { threshold: 0.12 });
        st.resilienceIO = io;
        Array.prototype.slice.call(mount.querySelectorAll(".canvasWrap, .heatmapWrap, .treemapWrap")).forEach((el) => io.observe(el));
      } catch (e) { ciErr('intersection_observer_bind', e); }
    }
  }

    // -----------------------------
  // Public API (production integration)
  // -----------------------------
  window.CodiviumInsights = window.CodiviumInsights || {};

  /**
   * Initialize the dashboard.
   * @param {{ mountId?: string, data?: DashboardData }} opts
   */
  window.CodiviumInsights.init = function(opts){
    opts = opts || {};
    if (opts.mountId) IDS.mount = String(opts.mountId);
    if (opts.data) applyDashboardData(opts.data);
    // If a page provides __CODIVIUM_DASHBOARD_DATA__ globally, consume it once.
    if (!opts.data && window.__CODIVIUM_DASHBOARD_DATA__) {
      try { applyDashboardData(window.__CODIVIUM_DASHBOARD_DATA__); } catch (e) { ciErr('ignored error', e); }
    }
    init();
  };

  /**
   * Update dashboard data (partial updates allowed).
   * @param {DashboardData} payload
   */
  window.CodiviumInsights.update = function(payload){
    __cvState.__hasLivePayload = true;
    applyDashboardData(payload);
    // applyDashboardData → __cvApplyUiModeAndLayout writes grid-template-* inline styles
    // synchronously. Use __cvRenderWhenSized to render once the container has real
    // pixel dimensions (replaces blind single-RAF assumption).
    __cvRenderWhenSized('update');
  };

  /**
   * Force a full re-render (useful after returning to a hidden tab).
   */
  window.CodiviumInsights.refresh = function(){
    try { __cvRequestRefresh('hard', 'api_refresh', { immediate: true }); } catch (e) { ciErr('ignored error', e); }
  };


  /**
   * Tear down listeners/observers (SPA safety). Call before removing the dashboard from the DOM.
   */
  window.CodiviumInsights.destroy = function(){
    const mount = getMount();
    if (!mount) return;
    const st = __cvMountState(mount);

    // UI layout (core)
    try {
      if (st.uiLayoutOnResize) window.removeEventListener('resize', st.uiLayoutOnResize);
      st.uiLayoutOnResize = null;
      st.uiLayoutBound = false;
    } catch (e) { ciErr('destroy_ui_layout', e); }

    // Button tooltips
    try {
      const h = st.btnTipsHandlers;
      if (h){
        mount.removeEventListener('pointerover', h.onOver, true);
        mount.removeEventListener('pointerout', h.onOut, true);
        mount.removeEventListener('pointermove', h.onMove);
        mount.removeEventListener('mouseleave', h.onLeave);
      }
      st.btnTipsHandlers = null;
      st.btnTipsBound = false;
    } catch (e) { ciErr('destroy_btn_tips', e); }

    // Time controls
    try {
      if (st.timeControlsOnClick) mount.removeEventListener('click', st.timeControlsOnClick);
      st.timeControlsOnClick = null;
      st.timeControlsBound = false;
    } catch (e) { ciErr('destroy_time_controls', e); }

    // Allocation controls
    try {
      if (st.allocControlsOnClick) mount.removeEventListener('click', st.allocControlsOnClick);
      st.allocControlsOnClick = null;
      st.allocControlsBound = false;
    } catch (e) { ciErr('destroy_alloc_controls', e); }

    // Resilience observers/listeners
    try {
      const rh = st.resilienceHandlers;
      if (rh){
        document.removeEventListener('visibilitychange', rh.onVis);
        window.removeEventListener('focus', rh.onFocus);
        window.removeEventListener('pageshow', rh.onPageShow);
        window.removeEventListener('resize', rh.onResize);
        document.removeEventListener('transitionend', rh.onTransitionEnd, true);
      }
      st.resilienceHandlers = null;
      st.resilienceBound = false;
      if (st.resilienceRO && typeof st.resilienceRO.disconnect === 'function') st.resilienceRO.disconnect();
      if (st.resilienceIO && typeof st.resilienceIO.disconnect === 'function') st.resilienceIO.disconnect();
      st.resilienceRO = null;
      st.resilienceIO = null;
    } catch (e) { ciErr('destroy_resilience', e); }

    // Timers
    try { if (__cvState.__softRefreshTimer) { clearTimeout(__cvState.__softRefreshTimer); __cvState.__softRefreshTimer = null; } } catch (_) {}
    try { if (__cvState.__hardRefreshTimer) { clearTimeout(__cvState.__hardRefreshTimer); __cvState.__hardRefreshTimer = null; } } catch (_) {}
  };



  window.CodiviumInsights.setAnalysisOverrides = function(map){
    if (map && typeof map === "object") __cvState.__analysisOverrides = map;
  };

  window.CodiviumInsights.setInfoContentOverrides = function(map){
    if (map && typeof map === "object") __cvState.__infoContentOverrides = map;
  };  function __cvNormalizeRedirectUrl(raw){
    try {
      if (!raw) return null;
      const u = String(raw).trim();
      if (!u) return null;
      if (u.startsWith('#')) return u;

      // Block obviously dangerous schemes
      if (/^(javascript|data|vbscript):/i.test(u)) return null;

      const loc = window.location;
      const isFile = !!(loc && loc.protocol === 'file:');

      // Allow file:// redirects only when running from file://
      if (/^file:\/\//i.test(u)) {
        return isFile ? u : null;
      }

      // Absolute http(s): allow only same-origin (and never from file:// demo)
      if (/^https?:\/\//i.test(u)) {
        if (isFile) return null;
        const parsed = new URL(u);
        return (parsed.origin === loc.origin) ? parsed.href : null;
      }

      // Relative URLs: resolve against current document.
      const base = (loc && loc.href) ? loc.href : (loc && loc.origin ? loc.origin : '');
      const parsedRel = new URL(u, base);
      if (isFile) return parsedRel.href;
      return (parsedRel.origin === loc.origin) ? parsedRel.href : null;
    } catch (e) {
      return null;
    }
  }

  // Normalize a POST endpoint to a safe, same-origin URL.
  // Accepts relative URLs and same-origin absolute URLs. Blocks dangerous schemes.
  function __cvNormalizeSameOriginEndpoint(raw){
    try {
      if (!raw) return null;
      const u = String(raw).trim();
      if (!u) return null;

      if (/^(javascript|data|vbscript):/i.test(u)) return null;
      // Protocol-relative URLs are ambiguous and can escape origin.
      if (/^\/\//.test(u)) return null;

      const loc = window.location;
      const isFile = !!(loc && loc.protocol === 'file:');

      // Absolute http(s): allow only same-origin (and never from file:// demo)
      if (/^https?:\/\//i.test(u)) {
        if (isFile) return null;
        const parsed = new URL(u);
        return (parsed.origin === loc.origin) ? parsed.href : null;
      }

      // file:// endpoints are not meaningful for fetch in production.
      if (/^file:\/\//i.test(u)) {
        return isFile ? u : null;
      }

      // Relative: resolve against current document.
      const base = (loc && loc.href) ? loc.href : (loc && loc.origin ? loc.origin : '');
      const parsedRel = new URL(u, base);
      if (isFile) return parsedRel.href;
      return (parsedRel.origin === loc.origin) ? parsedRel.href : null;
    } catch (_e) {
      return null;
    }
  }



// dashboard.07.tour.js — Guided tour system.

// -----------------------------
// Guided tour (metric-by-metric)
// -----------------------------
const TOUR_STEPS = [
  // ── UI controls ──────────────────────────────────────────────────────────
  { key: "tour_layout_presets", selector: "#cvLayoutPresetDock" },
  { key: "tour_info_toggle",    selector: "#cvInfoPaneToggleBtn" },
  { key: "tour_i_buttons",      selector: ".infoBtn.chipInfo" },
  { key: "tour_cta_buttons",    selector: ".panelCtaBtn" },
  { key: "tour_faq",            selector: "#openFaqLink" },
  { key: "tour_glossary",       selector: "#openGlossaryLink" },
  // ── Panels ───────────────────────────────────────────────────────────────
  { key: "panel_scores", selector: ".scoresPalette" },
  { key: "codiviumScore", selector: "#codiviumScore" },
  { key: "breadthScore", selector: "#breadthScore" },
  { key: "interviewBreadthScore", selector: "#interviewBreadthScore" },
  { key: "microBreadthScore", selector: "#microBreadthScore" },
  { key: "mcqBreadthScore", selector: "#mcqBreadthScore" },
    { key: "firstTryPassRate", selector: "#firstTryPassRate" },
  { key: "avgAttemptsToAC", selector: "#avgAttemptsToAC" },
  { key: "medianTimeToAC", selector: "#medianTimeToAC" },

  { key: "panel_depth", selector: ".depthPanel" },
  { key: "panel_heatmap", selector: ".heatmapPanel" },

  { key: "panel_time", selector: ".timePanel" },
  { key: "panel_exercise", selector: ".donutPanel" },

  { key: "panel_mcq", selector: ".mcqPanel" },
  { key: "mcqEasy", selector: "#mcqEasyChart" },
  { key: "mcqMedium", selector: "#mcqMediumChart" },
  { key: "mcqHard", selector: "#mcqHardChart" },
];


function __tourCtaForKey(key){
  const k = String(key || "");
  if (k === "tour_layout_presets" || k === "tour_info_toggle" || k === "tour_i_buttons" ||
      k === "tour_cta_buttons" || k === "tour_faq" || k === "tour_glossary") return "";
  if (k === "panel_scores") return "CTA: Use the panel button to start a targeted session that improves your overall score by prioritising the weakest areas in your signals.";
  if (k === "panel_depth") return "CTA: Use the panel button to start a session focused on the lowest-depth categories (the bars highlight where depth is weakest).";
  if (k === "panel_heatmap") return "CTA: Use the panel button to practise categories with low early-attempt convergence (tiles with lower values in A1–A3).";
  if (k === "panel_time") return "CTA: Use the panel button to start a short session that helps you keep consistency (especially if your recent days are sparse).";
  if (k === "panel_exercise") return "CTA: Use the panel button to practise the currently selected category. Tip: click a bar to select a category and see its details.";
  if (k === "panel_mcq") return "CTA: Use the panel button to launch a quiz targeting your weakest MCQ areas by difficulty and category.";
  if (k === "mcqEasy" || k === "mcqMedium" || k === "mcqHard") return "CTA: Use the MCQ panel button to start a quiz; the chart highlights where you should focus next.";
  return "";
}

let __tour = null;

function startTour(){
  if (__tour && __tour.active) return;

  // Tour is disabled in Summary View (info-only).
  try {
    const ui = (window.CodiviumInsights && typeof window.CodiviumInsights.getEffectiveUiState === 'function')
      ? window.CodiviumInsights.getEffectiveUiState()
      : null;
    if (ui && ui.mode === 'info_only') {
      alert('The guided tour is not available in Summary View. Use a larger screen or switch to Full Dashboard mode.');
      return;
    }
  } catch (_) { /* ignore */ }
  __tour = createTour();
  __tour.start();
}

function createTour(){
  const state = {
    active: false,
    index: 0,
    steps: [],
    backdrop: null,
    spotlight: null,
    card: null,
    aggOpen: false,
  };

  function buildUI(){
    const backdrop = document.createElement("div");
    backdrop.className = "ciTourBackdrop";

    const spotlight = document.createElement("div");
    spotlight.className = "ciTourSpotlight";

    const card = document.createElement("div");
    card.className = "ciTourCard";
    card.innerHTML = `
      <div class="ciTourCardHead">
        <div>
          <div class="ciTourCardTitle" id="ciTourTitle"></div>
          <div class="ciTourCardMeta" id="ciTourMeta"></div>
        </div>
        <button class="ciTourClose" type="button" aria-label="Close tour" id="ciTourClose">×</button>
      </div>
      <div class="ciTourCardBody" id="ciTourBody"></div>

      <div class="ciTourCalcNote" id="ciTourCalcNote">
        Calculation details are available in the FAQ and Glossary.
      </div>

      <div class="ciTourFoot">
        <button class="ciTourNavBtn" type="button" id="ciTourSkip">Skip</button>
        <div class="ciTourBtns">
          <button class="ciTourNavBtn" type="button" id="ciTourBack">Back</button>
          <button class="ciTourNavBtn primary" type="button" id="ciTourNext">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(spotlight);
    document.body.appendChild(card);

    state.backdrop = backdrop;
    state.spotlight = spotlight;
    state.card = card;

    // Bind
    card.querySelector("#ciTourClose").addEventListener("click", stop);
    card.querySelector("#ciTourSkip").addEventListener("click", stop);
    card.querySelector("#ciTourBack").addEventListener("click", prev);
    card.querySelector("#ciTourNext").addEventListener("click", next);

    document.addEventListener("keydown", onKeyDown);
    try {
      const g = (window.__cvGlobals = window.__cvGlobals || {});
      if (!g.tourKeyHandlers) g.tourKeyHandlers = new Set();
      g.tourKeyHandlers.add(onKeyDown);
    } catch (_e) {}
    window.addEventListener("resize", renderStep);
  }

  function destroyUI(){
    try { document.removeEventListener("keydown", onKeyDown); } catch (e) { ciErr('ignored error', e); }
    try {
      const g = window.__cvGlobals;
      if (g && g.tourKeyHandlers) g.tourKeyHandlers.delete(onKeyDown);
    } catch (_e) {}
    try { window.removeEventListener("resize", renderStep); } catch (e) { ciErr('ignored error', e); }
    if (state.backdrop) state.backdrop.remove();
    if (state.spotlight) state.spotlight.remove();
    if (state.card) state.card.remove();
    state.backdrop = state.spotlight = state.card = null;
  }

  function onKeyDown(e){
    if (!state.active) return;
    if (e.key === "Escape") stop();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  }

  function getStep(){
    return (state.steps && state.steps[state.index]) || null;
  }

  function getContent(key){
    // Prefer INFO_DETAIL (richer), fallback to INFO_CONTENT
    const detail = (typeof INFO_DETAIL !== "undefined" && INFO_DETAIL[key]) ? INFO_DETAIL[key] : null;
    const base = (typeof INFO_CONTENT !== "undefined" && INFO_CONTENT[key]) ? INFO_CONTENT[key] : null;
    const title = (base && base.title) ? base.title : (key || "Metric");
    const body = (detail && detail.body) ? detail.body : ((base && base.body) ? base.body : "");
    const agg = (detail && detail.agg) ? detail.agg : "";
    return { title, body, agg };
  }

function stripAnalysisSection(text){
  // Tour boxes focus on the metric explanation; personalized analysis appears in the right-side panel.
  const marker = "\n\nAnalysis of your results";
  const idx = text.indexOf(marker);
  const base = (idx >= 0) ? text.slice(0, idx) : text;
  return base.trim();
}

  function positionCard(rect){
    const card = state.card;
    if (!card) return;

    const pad = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.getBoundingClientRect().width;
    const ch = card.getBoundingClientRect().height;

    // Prefer right side
    let left = rect.right + pad;
    let top = rect.top;

      // Nudge MCQ tour cards upward slightly (they can otherwise sit too low).
      const step = getStep();
      if (step && (step.key === "panel_mcq" || step.key === "mcqEasy" || step.key === "mcqMedium" || step.key === "mcqHard")) {
        top = top - 80;
      }

    if (left + cw > vw - pad) {
      left = rect.left - cw - pad;
    }
    if (left < pad) left = pad;

    // Clamp vertically
    if (top + ch > vh - pad) top = vh - ch - pad;
    if (top < pad) top = pad;

    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  }

  function renderStep(){
    if (!state.active) return;
    const step = getStep();
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (!el) return;

    try { el.scrollIntoView({ block: "center", inline: "nearest" }); } catch (e) { ciErr('ignored error', e); }

    const rect = el.getBoundingClientRect();
    const spot = state.spotlight;
    if (spot){
      const m = 6;
      spot.style.left = `${Math.max(0, Math.round(rect.left - m))}px`;
      spot.style.top = `${Math.max(0, Math.round(rect.top - m))}px`;
      spot.style.width = `${Math.round(rect.width + m*2)}px`;
      spot.style.height = `${Math.round(rect.height + m*2)}px`;
    }

    const { title, body } = getContent(step.key);

    const card = state.card;
    if (card){
      const titleEl = card.querySelector("#ciTourTitle");
      const metaEl = card.querySelector("#ciTourMeta");
      const bodyEl = card.querySelector("#ciTourBody");
      const calcNote = card.querySelector("#ciTourCalcNote");
      const nextBtn = card.querySelector("#ciTourNext");
      const backBtn = card.querySelector("#ciTourBack");

      titleEl.textContent = title;
      metaEl.textContent = `Step ${state.index + 1} of ${(state.steps ? state.steps.length : 0)}`;
      const baseText = stripAnalysisSection(body || "");
      const cta = __tourCtaForKey(step.key);
      bodyEl.textContent = cta ? (baseText + "\n\n" + cta) : baseText;

      if (calcNote) calcNote.textContent = "For full calculation details, see the FAQ and Glossary.";

      backBtn.disabled = state.index === 0;
      nextBtn.textContent = (state.index === (state.steps ? state.steps.length : 0) - 1) ? "Done" : "Next";

      positionCard(rect);
    }
  }


function computeVisibleSteps(){
  const steps = [];
  (TOUR_STEPS || []).forEach((s) => {
    if (!s || !s.selector) return;
    const el = document.querySelector(s.selector);
    if (!el) return;
    // Skip hidden panels / elements.
    try {
      if (el.classList && el.classList.contains('isHidden')) return;
      if (el.closest && el.closest('.isHidden')) return;
    } catch (_) {}
    steps.push(s);
  });
  return steps;
}

  function start(){
    state.steps = computeVisibleSteps();
    state.index = 0;
    if (!state.steps || !state.steps.length){
      alert('No visible panels are available for the tour.');
      return;
    }
    state.active = true;
    buildUI();
    renderStep();
  }

  function stop(){
    state.active = false;
    destroyUI();
  }

  function next(){
    if (!state.active) return;
    if (state.index >= (state.steps ? state.steps.length : 0) - 1) { stop(); return; }
    state.index += 1;
    renderStep();
  }

  function prev(){
    if (!state.active) return;
    if (state.index <= 0) return;
    state.index -= 1;
    renderStep();
  }

  return { get active(){ return state.active; }, start, stop };
}



// STATUS: LIVE — source file (do not deploy directly; deploy dashboard.bundle.js)
// OWNER: FAQ/Glossary modals, event delegation (all delegated click handlers),
//        boot sequence (init() entry point), KaTeX rendering
// NOT owned here: layout engine, chart rendering, public API
// GENERATED: No — authored source file

// dashboard.08.help-and-init.js — FAQ/Glossary modals, initialisation entry point.

// -----------------------------
// Help modals: Dashboard FAQ + Glossary of Terms
// -----------------------------
function setupHelpModals(){
  // Event delegation — works regardless of init call order or re-renders.
  const g = (window.__cvGlobals = window.__cvGlobals || {});
  if (g.helpModalDelegationBound) return;
  g.helpModalDelegationBound = true;

  // Open: capture phase so href='#' never fires scroll before preventDefault
  document.addEventListener('click', (e) => {
    const el = e.target.closest ? e.target.closest(
      '#openFaqLink, #openGlossaryLink, #openFaqLinkInPane, #openGlossaryLinkInPane'
    ) : null;
    if (!el) return;
    e.preventDefault();
    const id = (el.id === 'openFaqLink' || el.id === 'openFaqLinkInPane')
      ? 'cvFaqModal' : 'cvGlossaryModal';
    openHelpModal(id);
  }, true);

  // Close buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-close-modal]') : null;
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-close-modal');
    if (id) closeHelpModal(id);
  });

  // Click backdrop overlay to close
  document.addEventListener('mousedown', (e) => {
    if (!e.target.classList || !e.target.classList.contains('cvHelpModal')) return;
    closeHelpModal(e.target.id);
  });

  // Info-pane close button (replaces inline onclick — R20)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('#infoPaneCloseBtn') : null;
    if (!btn) return;
    e.preventDefault();
    try {
      if (window.CodiviumInsights && typeof window.CodiviumInsights.toggleInfoPane === 'function') {
        window.CodiviumInsights.toggleInfoPane();
      }
    } catch (_) {}
  });

  // Esc to close
  if (!g.helpEscHandler){
    g.helpEscHandler = (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.cvHelpModal:not(.isHidden)');
      if (open) closeHelpModal(open.id);
    };
    document.addEventListener('keydown', g.helpEscHandler);
  }
}



function __cvRenderKatexIn(root){
  if (!root) return;
  if (root.__cvKatexRendered) return;
  const fn = window.renderMathInElement;
  if (typeof fn !== 'function') return;
  try {
    fn(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
    root.__cvKatexRendered = true;
  } catch (e) { ciErr('ignored error', e); }
}


// Minimal HTML sanitizer for help/FAQ content.
// The FAQ answers are currently authored as trusted strings, but this prevents accidental
// XSS if those strings ever become data-driven.
function __cvSanitizeHelpHtml(html){
  try {
    const s = String(html || '');
    if (!s) return '';
    // Fast path: no tags
    if (s.indexOf('<') === -1) return s;
    const t = document.createElement('template');
    t.innerHTML = s;

    // Remove dangerous nodes
    t.content.querySelectorAll('script, style, iframe, object, embed, link[rel="import"], meta').forEach((n) => n.remove());

    // Strip inline event handlers and dangerous URL schemes
    t.content.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes || []).forEach((attr) => {
        const name = String(attr.name || '');
        const val = String(attr.value || '');
        if (/^on/i.test(name)) el.removeAttribute(name);
        if ((name === 'href' || name === 'src') && /^(javascript|data|vbscript):/i.test(val.trim())) el.removeAttribute(name);
      });
      if (el.tagName === 'A') {
        // Ensure safe external navigation behavior
        const target = String(el.getAttribute('target') || '').toLowerCase();
        if (target === '_blank') el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return t.innerHTML;
  } catch (_e) {
    return '';
  }
}


// -----------------------------
// FAQ content injection (answers + any missing metric questions)
// The FAQ HTML keeps questions as static markup; answers are injected here so the dashboard
// stays consistent with the KaTeX scoring specification and config defaults.
// -----------------------------
function __cvSetupFaqContent(){
  const faqModal = document.getElementById('cvFaqModal');
  if (!faqModal || faqModal.__cvFaqFilled) return;
  try {

  // These defaults mirror config/scoring-config.katex.v1.json.
  // Keep them here as a runtime fallback in case the config file is not accessible.
  const CFG = {
    recency: { halfLifeDays: 15 },
    difficultyFactor: { basic: 1.0, intermediate: 1.3, advanced: 1.6 },
    coding: {
      activityWeight: { micro: 1.0, interview: 1.0 },
      triesFactor: { min: 0.45, max: 1.0 },
      convergenceWeights: [1.0, 0.92, 0.85, 0.78, 0.70, 0.60], // A1..A6
      timeFactor: {
        min: 0.6,
        max: 1.0,
        TdMinutes: { basic: 90, intermediate: 120, advanced: 160 }
      }
    },
    mcq: {
      breadth: { gamma: 1.5, usesRecencyDecay: true },
      points: { Pmcq: 0.8 }
    },
    breadth: {
      tauE: 1.5,
      alpha: 0.65,
      beta: 0.35,
      confidenceK: { micro: 10, interview: 8, mcq: 14 },
      overallWeights: { micro: 0.4, interview: 0.4, mcq: 0.2 }
    },
    depth: {
      lambda: 12,
      overallWeights: { micro: 0.5, interview: 0.5 },
      chart: { lambdaChart: 12 }
    },
    points: { P0: 4.0, Predo: 2.5, redoSpacingDays: 7 },
    efficiency: { epsilonMinutes: 1.0 },
    edgeCases: { whenTotalEvidenceIsZeroReturn: 0 }
  };

  const esc = (s) => String(s || '').trim();
  const normQ = (s) => esc(s).toLowerCase().replace(/\s+/g, ' ');

  // Shared math snippets (KaTeX)
  const HALF = CFG.recency.halfLifeDays;
  const TAU = CFG.breadth.tauE;
  const ALPHA = CFG.breadth.alpha;
  const BETA = CFG.breadth.beta;
  const LAMBDA = CFG.depth.lambda;
  const GAMMA = CFG.mcq.breadth.gamma;
  const P0 = CFG.points.P0;
  const PREDO = CFG.points.Predo;
  const PMCQ = CFG.mcq.points.Pmcq;
  const EPS_MIN = CFG.efficiency.epsilonMinutes;

  const diffTableHtml = `
    <table class="cvMiniTable cvMiniTableDarkText">
      <thead><tr><th>Difficulty</th><th>Factor</th><th>Time baseline (T<sub>d</sub>)</th></tr></thead>
      <tbody>
        <tr><td>Basic</td><td>${CFG.difficultyFactor.basic.toFixed(1)}</td><td>${CFG.coding.timeFactor.TdMinutes.basic} min</td></tr>
        <tr><td>Intermediate</td><td>${CFG.difficultyFactor.intermediate.toFixed(1)}</td><td>${CFG.coding.timeFactor.TdMinutes.intermediate} min</td></tr>
        <tr><td>Advanced</td><td>${CFG.difficultyFactor.advanced.toFixed(1)}</td><td>${CFG.coding.timeFactor.TdMinutes.advanced} min</td></tr>
      </tbody>
    </table>
  `;

  const answers = new Map();

  // ---- Getting started (top-of-FAQ) ----
  answers.set(normQ("What is the dashboard and what is its purpose?"), `
    <p>The <strong>Performance Insights Dashboard</strong> is Codivium’s <strong>feedback layer</strong>. It does not replace practice — it makes practice <em>measurable</em> so you can improve faster.</p>
    <p>Codivium is built around <strong>deliberate practice</strong>: not just doing more problems, but repeatedly training the specific skills you are currently weakest at. Deliberate practice works best when you have:</p>
    <ul>
      <li><strong>A precise target</strong> (e.g., “I’m slow on DP transitions”, “I miss edge cases in graphs”).</li>
      <li><strong>Repeated reps</strong> on that target, in a time box.</li>
      <li><strong>Fast feedback</strong> on what happened (speed, accuracy, convergence, category balance).</li>
      <li><strong>Adjustment</strong> to the next practice block based on that feedback.</li>
    </ul>
    <p>The dashboard exists to provide that feedback and structure. It shows:</p>
    <ul>
      <li><strong>Mastery balance</strong> (Breadth + Depth) so you don’t over-invest in one dimension.</li>
      <li><strong>Time allocation</strong> by category so you can see what you’re actually training.</li>
      <li><strong>Convergence signals</strong> (attempt buckets / pass rates) that highlight where you’re burning time or repeatedly failing tests.</li>
      <li><strong>Trend + cadence</strong> (time on platform) to keep momentum and consistency.</li>
    </ul>
    <p>Think of it as a <strong>practice compass</strong>: it helps you choose the next best drills, measure whether they worked, and keep your training balanced over time.</p>
  `);

  answers.set(normQ("How do I use the dashboard?"), `
    <p>Use the dashboard as a <strong>weekly feedback loop</strong> that drives your deliberate practice plan. A simple, effective workflow:</p>
    <ol>
      <li><strong>Scan the headlines</strong> (Codivium Score, Points, Efficiency) to understand your current phase:
        <ul>
          <li><strong>Score</strong> rises when breadth and depth stay balanced (mastery).</li>
          <li><strong>Points</strong> rise with verified outcomes (momentum).</li>
          <li><strong>Efficiency</strong> rises when your time converts into accepts (execution quality).</li>
        </ul>
      </li>
      <li><strong>Pick 1–2 focus categories</strong> for the next practice cycle. Use <em>Exercise time by category</em> + <em>Depth</em> together:
        <ul>
          <li>If <strong>time is high</strong> but <strong>depth stays low</strong>, you likely have a bottleneck (missing prerequisite, weak pattern variants, or poor convergence).</li>
          <li>If <strong>depth is high</strong> but <strong>breadth is low</strong>, schedule a light weekly sweep of neglected categories.</li>
        </ul>
      </li>
      <li><strong>Use the Heatmap</strong> to diagnose convergence:
        <ul>
          <li>Lots of time in higher attempt buckets (A3–A5) indicates you’re losing time to mistakes, edge cases, or weak test strategy.</li>
          <li>Make the next block a deliberate drill: smaller problems, tighter timebox, and explicit post-mortems.</li>
        </ul>
      </li>
      <li><strong>Practice in short loops</strong>: choose a timebox (e.g., 45–90 minutes), run a focused session, then briefly review what failed and why.</li>
      <li><strong>Review the dashboard again</strong> after a few sessions. You’re looking for feedback signals:
        <ul>
          <li>Do attempts converge faster (more A1/A2)?</li>
          <li>Is time in the focus category producing more accepts?</li>
          <li>Is breadth staying healthy while depth improves?</li>
        </ul>
      </li>
    </ol>
    <p>In other words: <strong>Plan → Practice → Feedback → Adjust → Repeat</strong>. The dashboard is the feedback and measurement piece that makes deliberate practice efficient.</p>
  `);

  answers.set(normQ("Can I use Codivium without using the dashboard?"), `
    <p><strong>Yes.</strong> The dashboard is <strong>optional</strong>. You can use Codivium purely as a practice platform — solve exercises, run MCQs, and use the site’s services without ever opening the dashboard.</p>
    <p>What you miss by ignoring it is mainly the <strong>structured feedback</strong> layer. Deliberate practice still works without dashboards, but it becomes harder to answer questions like:</p>
    <ul>
      <li>“Which category should I train next?”</li>
      <li>“Am I getting faster at convergence or just spending more time?”</li>
      <li>“Am I neglecting whole areas while focusing on one topic?”</li>
    </ul>
    <p>If you prefer a lightweight approach, you can ignore the dashboard day-to-day and just use it occasionally (e.g., once a week) as a quick check-in. If you prefer a fully self-directed workflow, you can skip it entirely — Codivium’s core practice functionality is not dependent on the dashboard.</p>
  `);

  // ---- Existing FAQ questions (keep questions; inject answers) ----
  answers.set(normQ('What are the three headline scoring readouts?'), `
    <p>The dashboard reports three headline scoring readouts that each measure a different aspect of your progress. They are designed so you cannot inflate one by gaming another.</p>
    <ul>
      <li><strong>Codivium Score (0–100)</strong> — your master mastery score. It combines breadth (how widely you can apply skills) and depth (how reliably you apply them). Both need to be strong — a very high score in one cannot compensate for a very low score in the other. Focus on building both pillars consistently.</li>
      <li><strong>Codivium Points (uncapped)</strong> — a cumulative career-trajectory score that grows throughout your time on the platform. Points reward accepted solves, weighted by difficulty and how efficiently you reached them. Recent activity counts more than older activity. Re-doing the same exercise within 7 days adds no extra points.</li>
      <li><strong>Efficiency (pts / hr)</strong> — a rate metric: quality output per hour of active practice time. It cannot be inflated by spending more hours — only by improving the quality of your solves relative to the time spent. A declining efficiency while hours increase is a useful signal to change your approach.</li>
    </ul>
    <p>The key design principle: <strong>Codivium Score stays stable and meaningful</strong>, while Points and Efficiency provide career and momentum context. All three use recency weighting, so your scores reflect where you are now rather than where you were when you started.</p>
  `);

  answers.set(normQ('What does “Breadth / Coverage” mean?'), `
    <p><strong>Breadth</strong> is a 0–100 score measuring how widely you have engaged with the category catalog, computed separately for each track (Micro Challenges, Interview Preparation, and MCQ).</p>
    <p>Breadth rewards two things: <strong>coverage</strong> (how many categories you have meaningfully engaged with) and <strong>balance</strong> (how evenly your practice is spread across them). Concentrating all your sessions in one or two categories keeps breadth below where raw coverage alone would suggest.</p>
    <p>A small amount of activity in a category counts less than sustained engagement — a single session registers as partial coverage and grows as evidence accumulates. Categories you have never attempted do not count at all.</p>
    <p>The three track breadth scores are blended into an overall breadth score, with coding tracks weighted more heavily than MCQ.</p>
    <ul>
      <li><strong>To raise breadth:</strong> attempt new categories and distribute practice across them rather than repeating familiar ones.</li>
      <li><strong>Breadth ≠ mastery:</strong> high breadth with low depth means you have visited many areas but are not yet consistent within them.</li>
    </ul>
  `);

  
  
  answers.set(normQ('What are the breadth bands?'), `
    <p>Breadth is a continuous 0–100 score. The dashboard uses the following <strong>interpretation bands</strong> as guidance:</p>
    <ul>
      <li><strong>0–25</strong>: Narrow coverage (likely blind spots)</li>
      <li><strong>25–50</strong>: Developing coverage (some gaps remain)</li>
      <li><strong>50–75</strong>: Broad coverage (good topic sweep)</li>
      <li><strong>75–100</strong>: Comprehensive coverage (strong sweep + balance)</li>
    </ul>
    <p><em>Note:</em> these bands are interpretive. The underlying breadth calculation is evidence‑based and continuous (it does not “step” at these thresholds).</p>
  `);

  answers.set(normQ('What does “Depth” mean?'), `
    <p><strong>Depth</strong> measures how much verified coding evidence you have accumulated within categories, expressed as a 0–100 score with diminishing returns. It is computed from your Micro and Interview coding tracks only — MCQ does not contribute to depth.</p>
    <p>Depth has diminishing returns by design. The gap between “no evidence” and “some evidence” in a category is larger than the gap between “a lot” and “a little more.” This prevents grinding the same exercise from producing outsized depth scores.</p>
    <p>Depth also fades gradually when you have not practised a category recently. The fade is slow (weeks, not days) and harder categories fade more slowly than easier ones — keeping your depth score reflecting current ability rather than historical accumulation.</p>
    <ul>
      <li><strong>To raise depth:</strong> produce clean accepted solves on first or second attempts. Consistent early-attempt success is the strongest depth signal.</li>
      <li><strong>High attempt counts</strong> before accepting reduce your convergence quality, which reduces the evidence each session contributes to depth.</li>
      <li><strong>Long absence</strong> from a category gradually reduces its depth contribution — intentional, as depth should reflect current ability.</li>
    </ul>
    <p>The per-category depth chart is the most actionable view — it shows exactly where to focus to raise your Codivium Score.</p>
  `);

  
  answers.set(normQ('What are the depth bands (Emerging / Building / Focus)?'), `
    <p>The depth “bands” are <strong>relative to you</strong>. They summarize where each category sits in your own depth distribution.</p>
    <ul>
      <li><strong>Focus</strong>: categories in the top ~20% of your touched-category depths (≥ 80th percentile)</li>
      <li><strong>Building</strong>: categories around the middle (≥ 50th percentile)</li>
      <li><strong>Emerging</strong>: early depth among touched categories (≥ 20th percentile)</li>
      <li><strong>Untouched</strong>: depth = 0</li>
    </ul>
    <p>This makes the banding robust across different users and different total practice volumes.</p>
  `);

  answers.set(normQ('What is “concentration” in depth?'), `
    <p><strong>Concentration</strong> describes how much of your total depth is carried by your top-performing categories. It is shown as a quick diagnostic, not a scoring input.</p>
    <p>Some concentration is normal and healthy — if you have been in a focus cycle on a specific area, you would expect a high share of your depth to sit there. Very high concentration (most of your depth in one or two categories with little elsewhere) can hide gaps that are not visible from the overall depth score alone.</p>
    <p>Use concentration alongside the depth-by-category chart: if concentration is high, check which categories are carrying it and whether the lower-depth categories align with areas you want to improve. The adaptive recommendation engine will often surface this automatically as a weakness or re-entry recommendation.</p>
  `);

  answers.set(normQ('How are depth outliers detected (median + MAD)?'), `
    <p>Depth outliers are detected <strong>robustly</strong> so that a single extreme category doesn’t distort the baseline.</p>
    <h3>Robust baseline</h3>
    <ul>
      <li>Compute the <strong>median</strong> depth across touched categories: <code>m</code></li>
      <li>Compute <strong>MAD</strong>: median of <code>|depth − m|</code></li>
      <li>Convert to a robust sigma: <code>σ = 1.4826 × MAD</code></li>
    </ul>
    <h3>Outlier rule (dashboard default)</h3>
    <ul>
      <li>Require at least 5 touched categories (otherwise suppressed)</li>
      <li>Require an absolute gap ≥ <code>5.0</code> depth points</li>
      <li>Flag high outlier if <code>(depth − m)/σ ≥ 1.5</code>, low outlier if ≤ −1.5</li>
    </ul>
    <p>These thresholds are chosen to avoid “false alarms” when evidence is sparse or depths are nearly equal.</p>
  `);

  answers.set(normQ('What is the convergence heatmap showing?'), `
    <p>The <strong>convergence heatmap</strong> summarizes <em>solve quality</em> by category across attempt buckets.</p>
    <p>Rows are categories. Columns are attempt buckets:</p>
    <ul>
      <li><strong>A1</strong> = performance on first attempt</li>
      <li><strong>A2</strong> = second attempt, … up to <strong>A5</strong></li>
    </ul>
    <p>Each tile shows a <strong>pass‑rate style signal</strong> for that category and attempt bucket (displayed as a percentage). Higher values mean better convergence / cleaner solves in that bucket. Tiles may be empty (—) if there is not enough evidence in that bucket.</p>
  `);

  
  answers.set(normQ('What does “Time on platform” include?'), `
    <p><strong>Time on platform</strong> is the amount of time you were actively practicing on Codivium (coding sessions + MCQ quizzes), aggregated into the time window you selected (e.g., 7D, 30D, 90D, YTD).</p>
    <p>Depending on data availability, time can be derived from session timers (start/end) or from the sum of recorded attempt durations. It is used for interpretation and for <strong>Efficiency</strong> (points per hour).</p>
  `);

  answers.set(normQ('What do 7D/30D/90D/YTD and Daily/Weekly mean?'), `
    <p>These controls change the <strong>time window</strong> and the <strong>aggregation resolution</strong> used in charts:</p>
    <ul>
      <li><strong>7D / 30D / 90D</strong>: last 7 / 30 / 90 days ending today</li>
      <li><strong>YTD</strong>: from Jan 1 of the current year to today</li>
      <li><strong>Daily</strong>: each bar/point represents one day</li>
      <li><strong>Weekly</strong>: each bar/point represents one week (smoothed trends)</li>
    </ul>
    <p>Scores like breadth/depth are recency‑weighted by design (half‑life ${HALF} days). The window controls mainly affect time‑series charts and “last‑30‑days” variants of points/efficiency.</p>
  `);

  answers.set(normQ('What does “Exercise time by category” include?'), `
    <p>This chart shows how your practice time is distributed across categories (coding categories). It helps answer: <em>where did my time go?</em></p>
    <ul>
      <li>Time is grouped by category using the same canonical category keys as other charts.</li>
      <li>It includes active practice time within the selected window.</li>
      <li>Use it together with <strong>Depth by category</strong>: if a category consumes lots of time but depth stays low, it may indicate a bottleneck (difficulty cliff, missing prerequisite, or inefficient convergence).</li>
    </ul>
  `);

  answers.set(normQ('What is “Weighted MCQ Score” and what are its bands?'), `
    <p><strong>Weighted MCQ Score</strong> is a 0–100 diagnostic summary of your MCQ performance that emphasises harder quizzes and more recent results. It is shown as a supplementary metric, not a primary scoring input.</p>
    <p>The score weights each quiz session by its difficulty level and how recently it was taken — so a high score on an Advanced quiz contributes more than the same score on a Basic quiz, and a recent session counts more than one from several months ago.</p>
    <h3>Interpretation bands</h3>
    <ul>
      <li><strong>0–50 (Developing)</strong> — performance is inconsistent or concentrated at lower difficulty levels. Build consistency at Basic before advancing.</li>
      <li><strong>50–70 (Consolidating)</strong> — reasonable performance at lower difficulty; room to grow at Intermediate and Advanced.</li>
      <li><strong>70+ (Proficient)</strong> — strong consistent performance across difficulty levels. Growing coverage at Advanced is the next step.</li>
    </ul>
    <p>If Weighted MCQ Score is high but your coding Breadth or Depth scores are lower, your conceptual knowledge is ahead of your implementation skill — a useful signal to direct more time to coding exercises.</p>
  `);

  answers.set(normQ('What does “n” mean in the MCQ analysis?'), `
    <p><strong>n</strong> is the evidence count behind an MCQ statistic — typically the number of questions (or attempts) used to compute the percentage for a category/difficulty bar.</p>
    <p>Small <code>n</code> means the percentage is noisy; the dashboard may suppress callouts or confidence when evidence is too small. As a rule of thumb, treat results as stable only once <code>n</code> is comfortably above ~20 for that bar.</p>
  `);

  answers.set(normQ('What is a “difficulty cliff”?'), `
    <p>A <strong>difficulty cliff</strong> is when performance drops sharply as difficulty increases — typically when Basic performance is okay but Advanced performance is much lower in the same category.</p>
    <p>In the dashboard’s MCQ analysis, a cliff is flagged when:</p>
    <ul>
      <li>Both Basic and Advanced have enough evidence, and</li>
      <li><code>Basic% − Advanced% ≥ 25pp</code> (percentage points)</li>
    </ul>
    <p>Cliffs are useful because they often indicate missing edge‑case reasoning, fragile mental models, or gaps in prerequisite knowledge.</p>
  `);

    // Additional metric questions have been moved to docs/scoring/codivium_scoring_katex.html
  // The full mathematical specification is linked at the bottom of the FAQ modal.
  const extra = [];  // intentionally empty — formulae live in the scoring spec doc

  const groups = Array.from(faqModal.querySelectorAll('section.faq-groups > details.group'));
  const scoringGroup = groups.find(g => normQ(g.querySelector('summary .group-title strong')?.textContent).includes('scoring system')) || groups[0];
  const scoringFaq = scoringGroup ? scoringGroup.querySelector('.faq') : null;

  const existingQSet = new Set(Array.from(faqModal.querySelectorAll('.faq details summary .q')).map(el => normQ(el.textContent)));

  const mkDetails = (qText, aHtml) => {
    const d = document.createElement('details');
    const s = document.createElement('summary');
    const q = document.createElement('div');
    q.className = 'q';
    q.textContent = qText;
    const chev = document.createElement('div');
    chev.className = 'chev';
    chev.setAttribute('aria-hidden', 'true');
    s.appendChild(q);
    s.appendChild(chev);
    const ans = document.createElement('div');
    ans.className = 'answer';
    const a = document.createElement('div');
    a.className = 'a';
    a.innerHTML = __cvSanitizeHelpHtml(aHtml);
    ans.appendChild(a);
    d.appendChild(s);
    d.appendChild(ans);
    d.setAttribute('data-cv-faq-generated', '1');
    return d;
  };

  if (scoringFaq){
    extra.forEach(item => {
      const key = normQ(item.q);
      if (existingQSet.has(key)) return;
      scoringFaq.appendChild(mkDetails(item.q, item.a));
      existingQSet.add(key);
    });
  }

  // Inject answers into existing placeholders.
  faqModal.querySelectorAll('.faq details').forEach((d) => {
    const qEl = d.querySelector('summary .q');
    const aEl = d.querySelector('.answer .a');
    if (!qEl || !aEl) return;
    const key = normQ(qEl.textContent);
    const html = answers.get(key);
    if (html && (!aEl.textContent || !aEl.textContent.trim())) {
      aEl.innerHTML = __cvSanitizeHelpHtml(html);
    }
  });

  // Render any KaTeX we injected.
  __cvRenderKatexIn(faqModal);
  faqModal.__cvFaqFilled = true;
  } catch (e) {
    try { faqModal.__cvFaqFilled = false; } catch (_) {}
    // console.error('FAQ injection error', e);
  }
}


function __cvEnableModalFocusTrap(modal){
  if (!modal || modal.__cvTrapBound) return;
  modal.__cvTrapBound = true;

  const getFocusable = () => {
    const sel = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return Array.from(modal.querySelectorAll(sel))
      .filter((el) => {
        if (!el) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        // ignore hidden elements
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
  };

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    // Only trap when modal is open
    if (modal.classList.contains('isHidden')) return;

    const focusables = getFocusable();
    if (!focusables.length) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !modal.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, true);
}

function openHelpModal(id){
  const modal = document.getElementById(id);
  if (!modal) return;

  // Save focus
  modal.__lastFocus = document.activeElement;

  modal.classList.remove('isHidden');

  document.body.classList.add('cv-modal-open');

  __cvEnableModalFocusTrap(modal);

  // Focus the window for keyboard scroll
  const win = modal.querySelector('.cvHelpWindow');
  if (win) {
    win.focus({ preventScroll: true });
    win.scrollTop = 0;
  }

  // Init expandable answer animation heights (now that modal is visible)
  try {
    __cvInitHelpDoc(modal);
  } catch (e) {
    // non-fatal
  }

  // Render any KaTeX math in this modal (idempotent)
  __cvRenderKatexIn(modal);
}

function closeHelpModal(id){
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('isHidden');

  document.body.classList.remove('cv-modal-open');

  // Restore focus
  const last = modal.__lastFocus;
  if (last && typeof last.focus === 'function') {
    try { last.focus(); } catch (e) { ciErr('ignored error', e); }
  }
}

function __cvInitHelpDoc(root){
  if (!root) return;

  const setHeightVar = (detailsEl) => {
    const answer = detailsEl.querySelector(':scope > .answer');
    if (!answer) return;

    answer.style.removeProperty('--target-h');

    // Make measurable
    answer.style.maxHeight = 'none';
    const content = answer.firstElementChild;
    const target = content ? content.scrollHeight : answer.scrollHeight;

    // Restore controlled max-height
    answer.style.maxHeight = '';
    answer.style.setProperty('--target-h', `${target}px`);
  };

  // Initialize heights for all questions inside this modal
  root.querySelectorAll('.faq details').forEach((d) => setHeightVar(d));

  // Bind toggle handler once (scoped)
  try {
    const g = (window.__cvGlobals = window.__cvGlobals || {});
    if (!g.helpToggleBound){
      g.helpToggleBound = true;
      g.helpToggleHandler = (e) => {
        const d = e.target;
        if (!(d instanceof HTMLDetailsElement)) return;
        if (!d.closest('.cvHelpModal')) return;
        if (!d.closest('.faq')) return;
        setHeightVar(d);
      };
      document.addEventListener('toggle', g.helpToggleHandler, true);

      g.helpResizeRaf = null;
      g.helpResizeHandler = () => {
        if (g.helpResizeRaf) cancelAnimationFrame(g.helpResizeRaf);
        g.helpResizeRaf = requestAnimationFrame(() => {
          g.helpResizeRaf = null;
          document.querySelectorAll('.cvHelpModal:not(.isHidden) .faq details').forEach((d) => setHeightVar(d));
        });
      };
      window.addEventListener('resize', g.helpResizeHandler);
    }
  } catch (_e) {}
}

function init(){
    // Strict runtime validation (prevents cascading errors when DOM/assets are missing)
    let __domOk = true;
    try { if (typeof __cvValidateDom === 'function') __domOk = __cvValidateDom(); } catch (_) { __domOk = true; }
    if (!__domOk) return;

    // If CDN loading is disabled, missing vendors should be visible (not just console warnings).
    const __allowCdn = String(document.documentElement.getAttribute('data-cv-allow-cdn') || '').toLowerCase() === 'true';
    if (!hasChartJs() && !__allowCdn){
      try { if (typeof __cvAddRuntimeAlert === 'function') __cvAddRuntimeAlert('missing_chartjs', 'Chart.js is missing and CDN loading is disabled. Add vendor assets (scripts/fetch_vendor_deps.sh) or enable CDN.', 'warn'); } catch (_) {}
    }
    if (!hasChartJs()) console.warn("Chart.js missing; charts will not render.");

    // Bind UI controls (safe to call multiple times; functions guard internally)
    safe('setupTimeControls', setupTimeControls);
    safe('setupExerciseTreemap', setupExerciseTreemap);
    safe('setupInfoButtons', setupInfoButtons);
    safe('setupHelpModals', setupHelpModals);
    safe('__cvSetupFaqContent', __cvSetupFaqContent);
    safe('__cvSetupResilience', __cvSetupResilience);
    safe('clearInfoPaneStaticText', () => { clearInfoPaneStaticText(); const interpEl = cv$("infoPaneInterp"); if (interpEl) interpEl.textContent = ""; });
    safe('setupHeatmapControls', setupHeatmapControls);
    safe('setupPanelCtas', setupPanelCtas);
    safe('setupScoresTabs', setupScoresTabs);

    // Guided tour button
    const tourBtn = document.getElementById("startTourBtn");
    if (tourBtn && !tourBtn.__cvBound){
      tourBtn.__cvBound = true;
      tourBtn.addEventListener("click", (e) => {
        e.preventDefault();
        try { startTour(); } catch (err) { console.error("Tour error:", err); }
      });
    }



    // Apply stored/payload UI prefs (mode + panel visibility + layout) before first render.
    safe('__cvEnsureUiPrefsLoaded', () => { try { if (typeof __cvEnsureUiPrefsLoaded === 'function') __cvEnsureUiPrefsLoaded(); } catch (e) {} });
    safe('__cvBindUiLayoutListeners', () => { try { if (typeof __cvBindUiLayoutListeners === 'function') __cvBindUiLayoutListeners(); } catch (e) {} });
    safe('__cvApplyUiModeAndLayout', () => { try { if (typeof __cvApplyUiModeAndLayout === 'function') __cvApplyUiModeAndLayout(); } catch (e) {} });
    // Back-compat if mode/layout helper is missing
    safe('__cvApplyPanelVisibility', () => { try { if (typeof __cvApplyUiModeAndLayout !== 'function') { if (typeof __cvApplyPanelVisibility === 'function') __cvApplyPanelVisibility(); } } catch (e) {} });
    // (resizer setup removed — CVU-2026-03-B)



    // If Chart.js loads asynchronously (e.g., via CDN), ensure we render charts once it becomes available.
    try {
      if (!hasChartJs() && __allowCdn){
        let tries = 0;
        const maxTries = 20; // ~4s
        const tick = () => {
          tries++;
          if (hasChartJs()){
            try { if (typeof __cvClearRuntimeAlert === 'function') __cvClearRuntimeAlert('missing_chartjs'); } catch (_) {}
            try { window.CodiviumInsights.refresh(); } catch (_) {}
            return;
          }
          if (tries < maxTries) setTimeout(tick, 200);
          else {
            try { if (typeof __cvAddRuntimeAlert === 'function') __cvAddRuntimeAlert('missing_chartjs', 'Chart.js has not loaded yet. Charts may remain blank until it is available.', 'warn'); } catch (_) {}
          }
        };
        setTimeout(tick, 200);
      }
    } catch (_) {}

    // Render once the mount has real pixel dimensions.
    // __cvRenderWhenSized: one rAF to commit grid styles, then either renders
    // immediately (mount already sized) or attaches a one-shot ResizeObserver
    // that fires renderAll() the first time real dimensions appear — no timeouts.
    if (typeof __cvRenderWhenSized === 'function') {
      __cvRenderWhenSized('init');
    } else {
      // Fallback if 06b hasn't loaded yet (should not happen in normal bundle order).
      requestAnimationFrame(function(){
        try { renderAll(); } catch (err) { console.error('Insights render error:', err); }
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => window.CodiviumInsights.init({}));
  else window.CodiviumInsights.init({});

})();

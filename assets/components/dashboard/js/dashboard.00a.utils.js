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

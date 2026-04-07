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



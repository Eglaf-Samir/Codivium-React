// Auto-extracted from dashboard.bundle.js — do not edit manually
export const INFO_CONTENT = {
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


    dashboard_overview: {
      title: 'Dashboard summary',
      sub:   'A synthesis across all panels.',
      body:
        'What it is\nA single summary that pulls together scores, heatmap, MCQ, time, ' +
        'and allocation into one view.\n\n' +
        'What it shows\n' +
        '• Where you stand across all practice dimensions\n' +
        '• Your top focus signals and consistency pattern\n' +
        '• Suggested next actions based on live data\n\n' +
        'How to use it\n' +
        'Open this tab first in Summary View to get the big picture, ' +
        'then drill into individual panel tabs for detail.',
    },

};

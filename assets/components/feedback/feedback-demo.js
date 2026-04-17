/* feedback-demo.js
 * Triggers the feedback modal automatically when feedback-demo.html loads.
 * Provides a fully-populated example payload covering all fields.
 *
 * This file demonstrates both use patterns:
 *   DEMO_RESULT_MINIMAL  — minimum viable (no history, no charts)
 *   DEMO_RESULT_FULL     — full payload (with history, deltas, all optional fields)
 *
 * To test either, change the CodiviumFeedback.show() call at the bottom.
 *
 * See contracts/IFeedbackBuilder.contract.md for field definitions.
 * See feedback.js header for the complete result shape documentation.
 */
(function () {

  /* ── Minimum viable payload ──────────────────────────────────── *
   * What the server MUST return for the modal to render.
   * insightText and chips are the two fields the server computes.
   */
  var DEMO_RESULT_MINIMAL = {
    exerciseId:    'ex_min_window_001',
    exerciseName:  'Minimum Window Substring',
    category:      'Strings',
    difficulty:    'advanced',
    testsPassed:   24,
    testsTotal:    24,
    returnMenuUrl: 'menu-page.html?track=micro',
    current: {
      timeToSuccessSeconds:   768,   /* client: elapsedSecs() */
      attempts:               2,     /* client: _attemptCount */
      bestPreSuccessPercent:  92,    /* server: IFeedbackBuilder */
      timeToFirstAttemptSecs: 125,   /* server: IFeedbackBuilder */
      avgIterationSeconds:    314    /* server: IFeedbackBuilder */
    },
    /* Server-computed by IFeedbackBuilder — see IFeedbackBuilder.contract.md */
    insightText:     'Two submissions to acceptance. Your first attempt already reached 92% of tests — one focused iteration closed the gap. Solve time (12:48) is comfortably within the expected range.',
    chips:           ['A2 convergence', 'Best pre-pass: 92%'],
    nextSuggestion:  'Continue: next Advanced Strings exercise.',
    performanceTier: 'good'
  };

  /* ── Full payload ────────────────────────────────────────────── *
   * All optional fields populated. History enables trend charts.
   * Deltas enable improvement indicators on primary metrics.
   */
  var DEMO_RESULT_FULL = {
    exerciseId:    'ex_min_window_001',
    exerciseName:  'Minimum Window Substring',
    category:      'Strings',
    difficulty:    'advanced',
    testsPassed:   24,
    testsTotal:    24,
    isFirstSolve:  false,
    returnMenuUrl: 'menu-page.html?track=micro',
    current: {
      timeToSuccessSeconds:   768,
      attempts:               2,
      bestPreSuccessPercent:  92,
      timeToFirstAttemptSecs: 125,
      avgIterationSeconds:    314
    },
    /* Server-computed */
    insightText:      'Two submissions to acceptance. Your first attempt already reached 92% of tests — one focused iteration closed the gap. Time to acceptance (12:48) was well inside the reference window for Advanced — strong signal of a solid mental model for this category. 11% faster than your previous attempt — growing familiarity with this problem structure is paying off.',
    chips:            ['A2 convergence', 'Fast solve', 'Personal best time'],
    nextSuggestion:   'Strong run — try an Advanced Strings challenge.',
    nextExerciseId:   'ex_group_anagrams_001',
    nextExerciseName: 'Group Anagrams',
    performanceTier:  'optimal',
    /* History — oldest first, up to 8 entries shown in charts */
    history: [
      { timeToSuccessSeconds: 1020, attempts: 4 },
      { timeToSuccessSeconds: 880,  attempts: 3 },
      { timeToSuccessSeconds: 960,  attempts: 3 },
      { timeToSuccessSeconds: 790,  attempts: 2 },
      { timeToSuccessSeconds: 840,  attempts: 5 },
      { timeToSuccessSeconds: 910,  attempts: 2 },
      { timeToSuccessSeconds: 860,  attempts: 3 },
      { timeToSuccessSeconds: 768,  attempts: 2 }
    ],
    /* Deltas: negative = improvement; null = first solve or not available */
    deltas: {
      timeToSuccess: -11,   /* 11% faster than last time */
      attempts:      -33    /* 33% fewer attempts */
    }
  };

  /* ── Trigger ──────────────────────────────────────────────────── */
  /* Change DEMO_RESULT_FULL to DEMO_RESULT_MINIMAL to test the minimal path. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      CodiviumFeedback.show(DEMO_RESULT_FULL);
    });
  } else {
    CodiviumFeedback.show(DEMO_RESULT_FULL);
  }

})();

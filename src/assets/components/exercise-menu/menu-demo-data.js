/* menu-demo-data.js
 * ============================================================
 * OWNER:   Demo payload for exercise menu page (local dev / package demo)
 * OWNS:    window.__CODIVIUM_MENU_DATA__ — demo exercise list
 * STATUS:  DEMO — loaded only when no real API is available
 *          Do NOT load in production alongside a real API.
 *
 * USAGE:
 *   Add this script to menu-page.html before menu-data.js:
 *     <script src="assets/components/exercise-menu/menu-demo-data.js"></script>
 *   OR set window.__CODIVIUM_DEMO__ = true in a server-rendered block.
 *
 * DATA CONTRACT: matches GET /api/menu/payload?track=micro response shape.
 * See contracts/exercise-menu-api.contract.md
 * ============================================================ */

(function () {
  'use strict';

  /* Only inject demo data if no real payload is present and demo mode is on,
     OR if the page is running without a server (file:// or no API available). */
  if (window.__CODIVIUM_MENU_DATA__) return; /* real SSR payload already present */

  /* Note: __CODIVIUM_DEMO__ is intentionally NOT set here.
     menu-demo-data.js is menu-page scoped only.
     The editor page has its own separate demo mechanism. */
  // Only set if not already set by a richer demo data script (e.g. demo_menu_data_micro.js)
  if (!window.__CODIVIUM_MENU_DATA__) {
  window.__CODIVIUM_MENU_DATA__ = {
    track:       'micro',
    trackLabel:  'Micro Challenge Menu',
    categories:  ['Arrays', 'Strings', 'Stacks'],
    difficultyLevels: ['beginner', 'intermediate', 'advanced'],
    exercises: [
      {
        id:               'ex_pattern_match_001',
        name:             'Pattern Matching',
        shortDescription: 'Build a matcher that detects a pattern inside a string.',
        category:         'Strings',
        difficulty:       'advanced',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_max_subarray_001',
        name:             'Maximum Subarray Sum',
        shortDescription: 'Return the sum of contiguous elements that yields the maximum value.',
        category:         'Arrays',
        difficulty:       'intermediate',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_first_non_repeat_001',
        name:             'First Non-Repeating Character',
        shortDescription: 'Find the first character that appears exactly once in a string.',
        category:         'Strings',
        difficulty:       'intermediate',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_longest_palindrome_001',
        name:             'Longest Palindromic Substring',
        shortDescription: 'Find the longest substring that reads the same forwards and backwards.',
        category:         'Strings',
        difficulty:       'advanced',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_min_window_001',
        name:             'Minimum Window Substring',
        shortDescription: 'Find the smallest substring that contains all required characters.',
        category:         'Strings',
        difficulty:       'advanced',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_count_occurrences_001',
        name:             'Count Occurrences',
        shortDescription: 'Count how many times a substring occurs, including overlapping matches.',
        category:         'Strings',
        difficulty:       'advanced',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_valid_parens_001',
        name:             'Valid Parentheses String',
        shortDescription: 'Determine whether a parentheses string is valid.',
        category:         'Stacks',
        difficulty:       'intermediate',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_palindrome_001',
        name:             'Palindrome Check',
        shortDescription: 'Check whether a string or number is a palindrome.',
        category:         'Strings',
        difficulty:       'intermediate',
        completionStatus: 'attempted',
        completedAt:      null
      },
      {
        id:               'ex_find_duplicates_001',
        name:             'Find Duplicates in Array',
        shortDescription: 'Identify all duplicate integers in the array in linear time.',
        category:         'Arrays',
        difficulty:       'intermediate',
        completionStatus: 'completed',
        completedAt:      '2026-03-10'
      },
      {
        id:               'ex_median_sorted_001',
        name:             'Median of Two Sorted Arrays',
        shortDescription: 'Compute the median of two sorted arrays efficiently.',
        category:         'Arrays',
        difficulty:       'advanced',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_one_step_away_001',
        name:             'One Step Away',
        shortDescription: 'Decide if two strings are one edit (insert, delete, or replace) apart.',
        category:         'Strings',
        difficulty:       'intermediate',
        completionStatus: 'not_started',
        completedAt:      null
      },
      {
        id:               'ex_reverse_words_001',
        name:             'Reverse Word Order',
        shortDescription: 'Reverse the order of words in a sentence without reversing the words.',
        category:         'Strings',
        difficulty:       'intermediate',
        completionStatus: 'not_started',
        completedAt:      null
      }
    ]
  }; // end __CODIVIUM_MENU_DATA__
  } // end if (!window.__CODIVIUM_MENU_DATA__)

})();

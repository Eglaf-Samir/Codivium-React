// hooks/useMenuData.js
// Fetches the exercise menu payload for the current track.
// Priority: server-injected window.__CODIVIUM_MENU_DATA__
//           → demo mode
//           → GET /api/menu/payload?track=
//
// Extended payload shape (v1.1 — includes exerciseTypes + mentalModels for micro):
// {
//   track, trackLabel,
//   categories:      string[],
//   difficultyLevels: string[],
//   exerciseTypes:   string[]  | undefined  (micro track only)
//   mentalModels:    string[]  | undefined  (micro track only)
//   exercises: [{
//     id, name, shortDescription, category, difficulty,
//     completionStatus: "completed"|"attempted"|"not_started",
//     completedAt: string|null,
//     exerciseType:  string | null       (micro only)
//     mentalModels:  string[]            (micro only, may be empty)
//   }]
// }
import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken } from '../../shared/fetch.js';

const DEMO_DATA = {
  track:      'micro',
  trackLabel: 'Micro Challenge Menu',
  categories: ['Arrays', 'Strings', 'Stacks', 'Trees', 'Dynamic Programming'],
  difficultyLevels: ['beginner', 'intermediate', 'advanced'],
  // ── New fields for micro track ──────────────────────────────────────────
  exerciseTypes: ['Implementation', 'Analytical', 'Debugging', 'Design'],
  mentalModels:  ['Sliding Window', 'Two Pointers', 'Hash Map', 'Binary Search',
                  'Recursion', 'Depth-First Search', 'Greedy'],
  exercises: [
    {
      id: 'ex_pattern_match_001', name: 'Pattern Matching',
      shortDescription: 'Build a matcher that detects a pattern inside a string.',
      category: 'Strings', difficulty: 'advanced',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Implementation', mentalModels: ['Sliding Window', 'Two Pointers'],
    },
    {
      id: 'ex_max_subarray_001', name: 'Maximum Subarray Sum',
      shortDescription: 'Return the sum of contiguous elements that yields the maximum value.',
      category: 'Arrays', difficulty: 'intermediate',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Analytical', mentalModels: ['Sliding Window', 'Greedy'],
    },
    {
      id: 'ex_first_non_repeat_001', name: 'First Non-Repeating Character',
      shortDescription: 'Find the first character that appears exactly once in a string.',
      category: 'Strings', difficulty: 'intermediate',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Implementation', mentalModels: ['Hash Map'],
    },
    {
      id: 'ex_longest_palindrome_001', name: 'Longest Palindromic Substring',
      shortDescription: 'Find the longest substring that reads the same forwards and backwards.',
      category: 'Strings', difficulty: 'advanced',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Analytical', mentalModels: ['Two Pointers', 'Sliding Window'],
    },
    {
      id: 'ex_min_window_001', name: 'Minimum Window Substring',
      shortDescription: 'Find the smallest substring that contains all required characters.',
      category: 'Strings', difficulty: 'advanced',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Implementation', mentalModels: ['Sliding Window', 'Hash Map'],
    },
    {
      id: 'ex_valid_parens_001', name: 'Valid Parentheses String',
      shortDescription: 'Determine whether a parentheses string is valid.',
      category: 'Stacks', difficulty: 'intermediate',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Analytical', mentalModels: ['Recursion'],
    },
    {
      id: 'ex_palindrome_001', name: 'Palindrome Check',
      shortDescription: 'Check whether a string or number is a palindrome.',
      category: 'Strings', difficulty: 'intermediate',
      completionStatus: 'attempted', completedAt: null,
      exerciseType: 'Implementation', mentalModels: ['Two Pointers'],
    },
    {
      id: 'ex_find_duplicates_001', name: 'Find Duplicates in Array',
      shortDescription: 'Identify all duplicate integers in the array in linear time.',
      category: 'Arrays', difficulty: 'intermediate',
      completionStatus: 'completed', completedAt: '2026-03-10',
      exerciseType: 'Implementation', mentalModels: ['Hash Map'],
    },
    {
      id: 'ex_binary_search_001', name: 'Binary Search',
      shortDescription: 'Implement binary search on a sorted array.',
      category: 'Arrays', difficulty: 'beginner',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Implementation', mentalModels: ['Binary Search'],
    },
    {
      id: 'ex_tree_traverse_001', name: 'Inorder Tree Traversal',
      shortDescription: 'Return the inorder traversal of a binary tree without recursion.',
      category: 'Trees', difficulty: 'intermediate',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Debugging', mentalModels: ['Depth-First Search', 'Recursion'],
    },
    {
      id: 'ex_lru_cache_001', name: 'LRU Cache',
      shortDescription: 'Design and implement an LRU cache with O(1) get and put.',
      category: 'Dynamic Programming', difficulty: 'advanced',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Design', mentalModels: ['Hash Map'],
    },
    {
      id: 'ex_reverse_words_001', name: 'Reverse Word Order',
      shortDescription: 'Reverse the order of words in a sentence without reversing the words.',
      category: 'Strings', difficulty: 'intermediate',
      completionStatus: 'not_started', completedAt: null,
      exerciseType: 'Implementation', mentalModels: ['Two Pointers'],
    },
  ],
};

export function useMenuData() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const abortRef     = useRef(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    cancelledRef.current = false;

    setLoading(true);
    setError(null);

    // Priority 1: server-injected payload
    if (window.__CODIVIUM_MENU_DATA__) {
      if (!cancelledRef.current) { setData(window.__CODIVIUM_MENU_DATA__); setLoading(false); }
      return;
    }

    // Priority 2: demo mode flag
    if (window.__CODIVIUM_DEMO__) {
      if (!cancelledRef.current) { setData(DEMO_DATA); setLoading(false); }
      return;
    }

    // Priority 3: API fetch
    const params = new URLSearchParams(window.location.search);
    const track  = (params.get('track') || 'micro').toLowerCase();

    const token = getToken();

    if (!token) {
      if (!cancelledRef.current) { setData(DEMO_DATA); setLoading(false); }
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 8000);

    try {
      const res = await fetch(`/api/menu/payload?track=${encodeURIComponent(track)}`, {
        headers:     { Accept: 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'same-origin',
        signal:      ctrl.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (!cancelledRef.current) setData(payload);
    } catch (err) {
      clearTimeout(timeout);
      if (!cancelledRef.current) {
        if (window.__CODIVIUM_MENU_DATA__) {
          setData(window.__CODIVIUM_MENU_DATA__);
        } else {
          setError(
            err.name === 'AbortError'
              ? 'Request timed out — please check your connection and try again.'
              : (err.message || 'Unknown error')
          );
        }
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      cancelledRef.current = true;
      abortRef.current?.abort();
    };
  }, [load]);

  // Expose demo data for convenience
  return { data, loading, error, reload: load, DEMO_DATA };
}

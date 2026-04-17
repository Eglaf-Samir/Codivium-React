// hooks/useExercise.js
// Fetches exercise data from the API (or uses demo/embedded data).
// Returns the exercise payload and loading/error state.
import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import { getToken } from '../../shared/fetch.js';

// Configure marked for safe rendering
marked.setOptions({ gfm: true, breaks: true });

function sanitizeHtml(html) {
  // Strip dangerous tags and attribute vectors from server-rendered markdown.
  // Exercise content comes from our own DB so risk is low, but we sanitize defensively.
  return html
    // Remove executable tags entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*\/?>/gi, '')
    .replace(/<base[^>]*\/?>/gi, '')
    // Remove all on* event handlers (quoted, unquoted, or empty)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Remove javascript: and data: URIs in href/src/action
    .replace(/(href|src|action)\s*=\s*(?:"[^"]*"|'[^']*')/gi, (m) =>
      /javascript:|data:/i.test(m) ? '' : m
    );
}

export function renderMd(text) {
  if (!text) return '';
  try {
    return sanitizeHtml(marked.parse(String(text)));
  } catch (_) {
    return `<pre>${String(text).replace(/</g, '&lt;')}</pre>`;
  }
}

const DEMO_EXERCISE = {
  id: 'demo_001',
  name: 'Minimum Window Substring',
  category: 'Strings',
  difficulty: 'advanced',
  testsTotal: 24,
  problemStatement:
    'Given strings `s` and `t`, find the minimum window in `s` that contains all characters of `t`.\n\n' +
    '**Example:**\n```\nInput: s = "ADOBECODEBANC", t = "ABC"\nOutput: "BANC"\n```',
  hints:
    '**Hint 1:** Consider using a sliding window approach.\n\n' +
    '**Hint 2:** A hash map tracking character frequencies will help.\n\n' +
    '**Hint 3:** Track how many required characters are currently satisfied.',
  miniTutorial:
    '## Sliding Window Pattern\n' +
    'Use two pointers `l` and `r`. Expand right until the window contains all required characters, ' +
    'then contract left to find the minimum window. Time complexity: O(|s| + |t|).',
  unitTestsSource:
    'def test_example():\n    assert minWindow("ADOBECODEBANC", "ABC") == "BANC"\n\n' +
    'def test_single_char():\n    assert minWindow("a", "a") == "a"\n\n' +
    'def test_no_window():\n    assert minWindow("a", "aa") == ""\n\n' +
    'def test_empty():\n    assert minWindow("", "A") == ""\n',
  codeScaffold:
    'def minWindow(s: str, t: str) -> str:\n    # Your solution here\n    pass\n',
  suggestedSolution:
    'def minWindow(s, t):\n    from collections import Counter\n    need = Counter(t)\n    missing = len(t)\n    best = ""\n    l = 0\n    for r, c in enumerate(s):\n        if need[c] > 0:\n            missing -= 1\n        need[c] -= 1\n        while missing == 0:\n            w = s[l:r+1]\n            if not best or len(w) < len(best):\n                best = w\n            need[s[l]] += 1\n            if need[s[l]] > 0:\n                missing += 1\n            l += 1\n    return best\n',
  priorAttempts: 0,
};

export function useExercise() {
  const [exercise, setExercise]   = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);

  // abortRef holds the AbortController for any in-flight fetch so we can
  // cancel it on unmount or re-load without calling setState on an unmounted component.
  const abortRef    = useRef(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    // Cancel any previous in-flight request
    abortRef.current?.abort();
    cancelledRef.current = false;

    setLoading(true);
    setError(null);

    // Priority 1: server-injected data
    if (window.__CODIVIUM_EXERCISE_DATA__) {
      if (!cancelledRef.current) { setExercise(window.__CODIVIUM_EXERCISE_DATA__); setLoading(false); }
      return;
    }

    // Priority 2: demo mode
    if (window.__CODIVIUM_DEMO__) {
      if (!cancelledRef.current) { setExercise(DEMO_EXERCISE); setLoading(false); }
      return;
    }

    // Priority 3: fetch from ?id= param
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      if (!cancelledRef.current) { setExercise(DEMO_EXERCISE); setLoading(false); }
      return;
    }

    const token = getToken();
    if (!token) {
      if (!cancelledRef.current) { setExercise(DEMO_EXERCISE); setLoading(false); }
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 10000);

    try {
      const res = await fetch(`/api/exercise?id=${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'same-origin',
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!cancelledRef.current) setExercise(data);
    } catch (err) {
      clearTimeout(timeout);
      if (!cancelledRef.current)
        setError(err.name === 'AbortError' ? 'Request timed out — please retry.' : err.message);
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

  return { exercise, loading, error, reload: load };
}

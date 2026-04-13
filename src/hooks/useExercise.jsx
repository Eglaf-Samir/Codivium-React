// hooks/useExercise.js
// Fetches exercise data from the API (or uses demo/embedded data).
// Returns the exercise payload and loading/error state.
import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({ gfm: true, breaks: true });

function sanitizeHtml(html) {
  // Basic sanitisation — strip script/iframe/on* handlers
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Priority 1: server-injected data
    if (window.__CODIVIUM_EXERCISE_DATA__) {
      setExercise(window.__CODIVIUM_EXERCISE_DATA__);
      setLoading(false);
      return;
    }

    // Priority 2: demo mode
    if (window.__CODIVIUM_DEMO__) {
      setExercise(DEMO_EXERCISE);
      setLoading(false);
      return;
    }

    // Priority 3: fetch from ?id= param
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      setExercise(DEMO_EXERCISE); // fallback to demo if no id
      setLoading(false);
      return;
    }

    const token =
      sessionStorage.getItem('cv_auth_token') ||
      localStorage.getItem('cv_auth_token');
    if (!token) {
      setExercise(DEMO_EXERCISE);
      setLoading(false);
      return;
    }

    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`/api/exercise?id=${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'same-origin',
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setExercise(data);
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Request timed out — please retry.' : err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { exercise, loading, error, reload: load };
}

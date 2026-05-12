// hooks/useCategories.js
import { useState, useEffect } from 'react';
import { getToken, apiUrl} from '../../mcq-shared/fetch.js';

// Demo categories used when API is unavailable
const DEMO_CATEGORIES = [
  'Language Basics', 'Data Types & Data Structures', 'Functions',
  'Object Orientation', 'Regular Expressions', 'Builtins',
  'Performance', 'Sorting', 'Algorithms', 'Trees',
];

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    // Use demo mock if provided
    if (window.__CODIVIUM_MCQ_CATEGORIES_MOCKED__ === true) {
      // fall through to fetch — mock will intercept
    }

    const token = getToken();

    const hasMock = window.__CODIVIUM_MCQ_CATEGORIES_MOCKED__ === true;

    if (!token && !hasMock) {
      setCategories(DEMO_CATEGORIES);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 5000);

    fetch(apiUrl('/api/mcq/categories'), {
      signal:  ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(data => {
        if (cancelled) return;
        clearTimeout(tid);
        const names = Array.isArray(data.categories)
          ? data.categories.map(c => c.displayName || c)
          : [];
        if (names.length > 0) {
          setCategories(names);
        } else {
          throw new Error('No categories returned');
        }
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        clearTimeout(tid);
        if (err.name === 'AbortError') {
          setError('Request timed out — using demo categories.');
        } else {
          setError('Could not load categories — using demo set.');
        }
        setCategories(DEMO_CATEGORIES);
        setLoading(false);
      });

    return () => { cancelled = true; clearTimeout(tid); ctrl.abort(); };
  }, []);

  return { categories, loading, error };
}

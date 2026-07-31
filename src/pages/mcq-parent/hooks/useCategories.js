// hooks/useCategories.js
//
// Two hooks that drive the MCQ setup page from the same paramMaster table the
// admin/CMS uses. Together they replace the old `/api/mcq/categories` call
// (which was never implemented on the backend) and let the setup page work
// with the real Guid IDs that GetAllbyfilterAsync expects on submit.
//
// useDifficultyLevels()
//   → { difficulties: [{id, name}], loading, error }
//   GET /api/v1/paramMaster/GetAllCategory?keyvalue=DifficultyLevel
//
// useCategoriesForDifficulty(difficultyId)
//   → { categories: [{id, name}], categoryNames, loading, error }
//   GET /api/v1/paramMaster/GetAllCategoryParentID?ParentID={difficultyId}&mode=MCQ
//   `categoryNames` is the flat string[] still expected by SimplePills /
//   PowerPalette — id→name mapping stays on the page level for submit.

import { useEffect, useState } from 'react';
import { GetallDifficultyLevel, GetallCategory, GetMcqCategoryIdsWithQuestions } from '../../../api/mcq/apimcq';
import { ParamMasterKey } from '../../../config';

// Cosmetic display order so the radio bar always reads Basic → Intermediate →
// Advanced regardless of how paramMaster sorts them.
function sortDifficulties(list) {
  const order = { basic: 0, intermediate: 1, advanced: 2, advance: 2 };
  return [...list].sort((a, b) => {
    const ka = order[(a.name || '').toLowerCase()] ?? 99;
    const kb = order[(b.name || '').toLowerCase()] ?? 99;
    return ka - kb;
  });
}

export function useDifficultyLevels() {
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    GetallDifficultyLevel(ParamMasterKey.DifficultyLevel)
      .then(res => {
        if (cancelled) return;
        if (res?.status === 200 && Array.isArray(res?.data)) {
          setDifficulties(sortDifficulties(res.data.map(d => ({ id: d.id, name: d.name }))));
        } else {
          setDifficulties([]);
          setError('Could not load difficulty levels.');
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDifficulties([]);
        setError('Could not load difficulty levels.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { difficulties, loading, error };
}

export function useCategoriesForDifficulty(difficultyId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!difficultyId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Load the categories for this difficulty AND the set of category IDs that
    // actually have questions, then show only the non-empty ones — same UX as
    // the Interview module, so a user can never pick a category with 0
    // questions (which previously fell back to demo and broke skip-correct).
    Promise.all([
      GetallCategory(difficultyId, 'MCQ'),
      GetMcqCategoryIdsWithQuestions(difficultyId),
    ])
      .then(([catRes, cntRes]) => {
        if (cancelled) return;
        if (catRes?.status === 200 && Array.isArray(catRes?.data)) {
          let cats = catRes.data.map(c => ({ id: c.id, name: c.name }));
          // Only filter when the counts call succeeded; on any hiccup show all
          // categories rather than leaving the page empty.
          if (cntRes?.status === 200 && Array.isArray(cntRes?.data)) {
            const withQuestions = new Set(cntRes.data.map(Number));
            cats = cats.filter(c => withQuestions.has(Number(c.id)));
          }
          setCategories(cats);
        } else {
          setCategories([]);
          setError('Could not load categories.');
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
        setError('Could not load categories.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [difficultyId]);

  return {
    categories,
    categoryNames: categories.map(c => c.name),
    loading,
    error,
  };
}

// Back-compat: McqParentPage previously imported `useCategories`. Keep the
// name exported so any in-flight bundles still resolve, but new code should
// use the two named hooks above.
export function useCategories() {
  // No-arg variant kept only to avoid hard breakage if anything else imports
  // it during the migration. Returns empty state.
  return { categories: [], loading: false, error: null };
}

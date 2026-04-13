// hooks/useMenuFilters.js
// Manages all filter and sort state for the exercise grid.
// Returns the filtered + sorted exercise list as a derived value (useMemo).
// Persists filter state to localStorage.
import { useState, useMemo, useCallback } from 'react';

const PREF_KEY = 'cv_menu_filters_v2';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) {}
}

function norm(s) {
  return String(s || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

// Toggle a value in a multiselect filter.
// Returns the new selection array.
// Maintains the 'all' exclusive logic: selecting 'all' clears others, selecting all
// individual options collapses back to 'all'.
export function toggleFilter(current, value, allOptions) {
  if (value === 'all') return ['all'];

  let next = current.filter(v => v !== 'all');
  if (next.includes(value)) {
    next = next.filter(v => v !== value);
  } else {
    next = [...next, value];
  }
  if (next.length === 0) return ['all'];
  // If every individual option is selected, collapse to 'all'
  if (allOptions && allOptions.length > 0 && next.length >= allOptions.length) return ['all'];
  return next;
}

function passesFilter(selected, value) {
  if (!selected || selected.includes('all') || selected.length === 0) return true;
  return selected.includes(norm(value));
}

function passesArrayFilter(selected, values) {
  if (!selected || selected.includes('all') || selected.length === 0) return true;
  if (!values || values.length === 0) return false;
  return values.some(v => selected.includes(norm(v)));
}

const SORT_LEVEL_ORDER = { basic: 0, beginner: 0, intermediate: 1, advanced: 2 };
const SORT_STATUS_ORDER = { 'not started': 0, 'attempted': 1, 'completed': 2 };

export function useMenuFilters(exercises) {
  const saved = loadPrefs();

  const [selectedCategories,    setSelectedCategories]    = useState(() => saved.categories    || ['all']);
  const [selectedLevels,        setSelectedLevels]        = useState(() => saved.levels        || ['all']);
  const [selectedCompleteness,  setSelectedCompleteness]  = useState(() => saved.completeness  || ['all']);
  const [selectedExerciseTypes, setSelectedExerciseTypes] = useState(() => saved.exerciseTypes || ['all']);
  const [selectedMentalModels,  setSelectedMentalModels]  = useState(() => saved.mentalModels  || ['all']);
  const [sortField,             setSortField]             = useState(() => saved.sortField     || 'title');
  const [sortDir,               setSortDir]               = useState(() => saved.sortDir       || 'asc');
  const [searchTerm,            setSearchTerm]            = useState('');

  const toggleCategories = useCallback((value, allOptions) => {
    setSelectedCategories(prev => {
      const next = toggleFilter(prev, value, allOptions);
      savePrefs({ categories: next, levels: selectedLevels, completeness: selectedCompleteness,
        exerciseTypes: selectedExerciseTypes, mentalModels: selectedMentalModels, sortField, sortDir });
      return next;
    });
  }, [selectedLevels, selectedCompleteness, selectedExerciseTypes, selectedMentalModels, sortField, sortDir]);

  const toggleLevels = useCallback((value, allOptions) => {
    setSelectedLevels(prev => {
      const next = toggleFilter(prev, value, allOptions);
      savePrefs({ categories: selectedCategories, levels: next, completeness: selectedCompleteness,
        exerciseTypes: selectedExerciseTypes, mentalModels: selectedMentalModels, sortField, sortDir });
      return next;
    });
  }, [selectedCategories, selectedCompleteness, selectedExerciseTypes, selectedMentalModels, sortField, sortDir]);

  const toggleCompleteness = useCallback((value, allOptions) => {
    setSelectedCompleteness(prev => {
      const next = toggleFilter(prev, value, allOptions);
      savePrefs({ categories: selectedCategories, levels: selectedLevels, completeness: next,
        exerciseTypes: selectedExerciseTypes, mentalModels: selectedMentalModels, sortField, sortDir });
      return next;
    });
  }, [selectedCategories, selectedLevels, selectedExerciseTypes, selectedMentalModels, sortField, sortDir]);

  const toggleExerciseTypes = useCallback((value, allOptions) => {
    setSelectedExerciseTypes(prev => {
      const next = toggleFilter(prev, value, allOptions);
      savePrefs({ categories: selectedCategories, levels: selectedLevels, completeness: selectedCompleteness,
        exerciseTypes: next, mentalModels: selectedMentalModels, sortField, sortDir });
      return next;
    });
  }, [selectedCategories, selectedLevels, selectedCompleteness, selectedMentalModels, sortField, sortDir]);

  const toggleMentalModels = useCallback((value, allOptions) => {
    setSelectedMentalModels(prev => {
      const next = toggleFilter(prev, value, allOptions);
      savePrefs({ categories: selectedCategories, levels: selectedLevels, completeness: selectedCompleteness,
        exerciseTypes: selectedExerciseTypes, mentalModels: next, sortField, sortDir });
      return next;
    });
  }, [selectedCategories, selectedLevels, selectedCompleteness, selectedExerciseTypes, sortField, sortDir]);

  const updateSortField = useCallback((v) => {
    setSortField(v);
    savePrefs({ categories: selectedCategories, levels: selectedLevels, completeness: selectedCompleteness,
      exerciseTypes: selectedExerciseTypes, mentalModels: selectedMentalModels, sortField: v, sortDir });
  }, [selectedCategories, selectedLevels, selectedCompleteness, selectedExerciseTypes, selectedMentalModels, sortDir]);

  const updateSortDir = useCallback((v) => {
    setSortDir(v);
    savePrefs({ categories: selectedCategories, levels: selectedLevels, completeness: selectedCompleteness,
      exerciseTypes: selectedExerciseTypes, mentalModels: selectedMentalModels, sortField, sortDir: v });
  }, [selectedCategories, selectedLevels, selectedCompleteness, selectedExerciseTypes, selectedMentalModels, sortField]);

  const resetFilters = useCallback(() => {
    setSelectedCategories(['all']);
    setSelectedLevels(['all']);
    setSelectedCompleteness(['all']);
    setSelectedExerciseTypes(['all']);
    setSelectedMentalModels(['all']);
    setSortField('title');
    setSortDir('asc');
    savePrefs({});
  }, []);

  // Derived: filtered + sorted exercise list
  const filteredExercises = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];

    const search = norm(searchTerm);

    let result = exercises.filter(ex => {
      const statusKey = (ex.completionStatus || 'not_started').replace(/-/g, '_');
      const statusNorm = norm(statusKey.replace(/_/g, ' '));

      if (!passesFilter(selectedCategories, ex.category)) return false;
      if (!passesFilter(selectedLevels, ex.difficulty)) return false;

      // Completeness: normalise both sides the same way
      if (!(selectedCompleteness.includes('all') || selectedCompleteness.length === 0)) {
        const normStatus = norm(statusKey.replace(/_/g, ' '));
        // selected values stored as e.g. 'not started', 'completed', 'attempted'
        if (!selectedCompleteness.some(s => normStatus.includes(s.replace(/-/g, ' ')))) return false;
      }

      if (!passesFilter(selectedExerciseTypes, ex.exerciseType || '')) return false;
      if (!passesArrayFilter(selectedMentalModels, ex.mentalModels || [])) return false;

      if (search) {
        const nameNorm = norm(ex.name);
        const descNorm = norm(ex.shortDescription || '');
        if (!nameNorm.includes(search) && !descNorm.includes(search)) return false;
      }

      return true;
    });

    // Sort
    const mult = sortDir === 'desc' ? -1 : 1;
    result = [...result].sort((a, b) => {
      let av, bv;
      if (sortField === 'category') {
        av = norm(a.category); bv = norm(b.category);
      } else if (sortField === 'level') {
        av = SORT_LEVEL_ORDER[norm(a.difficulty)] ?? 999;
        bv = SORT_LEVEL_ORDER[norm(b.difficulty)] ?? 999;
      } else if (sortField === 'completeness') {
        av = SORT_STATUS_ORDER[norm((a.completionStatus || '').replace(/_/g, ' '))] ?? 999;
        bv = SORT_STATUS_ORDER[norm((b.completionStatus || '').replace(/_/g, ' '))] ?? 999;
      } else {
        av = norm(a.name); bv = norm(b.name);
      }
      if (av < bv) return -1 * mult;
      if (av > bv) return  1 * mult;
      // stable tie-break on name
      const na = norm(a.name), nb = norm(b.name);
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

    return result;
  }, [
    exercises, selectedCategories, selectedLevels, selectedCompleteness,
    selectedExerciseTypes, selectedMentalModels, searchTerm, sortField, sortDir,
  ]);

  return {
    // State
    selectedCategories, selectedLevels, selectedCompleteness,
    selectedExerciseTypes, selectedMentalModels,
    sortField, sortDir, searchTerm,
    // Setters
    toggleCategories, toggleLevels, toggleCompleteness,
    toggleExerciseTypes, toggleMentalModels,
    updateSortField, updateSortDir,
    setSearchTerm,
    resetFilters,
    // Derived
    filteredExercises,
  };
}

// hooks/useLocks.js
// Attempt-first lock system.
// Hints, tutorial, solution, and unit tests unlock based on time elapsed
// and submission count — whichever threshold is crossed first.
// Lock config is read from localStorage (set by the settings palette).
import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'cv_lock_cfg';

const DEFAULT_CFG = {
  hints:    { minutes: 2,    attempts: 2 },
  tutorial: { minutes: 4,    attempts: 3 },
  solution: { minutes: 7,    attempts: 5 },
  tests:    { minutes: 9999, attempts: 1 },   // unlocks after first submission
};

const WHY = {
  hints:    'Hints are locked initially to encourage genuine problem-solving. Reaching for hints too early reduces the cognitive effort that builds long-term memory.',
  tutorial: 'The mini tutorial is locked briefly so you attempt the problem first. Working through it yourself — even imperfectly — makes the tutorial far more effective.',
  solution: 'Seeing the suggested solution before you have made a real attempt teaches pattern-matching, not problem-solving. A short lock ensures you build the skill, not just the answer.',
  tests:    'Unit tests are locked until after your first submission so you encounter the real test runner output rather than inspecting the tests in advance.',
};

function loadCfg() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CFG, ...JSON.parse(raw) } : { ...DEFAULT_CFG };
  } catch (_) {
    return { ...DEFAULT_CFG };
  }
}

function saveCfg(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (_) {}
}

export function useLocks(elapsedSeconds) {
  const [cfg, setCfg]                   = useState(loadCfg);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [forceUnlocked, setForceUnlocked]     = useState({});

  // Derived lock states
  const isLocked = (key) => {
    if (forceUnlocked[key]) return false;
    const c = cfg[key];
    if (!c) return false;
    const timePassed   = elapsedSeconds >= c.minutes * 60;
    const attemptsPassed = submissionCount >= c.attempts;
    return !(timePassed || attemptsPassed);
  };

  const unlock = useCallback((key) => {
    setForceUnlocked(prev => ({ ...prev, [key]: true }));
  }, []);

  const onSubmission = useCallback(() => {
    setSubmissionCount(n => n + 1);
  }, []);

  const resetForExercise = useCallback(() => {
    setSubmissionCount(0);
    setForceUnlocked({});
  }, []);

  const updateCfg = useCallback((newCfg) => {
    setCfg(newCfg);
    saveCfg(newCfg);
  }, []);

  return {
    isLocked,
    unlock,
    onSubmission,
    resetForExercise,
    cfg,
    updateCfg,
    submissionCount,
    WHY,
  };
}

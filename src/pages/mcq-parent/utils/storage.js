// utils/storage.js — MCQ settings persistence
//
// The saved settings carry the canonical IDs the backend needs at quiz fetch
// time:
//   - difficultyLevelId   : Guid from paramMaster (DifficultyLevel)
//   - categoryIds         : Guid[] from paramMaster (Categories for that
//                           difficulty, mode=MCQ)
// We also keep `categoryNames` so the setup page can re-render the pill
// selection without a server round-trip on revisit. The free-text difficulty
// name (basic / intermediate / advanced) is kept for nostalgia but is not
// authoritative — backend filtering is by ID only.
//
// readUrlParams() supports adaptive-practice deep links of the form
//   /mcq?categoryIds=<csv-guids>&difficultyLevelId=<guid>&count=<n>&skipCorrect=true&source=adaptive
// Legacy `?categories=…&difficulty=…` strings are still parsed for backward
// compatibility — they fall into a separate bucket that the page resolves to
// IDs once the paramMaster data has loaded.

export const SETTINGS_KEY = 'cv.mcq.settings';

export function readSettings() {
  try { const r = localStorage.getItem(SETTINGS_KEY); return r ? JSON.parse(r) : null; }
  catch(_) { return null; }
}

export function writeSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(_) {}
}

export function defaultSettings() {
  return {
    difficultyLevelId: '',
    difficultyName: '',
    categoryIds: [],
    categoryNames: [],
    questionCount: 10,
    skipCorrect: false,
  };
}

export function readUrlParams() {
  try {
    const p = new URLSearchParams(window.location.search || '');
    const result = {};

    const catIds = p.get('categoryIds');
    if (catIds) result.categoryIds = catIds.split(',').map(s => s.trim()).filter(Boolean);
    // Legacy: categories=<csv-of-names> — resolved to IDs on the page once
    // paramMaster data is loaded.
    const cats = p.get('categories');
    if (cats) result.categoryNames = cats.split(',').map(c => decodeURIComponent(c.trim())).filter(Boolean);

    const diffId = p.get('difficultyLevelId');
    if (diffId) result.difficultyLevelId = diffId;
    const diff = p.get('difficulty');
    if (diff) result.difficultyName = diff;

    const cnt = p.get('count');
    if (cnt) result.questionCount = Math.max(1, Math.min(50, parseInt(cnt, 10) || 10));
    const skip = p.get('skipCorrect');
    if (skip) result.skipCorrect = skip === 'true';
    const src = p.get('source');
    if (src) result.source = src;

    return Object.keys(result).length > 0 ? result : null;
  } catch(_) { return null; }
}

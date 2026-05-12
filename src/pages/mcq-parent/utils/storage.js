// utils/storage.js — MCQ settings persistence
export const SETTINGS_KEY = 'cv.mcq.settings';

export function readSettings() {
  try { const r = localStorage.getItem(SETTINGS_KEY); return r ? JSON.parse(r) : null; }
  catch(_) { return null; }
}
export function writeSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(_) {}
}
export function defaultSettings() {
  return { categories: [], difficulty: 'basic', questionCount: 10, skipCorrect: false };
}

// utils/urlParams.js — ?categories=&difficulty=&count=&skipCorrect=&source=
export function readUrlParams() {
  try {
    const p = new URLSearchParams(window.location.search || '');
    const cats = p.get('categories');
    const diff = p.get('difficulty');
    const cnt  = p.get('count');
    const skip = p.get('skipCorrect');
    const src  = p.get('source');
    const result = {};
    if (cats) result.categories   = cats.split(',').map(c => decodeURIComponent(c.trim())).filter(Boolean);
    if (diff && ['basic','intermediate','advanced'].includes(diff)) result.difficulty = diff;
    if (cnt)  result.questionCount = Math.max(1, Math.min(50, parseInt(cnt, 10) || 10));
    if (skip) result.skipCorrect   = skip === 'true';
    if (src)  result.source        = src;
    return Object.keys(result).length > 0 ? result : null;
  } catch(_) { return null; }
}

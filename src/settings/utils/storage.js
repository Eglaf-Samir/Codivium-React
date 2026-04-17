// utils/storage.js — localStorage read/write helpers
export function lsGet(key, def = null) {
  try { const v = localStorage.getItem(key); return v !== null ? v : def; }
  catch (_) { return def; }
}
export function lsSet(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (_) {}
}
export function lsRemove(key) {
  try { localStorage.removeItem(key); } catch (_) {}
}

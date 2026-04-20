// Minimal API helper shared by insights module.
// Ported from the other project's src/shared/fetch.js — only the pieces used here.

function getApiBase() {
  try {
    if (typeof window !== 'undefined' && window.__CVD_CONFIG?.apiBase) {
      return String(window.__CVD_CONFIG.apiBase).replace(/\/+$/, '');
    }
  } catch (_) {}
  try {
    const fromEnv = import.meta.env?.VITE_API_BASE;
    if (fromEnv) return String(fromEnv).replace(/\/+$/, '');
  } catch (_) {}
  return '';
}

export function apiUrl(path) {
  return getApiBase() + path;
}

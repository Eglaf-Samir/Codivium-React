// src/shared/fetch.js
// Network helpers: API base resolution, auth headers, fetch wrappers.
// Single source of truth for API base URL and auth token access.
//
// Configuration (set by host site before bundles load):
//   window.__CVD_CONFIG.apiBase  — API origin + prefix, e.g. 'https://api.example.com'
//                                   or '/api/v2'. Defaults to '' (same origin, /api/...).
//   window.__CVD_CONFIG.tokenKey — localStorage/sessionStorage key for auth token.
//                                   Defaults to 'cv_auth_token'.

/** Resolve the configured API base (no trailing slash). */
export function getApiBase() {
  try {
    const base = window.__CVD_CONFIG?.apiBase;
    if (base && typeof base === 'string') return base.replace(/\/$/, '');
  } catch (_) {}
  return '';
}

/** Resolve the configured auth token storage key. */
function getTokenKey() {
  try {
    const key = window.__CVD_CONFIG?.tokenKey;
    if (key && typeof key === 'string') return key;
  } catch (_) {}
  return 'cv_auth_token';
}

/** Read the JWT auth token from sessionStorage then localStorage. */
export function getToken() {
  const key = getTokenKey();
  try {
    return (
      sessionStorage.getItem(key) ||
      localStorage.getItem(key) ||
      null
    );
  } catch (_) { return null; }
}

/** Build Authorization header object. Optionally merge extra headers. */
export function getAuthHeaders(extra) {
  const token   = getToken();
  const headers = Object.assign({}, extra || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

/** Resolve a path against the configured API base.
 *  apiUrl('/api/user/foo') → '' + '/api/user/foo'  (default)
 *  apiUrl('/api/user/foo') → 'https://api.x.com' + '/api/user/foo'  (configured)
 */
export function apiUrl(path) {
  return getApiBase() + path;
}

// ── Mock layer (dev only) ────────────────────────────────────────────────
// When window.__CVD_MOCK === true (or VITE_MOCK_API at build), cvFetch
// returns canned JSON for known /api/* paths instead of hitting the network.
// Wire your own backend by leaving mocks off and setting __CVD_CONFIG.apiBase.
const MOCKS = {
  'GET /api/user/adaptive-state': () => ({ streak: 0, skillLevels: {}, recommended: [] }),
  'GET /api/exercise':            (u) => ({
    id: new URL(u, 'http://x').searchParams.get('id') || 'demo',
    title: 'Demo Exercise',
    prompt: 'Mock exercise. Wire /api/exercise to your backend.',
    starterCode: '// write your solution\n', tests: [],
  }),
  'POST /api/exercise/submit':    () => ({ ok: true, passed: 0, total: 0, feedback: 'Mock.' }),
  'GET /api/sessions/start':      () => ({ sessionId: 'mock-' + Date.now() }),
  'GET /api/mcq/categories':      () => ({
    categories: [
      { id: 'arrays', name: 'Arrays', count: 12 },
      { id: 'trees',  name: 'Trees',  count: 8  },
    ],
  }),
  'GET /api/mcq/questions':       () => ({ questions: [] }),
  'GET /api/menu/payload':        () => ({ exercises: [], categories: [] }),
};

function mocksEnabled() {
  try {
    if (typeof window !== 'undefined' && window.__CVD_MOCK === true) return true;
    return Boolean(import.meta.env && import.meta.env.VITE_MOCK_API);
  } catch (_) { return false; }
}

function mockResponse(url, opts) {
  const method = String(opts?.method || 'GET').toUpperCase();
  const path   = String(url).split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  const key    = `${method} ${path}`;
  const handler = MOCKS[key];
  if (!handler) return null;
  return new Response(JSON.stringify(handler(url)), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

/** fetch() wrapper with AbortController timeout. */
export function cvFetch(url, opts, timeoutMs = 10000) {
  if (mocksEnabled()) {
    const m = mockResponse(url, opts);
    if (m) return new Promise(r => setTimeout(() => r(m), 50));
  }
  const controller = new AbortController();
  const timerId    = setTimeout(() => controller.abort(), timeoutMs);
  const fetchOpts  = Object.assign({}, opts || {}, { signal: controller.signal });
  return fetch(url, fetchOpts)
    .then(res  => { clearTimeout(timerId); return res; })
    .catch(err => { clearTimeout(timerId); throw err; });
}

/** cvFetch with one automatic retry on 429/503. Only for GET requests. */
export function cvFetchWithRetry(url, opts, timeoutMs, maxRetries = 1) {
  function attempt(remaining) {
    return cvFetch(url, opts, timeoutMs).then(res => {
      if ((res.status === 503 || res.status === 429) && remaining > 0) {
        return new Promise(r => setTimeout(r, 1500)).then(() => attempt(remaining - 1));
      }
      return res;
    }).catch(err => {
      if (remaining > 0 && err.name !== 'AbortError') {
        return new Promise(r => setTimeout(r, 1500)).then(() => attempt(remaining - 1));
      }
      throw err;
    });
  }
  return attempt(maxRetries);
}

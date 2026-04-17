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

/** fetch() wrapper with AbortController timeout. */
export function cvFetch(url, opts, timeoutMs = 10000) {
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

/**
 * bundle-loader.cjs
 * Loads insights-dashboard.bundle.js into a DOM shim environment using node:vm.
 * Used by dashboard.test.cjs to test payload processing.
 *
 * Updated for React architecture (v1.2.1):
 * The active bundle is assets/react-dist/insights-dashboard.bundle.js.
 * The old assets/components/dashboard/js/dashboard.bundle.js has been removed.
 */
'use strict';

const vm   = require('node:vm');
const fs   = require('node:fs');
const path = require('node:path');
const { buildEnv } = require('./dom-shim.cjs');

const BUNDLE_PATH = path.resolve(
  __dirname,
  '../assets/react-dist/insights-dashboard.bundle.js'
);

/**
 * Load a fresh bundle instance.
 * @param {object} [opts]
 * @param {object} [opts.payload]        - Set window.__CODIVIUM_DASHBOARD_DATA__ before load.
 * @param {string} [opts.localStorageUI] - Pre-seed localStorage 'cv.dashboard.ui' JSON string.
 * @returns {{ win, CodiviumInsights }}
 */
function loadBundle(opts = {}) {
  const win = buildEnv();

  if (opts.localStorageUI)
    win.localStorage.setItem('cv.dashboard.ui', opts.localStorageUI);

  if (opts.payload)
    win.__CODIVIUM_DASHBOARD_DATA__ = opts.payload;

  const code = fs.readFileSync(BUNDLE_PATH, 'utf8');

  const context = vm.createContext({
    window:    win,
    document:  win.document,
    navigator: { userAgent: 'Node.js test' },
    location:  { href: 'http://localhost/', origin: 'http://localhost' },
    console,
    setTimeout:   (fn) => { try { fn(); } catch (_) {} },
    clearTimeout: () => {},
    requestAnimationFrame: (fn) => { try { fn(0); } catch (_) {} },
  });

  try {
    vm.runInContext(code, context, { filename: 'insights-dashboard.bundle.js' });
  } catch (e) {
    // React bundles may throw during SSR-incompatible DOM ops; capture state anyway
    if (!e.message?.includes('document') && !e.message?.includes('window')) throw e;
  }

  return {
    win,
    CodiviumInsights: win.CodiviumInsights || null,
  };
}

/**
 * Apply a dashboard payload via the CodiviumInsights.update API.
 */
function applyPayload(win, payload) {
  const ci = win.CodiviumInsights;
  if (ci && typeof ci.update === 'function') {
    ci.update(payload);
  } else if (win.__CODIVIUM_DASHBOARD_DATA__ === undefined) {
    win.__CODIVIUM_DASHBOARD_DATA__ = payload;
  }
}

module.exports = { loadBundle, applyPayload };

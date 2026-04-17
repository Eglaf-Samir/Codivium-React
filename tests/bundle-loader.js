/**
 * bundle-loader.js
 * Loads dashboard.bundle.js into a fresh DOM shim environment using node:vm.
 * Returns the window object so tests can inspect state and call public APIs.
 */

'use strict';

const vm    = require('node:vm');
const fs    = require('node:fs');
const path  = require('node:path');
const { buildEnv } = require('./dom-shim');

const BUNDLE_PATH = path.resolve(__dirname, '../assets/components/dashboard/js/dashboard.bundle.js');

/**
 * Load a fresh bundle instance.
 * @param {object} [opts]
 * @param {object} [opts.payload]        - Set window.__CODIVIUM_DASHBOARD_DATA__ before load.
 * @param {string} [opts.localStorageUI] - Pre-seed localStorage 'cv.dashboard.ui' JSON string.
 * @returns {object} window — the shim window with CodiviumInsights etc.
 */
function loadBundle(opts = {}) {
  const win = buildEnv();

  // Pre-seed localStorage if requested
  if (opts.localStorageUI) {
    win.localStorage.setItem('cv.dashboard.ui', opts.localStorageUI);
  }

  // Pre-seed CodiviumInsightsConfig (e.g. { debug: true } for tests needing __state)
  if (opts.config) {
    win.CodiviumInsightsConfig = opts.config;
  }

  // Pre-seed payload if requested
  if (opts.payload) {
    win.__CODIVIUM_DASHBOARD_DATA__ = opts.payload;
  }

  // Build a vm context where globals are the window object
  const ctx = vm.createContext(win);

  // Patch: the bundle is an IIFE that references `window`, `document`, `localStorage` etc.
  // We also need `console` available for any internal logging.
  // R29: Capture runtime errors/warnings so tests can assert clean execution.
  const _capturedErrors = [];
  ctx.console = Object.assign(Object.create(console), {
    error: (...args) => {
      _capturedErrors.push(args.map(String).join(' '));
      // Still print to real console for debugging
      console.error(...args);
    },
    warn: (...args) => { /* suppress non-error warnings in test output */ }
  });
  win.__capturedErrors = _capturedErrors;

  const code = fs.readFileSync(BUNDLE_PATH, 'utf8');

  try {
    vm.runInContext(code, ctx, {
      filename: 'dashboard.bundle.js',
      timeout: 5000,
    });
  } catch (err) {
    // Some errors (missing Chart.js etc.) are expected and safe to swallow
    // if CodiviumInsights was still registered on window.
    if (!win.CodiviumInsights) {
      throw new Error(`Bundle load failed before CodiviumInsights was registered: ${err.message}`);
    }
  }

  return win;
}

/**
 * Call applyDashboardData on an already-loaded window.
 */
function applyPayload(win, payload) {
  vm.runInContext(
    `if (typeof applyDashboardData === 'function') applyDashboardData(__testPayload);`,
    vm.createContext(Object.assign(win, { __testPayload: payload }))
  );
}

module.exports = { loadBundle, applyPayload };

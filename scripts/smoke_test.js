#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function mustExist(relPath) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
  return p;
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function checkJson(relPath) {
  const txt = read(relPath);
  JSON.parse(txt);
}

function checkJsSyntax(relPath) {
  const txt = read(relPath);
  // compile only; do not execute
  // Using Function() is enough to catch syntax errors.
  // Wrap in strict mode to match runtime behaviour.
  new Function(`'use strict';\n${txt}\n`);
}

function warn(msg) {
  console.warn(`WARN: ${msg}`);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

try {
  // Core artifacts
  mustExist('assets/components/core/polyfill-loader.js');
  mustExist('assets/components/core/base.css');
  mustExist('assets/components/dashboard/js/dashboard.bundle.js');

  // JS parse checks
  checkJsSyntax('assets/components/core/polyfill-loader.js');
  checkJsSyntax('assets/components/core/global.js');
  checkJsSyntax('assets/components/dashboard/js/dashboard.bundle.js');
  ok('JavaScript syntax checks passed');

  // JSON parse checks
  checkJson('config/scoring-config.v1.json');
  checkJson('config/scoring-config.katex.v1.json');
  // Demo payload fixtures (allow a single fixture or many)
  const demoDir = path.join(ROOT, 'demo');
  const demoPayloads = fs
    .readdirSync(demoDir)
    .filter((n) => /^payload_example\d+\.json$/i.test(n))
    .sort((a, b) => a.localeCompare(b));

  if (!demoPayloads.length) {
    throw new Error('No demo payload fixtures found (expected demo/payload_example*.json)');
  }

  for (const n of demoPayloads) {
    checkJson(path.join('demo', n));
  }
  ok('JSON parse checks passed');

  // Sanity checks on loader paths
  const loader = read('assets/components/core/polyfill-loader.js');
  if (!loader.includes('dashboard.bundle.js')) {
    throw new Error('polyfill-loader.js does not reference dashboard.bundle.js');
  }
  if (!loader.includes('assets/vendor/chartjs/chart.umd.min.js')) {
    warn('Chart.js local vendor path not referenced (expected local-first with CDN fallback)');
  }

  // Vendor presence (optional)
  const chartVendor = path.join(ROOT, 'assets/vendor/chartjs/chart.umd.min.js');
  if (!fs.existsSync(chartVendor)) {
    warn('Chart.js vendor file missing: run ./scripts/fetch_vendor_deps.sh for offline mode');
  }
  const katexVendor = path.join(ROOT, 'assets/vendor/katex/katex.min.js');
  if (!fs.existsSync(katexVendor)) {
    warn('KaTeX vendor files missing: run ./scripts/fetch_vendor_deps.sh for offline mode');
  }


  // Source JS files — must exist and parse cleanly
  const sourceFiles = [
    'assets/components/dashboard/js/dashboard.00.config.js',
    'assets/components/dashboard/js/dashboard.00.core.js',
    'assets/components/dashboard/js/dashboard.06.mcq-and-render.js',
    'assets/components/dashboard/js/dashboard.06b.refresh.js',
    'assets/components/dashboard/js/dashboard.08.help-and-init.js',
  ];
  for (const f of sourceFiles) {
    mustExist(f);
    checkJsSyntax(f);
  }
  ok('Source JS files present and parse cleanly');

  // Split CSS files — must all exist
  const splitCss = [
    'assets/components/dashboard/dashboard.base.css',
    'assets/components/dashboard/dashboard.shell.css',
    'assets/components/dashboard/dashboard.resizers.css',
    'assets/components/dashboard/dashboard.layout.css',
    'assets/components/dashboard/dashboard.panels.css',
    'assets/components/dashboard/dashboard.chrome.css',
    'assets/components/dashboard/dashboard.modals.css',
    'assets/components/dashboard/dashboard.math.css',
  ];
  for (const f of splitCss) {
    mustExist(f);
  }
  ok('Split CSS files present');

  // dashboard.css must NOT exist in authoritative location (it was retired to legacy/)
  const orphanedCss = path.join(ROOT, 'assets/components/dashboard/dashboard.css');
  if (fs.existsSync(orphanedCss)) {
    throw new Error('dashboard.css found in assets/components/dashboard/ — it was retired. Remove it.');
  }
  ok('Orphaned dashboard.css absent from CSS directory');

  // Contracts — must exist and be valid JSON/Markdown
  mustExist('contracts/dashboard-payload-v2.contract.md');
  mustExist('contracts/dashboard-payload-v2.schema.json');
  mustExist('contracts/dashboard-ui-prefs-v1.contract.md');
  checkJson('contracts/dashboard-payload-v2.schema.json');
  ok('Contract files present');

  // Public API surface: bundle must export expected methods
  const bundle = read('assets/components/dashboard/js/dashboard.bundle.js');
  const requiredMethods = ['init', 'update', 'refresh', 'destroy', 'setUiPrefs', 'getUiPrefs',
    'toggleInfoPane', 'setSelectedTrack', 'getSelectedTrack',
    'setAnalysisOverrides', 'setInfoContentOverrides'];
  const missingMethods = requiredMethods.filter(m => !bundle.includes(`CodiviumInsights.${m}`));
  if (missingMethods.length) {
    throw new Error(`Bundle missing expected CodiviumInsights methods: ${missingMethods.join(', ')}`);
  }
  ok('CodiviumInsights API surface present in bundle');

  // demo_data_full.js must NOT be loaded unconditionally in embedded.html
  const embeddedHtml = read('codivium_insights_embedded.html');
  // Match only uncommented (live) demo data script tags — ignore <!-- ... --> blocks
  if (embeddedHtml.replace(/<!--[\s\S]*?-->/g, '').match(/<script[^>]*demo[_/]data[^>]*>/)) {
    throw new Error('codivium_insights_embedded.html has an uncommented demo data <script> tag — remove before deployment');
  }
  ok('codivium_insights_embedded.html has no live demo data script tag');


  // R31: No inline event handlers in supported pages
  const htmlPages = [
    'codivium_insights_embedded.html',
    'dashboard_view_settings.html',
  ];
  for (const page of htmlPages) {
    const content = read(page).replace(/<!--[\s\S]*?-->/g, '');
    if (/\s+on[a-z]+=["'][^"']*["']/i.test(content)) {
      throw new Error(`Inline event handler found in ${page} (security gate violation)`);
    }
  }
  ok('No inline event handlers in supported pages');

  // R31: Supported pages load expected CSS and JS assets
  const embeddedHtmlFull = read('codivium_insights_embedded.html');
  const requiredCss = [
    'dashboard.base.css', 'dashboard.shell.css', 'dashboard.resizers.css',
    'dashboard.layout.css', 'dashboard.panels.css', 'dashboard.chrome.css',
    'dashboard.modals.css', 'dashboard.math.css'
  ];
  const missingCss = requiredCss.filter(f => !embeddedHtmlFull.includes(f));
  if (missingCss.length) {
    throw new Error(`Embedded page missing required CSS: ${missingCss.join(', ')}`);
  }
  // Bundle is loaded by polyfill-loader.js (not a direct script tag)
  if (!embeddedHtmlFull.includes('polyfill-loader.js')) {
    throw new Error('Embedded page does not load polyfill-loader.js (which boots dashboard.bundle.js)');
  }
  ok('Embedded page loads all required CSS and JS assets');

  ok('Smoke test complete');
  process.exit(0);
} catch (err) {
  console.error(`FAIL: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
}

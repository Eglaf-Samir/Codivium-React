#!/usr/bin/env node
'use strict';
// smoke_test.cjs — React architecture smoke test (v1.2.1)
// Verifies React bundle artifacts, HTML entry points, and CSS are correct.
// Run: node scripts/smoke_test.cjs

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function mustExist(rel)  { if (!fs.existsSync(path.join(ROOT, rel))) throw new Error(`Missing: ${rel}`); }
function read(rel)       { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function checkJson(rel)  { JSON.parse(read(rel)); }
function ok(msg)         { console.log(`  OK  ${msg}`); }
function warn(msg)       { console.warn(`  WARN ${msg}`); }

try {
  // ── Boot files (always loaded, not React) ──────────────────────────────────
  ['assets/components/core/theme.js',
   'assets/components/core/cv-font-loader.js',
   'assets/components/core/global.js',
   'assets/components/core/polyfill-loader.js',
   'assets/components/sidebar/sidebar.js',
   'assets/components/core/base.css',
  ].forEach(mustExist);
  ok('Boot files present');

  // ── React bundles ──────────────────────────────────────────────────────────
  const BUNDLES = [
    'assets/react-dist/editor.bundle.js',
    'assets/react-dist/menu.bundle.js',
    'assets/react-dist/adaptive.bundle.js',
    'assets/react-dist/settings.bundle.js',
    'assets/react-dist/mcq-parent.bundle.js',
    'assets/react-dist/mcq-quiz.bundle.js',
    'assets/react-dist/insights-dashboard.bundle.js',
    'assets/react-dist/insights.bundle.js',
  ];
  BUNDLES.forEach(mustExist);
  ok(`All ${BUNDLES.length} React bundles present`);

  // ── HTML pages: each must reference its bundle and its React root div ──────
  const PAGES = [
    { file: 'editor.html',                  bundle: 'editor.bundle.js',             root: 'editor-react-root' },
    { file: 'menu-page.html',               bundle: 'menu.bundle.js',               root: 'menu-react-root' },
    { file: 'adaptive-practice.html',       bundle: 'adaptive.bundle.js',           root: 'adaptive-react-root' },
    { file: 'account-settings.html',        bundle: 'settings.bundle.js',           root: 'settings-react-root' },
    { file: 'mcq-parent.html',              bundle: 'mcq-parent.bundle.js',         root: 'mcq-parent-react-root' },
    { file: 'mcq-quiz.html',                bundle: 'mcq-quiz.bundle.js',           root: 'mcq-quiz-react-root' },
    { file: 'codivium_insights_embedded.html', bundle: 'insights-dashboard.bundle.js', root: 'insights-react-root' },
  ];
  PAGES.forEach(({ file, bundle, root }) => {
    const html = read(file);
    if (!html.includes(bundle))  throw new Error(`${file} missing bundle: ${bundle}`);
    if (!html.includes(root))    throw new Error(`${file} missing React root: #${root}`);
    // Must NOT load old vanilla app JS
    const BANNED = ['adaptive-practice.js','editor-page.js','mcq-parent.js',
                    'mcq-quiz.js','drawer-and-filters.js','account-settings.js'];
    BANNED.forEach(b => { if (html.includes(`src="${b}`) || html.includes(`src='${b}`))
      throw new Error(`${file} still loads legacy file: ${b}`); });
  });
  ok('All HTML pages: correct bundle, React root div, no legacy JS');

  // ── Insights page: CSS must be in <head>, not <body> ──────────────────────
  const insightsHtml = read('codivium_insights_embedded.html');
  const bodyStart = insightsHtml.indexOf('<body');
  const cssInBody = (insightsHtml.slice(bodyStart).match(/<link[^>]+stylesheet/g) || []).length;
  if (cssInBody > 0) throw new Error(`codivium_insights_embedded.html has ${cssInBody} CSS links in <body>`);
  ok('Insights page CSS is correctly in <head>');

  // ── Dashboard route in routeConfig.js ─────────────────────────────────────
  const routeConfig = read('src/shared/routeConfig.js');
  if (routeConfig.includes('codivium_insights_react.html'))
    throw new Error('routeConfig.js still references codivium_insights_react.html — should be codivium_insights_embedded.html');
  ok('routeConfig.js dashboard route is correct');

  // ── No old vanilla scaffold left in app HTML ───────────────────────────────
  PAGES.forEach(({ file }) => {
    const html = read(file);
    if (html.includes('class="adaptive-page"') && file !== 'adaptive-practice.html')
      throw new Error(`${file} still has vanilla adaptive-page scaffold`);
  });
  ok('No stale vanilla HTML scaffold in app pages');

  // ── Required CSS files ────────────────────────────────────────────────────
  [
    'assets/components/dashboard/dashboard.base.css',
    'assets/components/dashboard/dashboard.shell.css',
    'assets/components/dashboard/dashboard.layout.css',
    'assets/components/dashboard/dashboard.panels.css',
    'assets/components/editor/editor-page.css',
    'assets/components/adaptive/adaptive-practice.css',
    'assets/components/exercise-menu/exercise-menu.css',
  ].forEach(mustExist);
  ok('Required CSS files present');

  // ── Contracts ─────────────────────────────────────────────────────────────
  checkJson('contracts/dashboard-payload-v2.schema.json');
  ok('Payload contract JSON valid');

  // ── Data bridge ───────────────────────────────────────────────────────────
  const bridge = read('assets/react-dist/insights.bundle.js');
  if (!bridge.includes('CodiviumInsights'))
    throw new Error('insights.bundle.js missing CodiviumInsights reference');
  ok('Data bridge references CodiviumInsights');

  // ── No vite.config.js at root (would wipe react-dist on accidental build) ──
  if (fs.existsSync(path.join(ROOT, 'vite.config.js')))
    throw new Error('vite.config.js at root still exists — rename or delete');
  ok('No root vite.config.js (safe)');

  console.log('\n  All smoke tests passed.\n');
  process.exit(0);
} catch (e) {
  console.error(`\n  SMOKE TEST FAILED: ${e.message}\n`);
  process.exit(1);
}

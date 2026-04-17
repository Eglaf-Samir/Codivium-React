#!/usr/bin/env node
'use strict';
// regression_guard.cjs — guards against regressions in the React architecture (v1.2.1)
// Fails if any confirmed fix is accidentally reverted.
// Run: node scripts/regression_guard.cjs

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const read   = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

let passed = 0, failed = 0;

function ok(id, msg)  { console.log(`  OK   [${id}] ${msg}`); passed++; }
function err(id, msg) { console.error(`  FAIL [${id}] ${msg}`); failed++; }

// ── G-01: Legacy vanilla app JS files must NOT be present ────────────────────
const LEGACY_BANNED = [
  'assets/components/adaptive/adaptive-practice.js',
  'assets/components/editor/editor-page.js',
  'assets/components/mcq/mcq-parent.js',
  'assets/components/mcq/mcq-quiz.js',
  'assets/components/settings/account-settings.js',
  'assets/components/dashboard/js/dashboard.bundle.js',
];
const bannedPresent = LEGACY_BANNED.filter(exists);
if (bannedPresent.length > 0)
  err('G-01', `Legacy files still present: ${bannedPresent.join(', ')}`);
else
  ok('G-01', 'No legacy vanilla app JS files present');

// ── G-02: React bundles must all be present ──────────────────────────────────
const BUNDLES = [
  'assets/react-dist/adaptive.bundle.js',
  'assets/react-dist/editor.bundle.js',
  'assets/react-dist/insights-dashboard.bundle.js',
  'assets/react-dist/insights.bundle.js',
  'assets/react-dist/mcq-parent.bundle.js',
  'assets/react-dist/mcq-quiz.bundle.js',
  'assets/react-dist/menu.bundle.js',
  'assets/react-dist/settings.bundle.js',
];
const missingBundles = BUNDLES.filter(b => !exists(b));
if (missingBundles.length > 0)
  err('G-02', `Missing React bundles: ${missingBundles.join(', ')}`);
else
  ok('G-02', 'All React bundles present');

// ── G-03: HTML pages must reference React bundles, not legacy JS ─────────────
const PAGE_CHECKS = [
  { page: 'adaptive-practice.html', bundle: 'adaptive.bundle.js',    banned: 'adaptive-practice.js' },
  { page: 'editor.html',            bundle: 'editor.bundle.js',       banned: 'editor-page.js' },
  { page: 'mcq-parent.html',        bundle: 'mcq-parent.bundle.js',   banned: 'mcq-parent.js' },
  { page: 'mcq-quiz.html',          bundle: 'mcq-quiz.bundle.js',     banned: 'mcq-quiz.js' },
  { page: 'menu-page.html',         bundle: 'menu.bundle.js',         banned: null },
  { page: 'account-settings.html',  bundle: 'settings.bundle.js',     banned: 'account-settings.js' },
  { page: 'codivium_insights_embedded.html', bundle: 'insights-dashboard.bundle.js', banned: null },
];
PAGE_CHECKS.forEach(({ page, bundle, banned }) => {
  const html = read(page);
  if (!html.includes(bundle))
    err('G-03', `${page} missing bundle ref: ${bundle}`);
  else if (banned && html.includes(banned) && !html.includes('<!--'))
    err('G-03', `${page} still loads banned legacy file: ${banned}`);
  else
    ok('G-03', `${page}: correct bundle, no legacy JS`);
});

// ── G-04: React roots must be present in HTML pages ──────────────────────────
const ROOT_CHECKS = [
  { page: 'adaptive-practice.html', root: 'adaptive-react-root' },
  { page: 'editor.html',            root: 'editor-react-root' },
  { page: 'mcq-parent.html',        root: 'mcq-parent-react-root' },
  { page: 'account-settings.html',  root: 'settings-react-root' },
];
ROOT_CHECKS.forEach(({ page, root }) => {
  if (!read(page).includes(root))
    err('G-04', `${page} missing React root: #${root}`);
  else
    ok('G-04', `${page}: #${root} present`);
});

// ── G-05: initGlowFollow must NOT be called without import ───────────────────
['src/adaptive/main.jsx', 'src/mcq-parent/main.jsx', 'src/settings/main.jsx'].forEach(f => {
  if (!exists(f)) return;
  const c = read(f);
  if (c.includes('initGlowFollow()') && !c.includes('import.*initGlowFollow'))
    err('G-05', `${f}: calls initGlowFollow() without importing it`);
  else
    ok('G-05', `${f}: no hidden global dependency`);
});

// ── G-06: No duplicate bootstrap execution tags in app HTML ──────────────────
['adaptive-practice.html','editor.html','mcq-parent.html',
 'mcq-quiz.html','menu-page.html','account-settings.html'].forEach(page => {
  const html = read(page);
  const execTags = (html.match(/<script[^>]+(?:global|sidebar)\.js[^>]+defer/g) || []);
  if (execTags.length > 0)
    err('G-06', `${page}: legacy global/sidebar execution tags still present`);
  else
    ok('G-06', `${page}: no duplicate bootstrap`);
});

// ── G-07: routeConfig.js must target codivium_insights_embedded.html ─────────
if (exists('src/shared/routeConfig.js')) {
  const rc = read('src/shared/routeConfig.js');
  if (rc.includes('codivium_insights_react.html'))
    err('G-07', 'routeConfig.js still references codivium_insights_react.html');
  else
    ok('G-07', 'routeConfig.js dashboard route is correct');
}

// ── G-08: Insights CSS must be in <head>, not <body> ─────────────────────────
['codivium_insights_embedded.html', 'codivium_insights_demo.html'].forEach(page => {
  if (!exists(page)) return;
  const html  = read(page);
  const body  = html.slice(html.indexOf('<body'));
  const inBody = (body.match(/<link[^>]+stylesheet/g) || []).length;
  if (inBody > 0)
    err('G-08', `${page}: ${inBody} CSS links in <body>`);
  else
    ok('G-08', `${page}: all CSS in <head>`);
});

// ── G-09: serve.js must not exist ────────────────────────────────────────────
if (exists('serve.js'))
  err('G-09', 'serve.js still present (broken ESM/CJS conflict) — delete it');
else
  ok('G-09', 'serve.js absent (replaced by start-server.cjs)');

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

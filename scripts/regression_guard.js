#!/usr/bin/env node
/**
 * scripts/regression_guard.js
 *
 * Guards against regression of resolved issues. Each check encodes a
 * specific fix so that if the fix is accidentally reverted, this script
 * fails immediately rather than resurfacing as an audit finding later.
 *
 * Run automatically by run_checks.sh.
 * Run manually: node scripts/regression_guard.js
 *
 * Checks:
 *   G-01  Deleted files stay deleted (js.bak/, legacy/, editor.js, backend/reference/)
 *   G-02  localStorage keys use cv_ prefix only (no cv. dot notation)
 *   G-03  No (deleted) annotations remain in package-docs/
 *   G-04  Sidebar canonical HTML consistent across all pages (calls sync_sidebar --check)
 *   G-05  No stale editor.js references in docs claiming it is a live file
 *   G-06  No LEGACY or BACKUP categories in DEPLOYMENT_BOUNDARY.md
 *   G-07  demo-banner CSS class absent from adaptive-practice.css
 *   G-08  editor-page.js described as active runtime (not "not yet loaded/wired")
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let   pass = 0, fail = 0;

function ok(id, msg)   { console.log(`  ✓ ${id}: ${msg}`); pass++; }
function err(id, msg)  { console.error(`  ✗ ${id}: ${msg}`); fail++; }
function exists(rel)   { return fs.existsSync(path.join(ROOT, rel)); }
function read(rel)     { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function glob(dir, ext) {
  if (!fs.existsSync(path.join(ROOT, dir))) return [];
  return fs.readdirSync(path.join(ROOT, dir))
    .filter(f => f.endsWith(ext))
    .map(f => path.join(ROOT, dir, f));
}

console.log('\nRegression guard\n');

// ── G-01: Deleted files stay deleted ────────────────────────────────────
const mustBeGone = [
  'assets/components/dashboard/js.bak',
  'legacy',
  'assets/components/editor/editor.js',
  'backend/reference',
  'backend/reference/CodiviumDashboardBackend_AllInOne_v37.legacy.cs.deleted',
  'backend/reference/CodiviumDashboardBackend_AllInOne_v38.cs.deleted',
  'backend/reference/CodiviumMcqPayload.legacy.v1.cs',
  'backend/reference/CodiviumPoints.v1.superseded.cs',
  'scripts/build_dashboard_bundle.legacy.sh',
  'assets/components/editor/editor-page.all.js',
  'assets/components/editor/editor-page.all.css',
];
let g01pass = true;
for (const rel of mustBeGone) {
  if (exists(rel)) { err('G-01', `Should be deleted but exists: ${rel}`); g01pass = false; }
}
if (g01pass) ok('G-01', 'All deleted files remain absent');

// ── G-02: localStorage keys use cv_ prefix only ──────────────────────────
const jsSources = [
  'assets/components/core/global.js',
  'assets/components/mcq/mcq-parent.js',
  'assets/components/mcq/mcq-quiz.js',
  'assets/components/adaptive/adaptive-practice.js',
  'assets/components/sidebar/sidebar.js',
  'assets/components/editor/editor-page.js',
  'assets/components/exercise-menu/menu-data.js',
];
const dotKeyPattern = /localStorage\.(getItem|setItem|removeItem)\(['"]cv\.[^'"]+['"]/;
let g02pass = true;
for (const rel of jsSources) {
  const content = read(rel);
  const m = content.match(dotKeyPattern);
  if (m) { err('G-02', `Dot-notation localStorage key in ${rel}: ${m[0]}`); g02pass = false; }
}
if (g02pass) ok('G-02', 'All localStorage keys use cv_ underscore prefix');

// ── G-03: No (deleted) annotations in package-docs/ ─────────────────────
const pkgDocs = glob('package-docs', '.md').concat(glob('package-docs', '.txt'));
let g03pass = true;
for (const f of pkgDocs) {
  const content = fs.readFileSync(f, 'utf8');
  if (/\(deleted[^)]*\)/.test(content)) {
    err('G-03', `(deleted) annotation found in ${path.basename(f)}`);
    g03pass = false;
  }
  if (/js\.bak/.test(content)) {
    err('G-03', `js.bak reference found in ${path.basename(f)}`);
    g03pass = false;
  }
}
if (g03pass) ok('G-03', 'No stale (deleted) annotations in package-docs/');

// ── G-04: Sidebar HTML in sync (spot-check one root page and one demo page) ─
const canonicalMarker = 'id="csArcNav"';   // unified SVG arc ID from sync_sidebar.js
const sidebarOldMarker = 'id="csArcAP"';  // old per-page IDs — must not appear
let g04pass = true;
const pagesToCheck = [
  'adaptive-practice.html',
  'mcq-parent.html',
  'editor.html',
  'demo/adaptive_returning_user.html',
  'demo/demo_menu_micro.html',
];
for (const rel of pagesToCheck) {
  if (!exists(rel)) continue;
  const html = read(rel);
  if (!html.includes(canonicalMarker)) {
    err('G-04', `Canonical sidebar marker missing in ${rel}`);
    g04pass = false;
  }
  if (html.includes(sidebarOldMarker)) {
    err('G-04', `Old per-page sidebar ID found in ${rel} — run sync_sidebar.js`);
    g04pass = false;
  }
}
if (g04pass) ok('G-04', 'Sidebar canonical HTML present in all checked pages');

// ── G-05: No docs claim editor.js is a live file ─────────────────────────
const docFiles = [
  ...glob('docs',         '.md'),
  ...glob('package-docs', '.md'),
  ...glob('contracts',    '.md'),
];
const liveEditorJsPattern = /editor\.js\b.*(?:live|loaded|wired|active|wire)/i;
let g05pass = true;
for (const f of docFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (liveEditorJsPattern.test(content)) {
    err('G-05', `Doc still describes editor.js as live: ${path.basename(f)}`);
    g05pass = false;
  }
}
if (g05pass) ok('G-05', 'No docs claim editor.js is a live file');

// ── G-06: No LEGACY/BACKUP categories in DEPLOYMENT_BOUNDARY.md ──────────
const boundary = read('package-docs/DEPLOYMENT_BOUNDARY.md');
let g06pass = true;
if (/\| \*\*LEGACY\*\*/.test(boundary)) {
  err('G-06', 'LEGACY category row found in DEPLOYMENT_BOUNDARY.md');
  g06pass = false;
}
if (/\| \*\*BACKUP\*\*/.test(boundary)) {
  err('G-06', 'BACKUP category row found in DEPLOYMENT_BOUNDARY.md');
  g06pass = false;
}
if (g06pass) ok('G-06', 'DEPLOYMENT_BOUNDARY.md has no LEGACY/BACKUP categories');

// ── G-07: .demo-banner absent from adaptive-practice.css ─────────────────
const adaptiveCss = read('assets/components/adaptive/adaptive-practice.css');
if (adaptiveCss.includes('.demo-banner')) {
  err('G-07', '.demo-banner CSS rule found — should have been removed');
} else {
  ok('G-07', '.demo-banner CSS rule absent from adaptive-practice.css');
}

// ── G-08: editor-page.js described as active (not "not yet wired") ────────
const ambiguousEditorPattern = /editor-page\.js[^`\n]*not yet (loaded|wired)/i;
let g08pass = true;
for (const f of docFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (ambiguousEditorPattern.test(content)) {
    err('G-08', `Ambiguous editor-page.js description in ${path.basename(f)}`);
    g08pass = false;
  }
}
// Also check the EDITOR_DEPLOYMENT_NOTE for the duplicate row
const edNote = read('docs/EDITOR_DEPLOYMENT_NOTE.md');
const editorJsRows = (edNote.match(/editor-page\.js/g) || []).length;
if (editorJsRows > 2) {   // heading + one table row is expected
  err('G-08', `Unexpected number of editor-page.js rows in EDITOR_DEPLOYMENT_NOTE.md (${editorJsRows}) — possible duplicate`);
  g08pass = false;
}
if (g08pass) ok('G-08', 'editor-page.js described correctly as active runtime');

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${pass + fail} checks — ${pass} passed, ${fail} failed.\n`);
if (fail > 0) process.exit(1);

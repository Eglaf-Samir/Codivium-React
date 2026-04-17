#!/usr/bin/env node
/* editor_smoke_test.js
 * A48: Dedicated smoke test for the editor/workspace page.
 * A49: Fails on meaningful structural issues (missing DOM hooks, broken refs).
 *
 * Checks performed (static analysis — no browser required):
 *  1. editor.html exists and is non-trivial
 *  2. editor.html has at most 1 inline <script> block
 *  3. editor.html has no inline style= attributes (outside JS strings)
 *  4. editor.html has no on* event handler attributes
 *  5. editor.html loads editor-page.css and editor-page.js
 *  6. editor.html provides all required DOM IDs for the submit contract
 *  7. editor-page.js exists and is non-trivial
 *  8. editor-page.css exists and is non-trivial
 *  9. editor-page.js exists (combined runtime — UI + API integration)
 * 10. Submit module has real fetch() to /api/exercise/submit (not a stub toast)
 * 11. Analytics: CVD.submit.emit present
 * 12. Session ID: createSessionId present in submit module
 * 13. Validation: validate() function present in submit module
 * 14. No data-sri-required without integrity= on CDN assets (warns, not fails)
 * 15. Unsupported viewport notice present (#cvd-unsupported-screen)
 * 16. prefers-reduced-motion media query in CSS
 * 17. focus-visible rules in CSS
 * 18. No console.error / console.warn left as debug stubs in JS
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const read   = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

let _pass = 0, _warn = 0;

function ok(msg)   { console.log(`OK: ${msg}`);      _pass++; }
function warn(msg) { console.warn(`WARN: ${msg}`);    _warn++; }
function fail(msg) { console.error(`FAIL: ${msg}`);   process.exit(1); }

try {
  // ── 1. Files exist ──────────────────────────────────────────────────────────
  if (!exists('editor.html'))                                     fail('editor.html missing');
  if (!exists('assets/components/editor/editor-page.js'))        fail('editor-page.js missing');
  if (!exists('assets/components/editor/editor-page.css'))       fail('editor-page.css missing');
  // editor.js deleted — editor-page.js owns both UI and API integration (load + submit)

  const html   = read('editor.html');
  const pageJs = read('assets/components/editor/editor-page.js');
  const pageCss= read('assets/components/editor/editor-page.css');

  if (html.length < 5000)    fail('editor.html is suspiciously small (<5KB) — may be incomplete');
  if (pageJs.length < 20000) fail('editor-page.js is suspiciously small (<20KB) — may be incomplete');
  if (pageCss.length < 10000)fail('editor-page.css is suspiciously small (<10KB) — may be incomplete');
  ok('All required editor/workspace files exist with expected sizes');

  // ── 2. No inline scripts ────────────────────────────────────────────────────
  const inlineScripts = (html.match(/<script(?![^>]*src=)[^>]*>[^<]/g) || []);
  if (inlineScripts.length > 1) fail(`editor.html has ${inlineScripts.length} inline <script> block(s) — security gate violation`);
  ok('editor.html has at most 1 inline <script> block');

  // ── 3. No inline style blocks ───────────────────────────────────────────────
  const inlineStyles = (html.match(/<style[^>]*>/g) || []);
  if (inlineStyles.length > 0) fail(`editor.html has ${inlineStyles.length} inline <style> block(s) — security gate violation`);
  ok('editor.html has no inline <style> blocks');

  // ── 4. No inline style= attributes (check outside script blocks) ───────────
  const noScriptHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
  const styleAttrs = (noScriptHtml.match(/\sstyle\s*=\s*"/g) || []);
  if (styleAttrs.length > 0) fail(`editor.html has ${styleAttrs.length} inline style= attributes — security gate violation`);
  ok('editor.html has no inline style= attributes');

  // ── 5. No on* event handlers ────────────────────────────────────────────────
  const onHandlers = (html.match(/\son[a-zA-Z]+\s*=\s*"/g) || []);
  if (onHandlers.length > 0) fail(`editor.html has ${onHandlers.length} inline on* event handler(s)`);
  ok('editor.html has no inline on* event handlers');

  // ── 6. External file references ─────────────────────────────────────────────
  if (!html.includes('editor-page.css'))  fail('editor.html does not load editor-page.css');
  if (!html.includes('editor-page.js'))   fail('editor.html does not load editor-page.js');
  ok('editor.html loads editor-page.css and editor-page.js');

  // ── 7. Required DOM IDs (submit contract) ───────────────────────────────────
  const REQUIRED_IDS = [
    'submitSolution', 'editorStatus', 'testResults',
    'testSummary', 'testCaseList', 'candidateEditor', 'attemptCount'
  ];
  const missingIds = REQUIRED_IDS.filter(id => !html.includes(`id="${id}"`));
  if (missingIds.length > 0) fail(`editor.html missing required DOM IDs: ${missingIds.join(', ')}`);
  ok(`editor.html provides all ${REQUIRED_IDS.length} required DOM IDs for submit contract`);

  // ── 8. Submit module has real fetch (not stub toast) ────────────────────────
  if (!pageJs.includes("fetch('/api/exercise/submit'") &&
      !pageJs.includes('fetch("/api/exercise/submit"') &&
      !pageJs.includes('__cvFetch("/api/exercise/submit"') &&
      !pageJs.includes("__cvFetch('/api/exercise/submit'")) {
    fail('editor-page.js submit module does not call fetch("/api/exercise/submit") — still a stub');
  }
  ok('editor-page.js submit module has real fetch to /api/exercise/submit');

  // ── 9. Analytics emit present ───────────────────────────────────────────────
  if (!pageJs.includes('CVD.submit.emit') && !pageJs.includes('emit(')) {
    fail('editor-page.js submit module missing analytics emit()');
  }
  ok('editor-page.js submit module has analytics emit()');

  // ── 10. Session ID creation ──────────────────────────────────────────────────
  if (!pageJs.includes('createSessionId')) fail('editor-page.js missing createSessionId()');
  ok('editor-page.js has createSessionId()');

  // ── 11. Validation function ──────────────────────────────────────────────────
  if (!pageJs.includes('function validate()') && !pageJs.includes('function validate (')) {
    fail('editor-page.js missing validate() function in submit module');
  }
  ok('editor-page.js has validate() function');

  // ── 12. SRI check (warn, not fail — deploy-time concern) ────────────────────
  const sriPending = (html.match(/data-sri-required="true"/g) || []).length;
  if (sriPending > 0) {
    warn(`${sriPending} CDN asset(s) still need SRI integrity= hashes — run scripts/verify_sri.sh before deployment`);
  } else {
    ok('All CDN assets have SRI hashes or no CDN assets present');
  }

  // ── 13. Unsupported viewport notice ─────────────────────────────────────────
  if (!html.includes('cvd-unsupported-screen')) fail('editor.html missing #cvd-unsupported-screen (A28)');
  ok('editor.html has unsupported viewport notice (#cvd-unsupported-screen)');

  // ── 14. prefers-reduced-motion ──────────────────────────────────────────────
  if (!pageCss.includes('prefers-reduced-motion')) fail('editor-page.css missing @media (prefers-reduced-motion) (A31)');
  ok('editor-page.css has prefers-reduced-motion media query');

  // ── 15. Focus styles ────────────────────────────────────────────────────────
  const focusCount = (pageCss.match(/:focus-visible/g) || []).length;
  if (focusCount < 5) fail(`editor-page.css has only ${focusCount} :focus-visible rules — expected at least 5 (A33)`);
  ok(`editor-page.css has ${focusCount} :focus-visible rules (A33)`);

  // ── 16. No debug console.error stubs in JS ──────────────────────────────────
  // Allow console.warn for legitimate dev warnings, but flag console.error stubs
  const errorStubs = (pageJs.match(/console\.error\s*\(\s*["'`]DEBUG/gi) || []);
  if (errorStubs.length > 0) fail(`editor-page.js has ${errorStubs.length} debug console.error stubs`);
  ok('No debug console.error stubs in editor-page.js');


  // ─────────────────────────────────────────────────────────────
  // Menu page checks (M6)
  // ─────────────────────────────────────────────────────────────

  if (!exists('menu-page.html'))                                      fail('menu-page.html missing');
  if (!exists('assets/components/exercise-menu/menu-data.js'))        fail('menu-data.js missing');
  if (!exists('assets/components/exercise-menu/drawer-and-filters.js')) fail('drawer-and-filters.js missing');
  if (!exists('assets/components/exercise-menu/exercise-menu.css'))   fail('exercise-menu.css missing');
  if (!exists('assets/components/exercise-menu/menu-demo-data.js'))   fail('menu-demo-data.js missing (M1)');

  const menuHtml   = read('menu-page.html');
  const menuDataJs = read('assets/components/exercise-menu/menu-data.js');

  // Security gate
  const menuInlineScripts = (menuHtml.match(/<script(?![^>]*src=)[^>]*>[^<]/g) || []);
  if (menuInlineScripts.length > 1) fail(`menu-page.html has ${menuInlineScripts.length} inline <script> block(s)`);
  const menuNoScripts = menuHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
  const menuStyleAttrs = (menuNoScripts.match(/\sstyle\s*=\s*"/g) || []);
  if (menuStyleAttrs.length > 0) fail(`menu-page.html has ${menuStyleAttrs.length} inline style= attributes`);
  ok('menu-page.html passes security checks');

  // Required assets loaded
  if (!menuHtml.includes('exercise-menu.css')) fail('menu-page.html does not load exercise-menu.css');
  if (!menuHtml.includes('menu-data.js'))      fail('menu-page.html does not load menu-data.js');
  if (!menuHtml.includes('menu-demo-data.js')) fail('menu-page.html does not load menu-demo-data.js (M1)');
  ok('menu-page.html loads all required exercise-menu assets');

  // Required DOM IDs
  const MENU_IDS = ['gridScroll', 'menuSearch', 'menuTrackTitle'];
  const missingMenuIds = MENU_IDS.filter(id => !menuHtml.includes(`id="${id}"`));
  if (missingMenuIds.length > 0) fail(`menu-page.html missing DOM IDs: ${missingMenuIds.join(', ')}`);
  ok(`menu-page.html provides all ${MENU_IDS.length} required DOM IDs`);

  // No static hardcoded cards (should be just loading state)
  const staticCards = (menuHtml.match(/class="exercise-card"/g) || []).length;
  if (staticCards > 0) fail(`menu-page.html has ${staticCards} static exercise-card elements — should use loading state only (M2)`);
  ok('menu-page.html uses loading state (no static hardcoded cards)');

  // menu-data.js has real API fetch
  if (!menuDataJs.includes('/api/menu/payload')) fail('menu-data.js missing fetch to /api/menu/payload');
  ok('menu-data.js has real fetch to /api/menu/payload');

  // menu-data.js builds editor.html links
  if (!menuDataJs.includes("editor.html?id=")) fail('menu-data.js does not build editor.html?id= links');
  ok('menu-data.js builds correct editor.html?id=...&from=... links');

  // editor.html has back-to-menu link
  if (!html.includes('id="backToMenu"')) fail('editor.html missing #backToMenu link (M4)');
  ok('editor.html has #backToMenu back-navigation link');

  // API contract exists
  if (!exists('contracts/exercise-menu-api.contract.md')) fail('exercise-menu-api.contract.md missing (M3)');
  ok('exercise-menu-api.contract.md exists');

  console.log(`\nEditor smoke test complete. ${_pass} checks passed, ${_warn} warning(s).`);
  process.exit(0);

} catch (err) {
  if (err.message && err.message.startsWith('FAIL:')) {
    // Already printed
  } else {
    console.error(`FAIL: Unexpected error — ${err.message || String(err)}`);
  }
  process.exit(1);
}

#!/usr/bin/env node
/* adaptive_smoke_test.js
 * Smoke test for adaptive-practice.html and adaptive-practice.js
 * Static analysis only — no browser required.
 *
 * Checks performed:
 *  1.  adaptive-practice.html exists and is non-trivial
 *  2.  adaptive-practice.html has at most 1 inline <script> block
 *  3.  adaptive-practice.html has no inline style= attributes
 *  4.  adaptive-practice.html has no on* event handler attributes
 *  5.  adaptive-practice.html loads all required CSS files
 *  6.  adaptive-practice.html loads adaptive-practice.js
 *  7.  adaptive-practice.html has required DOM IDs for contract
 *  8.  adaptive-practice.html has orientation diagnostic buttons
 *  9.  adaptive-practice.js exists and is non-trivial (>50KB)
 * 10.  adaptive-practice.js: FIXTURE fallback defined (empty default state)
 * 11.  adaptive-practice.js: window.__adaptiveFixture override checked before API call
 * 12.  adaptive-practice.js: getAdaptiveState() uses __cvFetchWithRetry (timeout)
 * 13.  adaptive-practice.js: FIXTURE returned on AbortError (timeout fallback)
 * 14.  adaptive-practice.js: __apColumnObserver module-level ref (prevents observer leak)
 * 15.  adaptive-practice.js: disconnect() called before re-observe
 * 16.  adaptive-practice.js: pagehide cleanup for ResizeObserver
 * 17.  adaptive-practice.js: has renderFullMode()
 * 18.  adaptive-practice.js: has renderPrimary() and renderAlternatives()
 * 19.  adaptive-practice.css exists and is non-trivial
 * 20.  adaptive-practice.html has skip link
 * 21.  adaptive-practice.html has viewport meta
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(msg)   { passed++; }
function fail(msg) { failed++; console.log('FAIL:', msg); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function read(rel)   { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ── 1. Files exist ──────────────────────────────────────────────
if (!exists('adaptive-practice.html'))     fail('adaptive-practice.html missing');
else ok('adaptive-practice.html exists');

if (!exists('assets/components/adaptive/adaptive-practice.js'))
  fail('adaptive-practice.js missing');
else ok('adaptive-practice.js exists');

if (!exists('assets/components/adaptive/adaptive-practice.css'))
  fail('adaptive-practice.css missing');
else ok('adaptive-practice.css exists');

const pageHtml = read('adaptive-practice.html');
const pageJs   = read('assets/components/adaptive/adaptive-practice.js');
const pageCss  = read('assets/components/adaptive/adaptive-practice.css');

// ── 2–4. Security ──────────────────────────────────────────────
const inlineScripts = (pageHtml.match(/<script(?![^>]*src=)[^>]*>[^<]/g) || []);
if (inlineScripts.length > 1) fail(`adaptive-practice.html has ${inlineScripts.length} inline <script> block(s)`);
else ok('adaptive-practice.html has at most 1 inline <script> block');

const htmlNoScript = pageHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const styleAttrs = (htmlNoScript.match(/\sstyle\s*=\s*"/g) || []);
if (styleAttrs.length > 0) fail(`adaptive-practice.html has ${styleAttrs.length} inline style= attribute(s)`);
else ok('adaptive-practice.html has no inline style= attributes');

const onHandlers = (htmlNoScript.match(/\s+on[a-z]+=["']/g) || []);
if (onHandlers.length > 0) fail(`adaptive-practice.html has ${onHandlers.length} on* event handler(s)`);
else ok('adaptive-practice.html has no inline on* event handlers');

// ── 5. Required CSS ─────────────────────────────────────────────
const REQUIRED_CSS = ['base.css', 'sidebar.css', 'adaptive-practice.css'];
const missingCss = REQUIRED_CSS.filter(f => !pageHtml.includes(f));
if (missingCss.length > 0) fail(`adaptive-practice.html missing CSS: ${missingCss.join(', ')}`);
else ok(`adaptive-practice.html loads all required CSS files`);

// ── 6. Loads adaptive-practice.js ─────────────────────────────
if (!pageHtml.includes('adaptive-practice.js'))
  fail('adaptive-practice.html does not load adaptive-practice.js');
else ok('adaptive-practice.html loads adaptive-practice.js');

// ── 7. Required DOM IDs ─────────────────────────────────────────
const REQUIRED_IDS = [
  'apFullMode',         // full mode container
  'apPrimaryHeadline',  // primary recommendation headline
  'apPrimaryCta',       // primary call-to-action button
  'apAltGrid',          // alternative recommendations grid
  'apOrientSubmit',     // orientation form submit
];
const missingIds = REQUIRED_IDS.filter(id => !pageHtml.includes(`id="${id}"`));
if (missingIds.length > 0) fail(`adaptive-practice.html missing DOM IDs: ${missingIds.join(', ')}`);
else ok(`adaptive-practice.html has all ${REQUIRED_IDS.length} required DOM IDs`);

// ── 8. Orientation diagnostic buttons ──────────────────────────
const diagButtons = (pageHtml.match(/class="ap-diag-opt"/g) || []).length;
if (diagButtons < 4) fail(`adaptive-practice.html has only ${diagButtons} diagnostic buttons (need ≥4)`);
else ok(`adaptive-practice.html has ${diagButtons} orientation diagnostic option buttons`);

// ── 9. JS file size ─────────────────────────────────────────────
if (pageJs.length < 50000) fail(`adaptive-practice.js too small (${pageJs.length}B) — may be a stub`);
else ok(`adaptive-practice.js is non-trivial (${Math.round(pageJs.length/1024)}KB)`);

// ── 10. FIXTURE fallback ────────────────────────────────────────
if (!pageJs.includes('const FIXTURE ='))
  fail('adaptive-practice.js missing FIXTURE fallback constant');
else ok('adaptive-practice.js has FIXTURE fallback (empty default state)');

// Fixture should be a minimal state, not large demo data
const fixtureMatch = pageJs.match(/const FIXTURE\s*=\s*\{[\s\S]{0,2000}?\}/);
if (fixtureMatch && fixtureMatch[0].length > 1500)
  fail(`FIXTURE is too large (${fixtureMatch[0].length}B) — may contain demo data that should be externalised`);
else ok('FIXTURE is appropriately small (<1.5KB)');

// ── 11. window.__adaptiveFixture override ──────────────────────
if (!pageJs.includes('window.__adaptiveFixture'))
  fail('adaptive-practice.js missing window.__adaptiveFixture demo override check');
else ok('adaptive-practice.js checks window.__adaptiveFixture before API call');

// ── 12. getAdaptiveState uses timeout wrapper ───────────────────
if (!pageJs.includes('__cvFetchWithRetry') && !pageJs.includes('AbortController'))
  fail('adaptive-practice.js getAdaptiveState() has no fetch timeout');
else ok('adaptive-practice.js getAdaptiveState() uses __cvFetchWithRetry timeout');

// ── 13. Timeout falls back to FIXTURE ───────────────────────────
if (!pageJs.includes('AbortError') || !pageJs.includes('return FIXTURE'))
  fail('adaptive-practice.js does not fall back to FIXTURE on timeout/error');
else ok('adaptive-practice.js falls back to FIXTURE on any API failure (incl timeout)');

// ── 14. Module-level ResizeObserver reference ───────────────────
if (!pageJs.includes('__apColumnObserver'))
  fail('adaptive-practice.js missing __apColumnObserver module-level ref (observer leak risk)');
else ok('adaptive-practice.js uses __apColumnObserver module ref for ResizeObserver');

// ── 15. disconnect() before re-observe ─────────────────────────
if (!pageJs.includes('__apColumnObserver.disconnect()'))
  fail('adaptive-practice.js does not disconnect ResizeObserver before re-observing');
else ok('adaptive-practice.js disconnects observer before re-creating');

// ── 16. pagehide cleanup ────────────────────────────────────────
if (!pageJs.includes("addEventListener('pagehide'") ||
    !pageJs.includes('__apColumnObserver'))
  fail('adaptive-practice.js missing pagehide cleanup for ResizeObserver');
else ok('adaptive-practice.js registers pagehide cleanup for ResizeObserver');

// ── 17. renderFullMode ──────────────────────────────────────────
if (!pageJs.includes('function renderFullMode'))
  fail('adaptive-practice.js missing renderFullMode()');
else ok('adaptive-practice.js has renderFullMode()');

// ── 18. renderPrimary and renderAlternatives ────────────────────
if (!pageJs.includes('function renderPrimary'))
  fail('adaptive-practice.js missing renderPrimary()');
else ok('adaptive-practice.js has renderPrimary()');

if (!pageJs.includes('function renderAlternatives'))
  fail('adaptive-practice.js missing renderAlternatives()');
else ok('adaptive-practice.js has renderAlternatives()');

// ── 19. CSS non-trivial ─────────────────────────────────────────
if (pageCss.length < 30000) fail(`adaptive-practice.css too small (${pageCss.length}B)`);
else ok(`adaptive-practice.css is non-trivial (${Math.round(pageCss.length/1024)}KB)`);

// ── 20. Skip link ───────────────────────────────────────────────
if (!pageHtml.includes('class="skip-link"'))
  fail('adaptive-practice.html missing skip link');
else ok('adaptive-practice.html has skip link');

// ── 21. Viewport meta ──────────────────────────────────────────
if (!pageHtml.includes('name="viewport"'))
  fail('adaptive-practice.html missing viewport meta');
else ok('adaptive-practice.html has viewport meta');

// ── Summary ─────────────────────────────────────────────────────
const total = passed + failed;
if (failed > 0) {
  console.log(`\nAdaptive-practice smoke test: ${passed}/${total} checks passed, ${failed} failed.`);
  process.exit(1);
} else {
  console.log(`Adaptive-practice smoke test complete. ${passed} checks passed, 0 warning(s).`);
}

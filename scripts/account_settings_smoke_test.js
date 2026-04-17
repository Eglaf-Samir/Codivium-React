#!/usr/bin/env node
/* account_settings_smoke_test.js
 * Smoke test for account-settings.html and account-settings.js
 * Static analysis only — no browser required.
 *
 * Checks performed:
 *  1.  account-settings.html exists and is non-trivial
 *  2.  account-settings.html has at most 1 inline <script> block
 *  3.  account-settings.html has no inline style= attributes
 *  4.  account-settings.html has no on* event handler attributes
 *  5.  account-settings.html loads all required CSS files
 *  6.  account-settings.html loads account-settings.js
 *  7.  account-settings.html has required DOM IDs for tab/subtab contract
 *  8.  account-settings.html has modal backdrops for all 6 modal operations
 *  9.  account-settings.js exists and is non-trivial (>30KB)
 * 10.  account-settings.js has initTabs() — tab switching
 * 11.  account-settings.js has openModal() with focus trap
 * 12.  account-settings.js has closeModal() with focus restoration
 * 13.  account-settings.js has initSiteThemes() — theme chip initialisation
 * 14.  account-settings.js has initDashLayout() — dashboard layout preference
 * 15.  account-settings.js handles pagehide cleanup
 * 16.  account-settings.css exists and is non-trivial
 * 17.  account-settings.html has skip link
 * 18.  account-settings.html has correct viewport meta
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(msg)   { passed++; /* console.log('  ✓', msg); */ }
function fail(msg) { failed++; console.log('FAIL:', msg); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function read(rel)   { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ── 1. Files exist ──────────────────────────────────────────────
if (!exists('account-settings.html'))     fail('account-settings.html missing');
else ok('account-settings.html exists');

if (!exists('assets/components/settings/account-settings.js'))
  fail('account-settings.js missing');
else ok('account-settings.js exists');

if (!exists('assets/components/settings/account-settings.css'))
  fail('account-settings.css missing');
else ok('account-settings.css exists');

const pageHtml = read('account-settings.html');
const pageJs   = read('assets/components/settings/account-settings.js');
const pageCss  = read('assets/components/settings/account-settings.css');

// ── 2–4. Security: no inline scripts/styles/handlers ───────────
const inlineScripts = (pageHtml.match(/<script(?![^>]*src=)[^>]*>[^<]/g) || []);
if (inlineScripts.length > 1) fail(`account-settings.html has ${inlineScripts.length} inline <script> block(s)`);
else ok('account-settings.html has at most 1 inline <script> block');

const htmlNoScript = pageHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const styleAttrs = (htmlNoScript.match(/\sstyle\s*=\s*"/g) || []);
if (styleAttrs.length > 0) fail(`account-settings.html has ${styleAttrs.length} inline style= attribute(s)`);
else ok('account-settings.html has no inline style= attributes');

const onHandlers = (htmlNoScript.match(/\s+on[a-z]+=["']/g) || []);
if (onHandlers.length > 0) fail(`account-settings.html has ${onHandlers.length} inline on* event handler(s)`);
else ok('account-settings.html has no inline on* event handlers');

// ── 5. Required CSS files ───────────────────────────────────────
const REQUIRED_CSS = ['base.css', 'sidebar.css', 'account-settings.css'];
const missingCss = REQUIRED_CSS.filter(f => !pageHtml.includes(f));
if (missingCss.length > 0) fail(`account-settings.html missing CSS: ${missingCss.join(', ')}`);
else ok(`account-settings.html loads all ${REQUIRED_CSS.length} required CSS files`);

// ── 6. Loads account-settings.js ──────────────────────────────
if (!pageHtml.includes('account-settings.js')) fail('account-settings.html does not load account-settings.js');
else ok('account-settings.html loads account-settings.js');

// ── 7. Required DOM IDs ─────────────────────────────────────────
const REQUIRED_IDS = [
  'asDrawerSpeed',      // drawer animation speed slider
  'asDisplayNameVal',   // display name display
  'asEmailVal',         // email display
  'asDashLayout',       // dashboard layout selector
  'asAvatarImg',        // profile avatar image
];
const missingIds = REQUIRED_IDS.filter(id => !pageHtml.includes(`id="${id}"`));
if (missingIds.length > 0) fail(`account-settings.html missing DOM IDs: ${missingIds.join(', ')}`);
else ok(`account-settings.html has all ${REQUIRED_IDS.length} required DOM IDs`);

// ── 8. Modal backdrops ──────────────────────────────────────────
const REQUIRED_MODALS = ['displayName','email','password','payment','cancelSub','deleteAccount'];
const missingModals = REQUIRED_MODALS.filter(id => !pageHtml.includes(`id="modal-${id}"`));
if (missingModals.length > 0) fail(`account-settings.html missing modals: ${missingModals.join(', ')}`);
else ok(`account-settings.html has all ${REQUIRED_MODALS.length} modal backdrops`);

// ── 9. JS file size ─────────────────────────────────────────────
if (pageJs.length < 30000) fail(`account-settings.js too small (${pageJs.length}B) — may be a stub`);
else ok(`account-settings.js is non-trivial (${Math.round(pageJs.length/1024)}KB)`);

// ── 10. initTabs() — tab switching ─────────────────────────────
if (!pageJs.includes('function initTabs'))   fail('account-settings.js missing initTabs()');
else ok('account-settings.js has initTabs()');

if (!pageJs.includes('function activateTab')) fail('account-settings.js missing activateTab()');
else ok('account-settings.js has activateTab()');

// ── 11. openModal with focus trap ──────────────────────────────
if (!pageJs.includes('function openModal'))  fail('account-settings.js missing openModal()');
else ok('account-settings.js has openModal()');

if (!pageJs.includes('trapFocus'))           fail('account-settings.js openModal() missing focus trap');
else ok('account-settings.js openModal() has focus trap');

if (!pageJs.includes("key === 'Escape'"))    fail('account-settings.js missing Escape key handling in modal');
else ok('account-settings.js modal handles Escape key');

// ── 12. closeModal with focus restoration ──────────────────────
if (!pageJs.includes('function closeModal')) fail('account-settings.js missing closeModal()');
else ok('account-settings.js has closeModal()');

if (!pageJs.includes('_triggerEl.focus') && !pageJs.includes('triggerEl.focus'))
  fail('account-settings.js closeModal() does not restore focus to trigger');
else ok('account-settings.js closeModal() restores focus to trigger');

if (!pageJs.includes('removeEventListener') || !pageJs.includes('_trapFocus'))
  fail('account-settings.js closeModal() does not remove focus trap listener');
else ok('account-settings.js closeModal() removes focus trap listener');

// ── 13. initSiteThemes ─────────────────────────────────────────
if (!pageJs.includes('function initSiteThemes'))
  fail('account-settings.js missing initSiteThemes()');
else ok('account-settings.js has initSiteThemes()');

// ── 14. initDashLayout ─────────────────────────────────────────
if (!pageJs.includes('function initDashLayout'))
  fail('account-settings.js missing initDashLayout()');
else ok('account-settings.js has initDashLayout()');

// ── 15. pagehide cleanup ────────────────────────────────────────
if (!pageJs.includes("addEventListener('pagehide'"))
  fail('account-settings.js missing pagehide cleanup');
else ok('account-settings.js registers pagehide cleanup');

// ── 16. CSS non-trivial ─────────────────────────────────────────
if (pageCss.length < 20000) fail(`account-settings.css too small (${pageCss.length}B)`);
else ok(`account-settings.css is non-trivial (${Math.round(pageCss.length/1024)}KB)`);

// ── 17. Skip link ───────────────────────────────────────────────
if (!pageHtml.includes('class="skip-link"'))
  fail('account-settings.html missing skip link');
else ok('account-settings.html has skip link');

// ── 18. Viewport meta ──────────────────────────────────────────
if (!pageHtml.includes('name="viewport"'))
  fail('account-settings.html missing viewport meta');
else ok('account-settings.html has viewport meta');

// ── Summary ─────────────────────────────────────────────────────
const total = passed + failed;
if (failed > 0) {
  console.log(`\nAccount-settings smoke test: ${passed}/${total} checks passed, ${failed} failed.`);
  process.exit(1);
} else {
  console.log(`Account-settings smoke test complete. ${passed} checks passed, 0 warning(s).`);
}

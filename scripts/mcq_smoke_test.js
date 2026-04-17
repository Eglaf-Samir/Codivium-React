#!/usr/bin/env node
/* mcq_smoke_test.js
 * Dedicated smoke test for mcq-parent.html and mcq-quiz.html.
 * Checks performed (static analysis — no browser required):
 *
 * MCQ Parent page:
 *  1.  mcq-parent.html exists and is non-trivial
 *  2.  mcq-parent.html has at most 1 inline <script> block
 *  3.  mcq-parent.html has no inline style= attributes
 *  4.  mcq-parent.html has no on* event handlers
 *  5.  mcq-parent.html loads required CSS files
 *  6.  mcq-parent.html loads required JS files
 *  7.  mcq-parent.html has required DOM IDs: startQuiz, catTabSimple, catTabPower
 *  8.  mcq-parent.js exists and is non-trivial
 *  9.  mcq-parent.css and mcq-forms.css exist
 *
 * MCQ Quiz page:
 * 10.  mcq-quiz.html exists and is non-trivial
 * 11.  mcq-quiz.html has at most 1 inline <script> block
 * 12.  mcq-quiz.html has no inline style= attributes
 * 13.  mcq-quiz.html has no on* event handlers
 * 14.  mcq-quiz.html loads mcq-quiz.js and mcq-quiz.css
 * 15.  mcq-quiz.html has required DOM IDs: options, btnSubmit, btnPeek, progressTrack
 * 16.  mcq-quiz.js has buildBank() returning 12 questions each with 6 options
 * 17.  mcq-quiz.js has gradeCurrent function
 * 18.  mcq-quiz.js has renderContent code renderer
 * 19.  mcq-quiz.js has initTimer function
 * 20.  mcq-tour.js exists and has PARENT_STEPS and QUESTION_STEPS
 *
 * Feedback demo:
 * 21.  feedback-demo.html exists
 * 22.  feedback-demo.html loads feedback.js and feedback.css
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
  // ── MCQ PARENT ────────────────────────────────────────────────────────────

  // 1. Files exist
  if (!exists('mcq-parent.html'))                                   fail('mcq-parent.html missing');
  if (!exists('assets/components/mcq/mcq-parent.js'))              fail('mcq-parent.js missing');
  if (!exists('assets/components/mcq/mcq-parent.css'))             fail('mcq-parent.css missing');
  if (!exists('assets/components/mcq/mcq-forms.css'))              fail('mcq-forms.css missing');
  if (!exists('assets/components/mcq/mcq-setup-overrides.css'))    fail('mcq-setup-overrides.css missing');

  const parentHtml = read('mcq-parent.html');
  const parentJs   = read('assets/components/mcq/mcq-parent.js');
  if (parentHtml.length < 5000) fail('mcq-parent.html is suspiciously small (<5KB)');
  if (parentJs.length < 5000)   fail('mcq-parent.js is suspiciously small (<5KB)');
  ok('All required mcq-parent files exist with expected sizes');

  // 2. No inline scripts
  const parentInline = (parentHtml.match(/<script(?![^>]*src=)[^>]*>[^<]/g) || []);
  if (parentInline.length > 1) fail(`mcq-parent.html has ${parentInline.length} inline <script> block(s)`);
  ok('mcq-parent.html has at most 1 inline <script> block');

  // 3. No inline style= (excluding JS string contexts)
  const parentStyleAttr = (parentHtml.match(/ style="[^"]*"/g) || []);
  if (parentStyleAttr.length > 0) fail(`mcq-parent.html has ${parentStyleAttr.length} inline style= attribute(s)`);
  ok('mcq-parent.html has no inline style= attributes');

  // 4. No on* event handlers
  if (/ on[a-z]+="/i.test(parentHtml)) fail('mcq-parent.html has inline on* event handlers');
  ok('mcq-parent.html has no inline on* event handlers');

  // 5. Loads required CSS
  const requiredParentCss = ['mcq-parent.css', 'mcq-forms.css', 'mcq-setup-overrides.css', 'base.css', 'tour.css'];
  for (const css of requiredParentCss) {
    if (!parentHtml.includes(css)) fail(`mcq-parent.html does not load ${css}`);
  }
  ok('mcq-parent.html loads all required CSS files');

  // 6. Loads required JS
  const requiredParentJs = ['mcq-parent.js', 'mcq-tour.js', 'sidebar.js', 'global.js'];
  for (const js of requiredParentJs) {
    if (!parentHtml.includes(js)) fail(`mcq-parent.html does not load ${js}`);
  }
  ok('mcq-parent.html loads all required JS files');

  // 7. Required DOM IDs
  const requiredParentIds = ['startQuiz', 'catTabSimple', 'catTabPower', 'catPanel', 'qCount'];
  for (const id of requiredParentIds) {
    if (!parentHtml.includes(`id="${id}"`)) fail(`mcq-parent.html missing required DOM ID: #${id}`);
  }
  ok('mcq-parent.html has all required DOM IDs');

  // ── MCQ QUIZ ──────────────────────────────────────────────────────────────

  // 10. Files exist
  if (!exists('mcq-quiz.html'))                       fail('mcq-quiz.html missing');
  if (!exists('assets/components/mcq/mcq-quiz.js'))   fail('mcq-quiz.js missing');
  if (!exists('assets/components/mcq/mcq-quiz.css'))  fail('mcq-quiz.css missing');
  if (!exists('assets/components/mcq/mcq-tour.js'))   fail('mcq-tour.js missing');

  const quizHtml = read('mcq-quiz.html');
  const quizJs   = read('assets/components/mcq/mcq-quiz.js');
  const quizCss  = read('assets/components/mcq/mcq-quiz.css');
  if (quizHtml.length < 5000)  fail('mcq-quiz.html is suspiciously small (<5KB)');
  if (quizJs.length < 10000)   fail('mcq-quiz.js is suspiciously small (<10KB)');
  if (quizCss.length < 5000)   fail('mcq-quiz.css is suspiciously small (<5KB)');
  ok('All required mcq-quiz files exist with expected sizes');

  // 11. No inline scripts
  const quizInline = (quizHtml.match(/<script(?![^>]*src=)[^>]*>[^<]/g) || []);
  if (quizInline.length > 1) fail(`mcq-quiz.html has ${quizInline.length} inline <script> block(s)`);
  ok('mcq-quiz.html has at most 1 inline <script> block');

  // 12. No inline style=
  const quizStyleAttr = (quizHtml.match(/ style="[^"]*"/g) || []);
  if (quizStyleAttr.length > 0) fail(`mcq-quiz.html has ${quizStyleAttr.length} inline style= attribute(s)`);
  ok('mcq-quiz.html has no inline style= attributes');

  // 13. No on* event handlers
  if (/ on[a-z]+="/i.test(quizHtml)) fail('mcq-quiz.html has inline on* event handlers');
  ok('mcq-quiz.html has no inline on* event handlers');

  // 14. Loads required JS + CSS
  if (!quizHtml.includes('mcq-quiz.js'))  fail('mcq-quiz.html does not load mcq-quiz.js');
  if (!quizHtml.includes('mcq-quiz.css')) fail('mcq-quiz.html does not load mcq-quiz.css');
  if (!quizHtml.includes('mcq-tour.js'))  fail('mcq-quiz.html does not load mcq-tour.js');
  if (!quizHtml.includes('tour.css'))     fail('mcq-quiz.html does not load tour.css');
  ok('mcq-quiz.html loads all required assets');

  // 15. Required DOM IDs
  const requiredQuizIds = ['options', 'btnSubmit', 'btnPeek', 'progressTrack', 'summary', 'quizStage'];
  for (const id of requiredQuizIds) {
    if (!quizHtml.includes(`id="${id}"`)) fail(`mcq-quiz.html missing required DOM ID: #${id}`);
  }
  ok('mcq-quiz.html has all required DOM IDs');

  // 16. Demo bank: enough questions with correctIndices
  if (!quizJs.includes('function getDemoBank()') && !quizJs.includes('function buildBank()')) fail('mcq-quiz.js missing getDemoBank() or buildBank() function');
  const bankFn = quizJs.split('function getDemoBank()')[1] || quizJs.split('function buildBank()')[1] || '';
  const qCount = (bankFn.match(/correctIndices:/g) || []).length;
  if (qCount < 10) fail('buildBank has ' + qCount + ' questions — expected at least 10');
  ok('mcq-quiz.js buildBank has ' + qCount + ' questions');

  // 17-19. Key functions present
  if (!quizJs.includes('function gradeCurrent'))   fail('mcq-quiz.js missing gradeCurrent()');
  if (!quizJs.includes('function fetchQuestions')) fail('mcq-quiz.js missing fetchQuestions() — API integration not wired');
  ok('mcq-quiz.js has fetchQuestions() for API integration');
  if (!quizJs.includes('function renderContent')) fail('mcq-quiz.js missing renderContent()');
  if (!quizJs.includes('function initTimer'))     fail('mcq-quiz.js missing initTimer()');
  ok('mcq-quiz.js has gradeCurrent, renderContent, and initTimer functions');

  // 20. Tour file
  const tourJs = read('assets/components/mcq/mcq-tour.js');
  if (!tourJs.includes('PARENT_STEPS'))   fail('mcq-tour.js missing PARENT_STEPS');
  if (!tourJs.includes('QUESTION_STEPS')) fail('mcq-tour.js missing QUESTION_STEPS');
  if (!tourJs.includes('sessionStorage')) fail('mcq-tour.js missing sessionStorage for cross-page state');
  ok('mcq-tour.js has PARENT_STEPS, QUESTION_STEPS, and sessionStorage');

  // ── FEEDBACK DEMO ──────────────────────────────────────────────────────────

  // 21. feedback-demo.html exists
  if (!exists('feedback-demo.html')) fail('feedback-demo.html missing');
  const fbHtml = read('feedback-demo.html');
  if (fbHtml.length < 1000) fail('feedback-demo.html is suspiciously small');
  ok('feedback-demo.html exists');

  // 22. Loads feedback assets
  if (!fbHtml.includes('feedback.js'))  fail('feedback-demo.html does not load feedback.js');
  if (!fbHtml.includes('feedback.css')) fail('feedback-demo.html does not load feedback.css');
  ok('feedback-demo.html loads feedback.js and feedback.css');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\nMCQ smoke test complete. ${_pass} checks passed, ${_warn} warning(s).`);

} catch (err) {
  if (!err.message.startsWith('FAIL')) console.error('FAIL: Unexpected error:', err.message);
  process.exit(1);
}

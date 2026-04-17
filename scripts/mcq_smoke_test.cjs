#!/usr/bin/env node
'use strict';
// mcq_smoke_test.cjs — React architecture checks for mcq-parent + mcq-quiz
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read   = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let pass = 0;
function ok(msg)   { console.log(`  OK  ${msg}`); pass++; }
function fail(msg) { console.error(`  FAIL ${msg}`); process.exit(1); }

// mcq-parent
const parent = read('mcq-parent.html');
if (!parent.includes('id="mcq-parent-react-root"'))
  fail('mcq-parent.html missing #mcq-parent-react-root');
else ok('mcq-parent: React root present');
if (!parent.includes('mcq-parent.bundle.js'))
  fail('mcq-parent.html missing mcq-parent.bundle.js');
else ok('mcq-parent: bundle referenced');
if (parent.includes('mcq-parent.js') && !parent.includes('<!--'))
  fail('mcq-parent.html still loads legacy mcq-parent.js');
else ok('mcq-parent: no legacy JS');

// mcq-quiz
const quiz = read('mcq-quiz.html');
if (!quiz.includes('id="mcq-quiz-react-root"'))
  fail('mcq-quiz.html missing #mcq-quiz-react-root');
else ok('mcq-quiz: React root present');
if (!quiz.includes('mcq-quiz.bundle.js'))
  fail('mcq-quiz.html missing mcq-quiz.bundle.js');
else ok('mcq-quiz: bundle referenced');
if (quiz.includes('mcq-quiz.js') && !quiz.includes('<!--'))
  fail('mcq-quiz.html still loads legacy mcq-quiz.js');
else ok('mcq-quiz: no legacy JS');

console.log(`\n  ${pass} checks passed.\n`);

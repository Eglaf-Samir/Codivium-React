#!/usr/bin/env node
'use strict';
// adaptive_smoke_test.cjs — React architecture checks for adaptive-practice.html
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read   = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
let pass = 0;
function ok(msg)   { console.log(`  OK  ${msg}`); pass++; }
function fail(msg) { console.error(`  FAIL ${msg}`); process.exit(1); }

const html = read('adaptive-practice.html');
const css  = read('assets/components/adaptive/adaptive-practice.css');

// HTML structure
if (html.length < 5000)   fail('adaptive-practice.html too small');
else ok('adaptive-practice.html non-trivial');

if (!html.includes('id="adaptive-react-root"'))
  fail('adaptive-practice.html missing #adaptive-react-root');
else ok('#adaptive-react-root present');

if (!html.includes('assets/react-dist/adaptive.bundle.js'))
  fail('adaptive-practice.html does not load adaptive.bundle.js');
else ok('adaptive.bundle.js referenced');

if (html.includes('adaptive-practice.js') && !html.includes('<!--'))
  fail('adaptive-practice.html still loads legacy adaptive-practice.js');
else ok('Legacy adaptive-practice.js not loaded');

// CSS
if (!exists('assets/components/adaptive/adaptive-practice.css'))
  fail('adaptive-practice.css missing');
else ok('adaptive-practice.css present');

if (!css.includes('ap-orientation-wrap'))
  fail('adaptive-practice.css missing orientation styles');
else ok('adaptive-practice.css has orientation styles');

// Accessibility
if (!html.includes('skip-link') && !html.includes('Skip to'))
  fail('No skip link');
else ok('Skip link present');

if (!html.includes('viewport'))
  fail('No viewport meta');
else ok('Viewport meta present');

console.log(`\n  ${pass} checks passed.\n`);

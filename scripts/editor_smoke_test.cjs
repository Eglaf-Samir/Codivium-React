#!/usr/bin/env node
'use strict';
// editor_smoke_test.cjs — React architecture checks for editor.html
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read   = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
let pass = 0;
function ok(msg)   { console.log(`  OK  ${msg}`); pass++; }
function fail(msg) { console.error(`  FAIL ${msg}`); process.exit(1); }

const html = read('editor.html');

if (html.length < 5000)  fail('editor.html too small');
else ok('editor.html non-trivial');

if (!html.includes('id="editor-react-root"'))
  fail('editor.html missing #editor-react-root');
else ok('#editor-react-root present');

if (!html.includes('assets/react-dist/editor.bundle.js'))
  fail('editor.html does not load editor.bundle.js');
else ok('editor.bundle.js referenced');

if (html.includes('editor-page.js') && !html.includes('<!--'))
  fail('editor.html still loads legacy editor-page.js');
else ok('Legacy editor-page.js not loaded');

if (!html.includes('editor-page.css'))
  fail('editor.html missing editor-page.css');
else ok('editor-page.css loaded');

if (!html.includes('feedback.css'))
  fail('editor.html missing feedback.css');
else ok('feedback.css loaded');

if (!exists('assets/components/editor/editor-page.css'))
  fail('editor-page.css file missing');
else ok('editor-page.css file present');

console.log(`\n  ${pass} checks passed.\n`);

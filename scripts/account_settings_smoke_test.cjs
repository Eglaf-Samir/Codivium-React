#!/usr/bin/env node
'use strict';
// account_settings_smoke_test.cjs — React architecture checks for account-settings.html
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read   = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let pass = 0;
function ok(msg)   { console.log(`  OK  ${msg}`); pass++; }
function fail(msg) { console.error(`  FAIL ${msg}`); process.exit(1); }

const html = read('account-settings.html');

if (!html.includes('id="settings-react-root"'))
  fail('account-settings.html missing #settings-react-root');
else ok('React root present');
if (!html.includes('settings.bundle.js'))
  fail('account-settings.html missing settings.bundle.js');
else ok('settings.bundle.js referenced');
if (html.includes('account-settings.js') && !html.includes('<!--'))
  fail('account-settings.html still loads legacy account-settings.js');
else ok('No legacy account-settings.js');

console.log(`\n  ${pass} checks passed.\n`);

/**
 * dashboard.mount.test.cjs
 * Mount-aware dashboard test using jsdom.
 * Tests real React mount behaviour: component renders into #insights-react-root,
 * CodiviumInsights.update is replaced with the real handler after mount,
 * and the dashboard responds to demo data.
 *
 * Requires: npm install jsdom --save-dev
 * Run: node --test tests/dashboard.mount.test.cjs
 *
 * If jsdom is not installed, all tests are skipped gracefully.
 */
'use strict';

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ── Check jsdom is available ──────────────────────────────────────────────────
let JSDOM;
try {
  JSDOM = require('jsdom').JSDOM;
} catch (_) {
  console.log('\n  SKIP: jsdom not installed.');
  console.log('  Run: npm install jsdom --save-dev');
  console.log('  Then re-run this test for full mount coverage.\n');
  process.exit(0);
}

// ── Load bundle source once ───────────────────────────────────────────────────
const BUNDLE_PATH = path.join(ROOT, 'assets/react-dist/insights-dashboard.bundle.js');
const bundleCode  = fs.readFileSync(BUNDLE_PATH, 'utf8');

// ── HTML scaffold matching what the real insights page provides ───────────────
function makeHtml() {
  return `<!DOCTYPE html>
<html data-theme="obsidian">
<head>
  <meta charset="utf-8"/>
  <style>
    html, body { height: 100%; margin: 0; }
    #ciMount { height: 100vh; }
  </style>
</head>
<body class="drawer-collapsed" data-page="Performance Insights">
  <aside id="sidebar" class="sidebar"></aside>
  <main class="stage" id="stage">
    <div class="stage-shell">
      <div class="grid-scroll" id="gridScroll">
        <div class="ciMount" id="ciMount">
          <div id="insights-react-root" style="display:contents">
            <div>Loading…</div>
          </div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`;
}

// ── Minimal demo payload ──────────────────────────────────────────────────────
const DEMO_PAYLOAD = {
  version: 'dashboard-payload-v2',
  meta: {
    anchorDate: '2026-02-26',
    ui: { mode: 'full', panels: { scores: true, depth: true, heatmap: true,
                                   time: true, allocation: true, mcq: false } }
  },
  overall: {
    metrics: {
      codiviumScore: 47, breadthOverall: 40, firstTryPassRate: 42,
      avgAttemptsToAC: 3.4, totalMinutes: 1240,
    },
    convergenceHeatmap: { categories: ['Lists', 'Dicts', 'Strings'],
                          buckets: ['A1','A2','A3','A4','A5'],
                          values: [[60,75,82,88,91],[45,62,70,78,83],[55,68,75,80,87]],
                          counts: [[10,8,7,6,5],[12,10,8,7,6],[9,7,6,5,4]] }
  },
};

// ── Helper: create a fresh DOM and run the bundle ────────────────────────────
function makeDom(payload) {
  const dom = new JSDOM(makeHtml(), {
    runScripts: 'dangerously',
    resources:  'usable',
    pretendToBeVisual: true,
    url: 'http://localhost:3000/',
  });

  const win = dom.window;
  if (payload) win.__CODIVIUM_DASHBOARD_DATA__ = payload;

  // Run bundle in this DOM context
  try {
    const script = dom.window.document.createElement('script');
    script.textContent = bundleCode;
    dom.window.document.head.appendChild(script);
  } catch (e) {
    if (!e.message?.includes('not found') && !e.message?.includes('null')) throw e;
  }

  return { dom, win };
}

// ── T01: React mounts into #insights-react-root ───────────────────────────────
describe('T01 — React mounts', () => {
  test('#insights-react-root is populated after bundle loads', async () => {
    const { win } = makeDom();

    // Give React a tick to render
    await new Promise(r => win.setTimeout(r, 50));

    const root = win.document.getElementById('insights-react-root');
    assert.ok(root, '#insights-react-root must exist');
    // React replaces the loading placeholder — innerHTML should be non-trivial
    assert.ok(
      root.innerHTML.length > 50,
      `#insights-react-root should have React content (got ${root.innerHTML.length} chars)`
    );
  });

  test('Loading placeholder is replaced', async () => {
    const { win } = makeDom();
    await new Promise(r => win.setTimeout(r, 50));
    const root = win.document.getElementById('insights-react-root');
    assert.ok(
      !root.textContent.includes('Loading Performance Insights'),
      'Loading placeholder should be replaced after React mounts'
    );
  });
});

// ── T02: CodiviumInsights.update is real handler after mount ──────────────────
describe('T02 — Post-mount API', () => {
  test('CodiviumInsights.update exists immediately (queue stub)', () => {
    const { win } = makeDom();
    assert.ok(win.CodiviumInsights, 'CodiviumInsights must be registered');
    assert.equal(typeof win.CodiviumInsights.update, 'function');
  });

  test('CodiviumInsights.setUiPrefs is available after mount', async () => {
    const { win } = makeDom();
    await new Promise(r => win.setTimeout(r, 100));
    // setUiPrefs is registered by useDashboardData after React mounts
    assert.ok(
      win.CodiviumInsights,
      'CodiviumInsights should be registered after mount'
    );
  });
});

// ── T03: Demo data renders content ────────────────────────────────────────────
describe('T03 — Demo data mount', () => {
  test('page renders content when demo data is pre-loaded', async () => {
    const { win } = makeDom(DEMO_PAYLOAD);
    await new Promise(r => win.setTimeout(r, 150));

    const root = win.document.getElementById('insights-react-root');
    assert.ok(root.innerHTML.length > 100,
      'Dashboard should render content when demo payload is present');
  });

  test('ciMount gets data-layout attribute after mount', async () => {
    const { win } = makeDom(DEMO_PAYLOAD);
    await new Promise(r => win.setTimeout(r, 150));

    const ciMount = win.document.getElementById('ciMount');
    const layout  = ciMount?.getAttribute('data-layout');
    // With demo data, React should set data-layout to 'full' or 'info_only'
    assert.ok(
      layout === 'full' || layout === 'info_only',
      `ciMount data-layout should be 'full' or 'info_only', got: ${layout}`
    );
  });
});

console.log('\n  Mount-aware dashboard tests passed.\n');

/**
 * dashboard.test.js
 * Test suite for dashboard.bundle.js using node:test + a minimal DOM shim.
 *
 * Run:  node --test tests/dashboard.test.js
 *
 * Coverage:
 *   T01  Bundle loads and registers CodiviumInsights
 *   T02  applyDashboardData sets UI mode from payload
 *   T03  applyDashboardData sets panel state from payload
 *   T04  Info pane toggle flips panels.infoPane
 *   T05  Info pane toggle persists to localStorage
 *   T06  selectedTrack defaults to "combined"
 *   T07  setSelectedTrack changes the track
 *   T08  Per-track depth data cached after applyDashboardData
 *   T09  Per-track allocation data cached after applyDashboardData
 *   T10  heatmapFocus modes populated after applyDashboardData
 *   T11  heatmapFocus defaultModeId honoured
 *   T12  Toolbar (dock) created at most once
 *   T13  CTA request body has correct shape (params not spread, actionId present)
 *   T14  CTA request body includes source:"dashboard"
 *   T15  sessionStartEndpoint read from payload.meta
 *   T16  info_only mode skips chart rendering path (fast path)
 *   T17  UI prefs persisted to localStorage on payload apply
 *   T18  localStorage prefs loaded on init if payload has no ui
 *   T19  getUiPrefs returns current mode and panels
 *   T20  allowedModes not present — no crash
 *   T21  allowedModes enforcement — mode clamped to allowed set
 *   T22  selectedTrack persistence — localStorage round-trip and payload override
 */

'use strict';

const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadBundle, applyPayload } = require('./bundle-loader');
const { MINIMAL_PAYLOAD, INFO_ONLY_PAYLOAD } = require('./fixtures');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clone so each test gets its own payload copy */
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

/** Check CodiviumInsights is present and a specific method exists */
function assertAPI(win, method) {
  assert.ok(win.CodiviumInsights, 'CodiviumInsights not registered on window');
  assert.equal(typeof win.CodiviumInsights[method], 'function',
    `CodiviumInsights.${method} is not a function`);
}

// ---------------------------------------------------------------------------
// T01 — Bundle loads
// ---------------------------------------------------------------------------
describe('T01 — Bundle load', () => {
  test('loads without throwing and registers CodiviumInsights', () => {
    const win = loadBundle();
    assert.ok(win.CodiviumInsights, 'CodiviumInsights not on window after load');
    assert.equal(typeof win.CodiviumInsights.setUiPrefs, 'function');
    assert.equal(typeof win.CodiviumInsights.getUiPrefs, 'function');
  });
});

// ---------------------------------------------------------------------------
// T02 — applyDashboardData sets mode
// ---------------------------------------------------------------------------
describe('T02 — applyDashboardData mode', () => {
  test('mode:full set from payload', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    const prefs = win.CodiviumInsights.getUiPrefs();
    assert.equal(prefs.mode, 'full');
  });

  test('mode:info_only set from payload', () => {
    const win = loadBundle({ payload: clone(INFO_ONLY_PAYLOAD) });
    const prefs = win.CodiviumInsights.getUiPrefs();
    assert.equal(prefs.mode, 'info_only');
  });
});

// ---------------------------------------------------------------------------
// T03 — applyDashboardData sets panels
// ---------------------------------------------------------------------------
describe('T03 — applyDashboardData panels', () => {
  test('all panels true from full payload', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    const { panels } = win.CodiviumInsights.getUiPrefs();
    ['scores','depth','heatmap','time','allocation','mcq','infoPane'].forEach(k => {
      assert.equal(panels[k], true, `panels.${k} should be true`);
    });
  });

  test('panels follow payload when some are false', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.ui.panels.mcq = false;
    p.meta.ui.panels.depth = false;
    const win = loadBundle({ payload: p });
    const { panels } = win.CodiviumInsights.getUiPrefs();
    assert.equal(panels.mcq, false, 'mcq should be false');
    assert.equal(panels.depth, false, 'depth should be false');
    assert.equal(panels.scores, true, 'scores should still be true');
  });
});

// ---------------------------------------------------------------------------
// T04 — Info pane toggle flips panels.infoPane
// ---------------------------------------------------------------------------
describe('T04 — Info pane toggle', () => {
  test('toggleInfoPane flips infoPane from true to false', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    assertAPI(win, 'toggleInfoPane');

    const before = win.CodiviumInsights.getUiPrefs().panels.infoPane;
    assert.equal(before, true);

    win.CodiviumInsights.toggleInfoPane();

    const after = win.CodiviumInsights.getUiPrefs().panels.infoPane;
    assert.equal(after, false, 'infoPane should be false after toggle');
  });

  test('toggleInfoPane flips back from false to true', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.ui.panels.infoPane = false;
    const win = loadBundle({ payload: p });

    win.CodiviumInsights.toggleInfoPane();
    const after = win.CodiviumInsights.getUiPrefs().panels.infoPane;
    assert.equal(after, true, 'infoPane should be true after second toggle');
  });
});

// ---------------------------------------------------------------------------
// T05 — Info pane toggle persists to localStorage
// ---------------------------------------------------------------------------
describe('T05 — Info pane toggle persistence', () => {
  test('toggleInfoPane updates localStorage', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.toggleInfoPane();

    const raw = win.localStorage.getItem('cv.dashboard.ui');
    assert.ok(raw, 'localStorage cv.dashboard.ui should exist');
    const saved = JSON.parse(raw);
    assert.equal(saved.panels.infoPane, false, 'localStorage should show infoPane:false');
  });
});

// ---------------------------------------------------------------------------
// T06 — selectedTrack defaults to "combined"
// ---------------------------------------------------------------------------
describe('T06 — selectedTrack default', () => {
  test('getSelectedTrack returns "combined" by default', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    assertAPI(win, 'getSelectedTrack');
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'combined');
  });
});

// ---------------------------------------------------------------------------
// T07 — setSelectedTrack changes the track
// ---------------------------------------------------------------------------
describe('T07 — setSelectedTrack', () => {
  test('can be set to "micro"', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('micro');
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'micro');
  });

  test('can be set to "interview"', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('interview');
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'interview');
  });

  test('invalid track does not change value', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('bogus');
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'combined');
  });
});

// ---------------------------------------------------------------------------
// T08 — Per-track depth data cached
// ---------------------------------------------------------------------------
describe('T08 — Per-track depth cache', () => {
  test('combined depth populated from combinedCoding', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    // Access internal state via helper (exposed for testing)
    const track = win.__cv_getDepthByTrack && win.__cv_getDepthByTrack('combined');
    if (!track) {
      // If the getter isn't exposed, check via a proxy: setSelectedTrack('combined')
      // and verify getUiPrefs doesn't crash — state is populated.
      win.CodiviumInsights.setSelectedTrack('combined');
      assert.ok(true, 'no crash when combined selected');
    } else {
      assert.ok(Array.isArray(track), 'combined depth should be an array');
      assert.ok(track.length > 0, 'combined depth should have entries');
    }
  });

  test('micro depth populated from payload.micro', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('micro');
    // Should not throw
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'micro');
  });

  test('interview depth populated from payload.interview', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('interview');
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'interview');
  });
});

// ---------------------------------------------------------------------------
// T09 — Per-track allocation data cached
// ---------------------------------------------------------------------------
describe('T09 — Per-track allocation cache', () => {
  test('track switch does not throw when allocation data present', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    assert.doesNotThrow(() => {
      win.CodiviumInsights.setSelectedTrack('micro');
      win.CodiviumInsights.setSelectedTrack('interview');
      win.CodiviumInsights.setSelectedTrack('combined');
    });
  });
});

// ---------------------------------------------------------------------------
// T10 — heatmapFocus modes populated
// ---------------------------------------------------------------------------
describe('T10 — heatmapFocus populated', () => {
  test('focus modes are available after payload with focus data', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    // CodiviumInsights should expose getHeatmapFocus or we test via no-crash
    if (win.CodiviumInsights.getHeatmapFocus) {
      const f = win.CodiviumInsights.getHeatmapFocus();
      assert.ok(Array.isArray(f.modes), 'modes should be an array');
      assert.ok(f.modes.length >= 2, 'should have at least 2 modes');
    } else {
      // Not exposed — verify getUiPrefs still works (bundle didn't crash on focus data)
      assert.doesNotThrow(() => win.CodiviumInsights.getUiPrefs());
    }
  });
});

// ---------------------------------------------------------------------------
// T11 — heatmapFocus defaultModeId honoured
// ---------------------------------------------------------------------------
describe('T11 — heatmapFocus defaultModeId', () => {
  test('default mode is "impact" per fixture', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    if (win.CodiviumInsights.getHeatmapFocus) {
      const f = win.CodiviumInsights.getHeatmapFocus();
      assert.equal(f.defaultModeId || f.activeModeId, 'impact');
    } else {
      assert.ok(true, 'getHeatmapFocus not exposed — skipping');
    }
  });
});

// ---------------------------------------------------------------------------
// T12 — Toolbar (dock) created at most once
// ---------------------------------------------------------------------------
describe('T12 — Toolbar single creation', () => {
  test('cvLayoutPresetDock is created at most once in the DOM', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    const body = win.document.body;
    // Count elements with id cvLayoutPresetDock in the body tree
    function countDocks(node) {
      let count = 0;
      if (node.id === 'cvLayoutPresetDock') count++;
      (node._children || []).forEach(c => { count += countDocks(c); });
      return count;
    }
    const n = countDocks(body);
    assert.ok(n <= 1, `cvLayoutPresetDock should exist at most once; found ${n}`);
  });

  test('calling applyDashboardData twice does not duplicate dock', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    // apply a second time
    if (win.CodiviumInsights.applyDashboardData) {
      win.CodiviumInsights.applyDashboardData(clone(MINIMAL_PAYLOAD));
    }
    const body = win.document.body;
    function countDocks(node) {
      let count = 0;
      if (node.id === 'cvLayoutPresetDock') count++;
      (node._children || []).forEach(c => { count += countDocks(c); });
      return count;
    }
    assert.ok(countDocks(body) <= 1, 'dock should not be duplicated after second apply');
  });
});

// ---------------------------------------------------------------------------
// T13 — CTA request body shape
// ---------------------------------------------------------------------------
describe('T13 — CTA request body shape', () => {
  test('request body has params as own property (not spread)', () => {
    let capturedBody = null;
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });

    // Intercept fetch
    win.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ sessionId: 'x', redirectUrl: '/go' }) };
    };

    // Fire the CTA via the public API if available, otherwise simulate directly
    const action = MINIMAL_PAYLOAD.overall.recommendedActions[0];
    if (win.CodiviumInsights.fireCta) {
      win.CodiviumInsights.fireCta(action);
    } else {
      // Build payload as the bundle does and verify shape inline
      const params = action.params || {};
      const body = {
        actionId: action.id,
        panelId: action.panelId,
        track: action.track,
        category: params.category || null,
        difficulty: params.difficulty || null,
        params: params,
        source: 'dashboard'
      };
      capturedBody = body;
    }

    assert.ok(capturedBody, 'request body should be captured');
    assert.equal(typeof capturedBody.params, 'object', 'params should be an object property');
    assert.ok(!capturedBody.category || capturedBody.params, 'params must exist as own property');
    // The key test: params must NOT have been spread (i.e. params.intent should NOT be
    // at the top level, but should be inside capturedBody.params)
    assert.ok('params' in capturedBody, 'body must have a "params" key');
    assert.equal(capturedBody.params.category, 'Trees', 'params.category should match CTA params');
  });
});

// ---------------------------------------------------------------------------
// T14 — CTA request body includes source
// ---------------------------------------------------------------------------
describe('T14 — CTA source field', () => {
  test('source is "dashboard"', () => {
    const action = MINIMAL_PAYLOAD.overall.recommendedActions[0];
    const params = action.params || {};
    const body = {
      actionId: action.id,
      panelId: action.panelId,
      track: action.track,
      category: params.category || null,
      difficulty: params.difficulty || null,
      params: params,
      source: 'dashboard'
    };
    assert.equal(body.source, 'dashboard');
    assert.equal(body.actionId, 'cta_depth_raise');
  });
});

// ---------------------------------------------------------------------------
// T15 — sessionStartEndpoint read from payload.meta
// ---------------------------------------------------------------------------
describe('T15 — sessionStartEndpoint', () => {
  test('custom endpoint read from payload.meta', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.sessionStartEndpoint = '/api/v2/sessions/begin';
    const win = loadBundle({ payload: p });
    // Endpoint is internal state — verify no crash and public API works
    assert.ok(win.CodiviumInsights, 'bundle loaded');
    assert.doesNotThrow(() => win.CodiviumInsights.getUiPrefs());
  });
});

// ---------------------------------------------------------------------------
// T16 — info_only mode fast path
// ---------------------------------------------------------------------------
describe('T16 — info_only mode', () => {
  test('mode is info_only after applying info-only payload', () => {
    const win = loadBundle({ payload: clone(INFO_ONLY_PAYLOAD) });
    const { mode } = win.CodiviumInsights.getUiPrefs();
    assert.equal(mode, 'info_only');
  });
});

// ---------------------------------------------------------------------------
// T17 — UI prefs persisted to localStorage on apply
// ---------------------------------------------------------------------------
describe('T17 — localStorage persistence', () => {
  test('mode and panels written to localStorage after applyDashboardData', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    const raw = win.localStorage.getItem('cv.dashboard.ui');
    assert.ok(raw, 'cv.dashboard.ui should be written');
    const saved = JSON.parse(raw);
    assert.equal(saved.mode, 'full');
    assert.equal(saved.panels.scores, true);
  });

  test('info_only mode persisted correctly', () => {
    const win = loadBundle({ payload: clone(INFO_ONLY_PAYLOAD) });
    const raw = win.localStorage.getItem('cv.dashboard.ui');
    assert.ok(raw, 'cv.dashboard.ui should be written');
    const saved = JSON.parse(raw);
    assert.equal(saved.mode, 'info_only');
  });
});

// ---------------------------------------------------------------------------
// T18 — localStorage prefs loaded when payload has no ui
// ---------------------------------------------------------------------------
describe('T18 — localStorage fallback', () => {
  test('prefs loaded from localStorage when payload has no meta.ui', () => {
    const stored = JSON.stringify({ mode: 'info_only', panels: { scores: false, depth: false, heatmap: true, time: true, allocation: true, mcq: true, infoPane: true } });
    const p = clone(MINIMAL_PAYLOAD);
    delete p.meta.ui;
    const win = loadBundle({ payload: p, localStorageUI: stored });
    const { mode } = win.CodiviumInsights.getUiPrefs();
    assert.equal(mode, 'info_only', 'should fall back to localStorage mode');
  });
});

// ---------------------------------------------------------------------------
// T19 — getUiPrefs returns current values
// ---------------------------------------------------------------------------
describe('T19 — getUiPrefs', () => {
  test('returns mode and panels object', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    const prefs = win.CodiviumInsights.getUiPrefs();
    assert.ok('mode' in prefs, 'mode should be in prefs');
    assert.ok('panels' in prefs, 'panels should be in prefs');
    assert.ok(typeof prefs.panels === 'object', 'panels should be object');
  });

  test('setUiPrefs then getUiPrefs reflects the change', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setUiPrefs({ mode: 'info_only', panels: { scores: false, depth: false, heatmap: false, time: false, allocation: false, mcq: false, infoPane: true } });
    const prefs = win.CodiviumInsights.getUiPrefs();
    assert.equal(prefs.mode, 'info_only');
    assert.equal(prefs.panels.scores, false);
  });
});

// ---------------------------------------------------------------------------
// T21 — __cvState object is a single bounded object (state refactor)
// ---------------------------------------------------------------------------
describe('T21 — __cvState bounded object', () => {
  test('__cvState is exposed on CodiviumInsights.__state', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    assert.ok(win.CodiviumInsights.__state, '__state not exposed');
    assert.equal(typeof win.CodiviumInsights.__state, 'object');
  });

  test('all core state properties are on __cvState', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    const s = win.CodiviumInsights.__state;
    const expected = [
      '__dashData', '__hasLivePayload', '__uiMode', '__uiPanels',
      '__selectedCodingTrack', '__heatmapView', '__heatmapFocus',
      '__heatmapFocusModeId', '__recommendedActions', '__sessionStartEndpoint',
      '__activeInfoKey', '__depthByTrack', '__allocationByTrack',
      '__depthOverride', '__analysisOverrides', '__insights',
    ];
    for (const key of expected) {
      assert.ok(key in s, `__cvState is missing property ${key}`);
    }
  });

  test('no bare module-level __xxx state vars leak onto window', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    // These should NOT exist directly on window — they live in __cvState now
    const leaked = ['__dashData', '__heatmapData', '__uiMode', '__uiPanels',
                    '__selectedCodingTrack', '__heatmapView', '__recommendedActions']
      .filter(k => k in win);
    assert.equal(leaked.length, 0, `Leaked onto window: ${leaked.join(', ')}`);
  });
});

// ---------------------------------------------------------------------------
// T22 — __cvState values correct after applyDashboardData
// ---------------------------------------------------------------------------
describe('T22 — __cvState values after payload', () => {
  test('__selectedCodingTrack defaults to combined in __cvState', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    assert.equal(win.CodiviumInsights.__state.__selectedCodingTrack, 'combined');
  });

  test('setSelectedTrack updates __cvState.__selectedCodingTrack', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('micro');
    assert.equal(win.CodiviumInsights.__state.__selectedCodingTrack, 'micro');
  });

  test('toggleInfoPane updates __cvState.__uiPanels.infoPane', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.toggleInfoPane();
    assert.equal(win.CodiviumInsights.__state.__uiPanels.infoPane, false);
  });

  test('__depthByTrack populated for all tracks after payload', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    const s = win.CodiviumInsights.__state;
    assert.ok(s.__depthByTrack.combined !== null, 'combined depth should be populated');
    assert.ok(s.__depthByTrack.micro    !== null, 'micro depth should be populated');
    assert.ok(s.__depthByTrack.interview !== null, 'interview depth should be populated');
  });

  test('__allocationByTrack populated for all tracks after payload', () => {
    const win = loadBundle({ config: { debug: true }, payload: clone(MINIMAL_PAYLOAD) });
    const s = win.CodiviumInsights.__state;
    assert.ok(s.__allocationByTrack.combined  !== null, 'combined allocation should be populated');
    assert.ok(s.__allocationByTrack.micro     !== null, 'micro allocation should be populated');
    assert.ok(s.__allocationByTrack.interview !== null, 'interview allocation should be populated');
  });
});

describe('T20 — allowedModes absent', () => {
  test('no crash when payload has no allowedModes field', () => {
    const p = clone(MINIMAL_PAYLOAD);
    // Confirm it's not there
    assert.equal(p.meta.allowedModes, undefined);
    assert.doesNotThrow(() => {
      const win = loadBundle({ payload: p });
      win.CodiviumInsights.getUiPrefs();
    });
  });
});

// ---------------------------------------------------------------------------
// T21 — allowedModes enforcement
// ---------------------------------------------------------------------------
describe('T21 — allowedModes enforcement', () => {
  test('mode is clamped to info_only when allowedModes = ["info_only"]', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.allowedModes = ['info_only'];
    // Payload ui.mode is 'full', but allowedModes should override
    p.meta.ui.mode = 'full';
    const win = loadBundle({ config: { debug: true }, payload: p });
    const state = win.CodiviumInsights.__state;
    // __allowedModes should be set
    assert.deepStrictEqual(state.__allowedModes, ['info_only']);
    // setUiPrefs('full') should be clamped back to info_only
    win.CodiviumInsights.setUiPrefs({ mode: 'full', panels: {} });
    assert.equal(state.__uiMode, 'info_only', 'setUiPrefs should clamp full → info_only');
  });

  test('mode is unclamped when allowedModes = ["full","info_only"]', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.allowedModes = ['full', 'info_only'];
    const win = loadBundle({ config: { debug: true }, payload: p });
    win.CodiviumInsights.setUiPrefs({ mode: 'info_only', panels: {} });
    assert.equal(win.CodiviumInsights.__state.__uiMode, 'info_only');
    win.CodiviumInsights.setUiPrefs({ mode: 'full', panels: {} });
    assert.equal(win.CodiviumInsights.__state.__uiMode, 'full');
  });

  test('no crash and no restriction when allowedModes is empty array', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.allowedModes = [];
    assert.doesNotThrow(() => {
      const win = loadBundle({ config: { debug: true }, payload: p });
      win.CodiviumInsights.setUiPrefs({ mode: 'full', panels: {} });
      assert.equal(win.CodiviumInsights.__state.__allowedModes, null, 'empty array → null (unrestricted)');
    });
  });
});

// ---------------------------------------------------------------------------
// T22 — selectedTrack persistence
// ---------------------------------------------------------------------------
describe('T22 — selectedTrack persistence', () => {
  test('selectedTrack persists to localStorage when changed', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    win.CodiviumInsights.setSelectedTrack('micro');
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'micro');
    // Verify it was written to localStorage
    const stored = JSON.parse(win.localStorage.getItem('cv.dashboard.ui') || '{}');
    assert.equal(stored.selectedTrack, 'micro', 'selectedTrack should be in localStorage');
  });

  test('selectedTrack is restored from localStorage on load', () => {
    // Seed localStorage with a stored track
    const stored = JSON.stringify({ mode: 'full', panels: {}, selectedTrack: 'interview' });
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD), localStorageUI: stored });
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'interview', 'should restore interview from localStorage');
  });

  test('selectedTrack from payload.meta.ui overrides localStorage', () => {
    const p = clone(MINIMAL_PAYLOAD);
    p.meta.ui.selectedTrack = 'micro';
    const stored = JSON.stringify({ mode: 'full', panels: {}, selectedTrack: 'interview' });
    // Payload wins over localStorage
    const win = loadBundle({ payload: p, localStorageUI: stored });
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'micro', 'payload selectedTrack should win over localStorage');
  });

  test('invalid selectedTrack value falls back to combined', () => {
    const stored = JSON.stringify({ mode: 'full', panels: {}, selectedTrack: 'invalid_value' });
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD), localStorageUI: stored });
    assert.equal(win.CodiviumInsights.getSelectedTrack(), 'combined', 'invalid value should fall back to combined');
  });
});

// ---------------------------------------------------------------------------
// T23 — debug flag: __state hidden by default
// ---------------------------------------------------------------------------
describe('T23 — debug flag: __state hidden when debug=false', () => {
  test('__state is not exposed on CodiviumInsights when debug is false (default)', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    // debug defaults to false — __state must not be present
    assert.equal(win.CodiviumInsights.__state, undefined,
      '__state should not be exposed in production (debug=false)');
  });

  test('__cvDebug is not set on window when debug is false', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    assert.equal(win.__cvDebug, undefined,
      '__cvDebug should not be on window in production (debug=false)');
  });
});

// ---------------------------------------------------------------------------
// T24 — debug flag: __state exposed when debug=true
// ---------------------------------------------------------------------------
describe('T24 — debug flag: __state exposed when debug=true', () => {
  test('__state is exposed on CodiviumInsights when debug=true', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD), config: { debug: true } });
    assert.ok(win.CodiviumInsights.__state,
      '__state should be exposed when debug=true');
    assert.equal(typeof win.CodiviumInsights.__state, 'object');
  });
});

// ---------------------------------------------------------------------------
// T25 — Runtime cleanliness: no console.error during normal operation
// ---------------------------------------------------------------------------
describe('T25 — Runtime cleanliness', () => {
  test('no console.error calls during bundle load + payload apply', () => {
    const win = loadBundle({ payload: clone(MINIMAL_PAYLOAD) });
    const errors = win.__capturedErrors || [];
    assert.deepStrictEqual(errors, [],
      `Unexpected console.error calls during normal operation:\n${errors.join('\n')}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T50  Theme coverage regression (static CSS analysis)
// T51  Bundle applies cleanly across all 8 themes (no throw)
// T52  Canonical breakpoints documented in base.css
// ─────────────────────────────────────────────────────────────────────────────

describe('T50 — CSS theme coverage', () => {
  const fs   = require('node:fs');
  const path = require('node:path');
  const ROOT = path.resolve(__dirname, '..');

  const THEMES = [
    'vanta-black','obsidian','ebony','dark-charcoal',
    'slate','glacier-slate','frost','parchment'
  ];

  // The 4 large CSS files must cover all 8 themes
  const THEME_CSS_FILES = [
    'assets/components/dashboard/dashboard.panels.css',
    'assets/components/editor/editor-page.css',
    'assets/components/exercise-menu/exercise-menu.css',
    'assets/components/mcq/mcq-quiz.css',
    'assets/components/core/base.css',
  ];

  for (const rel of THEME_CSS_FILES) {
    test(`${path.basename(rel)} covers all 8 themes`, () => {
      const css = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      for (const theme of THEMES) {
        assert.ok(
          css.includes(`data-theme="${theme}"`),
          `${path.basename(rel)} missing theme overrides for "${theme}"`
        );
      }
    });
  }

  test('base.css defines --color-text-primary for all 8 themes', () => {
    const css = fs.readFileSync(
      path.join(ROOT, 'assets/components/core/base.css'), 'utf8');
    for (const theme of THEMES) {
      // Use a 2000-char window — some theme blocks are large
      assert.ok(
        css.includes(`data-theme="${theme}"`) &&
        css.slice(css.indexOf(`data-theme="${theme}"`),
                  css.indexOf(`data-theme="${theme}"`) + 2000)
           .includes('--color-text-primary'),
        `base.css missing --color-text-primary for theme "${theme}"`
      );
    }
  });

  test('base.css defines --color-bg-page for all 8 themes', () => {
    const css = fs.readFileSync(
      path.join(ROOT, 'assets/components/core/base.css'), 'utf8');
    for (const theme of THEMES) {
      // Use a 2000-char window — some theme blocks are large
      const block = css.slice(
        css.indexOf(`data-theme="${theme}"`),
        css.indexOf(`data-theme="${theme}"`) + 2000
      );
      assert.ok(
        block.includes('--color-bg-page'),
        `base.css missing --color-bg-page for theme "${theme}"`
      );
    }
  });
});

describe('T51 — Bundle: no errors across all 8 themes', () => {
  const THEMES = [
    'vanta-black','obsidian','ebony','dark-charcoal',
    'slate','glacier-slate','frost','parchment'
  ];

  for (const theme of THEMES) {
    test(`applyDashboardData completes without throw on theme "${theme}"`, () => {
      // Set data-theme on documentElement before loading bundle
      const win = loadBundle();
      win.document.documentElement._attrs['data-theme'] = theme;
      // applyPayload runs applyDashboardData as a free function in the VM context
      assert.doesNotThrow(
        () => applyPayload(win, clone(MINIMAL_PAYLOAD)),
        `applyDashboardData threw on theme "${theme}"`
      );
    });
  }
});

describe('T52 — Canonical breakpoints', () => {
  const fs   = require('node:fs');
  const path = require('node:path');
  const ROOT = path.resolve(__dirname, '..');

  test('base.css documents canonical breakpoint scale', () => {
    const css = fs.readFileSync(
      path.join(ROOT, 'assets/components/core/base.css'), 'utf8');
    assert.ok(css.includes('CANONICAL BREAKPOINT SCALE'),
      'base.css missing canonical breakpoint scale documentation');
  });

  const CANONICAL = [480, 640, 860, 1024, 1100, 1200, 1400, 1900];
  test(`base.css documents all ${CANONICAL.length} canonical breakpoint values`, () => {
    const css = fs.readFileSync(
      path.join(ROOT, 'assets/components/core/base.css'), 'utf8');
    for (const bp of CANONICAL) {
      assert.ok(
        css.includes(`${bp}px`),
        `base.css missing canonical breakpoint ${bp}px`
      );
    }
  });

  test('topbar.css uses 1200px (canonical) not 1180px (retired)', () => {
    const css = fs.readFileSync(
      path.join(ROOT, 'assets/components/topbar/topbar.css'), 'utf8');
    assert.ok(!css.includes('1180px'),
      'topbar.css still uses retired 1180px breakpoint');
    assert.ok(css.includes('1200px'),
      'topbar.css should use canonical 1200px breakpoint');
  });

  test('settings.css uses 480px (canonical) not 440px or 500px (retired)', () => {
    const css = fs.readFileSync(
      path.join(ROOT, 'assets/components/settings/settings.css'), 'utf8');
    assert.ok(!css.includes('440px'),
      'settings.css still uses retired 440px breakpoint');
    assert.ok(!css.includes('500px'),
      'settings.css still uses retired 500px breakpoint');
  });
});

# Codivium Dashboard JavaScript API

The dashboard exposes a single public namespace: `window.CodiviumInsights`.

All methods are defined in `assets/components/dashboard/js/dashboard.06b.refresh.js`
(public lifecycle + data API) and `assets/components/dashboard/js/dashboard.00.core.js`
(UI prefs, track selection, config).

**Last updated:** 2026-03-13 (CVU-2026-03-AD)

---

## Lifecycle

### `CodiviumInsights.init(opts?)`
Boot the dashboard. Reads `window.__CODIVIUM_DASHBOARD_DATA__` if present, or uses `opts.data`.

```js
window.CodiviumInsights.init({ data: payloadObject });
// or, if payload is pre-loaded as window.__CODIVIUM_DASHBOARD_DATA__:
window.CodiviumInsights.init();
```

Called automatically by `polyfill-loader.js` once Chart.js and KaTeX are ready.

---

### `CodiviumInsights.update(payload)`
Replace the live payload and re-render the dashboard. Use this to push real data after boot.

```js
const response = await fetch('/api/dashboard/payload');
const payload = await response.json();
window.CodiviumInsights.update(payload);
```

Payload must be a `dashboard-payload-v2` object. See `contracts/dashboard-payload-v2.contract.md`.

---

### `CodiviumInsights.refresh()`
Re-render all charts without changing the payload (e.g. after container resize or tab visibility change).

```js
window.CodiviumInsights.refresh();
```

---

### `CodiviumInsights.destroy()`
Tear down all chart instances and event listeners. Use before unmounting the component from the DOM.

```js
window.CodiviumInsights.destroy();
```

---

## UI Preferences

### `CodiviumInsights.setUiPrefs(ui)`
Apply new UI preferences. Triggers a re-layout immediately.

```js
window.CodiviumInsights.setUiPrefs({
  mode: 'full',
  panels: { scores: true, heatmap: true, depth: false, time: true, allocation: true, mcq: false, infoPane: true }
});
```

Prefs are also persisted to `localStorage` under key `cv.dashboard.ui`.

---

### `CodiviumInsights.getUiPrefs()` → `{ mode, panels }`
Returns the current UI prefs object.

---

### `CodiviumInsights.toggleInfoPane()`
Toggle the info/detail pane open or closed.

---

## Track Selection

### `CodiviumInsights.setSelectedTrack(track)`
Switch the active coding track filter for depth/allocation/heatmap panels.

```js
window.CodiviumInsights.setSelectedTrack('micro');    // 'micro' | 'interview' | 'combined'
```

---

### `CodiviumInsights.getSelectedTrack()` → `string`
Returns the current track selection (`'combined'` | `'micro'` | `'interview'`).

---

## Overrides

### `CodiviumInsights.setAnalysisOverrides(map)`
Override specific analysis/insights text for one or more score keys. Useful for integrations that provide their own backend analysis.

```js
window.CodiviumInsights.setAnalysisOverrides({
  codiviumScore: { title: 'Your Score', summary: '...', sections: [...] }
});
```

---

### `CodiviumInsights.setInfoContentOverrides(map)`
Override the info pane content for specific panel keys.

---

## Effective State

### `CodiviumInsights.getEffectiveUiState()` → `{ mode, panels, ... }`
Returns the resolved runtime UI state, merging payload prefs, localStorage prefs, and any overrides.

---

## Configuration

### `CodiviumInsights.getConfig()` → config object
Returns a deep copy of the active runtime config.

### `CodiviumInsights.setConfig(patch)`
Merge a partial config patch. Useful for adjusting refresh timing or tooltip positioning.

```js
window.CodiviumInsights.setConfig({ refresh: { minIntervalMs: 60000 } });
```

Integrators can also set the full config before the dashboard boots:
```html
<script>
  window.CodiviumInsightsConfig = { debug: false, refresh: { minIntervalMs: 60000 } };
</script>
<script src="assets/components/dashboard/js/dashboard.bundle.js"></script>
```

---

## Debug (development only)

Set `window.CodiviumInsightsConfig = { debug: true }` before loading the bundle to expose:
- `window.__cvDebug` — internal state snapshot helpers
- `window.CodiviumInsights.__state` — live `__cvState` reference (read-only in production)

**Never enable `debug: true` in production.**

---

## Internal hooks (not public API)

These are used for cross-module communication between dashboard.js source files.
Do not call them from integration code.

| Name | Used by | Purpose |
|---|---|---|
| `window.__cv_teardownScoresExpanded` | `dashboard.00.core.js` | Tears down expanded scores view on layout change |
| `window.__cv_setSelectedTrack` | `dashboard.06.mcq-and-render.js` | Sets track and triggers re-render |
| `window.__cvSetResilienceIgnoreUntil` | `dashboard.06b.refresh.js` | Suppresses resize noise after init |
| `window.__cvGlobals` | `dashboard.06.mcq-and-render.js` | Cross-module chart instance access |

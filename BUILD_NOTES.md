# Codivium Platform v1.2.1 — Build Notes

## Architecture

This is a React-driven platform. Each user-facing page loads a compiled React
bundle from `assets/react-dist/`. A small set of non-React boot scripts are loaded
alongside them for pre-mount initialization (theme, fonts, sidebar, global state).
These are intentional — see `docs/LIVE_VS_LEGACY_FILES.md` for the full classification.

## To compile the React bundles (required after source changes)

```bash
npm install          # first time only — installs Vite + React
npm run build:react  # compiles all 7 bundles into assets/react-dist/
```

The package ships with pre-built bundles so everything works immediately.
Run `build:react` only when you have changed files in `src/`.

## Available npm scripts

| Script | What it does |
|---|---|
| `npm run build:react` | Build all 7 React bundles |
| `npm run build:editor` | Build editor bundle only |
| `npm run build:insights` | Build insights dashboard bundle only |
| `npm run smoke` | Verify bundles, HTML pages, React roots (no browser needed) |
| `npm test` | Unit tests for payload computation |
| `npm run validate` | Validate the dashboard payload contract JSON |
| `npm run links` | Check internal link consistency |
| `npm run manifest` | Regenerate RELEASE_MANIFEST.json |

## To run locally (required — do not open HTML files directly)

```
Double-click serve.bat   (Windows)
bash serve.sh            (Mac/Linux)
```

Then open `http://localhost:3000`.

For the insights page with demo data: `http://localhost:3000/codivium_insights_demo.html` _(demo package only)_


## Integration contract (host site)

Set these on `window` before the page bundles load to configure the sub-app
for your environment. All are optional — sensible defaults apply.

```html
<script>
window.__CVD_CONFIG = {
  apiBase:  '',          // API origin + prefix. Default: '' (same-origin /api/...)
                         // Example: 'https://api.mysite.com' or '/v2'
  tokenKey: 'cv_auth_token'  // localStorage/sessionStorage key for the JWT.
                         // Default: 'cv_auth_token'
};
window.__CVD_ROUTES = {
  // Override any page routes. All keys are optional.
  // landing: '/home', faq: '/help', dashboard: '/insights', login: '/auth'
};
</script>
```

The app also reads/writes these storage keys (namespace-aware via `tokenKey`):
- `cv_auth_token` — JWT bearer token (read-only by the sub-app)
- `cv_sidebar_collapsed` — sidebar state
- `cv.dashboard.ui` — layout preset persistence
- `cv_site_theme` — theme selection

Globals exposed by the sub-app for host-site integration:
- `window.CodiviumInsights` — dashboard data API (`update(payload)`, `setUiPrefs(prefs)`)
- `window.CVD.routes` — route resolution API
- `window.__CVD_ROUTES` — route override map (set by host before load)

## Pages

| URL path | Driven by |
|---|---|
| `/adaptive-practice.html` | `adaptive.bundle.js` |
| `/editor.html` | `editor.bundle.js` |
| `/mcq-parent.html` | `mcq-parent.bundle.js` |
| `/mcq-quiz.html` | `mcq-quiz.bundle.js` |
| `/menu-page.html` | `menu.bundle.js` |
| `/account-settings.html` | `settings.bundle.js` |
| `/codivium_insights_embedded.html` | `insights-dashboard.bundle.js` + API data |
| `/codivium_insights_demo.html` | `insights-dashboard.bundle.js` + demo data _(demo package only)_ |

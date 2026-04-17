# Live vs Legacy / Generated Files — v1.2.1

**Last updated:** 2026-04-16

This is the authoritative reference for what is active, what is legacy, and what to deploy.

---

## Architecture summary

Every user-facing page is driven by a compiled React bundle.
A small set of non-React boot scripts are still loaded as separate files because they
must run synchronously before React mounts (theme flash prevention) or operate on
server-rendered HTML that sits outside the React root (sidebar, topbar).

---

## LIVE — Deploy these

### React bundles (compiled output — do not hand-edit)

| Bundle | Drives |
|---|---|
| `assets/react-dist/adaptive.bundle.js` | `adaptive-practice.html` |
| `assets/react-dist/editor.bundle.js` | `editor.html` |
| `assets/react-dist/insights-dashboard.bundle.js` | `codivium_insights_embedded.html`, `codivium_insights_demo.html` |
| `assets/react-dist/insights.bundle.js` | Data bridge — fetches API, calls `CodiviumInsights.update()` |
| `assets/react-dist/mcq-parent.bundle.js` | `mcq-parent.html` |
| `assets/react-dist/mcq-quiz.bundle.js` | `mcq-quiz.html` |
| `assets/react-dist/menu.bundle.js` | `menu-page.html` |
| `assets/react-dist/settings.bundle.js` | `account-settings.html` |

### Non-React boot scripts (still active — intentionally non-React)

| File | Why it stays non-React |
|---|---|
| `assets/components/core/theme.js` | Must run synchronously before first CSS paint to prevent theme flash. Cannot be in a deferred bundle. |
| `assets/components/core/cv-font-loader.js` | Font preloading — runs before React to avoid FOUT. |
| `assets/components/core/global.js` | Applies performance mode, profile image, offline banner, hash-link guard. Runs before React mounts. |
| `assets/components/sidebar/sidebar.js` | Operates on server-rendered sidebar HTML that sits above the React root. |
| `assets/components/core/polyfill-loader.js` | Loads Chart.js and KaTeX vendor libs for the insights page. |

### HTML entry points

All pages in the package root are active and React-driven:
`adaptive-practice.html`, `editor.html`, `mcq-parent.html`, `mcq-quiz.html`,
`menu-page.html`, `account-settings.html`, `codivium_insights_embedded.html`,
`codivium_insights_demo.html`, `dashboard_view_settings.html` (redirect only)

### CSS

All CSS in `assets/components/` is active. The dashboard CSS is loaded by the insights
HTML pages; all other page CSS is loaded by their respective HTML.

---

## React source (build these to produce the bundles above)

Source lives under `src/`. Build with `npm install && npm run build:react`.
Entry points: `src/*/main.jsx` — one per page bundle.

---

## REMOVED — No longer in the production package

These files existed in earlier versions but are now replaced by React bundles.
They have been removed from the production zip.

| Removed file | Replaced by |
|---|---|
| `assets/components/adaptive/adaptive-practice.js` | `src/adaptive/` → `adaptive.bundle.js` |
| `assets/components/adaptive/onboarding-tour.js` | `src/adaptive/components/tour/` |
| `assets/components/editor/editor-page.js` | `src/editor/` → `editor.bundle.js` |
| `assets/components/exercise-menu/*.js` | `src/menu/` → `menu.bundle.js` |
| `assets/components/mcq/mcq-parent.js` | `src/mcq-parent/` → `mcq-parent.bundle.js` |
| `assets/components/mcq/mcq-quiz.js` | `src/mcq-quiz/` → `mcq-quiz.bundle.js` |
| `assets/components/settings/account-settings.js` | `src/settings/` → `settings.bundle.js` |
| `assets/components/feedback/feedback.js` | `src/editor/components/FeedbackModal.jsx` |
| `assets/components/help/cv-help-panel.js` | `src/shared/HelpPanel.jsx` |
| `assets/components/dashboard/js/dashboard*.js` | `src/insights/` → `insights-dashboard.bundle.js` |

---

## Dual implementation note

`assets/components/core/global.js` and `src/shared/globalInit.js` overlap in some
behaviors (effects mode, storage listener, hash guard). The React bundles call
`initGlobal()` from `globalInit.js`. The standalone `global.js` is still loaded by
the HTML pages for pre-React initialization and sidebar/topbar pages that don't use
a React bundle. This is intentional — they run in different timing windows.

# Combined Package — Regression Risk Audit

**Version:** 1.1.0  
**Purpose:** Identify shared dependencies, runtime hook points, and breakage vectors  
across the dashboard + editor/workspace combined package.

---

## 1. Shared shell dependencies (highest risk)

Changes to these files affect BOTH the dashboard and the editor/workspace page.

| File | Used by | Risk if changed |
|---|---|---|
| `assets/components/core/base.css` | Dashboard + Editor | CSS variable changes cascade everywhere |
| `assets/components/sidebar/sidebar.css` | Dashboard + Editor | Sidebar geometry, Coming Soon styling |
| `assets/components/sidebar/menu-overrides.css` | Dashboard + Editor | @layer overrides beat all component CSS |
| `assets/components/topbar/topbar.css` | Dashboard + Editor | Topbar height affects stage geometry |
| `assets/components/logo/logo.css` | Dashboard + Editor | Brand mark |

**Rule:** Test both pages after any shell file change.

---

## 2. CSS variable dependencies

These CSS variables are defined in shell files and consumed in editor-page.css.  
Changes to definitions break the editor without touching editor files.

| Variable | Defined in | Consumed in |
|---|---|---|
| `--sidebar-w` | base.css, menu-overrides.css | editor-page.css (stage-shell left) |
| `--sidebar-w-collapsed` | base.css, menu-overrides.css | editor-page.css (collapsed stage) |
| `--topbar-h` | topbar.css | editor-page.css (stage-shell top) |
| `--font-brand` | base.css | editor-page.css (timer, tabs, palette) |
| `--font-ui` | base.css | editor-page.css (all UI text) |

---

## 3. JavaScript runtime hook points

These are the points where modules communicate. Breaking one breaks downstream.

| Hook | Producer | Consumer | Risk |
|---|---|---|---|
| `window.CVD` namespace | cvd-core | ALL other modules | If core fails, nothing works |
| `CVD.editors` | cvd-editors | cvd-typography, cvd-themes, cvd-submit | Editor state not accessible |
| `CVD.locks.update()` | cvd-exercise-loader | cvd-locks | Lock state not applied on load |
| `CVD.locks.onSubmission()` | cvd-submit module | cvd-locks | Lock thresholds not updated |
| `CVD.submit.enable()` | cvd-exercise-loader | cvd-submit module | Submit never enabled |
| `CVD.submit.emit()` | cvd-submit module | Analytics consumers | Events not fired |
| `CVD.tabs.setActiveTab()` | cvd-locks, tour | cvd-tabs | Tab switch fails |
| `CVD.timer.reset()` | cvd-exercise-loader | cvd-timer | Timer not reset on new exercise |
| `window.marked` | CDN (marked.js) | cvd-exercise-loader (renderMd) | Markdown not rendered |
| `window.CodeMirror` | CDN (codemirror.min.js) | cvd-editors | Editors fall back to textarea |
| `window.CodiviumFeedback` | feedback.js | cvd-submit module | Feedback modal not shown |

---

## 4. CSP-sensitive code paths

| Path | Risk |
|---|---|
| CDN script loads (CodeMirror, marked) | Blocked if CSP script-src missing cdnjs/jsdelivr |
| Google Fonts CSS | Blocked if CSP style-src missing fonts.googleapis.com |
| `innerHTML` in cvd-exercise-loader, cvd-submit | Must always go through esc() or sanitizeHtml() |
| `fetch()` to /api/exercise and /api/exercise/submit | Blocked if CSP connect-src missing self |

---

## 5. Route assumptions

| Assumption | Where used | Risk if wrong |
|---|---|---|
| `/api/exercise?id=` exists | cvd-exercise-loader, editor-page.js | Exercise fails to load |
| `/api/exercise/submit` accepts POST | cvd-submit module in editor-page.js | Submit fails silently |
| Page served from same origin | `credentials: "same-origin"` | CORS errors |
| `?id=` URL param present | cvd-exercise-loader | Falls back to demo data |

---

## 6. API assumptions

| Assumption | Contract reference |
|---|---|
| Exercise response matches shape in contract | `contracts/exercise-workspace-api.contract.md` §GET |
| Submit response has `accepted`, `testsPassed`, `failedTests` | `contracts/exercise-workspace-api.contract.md` §POST |
| `failedTests[].input/expected/got` are strings | cvd-submit module renderResults() escapes them |
| `feedback` object present on `accepted: true` | cvd-submit module checks before calling CodiviumFeedback |

---

## 7. Known drift risks

| Risk | Mitigation |
|---|---|
| editor-page.js and split modules diverge | Update split modules after every change to combined file |
| editor.html and editor_v8.html diverge | editor_v8.html is dev copy; sync back to editor.html before each handoff |
| Dashboard shell CSS changes break editor stage geometry | Run both pages after shell changes |
| CDN version pinning: if cdnjs removes 5.65.16 | Run `fetch_vendor_deps.sh` and switch to vendored assets |
| deployment-manifest.json out of date | Update on every new file addition or classification change |

---

## 8. Post-refactor regression test plan

After any significant refactor (especially JS modularisation):

1. Run `npm run verify` — all checks must pass
2. Load `editor.html` in browser — no console errors
3. Load exercise (demo mode: set `window.__CODIVIUM_DEMO__ = true`) — exercise populates
4. Resize all 3 splitters — panes resize correctly
5. Switch all 4 layout modes — correct panes show/hide
6. Open settings palette — all controls work; Escape closes
7. Open tour — steps advance; Escape closes; focus returns
8. Click a locked tab — tooltip appears; Unlock works
9. Click Submit with empty code — validation error shown
10. Run `npm run verify` again after all manual tests

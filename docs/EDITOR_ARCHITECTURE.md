# Editor / Workspace — Architecture

**Version:** 1.1.0  
**Status:** Prototype / integration stage — see §"Prototype-to-production gap"  
**Depends on:** Core Codivium shell (base.css, sidebar.css, topbar.css, menu-overrides.css)

---

## Page purpose

`editor.html` is the exercise workspace — the page a student works on when solving a coding challenge. It provides a resizable 4-pane layout, a code editor, a session timer, tab locking, a guided tour, and a submit flow that runs tests against the student's code.

---

## Asset map

| Asset | Purpose | Status |
|---|---|---|
| `editor.html` | Page HTML shell (617 lines) | PROTOTYPE |
| `assets/components/editor/editor-page.js` | Combined JS runtime (96KB, single combined file) | PROTOTYPE |
| `assets/components/editor/editor-page.css` | Combined CSS (64KB, 6 modules) | PROTOTYPE |

| `assets/components/editor/editor-page.state-model.js` | Documents all 5 state layers | REFERENCE |

---

## Runtime flow

```
Browser loads editor.html
    |
    +-- Shell CSS (base.css, sidebar.css, topbar.css, menu-overrides.css)
    +-- editor-page.css  (workspace layout, themes, chrome, panes, typography)
    +-- CodeMirror CDN (CSS + JS, SRI hashes pending)
    +-- marked CDN (JS, SRI hash pending)
    +-- editor-page.js  (deferred -- all workspace JS)
           |
           +-- cvd-core            window.CVD namespace, $(), store, sanitizeHtml
           +-- cvd-timer           Analog clock + digital, requestAnimationFrame sweep
           +-- cvd-syntax-themes   CodeMirror theme CSS injection
           +-- cvd-settings-palette Font/theme/typography controls, focus trap
           +-- cvd-tabs            Tab switching, aria-selected, setActiveTab
           +-- cvd-editors         CodeMirror init (candidate + solution panes)
           +-- cvd-workspace-theme Workspace colour theme picker (10 variants)
           +-- cvd-typography      Font-size/family/weight CSS variable controls
           +-- cvd-workspace-controls Layout toggle buttons (Default/Code/Read/REPL)
           +-- cvd-splitters       Drag-to-resize pane splitters (3 axes)
           +-- cvd-focus-modes     Body class toggles for layout modes
           +-- cvd-repl            REPL input/output, run button (stub)
           +-- cvd-locks           Tab lock system, lock tooltip, submission tracking
           +-- cvd-exercise-loader GET /api/exercise, demo fallback, populate DOM
           +-- cvd-submit          POST /api/exercise/submit, validation, results, analytics
           +-- cvd-tour            13-step guided tour with focus management
```

---

## Data flow

```
Exercise load
  URL ?id=  -->  GET /api/exercise  -->  load(payload)  -->  DOM population
  window.__CODIVIUM_EXERCISE_DATA__  -->  load(payload)     (SSR path)
  window.__CODIVIUM_DEMO__           -->  load(DEMO_EXERCISE) (dev fallback)

Submit
  Submit click --> validate() --> POST /api/exercise/submit
    success:  renderResults() + CodiviumFeedback.show()
    failure:  renderResults() + setStatus()
    error:    setStatus(error message)

Analytics (all paths)
  CVD.submit.emit(event, detail)
    --> document CustomEvent("cvd:" + event)
    --> CVD.analytics.track(event, detail)  [if set]
    --> window.cvdTrack(event, detail)       [if set]
```

---

## State model (5 layers)

See `assets/components/editor/editor-page.state-model.js` for full reference.

| Layer | Storage | Owner module |
|---|---|---|
| Persistent user prefs | localStorage | cvd-locks, cvd-splitters |
| Server-loaded exercise state | window globals | cvd-exercise-loader |
| Live view state | CSS custom properties | cvd-splitters, cvd-typography, cvd-editors |
| Editor buffer state | CodeMirror instances | cvd-editors |
| Transient UI state | body class list | cvd-focus-modes, cvd-timer, cvd-tabs, cvd-locks |

---

## Shell dependency

The editor page loads the same shared shell CSS as the dashboard:

```
base.css           CSS variables, layout tokens, sidebar width vars
logo.css           Brand cube component
topbar.css         Top navigation bar
sidebar.css        Side menu, side-link, side-comingsoon
menu-overrides.css @layer overrides -- vars, sidebar collapsed state
```

Any change to these files affects both the dashboard and the editor page. Test both after shell changes.

---

## External dependencies

| Dependency | Version | Source | SRI | Vendorable |
|---|---|---|---|---|
| CodeMirror | 5.65.16 | cdnjs | Pending (run verify_sri.sh) | Yes |
| CodeMirror python mode | 5.65.16 | cdnjs | Pending | Yes |
| marked | 9.1.6 | jsdelivr | Pending | Yes |
| Cinzel font | latest | Google Fonts | N/A (dynamic) | Yes |

See `docs/EDITOR_CSP_GUIDE.md` for CSP strategy and `scripts/verify_sri.sh` for hash generation.

---

## Security posture

- Zero inline script blocks: YES
- Zero inline style blocks: YES
- Zero style= attributes in HTML: YES
- Zero on* event handlers: YES
- All innerHTML paths use esc() or sanitizeHtml(): YES
- SRI hashes on CDN assets: PENDING (run scripts/verify_sri.sh at deploy)

---

## Supported environments

- Desktop Chrome, Firefox, Safari, Edge (latest): Supported
- Tablet / mobile: Unsupported -- graceful notice shown below 1024px
- Minimum viewport: 1280 x 720px
- Zoom: Up to 100% at 1280px; greater than 100% not supported

---

## Prototype-to-production gap (A59)

| # | Item | Owner | Effort |
|---|---|---|---|
| G2 | Backend: implement GET /api/exercise + POST /api/exercise/submit | Backend | Large |
| G3 | Server-side session validation | Backend | Small |
| G4 | ~~Load feedback.js + feedback.css; call CodiviumFeedback.show()~~ | ✓ Done in v1.1.0 | — |
| G5 | Add SRI hashes to 4 CDN assets (run scripts/verify_sri.sh) | DevOps | Small |
| G6 | CDN+SRI or vendor strategy (run scripts/fetch_vendor_deps.sh) | DevOps | Small |
| G7 | Add CSP headers to csp/nginx.conf or csp/cloudflare.txt | DevOps | Small |
| G8 | Wire analytics: set window.CVD.analytics or window.cvdTrack | Frontend | Small |
| G9 | Verify test results DOM panel renders correctly | Frontend | Small |
| 0 | Manual QA: keyboard, screen reader, all target browsers | QA | Medium |

---

## Future migration path (A60)

1. JS modularisation: migrate IIFE bundle to proper ES modules with build step
3. CSP-safe: vendor or SRI-hash all CDN assets; update csp/ configs
4. ~~Feedback modal: load feedback.js; wire CodiviumFeedback.show()~~ ✓ Done
5. Checks green: editor smoke test passes; no console errors
6. Deployment: move editor.html from demo_test_only to deploy in deployment-manifest.json

Critical path: G2, G4. G5-0 can be parallelised.

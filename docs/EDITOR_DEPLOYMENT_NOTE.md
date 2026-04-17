# Editor / Workspace — Deployment Note

**Version:** 1.1.0  
**Status:** ⚠️ NOT PRODUCTION-READY — prototype/integration stage  
**Updated:** 2026-03-16

---

## Is the editor/workspace deployable now?

**No.** The UI is complete, but the following items must be resolved before production deployment:

| # | Item | Status | Blocker level |
|---|---|---|---|
| 1 | POST `/api/exercise/submit` endpoint | ✗ Backend not implemented | **Critical** |
| 2 | GET `/api/exercise?id=` endpoint | ✗ Backend not implemented | **Critical** |
| 3 | SRI hashes on 4 CDN assets | ✗ Placeholders only | High |
| 4 | Vendor or keep CDN for CodeMirror + marked | ✗ Decision needed | High |
| 5 | Google Fonts strategy (CDN or self-hosted) | ✗ Decision needed | Medium |
| 6 | CSP headers for editor page | ✗ Not added to nginx/cloudflare configs | High |
| 7 | Responsive policy defined | ✗ Desktop-first undeclared | Medium |
| 8 | Session/auth context confirmed | ✗ Assumes `credentials: same-origin` | Medium |
| 9 | feedback.js / feedback.css loaded | ✓ Loaded in editor.html | — |
| 10 | CodiviumFeedback.show() tested end-to-end | ✓ Called on submit success | — |

---

## What IS ready

- Full workspace UI (4-pane resizable layout, CodeMirror editor, 10 themes, 10 syntax themes)
- Tab system with lock/unlock milestones
- Exercise data loading from GET endpoint (with SSR + demo fallbacks)
- Submit flow wired to POST endpoint (code, validation, error handling, pending UX)
- Analytics events dispatched for all major lifecycle actions
- Session ID generation at exercise load
- Test results rendering (pass/fail per test)
- Settings palette, splitters, focus modes, REPL, session timer
- Guided tour
- Sidebar shared with dashboard (identical shell)

---

## Steps to make it production-deployable

### Step 1 — Implement backend endpoints

Implement these two API endpoints. The full contract is in `contracts/exercise-workspace-api.contract.md`:

**GET /api/exercise?id={exerciseId}**  
Returns exercise data including name, problem statement, scaffold, hints, tutorial, tests.

**POST /api/exercise/submit**  
Accepts code + metadata, runs tests, returns pass/fail results and optional feedback object.

### Step 2 — SRI hashes

Run the following and paste the `integrity=` values into `editor.html`:

```bash
bash scripts/verify_sri.sh
```

Find the 4 CDN tags with `data-sri-required="true"` in `editor.html` and add the hashes.

### Step 3 — Vendor assets (recommended) or confirm CDN

**Option A — Vendor (recommended):**
```bash
bash scripts/fetch_vendor_deps.sh
```
Then update the 4 CDN `href`/`src` attributes in `editor.html` to point to `assets/vendor/codemirror/` and `assets/vendor/marked/`.

**Option B — CDN with SRI:**  
Keep CDN references but ensure SRI hashes from Step 2 are added.

### Step 4 — CSP headers

Choose Option A (vendored) or Option B (CDN + SRI) from `docs/EDITOR_CSP_GUIDE.md` and add the corresponding CSP header to:
- `csp/nginx.conf` — for nginx deployments
- `csp/cloudflare.txt` — for Cloudflare deployments

### Step 5 — Google Fonts (optional)

To remove the Google Fonts CDN dependency:
1. Download Cinzel `.woff2` files from Google Fonts
2. Add `@font-face` declarations in `editor-page.base.css`
3. Remove the 3 Google Fonts `<link>` tags from `editor.html`
4. Update CSP to remove `fonts.googleapis.com` and `fonts.gstatic.com`

### Step 6 — Route configuration (production)

In production, the editor page links to site-level routes (`/`, `/articles`, etc.).  
Override the defaults at render time by injecting before `route-config.js` loads:

```html
<script>
  window.__CVD_ROUTES = {
    landing:  "/",
    articles: "/articles",
    pricing:  "/pricing",
    contact:  "/contact",
    faq:      "/faq"
  };
</script>
```

### Step 7 — Remove demo fallback flag

The page activates demo mode when `window.__CODIVIUM_DEMO__` is truthy.  
Ensure this is **not** set in production (it should not be — it's opt-in).  
Verify `window.__CODIVIUM_EXERCISE_DATA__` is SSR-injected with real data, or that `?id=` parameter resolves correctly.

### Step 8 — feedback.js (optional, for post-acceptance modal)

If you have the `CodiviumFeedback` component:
1. Add `<link rel="stylesheet" href="assets/components/feedback/feedback.css"/>` to `editor.html`
2. Add `<script src="assets/components/feedback/feedback.js" defer></script>` to `editor.html`
3. The submit module calls `window.CodiviumFeedback.show(response.feedback)` automatically on success

---

## External dependencies summary

| Asset | Source | Version | SRI required | Vendorable |
|---|---|---|---|---|
| CodeMirror CSS | cdnjs | 5.65.16 | Yes | Yes |
| CodeMirror JS | cdnjs | 5.65.16 | Yes | Yes |
| CodeMirror Python mode | cdnjs | 5.65.16 | Yes | Yes |
| marked.js | jsdelivr | 9.1.6 | Yes | Yes |
| Cinzel font | Google Fonts | — | N/A | Yes (.woff2) |

---

## Shared shell dependency

`editor.html` loads these shared shell assets (same as the dashboard):

```
assets/components/core/base.css
assets/components/core/global.js
assets/components/logo/logo.css
assets/components/topbar/topbar.css
assets/components/sidebar/sidebar.css
assets/components/sidebar/menu-overrides.css
assets/components/core/route-config.js   ← new in v1.1.0
```

Any change to these files affects both the dashboard and the editor/workspace.

---

## File classification

| File | Classification | Deploy? |
|---|---|---|
| `editor.html` | PROTOTYPE | When gap items above resolved |
| `assets/components/editor/editor-page.js` | PROTOTYPE | With editor.html — **this is the active runtime** |
| `assets/components/editor/editor-page.css` | PROTOTYPE | With editor.html |
| `assets/components/editor/editor-page.state-model.js` | REFERENCE | Documentation only — do not deploy |
| `assets/components/core/route-config.js` | DEPLOY | Yes — shared by dashboard and editor |

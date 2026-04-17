# Codivium — Combined Package Quick-Start Guide

**Version:** 1.1.0  
**For:** Developers integrating or continuing work on this package.  
**See also:** `../../../docs/package/getting-started/HANDOVER.md` (full context), `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` (classification), `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md` (inventory)

---

## What is in this package?

Two products in one ZIP:

| Product | Entry point | Status |
|---|---|---|
| **Performance Dashboard** | `codivium_insights_embedded.html` | ✅ Production-ready |
| **Exercise Workspace** | `editor.html` | ⚠️ Prototype — see `docs/EDITOR_DEPLOYMENT_NOTE.md` |

Plus shared shell assets (sidebar, topbar, logo, base CSS), backend C# files, contracts, and developer tooling.

---

## Prerequisites

```bash
node --version   # must be >= 18.0.0
```

No other runtime dependencies. All checks are vanilla Node.js.

---

## Run all checks (must be green before any handoff)

```bash
cd codivium_platform
bash scripts/run_checks.sh
```

Expected output: `All checks passed.`

Individual checks:
```bash
npm run test        # 49 JS unit tests
npm run smoke       # integration smoke test
npm run validate    # payload contract validation
npm run security    # CSP/inline checks
npm run links       # broken link detection
```

---

## Which pages are demos? Which are deployable?

```
codivium_insights_embedded.html  ✅ DEPLOY — production integration entry
dashboard_view_settings.html     ✅ DEPLOY — settings page
editor.html                      ⚠️ PROTOTYPE — not yet production-ready
feedback-demo.html               🔬 DEMO — UI reference only
join.html / login.html           🔬 DEMO STUB — replace with real auth pages
mcq-parent.html                  🔬 DEMO STUB — replace with real MCQ page
landing.html + 4 others          📌 ROUTE STUBS — local dev only, not deployed
```

---

## What backend endpoints does this package expect?

### Dashboard (production-ready)
The dashboard receives its data via `CodiviumInsights.init(payload)` — a JavaScript call.
No direct API calls from the dashboard frontend. The server builds the payload and passes it.
See `contracts/dashboard-payload-v2.contract.md`.

### Editor / Workspace (prototype)
Two REST endpoints must be implemented before the editor is production-ready:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/exercise?id={id}` | Load exercise data |
| POST | `/api/exercise/submit` | Run tests, return results |

Full contract: `contracts/exercise-workspace-api.contract.md`

---

## What is still stubbed?

| Stub | Location | Replace with |
|---|---|---|
| Submit endpoint | `editor-page.js` (`cvd-submit` module) | Calls real POST `/api/exercise/submit` |
| Exercise load | `editor-page.js` (cvd-exercise-loader) | Real GET `/api/exercise?id=` |
| Demo exercise data | `window.__CODIVIUM_DEMO__` fallback | SSR-injected `window.__CODIVIUM_EXERCISE_DATA__` |
| Feedback modal | `CodiviumFeedback` not loaded | Load `feedback.js` + `feedback.css` |

---

## Vendor dependencies (before deployment)

```bash
bash scripts/fetch_vendor_deps.sh
```

This downloads:
- **Dashboard:** Chart.js, KaTeX (required)
- **Editor:** CodeMirror 5.65.16, marked 9.1.6 (optional — or use CDN with SRI hashes)

For CDN + SRI approach:
```bash
bash scripts/verify_sri.sh
```
Then add the printed `integrity=` hashes to `editor.html`.

---

## Route configuration (for production)

Site-level links (`/`, `/articles`, `/pricing`, etc.) default to `.html` stubs in local dev.
In production, override before `route-config.js` loads:

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

See `assets/components/core/route-config.js` for full documentation.

---

## How to rebuild the dashboard bundle

If you edit any `dashboard.0*.js` source file:
```bash
bash scripts/build_dashboard_bundle.sh
```
Then run `bash scripts/run_checks.sh` to confirm the build is clean.

---

## How to integrate the dashboard

1. Deploy all files marked DEPLOY in `../../../docs/package/reference/DEPLOY_WHITELIST.txt`
2. Run `scripts/fetch_vendor_deps.sh` to vendor Chart.js + KaTeX
3. Embed `codivium_insights_embedded.html` in your application
4. On the page, call:

```javascript
CodiviumInsights.init(payload);
// payload must conform to contracts/dashboard-payload-v2.schema.json
```

Full integration guide: `docs/INTEGRATION_GUIDE.html`

---

## Key documents

| Document | Purpose |
|---|---|
| `../../../docs/package/getting-started/HANDOVER.md` | Single authoritative handover reference |
| `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md` | Every file classified |
| `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` | Full classification with rationale |
| `../../../docs/package/reference/DEPLOY_WHITELIST.txt` | Quick list of files to deploy |
| `docs/EDITOR_ARCHITECTURE.md` | Editor/workspace architecture |
| `docs/EDITOR_DEPLOYMENT_NOTE.md` | Steps to make editor production-ready |
| `docs/EDITOR_CSP_GUIDE.md` | CSP strategy for editor page |
| `contracts/exercise-workspace-api.contract.md` | Backend API contract |
| `contracts/dashboard-payload-v2.contract.md` | Dashboard payload contract |
| `docs/JAVASCRIPT_API.md` | Dashboard JS public API |

---

## Common questions

**Q: Can I deploy `editor.html` today?**  
A: No. The backend endpoints are not implemented. See `docs/EDITOR_DEPLOYMENT_NOTE.md`.

**Q: The link checker is failing — how do I fix it?**  
A: Run `node scripts/link_check.js` for details. Most failures are missing `.html` stub files.

**Q: The security gate is failing — what does that mean?**  
A: Run `bash scripts/security_gates.sh` for details. Usually an inline `<script>` or `style=` attribute.  
All JS goes in `assets/components/editor/editor-page.js`. All CSS goes in `editor-page.css`.

**Q: How do I run the package checks in CI?**  
A: `bash scripts/run_checks.sh` — exits 0 on success, non-zero on any failure.

**Q: What is `window.__CODIVIUM_DEMO__`?**  
A: A dev-mode flag. Set it before `editor-page.js` loads to activate the built-in demo exercise. Never set in production.

**Q: Where does state live?**  
A: See `assets/components/editor/editor-page.state-model.js` — documents all 5 state layers.

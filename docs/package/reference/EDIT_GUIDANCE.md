# Edit Here / Don't Edit Here — Package Guide

**Version:** 1.1.0  
**Purpose:** Prevent accidental edits to wrong files. One clear rule per file category.

---

## Dashboard runtime — source files to EDIT

These are the authoritative source files. Edit these to change dashboard behaviour.

| File | Edit to change | Build step needed? |
|---|---|---|
| `assets/components/dashboard/js/dashboard.*.js` (source modules) | Dashboard logic, charts, scoring, CTAs | Yes — run `npm run build` |
| `assets/components/dashboard/*.css` (8 split files) | Dashboard visual design | No |
| `assets/components/core/*.css` / `*.js` | Shell/sidebar/topbar shared styles and polyfills | No |
| `assets/components/sidebar/sidebar.css` | Sidebar layout and Coming Soon styling | No |
| `assets/components/sidebar/menu-overrides.css` | CSS variable overrides, collapsed sidebar | No |
| `config/scoring-config.*.json` | KaTeX scoring thresholds and formulas | No |
| `backend/*.cs` (non-reference) | C# scoring, payload building, API | Yes — dotnet build |

## Dashboard runtime — files NOT to edit directly

| File | Why | What to do instead |
|---|---|---|
| `assets/components/dashboard/js/dashboard.bundle.js` | GENERATED — overwritten by build | Edit source modules, then `npm run build` |
|  | BACKUP snapshot | Do not edit; use source modules |

---

## Editor / Workspace — source files to EDIT

| File | Edit to change |
|---|---|
| `editor.html` | Page HTML structure, element IDs, meta |
| `assets/components/editor/editor-page.js` | All workspace JS (combined bundle) |
| `assets/components/editor/editor-page.css` | All workspace CSS (combined stylesheet) |
| `assets/components/editor/editor-page.js` | API integration: exercise load + submit contract |

## Editor / Workspace — reference files (read, don't deploy)

These exist for documentation and future modularisation. They are NOT loaded by `editor.html`.

| File | Purpose |
|---|---|
| `assets/components/editor/editor-page.js` — the single active runtime file | Combined runtime — edit this file directly |
| `assets/components/editor/editor-page.css` — the single active stylesheet | Combined stylesheet — edit this file directly |
| `assets/components/editor/editor-page.js` | (removed — split modules deleted) |
| `assets/components/editor/editor-page.css` | (removed — split modules deleted) |
| `assets/components/editor/editor-page.state-model.js` | State documentation |

**Rule:** When you change `editor-page.js` or `editor-page.css`, also update the corresponding split module file to keep them in sync. The split files are the human-readable source; the combined files are what the page loads.

---

## Documentation — files to KEEP UP TO DATE

> **Edit in `package-docs/` only.** Root-level `.md` and `.txt` files are
> generated copies synced at ZIP build time. Any edit made at the root will
> be overwritten the next time docs are synced. The authoritative source is always
> `package-docs/<filename>`.

These should be updated whenever the code they describe changes.

| File | Update when |
|---|---|
| `../../../docs/package/getting-started/HANDOVER.md` | Any significant change to architecture, readiness, or status |
| `../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md` | Any file classification changes |
| `../../../docs/package/reference/PACKAGE_OBJECT_MAP.md` | New files added or classification changes |
| `deployment-manifest.json` | Any deployment classification changes |
| `../../../docs/package/reference/DEPLOY_WHITELIST.txt` | Any deployment classification changes |
| `docs/EDITOR_ARCHITECTURE.md` | Editor page structure or runtime flow changes |
| `contracts/exercise-workspace-api.contract.md` | API endpoint changes |
| `../../../docs/package/history/RELEASE_NOTES.md` | Every package handoff |
| `VERSION` | Every package handoff |
| `../../../docs/package/history/CHANGELOG.md` | Every meaningful change |

---

## Files to NEVER touch

| File / folder | Reason |
|---|---|
| `legacy/` | Retired files — kept for reference only |
|  | Backup snapshot — not authoritative |
| `demo/demo_data_*.js` | Demo payload fixtures — edit only if changing demo data |
| `landing.html`, `articles.html`, `pricing.html`, `contact.html`, `faq.html` | Site-level route stubs — auto-generated; do not edit |

---

## Build / check workflow

```bash
# Before any commit:
npm run verify      # runs all checks: build, smoke, tests, contract, security, links

# After editing dashboard JS source:
npm run build       # rebuilds dashboard.bundle.js

# Before deployment:
bash scripts/verify_sri.sh   # get SRI hashes for editor CDN assets
bash scripts/fetch_vendor_deps.sh  # vendor Chart.js, KaTeX, CodeMirror, marked
```

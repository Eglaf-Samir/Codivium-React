# Package Governance

**Package:** codivium-performance-insights (combined dashboard + editor/workspace)  
**Version:** 1.1.0  
**Last updated:** 2026-03-16

---

## Package owner

| Role | Responsibility |
|---|---|
| Package owner | Overall package integrity, release sign-off |
| Dashboard frontend | Dashboard runtime JS/CSS, scoring config |
| Editor frontend | Editor/workspace pages, editor-page.* files |
| Backend | C# scoring engine, API endpoints |
| DevOps | Vendor deps, CSP headers, deployment |

---

## Authoritative review checklist (before every handoff)

Run all of these. A ZIP is not handoff-ready unless all pass.

```bash
npm run verify          # build + smoke + tests + contract + security + links
node scripts/editor_smoke_test.js   # editor-specific checks
node scripts/mcq_smoke_test.js       # MCQ-specific checks
```

Additionally verify manually:
- [ ] `../../../docs/package/history/RELEASE_NOTES.md` updated with changes since last handoff
- [ ] `VERSION` file incremented
- [ ] `../../../docs/package/history/CHANGELOG.md` entry added
- [ ] `deployment-manifest.json` version matches `VERSION`
- [ ] `../../../docs/package/getting-started/INTEGRATION_QUICKSTART.md` still accurate for backend team
- [ ] `../../../docs/package/getting-started/HANDOVER.md` still accurate (especially prototype-to-production gap)
- [ ] No files in wrong classification (check ../../../docs/package/reference/DEPLOYMENT_BOUNDARY.md)
- [ ] Editor a11y checklist: `docs/EDITOR_A11Y_CHECKLIST.md` — spot-check keyboard nav

---

## Release criteria

A version is considered releasable when:

1. All automated checks pass (see above)
2. `../../../docs/package/getting-started/HANDOVER.md` truthfully describes current state
3. Deployment boundary docs are up to date
4. No known critical bugs unfixed
5. Known limitations are documented in `../../../docs/package/operations/KNOWN_LIMITATIONS.md`

---

## Supported environments

| Environment | Support level |
|---|---|
| Dashboard: modern desktop browsers | Full |
| Dashboard: IE11 | Not supported |
| Editor/workspace: desktop Chrome/Firefox/Safari/Edge | Prototype (not production) |
| Editor/workspace: mobile/tablet | Unsupported (graceful notice) |
| Node.js (for scripts/tests) | 18.0.0+ required |
| .NET (for backend) | As specified in Codivium.Dashboard.csproj |

---

## Deprecation policy

- Files in `legacy/` and  will not be removed until the next major version.
- `editor.html` will be promoted from demo_test_only to deploy once the prototype-to-production gap (A59) is closed.

---

## File naming conventions

| Convention | Applies to |
|---|---|
| `editor-page.*.js` | Editor JS modules |
| `editor-page.*.css` | Editor CSS modules |
| `dashboard.*.js` | Dashboard JS source modules |
| `dashboard.*.css` | Dashboard CSS split files |
| `*.v1.cs` / `*.v2.cs` | Versioned C# backend files |
| `*_GUIDE.md` | How-to documentation |
| `*_CHECKLIST.md` | QA/review checklists |
| `ADR-*.md` | Architectural Decision Records |

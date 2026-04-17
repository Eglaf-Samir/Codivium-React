# package-docs/

This directory is the **authoritative documentation tree** for the Codivium platform package.

## Why this directory exists

Documentation is maintained here in `package-docs/` as the single source of truth.
When a release ZIP is assembled, the `package/` subfolder is mirrored to `docs/package/`
at the ZIP root so recipients find organised docs under `docs/package/`.

**Do not edit docs under the ZIP root** — those copies are generated. Always edit here.

## Structure

```
package-docs/
  package/
    getting-started/   QUICK_START.md, HANDOVER.md, INTEGRATION_QUICKSTART.md
    reference/         DEPLOYMENT_BOUNDARY.md, PACKAGE_OBJECT_MAP.md,
                       BACKEND_INTEGRATION_GAPS.md, EDIT_GUIDANCE.md, DEPLOY_WHITELIST.txt
    operations/        DEPLOYMENT_GUIDE.md, KNOWN_LIMITATIONS.md,
                       OPERATIONAL_READINESS_CHECKLIST.md, OFFLINE_VENDOR.md,
                       BROWSER_SUPPORT.md, PERFORMANCE_GUIDE.md
    security/          SECURITY_HARDENING.md, THREAT_MODEL_DASHBOARD.md
    history/           CHANGELOG.md, RELEASE_NOTES.md, KATEX_*.md
    policies/          GOVERNANCE.md, THIRD_PARTY_NOTICES.md, README_PACKAGE_DOCS.md
```

`README.txt` is maintained at the package root directly — it is the entry point
for anyone unpacking the ZIP and is not part of the package-docs sync.

## Sync rule

At ZIP build time: mirror `package-docs/package/` → `docs/package/` at the ZIP root,
preserving the subfolder structure exactly.

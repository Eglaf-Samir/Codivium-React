Codivium Platform — Full Package

Version: 1.1.0
See docs/package/history/CHANGELOG.md for full history.

---

PACKAGE CONTENTS
----------------

Frontend
  codivium_insights_embedded.html     — Dashboard integration entry point
  adaptive-practice.html              — Adaptive practice page
  mcq-parent.html / mcq-quiz.html     — MCQ quiz setup and question pages
  editor.html                         — Coding exercise workspace
  menu-page.html                      — Exercise menu
  dashboard_view_settings.html        — Dashboard UI preferences page
  assets/                             — All JS, CSS, fonts, favicons

Backend (C# / ASP.NET Core)
  backend/                            — Scoring engine, adaptive engine, payload adapters,
                                        API endpoint stubs, and reference API host
  config/scoring-config.v1.json       — Scoring configuration

Demo (not deployed to production)
  demo/                               — Demo pages and static fixture data

Contracts
  contracts/                          — API contracts and JSON schemas for all endpoints

Docs
  docs/                               — Technical reference (architecture, integration, ADRs)
  docs/package/getting-started/       — Start here: QUICK_START.md, HANDOVER.md
  docs/package/reference/            — Deployment boundary, object map, backend gap analysis
  docs/package/operations/           — Deployment guide, known limitations, checklists
  docs/package/security/             — Security hardening, threat model
  docs/package/history/              — Changelog, release notes
  docs/package/policies/             — Governance, third-party notices

Scripts / Tests
  scripts/                            — Build, test, and validation scripts
  tests/                              — JS test suite

---

QUICK START
-----------

1. Read docs/package/getting-started/QUICK_START.md for a 5-minute orientation.

2. For a full architecture and integration reference:
   docs/package/getting-started/HANDOVER.md

3. To understand what backend code still needs to be built before production:
   docs/package/reference/BACKEND_INTEGRATION_GAPS.md

4. Serve locally with any static HTTP server:
     npx serve .
   Open codivium_insights_embedded.html or any demo/ page.

5. Run checks:
     node --test tests/dashboard.test.js
     node scripts/mcq_smoke_test.js
     node scripts/editor_smoke_test.js

---

PAYLOAD CONTRACT
----------------
Dashboard payload version: dashboard-payload-v2
See contracts/dashboard-payload-v2.contract.md and contracts/dashboard-payload-v2.schema.json.
Backend: call CodiviumDashboardPayloadV2Adapter.BuildFromRaw(...) to produce the payload.

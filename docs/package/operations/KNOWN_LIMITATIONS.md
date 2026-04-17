# Known Limitations

**Version:** 1.1.0  
**Last reviewed:** 2026-03-16  
**Policy:** This file must only contain real, current limitations. Remove items when fixed.

---

## Dashboard

| # | Limitation | Impact | Workaround |
|---|---|---|---|
| D1 | `granularity` param: only `day` implemented; `week`/`month` accepted but not rendered | Incorrect data if week/month used | Do not use week/month until implemented |
| D2 | Heatmap `cell.style.setProperty` error under Node test shim | Cosmetic under test; works in browser | Expected — no action needed |
| D3 | No automated browser rendering tests | Layout regressions undetected automatically | Manual QA: test all 6 layout presets before release |

---

## Editor / Workspace

| # | Limitation | Impact | Workaround |
|---|---|---|---|
| E1 | Submit endpoint stubbed — no real backend wired | Code not actually tested | Do not use in production; see EDITOR_ARCHITECTURE.md |
| E2 | ~~`feedback.js` not loaded~~ | ~~No feedback modal~~ | **Fixed in v1.1.0** — feedback.js wired in editor.html |
| E3 | SRI hashes missing on 4 CDN assets (codemirror.min.css, codemirror.min.js, python.min.js, marked.min.js) | CSP cannot validate CDN integrity | Network access required: run `scripts/verify_sri.sh` at deployment time to generate and embed hashes. Assets marked `data-sri-pending="true"` in editor.html. |
| E4 | CodeMirror 5 a11y not fully audited | Some keyboard nav in editor pane may be suboptimal | CodeMirror 5 has partial a11y; upgrade path is CodeMirror 6 |
| E5 | REPL output not in aria-live region | Screen readers do not announce REPL results | Add aria-live to REPL output pane (post-MVP) |
| E6 | Colour theme swatches in settings palette lack accessible names | Screen readers announce unlabelled controls | Add aria-label to each swatch (post-MVP) |
| E7 | Zoom >150% on 1280px screen causes layout degradation | Desktop at high zoom unusable | Zoom ≤100% is supported range; unsupported notice shows at <1024px logical |
| E9 | REPL execution is a stub | Run button does not execute code | Requires backend REPL endpoint |

---


## MCQ Pages

| # | Limitation | Impact | Workaround |
|---|---|---|---|
| MCQ1 | Backend question bank not yet implemented | Questions served from hardcoded demo bank | `fetchQuestions()` in `mcq-quiz.js` calls `GET /api/mcq/questions` with graceful fallback; wire `BE-02` in `backend/CodiviumMcqApiEndpoints.cs`. URL param pre-seeding via `readUrlParams()` ready (P-INF-01). |
| MCQ2 | Backend category API not yet implemented | `loadCategories()` in `mcq-parent.js` calls `GET /api/mcq/categories` with fallback; wire `BE-01` in `backend/CodiviumMcqApiEndpoints.cs` |
| MCQ3 | Score persistence backend not yet implemented | `submitResults()` in `mcq-quiz.js` calls `POST /api/mcq/results`; returns 202 stub until `BE-03` is wired in `backend/CodiviumMcqApiEndpoints.cs` |
| MCQ4 | No auth/session integration on either MCQ page | Any user can access; no per-user history | Uncomment BE-04 auth guard in `CodiviumMcqApiEndpoints.cs` once JWT middleware is registered |
| MCQ5 | Tour cross-page state uses sessionStorage — lost if tab closed mid-tour | Tour cannot resume after browser restart | Acceptable for tour UX; document in user-facing help |

## Package infrastructure

| # | Limitation | Impact | Workaround |
|---|---|---|---|
| P1 | No automated browser test for either page | Visual regressions undetected | Manual QA required before release |
| P2 | Site-level route stubs (`landing.html` etc.) are dummies | Links to marketing site go nowhere in local dev | Expected — real pages served by application server |

## Exercise Menu

| # | Limitation | Impact | Workaround |
|---|---|---|---|
| ME1 | `GET /api/menu/payload` endpoint not implemented | Menu shows demo data only | Use `menu-demo-data.js` for local dev; implement endpoint before production |
| ME2 | `menu-demo-data.js` auto-injects demo data unconditionally | Would override real API data in production | Remove `menu-demo-data.js` script tag from `menu-page.html` before production deployment |
| ME3 | No auth/session integration on menu page | All exercises visible to any user | Add auth guard at server level before production |
| SEC1 | `X-Codivium-UserId` dev header in `UserContext.cs` | Unauthenticated access if not removed | Remove or guard the header fallback in `UserContext.cs` before production deployment |
| ME4 | Feedback modal "Return to exercises" button not wired to `?from=` URL | Students can't return to menu from feedback modal | Wire in G4 (feedback.js integration) |


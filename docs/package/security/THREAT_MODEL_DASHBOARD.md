# Threat Model — Codivium Insights Dashboard (Scope: this page)

## Assets
- Authenticated user session (cookies / tokens)
- User metrics payloads and insights
- Subscription entitlements (authorization)
- Admin/config endpoints (if applicable)

## Trust boundaries
Browser ↔ API ↔ datastore; external vendor libraries if loaded from CDN.

## Entry points
- HTML entry: `codivium_insights_embedded.html`
- Scripts: `assets/components/**`
- API: `/api/sessions/start` (and any payload endpoints used by your site)
- Redirect/navigation actions (recommended actions)

## Key threats and mitigations
- XSS: avoid `innerHTML` for untrusted strings; enforce strict CSP; escape/encode server outputs.
- CSRF: SameSite cookies + CSRF token strategy for state-changing endpoints.
- IDOR: server-side authorization checks on any resource IDs.
- Open redirect: restrict redirects to same-origin/allowlist (implemented in dashboard).
- Clickjacking: set CSP `frame-ancestors` appropriately.
- Supply chain: prefer self-hosted vendor libs; avoid uncontrolled CDN fallback in prod.
- Abuse/rate limiting: protect expensive endpoints with rate limits and caching.

## Monitoring signals
- Spike in `/api/sessions/start` errors
- Spike in client-side JS exceptions
- Unusually frequent requests from a single IP/account

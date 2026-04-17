# Codivium Performance Insights — Security hardening guide

This package is designed to be embedded into a host site/app. The dashboard runs client-side and (optionally) calls backend endpoints (e.g. `/api/sessions/start`). Use this checklist to reduce common web risks (supply chain, XSS, redirects, CSRF) while keeping the embed experience working.

## 1) Recommended deployment model

**Best practice:** self-host all assets (CSS/JS/fonts) on the same origin as the page that embeds the dashboard.


This package supports **local-first** loading for Chart.js/KaTeX if you place the libraries under `assets/vendor/`.
For convenience, you can populate these files by running `./scripts/fetch_vendor_deps.sh` in an environment with internet access.
When vendor files are present, the embed can run fully offline and your CSP can be tightened to `script-src 'self'`.

If you use external CDNs (Chart.js / KaTeX):
- Keep versions pinned.
- Use Subresource Integrity (SRI) + `crossorigin="anonymous"`.
- Prefer a single allow-list of CDN hosts in CSP.

## 2) Content Security Policy (CSP)
### CDN fallback toggle (recommended: demos/dev only)

The loader will **only** use CDN fallbacks when the page sets:

- `data-cv-allow-cdn="true"` on `<html>` or `<body>`

Production pages should omit this attribute to enforce **self-hosted only** execution.


CSP is the single most effective mitigation against XSS and supply-chain script injection.

### Option A — Self-hosted assets (recommended)

Use when you serve all `assets/` from the same origin.

```http
Content-Security-Policy: default-src 'self'; \
  base-uri 'self'; \
  object-src 'none'; \
  frame-ancestors 'self'; \
  form-action 'self'; \
  script-src 'self'; \
  style-src 'self'; \
  img-src 'self' data:; \
  font-src 'self'; \
  connect-src 'self';
```

If your backend is on a different domain, add it to `connect-src`.

### Option B — CDN scripts for KaTeX / Chart.js

If you keep CDN loading, explicitly allow only the required CDNs.

```http
Content-Security-Policy: default-src 'self'; \
  base-uri 'self'; \
  object-src 'none'; \
  frame-ancestors 'self'; \
  form-action 'self'; \
  script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; \
  style-src 'self' https://cdn.jsdelivr.net; \
  img-src 'self' data:; \
  font-src 'self' https://cdn.jsdelivr.net; \
  connect-src 'self';
```

> Notes
> - KaTeX typically loads fonts from the same CDN host as its CSS; ensure `font-src` includes that host.
> - If you add any inline `<script>` blocks, avoid `unsafe-inline`. Prefer a **nonce**.

### Embedding in an iframe

If the dashboard is embedded into other sites via `<iframe>`, use `frame-ancestors` to allow only approved parents:

```http
Content-Security-Policy: ...; frame-ancestors https://partner1.example https://partner2.example;
```

Avoid `X-Frame-Options` for modern deployments (it’s less flexible than `frame-ancestors`).

## 3) Safer navigation / redirects

The front-end now normalizes and restricts redirects from “recommended actions.”

Still recommended server-side:
- Treat `redirectUrl` as **untrusted input**.
- Whitelist allowed paths or same-origin URLs.
- Reject `javascript:` / `data:` / cross-origin URLs.

## 4) CSRF and session endpoints

If `/api/sessions/start` is cookie-authenticated:
- Use **SameSite cookies** (`Lax` or `Strict` as compatible).
- Implement anti-CSRF tokens (double-submit cookie or synchronizer token).
- Confirm `credentials: 'same-origin'` is correct for your architecture.

If you use bearer tokens instead of cookies, prefer `Authorization: Bearer ...` and keep `credentials: 'omit'`.

## 5) Recommended HTTP response headers

Use these on the **embedding page** and API responses where applicable:

```http
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Optional / situational:
- `Cross-Origin-Resource-Policy: same-origin` (may break cross-origin embedding; test first)
- `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` (can break iframes and third-party resources; use only if you need cross-origin isolation).

## 6) Input validation

On the backend, validate:
- IDs, category keys, and numeric ranges in raw scoring input.
- Any text that may be displayed in UI (keep it as plain text; avoid rendering untrusted HTML).

## 7) Rate limiting and logging

If you expose session endpoints publicly:
- Rate limit by IP/user.
- Log suspicious patterns (unexpected origins, redirect attempts, repeated failures).

## 8) Local demo (`file://`) caveats

When opening demo HTML via `file://`, browsers do not enforce HTTP headers such as CSP and HSTS. Treat `file://` usage as a demo-only workflow.

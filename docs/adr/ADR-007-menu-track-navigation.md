# ADR-007: Exercise Menu — Track Navigation and SSR Embedding Pattern

**Status:** Accepted  
**Date:** 2026-03-16  
**Deciders:** Editor/workspace team

## Decision

The exercise menu page uses:
1. A `?track=` URL parameter to scope the exercise list
2. A `?from=` URL parameter on editor.html for back-navigation
3. An SSR embedding pattern (`window.__CODIVIUM_MENU_DATA__`) for instant load
4. A `cvMenuReady` CustomEvent for post-render analytics hooks

## Context

The menu-to-editor navigation needs to preserve context across two page loads (menu → exercise → back to menu). A simple `?from=` parameter passed through the card link provides this without requiring session storage or SPA routing.

The SSR embedding pattern mirrors the dashboard's `CodiviumInsights.init(payload)` model — the server can embed the exercise list directly in the page for instant first paint, falling back to a `fetch()` if not present.

## Consequences

- All exercise card links must include both `?id={exerciseId}` and `?from={encodedReturnUrl}`
- `editor.html` must read `?from=` on load and show the back-link if present
- The feedback modal (G4) should also use the `?from=` URL for its "Return to exercises" button
- `menu-demo-data.js` provides the SSR payload for local dev — must be removed or guarded in production
- Route config (`route-config.js`) has a `menu` key pointing to `menu-page.html` — override in production to the real route path
- Two tracks supported: `micro` (default) and `interview` — add more by extending the track map in `menu-data.js` and the API

## Rejected alternatives

- **SPA routing**: Too heavy for a multi-page package; each page is self-contained
- **localStorage for return URL**: More complex; URL param is simpler and shareable
- **Hardcoded return URL**: Inflexible if menu is hosted at a different path

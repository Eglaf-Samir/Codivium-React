# ADR-006: CSP Strategy — Inline Script and Style Ban

**Status:** Accepted  
**Date:** 2026-03  
**Deciders:** Package owner

## Decision
All HTML pages in the package must have zero inline `<script>` blocks, zero inline `<style>` blocks, zero `style=` attributes, and zero `on*=` event handler attributes. The security gate (`scripts/security_gates.sh`) enforces this.

## Context
Inline scripts and styles prevent a meaningful Content Security Policy. Removing them enables `script-src 'self'` and `style-src 'self'` in production CSP headers.

## Consequences
- All JS lives in external `.js` files
- All CSS lives in external `.css` files
- Dynamic styling uses CSS custom properties, not `style=` attributes
- SRI hashes on CDN assets are the remaining gap (see ../package/operations/KNOWN_LIMITATIONS.md E3)
- See `docs/EDITOR_CSP_GUIDE.md` for the editor page CSP deployment guidance

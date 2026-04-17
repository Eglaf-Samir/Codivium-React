# Editor / Workspace — CSP Guidance

**Package version:** 1.1.0  
**Page:** `editor.html`  
**Status:** Prototype stage — CSP strategy documented here; finalise before production deployment.

---

## Current CSP posture

### What passes now
- Zero inline `<script>` blocks ✓
- Zero inline `<style>` blocks ✓
- Zero inline `style=` attributes in HTML ✓
- Zero `on*=` event handler attributes ✓

### What still requires work before strict CSP
| Item | Status | Action needed |
|---|---|---|
| SRI hashes on CDN assets | ✗ Placeholders only | Run `scripts/verify_sri.sh` at deploy |
| CodeMirror CDN | ✗ External, no SRI | Add `integrity=` or vendor via `fetch_vendor_deps.sh` |
| marked CDN | ✗ External, no SRI | Add `integrity=` or vendor |
| Google Fonts | ✗ External | Vendor the font or accept external font source |
| `data-sri-required="true"` attrs | Present | Find all with `grep data-sri-required editor.html` |

---

## Recommended CSP for production

### Option A — Vendor all assets (most secure, works offline)

Run `scripts/fetch_vendor_deps.sh` to download CodeMirror and marked to `assets/vendor/`.
Update `editor.html` to reference vendored paths. Then use:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self';
  img-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Option B — CDN with SRI (recommended if vendoring is not practical)

Run `scripts/verify_sri.sh` to get the current integrity hashes.
Add `integrity="sha384-..."` and `crossorigin="anonymous"` to each CDN tag.
Then use:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self'
             https://cdnjs.cloudflare.com
             https://cdn.jsdelivr.net;
  style-src 'self'
            https://cdnjs.cloudflare.com
            https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self';
  img-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Option C — Transitional (development / staging only)

For early integration where SRI hashes are not yet in place:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net 'unsafe-eval';
  style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com 'unsafe-inline';
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self';
  img-src 'self' data:;
```

⚠️ **Do not use Option C in production.** `unsafe-inline` and `unsafe-eval` defeat the purpose of CSP.

---

## External dependencies summary

| Asset | Source | Version pinned | SRI needed | Vendorable |
|---|---|---|---|---|
| `codemirror.min.css` | cdnjs | 5.65.16 ✓ | Yes | Yes — run fetch_vendor_deps.sh |
| `codemirror.min.js` | cdnjs | 5.65.16 ✓ | Yes | Yes |
| `mode/python/python.min.js` | cdnjs | 5.65.16 ✓ | Yes | Yes |
| `marked.min.js` | jsdelivr | 9.1.6 ✓ | Yes | Yes |
| Cinzel font | Google Fonts | — | No (dynamic) | Yes — download .woff2 files |

---

## inline script / style policy

All `<script>` blocks and `<style>` blocks have been removed from `editor.html`.  
The page uses only:
- `<link rel="stylesheet" href="...">` for CSS
- `<script src="..." defer>` for JS

Do not reintroduce inline scripts or styles. Any new JS should go into `editor-page.*.js` modules.
Any new CSS should go into `editor-page.*.css` files.

---

## Deployment checklist (CSP)

Before marking the editor/workspace as production-ready:

- [ ] Run `scripts/verify_sri.sh` and add `integrity=` to all 4 CDN tags in `editor.html`
- [ ] Choose: CDN+SRI (Option B) or vendor (Option A)
- [ ] If vendoring: run `scripts/fetch_vendor_deps.sh`, update `editor.html` href/src paths
- [ ] If vendoring Google Fonts: download Cinzel .woff2 files, update CSS font-face
- [ ] Confirm zero `data-sri-required` attributes remain after adding integrity= hashes
- [ ] Test under CSP headers using browser devtools
- [ ] Add `editor.html` CSP config to `csp/nginx.conf` or `csp/cloudflare.txt`

---

## Dynamic HTML rendering (innerHTML)

`editor-page.js` uses `innerHTML` in several places. All have been audited (see A25):

| Location | Safety |
|---|---|
| Markdown rendering (`renderMd`) | `sanitizeHtml()` via CVD.util; fallback strips all tags |
| Lock tooltip (`tip.innerHTML`) | All values through `escTip()` HTML-encoder |
| Exercise instructions (`buildInstructions`) | All values through `esc()` HTML-encoder |
| Test results list | All values through `escHtml()` HTML-encoder |
| Error/loading states | Static string literals only |

The sanitizer is `CVD.util.sanitizeHtml` (DOMParser-based, defined in `editor-page.core.js`).
Fallback is tag-stripping. No user-controlled HTML is ever injected unsanitized.

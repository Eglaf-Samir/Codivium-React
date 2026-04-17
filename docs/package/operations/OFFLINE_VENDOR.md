# Offline / Self-Contained Mode

The dashboard supports fully offline operation when vendor assets are vendored locally.

## Status: SUPPORTED

Offline mode is officially supported. The required vendor files are:
- `assets/vendor/chartjs/chart.umd.min.js`
- `assets/vendor/katex/katex.min.js`
- `assets/vendor/katex/katex.min.css`
- `assets/vendor/katex/contrib/auto-render.min.js`
- `assets/vendor/katex/fonts/*.woff2` (20 font files)

## To enable offline mode

```bash
bash scripts/fetch_vendor_deps.sh
```

This downloads the exact versioned vendor files needed for offline operation.
After running it, the dashboard will load all assets from `assets/vendor/` without
any CDN requests.

## CDN fallback behaviour

The `polyfill-loader.js` uses a **local-first** strategy:
1. Try `assets/vendor/...` (local)
2. If local file missing → try CDN (only if `data-cv-allow-cdn="true"` is set on the `<html>` element)

Demo pages have `data-cv-allow-cdn="true"` set for convenience. Production pages
should have `data-cv-allow-cdn="false"` (or absent) and must have vendor files
fetched by `fetch_vendor_deps.sh`.

## Why vendor files are not included in the repo

Vendored binary/minified files are excluded to keep the repository clean.
Always run `fetch_vendor_deps.sh` as part of the deployment preparation step.

## Smoke test warning

If you see:
```
WARN: Chart.js vendor file missing: run ./scripts/fetch_vendor_deps.sh for offline mode
WARN: KaTeX vendor files missing: run ./scripts/fetch_vendor_deps.sh for offline mode
```
These are pre-deployment warnings. Run `fetch_vendor_deps.sh` before deploying.

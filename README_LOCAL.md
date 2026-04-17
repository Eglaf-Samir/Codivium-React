# Viewing Codivium Locally

## You must use a local server — do not open HTML files directly

Opening `.html` files with `file://` (double-clicking them) causes browser
security errors that block localStorage, CORS, and script loading.
**The pages will appear blank or broken when opened directly.**

## Quick start (Windows)

Double-click **`serve.bat`** in this folder, then open:
```
http://localhost:3000
```

## Quick start (Mac / Linux)

```bash
bash serve.sh
```
Then open `http://localhost:3000` in your browser.

## Manual options

```bash
# Option 1 — Node.js (recommended)
npx serve . --listen 3000

# Option 2 — Python 3
python -m http.server 3000

# Option 3 — Python 2
python -m SimpleHTTPServer 3000
```

## Pages

| URL | Description |
|-----|-------------|
| `http://localhost:3000/adaptive-practice.html` | Adaptive Practice |
| `http://localhost:3000/codivium_insights_embedded.html` | Performance Insights (needs API) |
| `http://localhost:3000/codivium_insights_demo.html` | Performance Insights with demo data (**demo package only**) |
| `http://localhost:3000/mcq-parent.html` | MCQ Quiz Setup |
| `http://localhost:3000/editor.html` | Exercise Editor |
| `http://localhost:3000/menu-page.html` | Exercise Menu |
| `http://localhost:3000/account-settings.html` | Account Settings |

## Demo pages (demo package only)

| URL | Description |
|-----|-------------|
| `http://localhost:3000/demo/adaptive-demo-c.html` | Adaptive — Full mode demo |
| `http://localhost:3000/demo/adaptive-demo-b.html` | Adaptive — Building mode demo |
| `http://localhost:3000/codivium_insights_demo.html` | Insights with demo data (**demo package only**) |

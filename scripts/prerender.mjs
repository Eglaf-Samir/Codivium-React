// scripts/prerender.mjs
//
// Post-build static prerendering for the public (unauthenticated) content
// pages, so crawlers get real rendered HTML instead of the empty SPA shell
// (this app is a plain client-rendered Vite + React Router SPA — there is
// no framework-level SSR/SSG).
//
// Why a real headless browser and not React's server-side renderToString():
// src/components/PublicWrapper.jsx calls prewarmCss() at module load time,
// which touches `document`/network APIs directly — it and its CSS-loading
// gate (useCssLoader/cssReady) would need to be rewritten to be Node-safe
// for renderToString to work at all. Puppeteer needs none of that — it's a
// real browser, so the app runs completely unmodified, exactly as it does
// for a real visitor.
//
// NOT wired into `npm run build` — run explicitly via `npm run prerender`
// after a normal build. See the note at the bottom of this file about what
// else needs to change (vercel.json) before this is live in production.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = 4571;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.map': 'application/json',
};

// Fixed public routes to prerender. /articles/<slug> entries are discovered
// automatically from the rendered Articles listing page below, so adding a
// new article to src/pages/articlesData doesn't require touching this file.
const ROUTES = ['/', '/pricing', '/faq', '/legal', '/contact', '/articles'];

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(DIST, urlPath);
      if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');
      const buf = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(buf);
    } catch {
      // Not a file that exists yet (route not prerendered yet, or a true
      // client-only app route) — fall back to the pristine SPA shell so the
      // client boots and React Router resolves it normally.
      try {
        const shell = await fs.readFile(path.join(DIST, 'app-shell.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(shell);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function writeRouteHtml(routePath, html) {
  const outDir = routePath === '/' ? DIST : path.join(DIST, routePath);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf8');
}

async function renderRoute(page, routePath) {
  await page.goto(BASE_URL + routePath, { waitUntil: 'networkidle0', timeout: 30000 });
  // Give post-networkidle React effects (PublicWrapper's cssReady gate,
  // setSeoMeta's useEffect, etc.) a moment to settle before capturing.
  await new Promise((r) => setTimeout(r, 400));
  return page.content();
}

async function main() {
  // Preserve the pristine SPA bootstrap shell BEFORE index.html gets
  // overwritten with the prerendered Landing page — this is what the SPA
  // fallback (see the note below) must serve for every route that isn't
  // individually prerendered here.
  await fs.copyFile(path.join(DIST, 'index.html'), path.join(DIST, 'app-shell.html'));

  const server = await startServer();
  const browser = await puppeteer.launch({ headless: true });
  let count = 0;
  try {
    const page = await browser.newPage();
    const discoveredSlugs = new Set();

    for (const routePath of ROUTES) {
      console.log(`[prerender] ${routePath}`);
      const html = await renderRoute(page, routePath);
      await writeRouteHtml(routePath, html);
      count++;

      if (routePath === '/articles') {
        for (const m of html.matchAll(/href="\/articles\/([a-z0-9-]+)"/g)) {
          discoveredSlugs.add(m[1]);
        }
      }
    }

    for (const slug of discoveredSlugs) {
      const routePath = `/articles/${slug}`;
      console.log(`[prerender] ${routePath}`);
      const html = await renderRoute(page, routePath);
      await writeRouteHtml(routePath, html);
      count++;
    }

    console.log(`[prerender] done — ${count} routes written.`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────────────
// To go live on Vercel (NOT done automatically by this script or by
// `npm run build` — see README note in the PR/commit this ships with):
//   1. Change vercel.json's rewrite destination from "/" to "/app-shell.html"
//      (the SPA fallback must stop pointing at index.html once index.html
//      holds prerendered Landing-page content instead of the empty shell).
//   2. Change the Vercel project's Build Command to run this script after
//      the build (e.g. "npm run build && npm run prerender").
//   3. Test on a Vercel PREVIEW deployment first — Puppeteer needs a
//      headless-Chrome-capable build image, which isn't guaranteed on every
//      CI/build environment without extra configuration. Confirm the
//      preview deploy's build logs show prerendering succeeding, and check
//      a few routes' view-source, before promoting to production.
// ─────────────────────────────────────────────────────────────────────────

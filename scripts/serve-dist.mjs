// scripts/serve-dist.mjs
//
// Serves dist/ locally with the SAME extensionless-clean-URL resolution
// prerender.mjs relies on (e.g. /pricing → dist/pricing/index.html, no
// trailing slash needed) — `vite preview` does NOT resolve clean URLs this
// way (it only finds dist/pricing/index.html when the URL has a trailing
// slash), so it under-represents what a properly configured static host
// serves. Use this to verify prerendered output locally: run
// `npm run build:seo` then `npm run preview:seo`, and view-source the
// printed URLs.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = process.env.PORT || 4575;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.map': 'application/json',
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(DIST, urlPath);
    if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    const buf = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
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

server.listen(PORT, () => {
  console.log(`\nServing dist/ at http://localhost:${PORT}`);
  console.log('Try (view-source: prefix to check raw HTML):');
  for (const p of ['/', '/pricing', '/faq', '/legal', '/contact', '/articles']) {
    console.log(`  http://localhost:${PORT}${p}`);
  }
  console.log('  (article slugs: check dist/articles/*/index.html for exact paths)\n');
});

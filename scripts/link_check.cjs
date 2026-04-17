/* Simple relative-link checker for local HTML pages. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function listFiles(dir, pred) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p, pred));
    else if (pred(p)) out.push(p);
  }
  return out;
}

function isExternal(href) {
  return /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);
}

function stripHashAndQuery(href) {
  return href.split('#')[0].split('?')[0];
}

const htmlFiles = listFiles(ROOT, p => p.endsWith('.html'));
let failures = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);

  const re = /\b(?:href|src)\s*=\s*\"([^\"]+)\"/g;
  let m;
  while ((m = re.exec(html))) {
    const ref = m[1];
    if (!ref || isExternal(ref) || ref.startsWith('#')) continue;

    const cleaned = stripHashAndQuery(ref);
    if (!cleaned) continue;

    const resolved = path.resolve(dir, cleaned);

    // Vendor files may be fetched during deployment.
    if (resolved.includes(path.join('assets', 'vendor'))) continue;

    if (!fs.existsSync(resolved)) {
      failures++;
      console.error(`Missing reference: ${path.relative(ROOT, file)} -> ${ref}`);
    }
  }
}

if (failures > 0) {
  console.error(`Link check failed with ${failures} missing references.`);
  process.exit(1);
} else {
  console.log('Link check passed.');
}

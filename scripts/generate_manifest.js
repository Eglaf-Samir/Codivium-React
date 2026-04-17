const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

function sha256File(fp) {
  const buf = fs.readFileSync(fp);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const versionPath = path.join(ROOT, 'VERSION');
const version = fs.existsSync(versionPath) ? fs.readFileSync(versionPath, 'utf8').trim() : '';

const files = listFiles(ROOT)
  .filter(p => !p.includes(path.join('.git')))
  .map(p => path.relative(ROOT, p).replace(/\\/g, '/'))
  .sort();

const manifest = {
  version,
  generatedAt: new Date().toISOString(),
  files: {}
};

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  manifest.files[rel] = sha256File(abs);
}

fs.writeFileSync(path.join(ROOT, 'RELEASE_MANIFEST.json'), JSON.stringify(manifest, null, 2));
console.log('Wrote RELEASE_MANIFEST.json with', files.length, 'files');

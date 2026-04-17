// scripts/copy-bundles.js
// Copies Vite build output to the final deployment locations.
// Run after: vite build
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const copies = [
  {
    src:  `${root}/dist-react/editor/editor.bundle.js`,
    dest: `${root}/assets/components/editor/react-dist/editor.bundle.js`,
  },
  {
    src:  `${root}/dist-react/menu/menu.bundle.js`,
    dest: `${root}/assets/components/exercise-menu/react-dist/menu.bundle.js`,
  },
];

for (const { src, dest } of copies) {
  if (!existsSync(src)) {
    console.warn(`  SKIP  ${src} (not found — may not have been built)`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`  COPY  ${src.split('dist-react/')[1]}  →  ${dest.split('codivium_react/')[1]}`);
}

console.log('\nBundles deployed.');

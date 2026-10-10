// Verifies that sw.js precaches every app file (run: node tools/check-precache.mjs).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1]));
const walk = (dir) =>
  readdirSync(join(root, dir)).flatMap((f) => {
    const p = join(dir, f);
    return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
  });
const expected = ['index.html', 'manifest.webmanifest', ...walk('css'), ...walk('js'), ...walk('assets/icons')];
const missing = expected.filter((f) => !listed.has(f));
const extra = [...listed].filter((f) => f !== './' && !expected.includes(f));
if (missing.length || extra.length) {
  if (missing.length) console.error('Missing from APP_FILES:', missing.join(', '));
  if (extra.length) console.error('Listed but not found:', extra.join(', '));
  process.exit(1);
}
console.log(`OK – ${listed.size} app files precached (+ photos from photoMap.js)`);

// Copies only the files the site needs into dist/ and checks that every local reference resolves.
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const PUBLIC_FILES = ['index.html', 'en/index.html', '404.html', 'styles.css', 'scripts/main.js', 'scripts/theme-init.js', 'assets/favicon.svg', 'assets/favicon-32.png', 'assets/apple-touch-icon.png', 'robots.txt', 'sitemap.xml'];
const PUBLIC_DIRS = { 'assets/fonts': ['.woff2'], 'assets/cv': ['.pdf'], 'assets/screenshots': ['.png', '.webp'], 'assets/ml': ['.png', '.webp'], 'assets/og': ['.png'] };

if (relative(root, dist) !== 'dist') throw new Error('Refusing to clean an unexpected dist path.');
await rm(dist, { recursive: true, force: true });

const copy = async (file) => {
  await mkdir(dirname(join(dist, file)), { recursive: true });
  await cp(join(root, file), join(dist, file));
};
for (const file of PUBLIC_FILES) await copy(file);
for (const [dir, extensions] of Object.entries(PUBLIC_DIRS)) {
  for (const name of await readdir(join(root, dir))) {
    if (extensions.includes(extname(name).toLowerCase())) await copy(`${dir}/${name}`);
  }
}

// Every local href/src/srcset/data-*-src in the pages and url() in the CSS must exist inside dist/.
const missing = [];
const check = (from, ref) => {
  if (!ref || /^(?:[a-z]+:|#|\/\/)/i.test(ref)) return;
  const target = join(dirname(join(dist, from)), decodeURI(ref.split('#')[0].split('?')[0]));
  const file = target.endsWith('/') || target.endsWith('\\') ? join(target, 'index.html') : target;
  if (!existsSync(file)) missing.push(`${from} → ${ref}`);
};
for (const page of ['index.html', 'en/index.html', '404.html']) {
  const html = await readFile(join(dist, page), 'utf8');
  for (const [, ref] of html.matchAll(/(?:href|src|srcset|data-(?:light|dark)-src)="([^"]+)"/g)) check(page, ref);
}
const css = await readFile(join(dist, 'styles.css'), 'utf8');
for (const [, ref] of css.matchAll(/url\("?([^")]+)"?\)/g)) check('styles.css', ref);
if (missing.length) throw new Error(`Missing files in dist:\n${missing.join('\n')}`);

const count = async (dir) => (await readdir(dir, { withFileTypes: true })).reduce(async (total, entry) => (await total) + (entry.isDirectory() ? await count(join(dir, entry.name)) : 1), Promise.resolve(0));
console.log(`dist/ ready: ${await count(dist)} files, all local references resolve.`);

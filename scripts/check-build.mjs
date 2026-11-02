import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { readEntries } from './validate-content.mjs';
import { isPublished, postSlug } from '../src/lib/content-policy.mjs';

const files = readdirSync('dist', {recursive: true}).filter(file => file.endsWith('.html'));
assert(existsSync('dist/index.html'));
assert(existsSync('dist/journal/index.html'));
assert(existsSync('dist/rss.xml'));
assert(existsSync('dist/journal.json'));
assert(existsSync('dist/sitemap-index.xml'));
const home = readFileSync('dist/index.html', 'utf8');
for (const id of ['menu-toggle','mobile-menu','lab','lab-canvas','lab-play','lab-size','lab-rule','contact-form','privacy-dialog','brand-intro','intro-replay']) {
  assert(home.includes(`id="${id}"`), `Preserved interaction hook missing: ${id}`);
}
for (const file of files) {
  const html = readFileSync(path.join('dist', file), 'utf8');
  assert(!html.includes('@tailwindcss/browser'), `${file}: Tailwind must be compiled.`);
  if (file === 'brand-intro.html') continue; // intentionally standalone supplied animation
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate DOM hooks`);
  assert.equal((html.match(/<title>/g) || []).length, 1, `${file}: duplicate title`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert(canonical?.[1].startsWith('https://wowkdigitalx.pl/'), `${file}: invalid canonical`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
    const url = decodeURIComponent(match[1]);
    const target = path.join('dist', url);
    assert(existsSync(target) || existsSync(path.join(target, 'index.html')), `${file}: missing internal asset/route ${url}`);
  }
}
const rss = readFileSync('dist/rss.xml', 'utf8');
const index = JSON.parse(readFileSync('dist/journal.json', 'utf8'));
for (const entry of readEntries()) {
  const slug = postSlug(entry);
  assert.equal(existsSync(`dist/journal/${slug}/index.html`), isPublished(entry.data), `${slug}: publication policy mismatch`);
  if (!isPublished(entry.data)) {
    assert(!rss.includes(`/journal/${slug}/`), `${slug}: draft leaked into RSS`);
    assert(!index.some(item => item.url.includes(`/journal/${slug}/`)), `${slug}: draft leaked into JSON`);
  }
}
console.log(`Verified ${files.length} HTML pages, local routes, assets, metadata and draft exclusions.`);

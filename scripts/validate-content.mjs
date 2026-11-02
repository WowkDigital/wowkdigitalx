import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { postSlug, tagSlug } from '../src/lib/content-policy.mjs';

export function readEntries(directory = 'src/content/posts') {
  return readdirSync(directory, {recursive: true}).filter(file => file.endsWith('.md')).map(file => {
    const source = readFileSync(path.join(directory, file), 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) throw new Error(`${file}: YAML frontmatter is required.`);
    return {id: file.replace(/\\/g, '/').replace(/\.md$/, ''), data: parse(match[1]), body: source.slice(match[0].length)};
  });
}
export function validateEntries(entries, publicDirectory = 'public') {
  const slugs = new Set(), tags = new Map();
  function imageFile(url, label) {
    if (!url || typeof url !== 'string' || !url.startsWith('/images/')) throw new Error(`${label}: images must use /images/ URLs.`);
    const base = path.resolve(publicDirectory);
    const file = path.resolve(base, decodeURIComponent(url.slice(1)));
    if (!file.startsWith(base + path.sep) || !existsSync(file)) throw new Error(`${label}: image does not exist: ${url}`);
  }
  for (const entry of entries) {
    const {data, body, id} = entry;
    const slug = postSlug(entry);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${id}: use a lowercase hyphenated filename or slug.`);
    if (slugs.has(slug)) throw new Error(`Duplicate post URL: ${slug}`);
    slugs.add(slug);
    if (!data.title?.trim() || data.title.length > 120) throw new Error(`${id}: title must contain 1–120 characters.`);
    if (!data.description?.trim() || data.description.length > 250) throw new Error(`${id}: summary must contain 1–250 characters.`);
    if (Number.isNaN(new Date(data.date).getTime())) throw new Error(`${id}: invalid date.`);
    if (typeof data.draft !== 'boolean') throw new Error(`${id}: explicit draft: true or false is required.`);
    if (!['note','article','gallery'].includes(data.type)) throw new Error(`${id}: invalid entry format.`);
    if (data.cover) {
      imageFile(data.cover, id);
      if (!data.coverAlt?.trim()) throw new Error(`${id}: describe the cover image.`);
    }
    for (const item of data.gallery || []) {
      imageFile(item.image, id);
      if (!item.alt?.trim()) throw new Error(`${id}: gallery image descriptions are required.`);
    }
    for (const match of body.matchAll(/!\[[^\]]*\]\((\/images\/[^\s)]+)(?:\s+[^)]*)?\)/g)) imageFile(match[1], id);
    if (/<\/?(?:script|iframe|style)\b|\bon\w+\s*=|javascript\s*:/i.test(body)) throw new Error(`${id}: executable HTML is not permitted in journal content.`);
    for (const tag of data.tags || []) {
      const normalized = tagSlug(tag);
      if (!normalized) throw new Error(`${id}: invalid tag: ${tag}`);
      if (tags.has(normalized) && tags.get(normalized) !== tag) throw new Error(`Tag URL collision: ${tag} / ${tags.get(normalized)}`);
      tags.set(normalized, tag);
    }
  }
  return entries.length;
}
export function validateCMS() {
  const cms = parse(readFileSync('.pages.yml', 'utf8'));
  const posts = cms.content.find(item => item.name === 'posts');
  if (posts.path !== 'src/content/posts' || posts.format !== 'yaml-frontmatter') throw new Error('CMS content path/format does not match Astro.');
  if (posts.fields.find(field => field.name === 'draft')?.default !== true) throw new Error('CMS must create drafts by default.');
  if (cms.media.input !== 'public/images/journal' || cms.media.output !== '/images/journal') throw new Error('CMS media path does not match public URLs.');
  return cms;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateCMS();
  console.log(`Validated CMS configuration and ${validateEntries(readEntries())} journal entries.`);
}

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished, sortPosts, postSlug } from '../lib/content-policy.mjs';
const escape = (value: string) => value.replace(/[<>&"']/g, char => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'}[char]!));
export const GET: APIRoute = async ({ site }) => {
  const entries = sortPosts((await getCollection('posts')).filter(entry => isPublished(entry.data)));
  const items = entries.map(entry => {
    const url = new URL(`/journal/${postSlug(entry)}/`, site).href;
    return `<item><title>${escape(entry.data.title)}</title><link>${url}</link><guid>${url}</guid><description>${escape(entry.data.description)}</description><pubDate>${entry.data.date.toUTCString()}</pubDate></item>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>WOWK DIGITAL X Journal</title><link>${site}</link><description>Notes, articles and visual experiments.</description><language>en</language>${items}</channel></rss>`, {headers: {'Content-Type': 'application/rss+xml; charset=utf-8'}});
};

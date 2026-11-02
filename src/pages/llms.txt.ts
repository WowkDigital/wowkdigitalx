import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished, sortPosts, postSlug } from '../lib/content-policy.mjs';
export const GET: APIRoute = async ({ site }) => {
  const entries = sortPosts((await getCollection('posts')).filter(entry => isPublished(entry.data)));
  const lines = [
    '# WOWK DIGITAL X',
    '',
    '> Independent digital studio: websites, e-commerce, automation and custom applications.',
    '',
    '## Public pages',
    `- [Home](${site}): Services, studio, work, process and contact.`,
    `- [Interactive Lab](${new URL('/#lab', site)}): Game of Life and 1D cellular automata.`,
    `- [Journal](${new URL('/journal/', site)}): Notes, articles and image galleries.`,
    `- [Journal metadata](${new URL('/journal.json', site)}): Public entries as JSON.`,
    `- [RSS](${new URL('/rss.xml', site)}): Published entries.`,
    '',
    '## Published journal entries',
    ...entries.map(entry => `- [${entry.data.title.replace(/[\[\]\r\n]/g, '')}](${new URL(`/journal/${postSlug(entry)}/`, site)}): ${entry.data.description.replace(/[\r\n]/g, ' ')}`),
    '',
    'All entries listed here are public. Drafts and future entries are excluded. This file is a content guide, not an authenticated publishing API.',
  ];
  return new Response(lines.join('\n') + '\n', {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
};

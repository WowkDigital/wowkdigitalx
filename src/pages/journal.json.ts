import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished, sortPosts, postSlug } from '../lib/content-policy.mjs';
export const GET: APIRoute = async ({ site }) => {
  const entries = sortPosts((await getCollection('posts')).filter(entry => isPublished(entry.data)));
  return Response.json(entries.map(entry => ({
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date.toISOString(),
    url: new URL(`/journal/${postSlug(entry)}/`, site).href,
    type: entry.data.type,
    tags: entry.data.tags,
    cover: entry.data.cover || null,
  })));
};

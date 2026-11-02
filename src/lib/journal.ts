import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublished, sortPosts } from './content-policy.mjs';

export async function journalEntries(): Promise<CollectionEntry<'posts'>[]> {
  const entries = await getCollection('posts');
  return sortPosts(entries.filter(entry => import.meta.env.DEV || isPublished(entry.data)));
}
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function isPublished(data, now = new Date()) {
  return data.draft === false && new Date(data.date).getTime() <= now.getTime();
}
export function postSlug(entry) {
  return entry.data.slug || entry.id;
}
export function tagSlug(tag) {
  return tag.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function sortPosts(posts) {
  return [...posts].sort((a, b) => new Date(b.data.date) - new Date(a.data.date) || postSlug(a).localeCompare(postSlug(b)));
}

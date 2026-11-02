import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublished, postSlug, sortPosts, tagSlug } from '../src/lib/content-policy.mjs';
import { readEntries, validateCMS, validateEntries } from '../scripts/validate-content.mjs';

const now = new Date('2026-11-03T12:00:00Z');
test('Publication is opt-in: drafts, missing flags and future dates are hidden', () => {
  assert(isPublished({date: '2026-11-03', draft: false}, now));
  assert(!isPublished({date: '2026-11-03', draft: true}, now));
  assert(!isPublished({date: '2026-11-03'}, now));
  assert(!isPublished({date: '2026-11-04', draft: false}, now));
});
test('Post URLs survive title changes and optional custom slugs are honored', () => {
  assert.equal(postSlug({id: 'stable-file', data: {title: 'New title'}}), 'stable-file');
  assert.equal(postSlug({id: 'stable-file', data: {slug: 'permanent-url'}}), 'permanent-url');
});
test('Colliding post/tag URLs and missing images fail before deployment', () => {
  const data = {title: 'Test', description: 'Description', date: '2026-11-03', draft: true, type: 'note', tags: []};
  const entry = {id: 'test', data, body: ''};
  assert.throws(() => validateEntries([entry, entry]), /Duplicate/);
  assert.throws(() => validateEntries([{...entry, data: {...data, cover:'/images/missing-file.png', coverAlt:'Test'}}]), /does not exist/);
  assert.throws(() => validateEntries([{...entry, body: '<script>alert(1)</script>'}]), /executable HTML/);
  assert.throws(() => validateEntries([{...entry, data: {...data, tags:['AI', 'ai']}}]), /collision/);
  assert.equal(tagSlug('Creative Technology'), 'creative-technology');
});
test('CMS points to the real content schema and all current entries validate', () => {
  validateCMS();
  assert(validateEntries(readEntries()) >= 1);
});
test('Newest entries sort first with deterministic ties', () => {
  const entries = [{id:'b',data:{date:'2026-10-01'}}, {id:'a',data:{date:'2026-11-01'}}];
  assert.equal(sortPosts(entries)[0].id, 'a');
  assert.equal(entries[0].id, 'b');
});

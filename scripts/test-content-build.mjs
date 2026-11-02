// Temporary, unpublished test fixtures exercise real Astro routes, then restore the final build.
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const fixtures = ['src/content/posts/ci-published-fixture.md', 'src/content/posts/ci-draft-fixture.md', 'src/content/posts/ci-future-fixture.md'];
const fixtureImage = 'public/images/journal/ci-fixture.svg';
if ([...fixtures, fixtureImage].some(file => existsSync(file))) throw new Error('Reserved test filename already exists. No files changed.');
function build() {
  const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {stdio:'inherit'});
  if (result.status !== 0) throw new Error('Fixture build failed.');
}
let failure;
try {
  for (const [index, file] of fixtures.entries()) {
    writeFileSync(file, `---\ntitle: "Build verification fixture"\ndescription: "Temporary test content"\ndate: ${index === 2 ? '2999-01-01' : '2020-01-01'}\ndraft: ${index === 1}\ntype: article\ntags: [Verification]\ncover: /images/journal/ci-fixture.svg\ncoverAlt: "Temporary image"\n---\n\n## Verification heading\n\n**Rendered Markdown** with an image.\n\n![Inline image](/images/journal/ci-fixture.svg)\n`);
  }
  writeFileSync(fixtureImage, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#f2f2f2"/></svg>');
  build();
  assert(existsSync('dist/journal/ci-published-fixture/index.html'));
  assert(!existsSync('dist/journal/ci-draft-fixture/index.html'));
  assert(!existsSync('dist/journal/ci-future-fixture/index.html'));
  const article=readFileSync('dist/journal/ci-published-fixture/index.html','utf8');
  assert(article.includes('<strong>Rendered Markdown</strong>'));
  assert(article.includes('https://wowkdigitalx.pl/journal/ci-published-fixture/'));
  assert(article.includes('og:type') && article.includes('article'));
  assert(existsSync('dist/tags/verification/index.html'));
  assert(readFileSync('dist/rss.xml','utf8').includes('/journal/ci-published-fixture/'));
  assert(!readFileSync('dist/rss.xml','utf8').includes('/journal/ci-draft-fixture/'));
  const result=spawnSync(process.execPath, ['scripts/check-build.mjs'], {stdio:'inherit'});
  assert.equal(result.status, 0);
} catch(error) {
  failure=error;
} finally {
  for(const file of [...fixtures, fixtureImage]) if(existsSync(file)) unlinkSync(file);
  build();
}
if(failure) throw failure;
console.log('Published article, Markdown, image, topic, RSS and draft/future exclusions passed; clean production output restored.');

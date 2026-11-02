# WOWK DIGITAL X — Astro + Pages CMS

An English, monochrome studio website with an interactive logo HUD, fullscreen geometric intro, scroll ruler, cellular automata Lab and a Markdown Journal. Statically generated with Astro and compiled Tailwind CSS; served by the existing dhosting account.

## Local development

Use Node **24** (or at least 22.23.4) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Astro. The original landing-page design and its DOM hooks are preserved in reusable components. The intro automatically opens only on the home route without a fragment; Replay intro works on every page. Local development shows draft entries; production does not.

## Checks and builds

```sh
npm run verify
npm run test:integration
python -m unittest discover -s tests -p test_deploy.py
npm run preview
```

`verify` runs Astro diagnostics, CMS/content validation, simulation and publishing-policy tests, a production build, then checks generated routes, assets, metadata and draft exclusion. Integration checks create temporary article/draft/future fixtures, build real article/tag/RSS pages and restore a clean production build. Production files are in ignored `dist/`.

## Content editing

Connect [Pages CMS](https://app.pagescms.org) to this GitHub repository. `.pages.yml` defines Journal (notes, articles and image galleries), media and site metadata. The panel is hosted separately; no admin server or database runs on dhosting. The owner must authorize the Pages CMS GitHub App once.

See [content editing](docs/CONTENT.md), [deployment setup](docs/DEPLOYMENT.md) and [agent instructions](AGENTS.md). New entries default to drafts. The bundled starter draft is not published.

## Structure

```text
.pages.yml                   Pages CMS fields and media mapping
src/content/posts/           Markdown entries
src/content.config.ts        Validated Astro collection
src/data/site.json           Editable SEO defaults
src/components/home/         Preserved landing-page sections
src/layouts/                 Shared metadata and document layout
src/pages/journal/           Journal index and individual entries
src/pages/tags/              Topic archives
src/scripts/                 Browser interactions
src/lib/                     Simulation and publishing logic
public/                      Logos, social image, standalone intro, uploads
scripts/                     Validation, integration checks and safe FTPS deploy
tests/                       Simulation and content-policy tests
.github/workflows/           CI and main-branch deployment
```

The Journal provides per-entry metadata, tag pages, `/rss.xml`, `/journal.json`, a sitemap and `/llms.txt`. These expose public content only. They help discovery; they do not provide write access or guarantee indexing by any agent.

The contact form opens an email draft in the visitor's own app. It does not send mail from a server. Fonts load from Google Fonts; Tailwind is compiled locally. No analytics are added. No client-side routing is enabled, so existing browser interaction lifecycles remain document-scoped.

## GitHub workflow

Work on branches and review pull requests. CI runs on pushes and PRs; only a successful `main` build deploys to dhosting. Set the `FTP_HOST`, `FTP_USER` and `FTP_PASSWORD` repository secrets before merging this migration. The deployer preserves unrelated hosting folders and backs up files. See [deployment](docs/DEPLOYMENT.md) for setup and recovery.

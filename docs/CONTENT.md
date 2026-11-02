# Publishing with Pages CMS

## One-time connection

1. Open https://app.pagescms.org and sign in with GitHub.
2. Authorize/install the Pages CMS GitHub App for **WowkDigital/wowkdigitalx** only.
3. Open this repository and choose the branch containing this migration. After merging, use `main` for production publishing.
4. The root `.pages.yml` provides **Journal**, image uploads and **Site metadata**. No CMS server is installed on dhosting.

Installing the GitHub App requires the repository owner's account action; source configuration alone does not grant access. CMS access and hosting deployment secrets are separate setup steps.

## Daily use

Create an entry in Journal, choose Note / Article / Image gallery, add a title, summary, date and body. Upload images and describe them. Keep **Draft** enabled while writing. To publish, disable Draft and save on `main`. The GitHub Actions workflow validates, builds and deploys the commit when FTPS secrets are configured. Publication is complete only after the Actions run succeeds; a CMS save alone is not proof of deployment.

Pages CMS commits changes to GitHub. Agents can edit the same Markdown files on a branch. Avoid editing the same entry in the CMS and an agent checkout simultaneously; pull latest changes before starting work.

## Paths and URLs

- Entries: `src/content/posts/your-entry.md` -> `/journal/your-entry/`.
- Optional `slug` overrides the filename. Use lowercase ASCII words separated by hyphens.
- Media: `public/images/journal/example.webp` -> `/images/journal/example.webp`.
- Cover image: `cover` and `coverAlt`; inline images can be inserted in the rich-text body.
- Gallery: repeated `image`, `alt`, optional `caption` objects.
- Tags generate `/tags/topic-name/`; use consistent spelling/case.

Changing a title does not require renaming the file. Preserve published URLs. Use HTML redirects or a hosting redirect when a URL really must change.

## Drafts and dates

`npm run dev` shows drafts (with preview labels). Production excludes drafts and future-dated entries, including individual routes, listings, tags, RSS and JSON. A future date is a filter at build time, not an automatic scheduler. Run a new build after the publication date, or explicitly add a schedule later.

The starter `writing-your-first-entry.md` remains a draft and contains editing instructions only. No public posts have been invented.

## Editing with an AI agent

Ask the agent to read `AGENTS.md`, create/edit a draft, add local images with alt text and run `npm run verify`. For schema or rendering changes, also run `npm run test:integration`. Use the same field names in Markdown, `.pages.yml` and `src/content.config.ts`. Refer to the current [Pages CMS configuration docs](https://pagescms.org/docs/configuration/content/).

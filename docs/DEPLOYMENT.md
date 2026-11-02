# GitHub and dhosting deployment

## Migration branch

The Astro project replaces the repository root on `codex/astro-pages-cms`. The original static project is preserved in its earlier commits and separate local checkout. Review the migration, configure production secrets and merge into `main` when ready to switch the production source.

## GitHub Actions

Every push and pull request runs checks, tests, a production build and real content-route fixture checks. A successful build on `main` runs the FTPS deploy job. PR branches never deploy. Actions have read-only repository permissions; secrets are provided only to the deploy step. Third-party actions are pinned to commit SHAs and Dependabot proposes updates.

Set these **repository Actions secrets** under Settings -> Secrets and variables -> Actions:

| Secret | Meaning |
| --- | --- |
| `FTP_HOST` | Domain's FTP server hostname |
| `FTP_USER` | Restricted deployment account username |
| `FTP_PASSWORD` | Deployment account password |

Use the credentials already held by the hosting owner. Never add them to a file or commit. The destination is intentionally fixed to `/public_html` as seen by the restricted FTP account, port 21, explicit TLS with certificate verification. There is no plaintext fallback. Node runs in CI only; production serves static HTML/CSS/JS and images.

For manual deployment with the three environment variables already set:

```sh
npm ci
npm run verify
python scripts/deploy.py --dry-run
python scripts/deploy.py
```

## Preservation and rollback

- The deployer uploads only `dist/`.
- It stages and size-checks files, backs up replaced files, then promotes assets and HTML.
- Backups stay under `/public_html/_landing_backup_TIMESTAMP/`.
- It preserves existing `photo_proofing`, `codex`, all backup folders and untracked hosting files.
- `.wowk-astro-manifest.json` lists only files managed by this Astro deployment. Future successful deploys remove obsolete files from this manifest, so deleted/unpublished articles do not stay public.
- Promotion failures attempt restoration of replaced files. Connection loss can still require manual recovery using the backup.

To roll back intentionally, rebuild/deploy a previous reviewed Git commit, or restore the files from the matching hosting backup. Do not recursively delete `public_html` or unrelated directories. A first Astro deploy does not delete old root-level legacy files because they were never in the Astro manifest.

Verify the home page, `/journal/`, `/rss.xml`, `/journal.json`, `/sitemap-index.xml`, intro and Lab after deployment. Check the GitHub Actions result before claiming automatic publishing is live.

## Account setup outside source control

The Pages CMS GitHub App must be connected by the repository owner. Repository secrets must be configured separately. Neither step is completed merely by adding `.pages.yml` or this workflow. Do not paste tokens into chat or source files.

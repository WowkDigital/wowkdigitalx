# WOWK DIGITAL X — Grav 2

Complete, portable Grav **2.2.25** + **Admin2 2.2.9**, with the WDX studio theme, Journal and interactive Lab. The local folder and release ZIP include the official runtime, dependencies and compiled admin UI. No Node.js, npm, database or frontend build is required to run them. A fresh Git checkout restores the same checksum-pinned runtime once with `python scripts/install-runtime.py`; Python is not needed on production.

## Start locally

Use PHP 8.3.11+ with the required extensions, then from this folder:

```sh
php -S 127.0.0.1:4333 system/router.php
```

Open http://127.0.0.1:4333/admin and create your own administrator account. A fresh installation may redirect all pages to this initial account setup until it is completed. No administrator password is supplied or committed. Local accounts and generated keys remain outside Git.

## Editing

The included Admin2 panel is at `/admin` on the same hosting. Under **Pages**, edit Home's modules (hero, services, studio and process) or add an **item** below Journal for a note, article or gallery. Upload images to the entry's own page folder. New Journal entries default to drafts. Site email and metadata are in Configuration → Site / `user/config/site.yaml`.

The original intro, logo HUD, scroll ruler, contact mail draft and Game of Life / 1D Automata remain plain browser JavaScript. The style baseline is already compiled; new styling can be written directly in `user/themes/wdx/css/custom.css`.

## Verification

```sh
php scripts/check.php
python scripts/test-site.py
```

The first checks PHP requirements, YAML and Twig. The second starts its own temporary local server and checks real page rendering, public article Markdown, private/future exclusions, feeds, admin availability and sensitive-file protection. It creates and removes isolated fixtures. Python is needed for this test only, not to run the site.

## Portable folder and GitHub

This folder includes the complete application; `runtime-version.json` pins the original package and its SHA-256. `user/themes/wdx` and `user/plugins/wdx` are the custom code. `user/pages` contains editorial content, with Markdown/YAML and media. Keep a full private hosting backup that includes accounts and generated keys when moving an existing installation; a Git checkout intentionally excludes those sensitive files.

CMS writes occur on the server. They do not automatically become Git commits. Code deployment must preserve live pages/media/accounts/keys. See [setup and editing](docs/SETUP.md), [deployment and portability](docs/DEPLOYMENT.md) and [agent instructions](AGENTS.md).

The new project lives on `codex/grav2`. The earlier static and Astro projects remain separate. Production has not been switched by this migration.

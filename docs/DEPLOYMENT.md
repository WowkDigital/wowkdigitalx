# Deployment and portability

This migration prepares a new local project and Git branch. It does not replace the public site or configure hosting PHP. Verify the actual dhosting PHP version/extensions before switching production.

## First deployment

1. Back up the current `public_html` and keep the existing `photo_proofing` and `codex` directories.
2. Upload the complete clean release folder, including the root `.htaccess`, `system`, `vendor`, `user`, `index.php`, `brand-intro.html` and runtime assets.
3. Remove/rename the previous root `index.html` as part of the controlled switch; otherwise the web server may serve it instead of `index.php`. The old static project's backup must remain recoverable.
4. Open `/admin` and create your owner account over HTTPS.
5. Check home, Journal, article publishing, intro, Lab and feeds. Confirm private paths are inaccessible.

Never upload `.git`, local caches, logs, test fixtures or local test accounts. The release ZIP generated from tracked files excludes them. A clean release creates new private runtime keys on its first launch.

## Subsequent code updates

The panel writes directly to `user/pages`, including page media. These live files are the content source of truth until an explicit Git synchronization is implemented. Generic FTP mirroring or deleting remote files against a checkout can destroy editor changes.

Deploy reviewed theme/plugin/core updates separately. Preserve live `user/pages`, `user/accounts`, `user/data`, `user/env` and generated private config unless performing an intentional, backed-up content/config migration. Cache, assets and derived images can be regenerated. Clear Grav caches using its Admin tools after changing templates/config if necessary.

## Moving an existing site

For full portability, take a **private full copy** of the installation including current pages/media, accounts and private keys, then restore it to a server with compatible PHP and URL-rewrite configuration. Update production_url, domain-specific config and HTTPS settings as needed. This private backup differs from the code repository and must not be published on GitHub.

The runtime is pinned in `runtime-version.json` and restored by `scripts/install-runtime.py` for fresh Git checkouts; it is already included in the local folder and portable ZIP. Update it from official Grav/Admin2 packages and rerun tests; do not patch vendor code to solve site-specific issues. The bundle includes upstream licenses. Root project files follow their upstream licensing; custom WDX assets remain the owner's materials.

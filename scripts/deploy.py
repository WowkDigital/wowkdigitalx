"""Deploy only built static output using verified explicit FTPS. Never delete unrelated hosting content."""
import argparse
import datetime
import ftplib
import io
import json
import os
import pathlib
import ssl

parser = argparse.ArgumentParser()
parser.add_argument('--dry-run', action='store_true')
args = parser.parse_args()
source = pathlib.Path('dist').resolve()
if not (source / 'index.html').is_file() or not (source / 'journal/index.html').is_file():
    raise SystemExit('Run npm run verify before deployment. Missing built homepage/journal.')
files = sorted((file for file in source.rglob('*') if file.is_file()), key=lambda file: (file.suffix == '.html', file.name == 'index.html', str(file)))
names = [file.relative_to(source).as_posix() for file in files]
reserved = {'photo_proofing', 'codex'}
def safe_name(name):
    p = pathlib.PurePosixPath(name)
    return bool(name) and not p.is_absolute() and '\\' not in name and '..' not in p.parts and p.parts[0] not in reserved and not p.parts[0].startswith('_landing_backup_') and not name.startswith('.')
if not all(safe_name(name) for name in names):
    raise SystemExit('Build contains an unexpected or reserved path.')
if args.dry_run:
    print(f'Dry run: {len(files)} built files -> /public_html; existing subdirectories are preserved.')
    raise SystemExit(0)
required = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD']
if any(not os.environ.get(key) for key in required):
    raise SystemExit('Configure FTP_HOST, FTP_USER and FTP_PASSWORD as repository Actions secrets. See docs/DEPLOYMENT.md.')

ftp = ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60)
ftp.connect(os.environ['FTP_HOST'], 21)
ftp.login(os.environ['FTP_USER'], os.environ['FTP_PASSWORD'])
ftp.prot_p()
ftp.cwd('/public_html')
ftp.voidcmd('TYPE I')
manifest_name = '.wowk-astro-manifest.json'
backup = '_landing_backup_' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d_%H%M%S')
ftp.mkd(backup)
created = set()
def directories(name):
    parent = pathlib.PurePosixPath(name).parent
    parts = parent.parts
    for index in range(1, len(parts) + 1):
        folder = '/'.join(parts[:index])
        if folder in created:
            continue
        try:
            ftp.mkd(folder)
        except ftplib.error_perm as error:
            # Confirm that an existing directory is really a directory.
            original = ftp.pwd()
            try:
                ftp.cwd(folder)
            except ftplib.error_perm:
                raise error
            finally:
                ftp.cwd(original)
        created.add(folder)

def download(name):
    data = io.BytesIO()
    try:
        ftp.retrbinary('RETR ' + name, data.write)
    except ftplib.error_perm as error:
        if str(error).startswith('550'):
            return None
        raise
    return data.getvalue()

old_manifest = download(manifest_name)
previous = json.loads(old_manifest or b'[]')
if not isinstance(previous, list) or any(not isinstance(name, str) or not safe_name(name) for name in previous):
    raise SystemExit('Remote deployment manifest is invalid; no files changed.')
snapshots = {}
promoted = []
try:
    # Stage and size-check all files before promoting any page.
    for file, name in zip(files, names):
        directories(name)
        with file.open('rb') as stream:
            ftp.storbinary('STOR ' + name + '.upload', stream)
        if ftp.size(name + '.upload') != file.stat().st_size:
            raise RuntimeError('Upload verification failed: ' + name)
    for name in names:
        snapshots[name] = download(name)
        if snapshots[name] is not None:
            backup_name = backup + '/' + name
            directories(backup_name)
            ftp.storbinary('STOR ' + backup_name, io.BytesIO(snapshots[name]))
        ftp.rename(name + '.upload', name)
        promoted.append(name)
    # Remove only files owned by a previous Astro deployment, after the new one succeeds.
    for name in sorted(set(previous) - set(names)):
        snapshots[name] = download(name)
        if snapshots[name] is not None:
            backup_name = backup + '/' + name
            directories(backup_name)
            ftp.storbinary('STOR ' + backup_name, io.BytesIO(snapshots[name]))
            ftp.delete(name)
            promoted.append(name)
    if old_manifest is not None:
        ftp.storbinary('STOR ' + backup + '/' + manifest_name, io.BytesIO(old_manifest))
    ftp.storbinary('STOR ' + manifest_name + '.upload', io.BytesIO(json.dumps(names).encode()))
    ftp.rename(manifest_name + '.upload', manifest_name)
except Exception:
    for name in reversed(promoted):
        if snapshots[name] is None:
            try:
                ftp.delete(name)
            except ftplib.error_perm:
                pass
        else:
            ftp.storbinary('STOR ' + name, io.BytesIO(snapshots[name]))
    raise
finally:
    ftp.quit()
print(f'Deployed {len(files)} files. Previous files backed up in /public_html/{backup}.')

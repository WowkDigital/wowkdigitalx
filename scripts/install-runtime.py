"""Restore pinned PHP runtime without overwriting code, content or credentials."""
import hashlib
import io
import json
import pathlib
import urllib.request
import zipfile

root=pathlib.Path(__file__).resolve().parents[1]
version=json.loads((root/'runtime-version.json').read_text())
with urllib.request.urlopen(version['source'],timeout=120) as response:
    archive=response.read()
if hashlib.sha256(archive).hexdigest()!=version['sha256']:
    raise SystemExit('Archive checksum mismatch. No files changed.')
allowed=['vendor/','system/','bin/','webserver-configs/','user/plugins/','user/themes/quark2/']
count=0
with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
    for info in bundle.infolist():
        relative='/'.join(pathlib.PurePosixPath(info.filename).parts[1:])
        if not relative or not any(relative.startswith(prefix) for prefix in allowed):continue
        target=(root/relative).resolve()
        if not target.is_relative_to(root):raise SystemExit('Unsafe archive path.')
        if info.is_dir():target.mkdir(parents=True,exist_ok=True)
        elif not target.exists():
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(bundle.read(info));count+=1
for name in ['assets','backup','cache','images','logs','tmp','user/accounts','user/data']:(root/name).mkdir(parents=True,exist_ok=True)
print(f'Installed {count} missing official runtime files; existing site data preserved.')

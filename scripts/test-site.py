"""Local HTTP integration checks; temporary fixtures never touch production."""
import hashlib
import json
import os
import pathlib
import secrets
import socket
import subprocess
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

root = pathlib.Path(__file__).resolve().parents[1]
account = root / 'user/accounts/wdx-verification-fixture.yaml'
fixtures = [root / 'user/pages/02.journal' / name for name in ['wdx-public-fixture','wdx-draft-fixture','wdx-future-fixture']]
if account.exists() or any(p.exists() for p in fixtures):
    raise SystemExit('Reserved test path already exists; no files changed.')
password_hash = subprocess.run(['php','-r','echo password_hash(trim(stream_get_contents(STDIN)), PASSWORD_DEFAULT);'], input=secrets.token_urlsafe(40), capture_output=True, text=True, check=True).stdout
account.parent.mkdir(exist_ok=True)
account.write_text('state: enabled\nemail: test@example.invalid\nfullname: Temporary test fixture\naccess:\n  site:\n    login: true\n  admin:\n    login: false\nhashed_password: '+password_hash+'\n',encoding='utf-8')
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port=sock.getsockname()[1]
server = None
def fetch(path):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}'+path,timeout=30) as response:
            return response.status,response.read().decode('utf-8')
    except urllib.error.HTTPError as error:
        return error.code,error.read().decode('utf-8')
try:
    for index,folder in enumerate(fixtures):
        folder.mkdir()
        (folder/'item.md').write_text('---\ntitle: Verification fixture\n'+('' if index==2 else 'published: '+('false' if index==1 else 'true')+'\n')+'date: 2020-01-01\n'+('publish_date: 2999-01-01\n' if index==2 else '')+'summary: Temporary verification content\nentry_type: article\ntaxonomy:\n  tag: [Verification]\n---\n\n## Rendered heading\n\n**Rendered Markdown**\n',encoding='utf-8')
    server=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','system/router.php'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    for _ in range(40):
        try:
            status,home=fetch('/')
            break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError('The temporary PHP test server did not become ready.')
    assert status==200 and 'lab-canvas' in home and 'DIGITAL' in home, 'Homepage failed'
    status,article=fetch('/journal/wdx-public-fixture')
    assert status==200 and '<strong>Rendered Markdown</strong>' in article, 'Published article failed'
    for folder in fixtures[1:]:
        status,_=fetch('/journal/'+folder.name)
        assert status==404, 'Private/future entry is accessible: '+folder.name
    status,feed=fetch('/journal.json')
    assert status==200
    posts=json.loads(feed)
    assert any('/wdx-public-fixture' in item['url'] for item in posts)
    assert not any('/wdx-draft-fixture' in item['url'] or '/wdx-future-fixture' in item['url'] for item in posts)
    for path in ['/rss.xml','/sitemap.xml']:
        status,body=fetch(path);assert status==200;ET.fromstring(body)
        assert 'wdx-draft-fixture' not in body and 'wdx-future-fixture' not in body
    for path in ['/journal','/llms.txt','/admin','/brand-intro.html']:
        status,_=fetch(path);assert status==200,path
    for path in ['/user/config/security-private.php','/.git/config','/user/accounts/wdx-verification-fixture.yaml','/vendor/autoload.php']:
        status,body=fetch(path);assert status in [403,404], (path,status)
    print('Homepage, Lab hooks, public article, draft/future exclusion, JSON/RSS/sitemap, admin and sensitive-path checks passed.')
finally:
    if server:
        server.terminate();server.wait(timeout=15)
    if account.exists():account.unlink()
    for folder in fixtures:
        file=folder/'item.md'
        if file.exists():file.unlink()
        if folder.exists():folder.rmdir()

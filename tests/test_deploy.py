"""Exercise publishing and rollback against an in-memory FTP server, never real hosting."""
import contextlib
import ftplib
import io
import json
import os
import pathlib
import runpy
import tempfile
import unittest
from unittest.mock import patch

DEPLOY = pathlib.Path(__file__).resolve().parents[1] / 'scripts/deploy.py'

class FakeFTP:
    def __init__(self, fail=False):
        self.files = {
            'index.html': b'old-home',
            'journal/old/index.html': b'old-post',
            '_astro/old.js': b'old-script',
            'photo_proofing/keep.txt': b'preserve',
            'codex/keep.txt': b'preserve',
            'unrelated.txt': b'preserve',
            '.wowk-astro-manifest.json': json.dumps(['index.html', 'journal/old/index.html', '_astro/old.js']).encode(),
        }
        self.fail = fail
        self.directories = set()
        self.current = '/public_html'
    def connect(self, *_): pass
    def login(self, *_): pass
    def prot_p(self): pass
    def voidcmd(self, *_): pass
    def cwd(self, name): self.current = name
    def pwd(self): return self.current
    def quit(self): pass
    def mkd(self, name): self.directories.add(name)
    def retrbinary(self, command, callback):
        name = command[5:]
        if name not in self.files: raise ftplib.error_perm('550 Missing file')
        callback(self.files[name])
    def storbinary(self, command, stream): self.files[command[5:]] = stream.read()
    def size(self, name): return len(self.files[name])
    def delete(self, name): del self.files[name]
    def rename(self, source, target):
        if self.fail and target == 'index.html':
            self.fail = False
            raise OSError('Simulated promotion failure')
        self.files[target] = self.files.pop(source)

class DeploymentTests(unittest.TestCase):
    def deploy(self, server):
        with tempfile.TemporaryDirectory(prefix='wowk-deploy-test-') as directory:
            previous = pathlib.Path.cwd()
            try:
                os.chdir(directory)
                pathlib.Path('dist/journal').mkdir(parents=True)
                pathlib.Path('dist/index.html').write_bytes(b'new-home')
                pathlib.Path('dist/journal/index.html').write_bytes(b'new-journal')
                pathlib.Path('dist/new.css').write_bytes(b'new-css')
                with patch('ftplib.FTP_TLS', return_value=server), patch.dict(os.environ, {'FTP_HOST':'test.invalid','FTP_USER':'test','FTP_PASSWORD':'test'}), patch('sys.argv', ['deploy.py']), contextlib.redirect_stdout(io.StringIO()):
                    runpy.run_path(str(DEPLOY), run_name='__main__')
            finally:
                os.chdir(previous)

    def test_success_removes_only_owned_stale_files_and_backs_up_replacements(self):
        server = FakeFTP()
        self.deploy(server)
        self.assertEqual(server.files['index.html'], b'new-home')
        self.assertEqual(server.files['journal/index.html'], b'new-journal')
        self.assertNotIn('journal/old/index.html', server.files)
        self.assertNotIn('_astro/old.js', server.files)
        for name in ['photo_proofing/keep.txt', 'codex/keep.txt', 'unrelated.txt']:
            self.assertEqual(server.files[name], b'preserve')
        self.assertTrue(any(name.startswith('_landing_backup_') and name.endswith('/index.html') and data == b'old-home' for name, data in server.files.items()))
        self.assertEqual(set(json.loads(server.files['.wowk-astro-manifest.json'])), {'index.html','journal/index.html','new.css'})

    def test_failed_promotion_restores_old_files_and_removes_new_promoted_files(self):
        server = FakeFTP(fail=True)
        with self.assertRaisesRegex(OSError, 'Simulated'):
            self.deploy(server)
        self.assertEqual(server.files['index.html'], b'old-home')
        self.assertEqual(server.files['journal/old/index.html'], b'old-post')
        self.assertNotIn('new.css', server.files)
        self.assertNotIn('journal/index.html', server.files)
        self.assertEqual(server.files['unrelated.txt'], b'preserve')

if __name__ == '__main__': unittest.main()

"""full updates (build time): registers AuroraUpdatePlugin in MainActivity and adds REQUEST_INSTALL_PACKAGES to the manifest.
Idempotent. AuroraUpdatePlugin.java itself is copied from android-src by patch-android.py."""
import json
from pathlib import Path

app_id = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
main = Path('android/app/src/main/java') / Path(*app_id.split('.')) / 'MainActivity.java'
s = main.read_text(encoding='utf-8')
reg = 'registerPlugin(AuroraFilesPlugin.class);'
if 'AuroraUpdatePlugin' not in s:
    if s.count(reg) != 1:
        raise SystemExit('MainActivity: %r found %d times (need 1)' % (reg, s.count(reg)))
    main.write_text(s.replace(reg, reg + '\n        registerPlugin(AuroraUpdatePlugin.class);'), encoding='utf-8')
mf = Path('android/app/src/main/AndroidManifest.xml')
c = mf.read_text(encoding='utf-8')
perm = 'android.permission.REQUEST_INSTALL_PACKAGES'
if perm not in c:
    mf.write_text(c.replace('</manifest>', '    <uses-permission android:name="%s" />\n</manifest>' % perm), encoding='utf-8')
print('update plugin registered')

import re, json, shutil
from pathlib import Path

manifest = Path('android/app/src/main/AndroidManifest.xml')
c = manifest.read_text(encoding='utf-8')

def set_attr(text, tag, attr, val):
    m = re.search(r'<%s\b[^>]*>' % tag, text, re.DOTALL)
    if not m:
        raise SystemExit('Tag <%s> not found in AndroidManifest.xml' % tag)
    t = m.group(0)
    if re.search(r'\s%s="' % re.escape(attr), t):
        t2 = re.sub(r'(\s%s)="[^"]*"' % re.escape(attr), r'\1="%s"' % val, t)
    else:
        t2 = t[:-1] + ' %s="%s">' % (attr, val)
    return text[:m.start()] + t2 + text[m.end():]

c = set_attr(c, 'activity', 'android:screenOrientation', 'sensorLandscape')
c = set_attr(c, 'application', 'android:icon', '@drawable/aurora_launcher')
c = set_attr(c, 'application', 'android:roundIcon', '@drawable/aurora_launcher')
c = set_attr(c, 'application', 'android:usesCleartextTraffic', 'true')
perms = [
    'android.permission.INTERNET',
    'android.permission.MANAGE_EXTERNAL_STORAGE',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.DOWNLOAD_WITHOUT_NOTIFICATION',
]
for pm in perms:
    if pm not in c:
        c = c.replace('</manifest>', '    <uses-permission android:name="%s" />\n</manifest>' % pm)
if 'requestLegacyExternalStorage' not in c:
    c = set_attr(c, 'application', 'android:requestLegacyExternalStorage', 'true')
manifest.write_text(c, encoding='utf-8')

# FileProvider paths: allow opening files from internal storage
xml = Path('android/app/src/main/res/xml'); xml.mkdir(parents=True, exist_ok=True)
(xml / 'file_paths.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<paths>\n    <external-path name="storage" path="." />\n    <cache-path name="cache" path="." />\n    <files-path name="files" path="." />\n</paths>\n', encoding='utf-8')

app_id = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
dest = Path('android/app/src/main/java') / Path(*app_id.split('.'))
dest.mkdir(parents=True, exist_ok=True)
for f in Path('android-src').glob('*.java'):
    shutil.copy(f, dest / f.name)

# black launch background (no white flash before the NexOS boot screen)
st = Path('android/app/src/main/res/values/styles.xml')
if st.exists():
    t = st.read_text(encoding='utf-8').replace('@drawable/splash', '@android:color/black')
    if 'windowBackground' not in t:
        t = re.sub(r'(<style name="AppTheme.NoActionBar"[^>]*>)', r'\1\n        <item name="android:windowBackground">@android:color/black</item>', t, count=1)
    st.write_text(t, encoding='utf-8')

drawable = Path('android/app/src/main/res/drawable')
drawable.mkdir(parents=True, exist_ok=True)
shutil.copy('assets/aurora-icon.png', drawable / 'aurora_launcher.png')
print('Android project patched: landscape, icon, native browser + files plugins')

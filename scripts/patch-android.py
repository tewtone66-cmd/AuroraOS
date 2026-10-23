import re, json, shutil
from pathlib import Path

manifest = Path('android/app/src/main/AndroidManifest.xml')
c = manifest.read_text(encoding='utf-8')

def set_attr(text, tag, attr, val):
    m = re.search(r'<%s(?=[\s>])[^>]*>' % tag, text, re.DOTALL)
    if not m:
        raise SystemExit('Tag <%s> not found in AndroidManifest.xml' % tag)
    t = m.group(0)
    if re.search(r'\s%s="' % re.escape(attr), t):
        t2 = re.sub(r'(\s%s)="[^"]*"' % re.escape(attr), r'\1="%s"' % val, t)
    else:
        t2 = t[:-1] + ' %s="%s">' % (attr, val)
    return text[:m.start()] + t2 + text[m.end():]

c = set_attr(c, 'activity', 'android:screenOrientation', 'sensorLandscape')
c = set_attr(c, 'activity', 'android:windowSoftInputMode', 'adjustNothing')
c = set_attr(c, 'application', 'android:usesCleartextTraffic', 'true')
c = set_attr(c, 'application', 'android:requestLegacyExternalStorage', 'true')

perms = ['android.permission.INTERNET', 'android.permission.MANAGE_EXTERNAL_STORAGE',
         'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE']
add = ''.join('    <uses-permission android:name="%s" />\n' % p for p in perms if p not in c)
if add:
    c = c.replace('</manifest>', add + '</manifest>')

if 'AuroraFileProvider' not in c:
    prov = ('        <provider android:name="com.auroraos.desktop.AuroraFileProvider" '
            'android:authorities="${applicationId}.aurorafiles" android:exported="false" '
            'android:grantUriPermissions="true"><meta-data android:name="android.support.FILE_PROVIDER_PATHS" '
            'android:resource="@xml/aurora_file_paths" /></provider>\n')
    c = c.replace('</application>', prov + '    </application>')
manifest.write_text(c, encoding='utf-8')

res = Path('android/app/src/main/res')
(res / 'xml').mkdir(parents=True, exist_ok=True)
(res / 'xml' / 'aurora_file_paths.xml').write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<paths><root-path name="root" path="." /></paths>\n', encoding='utf-8')

# Android 12+ system splash: same colors/icon as the app
styles = res / 'values' / 'styles.xml'
if styles.exists():
    st = styles.read_text(encoding='utf-8')
    m = re.search(r'(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)(.*?)(</style>)', st, re.S)
    if m and 'windowSplashScreenBackground' not in m.group(2):
        extra = ('\n        <item name="windowSplashScreenBackground">#06080f</item>'
                 '\n        <item name="windowSplashScreenAnimatedIcon">@drawable/aurora_ic_fg</item>\n    ')
        st = st[:m.start(3)] + extra + st[m.start(3):]
        styles.write_text(st, encoding='utf-8')

app_id = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
dest = Path('android/app/src/main/java') / Path(*app_id.split('.'))
dest.mkdir(parents=True, exist_ok=True)
for f in Path('android-src').glob('*.java'):
    shutil.copy(f, dest / f.name)
print('Android project patched: landscape, permissions, file provider, splash, plugins')

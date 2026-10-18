"""Integrates the Winlator core (Wine + Box64/Box86 + X server) into the generated Android project.

Run from the repo root after `npx cap add android` and scripts/patch-android.py.
The upstream sources are fetched at a pinned commit (not stored in this repo) and compiled into the app module:
Java (package com.winlator), native code (CMake), prebuilt libs, and the runtime assets (rootfs, box64, ...).
The app module's namespace becomes com.winlator so Winlator's R class resolves unchanged; the application id
(and therefore the app's data directory) stays the one from capacitor.config.json.
"""
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

PIN = '8077f374ef2d54127b088de9e8cd7b4af14d9c8b'
REPO = 'https://github.com/brunodev85/winlator-app'
MARK = 'aurora-winlator'

APP_ID = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
app = Path('android/app')
main = app / 'src' / 'main'
if not app.is_dir():
    raise SystemExit('android/app not found: run `npx cap add android` first')


def run(*args, cwd=None):
    subprocess.run(args, cwd=cwd, check=True)


def edit(path, fn, what):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    n = fn(s)
    if n == s:
        raise SystemExit('Could not patch %s (%s): pattern not found' % (path, what))
    p.write_text(n, encoding='utf-8')


# ---- 1. fetch upstream at the pinned commit ----
local = os.environ.get('WINLATOR_LOCAL')  # test hook: use an existing checkout instead of fetching
up = Path(local) if local else Path('winlator-upstream')
if not local:
    if up.exists():
        shutil.rmtree(up)
    up.mkdir()
    run('git', 'init', '-q', cwd=up)
    run('git', 'remote', 'add', 'origin', REPO, cwd=up)
    run('git', 'fetch', '--depth', '1', 'origin', PIN, cwd=up)
    run('git', 'checkout', '-q', 'FETCH_HEAD', cwd=up)
src = up / 'app' / 'src' / 'main'
for need in ('java/com/winlator', 'cpp/CMakeLists.txt', 'jniLibs', 'assets/rootfs.tzst', 'res'):
    if not (src / need).exists():
        raise SystemExit('Upstream layout changed: missing ' + need)

# ---- 2. copy code, native code, libs, assets ----
for sub in ('java/com/winlator', 'cpp', 'jniLibs'):
    dst = main / sub
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src / sub, dst)
(main / 'assets').mkdir(parents=True, exist_ok=True)
for item in (src / 'assets').iterdir():
    dst = main / 'assets' / item.name
    if dst.exists():
        shutil.rmtree(dst) if dst.is_dir() else dst.unlink()
    shutil.copytree(item, dst) if item.is_dir() else shutil.copy2(item, dst)

# ---- 3. the app keeps its own package: fix hard-coded data paths ----
old, new = '/data/data/com.winlator/', '/data/data/%s/' % APP_ID
count = 0
for f in (main / 'cpp').rglob('*'):
    if f.is_file() and f.suffix in ('.h', '.hpp', '.c', '.cpp', '.cc'):
        t = f.read_text(encoding='utf-8', errors='ignore')
        if old in t:
            f.write_text(t.replace(old, new), encoding='utf-8')
            count += 1
edit(main / 'java/com/winlator/core/AppUtils.java',
     lambda s: s.replace('/data/data/com.winlator/storage', '/data/data/%s/storage' % APP_ID), 'INTERNAL_STORAGE')

# Make failed Box64/Wine process launches observable and prevent the X server
# preloader from remaining on-screen forever when ProcessBuilder.start() fails.
process_helper = main / 'java/com/winlator/core/ProcessHelper.java'
def patch_process_helper(s):
    old = '        catch (Exception e) {}\n        return pid;'
    new = '''        catch (Exception e) {
            android.util.Log.e("AuroraWine", "Failed to start guest process: " + command, e);
            if (terminationCallback != null) terminationCallback.call(-1);
        }
        return pid;'''
    if old not in s:
        raise SystemExit('Could not patch ProcessHelper.java (guest process failure logging): pattern not found')
    return s.replace(old, new, 1)
edit(process_helper, patch_process_helper, 'guest process failure logging')
print('Patched %d native files for package %s' % (count, APP_ID))

# box64 must be re-extracted whenever the binary is missing, not only when the recorded version changes
edit(main / 'java/com/winlator/xenvironment/components/GuestProgramLauncherComponent.java',
     lambda s: s.replace('if (!box64Version.equals(currentBox64Version)) {',
                         'if (!box64Version.equals(currentBox64Version) || !new File(RootFS.find(context).getRootDir(), "/usr/local/bin/box64").isFile()) {'),
     'box64 re-extract')


# box64 is a glibc binary whose ELF interpreter points into /data/data/com.winlator/...; with another app id execve()
# fails with error=2 although the file exists. AuroraElf (android-src/AuroraElf.java) repairs PT_INTERP when the
# interpreter is missing. It runs right before every launch, i.e. after any (re-)extraction of box64.
def patch_launcher_interp(s):
    anchor = 'String command = rootDir+"/usr/local/bin/box64 "+guestExecutable;'
    if 'aurora-elf' in s:
        return s
    if s.count(anchor) != 1:
        raise SystemExit('GuestProgramLauncherComponent: box64 command line found %d times (need exactly 1)' % s.count(anchor))
    call = ('%s.AuroraElf.fixInterpreter(environment.getContext(), new File(rootDir, "usr/local/bin/box64")); // aurora-elf\n        '
            % APP_ID)
    return s.replace(anchor, call + anchor)


edit(main / 'java/com/winlator/xenvironment/components/GuestProgramLauncherComponent.java',
     patch_launcher_interp, 'box64 interpreter fix')

# Aurora downloads live in Android's absolute filesystem, outside the container's mapped drives.
# Winlator's unixToDOSPath otherwise returns a drive-less path (e.g. \\data\\user\\0\\...),
# so Wine's ShellExecuteEx cannot find the downloaded EXE when launched from the Aurora desktop.
wine_utils = main / 'java/com/winlator/core/WineUtils.java'
def patch_unix_to_dos(s):
    marker = 'aurora-absolute-path-z-drive'
    if marker in s:
        return s
    old = '''        if (!dosPath.startsWith("\\\\")) dosPath += "\\\\";
        dosPath = driveLetter+StringUtils.removeEndSlash(dosPath);'''
    new = '''        // aurora-absolute-path-z-drive: absolute Android paths must be addressed through Wine's Z: drive.
        if (driveLetter.isEmpty() && unixPath.startsWith("/")) {
            driveLetter = "Z:";
            dosPath = unixPath.replace("/", "\\\\");
        }
        if (!dosPath.startsWith("\\\\")) dosPath += "\\\\";
        dosPath = driveLetter+StringUtils.removeEndSlash(dosPath);'''
    if s.count(old) != 1:
        raise SystemExit('WineUtils.unixToDOSPath: expected path-conversion anchor exactly once')
    return s.replace(old, new, 1)
edit(wine_utils, patch_unix_to_dos, 'absolute Android EXE paths via Wine Z: drive')

# ---- 4. resources: merge without overwriting the Capacitor app's own ----
dst_res = main / 'res'
merged = skipped = 0
for d in sorted((src / 'res').iterdir()):
    if not d.is_dir() or d.name.startswith('mipmap'):
        continue  # keep the Aurora launcher icon
    for f in sorted(d.rglob('*')):
        if f.is_dir():
            continue
        tgt = dst_res / d.name / f.relative_to(d)
        tgt.parent.mkdir(parents=True, exist_ok=True)
        if d.name.startswith('values') and f.suffix == '.xml':
            if f.name == 'ic_launcher_background.xml':
                continue
            if tgt.exists():
                tgt = tgt.with_name('winlator_' + tgt.name)
            text = f.read_text(encoding='utf-8')
            text = re.sub(r'[ \t]*<string\s+name="app_name"[^>]*>.*?</string>[ \t]*\n?', '', text, flags=re.S)
            tgt.write_text(text, encoding='utf-8')
            merged += 1
        elif tgt.exists():
            skipped += 1
        else:
            shutil.copy2(f, tgt)
            merged += 1
print('Resources merged: %d, kept existing: %d' % (merged, skipped))

# ---- 5. manifest ----
mf = main / 'AndroidManifest.xml'
c = mf.read_text(encoding='utf-8')
c = c.replace('android:name=".MainActivity"', 'android:name="%s.MainActivity"' % APP_ID)
if 'com.winlator.XServerDisplayActivity' not in c:
    perms = ['ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE', 'MODIFY_AUDIO_SETTINGS', 'VIBRATE', 'POST_NOTIFICATIONS',
             'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_MEDIA_PLAYBACK', 'WAKE_LOCK']
    head = '    <uses-feature android:glEsVersion="0x00020000" android:required="true" />\n'
    head += ''.join('    <uses-permission android:name="android.permission.%s" />\n' % p
                    for p in perms if 'android.permission.%s"' % p not in c)
    c = c.replace('</manifest>', head + '</manifest>')
    cfg = ('android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|'
           'smallestScreenSize|density|navigation"')
    acts = ('        <!-- %s: Winlator core components -->\n'
            '        <activity android:name="com.winlator.MainActivity" android:theme="@style/AppThemeDark" '
            'android:exported="false" android:screenOrientation="sensor" %s />\n'
            '        <activity android:name="com.winlator.XServerDisplayActivity" android:exported="false" '
            'android:theme="@style/AppThemeFullscreenDark" android:supportsPictureInPicture="true" '
            'android:launchMode="singleTask" %s android:screenOrientation="sensorLandscape" />\n'
            '        <activity android:name="com.winlator.ControlsEditorActivity" android:exported="false" '
            'android:theme="@style/AppThemeFullscreenDark" android:screenOrientation="sensorLandscape" />\n'
            '        <activity android:name="com.winlator.ExternalControllerBindingsActivity" '
            'android:theme="@style/AppThemeDark" android:exported="false" android:screenOrientation="sensor" />\n'
            '        <service android:name="com.winlator.services.ForegroundService" android:enabled="true" '
            'android:exported="false" android:foregroundServiceType="mediaPlayback" android:stopWithTask="false" />\n'
            ) % (MARK, cfg, cfg)
    c = c.replace('</application>', acts + '    </application>')
mf.write_text(c, encoding='utf-8')

# ---- 6. gradle ----
edit('android/variables.gradle',
     lambda s: re.sub(r'(targetSdkVersion\s*=\s*)\d+', r'\g<1>28', re.sub(r'(minSdkVersion\s*=\s*)\d+', r'\g<1>26', s)),
     'min/target sdk')


def patch_app_gradle(s):
    if MARK in s:
        return s
    s = re.sub(r'namespace\s*=?\s*[\'"][^\'"]*[\'"]', 'namespace = "com.winlator"', s, count=1)
    s = re.sub(r'(\n\s*android\s*\{)',
               r"\1\n    // %s\n    ndkVersion '24.0.8215888'\n"
               r"    externalNativeBuild { cmake { version '3.22.1'; path 'src/main/cpp/CMakeLists.txt' } }\n"
               r"    packaging { jniLibs { useLegacyPackaging = true } }\n" % MARK, s, count=1)
    s = re.sub(r'(defaultConfig\s*\{)', r"\1\n        ndk { abiFilters 'arm64-v8a' }", s, count=1)
    deps = ["androidx.preference:preference:1.2.1", "com.google.android.material:material:1.4.0",
            "com.github.luben:zstd-jni:1.5.2-3@aar", "org.tukaani:xz:1.7",
            "org.apache.commons:commons-compress:1.20", "androidx.lifecycle:lifecycle-process:2.5.1"]
    s = re.sub(r'(\n\s*dependencies\s*\{)', lambda m: m.group(1) + ''.join("\n    implementation '%s'" % d for d in deps), s, count=1)
    return s


edit('android/app/build.gradle', patch_app_gradle, 'app/build.gradle')

# Winlator's code uses library attrs through its own R class (R.attr.colorAccent, R.attr.colorError from appcompat,
# R.attr.colorPrimarySurface from material). Upstream builds with an old Android Gradle Plugin where R classes are
# transitive. AGP 8 (Capacitor 7) defaults to android.nonTransitiveRClass=true, so com.winlator.R then contains only
# the app module's own resources and those attrs are "cannot find symbol". Restore transitive R classes.
gp = Path('android/gradle.properties')
t = gp.read_text(encoding='utf-8') if gp.exists() else ''
t = re.sub(r'(?m)^org\.gradle\.jvmargs=.*\n?', '', t)
t = re.sub(r'(?m)^android\.nonFinalResIds=.*\n?', '', t)
t = re.sub(r'(?m)^android\.nonTransitiveRClass=.*\n?', '', t)
t = t.rstrip('\n') + ('\norg.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8\n'
                      'android.nonFinalResIds=false\n'
                      'android.nonTransitiveRClass=false\n')
gp.write_text(t, encoding='utf-8')

if not local:
    shutil.rmtree(up, ignore_errors=True)
print('Winlator core integrated (pinned %s), targetSdk 28, arm64-v8a only' % PIN[:8])

"""Part 3 (EXE window): lets the Winlator program window sit exactly over an Aurora OS window frame.

Run after scripts/setup-winlator.py. Three small changes, each anchored on text that must occur exactly once;
if any anchor is missing or ambiguous nothing is written.
  1. Manifest: XServerDisplayActivity gets a translucent, animation-free theme (AuroraExeWindow), so the Aurora
     desktop stays visible around the program window.
  2. styles: the AuroraExeWindow theme (child of Winlator's AppThemeFullscreenDark).
  3. XServerDisplayActivity: the X screen size can be given by the intent extra "aurora_screen" (WxH),
     so the program starts with the size of its Aurora window.
"""
import re
from pathlib import Path

MARK = 'aurora-exe-window'
MF = Path('android/app/src/main/AndroidManifest.xml')
ACT = Path('android/app/src/main/java/com/winlator/XServerDisplayActivity.java')
STY = Path('android/app/src/main/res/values/aurora_exe_window.xml')

for p in (MF, ACT):
    if not p.is_file():
        raise SystemExit('Missing %s: run scripts/setup-winlator.py first' % p)

man = MF.read_text(encoding='utf-8')
act = ACT.read_text(encoding='utf-8')

# ---- 1. manifest ----
tags = re.findall(r'<activity\b[^>]*android:name="com\.winlator\.XServerDisplayActivity"[^>]*>', man, re.S)
if len(tags) != 1:
    raise SystemExit('Manifest: expected exactly one XServerDisplayActivity tag, found %d' % len(tags))
tag = tags[0]
if '@style/AuroraExeWindow' in tag:
    new_man = man
else:
    if tag.count('android:theme="@style/AppThemeFullscreenDark"') != 1:
        raise SystemExit('Manifest: theme attribute of XServerDisplayActivity not found exactly once')
    new_tag = tag.replace('android:theme="@style/AppThemeFullscreenDark"', 'android:theme="@style/AuroraExeWindow"')
    if man.count(tag) != 1:
        raise SystemExit('Manifest: XServerDisplayActivity tag is not unique')
    new_man = man.replace(tag, new_tag)

# ---- 3. X screen size from the intent ----
OLD = 'screenInfo = resolveScreenInfo(container.getScreenSize());'
NEW = ('screenInfo = resolveScreenInfo(getIntent().hasExtra("aurora_screen") ? '
       'getIntent().getStringExtra("aurora_screen") : container.getScreenSize()); // ' + MARK)
if MARK in act:
    new_act = act
else:
    if act.count(OLD) != 1:
        raise SystemExit('XServerDisplayActivity: screenInfo line found %d times (need exactly 1)' % act.count(OLD))
    new_act = act.replace(OLD, NEW)

# ---- 2. theme ----
STYLES = '''<?xml version="1.0" encoding="utf-8"?>
<!-- %s: translucent program window that Aurora OS places over its own window frame -->
<resources>
    <style name="AuroraExeWindow" parent="@style/AppThemeFullscreenDark">
        <item name="android:windowIsTranslucent">true</item>
        <item name="android:windowIsFloating">true</item>
        <item name="android:windowBackground">@android:color/transparent</item>
        <item name="android:colorBackgroundCacheHint">@null</item>
        <item name="android:backgroundDimEnabled">false</item>
        <item name="android:windowAnimationStyle">@null</item>
    </style>
</resources>
''' % MARK

# all checks passed: write
STY.parent.mkdir(parents=True, exist_ok=True)
STY.write_text(STYLES, encoding='utf-8')
if new_man != man:
    MF.write_text(new_man, encoding='utf-8')
if new_act != act:
    ACT.write_text(new_act, encoding='utf-8')
print('EXE window patch applied: translucent theme, aurora_screen intent extra')

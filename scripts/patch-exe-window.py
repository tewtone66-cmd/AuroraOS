"""Part 3 (EXE window): lets the Winlator program window sit exactly over an Aurora OS window frame.

Run after scripts/setup-winlator.py. Small changes, each anchored on text that must occur exactly once;
if any anchor is missing or ambiguous nothing is written.
  1. Manifest: XServerDisplayActivity gets a translucent, animation-free theme (AuroraExeWindow), so the Aurora
     desktop stays visible around the program window.
  2. styles: the AuroraExeWindow theme (child of Winlator's AppThemeFullscreenDark).
  3. XServerDisplayActivity: the X screen size can be given by the intent extra "aurora_screen" (WxH),
     so the program starts with the size of its Aurora window.
  4. XServerDisplayActivity (aurora-stage): an .exe outside the Wine C: drive (e.g. the phone's Download folder,
     names with spaces) is copied to C:\\aurora-run\\ and started from there. This avoids
     "ShellExecuteEx failed" caused by paths Wine cannot resolve. Only loose .exe files that sit directly in a
     Download folder are copied; installed programs and portable app folders are never touched. Broken downloads (too small, no MZ header)
     are reported in the error banner instead of failing silently. The banner also names the program type
     (x86/x64, Java, .NET) so a missing runtime is visible.
     The exact command given to Wine is also written to the banner ("aurora-v2 launch: ...").
"""
import re
from pathlib import Path

MARK = 'aurora-exe-window'
STAGE = 'aurora-stage'
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

# ---- 4. stage the .exe inside the Wine prefix ----
if STAGE not in new_act:
    CALL = 'execPath = WineUtils.unixToDOSPath(intent.getStringExtra("exec_path"), container);'
    if new_act.count(CALL) != 1:
        raise SystemExit('XServerDisplayActivity: exec_path conversion found %d times (need exactly 1)' % new_act.count(CALL))
    FIELD = 'private String screenEffectProfile;'
    if new_act.count(FIELD) != 1:
        raise SystemExit('XServerDisplayActivity: screenEffectProfile field found %d times (need exactly 1)' % new_act.count(FIELD))
    METHOD = r'''private void auroraNote(String msg) { // aurora-stage
        try (java.io.FileOutputStream o = new java.io.FileOutputStream(new java.io.File(getFilesDir(), "aurora-last-error.txt"), true)) {
            o.write((msg + "\n").getBytes("UTF-8"));
        }
        catch (Exception ignored) {}
    }

    private void auroraCopy(java.io.File s, java.io.File d) throws java.io.IOException {
        if (d.isFile() && d.length() == s.length()) return;
        java.nio.file.Files.copy(s.toPath(), d.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    }

    private void auroraKind(java.io.File f) {
        try (java.io.RandomAccessFile r = new java.io.RandomAccessFile(f, "r")) {
            byte[] h = new byte[1024 * 1024];
            int n = r.read(h);
            if (n < 256) return;
            int pe = (h[0x3C] & 0xff) | ((h[0x3D] & 0xff) << 8) | ((h[0x3E] & 0xff) << 16);
            if (pe <= 0 || pe + 160 >= n || h[pe] != 'P' || h[pe + 1] != 'E') return;
            int machine = (h[pe + 4] & 0xff) | ((h[pe + 5] & 0xff) << 8);
            String arch = machine == 0x8664 ? "x64" : machine == 0x14c ? "x86" : machine == 0xAA64 ? "ARM64" : "machine 0x" + Integer.toHexString(machine);
            int magic = (h[pe + 24] & 0xff) | ((h[pe + 25] & 0xff) << 8);
            int off = pe + 24 + (magic == 0x20b ? 112 : 96) + 14 * 8;
            int clr = off + 4 < n ? ((h[off] & 0xff) | ((h[off + 1] & 0xff) << 8) | ((h[off + 2] & 0xff) << 16) | ((h[off + 3] & 0xff) << 24)) : 0;
            String s = new String(h, 0, n, "ISO-8859-1");
            String kind = "native Windows program";
            if (s.contains("launch4j") || s.contains("Launch4j") || s.contains("javaw.exe") || s.contains("JAVA_HOME")) kind = "JAVA program: needs Java, which is not installed in the container";
            else if (clr != 0) kind = ".NET program: needs .NET / Wine Mono, which is not installed in the container";
            auroraNote("Program type: " + arch + ", " + kind);
        }
        catch (Exception ignored) {}
    }

    private String auroraStage(String src, com.winlator.container.Container c) {
        try {
            java.io.File f = new java.io.File(src);
            if (!f.isFile() || !src.toLowerCase().endsWith(".exe")) return null;
            long max = 300L * 1024 * 1024;
            if (f.length() < 4096) {
                auroraNote("This .exe is only " + f.length() + " bytes. The download is probably broken or not finished: download it again.");
                return null;
            }
            if (f.length() > max) return null;
            byte[] mz = new byte[2];
            try (java.io.FileInputStream in = new java.io.FileInputStream(f)) {
                if (in.read(mz) != 2 || mz[0] != 'M' || mz[1] != 'Z') {
                    auroraNote("This file is not a Windows program (no MZ header). The download is probably broken: download it again.");
                    return null;
                }
            }
            auroraKind(f);
            if (src.contains("/.wine/drive_c")) return null; // installed program: leave it exactly where it is
            java.io.File parent = f.getParentFile();
            if (parent == null || !parent.getName().toLowerCase().startsWith("download")) return null; // portable apps keep their own folder
            java.io.File dir = new java.io.File(c.getRootDir(), ".wine/drive_c/aurora-run");
            dir.mkdirs();
            java.io.File dst = new java.io.File(dir, f.getName().replaceAll("[^A-Za-z0-9._-]", "_"));
            auroraCopy(f, dst);
            return "C:\\aurora-run\\" + dst.getName();
        }
        catch (Exception e) {
            android.util.Log.e("AuroraWine", "stage failed", e);
            return null;
        }
    }'''
    new_act = new_act.replace(FIELD, FIELD + '\n    ' + METHOD)
    RET = r'return "C:\\windows\\winhandler.exe "+cmdArgs;'
    if new_act.count(RET) != 1:
        raise SystemExit('XServerDisplayActivity: winhandler return found %d times (need exactly 1)' % new_act.count(RET))
    new_act = new_act.replace(RET, r'auroraNote("aurora-v2 launch: C:\\windows\\winhandler.exe "+cmdArgs); // ' + STAGE + '\n        ' + RET)
    new_act = new_act.replace(CALL,
        'execPath = auroraStage(intent.getStringExtra("exec_path"), container); // ' + STAGE + '\n'
        '                if (execPath == null) ' + CALL)

# ---- 2. theme ----
STYLES = '''<?xml version="1.0" encoding="utf-8"?>
<!-- %s: translucent program window that Aurora OS places over its own window frame -->
<resources>
    <style name="AuroraExeWindow" parent="@style/AppThemeFullscreenDark">
        <item name="android:windowIsTranslucent">true</item>
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
print('EXE window patch applied: translucent theme, aurora_screen intent extra, exe staging')

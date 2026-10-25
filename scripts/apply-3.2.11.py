#!/usr/bin/env python3
"""NexOS 3.2.11 (run AFTER apply-3.2.10.py): cursor-log diagnostics, so the next phone run explains itself.
Why: after 3.2.9/3.2.10 no Download/aurora-cursors.txt appeared, and nothing says why (every failure was silent).
- Java: curNote() writes "# ..." lines into the SAME Download/aurora-cursors.txt:
    overlay: called ...   -> cursorOverlay() was entered (image present? screen size?)
    overlay: running      -> the per-frame loop started
    state: ...            -> what X reports under the pointer (no window / no cursor set / visible hot=x,y / hidden)
    cursor without image data -> Wine cursor exists but has no bitmap (so it cannot be logged or mapped)
  and the old per-cursor entries (size, hotspot, crc, picture, guess=) are unchanged.
- Java: empty BUILTIN_MAP slot ("crc=hand|ibeam|busy|arrow|wine" lines) that shapeOf() consults after the Download map file.
  It is EMPTY on purpose: no verified crc exists yet, and guessed crc values would never match or would show a wrong shape.
No behaviour change otherwise. Every anchor must occur exactly the expected number of times, otherwise NOTHING is written.
Idempotent (aurora-diag-3.2.11)."""
import os, re, shutil, subprocess, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p):
    with open(os.path.join(R, p), encoding='utf-8') as f: return f.read()
def wr(p, s):
    with open(os.path.join(R, p), 'w', encoding='utf-8', newline='') as f: f.write(s)
def rep(s, old, new, name, n=1):
    c = s.count(old)
    assert c == n, 'PATCH FAILED (%s): found %d places, expected %d. Send this message back.' % (name, c, n)
    return s.replace(old, new)

HELP = r'''/** aurora-diag-3.2.11 */
    private static int noteN = 0;
    private static String lastSt = "";
    /** Verified Wine cursors: lines "crc=hand|ibeam|busy|arrow|wine" (same format as Download/aurora-cursor-map.txt). Empty until aurora-cursors.txt gives real crc values. */
    private static final String BUILTIN_MAP = "";

    /** Appends one "# ..." line to Download/aurora-cursors.txt (at most 80 per app start). Never throws. */
    private static void curNote(String msg) {
        try {
            if (noteN >= 80) return;
            noteN++;
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (dl == null) return;
            String line = "# " + new java.util.Date() + " " + msg + "\n";
            try (java.io.FileOutputStream fo = new java.io.FileOutputStream(new File(dl, "aurora-cursors.txt"), true)) {
                fo.write(line.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) { }
    }

    /** Notes a change of what X reports under the pointer (once per change). */
    private static void curState(boolean hasWin, com.winlator.xserver.Cursor cu) {
        String st = !hasWin ? "no window under pointer"
            : cu == null ? "window has no cursor set"
            : cu.isVisible() ? "cursor visible hot=" + cu.hotSpotX + "," + cu.hotSpotY
            : "cursor hidden";
        if (st.equals(lastSt)) return;
        lastSt = st;
        curNote("state: " + st);
    }

    private static String builtinShape(String crc) {
        for (String line : BUILTIN_MAP.split("\\r?\\n")) {
            String t = line.trim();
            int e = t.indexOf('=');
            if (t.startsWith("#") || e <= 0) continue;
            if (t.substring(0, e).trim().equalsIgnoreCase(crc)) return t.substring(e + 1).trim().toLowerCase();
        }
        return null;
    }

    '''
END = '/** Sends the whole app to the background (programs keep running). */'

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-diag-3.2.11' in j:
    print('java already patched, skipping')
else:
    assert 'aurora-shapes-3.2.10' in j, 'Run scripts/apply-3.2.10.py first.'
    j = rep(j, END, HELP + END, 'helpers')
    j = rep(j, 'final android.graphics.Bitmap bmp = cursorBmp;',
            'final android.graphics.Bitmap bmp = cursorBmp;\n'
            '            curNote("overlay: called, nexos cursor image=" + (bmp != null) + ", screen=" + (a == null ? "null" : a.getIntent().getStringExtra("aurora_screen")));',
            'overlay entry')
    j = rep(j, 'if (!(po instanceof com.winlator.xserver.Pointer)) return;',
            'if (!(po instanceof com.winlator.xserver.Pointer)) { curNote("overlay: xs.pointer is not a Pointer"); return; }', 'pointer check')
    j = rep(j, 'overlayOk = true;', 'overlayOk = true;\n            curNote("overlay: running (frame loop started)");', 'overlay running')
    j = rep(j, 'if (cu != null && cu != lastCu) { lastCu = cu; logCursor(cu); }',
            'curState(pw != null, cu);\n                            if (cu != null && cu != lastCu) { lastCu = cu; logCursor(cu); }', 'state')
    j = rep(j, 'if (d == null || d.getData() == null || cuSeen.size() >= 80) return;',
            'if (d == null || d.getData() == null) {\n'
            '                if (cuSeen.add("nodata " + cu.hotSpotX + "," + cu.hotSpotY)) curNote("cursor without image data: hot=" + cu.hotSpotX + "," + cu.hotSpotY + " image=" + (d != null));\n'
            '                return;\n'
            '            }\n'
            '            if (cuSeen.size() >= 80) return;', 'nodata')
    j = rep(j, 'String t = tabLookup(Long.toHexString(crc.getValue()));',
            'String hx = Long.toHexString(crc.getValue());\n'
            '                String t = tabLookup(hx);\n'
            '                if (t == null) t = builtinShape(hx);', 'builtin')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

p = 'src/index.html'
s = rd(p)
if "'Installed version','3.2.11'" in s:
    print('index.html already patched, skipping')
else:
    n = s.count("'Installed version','3.2.10'"); assert n >= 1, 'PATCH FAILED (version): not found. Run scripts/apply-3.2.10.py first.'
    s = s.replace("'Installed version','3.2.10'", "'Installed version','3.2.11'")
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched (%d version place(s))' % n)

pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.11\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.11')
d = rd('DEV-NOTES.md')
if '## 3.2.11' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.11 - cursor-log diagnostics (aurora-diag-3.2.11)
- No aurora-cursors.txt appeared after 3.2.9/3.2.10 and every failure was silent. curNote() now writes "# ..." lines into the same file: overlay called/running, state under the pointer, cursors without image data.
- Reading the file: no "overlay: called" = cursorOverlay never ran; "called" without "running" = early return; "no window under pointer" / "window has no cursor set" = X never gives a cursor, so nothing to map; "visible hot=.." without a cursor entry = see "without image data".
- BUILTIN_MAP in AuroraWinePlugin.java is empty on purpose; fill it with verified "crc=shape" lines from aurora-cursors.txt (shapeOf checks Download/aurora-cursor-map.txt first, then BUILTIN_MAP).
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.11' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.11
- Cursor-log diagnostics + empty BUILTIN_MAP slot. Phone test pending. Next: fill BUILTIN_MAP from a verified aurora-cursors.txt.
''' + '\n'); print('NEXT.md updated')
print('OK')

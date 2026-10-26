#!/usr/bin/env python3
"""NexOS 3.2.13: no black Wine screen (see scripts/patch-exe-clear.py for the cause and the build-time changes).
This script: (1) installs scripts/patch-exe-clear.py's call at the end of scripts/patch-exe-window.py,
(2) AuroraWinePlugin.java switches GLRenderer.auroraClear on while a program runs inside an Aurora window rect and off when it ends,
(3) version 3.2.13. Works after 3.2.11 or 3.2.12. Idempotent (aurora-clear-3.2.13). Anchors must match exactly, otherwise nothing is written."""
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
assert os.path.isfile(os.path.join(R, 'scripts/patch-exe-clear.py')), 'scripts/patch-exe-clear.py is missing (it must be in the same zip).'

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'auroraClear' in j:
    print('java already patched, skipping')
else:
    j = rep(j, 'xsRef = xs; fitRoot = root; xsW = sw; xsH = sh; // aurora-fill-3.2.7',
            'xsRef = xs; fitRoot = root; xsW = sw; xsH = sh; // aurora-fill-3.2.7\n'
            '            com.winlator.renderer.GLRenderer.auroraClear = true; // aurora-clear-3.2.13: Wine desktop not drawn inside an Aurora window', 'on')
    j = rep(j, 'fitRoot = null; xsRef = null; fitRend = null;',
            'fitRoot = null; xsRef = null; fitRend = null;\n'
            '                        com.winlator.renderer.GLRenderer.auroraClear = false;', 'off')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

wp = 'scripts/patch-exe-window.py'
w = rd(wp)
if 'patch-exe-clear.py' in w:
    print('patch-exe-window.py already calls patch-exe-clear.py, skipping')
else:
    assert w.rstrip().endswith("print('EXE window patch applied: translucent theme, aurora_screen intent extra, exe staging')"), 'patch-exe-window.py ends differently than expected'
    wr(wp, w.rstrip('\n') + "\n\n# aurora-clear-3.2.13: no black Wine screen\nimport subprocess, sys\nsubprocess.run([sys.executable, 'scripts/patch-exe-clear.py'], check=True)\n")
    print('patch-exe-window.py now calls patch-exe-clear.py')

p = 'src/index.html'
s = rd(p)
if "'Installed version','3.2.13'" in s:
    print('index.html already patched, skipping')
else:
    pat = re.compile(r"('Installed version',\s*')[0-9][0-9.]*(')")
    n = len(pat.findall(s))
    if n == 0: print('WARNING: no "Installed version" label found in index.html; label not changed (cosmetic only).')
    else: s = pat.sub(r"\g<1>3.2.13\g<2>", s)
    old = 'any'
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched (%d place(s), from %s)' % (n, old))
pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.13\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.13')
d = rd('DEV-NOTES.md')
if '## 3.2.13' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.13 - no black Wine screen (aurora-clear-3.2.13)
- Read from Winlator 8077f37: GLRenderer clears to alpha 0 and the EGL config has alpha, but the surface was opaque and the Wine desktop window (explorer.exe, black) was drawn. Build-time patch scripts/patch-exe-clear.py (called from patch-exe-window.py): GLRenderer.auroraClear skips desktop windows, XServerView surface TRANSLUCENT, AuroraExeWindow windowBackground transparent. AuroraWinePlugin turns the flag on in cursorOverlay and off when the program ends.
- Unverified on device. If the black stays: XServerDisplayActivity may set its own background (grep setBackground|FLXServerDisplay in com/winlator/XServerDisplayActivity.java).
- Side effect: Wine's own taskbar (also WM_CLASS explorer.exe) is not drawn either.
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.13' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.13
- No black Wine screen (build-time patch). Phone test pending. Open: Wine startup delay (mostly Wine/box64 boot time), NexOS window over Wine glitch (needs a description), BUILTIN_MAP.
''' + '\n'); print('NEXT.md updated')
print('OK')

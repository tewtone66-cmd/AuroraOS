#!/usr/bin/env python3
"""NexOS 3.2.14: fills the built-in cursor table from the REAL phone log (aurora-cursors.txt) and stops hiding the mouse.
From the log: deadd746 = 20x20 hourglass (hot 10,10) = busy; 1d2d519e = 20x20 arrow (hot 0,0) = arrow (arrow is already handled by hotspot);
2144df1c = 1x1 blank cursor = what Wine reports as "cursor hidden". No hand / I-beam sample was in the log, those stay geometric guesses.
1) BUILTIN_MAP gets the two verified crc values.  2) A hidden Wine cursor no longer hides the NexOS mouse (it shows the arrow):
the log shows visible/hidden flipping every second while the pointer moves between windows, which matches "the mouse vanishes".
3) "state:" notes in the log are limited to 12 so they no longer use up the log's note budget.
Idempotent (aurora-nohide-3.2.14). Anchors must match exactly, otherwise nothing is written."""
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

jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-nohide-3.2.14' in j:
    print('java already patched, skipping')
else:
    assert 'aurora-diag-3.2.11' in j, 'Run scripts/apply-3.2.11.py first.'
    j = rep(j, 'private static final String BUILTIN_MAP = "";',
            'private static final String BUILTIN_MAP = "deadd746=busy\\n1d2d519e=arrow\\n"; // aurora-nohide-3.2.14: verified on a phone (aurora-cursors.txt)', 'table')
    j = rep(j, 'boolean hide = cu != null && !cu.isVisible();',
            'boolean hide = false; // aurora-nohide-3.2.14: a hidden Wine cursor shows the NexOS arrow instead of nothing', 'hide')
    j = rep(j, 'private static String lastSt = "";', 'private static String lastSt = "";\n    private static int stateN = 0;', 'stateN')
    j = rep(j, 'curNote("state: " + st);', 'if (stateN++ < 12) curNote("state: " + st);', 'state cap')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')

p = 'src/index.html'
s = rd(p)
if "'Installed version','3.2.14'" in s:
    print('index.html already patched, skipping')
else:
    pat = re.compile(r"('Installed version',\s*')[0-9][0-9.]*(')")
    n = len(pat.findall(s))
    if n == 0: print('WARNING: no "Installed version" label found in index.html; label not changed (cosmetic only).')
    else: s = pat.sub(r"\g<1>3.2.14\g<2>", s)
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched (%d version place(s))' % n)
pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>3.2.14\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json -> 3.2.14')
d = rd('DEV-NOTES.md')
if '## 3.2.14' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '''

## 3.2.14 - cursor table from the real log + no hidden mouse (aurora-nohide-3.2.14)
- Real aurora-cursors.txt: deadd746 = hourglass 20x20 hot 10,10 (busy); 1d2d519e = arrow 20x20 hot 0,0; 2144df1c = 1x1 blank (Wine "hidden"). Table is in BUILTIN_MAP (AuroraWinePlugin.java). Hand and I-beam crc values are still unknown (no sample yet: hover a link and a text box in an EXE, then read the log again).
- Hidden Wine cursor (1x1) used to hide the NexOS mouse; the log showed visible/hidden flipping about once a second. Now the NexOS arrow stays. Side effect: programs that hide the cursor on purpose (games) show the arrow; make it a setting if that matters.
''' + '\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.14' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '''

## Done in 3.2.14
- BUILTIN_MAP: busy + arrow verified from the log; mouse no longer hidden. Phone test pending. Open: hand/I-beam crc (need samples), NexOS-window-over-Wine glitch (needs a description).
''' + '\n'); print('NEXT.md updated')
print('OK')

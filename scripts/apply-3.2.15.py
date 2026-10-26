#!/usr/bin/env python3
"""NexOS 3.2.15: (1) Wine start shows elapsed seconds, (2) extra transparent-background safety for the black Wine screen (build-time, scripts/patch-exe-clear2.py),
(3) unknown Wine cursors (hand, I-beam...) are drawn from Wine's own bitmap instead of a geometric GUESS.
Idempotent (aurora-tick-3.2.15). Run from repo root. Anchors must match exactly, otherwise nothing is written."""
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
V = '3.2.15'
p = 'src/index.html'
s = rd(p)
if 'aurora-tick-3.2.15' in s:
    print('index.html already patched, skipping')
else:
    s = rep(s, "const exePushSoon=w=>",
      "/*aurora-tick-3.2.15*/const exeTick=w=>{clearInterval(w.tk);const t0=Date.now();w.tk=setInterval(()=>{if(!W[w.id]||w.exeUp||w.err){clearInterval(w.tk);return}const sec=Math.round((Date.now()-t0)/1000);w.exeStep(2,'Starting Wine… '+sec+'s'+(sec>20?' (first launch is slow)':''))},1000)};\nconst exePushSoon=w=>", 'tick fn')
    s = rep(s, "w.exeStep(2,'Starting Wine…');exePushSoon(w)}", "w.exeStep(2,'Starting Wine…');exeTick(w);exePushSoon(w)}", 'launching')
    s = rep(s, "else if(k==='running'){w.exeStep(3,", "else if(k==='running'){clearInterval(w.tk);w.exeStep(3,", 'running')
    s = rep(s, "else if(k==='error'){w.err=", "else if(k==='error'){clearInterval(w.tk);w.err=", 'error')
    pat = re.compile(r"('Installed version',\s*')[0-9][0-9.]*(')")
    n = len(pat.findall(s))
    if n == 0: print('WARNING: no "Installed version" label found; label not changed (cosmetic only).')
    else: s = pat.sub(r"\g<1>" + V + r"\g<2>", s)
    if shutil.which('node'):
        for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
            body = m.group(1)
            if not body.strip(): continue
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(body)
            r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True); os.unlink(t.name)
            assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    wr(p, s); print('index.html patched')
jp = 'android-src/AuroraWinePlugin.java'
j = rd(jp)
if 'aurora-noguess-3.2.15' in j:
    print('java already patched, skipping')
else:
    j = rep(j, 'r = t != null ? t : guessShape(b, W, H, cu.hotSpotX, cu.hotSpotY);',
            'r = t; // aurora-noguess-3.2.15: no geometric guess; unknown cursors are drawn from Wine\'s own bitmap (wineBmp)', 'noguess')
    assert j.count('{') == j.count('}'), 'JAVA brace mismatch after patch'
    wr(jp, j); print('AuroraWinePlugin.java patched')
cp = 'scripts/patch-exe-clear.py'
c = rd(cp)
if 'patch-exe-clear2.py' in c:
    print('patch-exe-clear.py already calls clear2, skipping')
else:
    assert os.path.isfile(os.path.join(R, 'scripts/patch-exe-clear2.py')), 'scripts/patch-exe-clear2.py is missing (it must be in the same zip).'
    wr(cp, c.rstrip('\n') + "\n\n# aurora-clear2-3.2.15\nimport subprocess, sys\nsubprocess.run([sys.executable, 'scripts/patch-exe-clear2.py'], check=True)\n"); print('patch-exe-clear.py now calls clear2')

pj = rd('package.json'); pj2 = re.sub(r'("version"\s*:\s*")[^"]*(")', r'\g<1>' + V + r'\g<2>', pj, count=1)
if pj2 != pj: wr('package.json', pj2); print('package.json ->', V)
d = rd('DEV-NOTES.md')
if '## 3.2.15' not in d:
    wr('DEV-NOTES.md', d.rstrip('\n') + '\n\n## 3.2.15 - Wine start timer (aurora-tick-3.2.15)\n- "Starting Wine..." shows elapsed seconds (exeTick). Most of the delay is Wine/box64 boot, not NexOS code. Untested on phone.\n- Black Wine: patch-exe-clear2.py makes window/decor/root transparent + translucent holder (build-time; unverified). Hand/I-beam: guess removed, drawn from the Wine bitmap. NOT done: NexOS-window-over-Wine glitch (no description).\n'); print('DEV-NOTES.md updated')
nx = rd('NEXT.md')
if 'Done in 3.2.15' not in nx:
    wr('NEXT.md', nx.rstrip('\n') + '\n\n## Done in 3.2.15\n- Start timer only. Still open: test 3.2.12-3.2.14, Wine black (XServerDisplayActivity background), hand/I-beam crc, window overlap description.\n'); print('NEXT.md updated')
print('OK')

#!/usr/bin/env python3
"""Adds the Windows PC (v86) app to src/index.html. Safe to run twice."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
mod = (root / 'src' / 'winvm.js').read_text(encoding='utf-8')
s = idx.read_text(encoding='utf-8')
if 'appWin(' in s:
    print('Windows PC app already present - nothing to do'); sys.exit(0)
mod = mod.replace("if(typeof module!=='undefined')module.exports={mkFloppy};\n", '')
css = (".vmw{display:flex;flex-direction:column;height:100%;background:#000;color:#fff}"
 ".vmt{display:flex;gap:2px;padding:4px 8px;background:var(--surf2);color:var(--txt);flex:none;overflow-x:auto;scrollbar-width:none;touch-action:pan-x}"
 ".vsc{flex:1;min-height:0;position:relative;touch-action:none;background:#000;overflow:hidden;user-select:none}"
 ".vsc canvas{width:100%!important;height:100%!important;object-fit:contain;display:block}"
 ".vsu{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:20px;background:var(--surf);color:var(--txt);z-index:2}"
 ".vsu p{margin:0;max-width:420px;color:var(--mut);line-height:1.5;word-break:break-word}.vsu input{width:min(92%,420px);height:34px;border:1px solid var(--line);border-radius:6px;padding:0 10px;background:var(--surf2);user-select:text;-webkit-user-select:text;outline:none}\n")
edits = [
 ("@media (prefers-reduced-motion:reduce)", css + "@media (prefers-reduced-motion:reduce)"),
 ("[()=>applyTheme(),()=>applyWall()", mod + "\n[()=>applyTheme(),()=>applyWall()"),
 ("['calc'],['set']];", "['calc'],['set'],['win']];"),
 ("const EXT={img:", "const EXT={exe:'exe',img:"),
 ("const FC={img:'#34c27a',", "const FC={exe:'#3b82f6',img:'#34c27a',"),
 ("else if(k==='txt')openApp('notes',{path:it.path});else NF.open(", "else if(k==='txt')openApp('notes',{path:it.path});else if(k==='exe')openApp('win',{exe:it.path});else NF.open("),
]
for a, b in edits:
    if s.count(a) != 1:
        sys.exit('ANCHOR PROBLEM (found %d): %s' % (s.count(a), a)) 
    s = s.replace(a, b)
idx.write_text(s, encoding='utf-8')
open('/tmp/aurora_check.js', 'w', encoding='utf-8').write('\n'.join(re.findall(r'<script>(.*?)</script>', s, re.S)))
print('Windows PC app added')

#!/usr/bin/env python3
"""File Explorer: unknown file types open Aurora's own 'Open with' list instead of the Android chooser. Safe to run twice."""
import re, sys, pathlib
idx = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'function owith(' in s:
    print('Open-with already present - nothing to do'); sys.exit(0)
fn = ("function owith(it){if(kind(it)==='apk')return NF.open({path:it.path,mimeType:it.mimeType}).catch(err);"
 "const d=dialog(w,{title:'Open with',msg:it.name,html:'<div style=\"display:flex;flex-direction:column;gap:6px\"><button class=\"ib\" data-o=\"notes\">Notepad (as text)</button><button class=\"ib\" data-o=\"photos\">Photos</button><button class=\"ib\" data-o=\"media\">Media Player</button><button class=\"ib\" data-o=\"sys\">Other Android apps\u2026</button></div>',ok:'Cancel',noCancel:true});"
 "$$('[data-o]',d).forEach(b=>b.onclick=()=>{const o=b.dataset.o;d.remove();if(o==='notes')openApp('notes',{path:it.path});else if(o==='photos')openApp('photos',{path:it.path,list:[it.path]});else if(o==='media')openApp('media',{path:it.path,list:[it.path]});else NF.open({path:it.path,mimeType:it.mimeType}).catch(err)})}\n")
edits = [
 ("else NF.open({path:it.path,mimeType:it.mimeType}).catch(err)}", "else owith(it)}"),
 ("function act(el,fn,e){", fn + "function act(el,fn,e){"),
]
for a, b in edits:
    if s.count(a) != 1:
        sys.exit('ANCHOR PROBLEM (found %d): %s' % (s.count(a), a))
    s = s.replace(a, b)
idx.write_text(s, encoding='utf-8')
open('/tmp/aurora_check.js', 'w', encoding='utf-8').write('\n'.join(re.findall(r'<script>(.*?)</script>', s, re.S)))
print('Open-with added')

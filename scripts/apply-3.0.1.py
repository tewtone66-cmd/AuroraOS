#!/usr/bin/env python3
# NexOS 3.0.1 - performance patch (run from the repo root)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'PERF-3.0.1' in s:
    print('already applied'); sys.exit(0)


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# 1) window drag / resize: one move per frame + cheap "dragging" mode
rep("dragging=true;sync();const mv=ev=>{if(ev.pointerId===pid)move(s,ev.clientX-x0,ev.clientY-y0)},up=ev=>{if(ev&&ev.pointerId!==pid)return;removeEventListener('pointermove',mv);",
    "dragging=true;document.body.classList.add('pdrag');sync();let ra=0,le=null;const fl=()=>{ra=0;if(le){const q=le;le=null;move(s,q.clientX-x0,q.clientY-y0)}},mv=ev=>{if(ev.pointerId!==pid)return;le=ev;if(!ra)ra=requestAnimationFrame(fl)},up=ev=>{if(ev&&ev.pointerId!==pid)return;if(ra){cancelAnimationFrame(ra);ra=0}if(le)fl();document.body.classList.remove('pdrag');removeEventListener('pointermove',mv);")

# 2) dock magnify: one layout pass per frame
rep("dk.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')dockFx(e.clientX,e.clientY)});dk.addEventListener('pointerleave',()=>dockFx(null,0));",
    "let dfr=0,dfe=null;dk.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;dfe=e;if(!dfr)dfr=requestAnimationFrame(()=>{dfr=0;if(dfe){const q=dfe;dfe=null;dockFx(q.clientX,q.clientY)}})},{passive:true});dk.addEventListener('pointerleave',()=>{dfe=null;dockFx(null,0)});")

# 3) performance mode setting
rep("mb:ls('aur.mb')!=='0'};", "mb:ls('aur.mb')!=='0',perf:ls('aur.perf')==='1'};")
rep("function setMB(on){",
    "function setPerf(on){S.perf=!!on;ls('aur.perf',on?'1':'0');document.body.classList.toggle('perf',!!on)}function setMB(on){")
rep("else if(k==='tbm'){",
    "else if(k==='perf'){setPerf(v==='1')}else if(k==='tbm'){")
rep("<h4>Show clock</h4>${onoff('tbk',S.tbk)}",
    "<h4>Show clock</h4>${onoff('tbk',S.tbk)}<h4>Performance mode (no blur, shadows or heavy animations)</h4>${onoff('perf',S.perf)}")
rep("()=>applyMouse(),", "()=>applyMouse(),()=>document.body.classList.toggle('perf',!!S.perf),")

# 4) css
css = """/* PERF-3.0.1 */
body.pdrag .win{box-shadow:none!important}
body.pdrag #dock,body.pdrag #start,body.pdrag #np,body.pdrag #npc{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
body.perf *,body.perf *::before,body.perf *::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important;text-shadow:none!important}
body.perf #dock{background:rgba(24,28,42,.94)!important}
body.perf #start,body.perf #ctx,body.perf #npc,body.perf #toast{background:var(--surf)!important}
body.perf #cur svg.cs{filter:none!important}
body.perf .win.opening,body.perf .win.minning,body.perf .win.closing{animation-duration:.01s!important}
body.perf [class*=spin],body.perf [class*=ind]{animation:none!important}
"""
a, b, c = s.partition('<!--NEXOS-START-->')
assert b, 'NEXOS-START marker not found'
assert c.count('</style>') >= 1
s = a + b + c.replace('</style>', css + '</style>', 1)

# 5) version labels
s = s.replace('Version 3.0.0 alpha', 'Version 3.0.1 alpha').replace("'3.0.0 alpha'", "'3.0.1 alpha'")
s = s.replace('<p>Version 3.0.0 alpha</p>', '<p>Version 3.0.1 alpha</p>')
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    t = re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.1"', t, count=1)
    pj.write_text(t, encoding='utf-8')

# 6) notes
dn = root / 'DEV-NOTES.md'
with dn.open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.1 (perf): drag()/dockFx با rAF (یک حرکت در هر فریم)؛ کلاس body.pdrag هنگام درگ سایه/بلور رو خاموش می‌کنه؛ حالت کارایی: S.perf، setPerf()، کلاس body.perf، کلید aur.perf، تنظیمات ← تسک‌بار؛ CSS با کامنت PERF-3.0.1 ته استایل\n")
nx = root / 'NEXT.md'
with nx.open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.1\nروی گوشی تست نشده. اگه هنوز لگ داره: حالت کارایی رو روشن کن و بگو کدوم بخش (باز کردن پنجره، درگ، دَک، مرورگر) کنده. گلوگاه بعدی: بلور ثابت دَک/استارت و انیمیشن‌های infinite بوت.\n")
print('ok')

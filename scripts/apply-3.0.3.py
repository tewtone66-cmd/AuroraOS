#!/usr/bin/env python3
# NexOS 3.0.3 - typing fix + new mouse cursor + mouse options (run from repo root, after 3.0.2)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'MOUSE-3.0.3' in s:
    print('already applied'); sys.exit(0)
assert 'DND-3.0.2' in s, 'apply apply-3.0.2.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# 1) typing: real touch events on the virtual-mouse pad must not steal focus from the text box
rep("pad.addEventListener('pointerdown',e=>{pad.setPointerCapture(e.pointerId);pDown(e.pointerId,e.clientX,e.clientY)});",
    "pad.addEventListener('pointerdown',e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);pDown(e.pointerId,e.clientX,e.clientY)});pad.addEventListener('mousedown',e=>e.preventDefault());pad.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});")

# 2) robust focus + keyboard
rep("const focusEl=t=>{const f=t.closest&&t.closest('input,textarea,select');if(f){f.focus();NB&&NB.showKeyboard().catch(()=>{})}};",
    "const kbShow=f=>{if(!S.kb)return;try{NB&&NB.showKeyboard().catch(()=>{})}catch(e){}[60,200].forEach(ms=>setTimeout(()=>{if(f&&f.isConnected&&document.activeElement!==f)try{f.focus({preventScroll:true})}catch(e){}},ms))};"
    "const focusEl=t=>{const f=t.closest&&t.closest('input,textarea,select');if(f){try{f.focus({preventScroll:true})}catch(e){f.focus()}kbShow(f)}};"
    "addEventListener('focusin',e=>{const t=e.target;if(t&&t.matches&&t.matches('input:not([type=color]):not([type=checkbox]):not([type=range]):not([type=radio]),textarea'))kbShow(t)});"
    "addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||!e.key||e.key.length!==1)return;const st=$('#start');if(st&&st.classList.contains('show')){const q=$('#sq');if(q&&document.activeElement!==q)q.focus()}},true);")

# 3) new options
rep("perf:ls('aur.perf')==='1'}", "perf:ls('aur.perf')==='1',rp:ls('aur.rp')!=='0',kb:ls('aur.kb')!=='0'}")
rep("else if(k==='perf'){", "else if(k==='rp'){S.rp=v==='1';ls('aur.rp',v)}else if(k==='kb'){S.kb=v==='1';ls('aur.kb',v)}else if(k==='perf'){")
rep("<h4>Scroll speed</h4>${chips('sc',[1,2,4,7,10,14],S.sc,v=>v+'×')}",
    "<h4>Scroll speed</h4>${chips('sc',[1,2,4,7,10,14],S.sc,v=>v+'×')}<h4>Click ripple</h4>${onoff('rp',S.rp)}<h4>Show keyboard when tapping a text box</h4>${onoff('kb',S.kb)}")
rep("function ripple(){", "function ripple(){if(!S.rp)return;")

# 4) new cursor shapes (the settings preview clones these, so one edit covers both)
old_arrow = '<path d="M1 1L1 20L6 15L10 24L14 22L10 14L17 14Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>'
new_arrow = '<path d="M1.2 1.2V21.4L6.2 16.6L9.4 24.6L13.4 22.9L10.3 15.2H17.2Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/>'
rep(old_arrow, new_arrow)

a = s.index('<svg class="cs sh" viewBox="0 0 26 28">')
b = s.index('</svg>', a) + len('</svg>')
hand = ('<svg class="cs sh" viewBox="0 0 26 28">'
        '<path d="M9.2 1.2C10.6 1.2 11.6 2.2 11.6 3.6V10.2C12 9.9 12.5 9.8 13 9.8C14.1 9.8 14.9 10.5 15.1 11.4'
        'C15.5 11.1 15.9 11 16.4 11C17.5 11 18.4 11.7 18.6 12.7C19 12.5 19.4 12.4 19.8 12.4C21.2 12.4 22.3 13.5 22.3 14.9'
        'V19.6C22.3 23.2 19.5 26 16 26H12.6C10.4 26 8.7 25 7.6 23.3L3 16.4C2.4 15.4 2.7 14.4 3.6 14C4.5 13.6 5.5 13.9 6.1 14.6'
        'L7 15.8V3.6C7 2.2 8 1.2 9.2 1.2Z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/>'
        '<path class="ln" d="M11.6 11.4V15.6M15.1 12.2V15.6M18.6 13.4V15.6"/></svg>')
s = s[:a] + hand + s[b:]

css = """/* MOUSE-3.0.3 */
#cur .sh path.ln,.mpv .sh path.ln,.mpm .sh path.ln{fill:none!important;stroke:var(--cs,#111);stroke-opacity:.45;stroke-width:.9;stroke-linecap:round}
"""
p, m, c = s.partition('<!--NEXOS-START-->')
assert m and '</style>' in c
s = p + m + c.replace('</style>', css + '</style>', 1)

# 5) version labels
s = s.replace('Version 3.0.2 alpha', 'Version 3.0.3 alpha').replace("'3.0.2 alpha'", "'3.0.3 alpha'")
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.3"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.3 (mouse/typing): علت باگ تایپ: رویدادهای ماوسِ خودکارِ لمس روی #pad فوکوس input رو می‌پروندن (فقط با نگه‌داشتن تایپ می‌شد)؛ حالا pad روی pointerdown/mousedown/touchstart preventDefault می‌کنه. kbShow() + focusin سراسری کیبورد رو نشون میده و فوکوس رو بعد ۶۰ و ۲۰۰ms برمی‌گردونه؛ تایپ وقتی استارت بازه به #sq میره. شکل جدید فلش و دست داخل #cur (پیش‌نمایش ستینگ از همونا کلون میشه). گزینه‌های جدید: S.rp (ripple کلیک)، S.kb (کیبورد خودکار)\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.3\nروی گوشی تست نشده. اگه تایپ هنوز مشکل داره بگو توی کدوم بخش (استارت، تسک‌بار، مرورگر، فایل‌منیجر) و ماوس مجازی روشن بود یا نه. ماوس داخل exe با عکس لحظه‌ی شروع ساخته میشه، پس شکل جدید فقط بعد از اجرای مجدد اعمال میشه.\n")
print('ok')

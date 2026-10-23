#!/usr/bin/env python3
# NexOS 3.0.2 - drag & drop rewrite + hold-to-drag times + drag speed fix (run from repo root, after 3.0.1)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'DND-3.0.2' in s:
    print('already applied'); sys.exit(0)
assert 'PERF-3.0.1' in s, 'apply apply-3.0.1.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# 1) hold-to-drag times: 0.1 (instant) / 0.3 (default) / 0.5 / 0.7 / 1.0
rep("hd:(v=>[600,1000,2000].includes(v)?v:1000)(+ls('aur.hd'))",
    "hd:(v=>[100,300,500,700,1000].includes(v)?v:300)(+ls('aur.hd3'))")
rep("<h4>Hold to drag</h4>${chips('hd',[600,1000,2000],S.hd,v=>(v/1000)+' s')}",
    "<h4>Hold to drag (default 0.3 s)</h4>${chips('hd',[100,300,500,700,1000],S.hd,v=>v===100?'0.1 s · instant':(v/1000)+' s')}")
rep("else if(k==='hd'){S.hd=+v;ls('aur.hd',S.hd)}",
    "else if(k==='hd'){S.hd=+v;ls('aur.hd3',S.hd)}")

# 2) pointer speed no longer drops to 1x while dragging
rep("const gn=VM.L?1:S.sp*(.75+Math.min(1.25,Math.hypot(dx,dy)/14));",
    "const gn=S.sp*(.75+Math.min(1.25,Math.hypot(dx,dy)/14));")

# 3) desktop icon drag & drop rewrite
a = s.index("(()=>{const ic=$('#icons');let d=null,sup=false;")
tail = "ic.addEventListener('click',e=>{if(sup){e.stopPropagation();e.preventDefault()}},true)})();"
b = s.index(tail, a) + len(tail)
assert s.count("(()=>{const ic=$('#icons');let d=null,sup=false;") == 1
new = r"""(()=>{const ic=$('#icons');let d=null,sup=false,hot=null,ra=0,le=null;const TH=5;
const clr=()=>{if(hot){hot.classList.remove('dt');hot=null}};
const over=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest?e.closest('.di'):null};
const nearest=(x,y,ex)=>{let best=null,bd=1e9;$$('.di',ic).forEach(b=>{if(b===ex)return;const r=b.getBoundingClientRect(),dd=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2));if(dd<bd){bd=dd;best=b}});return best};
const isTr=b=>!!b&&(b.dataset.k||'').split('|')[0]==='trash';
const fin=()=>{if(ra){cancelAnimationFrame(ra);ra=0}le=null;clr();if(d&&d.g){d.g.remove();d.b.classList.remove('drag')}document.body.classList.remove('pdrag');dragging=false};
const frame=()=>{ra=0;if(!d||!d.go||!le)return;const e=le;le=null;d.g.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px) scale(1.04)`;const t=over(e.clientX,e.clientY),tg=t&&t!==d.b?t:null;if(tg!==hot){clr();if(tg){hot=tg;tg.classList.add('dt')}}};
ic.addEventListener('pointerdown',e=>{const b=e.target.closest('.di');if(!b||e.button)return;d={b,x:e.clientX,y:e.clientY,go:false,pid:e.pointerId}});
addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.pid)return;if(!d.go){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<TH)return;d.go=true;const r=d.b.getBoundingClientRect(),g=d.b.cloneNode(true);g.classList.add('ghost');g.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;document.body.appendChild(g);d.g=g;d.b.classList.add('drag');document.body.classList.add('pdrag');dragging=true;sync()}le=e;if(!ra)ra=requestAnimationFrame(frame)});
const end=e=>{if(!d||e.pointerId!==d.pid)return;const s0=d;d=null;if(!s0.go)return;sup=true;setTimeout(()=>sup=false,60);const x=e.clientX,y=e.clientY,t=over(x,y),tg=t&&t!==s0.b?t:null;s0.g&&s0.g.remove();s0.b.classList.remove('drag');d=s0;fin();d=null;
if(e.type==='pointercancel'){sync();return}
if(isTr(tg)){const u=s0.b.dataset.s;if(u){siteToTrash(u);toast('Moved to Recycle Bin')}else toast('Right-click the item to remove it');sync();return}
const best=tg||nearest(x,y,s0.b);if(best){const from=DESK.findIndex(q=>dkey(q)===s0.b.dataset.k),to=DESK.findIndex(q=>dkey(q)===best.dataset.k);if(from>=0&&to>=0&&from!==to){const it=DESK.splice(from,1)[0];DESK.splice(to,0,it);ls('aur.desk',JSON.stringify(DESK.map(dkey)));buildIcons(true)}}sync()};
addEventListener('pointerup',end);addEventListener('pointercancel',end);
addEventListener('keydown',e=>{if(e.key==='Escape'&&d&&d.go){const s0=d;fin();d=null;sup=true;setTimeout(()=>sup=false,60);sync()}});
ic.addEventListener('click',e=>{if(sup){e.stopPropagation();e.preventDefault()}},true)})(); /* DND-3.0.2 */"""
s = s[:a] + new + s[b:]

# 4) css
css = """/* DND-3.0.2 */
.di.dt{background:#ffffff40!important;outline:2px solid var(--acc,#fff);outline-offset:-2px}
.di.ghost{transition:none!important;opacity:.92;box-shadow:none!important}
"""
p, m, c = s.partition('<!--NEXOS-START-->')
assert m and '</style>' in c
s = p + m + c.replace('</style>', css + '</style>', 1)

# 5) version labels
s = s.replace('Version 3.0.1 alpha', 'Version 3.0.2 alpha').replace("'3.0.1 alpha'", "'3.0.2 alpha'")
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.2"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.2 (drag): درگ آیکن‌های دسکتاپ از نو (IIFE با کامنت DND-3.0.2: آستانه ۵px، ghost با rAF، هایلایت مقصد .dt، رها کردن سایت روی Recycle Bin = حذف، Esc = لغو)؛ hold-to-drag: S.hd از [100,300,500,700,1000] با پیش‌فرض 300 و کلید aur.hd3؛ سرعت ماوس مجازی هنگام درگ دیگه 1x نیست (pMove)؛ درگ فایل‌منیجر (خط ~738) دست نخورده\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.2\nروی گوشی تست نشده. محدودیت: آیکن‌های دسکتاپ جای آزاد ندارن (فقط جابجایی ترتیب)؛ رها کردن exe روی سطل فقط پیام میده. درگ بین فایل‌منیجر و دسکتاپ هنوز نیست.\n")
print('ok')

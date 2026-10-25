#!/usr/bin/env python3
# NexOS 3.2.0 (part A1) - free icon layout, desktop shortcuts, drag to Recycle Bin, taskbar reorder,
# resize/move/grab cursors, fullscreen taskbar 5 s peek. Run from repo root, after 3.1.8b.
import re, sys, pathlib
here = pathlib.Path(__file__).resolve().parent
root = here.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'DND-3.2.0' in s:
    print('already applied'); sys.exit(0)
assert 'WN-3.1.8b' in s, 'apply 3.1.8 and 3.1.8b first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:80]}'
    s = s.replace(old, new)


# 1) the old column-only icon drag is replaced by the new one (kept in code, switched off)
rep("(()=>{const ic=$('#icons');let d=null,sup=false,hot=null,ra=0,le=null;const TH=5;",
    "(()=>{return;const ic=$('#icons');let d=null,sup=false,hot=null,ra=0,le=null;const TH=5;")
# 2) deskMenu / sortDesk / siteToTrash live inside buildUI(): hook them from the inside
rep("function deskMenu(x,y,t){if(t.closest('.win'))return;const di=t.closest('.di');",
    "function deskMenu(x,y,t){if(t.closest('.win'))return;if(window.DSKX&&DSKX.menu(x,y,t,deskMenu0))return;deskMenu0(x,y,t)}function deskMenu0(x,y,t){const di=t.closest('.di');")
rep("$('#desk').addEventListener('contextmenu',e=>{if(window._lph)return;deskMenu(",
    "window.DSKX0={sortDesk,siteToTrash};$('#desk').addEventListener('contextmenu',e=>{if(window._lph)return;deskMenu(")
# 3) File Explorer drag: can now drop on the desktop (shortcut), Recycle Bin icon and Recycle Bin window
rep("if(!t||!B.contains(t))return null;", "if(!t||!B.contains(t))return window.DNDX?DNDX.hit(s,x,y,e):null;")
rep("if(!e)return null;const t=e.closest('.row[data-p],[data-dp]');", "if(!e)return null;const t=e.closest('.row[data-p],[data-dp]');")
rep("const copyMode=(s,t,e)=>{if(e.ctrlKey)return true;if(!t)return false;",
    "const copyMode=(s,t,e)=>{if(e.ctrlKey)return true;if(!t)return false;if(t.ext)return false;")
rep("tip.textContent=t?(cp?'Copy to ':'Move to ')+t.name:''});",
    "tip.textContent=t?(t.ext?t.tip:(cp?'Copy to ':'Move to ')+t.name):''});")
rep("const t=dst(s,e.clientX,e.clientY);if(!t)return;const mv=!copyMode(s,t,e);",
    "const t=dst(s,e.clientX,e.clientY);if(!t)return;if(t.ext){const its=E.items.filter(i=>s.paths.includes(i.path));Promise.resolve(t.drop(its,e.clientX,e.clientY)).then(()=>{try{load()}catch(_){}}).catch(()=>{});return}const mv=!copyMode(s,t,e);")
# touch: hold time follows the Hold-to-drag setting
rep("try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}}},380)}", "try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}}},Math.max(120,S.hd))}")
# 4) fullscreen taskbar peek: 5 s, tapping elsewhere no longer closes it at once
rep("fsPeek(false),4500)", "fsPeek(false),5000)", 2)
rep("if(e.target.closest('.fsd'))return;fsPeek(false)},true);", "},true);")

# 5) css + js
css = (here / 'a1.css').read_text(encoding='utf-8')
js = (here / 'a1.js').read_text(encoding='utf-8')
old = '</style><!--NEXOS-END--></head>'
assert s.count(old) == 1
s = s.replace(old, css + old)
old = '</script><!--NEXOS-END--></body></html>'
assert s.count(old) == 1
s = s.replace(old, js + '\n' + old)

# 6) version + What's New
s, n = re.subn(r'Version 3\.1\.8', 'Version 3.2.0', s)
assert n >= 4, n
rep("var VER='3.1.8'", "var VER='3.2.0'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
items = """var ITEMS=[
['🧲','Move icons anywhere','Drop desktop icons on any free spot, with a snap grid'],
['🔗','Desktop shortcuts','Drag a file or folder from File Explorer onto the desktop'],
['🗑️','Drag to Recycle Bin','Works from the desktop and from File Explorer, also into the Recycle Bin window'],
['📌','Reorder the taskbar','Hold and drag a pinned app to a new place'],
['🖱️','New cursors','Resize, move, grab and no-drop shapes for the virtual mouse'],
['⏱️','Fullscreen taskbar','Stays open for 5 seconds after every touch']
];"""
s = s[:a] + items + s[b:]
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.0"', t, count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.0 (DND-3.2.0، بخش A1): چیدمان آزاد آیکن‌های دسکتاپ (grid ۸۶×۹۴، موقعیت‌ها در aur.dpos، آیکن‌های حذف‌شده در aur.dhide، شورتکات‌ها در aur.lnks با نوع 'lnk' در DESK). buildIcons بازنویسی/wrap شد (آیکن‌های lnk جدا ساخته میشن). درگ قدیمی ستونی خاموش شد (return اول IIFE) و درگ جدید با ghost + سلول هدف + سطل ساخته شد. درگ ردیف‌های فایل‌منیجر از طریق DNDX.hit به دسکتاپ (شورتکات)، آیکن سطل و پنجره‌ی سطل می‌رسه. ترتیب آیکن‌های پین‌شده‌ی تسک‌بار با درگ عوض میشه (PIN). کرسرهای جدید: ew/ns/nwse/nesw/move/grab/grabbing/no داخل #cur (با curState جدید). peek تمام‌صفحه ۵ ثانیه و با هر تعامل تمدید میشه (peekKeep).\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.0\nروی گوشی تست نشده: درگ با لمس و ماوس مجازی، شورتکات، سطل. نشانگر resize فقط روی دسته‌های گوشه/راست/پایین پنجره هست (لبه‌ی چپ/بالا ندارن).\n")
print('ok')

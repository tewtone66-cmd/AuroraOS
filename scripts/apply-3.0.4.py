#!/usr/bin/env python3
# NexOS 3.0.4 - browser page sizing rewrite: pages lay out like a real PC screen (run from repo root, after 3.0.3)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
jv = root / 'android-src' / 'AuroraBrowserPlugin.java'
s = idx.read_text(encoding='utf-8')
j = jv.read_text(encoding='utf-8')

if 'BRSIZE-3.0.4' in j:
    print('already applied'); sys.exit(0)
assert 'MOUSE-3.0.3' in s, 'apply apply-3.0.3.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# ---------- Java ----------
old = "return Math.max(200, Math.min(4000, Math.round(w / (PAGE_K * zoom))));"
assert j.count(old) == 1
j = j.replace(old,
    "/* BRSIZE-3.0.4: lay the page out like a PC screen refW px wide (default 1280) when the Aurora window is full width */\n"
    "        float base = (screenW > 200f) ? (w * refW / (screenW * zoom)) : (w / (PAGE_K * zoom));\n"
    "        return Math.max(320, Math.min(4000, Math.round(base)));")

old = "private static final float PAGE_K = 1.4f;"
assert j.count(old) == 1
j = j.replace(old, old + "\n    private float screenW = 0f;\n    private float refW = 1280f;")

old = "final int z0 = zf == null ? 100 : zf;"
assert j.count(old) == 1
j = j.replace(old, old +
    "\n        Float cwf0 = call.getFloat(\"cw\", 0f); if (cwf0 != null && cwf0 > 200f) screenW = cwf0;"
    "\n        Float rf0 = call.getFloat(\"ref\", 0f); if (rf0 != null && rf0 > 300f) refW = rf0;")

pat = re.compile(r'(final float ww = call\.getFloat\("w", 100f\), hh = call\.getFloat\("h", 100f\);\s*final float dd = dens\(call\);)')
assert len(pat.findall(j)) == 1
j = pat.sub(lambda m: m.group(1) +
    "\n        Float swf = call.getFloat(\"cw\", 0f); if (swf != null && swf > 200f) screenW = swf;"
    "\n        Float rff = call.getFloat(\"ref\", 0f);"
    "\n        final boolean refCh = rff != null && rff > 300f && Math.abs(rff - refW) > 0.5f;"
    "\n        if (rff != null && rff > 300f) refW = rff;", j)

old = "if (oldW == null || Math.abs(oldW - ww) > 0.5f) applyZoomSoon(w, id); else applyZoom(w, id);"
assert j.count(old) == 1
j = j.replace(old, "if (oldW == null || Math.abs(oldW - ww) > 0.5f || refCh) applyZoomSoon(w, id); else applyZoom(w, id);")
jv.write_text(j, encoding='utf-8')

# ---------- JS ----------
rep("x:r.left,y:r.top,w:r.width,h:r.height,cw:innerWidth})", "x:r.left,y:r.top,w:r.width,h:r.height,cw:innerWidth,ref:S.pw})")
rep("cw:innerWidth,vw:", "cw:innerWidth,ref:S.pw,vw:")
rep("r.height|0].join()", "r.height|0,S.pw].join()")
rep("rp:ls('aur.rp')!=='0',", "rp:ls('aur.rp')!=='0',pw:(v=>[900,1024,1152,1280,1440,1600,1920].includes(v)?v:1280)(+ls('aur.pw')),")
rep("else if(k==='rp'){", "else if(k==='pw'){S.pw=+v;ls('aur.pw',v);sync()}else if(k==='rp'){")
rep("browser(){return `<h3>Browser</h3>",
    "browser(){return `<h3>Browser</h3><h4>Page size: pretend screen width (smaller = bigger text)</h4>${chips('pw',[900,1024,1152,1280,1440,1600,1920],S.pw,v=>v+' px'+(v===1280?' (default)':''))}")

s = s.replace('Version 3.0.3 alpha', 'Version 3.0.4 alpha').replace("'3.0.3 alpha'", "'3.0.4 alpha'")
s = s.replace('</style>', '</style>', 1)
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.4"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.4 (browser size): علت سایز غلط: عرض صفحه = عرض پنجره / (1.4 × زوم) ثابت بود، پس صفحه‌ها خیلی بزرگ و موبایلی می‌شدن. حالا AuroraBrowserPlugin.cssWidth = عرض پنجره × refW / (innerWidth × زوم): پنجره‌ی تمام‌عرض مثل مانیتور refW پیکسلی (پیش‌فرض 1280) چیده میشه. refW از S.pw (ستینگ ← Browser ← Page size، کلید aur.pw) میاد و با NB.show/create (پارامتر ref) به جاوا میره؛ کلید کش sync شامل S.pw شد. PAGE_K فقط fallback قدیمیه\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.4\nجاوا عوض شده، پس حتما بیلد کامل بگیر (نه فقط وب). روی گوشی تست نشده. اگه متن کوچیکه Page size رو به 1024 یا 900 ببر. UI نوار ابزار مرورگر (تب‌ها/آدرس) هنوز بازنویسی نشده؛ فقط چیدمان صفحه‌ها درست شد.\n")
print('ok')

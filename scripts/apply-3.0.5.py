#!/usr/bin/env python3
# NexOS 3.0.5 - desktop: new wallpapers + working wallpaper picker, browser icon, recycle bin (run from repo root, after 3.0.4)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'DESK-3.0.5' in s:
    print('already applied'); sys.exit(0)
assert 'BRSIZE' in (root / 'android-src' / 'AuroraBrowserPlugin.java').read_text(encoding='utf-8'), 'apply apply-3.0.4.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# 1) root cause of the broken picker: the NexOS rebrand forced ONE image on #desk with !important and
#    swapped every image wallpaper for the same picture. Remove the override.
ovr = ".wall,#desk{background-image:var(--nx-wall)!important;background-size:cover!important;background-position:center!important;background-color:#06080f!important}"
if ovr in s:
    s = s.replace(ovr, ".wall,#desk{background-size:cover;background-position:center;background-color:#06080f}")

# 2) browser icon on the desktop
rep("DESK=[['files','This PC'],['trash','Recycle Bin']]", "DESK=[['files','This PC'],['browser','Browser'],['trash','Recycle Bin']]")

# 3) recycle bin: select all, Ctrl+A, Delete, Enter
rep('<button class="ib" data-a="ra">Restore all</button>', '<button class="ib" data-a="sa">Select all</button><button class="ib" data-a="ra">Restore all</button>')
rep("else if(a==='empty')w.emptyAsk()}}",
    "else if(a==='sa'){TR.forEach(x=>sel.add(x.id));draw()}else if(a==='empty')w.emptyAsk()};"
    "B.tabIndex=0;B.onkeydown=e=>{if(e.ctrlKey&&e.key.toLowerCase()==='a'){e.preventDefault();TR.forEach(x=>sel.add(x.id));draw()}"
    "else if(e.key==='Delete'&&sel.size)ask('Delete','Permanently delete '+sel.size+' item(s)?','Delete',()=>trPurge([...sel]).then(()=>{sel.clear();draw()}));"
    "else if(e.key==='Enter'&&sel.size)trRestore([...sel]).then(()=>{sel.clear();draw()})}}")

# 4) new wallpapers + recycle bin badge (replaces the old "same image for all" loop)
a = s.index("try{if(typeof WALL!=='undefined'&&")
b = -1
for endtok in ("try{if(typeof applyWall==='function')applyWall();}catch(e){}", "fix(WALL,k);}}catch(e){}"):
    k = s.find(endtok, a)
    if k >= 0:
        b = k + len(endtok)
        break
assert b > 0, 'wallpaper block end not found'
new_js = r"""try{(function(){ /* DESK-3.0.5 */
var mk=function(b){return "url('data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">'+b+'</svg>')+"')"};
var lg=function(id,x2,y2,st){return '<linearGradient id="'+id+'" x1="0" y1="0" x2="'+x2+'" y2="'+y2+'">'+st.map(function(t,i){return '<stop offset="'+(i/(st.length-1))+'" stop-color="'+t+'"/>'}).join('')+'</linearGradient>'};
var rg=function(id,cx,cy,r,c,o){return '<radialGradient id="'+id+'" cx="'+cx+'%" cy="'+cy+'%" r="'+r+'%"><stop offset="0" stop-color="'+c+'" stop-opacity="'+o+'"/><stop offset="1" stop-color="'+c+'" stop-opacity="0"/></radialGradient>'};
var bg=function(id){return '<rect width="1600" height="900" fill="url(#'+id+')"/>'};
var glow=function(id){return '<rect width="1600" height="900" fill="url(#'+id+')"/>'};
var wave=function(y,amp,c,o){return '<path d="M0 '+y+'C300 '+(y-amp)+' 600 '+(y+amp)+' 900 '+y+'S1400 '+(y-amp)+' 1600 '+(y+amp/2)+'V900H0Z" fill="'+c+'" opacity="'+o+'"/>'};
var NEW=[
 /* 0 Nex Night */ mk('<defs>'+lg('b',0.4,1,['#05060f','#0b1233','#140a30'])+rg('g1',22,18,60,'#5b6bff',0.45)+rg('g2',86,88,55,'#19b6d6',0.35)+rg('g3',78,16,35,'#b04bff',0.28)+'</defs>'+bg('b')+glow('g1')+glow('g2')+glow('g3')),
 /* 1 Aurora */ mk('<defs>'+lg('b',0,1,['#030a12','#05161d','#04101a'])+lg('w1',0,1,['#2dffb0','#2dffb0'])+rg('g1',30,30,65,'#1de9b6',0.28)+rg('g2',80,20,45,'#6c5cff',0.25)+'</defs>'+bg('b')+glow('g1')+glow('g2')+wave(430,150,'#14c8a0',0.16)+wave(520,120,'#1d9bd6',0.14)+wave(640,90,'#6c5cff',0.14)+wave(760,60,'#0a1a2c',0.7)),
 /* 2 Sunset */ mk('<defs>'+lg('b',0,1,['#1a0b3d','#7a2a78','#e0546e','#ffb36b'])+rg('s',50,66,26,'#fff1c2',0.95)+'</defs>'+bg('b')+'<circle cx="800" cy="600" r="150" fill="url(#s)"/>'+wave(650,70,'#5a1f5e',0.85)+wave(730,60,'#3a1450',0.9)+wave(810,40,'#1f0b36',1)),
 /* 3 Ocean */ mk('<defs>'+lg('b',0,1,['#021a37','#07508a','#17a2c9'])+rg('g1',70,12,45,'#9be7ff',0.3)+'</defs>'+bg('b')+glow('g1')+wave(520,60,'#0e6aa6',0.5)+wave(600,55,'#0a5a96',0.6)+wave(690,45,'#06437a',0.75)+wave(790,35,'#032a52',0.9)),
 /* 4 Forest */ mk('<defs>'+lg('b',0,1,['#0a1f1a','#164a3a','#3f8f6a'])+rg('g1',25,15,50,'#d6ffd9',0.22)+'</defs>'+bg('b')+glow('g1')+wave(540,90,'#1d6a4f',0.55)+wave(630,80,'#14523d',0.7)+wave(730,60,'#0d3a2c',0.85)+wave(820,40,'#07241b',1)),
 /* 5 Graphite */ mk('<defs>'+lg('b',0.6,1,['#0b0d12','#171a22','#0e1015'])+rg('g1',75,20,50,'#4b5675',0.3)+'</defs>'+bg('b')+glow('g1')+'<path d="M-100 900L700 -50H900L100 900Z" fill="#ffffff" opacity=".03"/><path d="M500 900L1300 -50H1450L650 900Z" fill="#ffffff" opacity=".035"/>'),
 /* 6 Light Bloom */ mk('<defs>'+lg('b',0.5,1,['#f1f5ff','#d7e4ff','#c4d6ff'])+rg('g1',20,25,45,'#7aa2ff',0.55)+rg('g2',80,75,50,'#ff9ad0',0.4)+rg('g3',70,20,32,'#8be9ff',0.5)+'</defs>'+bg('b')+glow('g1')+glow('g2')+glow('g3')),
 /* 7 Petals */ mk('<defs>'+lg('b',0.5,1,['#07163a','#123ea8','#2a76f0'])+lg('p',0,1,['#ffffff','#9ec4ff'])+'</defs>'+bg('b')+[0,30,60,90,120,150].map(function(r){return '<ellipse cx="800" cy="450" rx="470" ry="140" transform="rotate('+r+' 800 450)" fill="url(#p)" opacity=".1"/>'}).join('')+'<circle cx="800" cy="450" r="90" fill="#ffffff" opacity=".12"/>')
];
if(typeof WALL!=='undefined'&&WALL){WALL.splice.apply(WALL,[0,WALL.length].concat(NEW))}
if(typeof applyWall==='function')applyWall();
var trBadge=function(){try{var n=TR.length;$$('#icons .di').forEach(function(b){if((b.dataset.k||'').split('|')[0]==='trash'){var t=$('.t',b);b.classList.toggle('tfull',n>0);if(t)t.dataset.n=n>99?'99+':n}})}catch(e){}};
if(typeof buildIcons==='function'){var _bi=buildIcons;buildIcons=function(re){var r=_bi(re);trBadge();return r}}
trBadge();
})()}catch(e){}"""
s = s[:a] + new_js + s[b:]

# 5) css (badge)
css = """/* DESK-3.0.5 */
.di .t{position:relative}
.di.tfull .t::after{content:attr(data-n);position:absolute;right:-8px;top:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--acc,#4f7cff);color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center;text-shadow:none;box-sizing:border-box}
"""
p, m, c = s.partition('<!--NEXOS-START-->')
assert m and '</style>' in c
s = p + m + c.replace('</style>', css + '</style>', 1)

s = s.replace('Version 3.0.4 alpha', 'Version 3.0.5 alpha').replace("'3.0.4 alpha'", "'3.0.5 alpha'")
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.5"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.5 (desktop): علت باگ انتخاب بکگراند (اگه هنوز بود): استایل ریبرند `.wall,#desk{background-image:var(--nx-wall)!important}` همیشه یه عکس رو اجبار می‌کرد و حلقه‌ی fix همه‌ی WALLهای عکسی رو با همون یه عکس عوض می‌کرد؛ هر دو حذف شد. ۸ بکگراند جدید (SVG سبک بدون blur) توی بلوک اسکریپت NEXOS با کامنت DESK-3.0.5 با WALL.splice جایگزین WALL شدن. آیکن Browser به DESK اضافه شد. سطل: دکمه‌ی Select all، Ctrl+A/Delete/Enter، و بج شمارنده روی آیکن دسکتاپ (trBadge که buildIcons رو wrap می‌کنه)\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.5\nروی گوشی تست نشده. بکگراند ذخیره‌شده‌ی قبلی (ایندکس) به طراح جدید با همون ایندکس نگاشت میشه. آیکن Browser برای کاربرایی که چیدمان ذخیره‌شده دارن ته لیست میاد.\n")
print('ok')

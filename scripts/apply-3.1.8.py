#!/usr/bin/env python3
# NexOS 3.1.8 - final look: new boot/start animation, smooth UI, N logo everywhere, NexOS naming, version 3.1.8 (run from repo root)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'FINAL-3.1.8' in s:
    print('already applied'); sys.exit(0)


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


NPATH = 'M168 368V144l176 224V144'
# ---- 1) shared gradient defs (zero-size svg, not display:none, so gradients always resolve)
defs = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
        '<linearGradient id="nxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>'
        '</defs></svg>')
rep('</head><body class="booting"><div id="boot">', '</head><body class="booting">' + defs + '<div id="boot">')

# ---- 2) N logo instead of the old star (start button, About)
nsvg = ('<svg class="star" viewBox="0 0 512 512"><path d="' + NPATH + '" fill="none" stroke="url(#nxg)" stroke-width="46" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>')
m = re.search(r"const STAR='.*?';(?=\s*\nconst IC=)", s, re.S)
assert m, 'STAR not found'
s = s[:m.start()] + "const STAR='" + nsvg + "';" + s[m.end():]

# old Aurora swoosh logos inside #boot / #shut
a = s.index('<svg class="bl"'); b = s.index('</svg>', a) + 6
s = s[:a] + s[b:]
a = s.index('<svg class="lg" viewBox="0 0 1024 1024">'); b = s.index('</svg>', a) + 6
s = s[:a] + ('<svg class="lg" viewBox="0 0 512 512"><path d="' + NPATH + '" fill="none" stroke="url(#nxg)" stroke-width="40" '
             'stroke-linecap="round" stroke-linejoin="round"/></svg>') + s[b:]

# ---- 3) new boot screen markup
a = s.index('<div id="nxb">'); b = s.index('</div><!--NEXOS-END-->', a)
boot = ('<div id="nxb"><div class="halo"></div><svg viewBox="0 0 512 512"><path class="p" pathLength="100" d="' + NPATH +
        '" fill="none" stroke="url(#nxg)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        '<h1><span>N</span><span>e</span><span>x</span><span>O</span><span>S</span></h1><div class="bar"><i></i></div>')
s = s[:a] + boot + s[b:]

# ---- 4) css (before the head's closing NEXOS-END)
nth = ''.join(f'body.intro:not(.booting) #icons .di:nth-child({i}){{animation-delay:{.18 + i * .05:.2f}s}}' for i in range(1, 17))
css = """/* FINAL-3.1.8 */
:root{--ease:cubic-bezier(.22,.8,.25,1);--spring:cubic-bezier(.2,.9,.3,1.15)}
#nxb svg{width:120px;height:120px;filter:drop-shadow(0 0 26px rgba(99,102,241,.6));animation:nxpop .9s var(--spring) backwards}
#nxb .p{stroke-dasharray:100;stroke-dashoffset:100;animation:nxd 1.15s cubic-bezier(.65,0,.35,1) .2s forwards}
#nxb .halo{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#6366f155,#22d3ee14 45%,transparent 68%);animation:nxh 2.6s ease-in-out infinite}
#nxb h1{opacity:1!important;animation:none!important;display:flex;font-weight:300;letter-spacing:.2em;text-indent:.2em}
#nxb h1 span{display:inline-block;opacity:0;transform:translateY(12px);filter:blur(5px);animation:nxl .55s var(--ease) forwards}
#nxb h1 span:nth-child(1){animation-delay:.7s}#nxb h1 span:nth-child(2){animation-delay:.78s}#nxb h1 span:nth-child(3){animation-delay:.86s}#nxb h1 span:nth-child(4){animation-delay:.94s}#nxb h1 span:nth-child(5){animation-delay:1.02s}
#nxb h1 span:nth-child(n+4){font-weight:700}
#nxb .bar{animation:nxf .4s 1s forwards!important}#nxb .bar i{animation-delay:1s!important}
#boot{transition:opacity .75s ease,transform .75s var(--ease)!important}
#boot.out #nxb svg{transform:scale(1.35);opacity:0;transition:transform .7s var(--ease),opacity .6s}
#boot.out #nxb h1,#boot.out #nxb .bar{opacity:0!important;transition:opacity .3s}
@keyframes nxpop{from{transform:scale(.7);opacity:0}}
@keyframes nxh{0%,100%{transform:scale(.92);opacity:.7}50%{transform:scale(1.08);opacity:1}}
@keyframes nxl{to{opacity:1;transform:none;filter:none}}
#shut .lg{filter:drop-shadow(0 0 20px rgba(99,102,241,.5))}
#shut.wake .lg{opacity:1!important;transform:scale(1.15)!important;filter:drop-shadow(0 0 34px #8b5cf6cc);transition:all .45s var(--ease)}
#shut.wake #pw,#shut.wake .hint{opacity:0!important;transition:opacity .2s}
body.intro:not(.booting) #icons .di{animation:rise .55s var(--spring) backwards}
""" + nth + """
body.intro:not(.booting) #dock{animation:dockin .6s var(--spring) .1s backwards}
/* smooth interaction */
button{transition:background-color .18s,filter .15s,opacity .2s,box-shadow .2s,border-color .2s}
button:active:not(:disabled){filter:brightness(.9)}
.di{transition:background .18s var(--ease),transform .22s var(--ease),box-shadow .2s}
.di:active{transform:scale(.95)}
.win{transition:box-shadow .28s var(--ease),border-radius .25s var(--ease),opacity .2s}
.win.opening .body{animation:fade .34s var(--ease) .06s backwards}
#pins button,.sti,.srow{transition:background .15s,transform .2s var(--ease)}
#pins button:active{transform:scale(.93)}
input,textarea,select{transition:border-color .18s,box-shadow .2s,background-color .2s}
#toast{transition:transform .35s var(--spring),opacity .25s}
.chip,.sw,.tg{transition:background-color .2s,color .2s,border-color .2s}
@media (prefers-reduced-motion:reduce){#nxb *,.di{animation-duration:.01s!important}}
body.perf button,body.perf .di,body.perf #nxb *,body.perf #shut *{transition:none!important}
body.perf #nxb .halo{animation:none}
"""
rep('</style><!--NEXOS-END--></head>', css + '</style><!--NEXOS-END--></head>')

# ---- 5) js: intro flag + power-on animation
js = ("/* FINAL-3.1.8 */\n(function(){try{document.body.classList.add('intro');setTimeout(function(){document.body.classList.remove('intro')},4200);"
      "var pw=document.getElementById('pw');if(pw)pw.onclick=function(){var sh=document.getElementById('shut');if(sh)sh.classList.add('wake');setTimeout(function(){location.reload()},520)}}catch(e){console.error(e)}})();\n")
rep('</script><!--NEXOS-END--></body></html>', js + '</script><!--NEXOS-END--></body></html>')

# ---- 6) version 3.1.8 everywhere in the page
s, n1 = re.subn(r'3\.0\.\d+ alpha', '3.1.8', s)
assert n1 >= 5, n1
s = s.replace('Version 3.1.8</p>', 'Version 3.1.8</p>')
# stray old name in a comment
s = s.replace('/* 1 Aurora */', '/* 1 Aurora (wallpaper) */')
idx.write_text(s, encoding='utf-8')

# ---- 7) package / build files
pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    t = re.sub(r'"version":\s*"[^"]*"', '"version": "3.1.8"', t, count=1)
    t = t.replace('"aurora-os-android"', '"nexos-android"').replace('Aurora OS Android wrapper', 'NexOS Android wrapper')
    pj.write_text(t, encoding='utf-8')

wf = root / '.github' / 'workflows' / 'android-apk.yml'
if wf.exists():
    t = wf.read_text(encoding='utf-8')
    t = t.replace('name: Build Aurora OS APK', 'name: Build NexOS APK').replace('name: AuroraOS-APK', 'name: NexOS-APK')
    wf.write_text(t, encoding='utf-8')

mi = root / 'scripts' / 'make-icons.mjs'
if mi.exists():
    t = mi.read_text(encoding='utf-8')
    for k in ('icon', 'fg', 'bg', 'splash', 'logo'):
        t = t.replace(f'aurora-{k}.', f'nexos-{k}.')
    t = t.replace('Aurora icons + splash written', 'NexOS icons + splash written')
    mi.write_text(t, encoding='utf-8')

pw = root / 'scripts' / 'prepare-web.mjs'
if pw.exists():
    pw.write_text(pw.read_text(encoding='utf-8').replace('Aurora OS web app', 'NexOS web app'), encoding='utf-8')

rd = root / 'README.md'
if rd.exists():
    t = rd.read_text(encoding='utf-8')
    t = re.sub(r'^# NexOS[^\n]*', '# NexOS 3.1.8', t, count=1)
    rd.write_text(t, encoding='utf-8')

for f in ('src/index.html.bak', 'assets/aurora-icon.svg', 'assets/aurora-fg.svg', 'assets/aurora-bg.svg', 'assets/aurora-splash.svg', 'assets/aurora-logo.svg', 'assets/aurora-logo.png'):
    p = root / f
    if p.exists():
        p.unlink()

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.1.8 (ظاهر نهایی، FINAL-3.1.8): لوگوی N (path ثابت M168 368V144l176 224V144 با گرادیان #nxg که در یک svg صفرایز بعد از <body> تعریف شده) جایگزین ستاره‌ی قدیمی شد (const STAR، دکمه‌ی استارت، About، صفحه‌ی خاموشی). بوت جدید: halo + کشیده‌شدن N + ظاهر شدن حرف‌به‌حرف NexOS + نوار پیشرفت و خروج با زوم. روشن‌کردن از صفحه‌ی خاموشی قبل از reload انیمیشن wake دارد. body.intro (۴.۲ ثانیه) آیکن‌های دسکتاپ و داک را با تأخیر پله‌ای وارد می‌کند. انیمیشن نرم: متغیرهای --ease/--spring، انتقال دکمه/آیکن/ورودی، محتوای پنجره fade می‌شود؛ body.perf همه را خاموش می‌کند. ورژن 3.1.8 همه‌جا (HTML، package.json). فایل‌های build (workflow، make-icons، README) NexOS شدند؛ نام‌های داخلی Aurora* در جاوا/پلاگین/appId عمدا دست نخورد چون تغییرشان باعث خراب شدن پلاگین‌ها و داده‌ی کاربر میشه.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.1.8\nآیکن لانچر و اسپلش اندروید از assets/nexos-*.svg ساخته میشه (نیاز به بیلد کامل APK). appId همون com.auroraos.desktop موند تا آپدیت روی نصب قبلی انجام بشه.\n")
print('ok')

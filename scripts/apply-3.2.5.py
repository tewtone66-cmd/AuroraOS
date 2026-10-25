#!/usr/bin/env python3
# NexOS 3.2.5 (part D) - new app icon + splash, shutdown animation, first-run setup (OOBE), PIN login / lock screen, Account page.
# Touches src/index.html and assets/*.svg (icons are rendered by scripts/make-icons.mjs in the build). Run after 3.2.4.
import re, sys, shutil, pathlib
here = pathlib.Path(__file__).resolve().parent
root = here.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'SYS-3.2.5' in s:
    print('already applied'); sys.exit(0)
assert 'SET-3.2.4' in s, 'apply 3.2.4 first'
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, f'expected {count}, found {n}: {old[:90]}'
    s = s.replace(old, new)

# shutdown
rep("function doShut(){closeMenus();closeAll();document.body.classList.add('shutting');const s=$('#shut');s.classList.add('on');setTimeout(()=>s.classList.add('off'),2400)}",
    "function doShut(){closeMenus();document.body.classList.add('shutting');const ws=$$('.win');ws.forEach((w,i)=>{w.style.animationDelay=(i*70)+'ms';w.classList.add('shdn')});const s=$('#shut'),t=380+ws.length*70;setTimeout(()=>{closeAll();s.classList.add('on')},t);setTimeout(()=>s.classList.add('off'),t+2900)}")
# lock screen
rep("""var lck=h('div','','<div class="lt"></div><div class="ld"></div><div class="lh">Click or press any key to unlock</div>');lck.id='lck';""",
    """var lck=h('div','','<div class="lt"></div><div class="ld"></div><div class="lh"><i></i>Swipe up or tap to unlock</div><div class="lgn"><div class="av"></div><div class="un"></div><div class="pd"></div><div class="lm"></div><div class="kp"></div></div>');lck.id='lck';""")
rep("lck.classList.add('on');sync()}", "lck.classList.add('on');lck.classList.remove('pin');if(window.NX4)NX4.lockReset();sync()}")
rep("function unlock(){if(!lck.classList.contains('on'))return;lck.classList.remove('on');", "function unlock(){if(!lck.classList.contains('on'))return;lck.classList.remove('on','pin');")
rep("lck.addEventListener('pointerdown',function(e){e.preventDefault();unlock()});", "window.__unlock=unlock;lck.addEventListener('pointerdown',function(e){NX4.lockDown(e)});lck.addEventListener('pointerup',function(e){NX4.lockUp(e)});")
rep("if(lck.classList.contains('on')){e.preventDefault();e.stopPropagation();unlock()}else if(slp", "if(lck.classList.contains('on')){e.preventDefault();e.stopPropagation();NX4.lockKey(e)}else if(slp")
# settings: Account page
rep("['Personalization',[['bg','Background'],['color','Colors'],['task','Taskbar']]]", "['Personalization',[['account','Account'],['bg','Background'],['color','Colors'],['task','Taskbar']]]")
rep("const IDX=[", "const IDX=[['Account, name, PIN, lock screen','account'],['Run setup again, welcome','account'],")
rep("PGS.perf=()=>`", """PGS.account=()=>`<h3>Account</h3><div class="acc0"><div class="av2">${esc((NX4.name().charAt(0)||'U').toUpperCase())}</div><div><b>${esc(NX4.name())}</b><small>Local account</small></div></div><h4>Display name</h4><input id="unm" class="sinp" value="${esc(NX4.name())}" maxlength="24"><h4>Lock PIN</h4>${NX4.hasPin()?`<p class="bnote">A PIN is set (${NX4.pinLen()} digits).</p><button class="pgb" data-k="clrpin">Remove PIN</button>`:`<input id="pin1" class="sinp" inputmode="numeric" maxlength="8" placeholder="New PIN (4 to 8 digits)"><input id="pin2" class="sinp" inputmode="numeric" maxlength="8" placeholder="Repeat PIN" style="margin-top:8px"><button class="pgb" data-k="setpin">Set PIN</button>`}<h4>Ask for the PIN when NexOS starts</h4>${onoff('lockboot',NX4.lockBoot())}<h4>More</h4><button class="pgb" data-k="locknow">Lock now</button> <button class="pgb" data-k="oobe">Run setup again</button><p class="bnote">This is NexOS's own screen lock. It keeps the desktop private, but it does not protect your phone or its files.</p>`;
PGS.perf=()=>`""")
rep("else if(k==='app')openApp(v)", """else if(k==='app')openApp(v)
else if(k==='setpin'){const m=NX4.setPin($('#pin1',B).value,$('#pin2',B).value);toast(m||'PIN set');setTimeout(()=>show(true),120);return}
else if(k==='clrpin'){NX4.clearPin();toast('PIN removed')}
else if(k==='lockboot')NX4.setLockBoot(v==='1')
else if(k==='locknow'){doLock();return}
else if(k==='oobe'){NX4.oobe();return}""")
rep("B.onchange=e=>{const t=e.target;", "B.onchange=e=>{const t=e.target;if(t.id==='unm'){NX4.setName(t.value);show(true);return}")

css = (here / 'd.css').read_text(encoding='utf-8'); js = (here / 'd.js').read_text(encoding='utf-8')
rep("</style><!--NEXOS-END--></head>", "/*SYS-3.2.5*/\n" + css + "\n</style><!--NEXOS-END--></head>")
rep("</script><!--NEXOS-END--></body></html>", js + "\n</script><!--NEXOS-END--></body></html>")
s, n = re.subn(r'Version 3\.2\.4', 'Version 3.2.5', s); assert n >= 1
s = s.replace("['Version','3.2.4']", "['Version','3.2.5']").replace("['Installed version','3.2.4']", "['Installed version','3.2.5']")
rep("var VER='3.2.4'", "var VER='3.2.5'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
s = s[:a] + """var ITEMS=[
['🎨','New app icon','A new N icon with aurora colors (shows after you install the new APK)'],
['⏻','Shutdown animation','Windows fold away, then a progress ring around the logo'],
['👋','First-run setup','Name, theme, wallpaper, optional PIN and file access'],
['🔒','New lock and login screen','Big clock, swipe up, PIN pad with shake and wait time'],
['👤','Account page','Change your name or PIN, lock now, run setup again in Settings']
];""" + s[b:]
idx.write_text(s, encoding='utf-8')

# icons
adir = here.parent / 'assets-new'
if not adir.exists(): adir = here / 'assets'
src = None
for cand in (here / 'assets', root / 'scripts' / 'assets-3.2.5'):
    if cand.exists(): src = cand; break
assert src, 'icon folder missing'
(root / 'assets').mkdir(exist_ok=True)
for f in src.glob('*.svg'): shutil.copy(f, root / 'assets' / f.name)
pj = root / 'package.json'
if pj.exists():
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.5"', pj.read_text(encoding='utf-8'), count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.5 (SYS-3.2.5، بخش D): آیکن/لوگو/اسپلش جدید (assets/*.svg؛ make-icons.mjs در CI رندر میکنه). doShut: پنجره‌ها shdn، حلقه‌ی پیشرفت دور لوگو. قفل: lck با بخش .lgn (آواتار، نام، نقطه‌های PIN، keypad)، swipe-up، کلاس pin، ۵ اشتباه=۳۰ ثانیه صبر. PIN هش SHA-256 (aur.pinh/aur.pinl)، نام aur.user، قفل موقع استارت aur.lockboot. OOBE (aur.oobe) ۶ مرحله. صفحه‌ی Account در Settings. NX4 در window. دقت: قفل فقط داخل NexOS هست و امنیت گوشی نیست.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.5\nآیکن لانچر فقط بعد از build جدید APK دیده میشه. قفل شبیه‌ساز واقعی نیست. OOBE برای کاربران فعلی هم یک بار نشون داده میشه (Skip دارد).\n")
print('ok')

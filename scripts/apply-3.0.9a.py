#!/usr/bin/env python3
"""NexOS 3.0.9 part 1: exe launch progress window (Download > Install > Setup > Open) + exe window follow fix.
Patches src/index.html with find/replace; every find is asserted, nothing is written unless all pass."""
import os, sys, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'src', 'index.html')
s = open(P, encoding='utf-8').read()
if 'EXE-3.0.9' in s:
    print('already applied (EXE-3.0.9 found) - nothing to do')
    sys.exit(0)


def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, 'FIND FAILED (%d found, %d expected): %r' % (n, cnt, old[:90])
    s = s.replace(old, new)


# ---------------------------------------------------------------- CSS
CSS = r'''/* EXE-3.0.9 */
.exes .exsp{display:none!important}
.exes:not(.exerr) .ext{display:none}
.exc{width:min(290px,92%);background:#1b2231;border:1px solid #ffffff22;border-radius:12px;padding:14px 14px 12px;box-shadow:0 10px 30px #0008;text-align:left;box-sizing:border-box;direction:ltr}
.exh{display:flex;align-items:center;gap:8px;margin-bottom:10px;min-width:0}
.exh b{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
.exh span{font-size:11px;color:#94a3b8;flex:none}
.exst{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:7px}
.exst li{display:flex;align-items:center;gap:9px;font-size:12.5px;color:#64748b}
.exst li i{flex:none;width:16px;height:16px;border-radius:50%;border:2px solid #475569;box-sizing:border-box;position:relative}
.exst li.act{color:#fff}
.exst li.act i{border-color:#ffffff33;border-top-color:#60a5fa;animation:exspin 1s linear infinite}
.exst li.done{color:#cbd5e1}
.exst li.done i{border-color:#34d399;background:#34d399}
.exst li.done i::after{content:'';position:absolute;left:3.5px;top:.5px;width:4px;height:8px;border:solid #06281c;border-width:0 2px 2px 0;transform:rotate(45deg)}
.exerr .exst li.act i{animation:none;border-color:#f87171;background:#f87171}
.exbar{height:5px;border-radius:3px;background:#0b1220;overflow:hidden}
.exbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3b82f6,#60a5fa);transition:width .3s}
.exsub{font-size:11.5px;color:#94a3b8;margin-top:8px;min-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.exerr .exsub{display:none}
'''
rep('</style><!--NEXOS-END-->', CSS + '</style><!--NEXOS-END-->')

# ---------------------------------------------------------------- appExe: progress card
rep("w.body.appendChild(u);\n{const nm=String(w.path)",
    r'''w.body.appendChild(u);
{/* EXE-3.0.9 progress card */const card=h('div','exc','<div class="exh"><b></b><span>Windows program</span></div><ol class="exst"><li><i></i>Download runtime</li><li><i></i>Install</li><li><i></i>Setup</li><li><i></i>Open window</li></ol><div class="exbar"><i></i></div><div class="exsub"></div>');
$('.exh b',card).textContent=String(w.path).split('/').pop()||'Program';
u.insertBefore(card,$('.ext',u));
const lis=[...card.querySelectorAll('li')],bar=$('.exbar i',card),sub=$('.exsub',card);
w.exeSub=t=>{sub.textContent=t==null?'':String(t)};
w.exeStep=(i,t,f)=>{w.exst=i;lis.forEach((l,k)=>{l.classList.toggle('done',k<i);l.classList.toggle('act',k===i)});bar.style.width=Math.min(100,Math.round((Math.min(i,4)+(f>0&&f<1?f:0))/4*100))+'%';if(t!=null)sub.textContent=String(t)};
w.exeStep(0,'')}
{const nm=String(w.path)''')

rep("w.exeStatus=(t,err)=>{$('.ext',u).textContent=t;",
    "w.exeStatus=(t,err)=>{u.classList.toggle('exerr',!!err);$('.ext',u).textContent=t;if(!err&&w.exeSub)w.exeSub(t);")

# ---------------------------------------------------------------- appExe: follow the Aurora window
rep("w.sched=()=>{if(!t1)t1=setTimeout(()=>{t1=0;push()},60);clearTimeout(w.tf);w.tf=setTimeout(()=>push(true),420)};",
    "w.sched=()=>{if(!t1)t1=setTimeout(()=>{t1=0;push()},16);clearTimeout(w.tf);w.tf=setTimeout(()=>push(true),420)};w.forcePush=()=>{last='';push(true)};")

rep("NW.setExeVisible({v:want}).catch(()=>{})}},120);",
    "NW.setExeVisible({v:want}).catch(()=>{});if(want)setTimeout(()=>{if(w.forcePush)w.forcePush()},60)}},120);")

rep("NW.addListener('appResumed',bgCheck)",
    "NW.addListener('appResumed',()=>{bgCheck();if(exeW&&exeW.forcePush)setTimeout(()=>exeW.forcePush(),150)})")

rep("const isJsErr=e=>",
    "const exePushSoon=w=>{[0,400,1200].forEach(d=>setTimeout(()=>{if(w&&W[w.id]&&w.forcePush)w.forcePush()},d))};\nconst isJsErr=e=>")

# ---------------------------------------------------------------- openExe flow hooks
rep("ew.t0=Date.now();ew.exeStatus('Preparing Windows runtime…');",
    "ew.t0=Date.now();ew.exeStatus('Preparing Windows runtime…');ew.exeStep(0,'Checking the Windows runtime…');")

rep("const st=await NW.status();if(!st.installed||!st.containers){await NW.init()}",
    "const st=await NW.status();if(!st.installed||!st.containers){await NW.init()}if(W[ew.id])ew.exeStep(1,'Setting up the program environment…');")

rep("ew.exeStatus('Starting…');\nconst go=f=>",
    "ew.exeStatus('Preparing the program…');\nconst go=f=>")

rep("ew.owns=true;ew.sched();ls('aur.pend',run)}",
    "ew.owns=true;ew.sched();if(!(ew.exst>=3))ew.exeStep(2,'Starting Wine…');exePushSoon(ew);ls('aur.pend',run)}")

# ---------------------------------------------------------------- native events
rep("if(exeW&&W[exeW.id]&&!exeW.owns)exeW.exeStatus(t)});",
    "if(exeW&&W[exeW.id]&&!exeW.owns){exeW.exeStatus(t);if(e.step==='container')exeW.exeStep(1,t);else if(e.step==='rootfs')exeW.exeStep(0,t,(e.pct|0)/100)}});")

rep("if(k==='preparing')w.exeStatus('Preparing system files…');else if(k==='launching')w.exeStatus('Starting Wine…');else if(k==='running')w.exeHide();else if(k==='error')",
    "if(k==='preparing'){w.exeStatus('Preparing system files…');if(!(w.exst>=2))w.exeStep(1,'Preparing system files…')}else if(k==='launching'){w.exeStatus('Starting Wine…');w.exeStep(2,'Starting Wine…');exePushSoon(w)}else if(k==='running'){w.exeStep(3,'Opening the program window…');exePushSoon(w);setTimeout(()=>{if(W[w.id]&&!w.err){w.exeStep(4,'Done');setTimeout(()=>{if(W[w.id]&&!w.err)w.exeHide()},300)}},350)}else if(k==='error')")

rep("lw('exeStarted',e=>toast('Started '+String(e.path||'').split('/').pop()));",
    "lw('exeStarted',e=>{toast('Started '+String(e.path||'').split('/').pop());if(exeW)exePushSoon(exeW)});")

# ---------------------------------------------------------------- version 3.0.9
rep("NexOS [Version 3.0.8 alpha]", "NexOS [Version 3.0.9 alpha]", 2)
rep("Version 3.0.8 alpha</p>", "Version 3.0.9 alpha</p>")
rep("'Installed version','3.0.8 alpha'", "'Installed version','3.0.9 alpha'", 2)

# ---------------------------------------------------------------- syntax check (when node exists)
import re, tempfile
if shutil.which('node'):
    for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
        body = m.group(1)
        if not body.strip():
            continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
            t.write(body)
        r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
        os.unlink(t.name)
        assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    print('syntax check ok')
else:
    print('node not found: syntax check skipped')

open(P, 'w', encoding='utf-8').write(s)

# ---------------------------------------------------------------- docs
def append(path, text):
    p = os.path.join(ROOT, path)
    old = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    open(p, 'w', encoding='utf-8').write(old.rstrip('\n') + '\n' + text)

append('DEV-NOTES.md', '''
- v3.0.9 part 1 (exe launch): کامنت EXE-3.0.9 (CSS ته استایل + داخل appExe). پنجره‌ی exe یه کارت پیشرفت ۴ مرحله‌ای داره (`w.exeStep(i,text,frac)`: 0 Download runtime، 1 Install، 2 Setup، 3/4 Open window؛ `w.exeSub(text)`). مراحل از رویدادهای واقعی جاوا میان: progress{rootfs|container}، exeState{preparing|launching|running|error}، و بعد از resolve شدن runExe. علت «چسبیدن/جا موندن پنجره‌ی برنامه»: setExeRect جاوا وقتی هنوز Activity ساخته نشده بی‌صدا رد می‌شد ولی کش `last` توی appExe فکر می‌کرد ارسال شده؛ حالا `w.forcePush()` بعد از exeStarted/launching/running (۰، ۴۰۰، ۱۲۰۰ms با `exePushSoon`)، بعد از نمایش دوباره‌ی پنجره و بعد از appResumed کش رو پاک می‌کنه و rect رو دوباره می‌فرسته. تاخیر sched از 60 به 16ms.''')
append('NEXT.md', '''
## بعد از v3.0.9 (بخش ۱: exe)
روی گوشی تست نشده. جاوا تغییر نکرده، پس بیلد وب کافیه. مرحله‌ی «Download runtime» در واقع باز کردن runtime از داخل APK هست (دانلود اینترنتی نیست) و فقط بار اول طول می‌کشه؛ برای بقیه‌ی اجراها سریع رد میشه. اگه پنجره‌ی برنامه هنوز جا می‌مونه، موقع درگ ویدیو بگیر یا بگو دقیقا کی (شروع برنامه، درگ، مینیمایز، برگشت از بکگراند).''')
print('OK: src/index.html patched, DEV-NOTES.md and NEXT.md updated')

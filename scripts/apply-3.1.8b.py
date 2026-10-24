#!/usr/bin/env python3
# NexOS 3.1.8b - "What's New" popup + strong performance pass (animations kept). Run from repo root, after apply-3.1.8.py
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'WN-3.1.8b' in s:
    print('already applied'); sys.exit(0)
assert 'FINAL-3.1.8' in s, 'apply apply-3.1.8.py first'

css = r"""/* WN-3.1.8b PERF2-3.1.8b */
#wn{position:fixed;inset:0;z-index:9900;display:flex;align-items:center;justify-content:center;padding:14px;background:#0009;opacity:0;animation:wnbg .16s ease-out forwards}
#wn.bye{animation:wnbye .2s ease-in forwards}#wn.bye .c{animation:wnout .2s ease-in forwards}
#wn .c{width:min(94vw,460px);max-height:min(88vh,660px);display:flex;flex-direction:column;border-radius:26px;background:var(--surf);color:var(--txt);border:1px solid var(--line);box-shadow:0 24px 70px #000a;overflow:hidden;transform:translateY(16px) scale(.96);animation:wnpop .26s var(--spring) forwards}
#wn .hd{display:flex;align-items:center;gap:14px;padding:20px 22px 10px}
#wn .lo{width:50px;height:50px;border-radius:15px;background:linear-gradient(150deg,#121a33,#05070d);display:grid;place-items:center;flex:none;box-shadow:0 6px 18px #6366f155}
#wn .lo svg{width:30px;height:30px}
#wn h2{margin:0;font-size:21px;font-weight:700;letter-spacing:-.01em}#wn .hd p{margin:2px 0 0;font-size:12.5px;color:var(--mut)}
#wn .ls{overflow:auto;padding:4px 12px 6px;overscroll-behavior:contain}
#wn .it{display:flex;gap:13px;align-items:flex-start;padding:9px 10px;border-radius:14px;animation:fade .3s var(--ease) backwards;animation-delay:calc(var(--i)*28ms + .12s)}
#wn .it:hover{background:var(--hov)}
#wn .e{font-size:23px;line-height:1.15;width:32px;text-align:center;flex:none;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
#wn .it b{display:block;font-size:14px;font-weight:600}#wn .it span{display:block;font-size:12.3px;color:var(--mut);margin-top:1px;line-height:1.35}
#wn .ft{padding:10px 18px 18px}
#wn .ft button{width:100%;height:46px;border:0;border-radius:15px;font-size:15px;font-weight:600;color:#fff;background:linear-gradient(135deg,#22d3ee,#8b5cf6);box-shadow:0 8px 22px #6366f155}
#wn .ft button:active{filter:brightness(.9);transform:scale(.98)}
@keyframes wnbg{to{opacity:1}}@keyframes wnbye{to{opacity:0}}
@keyframes wnpop{to{transform:none}}@keyframes wnout{to{transform:translateY(10px) scale(.96);opacity:0}}
/* performance (animations stay) */
#desk{will-change:transform}
#dock{will-change:transform}
.win:not(.max){box-shadow:0 10px 28px #00000055}
.exp .row{content-visibility:auto;contain-intrinsic-size:auto 44px}
.tmo{contain:content}
html{-webkit-tap-highlight-color:transparent}
button,.di,.ni,.row,#pins button{touch-action:manipulation}
body.hid *,body.hid *::before,body.hid *::after{animation-play-state:paused!important}
body.lite *,body.lite *::before,body.lite *::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important;text-shadow:none!important}
body.lite #dock{background:rgba(24,28,42,.94)!important}
body.lite #start,body.lite #ctx,body.lite #npc,body.lite #mnpc,body.lite #toast,body.lite #trf,body.lite #pwm{background:var(--surf)!important}
body.lite .win{border-color:var(--line)}
"""
old = '</style><!--NEXOS-END--></head>'
assert s.count(old) == 1
s = s.replace(old, css + old)

js = r"""/* WN-3.1.8b */
(function(){
var VER='3.1.8',B=document.body;
/* ---- pause CSS animations while the app is in the background ---- */
function vis(){B.classList.toggle('hid',document.hidden)}
document.addEventListener('visibilitychange',vis);vis();
/* ---- auto "lite" mode: if the phone cannot keep ~30fps during touch, drop blur/shadows only (animations stay) ---- */
var liteDone=false,sampling=false,tries=0;
function sample(){
  if(liteDone||sampling||tries>=4)return;sampling=true;tries++;
  var last=0,n=0,bad=0,t0=performance.now();
  function f(t){
    if(last){var d=t-last;if(d<250){n++;if(d>34)bad++}}
    last=t;
    if(t-t0<1600)requestAnimationFrame(f);
    else{sampling=false;if(n>=20&&bad/n>.35){liteDone=true;B.classList.add('lite')}}
  }
  requestAnimationFrame(f);
}
addEventListener('pointerdown',function(){setTimeout(sample,60)},{passive:true,capture:true});
/* ---- What's New ---- */
var ITEMS=[
['✨','New look','N logo, new boot and power-on animations'],
['🪄','Smooth everywhere','Fluid motion on windows, buttons and icons'],
['⚡','Speed boost','Lighter and faster, with every animation kept'],
['🖱️','Mouse & typing','New cursors, keyboard and typing fixes'],
['🧲','Drag & drop','Hold-to-drag 0.1–1.0 s, drop on the Recycle Bin'],
['🌐','Desktop browser','Pages lay out like a real PC screen, adjustable size'],
['🗑️','Desktop upgrade','Browser icon, Recycle Bin and 8 new wallpapers'],
['📶','Smart taskbar','Wi-Fi and battery tray, live window previews, customizable'],
['🎵','New music player','Queue, library and a mini widget in the dock'],
['🔍','Start & Search','Windows 11 style with filters, Lock, Sleep, Restart, Shut down'],
['🚀','Better EXE launching','Progress window, no more sticking, runs .bat and code files'],
['💻','PowerShell terminal','Windows commands with internet access'],
['🧑‍💻','Visual Studio Code','Windows version, find it from the taskbar search'],
['📁','Full file access','Android/data and app folders in File Explorer']
];
function nlogo(){return '<svg viewBox="0 0 512 512"><path d="M168 368V144l176 224V144" fill="none" stroke="url(#nxg)" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function showWN(force){
  if(document.getElementById('wn'))return;
  try{if(!force&&localStorage.getItem('aur.wn')===VER)return;localStorage.setItem('aur.wn',VER)}catch(e){}
  var d=document.createElement('div');d.id='wn';
  var rows=ITEMS.map(function(r,i){return '<div class="it" style="--i:'+i+'"><div class="e">'+r[0]+'</div><div><b>'+r[1]+'</b><span>'+r[2]+'</span></div></div>'}).join('');
  d.innerHTML='<div class="c" role="dialog" aria-label="What\'s New"><div class="hd"><div class="lo">'+nlogo()+'</div><div><h2>What\'s New</h2><p>NexOS '+VER+'</p></div></div><div class="ls">'+rows+'</div><div class="ft"><button type="button">Let\'s go</button></div></div>';
  document.body.appendChild(d);
  function close(){if(d.classList.contains('bye'))return;d.classList.add('bye');document.removeEventListener('keydown',kd,true);setTimeout(function(){d.remove()},220)}
  function kd(e){if(e.key==='Escape'||e.key==='Enter'){e.stopPropagation();close()}}
  document.addEventListener('keydown',kd,true);
  d.querySelector('button').onclick=close;
  d.addEventListener('click',function(e){if(e.target===d)close()});
}
window.showWhatsNew=function(){showWN(true)};
(function wait(){
  if(document.body.classList.contains('booting')||document.getElementById('boot')){setTimeout(wait,150);return}
  setTimeout(function(){showWN(false)},200);
})();
})();
"""
old = '</script><!--NEXOS-END--></body></html>'
assert s.count(old) == 1
s = s.replace(old, js + old)
idx.write_text(s, encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.1.8b (WN-3.1.8b / PERF2-3.1.8b): پنجره‌ی What's New (#wn) یک بار برای هر ورژن بعد از بوت باز میشه (کلید aur.wn؛ دستی: showWhatsNew() در کنسول). لیست ITEMS داخل اسکریپت. بهینه‌سازی بدون حذف انیمیشن: لایه‌ی جدا برای #desk و #dock، سایه‌ی سبک‌تر پنجره، content-visibility برای ردیف‌های فایل‌منیجر، contain برای ترمینال، touch-action manipulation، توقف انیمیشن‌ها وقتی برنامه در پس‌زمینه است (body.hid)، و حالت خودکار body.lite: اگر موقع لمس بیشتر از ۳۵٪ فریم‌ها از ۳۴ms بیشتر شد فقط blur و سایه خاموش میشه (انیمیشن‌ها می‌مونن؛ فقط در همین نشست، ذخیره نمیشه).\n")
print('ok')

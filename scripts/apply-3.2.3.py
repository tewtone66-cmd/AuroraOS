#!/usr/bin/env python3
# NexOS 3.2.3 (part B) - taskbar: full-width relayout (start+apps centered or left, tray+clock right), auto-fit when crowded,
# lighter dock, redesigned battery / network flyout (quick settings). Run from repo root after 3.2.2.
import re, sys, pathlib
here = pathlib.Path(__file__).resolve().parent
root = here.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'TBX-3.2.3' in s:
    print('already applied'); sys.exit(0)
assert 'ZOOM-3.2.2' in s, 'apply 3.2.2 first'

def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, f'expected {count}, found {n}: {old[:80]}'
    s = s.replace(old, new)

# ---- flyout: replace fly(), flyPos(), click handler (all inside the tray IIFE) ----
a = s.index("function fly(){var c=navigator.connection"); b = s.index("function flyPos(){")
FLY = r"""function cap(x){return x?x.charAt(0).toUpperCase()+x.slice(1):x}
function qt(k,ic,t,sub,on){return '<button class="qt'+(on?' on':'')+'" data-q="'+k+'"><span class="qi">'+ic+'</span><span class="qx"><b>'+t+'</b><small>'+sub+'</small></span></button>'}
function fly(){var c=navigator.connection,on=navigator.onLine!==false,dark=document.documentElement.dataset.theme==='dark',h='';
 var ty=!on?'Offline':((c&&c.type&&c.type!=='unknown'&&c.type!=='none')?cap(c.type):(c&&c.effectiveType?c.effectiveType.toUpperCase():'Online'));
 var sub=!on?'No connection':([c&&c.downlink?c.downlink+' Mbps':'',c&&c.saveData?'Data saver':''].filter(Boolean).join(' · ')||'Connected');
 h+='<div class="qs">'+qt('net',!on?ico.off:((c&&c.type==='cellular')?ico.cell:ico.wifi),ty,sub,on)
  +qt('perf',svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),'Performance',S.perf?'On':'Off',!!S.perf)
  +qt('theme',svg('<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>'),'Dark mode',dark?'On':'Off',dark)
  +qt('vm',svg('<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 3v7"/>'),'Virtual mouse'.slice(0,0)+'Mouse',VM.on?'On':'Off',!!VM.on)+'</div>';
 if(BAT){var p=Math.round(BAT.level*100),ch=!!BAT.charging,tm=ch?BAT.chargingTime:BAT.dischargingTime,hr=Math.floor(tm/3600),mn=Math.round(tm%3600/60),
   ts=(isFinite(tm)&&tm>0)?((hr?hr+' h ':'')+mn+' min '+(ch?'to full':'left')):'',stt=(p>=100&&ch)?'Fully charged':(ch?'Charging':'On battery');
  h+='<div class="qb'+(ch?' ch':'')+((p<20&&!ch)?' lo':'')+'"><div class="qh"><b>'+p+'<small>%</small></b><span>'+stt+(ts?'<br><em>'+ts+'</em>':'')+'</span></div><div class="qbar"><i style="width:'+p+'%"></i></div>'
   +((p<20&&!ch)?'<div class="qtip">Battery is low. Performance mode can help it last longer.</div>':'')+'</div>'}
 h+='<button class="qlink" data-q="set">All settings</button>';
 trf.innerHTML=h}
"""
s = s[:a] + FLY + s[b:]
a = s.index("function flyPos(){"); b = s.index("\n", a)
s = s[:a] + "function flyPos(){var d=dock.getBoundingClientRect(),t=tray.getBoundingClientRect(),w=Math.min(344,innerWidth-16);trf.style.bottom=Math.max(8,innerHeight-d.top+10)+'px';var r=t.width?Math.max(8,innerWidth-t.right-6):12;trf.style.right=Math.max(8,Math.min(r,innerWidth-w-8))+'px'}" + s[b:]
a = s.index("trf.addEventListener('click',function(e){e.stopPropagation();"); b = s.index("\n", a)
s = s[:a] + "trf.addEventListener('click',function(e){e.stopPropagation();var q=e.target.closest&&e.target.closest('[data-q]');if(!q)return;var k=q.dataset.q;if(k==='perf')setPerf(!S.perf);else if(k==='theme'&&typeof togTheme==='function')togTheme();else if(k==='vm'){vmSet(!VM.on)}else if(k==='net'||k==='set'){closeMenus();openApp('set');return}fly();draw()});" + s[b:]

# ---- taskbar fit + lighter dock ----
JS = r"""/* TBX-3.2.3 - keep every pinned app visible when the dock is crowded */
(function(){var dk=$('#dock'),tk=$('#tasks'),raf=0;if(!dk||!tk)return;
function over(){return dk.scrollWidth>dk.clientWidth+1||tk.scrollWidth>tk.clientWidth+1}
function fit(){raf=0;dk.classList.remove('fit','crowd');dk.style.removeProperty('--tbg');dk.style.removeProperty('--tbk');if(!over())return;dk.classList.add('fit');
 var gs=[12,8,5,3],ks=[1,.92,.84,.76,.68,.6],done=false;
 for(var i=0;i<ks.length&&!done;i++){dk.style.setProperty('--tbk',ks[i]);for(var j=0;j<gs.length;j++){dk.style.setProperty('--tbg',gs[j]+'px');if(!over()){done=true;break}}}if(!done)dk.classList.add('crowd')}
function soon(){if(!raf)raf=requestAnimationFrame(fit)}
var _du=dockUpdate;dockUpdate=function(){var r=_du.apply(this,arguments);soon();return r};
var _at=applyTb;applyTb=function(){var r=_at.apply(this,arguments);soon();return r};
addEventListener('resize',soon);addEventListener('orientationchange',soon);
try{new MutationObserver(soon).observe(tk,{childList:true})}catch(e){}
try{new MutationObserver(soon).observe($('#tray'),{childList:true})}catch(e){}
soon()})();
"""
css = (here / 'b.css').read_text(encoding='utf-8')
rep("</style><!--NEXOS-END--></head>", "/*TBX-3.2.3*/\n" + css + "\n</style><!--NEXOS-END--></head>")
rep("</script><!--NEXOS-END--></body></html>", JS + "</script><!--NEXOS-END--></body></html>")

s, n = re.subn(r'Version 3\.2\.2', 'Version 3.2.3', s); assert n >= 1
rep("var VER='3.2.2'", "var VER='3.2.3'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
s = s[:a] + """var ITEMS=[
['🪟','Full-width taskbar fixed','Start and apps sit in the middle (or left), tray and clock stay on the right'],
['📏','Always fits','When many apps are pinned, gaps and icons shrink so none gets cut off'],
['⚡','Quick settings','New Network / Performance / Dark mode / Virtual mouse tiles'],
['🔋','New battery card','Big percentage, animated charging bar, time left and low-battery tip'],
['🚀','Lighter taskbar','Fewer GPU layers while idle']
];""" + s[b:]
idx.write_text(s, encoding='utf-8')
pj = root / 'package.json'
if pj.exists():
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.3"', pj.read_text(encoding='utf-8'), count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.3 (TBX-3.2.3، بخش B): حالت tb-full با grid بازچینی شد (استارت+برنامه‌ها وسط یا چپ، tray و ساعت راست؛ جداکننده‌ها مخفی). taskFit: اگه dock سرریز کنه gap و سایز آیکن کم میشه (کلاس fit و --tbg/--tbk). will-change فقط هنگام hover. فلای‌اوت tray کامل بازنویسی شد (کاشی‌های Network/Performance/Dark/VM، کارت باتری با انیمیشن شارژ، دکمه All settings). fly/flyPos/handler داخل IIFE تعویض متنی شدن.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.3\nکاشی Network فعلاً فقط تنظیمات رو باز میکنه (صفحه‌ی Battery در بخش C میاد). روشنایی و صدا در فلای‌اوت نیست چون وب‌ویو کنترل سیستم نداره.\n")
print('ok')

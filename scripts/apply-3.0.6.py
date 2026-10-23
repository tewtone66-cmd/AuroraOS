#!/usr/bin/env python3
# NexOS 3.0.6 - taskbar: system tray (network, battery), window previews on hover, shape/layout options (run from repo root, after 3.0.5)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'TB-3.0.6' in s:
    print('already applied'); sys.exit(0)
assert 'DESK-3.0.5' in s, 'apply apply-3.0.5.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# 1) dock markup: tray slot before the clock
rep('<i class="dv"></i><div id="clock"></div>', '<i class="dv"></i><div id="tray"></div><div id="clock"></div>')

# 2) settings rows + handlers
rep("<h4>Show clock</h4>${onoff('tbk',S.tbk)}",
    "<h4>Show clock</h4>${onoff('tbk',S.tbk)}"
    "<h4>Shape</h4>${chips('tbr',['pill','round','square'],S.tbr,v=>({pill:'Pill',round:'Rounded',square:'Square'})[v])}"
    "<h4>Layout</h4>${chips('tbw',['float','full'],S.tbw,v=>v==='full'?'Full width (Windows style)':'Floating')}"
    "<h4>Icon alignment (full width)</h4>${chips('tba',['center','left'],S.tba,v=>v==='left'?'Left':'Center')}"
    "<h4>Show system tray (network, battery)</h4>${onoff('tbt',S.tbt)}"
    "<h4>Window previews on hover</h4>${onoff('tbv',S.tbv)}")
rep("else if(k==='rp'){",
    "else if(k==='tbr'||k==='tbw'||k==='tba'){S[k]=v;ls('aur.'+k,v);applyTb();sync()}"
    "else if(k==='tbt'||k==='tbv'){S[k]=v==='1';ls('aur.'+k,v);applyTb();sync()}"
    "else if(k==='rp'){")

# 3) css
css = """/* TB-3.0.6 */
body.tb-round #dock{border-radius:24px}
body.tb-square #dock{border-radius:0}
body.tb-full #dock{left:50%;width:100vw;max-width:100vw;min-width:0;bottom:0;border-radius:0!important;border-left:0!important;border-right:0!important;border-bottom:0!important;padding:0 18px;height:calc(var(--tbs,62px) + 22px);justify-content:center}
body.tb-full.tb-left #dock{justify-content:flex-start}
body.tb-full.tb-left #tray{margin-left:auto}
body.tb-full #start{bottom:calc(var(--tbs,62px) + 32px + env(safe-area-inset-bottom,0px))}
#tray{display:flex;align-items:center;gap:2px;color:#fff;font-size:12px;font-weight:600;text-shadow:0 1px 3px #0006}
body.tb-light #tray{color:#111;text-shadow:none}body.no-tray #tray{display:none}
.tri{display:flex;align-items:center;gap:5px;border:0;background:none;color:inherit;font:inherit;padding:6px 8px;border-radius:10px;cursor:pointer}
.tri:hover,.tri:active{background:#ffffff2e}.tri svg{display:block}
#trf{position:fixed;z-index:9300;right:12px;bottom:112px;width:min(300px,calc(100vw - 24px));padding:12px;border-radius:18px;background:var(--pn,var(--surf));color:var(--txt);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid var(--line);box-shadow:0 18px 50px #0006;display:none}
#trf.show{display:block}
.tfr{padding:8px 4px}.tfr b{display:block;font-size:12px;color:var(--mut)}.tfr span{font-size:13px}
.tfb{height:6px;border-radius:3px;background:#8884;margin-top:8px;overflow:hidden}.tfb i{display:block;height:100%;background:var(--acc,#4f7cff)}
.tfg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}
.tfg button{border:1px solid var(--line);background:#8881;color:var(--txt);border-radius:12px;padding:10px;cursor:pointer;font:inherit;font-size:12px}
.tfg button.on{background:var(--acc,#4f7cff);color:#fff;border-color:transparent}
#tbpv{position:fixed;z-index:9300;display:none;gap:10px;padding:10px;border-radius:16px;background:var(--pn,var(--surf));color:var(--txt);border:1px solid var(--line);box-shadow:0 14px 40px #0006;max-width:calc(100vw - 16px);overflow:hidden}
#tbpv.show{display:flex}
.pvc{border:1px solid var(--line);background:#8881;border-radius:12px;padding:8px;cursor:pointer;color:inherit;font:inherit;text-align:left}
.pvc:hover{background:#8883}.pvt{font-size:11px;margin-bottom:6px;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pvb{position:relative;overflow:hidden;border-radius:6px;background:var(--surf)}
"""
p, m, c = s.partition('<!--NEXOS-START-->')
assert m and '</style>' in c
s = p + m + c.replace('</style>', css + '</style>', 1)

# 4) behaviour script
js = r"""<script>/* TB-3.0.6 */
(function(){try{
Object.assign(S,{tbr:['pill','round','square'].includes(ls('aur.tbr'))?ls('aur.tbr'):'pill',tbw:ls('aur.tbw')==='full'?'full':'float',tba:ls('aur.tba')==='left'?'left':'center',tbt:ls('aur.tbt')!=='0',tbv:ls('aur.tbv')!=='0'});
var _atb=applyTb;
applyTb=function(){var r=_atb.apply(this,arguments),b=document.body;b.classList.toggle('tb-round',S.tbr==='round');b.classList.toggle('tb-square',S.tbr==='square');b.classList.toggle('tb-full',S.tbw==='full');b.classList.toggle('tb-left',S.tba==='left');b.classList.toggle('no-tray',!S.tbt);return r};
var tray=$('#tray'),dock=$('#dock'),BAT=null;
var svg=function(p){return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'};
var ico={wifi:svg('<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5.5 12.5a10 10 0 0 1 13 0"/><path d="M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>'),
 off:svg('<path d="M2 9a15 15 0 0 1 20 0" opacity=".45"/><path d="M5.5 12.5a10 10 0 0 1 13 0" opacity=".45"/><path d="M9 16a5 5 0 0 1 6 0" opacity=".45"/><path d="M3 3l18 18"/>'),
 cell:svg('<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4"/>')};
var batIco=function(l,ch){var col=ch?'#3ddc84':(l<.2?'#ff5a5a':'currentColor');return '<svg width="26" height="16" viewBox="0 0 26 14" fill="none"><rect x="1" y="1" width="21" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><rect x="23" y="4.5" width="2" height="5" rx="1" fill="currentColor"/><rect x="3" y="3" width="'+Math.max(1,17*l).toFixed(1)+'" height="8" rx="1.5" fill="'+col+'"/>'+(ch?'<path d="M12.6 3L8.4 7.5H11.6L10.6 11L14.8 6.5H11.6Z" fill="#fff" stroke="#111" stroke-width=".4" stroke-linejoin="round"/>':'')+'</svg>'};
var trf=document.createElement('div');trf.id='trf';document.body.appendChild(trf);
function draw(){if(!tray)return;var c=navigator.connection,on=navigator.onLine!==false,t=c&&c.type,h='<button class="tri" id="trNet" title="Network">'+(!on?ico.off:(t==='cellular'?ico.cell:ico.wifi))+'</button>';
 if(BAT){var p=Math.round(BAT.level*100);h+='<button class="tri" id="trBat" title="Battery '+p+'%">'+batIco(BAT.level,BAT.charging)+'<span>'+p+'%</span></button>'}
 tray.innerHTML=h}
function fly(){var c=navigator.connection,on=navigator.onLine!==false,h='';
 if(BAT){var p=Math.round(BAT.level*100),tm=BAT.charging?BAT.chargingTime:BAT.dischargingTime,ts=(isFinite(tm)&&tm>0)?Math.floor(tm/3600)+' h '+Math.round(tm%3600/60)+' min '+(BAT.charging?'until full':'remaining'):'';
  h+='<div class="tfr"><b>Battery</b><span>'+p+'% · '+(BAT.charging?'Charging':'On battery')+(ts?' · '+ts:'')+'</span><div class="tfb"><i style="width:'+p+'%"></i></div></div>'}
 h+='<div class="tfr"><b>Network</b><span>'+(on?('Online'+((c&&c.type&&c.type!=='unknown')?' · '+c.type:((c&&c.effectiveType)?' · '+c.effectiveType:''))+((c&&c.downlink)?' · '+c.downlink+' Mbps':'')):'Offline')+'</span></div>'
  +'<div class="tfg"><button data-q="perf" class="'+(S.perf?'on':'')+'">Performance mode</button><button data-q="theme">Dark / Light</button></div>';
 trf.innerHTML=h}
function flyPos(){var d=dock.getBoundingClientRect();trf.style.bottom=Math.max(8,innerHeight-d.top+10)+'px'}
trf.addEventListener('click',function(e){e.stopPropagation();var q=e.target.closest&&e.target.closest('[data-q]');if(!q)return;if(q.dataset.q==='perf')setPerf(!S.perf);else if(q.dataset.q==='theme'&&typeof togTheme==='function')togTheme();fly()});
if(tray)tray.addEventListener('click',function(e){e.stopPropagation();var open=trf.classList.contains('show');closeMenus();if(open)return;fly();flyPos();trf.classList.add('show');menuOpen=true;sync()});
if(navigator.getBattery)navigator.getBattery().then(function(b){BAT=b;['levelchange','chargingchange','chargingtimechange','dischargingtimechange'].forEach(function(n){b.addEventListener(n,function(){draw();if(trf.classList.contains('show'))fly()})});draw()}).catch(function(){});
addEventListener('online',draw);addEventListener('offline',draw);if(navigator.connection&&navigator.connection.addEventListener)navigator.connection.addEventListener('change',draw);
/* window previews */
var pv=document.createElement('div');pv.id='tbpv';document.body.appendChild(pv);
var pvApp=null,pvTm=0,pvIv=0,pvMenu=false;
function pvHide(){clearTimeout(pvTm);clearInterval(pvIv);pvIv=0;pvApp=null;pv.classList.remove('show');if(pvMenu){pvMenu=false;menuOpen=false;sync()}}
function pvBuild(){var ws=Object.keys(W).map(function(k){return W[k]}).filter(function(w){return w&&w.app===pvApp&&w.el&&!w.el.classList.contains('closing')});
 if(!ws.length){pvHide();return false}
 pv.innerHTML='';
 ws.slice(0,4).forEach(function(w){var el=w.el,sw=el.offsetWidth||parseFloat(el.style.width)||720,sh=el.offsetHeight||parseFloat(el.style.height)||460,k=Math.min(210/sw,128/sh);
  var card=document.createElement('button'),head=document.createElement('div'),box=document.createElement('div'),t=el.querySelector('.tbar span');
  card.className='pvc';head.className='pvt';head.textContent=(t&&t.textContent)||(A[w.app]&&A[w.app].n)||w.app;
  box.className='pvb';box.style.width=Math.round(sw*k)+'px';box.style.height=Math.round(sh*k)+'px';
  var cl=el.cloneNode(true);['min','minning','closing','opening','max'].forEach(function(x){cl.classList.remove(x)});
  cl.removeAttribute('id');cl.querySelectorAll('[id]').forEach(function(n){n.removeAttribute('id')});
  cl.querySelectorAll('video,audio,iframe,webview').forEach(function(n){n.remove()});
  cl.style.cssText='position:absolute;left:0;top:0;margin:0;width:'+sw+'px;height:'+sh+'px;transform:scale('+k+');transform-origin:0 0;pointer-events:none;animation:none;display:flex;box-shadow:none';
  box.appendChild(cl);card.appendChild(head);card.appendChild(box);
  card.onclick=function(e){e.stopPropagation();pvHide();try{showW(w)}catch(x){}};
  pv.appendChild(card)});
 return true}
function pvPos(btn){var r=btn.getBoundingClientRect(),w=pv.offsetWidth;pv.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';pv.style.bottom=Math.max(8,innerHeight-dock.getBoundingClientRect().top+10)+'px'}
function pvShow(btn,id){pvApp=id;if(!pvBuild())return;pv.classList.add('show');if(!menuOpen){pvMenu=true;menuOpen=true;sync()}pvPos(btn);clearInterval(pvIv);pvIv=setInterval(function(){if(pvApp&&pvBuild())pvPos(btn)},1500)}
var tasks=$('#tasks');
if(tasks)tasks.addEventListener('pointermove',function(e){if(!S.tbv||e.pointerType==='touch')return;var b=e.target.closest&&e.target.closest('.dk');if(!b||!b.dataset.id||b.dataset.id===pvApp)return;clearTimeout(pvTm);var id=b.dataset.id;pvTm=setTimeout(function(){pvShow(b,id)},380)},{passive:true});
dock.addEventListener('pointerleave',function(){clearTimeout(pvTm);pvTm=setTimeout(function(){if(!pv.matches(':hover'))pvHide()},300)});
addEventListener('pointerdown',function(e){if(pvApp&&!(e.target.closest&&e.target.closest('#tbpv')))pvHide()},true);
var _cm=closeMenus;closeMenus=function(){trf.classList.remove('show');pvHide();return _cm.apply(this,arguments)};
applyTb();draw();
}catch(e){try{console.error(e)}catch(x){}}})();
</script>"""
rep("</script><!--NEXOS-END-->", "</script>" + js + "<!--NEXOS-END-->")

s = s.replace('Version 3.0.5 alpha', 'Version 3.0.6 alpha').replace("'3.0.5 alpha'", "'3.0.6 alpha'")
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.6"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.6 (taskbar): اسکریپت جدا با کامنت TB-3.0.6 قبل از NEXOS-END: سینی سیستم #tray (آیکن شبکه با navigator.connection، باتری با getBattery) + فلای‌اوت #trf (باتری، شبکه، حالت کارایی، تم)؛ پیش‌نمایش پنجره‌ها #tbpv (cloneNode پنجره با scale، هر ۱.۵ثانیه رفرش، با ۳۸۰ms مکث روی آیکن)؛ applyTb و closeMenus wrap شدن؛ تنظیمات: S.tbr شکل (pill/round/square)، S.tbw چیدمان (float/full)، S.tba تراز، S.tbt سینی، S.tbv پیش‌نمایش. کلاس‌های بدنه: tb-round tb-square tb-full tb-left no-tray\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.6\nروی گوشی تست نشده. محدودیت‌ها: پیش‌نمایش پنجره عکس لحظه‌ای DOM هست (مرورگر native، ویدیو و canvas خالی نشون داده میشن)؛ پیش‌نمایش روی لمس نیست؛ کنترل صدای سیستم توی سینی نیست (وب‌ویو API نداره).\n")
print('ok')

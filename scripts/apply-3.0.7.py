#!/usr/bin/env python3
# NexOS 3.0.7 - music player rewrite + now-playing widget inside the taskbar + new icon (run from repo root, after 3.0.6)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'MUSIC-3.0.7' in s:
    print('already applied'); sys.exit(0)
assert 'TB-3.0.6' in s, 'apply apply-3.0.6.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


# 1) new app icon + gradient (static, so start menu / dock / desktop all pick it up)
rep("""IC.music=P('<g stroke="none"><path d="M9 4v11.3a3 3 0 1 0 2 2.7V8h6V4z" fill="#fff"/></g>');""",
    """IC.music=P('<g stroke="none" fill="#fff"><circle cx="7" cy="17.6" r="2.8"/><circle cx="16.8" cy="15.6" r="2.8"/><path d="M8 17.5V6.4L19.6 4V15.6H17.8V7.6L9.8 9.2V17.5Z"/></g>');""")
rep("music:{n:'Music',g:'linear-gradient(160deg,#ff7ab8,#7c3aed)',w:660,h:410,f:appMusic}",
    "music:{n:'Music',g:'linear-gradient(150deg,#ff5fa8,#7c3aed 55%,#3b82f6)',w:700,h:440,f:(w,a)=>appMusic(w,a)}")

# 2) css
css = r"""/* MUSIC-3.0.7 */
.mz{--hu:280;position:relative;display:flex;height:100%;color:#fff;overflow:hidden;outline:none;background:radial-gradient(circle at 15% 20%,hsl(var(--hu) 60% 30%),hsl(calc(var(--hu) + 45) 50% 8%) 75%);transition:background .6s}
.mz svg,#mnpc svg,#mnp svg{width:22px;height:22px;fill:currentColor;stroke:currentColor;stroke-width:0}
.mz [data-a=shuf] svg,.mz [data-a=rep] svg,.mz [data-a=pl] svg,#mnpc [data-a=shuf] svg,#mnpc [data-a=rep] svg{fill:none;stroke:currentColor;stroke-width:2}
.mz button,#mnpc button{background:none;border:0;color:#fff;cursor:pointer;display:grid;place-items:center;border-radius:50%;width:42px;height:42px;padding:0;opacity:.92}
.mz button:hover,#mnpc button:hover{background:#ffffff1f}.mz button.on,#mnpc button.on{color:hsl(var(--hu) 90% 74%)}
.mz .mpl{flex:none;display:grid;place-items:center;padding:20px 8px 20px 24px}
.mcv{width:min(190px,40vh);aspect-ratio:1;border-radius:22px;display:grid;place-items:center;background:linear-gradient(145deg,hsl(var(--hu) 75% 60%),hsl(calc(var(--hu) + 55) 65% 28%));box-shadow:0 18px 44px #0009,0 0 0 1px #ffffff22 inset;transition:transform .5s cubic-bezier(.2,.9,.3,1.2),box-shadow .5s}
.mcv svg{width:46%;height:46%;fill:#fff;stroke:none;opacity:.92}.mcv.play{transform:scale(1.04);box-shadow:0 22px 56px #000a,0 0 70px hsl(var(--hu) 85% 55% / .5),0 0 0 1px #ffffff30 inset}
.mz .mpr{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:16px 24px 16px 14px}
.mz .mti{font-size:20px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz .msb{font-size:12px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:15px}
.mz .meq{display:flex;align-items:flex-end;gap:3px;height:38px;margin:2px 0}.mz .meq i{flex:1;max-width:9px;height:4px;border-radius:3px;background:linear-gradient(0deg,hsl(var(--hu) 90% 60%),#fff);transition:height .09s}
.mz .sr,#mnpc .sr{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.95}
.mz .sr span,#mnpc .sr span,.mz .msb,#mnpc .tx small{color:#fff}
.mz .sl,#mnpc .sl{position:relative;flex:1;height:22px;cursor:pointer;touch-action:none}
.mz .sl:before,#mnpc .sl:before{content:"";position:absolute;left:0;right:0;top:8px;height:6px;border-radius:3px;background:#ffffff30}
.mz .sl i,#mnpc .sl i{position:absolute;left:0;top:8px;height:6px;width:0;border-radius:3px;background:linear-gradient(90deg,hsl(var(--hu) 85% 62%),#fff);pointer-events:none}
.mz .sl i:after,#mnpc .sl i:after{content:"";position:absolute;right:-6px;top:-3px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 4px #0008}
.mz .ct,#mnpc .ct{display:flex;align-items:center;justify-content:center;gap:6px}
.mz .ct .pp,#mnpc .ct .pp{width:54px;height:54px;background:#fff;color:#111;opacity:1}.mz .ct .pp:hover,#mnpc .ct .pp:hover{background:#fff}.mz .ct .pp svg,#mnpc .ct .pp svg{width:26px;height:26px}
.mz .vr{display:flex;align-items:center;gap:8px;width:min(220px,100%);margin:0 auto}.mz .vr svg{width:18px;height:18px;flex:none;opacity:.8}.mz .vr [data-a=stop]{width:34px;height:34px;flex:none}.mz .vr [data-a=stop] svg{width:16px;height:16px}
.mz .lb{position:absolute;top:8px;right:8px;z-index:2}
.mz .pl{position:absolute;top:0;right:0;bottom:0;width:min(300px,86%);display:flex;flex-direction:column;background:#0b0d12f2;transform:translateX(105%);transition:transform .35s cubic-bezier(.3,.9,.3,1);z-index:3}
.mz .pl.on{transform:none}
.mz .pt{display:flex;align-items:center;gap:4px;padding:10px 10px 6px}.mz .pt button{width:auto;height:30px;padding:0 12px;border-radius:15px;font-size:12px;opacity:.75}.mz .pt button.on{background:#ffffff22;opacity:1;color:#fff}.mz .pt [data-a=scan]{margin-left:auto}
.mz .pc{flex:1;overflow:auto;padding:2px 6px 8px;touch-action:pan-y}
.mz .pc div{padding:8px 12px;border-radius:8px;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;color:#ffffffcc}.mz .pc div:hover{background:#ffffff18}.mz .pc div.cur{background:hsl(var(--hu) 60% 40% / .55);color:#fff}
.mz .pc .pe{padding:18px 12px;opacity:.6;font-size:12px;white-space:normal;cursor:default}.mz .pc .pe:hover{background:none}
#mnp{display:none;align-items:center;gap:9px;height:44px;max-width:200px;padding:0 6px 0 5px;border-radius:999px;color:#fff;cursor:pointer;flex:none;user-select:none;background:linear-gradient(135deg,hsl(var(--hu,280) 60% 36%),hsl(calc(var(--hu,280) + 45) 55% 22%));box-shadow:inset 0 1px 0 #ffffff30}
#mnp.on{display:flex;animation:mnin .4s cubic-bezier(.2,.9,.3,1.2)}@keyframes mnin{from{transform:scale(.6);opacity:0}}
#mnp .cv{width:34px;height:34px;border-radius:50%;flex:none;display:grid;place-items:center;background:conic-gradient(hsl(var(--hu,280) 80% 62%),hsl(calc(var(--hu,280) + 55) 70% 30%),hsl(var(--hu,280) 80% 62%));animation:mspin 6s linear infinite}
#mnp.pz .cv{animation-play-state:paused}#mnp .cv i{width:10px;height:10px;border-radius:50%;background:#0b0d12;box-shadow:0 0 0 2px #ffffff55}
#mnp .ti{overflow:hidden;white-space:nowrap;max-width:96px;font-size:12px;font-weight:600;-webkit-mask-image:linear-gradient(90deg,#000 80%,transparent);mask-image:linear-gradient(90deg,#000 80%,transparent)}
#mnp .ti span{display:inline-block}#mnp .ti span.mq{animation:mnq 7s linear infinite alternate}@keyframes mnq{from{transform:translateX(0)}to{transform:translateX(var(--d,0))}}
#mnp .eq{display:flex;gap:2px;align-items:flex-end;height:16px;flex:none}#mnp .eq i{width:3px;height:4px;border-radius:2px;background:#fff;animation:mne .8s ease-in-out infinite}
#mnp .eq i:nth-child(2){animation-delay:.2s}#mnp .eq i:nth-child(3){animation-delay:.4s}#mnp.pz .eq i{animation:none;height:4px}@keyframes mne{0%,100%{height:4px}50%{height:16px}}
#mnp .wpp{width:30px;height:30px;border:0;border-radius:50%;background:#ffffff26;color:#fff;display:grid;place-items:center;cursor:pointer;padding:0;flex:none}#mnp .wpp svg{width:15px;height:15px;fill:#fff;stroke:none}
#mnpc{position:fixed;z-index:9300;width:300px;max-width:calc(100vw - 16px);padding:16px;border-radius:26px;color:#fff;display:none;background:linear-gradient(160deg,hsl(var(--hu,280) 50% 24% / .96),#0b0d12f2 80%);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid #ffffff22;box-shadow:0 20px 60px #000a}
#mnpc.on{display:block;animation:mncin .3s cubic-bezier(.2,.9,.3,1.15)}@keyframes mncin{from{transform:translateY(14px) scale(.94);opacity:0}}
#mnpc .r1{display:flex;gap:14px;align-items:center}#mnpc .mcv{width:64px;border-radius:16px;flex:none}
#mnpc .tx{min-width:0}#mnpc .tx b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#mnpc .tx small{opacity:.65;font-size:11px}
#mnpc .sr{margin-top:12px}#mnpc .ct{margin-top:4px}#mnpc .ct button{width:42px;height:42px}#mnpc .ct .pp{width:50px;height:50px}
#mnpc .r3{display:flex;align-items:center;gap:8px;margin-top:6px}#mnpc .r3 svg{width:18px;height:18px;flex:none;opacity:.8}#mnpc .r3 button{width:34px;height:34px}
#mnpc .op{margin-top:8px;width:100%;height:36px;border-radius:12px;background:#ffffff1f;font-size:12.5px}
"""
p, m, c = s.partition('<!--NEXOS-START-->')
assert m and '</style>' in c
s = p + m + c.replace('</style>', css + '</style>', 1)

# 3) behaviour (overrides the old music functions; audio element, queue state and listeners are kept)
js = r"""<script>/* MUSIC-3.0.7 */
(function(){try{
var dock=$('#dock'),tray=$('#tray'),clock=$('#clock'),AUD=/\.(mp3|m4a|aac|wav|flac|ogg|oga|opus|wma|amr|mid|midi)$/i;
var NOTE='<svg viewBox="0 0 24 24"><circle cx="7" cy="17.6" r="2.8"/><circle cx="16.8" cy="15.6" r="2.8"/><path d="M8 17.5V6.4L19.6 4V15.6H17.8V7.6L9.8 9.2V17.5Z"/></svg>';
var STOP='<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
MU.lib=MU.lib||[];
try{var v0=parseFloat(ls('aur.mvol'));MU.au.volume=isFinite(v0)?Math.max(0,Math.min(1,v0)):.8}catch(e){}
function setVol(f){f=Math.max(0,Math.min(1,f));MU.au.volume=f;ls('aur.mvol',String(f));document.querySelectorAll('.vs i').forEach(function(i){i.style.width=f*100+'%'})}
function seek(f){var d=MU.au.duration;if(isFinite(d)&&d>0)MU.au.currentTime=Math.max(0,Math.min(1,f))*d}
function place(){var np=MU.np,c=MU.card;if(!np||!c||!c.classList.contains('on'))return;var r=np.getBoundingClientRect(),d=dock.getBoundingClientRect(),w=c.offsetWidth||300;c.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';c.style.bottom=Math.max(8,innerHeight-d.top+10)+'px'}
function cardShow(on){var c=MU.card;if(!c)return;if(on===undefined)on=!c.classList.contains('on');if(on){closeMenus();c.classList.add('on');place();menuOpen=true;sync()}else if(c.classList.contains('on')){c.classList.remove('on');menuOpen=false;sync()}}
npPlace=place;
npInit=function(){if(MU.np)return;
 var np=MU.np=h('div','','<div class="cv"><i></i></div><div class="ti"><span></span></div><div class="eq"><i></i><i></i><i></i></div><button class="wpp" aria-label="Play or pause"></button>');np.id='mnp';
 var c=MU.card=h('div','','<div class="r1"><div class="mcv">'+NOTE+'</div><div class="tx"><b></b><small></small></div></div>'
  +'<div class="sr"><span class="a">0:00</span><div class="sl"><i></i></div><span class="b">0:00</span></div>'
  +'<div class="ct"><button data-a="shuf" title="Shuffle">'+MI.shuf+'</button><button data-a="prev" title="Previous">'+MI.prev+'</button><button class="pp" data-a="pp"></button><button data-a="next" title="Next">'+MI.next+'</button><button data-a="rep" title="Repeat">'+MI.rep+'</button></div>'
  +'<div class="r3">'+MI.vol+'<div class="sl vs"><i></i></div><button data-a="stop" title="Stop and close">'+STOP+'</button></div>'
  +'<button class="op" data-a="open">Open player</button>');c.id='mnpc';
 if(dock)dock.insertBefore(np,tray||clock||null);else document.body.appendChild(np);document.body.appendChild(c);
 np.addEventListener('click',function(e){e.stopPropagation();if(e.target.closest('.wpp'))muToggle();else cardShow()});
 c.addEventListener('click',function(e){e.stopPropagation();var a=e.target.closest('[data-a]');if(!a)return;var k=a.dataset.a;
  if(k==='pp')muToggle();else if(k==='prev')muStep(-1);else if(k==='next')muStep(1);else if(k==='shuf'){MU.shuf=MU.shuf?0:1;muUI()}else if(k==='rep'){MU.rep=(MU.rep+1)%3;muUI()}
  else if(k==='stop'){cardShow(false);muStop()}else if(k==='open'){cardShow(false);openApp('music')}});
 mslider(c.querySelector('.sl'),seek);mslider(c.querySelector('.vs'),setVol);setVol(MU.au.volume);
 addEventListener('resize',place)};
function drawPl(b){var pl=b.querySelector('.pl'),tab=pl.dataset.tab||'q',arr=tab==='q'?MU.list:MU.lib,pc=b.querySelector('.pc');pc.innerHTML='';
 b.querySelectorAll('.pt [data-t]').forEach(function(x){x.classList.toggle('on',x.dataset.t===tab)});
 if(!arr.length){var e=document.createElement('div');e.className='pe';e.textContent=tab==='q'?'The queue is empty. Open a song from File Explorer or use the Library tab.':'Press Scan to find music on this device.';pc.appendChild(e);return}
 var cur=MU.list[MU.i];arr.forEach(function(x,i){var d=document.createElement('div');d.textContent=(i+1)+'.  '+muName(x);d.dataset.i=i;if(arr[i]===cur)d.className='cur';pc.appendChild(d)})}
muUI=function(trk){var has=!!(MU.au.src&&MU.list.length),p=MU.list[MU.i],n=muName(p),pa=MU.au.paused,hu=muHue(n||'x');
 if(has)npInit();
 if(MU.np){var np=MU.np,c=MU.card;np.classList.toggle('on',has);np.classList.toggle('pz',pa);np.style.setProperty('--hu',hu);
  var sp=np.querySelector('.ti span');if(trk||sp.textContent!==n){sp.textContent=n;sp.classList.remove('mq');requestAnimationFrame(function(){var o=sp.parentNode.clientWidth,w=sp.scrollWidth;if(w>o+2){sp.style.setProperty('--d',-(w-o)+'px');sp.classList.add('mq')}})}
  np.querySelector('.wpp').innerHTML=pa?MI.play:MI.pause;
  c.style.setProperty('--hu',hu);c.querySelector('.tx b').textContent=n||'';c.querySelector('.tx small').textContent=has?(MU.i+1)+' / '+MU.list.length:'';
  c.querySelector('.mcv').classList.toggle('play',!pa&&has);c.querySelector('.pp').innerHTML=pa?MI.play:MI.pause;
  c.querySelector('[data-a=shuf]').classList.toggle('on',!!MU.shuf);var rp=c.querySelector('[data-a=rep]');rp.classList.toggle('on',MU.rep>0);rp.title=['Repeat off','Repeat all','Repeat one'][MU.rep];
  if(!has)cardShow(false);else place()}
 var w=MU.w;if(w){var b=w.body,m=b.querySelector('.mz');if(m){m.style.setProperty('--hu',hu);b.querySelector('.mti').textContent=n||'Nothing playing';
  b.querySelector('.msb').textContent=p?((p.split('/').slice(-2,-1)[0]||'')+'  ·  '+(MU.i+1)+' / '+MU.list.length):'Open a song from File Explorer, or use the list button';
  b.querySelector('.mcv').classList.toggle('play',!pa&&has);b.querySelector('.pp').innerHTML=pa?MI.play:MI.pause;
  b.querySelector('[data-a=shuf]').classList.toggle('on',!!MU.shuf);var r2=b.querySelector('[data-a=rep]');r2.classList.toggle('on',MU.rep>0);r2.title=['Repeat off','Repeat all','Repeat one'][MU.rep];
  w.setTitle((n||'Music')+' - Music');drawPl(b)}}
 if(!pa&&!MU.raf)MU.raf=requestAnimationFrame(muLoop)};
async function scan(root,depth,out){try{var r=await NF.list({path:root});var it=r.items||[];for(var i=0;i<it.length;i++){if(out.length>=800)return;var x=it[i];if(x.isDirectory){if(depth>0&&x.name.charAt(0)!=='.'&&x.name!=='Android')await scan(x.path,depth-1,out)}else if(AUD.test(x.name))out.push(x.path)}}catch(e){}}
appMusic=function(w,arg){var B=w.body;MU.w=w;
 B.innerHTML='<div class="mz" tabindex="0"><div class="mpl"><div class="mcv">'+NOTE+'</div></div><div class="mpr"><div class="mti">Nothing playing</div><div class="msb"></div><div class="meq">'+'<i></i>'.repeat(24)+'</div>'
  +'<div class="sr"><span class="t0">0:00</span><div class="sl"><i></i></div><span class="t1">0:00</span></div>'
  +'<div class="ct"><button data-a="shuf" title="Shuffle">'+MI.shuf+'</button><button data-a="prev" title="Previous">'+MI.prev+'</button><button class="pp" data-a="pp">'+MI.play+'</button><button data-a="next" title="Next">'+MI.next+'</button><button data-a="rep" title="Repeat">'+MI.rep+'</button></div>'
  +'<div class="vr">'+MI.vol+'<div class="sl vs"><i></i></div><button data-a="stop" title="Stop">'+STOP+'</button></div></div>'
  +'<button class="lb" data-a="pl" title="Queue and library">'+MI.lst+'</button>'
  +'<div class="pl" data-tab="q"><div class="pt"><button data-t="q" class="on">Queue</button><button data-t="l">Library</button><button data-a="scan">Scan</button></div><div class="pc"></div></div></div>';
 var mp=B.querySelector('.mz');
 mslider(B.querySelector('.sl'),seek);mslider(B.querySelector('.vs'),setVol);setVol(MU.au.volume);
 mp.addEventListener('pointerdown',function(){mp.focus({preventScroll:true})});
 mp.addEventListener('keydown',function(e){var k=e.key;if(k===' '){e.preventDefault();muToggle()}else if(k==='ArrowRight'){MU.au.currentTime=Math.min(MU.au.duration||1e9,MU.au.currentTime+5)}else if(k==='ArrowLeft'){MU.au.currentTime=Math.max(0,MU.au.currentTime-5)}else if(k==='ArrowUp'){e.preventDefault();setVol(MU.au.volume+.05)}else if(k==='ArrowDown'){e.preventDefault();setVol(MU.au.volume-.05)}else if(k==='n'||k==='N')muStep(1);else if(k==='p'||k==='P')muStep(-1)});
 B.addEventListener('click',function(e){var pl=B.querySelector('.pl'),t=e.target.closest('[data-t]');
  if(t){pl.dataset.tab=t.dataset.t;drawPl(B);return}
  var a=e.target.closest('[data-a]');
  if(a){var k=a.dataset.a;
   if(k==='pp')muToggle();else if(k==='prev')muStep(-1);else if(k==='next')muStep(1);else if(k==='shuf'){MU.shuf=MU.shuf?0:1;muUI()}else if(k==='rep'){MU.rep=(MU.rep+1)%3;muUI()}
   else if(k==='stop')muStop();else if(k==='pl'){pl.classList.toggle('on');drawPl(B)}
   else if(k==='scan'){pl.dataset.tab='l';var pc=B.querySelector('.pc');pc.innerHTML='<div class="pe">Scanning…</div>';var out=[];scan('/storage/emulated/0/Music',3,out).then(function(){return scan('/storage/emulated/0/Download',2,out)}).then(function(){MU.lib=out;drawPl(B);if(!out.length)toast('No music found. Check the file access permission.')})}
   return}
  var d=e.target.closest('.pc div[data-i]');if(d){var i=+d.dataset.i;if((pl.dataset.tab||'q')==='q'){MU.i=i;muLoad()}else muPlay(MU.lib,MU.lib[i]);pl.classList.remove('on')}});
 w.open=function(a){if(a&&a.path)muPlay(a.list&&a.list.length?a.list:[a.path],a.path);else muUI(true)};
 w.onclose=function(){MU.w=null};
 w.open(arg)};
var _cm=closeMenus;closeMenus=function(){if(MU.card)MU.card.classList.remove('on');return _cm.apply(this,arguments)};
if(MU.list.length)muUI(true);
}catch(e){try{console.error(e)}catch(x){}}})();
</script>"""
rep("</script><!--NEXOS-END-->", "</script>" + js + "<!--NEXOS-END-->")

s = s.replace('Version 3.0.6 alpha', 'Version 3.0.7 alpha').replace("'3.0.6 alpha'", "'3.0.7 alpha'")
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.7"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.7 (music): اسکریپت جدا با کامنت MUSIC-3.0.7 قبل از NEXOS-END توابع appMusic/npInit/muUI/npPlace رو override می‌کنه (A.music.f الان arrow به appMusic هست تا override دیده بشه). ویجت #mnp داخل #dock (قبل از #tray) و کارت #mnpc بالای دَک؛ کلاس ریشه‌ی پلیر `.mz` (نه `.mp` که مال Photos هست)؛ کلاس‌های `.sl i` و `.a/.b/.t0/.t1/.meq i` عمدا حفظ شدن چون listenerهای timeupdate/muBars قدیمی بهشون وابسته‌ان. باگ‌های رفع‌شده: آیکن‌های shuffle/repeat به خاطر CSS پر می‌شدن؛ بستن پنجره موزیک رو متوقف می‌کرد (حالا ادامه میده، توقف با دکمه‌ی Stop)؛ ویجت fixed بود و روی دَک می‌افتاد. جدید: تب Queue/Library با اسکن /Music و /Download، میانبرهای کیبورد (Space، فلش‌ها، N/P)، آیکن و گرادیان جدید\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.7\nروی گوشی تست نشده. اسکن کتابخونه به مجوز دسترسی کامل فایل نیاز داره و فقط /Music و /Download رو (تا عمق ۳ و ۲) می‌گرده. کاور آلبوم واقعی (ID3) پشتیبانی نمیشه.\n")
print('ok')

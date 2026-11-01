/* ISLAND-3.9.1 - Nex Island / music / notification fixes (needs src/patches/island-3.9.1.mjs) */
(function(){'use strict';
var doc=document,root=doc.documentElement;
function g(k,d){var v;try{v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{ls(k,v)}catch(e){}}
function $(s){return doc.querySelector(s)}
/* notifications go to the side of the screen by default (not into the island); done once */
if(g('aur.isl.notifmig','')!=='1'){put('aur.isl.notif','0');put('aur.isl.notifmig','1')}
function applyPos(){doc.body.setAttribute('data-nxpos',g('aur.nxpos','right'))}applyPos();
/* ---------- css ---------- */
var st=doc.createElement('style');st.id='nx-island-fix-css';st.textContent=[
/* the pointer is always drawn above the island; the old taskbar music widget is gone (Island / chip replaces it) */
'#cur,#vbtns{z-index:2147483600!important}#mnp,#mnpc{display:none!important}.nxd-set[hidden],.nxs[hidden]{display:none!important}',
/* notification popups: left or right edge, never in the middle */
'body[data-nxpos=left] #nxnHost{right:auto;left:12px}',
/* satellites */
'#nxdSat{position:fixed;top:calc(var(--nxd-top,8px) + env(safe-area-inset-top,0px));left:0;height:36px;z-index:2147483240;pointer-events:none}',
'.nxs-b{position:absolute;top:0;height:34px;min-width:34px;padding:0 10px;border-radius:17px;display:flex;align-items:center;justify-content:center;gap:6px;background:#05070d;color:#fff;font:600 12px system-ui,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.08);pointer-events:auto;cursor:pointer;-webkit-user-select:none;user-select:none;transition:left .45s cubic-bezier(.2,.95,.25,1.18),opacity .25s,transform .4s cubic-bezier(.2,.95,.25,1.3);animation:nxsIn .45s cubic-bezier(.2,.95,.25,1.3) backwards}',
'.nxs-b.out{opacity:0;transform:scale(.4)}.nxs-b svg{width:20px;height:20px;display:block}.nxs-b.nb svg{width:26px;height:15px}.nxs-b .nt-t{font-family:ui-monospace,monospace;color:#ff9f0a}',
'.nxs-b .rg{position:relative;width:24px;height:24px}.nxs-b .rg svg{width:24px;height:24px}.nxs-b .rg .bg{fill:none;stroke:rgba(255,255,255,.18);stroke-width:4}.nxs-b .rg .fg{fill:none;stroke:#ff9f0a;stroke-width:4;stroke-linecap:round;stroke-dasharray:163.4;transform:rotate(-90deg);transform-origin:50% 50%}',
'@keyframes nxsIn{from{opacity:0;transform:scale(.3)}}',
':root[data-skin=glass] .nxs-b{background:rgba(10,14,28,.62);-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.12),0 10px 30px rgba(0,0,0,.4)}',
'body.perf .nxs-b,body.rm .nxs-b{animation:none;transition:none}',
/* settings */
'.nxp-i{display:inline-flex;flex:none;width:20px;height:20px;margin-right:10px;vertical-align:-5px;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.28));pointer-events:none}.nxp-i svg{width:100%;height:100%;display:block}'
].join('\n');
doc.head.appendChild(st);
/* ---------- 1. close the expanded island by tapping anywhere else ---------- */
doc.addEventListener('click',function(e){var n=doc.getElementById('nxd');if(!n||n.getAttribute('data-show')!=='1')return;var v=n.getAttribute('data-v');
 if(v!=='music'&&v!=='timer'&&v!=='quick')return;if(e.target.closest&&(e.target.closest('#nxd')||e.target.closest('#nxdSat')))return;
 n.click()},true);
/* ---------- 2. the island reacts immediately when music starts / stops ---------- */
function kick(){setTimeout(function(){try{doc.dispatchEvent(new Event('visibilitychange'))}catch(e){}},30)}
['play','pause','ended'].forEach(function(t){doc.addEventListener(t,kick,true)});
/* ---------- 3. satellites: timer ring and battery as small bubbles next to the island ---------- */
var NI=window.NXISLAND,sat=null,bubs={},batT=0,SAT=null;
function bat(b,low){var l=Math.max(.04,Math.min(1,b.level)),w=(Math.max(1,Math.round(l*11))*1.6).toFixed(1);return'<svg viewBox="0 0 28 16"><rect x="1" y="1.5" width="22" height="13" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.4"/><rect x="3.2" y="3.7" width="'+w+'" height="8.6" rx="2" fill="'+(low?'#ff453a':b.charging?'#32d74b':'currentColor')+'"/><path d="M25 5.5v5" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/></svg>'}
function fmtT(ms){var s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60);s%=60;return(m<10?'0':'')+m+':'+(s<10?'0':'')+s}
function bubble(id,cls,html,tap){var b=bubs[id];if(!b){b=doc.createElement('div');b.className='nxs-b '+cls;b.addEventListener('click',function(e){e.stopPropagation();if(b._tap)b._tap()});sat.appendChild(b);bubs[id]=b}b._tap=tap;if(b._h!==html){b._h=html;b.innerHTML=html}return b}
function drop(id){var b=bubs[id];if(!b)return;delete bubs[id];b.classList.add('out');setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},260)}
function layout(){var n=doc.getElementById('nxd');if(!n||!sat)return;var shown=n.getAttribute('data-show')==='1',r=n.getBoundingClientRect(),x;
 var order=['tm','bt'],list=order.filter(function(k){return bubs[k]&&!bubs[k].classList.contains('out')}),w=list.map(function(k){return bubs[k].offsetWidth||34});
 var total=0;w.forEach(function(a){total+=a+6});
 x=shown?r.right+8:Math.round(innerWidth/2-(total-6)/2);
 list.forEach(function(k,i){bubs[k].style.left=Math.round(x)+'px';x+=w[i]+6})}
function tick(){if(!SAT)return;var S=NI.ST,n=doc.getElementById('nxd'),v=n?n.getAttribute('data-v'):'',shown=n&&n.getAttribute('data-show')==='1',now=Date.now();
 var t=S.timers&&S.timers[0],musicOn=!!S.media&&shown&&(v==='live'||v==='music'||v==='quick'||v==='idle');
 if(t&&NI.C('timer')==='1'&&NI.C('mode')!=='off'&&musicOn&&v!=='timer'&&v!=='alarm'){var rem=Math.max(0,t.end-now),off=(163.4*(1-Math.min(1,rem/t.total))).toFixed(1);
  bubble('tm','nt','<span class="rg"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" class="bg"/><circle cx="30" cy="30" r="26" class="fg" style="stroke-dashoffset:'+off+'"/></svg></span><span class="nt-t">'+fmtT(rem)+'</span>',function(){NI.pin('timer',8000)})}
 else drop('tm');
 layout()}
SAT={batt:function(t){if(!NI||!NI.ST)return false;var b=t.b;if(!b)return false;
  bubble('bt','nb',bat(b,t.low)+'<span>'+Math.round(b.level*100)+'%</span>',function(){drop('bt');clearTimeout(batT);var c={};for(var k in t)c[k]=t[k];c.raw=1;NI.trans(c)});
  clearTimeout(batT);batT=setTimeout(function(){drop('bt');layout()},Math.max(2500,t.ms||4000));layout();return true}};
if(NI&&NI.ST&&NI.trans&&NI.pin&&NI.C){sat=doc.createElement('div');sat.id='nxdSat';doc.body.appendChild(sat);window.NXSAT=SAT;setInterval(tick,400);addEventListener('resize',layout)}
/* ---------- 4. Settings: dedicated Nex Island + Notifications pages, no duplicates elsewhere ---------- */
var PILL='<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.4" fill="url(#nxi-slate)"/><path d="M0 6.4A6.4 6.4 0 016.4 0h11.2A6.4 6.4 0 0124 6.4V12H0z" fill="url(#nxi-shine)"/><rect x="4.2" y="9.2" width="15.6" height="5.6" rx="2.8" fill="#05070d"/><circle cx="16.4" cy="12" r="1.2" fill="#6EE79C"/></svg>';
function navIcon(){var b=$('#snv [data-v=island]');if(b&&!b.querySelector('.nxp-i')){b.dataset.nxi='1';var s=doc.createElement('span');s.className='nxp-i';s.innerHTML=PILL;b.insertBefore(s,b.firstChild)}}
function pageOf(){var p=doc.getElementById('spg');if(!p)return'';var h=p.querySelector('h3');return h?h.textContent.trim().toLowerCase():''}
function cleanup(){var p=doc.getElementById('spg');if(!p)return;var t=pageOf(),isl=/^(nex ?island|island)/.test(t),nt=/^notif/.test(t);
 /* hide (do not remove) the stray boxes: removing would make the island / notify mods insert them again */
 if(!isl)p.querySelectorAll('.nxd-set').forEach(function(x){if(!x.hidden)x.hidden=true});
 if(!nt)p.querySelectorAll('.nxs').forEach(function(x){if(!x.hidden&&x.querySelector('[data-nxn]'))x.hidden=true});
 if(nt&&!p.querySelector('.nxp-pos')){var b=doc.createElement('div');b.className='nxp-pos';b.innerHTML='<h4>Popup position</h4><div class="seg"><button data-nxp="left" class="'+(g('aur.nxpos','right')==='left'?'sel':'')+'">Left</button><button data-nxp="right" class="'+(g('aur.nxpos','right')==='left'?'':'sel')+'">Right</button></div><p class="bnote">Notifications appear at the edge of the screen. To show them on Nex Island instead, turn on "Notifications on island" in the Nex Island page.</p>';var box=p.querySelector('.nxs');if(box)box.appendChild(b);else p.appendChild(b)}
 navIcon()}
var raf=0;new MutationObserver(function(){if(!raf){raf=1;Promise.resolve().then(function(){raf=0;cleanup()})}}).observe(doc.body,{childList:true,subtree:true});
doc.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-nxp]');if(!b)return;e.stopPropagation();e.preventDefault();put('aur.nxpos',b.dataset.nxp);applyPos();b.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===b)})},true);
cleanup();
})();

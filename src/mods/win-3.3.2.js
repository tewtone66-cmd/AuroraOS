/* WIN-3.3.2 - window/taskbar animations, cursor, double-click, calendar, brightness, network (needs src/patches/win-3.3.2.mjs) */
(function(){'use strict';
var B=document.body;function $1(s){return document.querySelector(s)}
function calm(){return B.classList.contains('perf')||B.classList.contains('rm')}
/* ---------- css ---------- */
var st=document.createElement('style');st.textContent=
/* cursor: always visible and correct while moving / resizing a window */
'body.vm #cur{visibility:visible!important;opacity:1!important}'+
'body.cur-move,body.cur-move *{cursor:move!important}body.cur-ew,body.cur-ew *{cursor:ew-resize!important}body.cur-ns,body.cur-ns *{cursor:ns-resize!important}body.cur-nwse,body.cur-nwse *{cursor:nwse-resize!important}'+
/* windows fly from / to their taskbar icon */
'.win.opening{animation:w3in .42s cubic-bezier(.16,1,.3,1) backwards!important}'+
'.win.minning{animation:w3out .3s cubic-bezier(.5,0,.75,.3) forwards!important}'+
'.win.closing{animation:w3cls .28s cubic-bezier(.5,0,.75,.3) forwards!important}'+
'@keyframes w3in{0%{opacity:0;transform:translate(var(--dx,0px),var(--dy,40px)) scale(.18)}45%{opacity:1}100%{opacity:1;transform:none}}'+
'@keyframes w3out{to{opacity:0;transform:translate(var(--dx,0px),var(--dy,40px)) scale(.14)}}'+
'@keyframes w3cls{0%{opacity:1;transform:none}to{opacity:0;transform:translate(var(--dx,0px),calc(var(--dy,40px)*.35)) scale(.82)}}'+
/* music widget: animated open and close */
'#mnpc{display:block!important;visibility:hidden;opacity:0;transform:translateY(14px) scale(.94);pointer-events:none;transition:opacity .2s ease,transform .24s cubic-bezier(.4,0,.2,1),visibility 0s .24s}'+
'#mnpc.on{visibility:visible;opacity:1;transform:none;pointer-events:auto;animation:none;transition:opacity .22s ease,transform .32s cubic-bezier(.2,.9,.3,1.15),visibility 0s}'+
'#mnp{display:flex!important;overflow:hidden;max-width:0;opacity:0;padding:0;margin:0 -5px;transform:scale(.6);pointer-events:none;transition:max-width .32s cubic-bezier(.4,0,.2,1),opacity .2s ease,transform .3s cubic-bezier(.4,0,.2,1),padding .3s,margin .3s}'+
'#mnp.on{max-width:200px;opacity:1;padding:0 6px 0 5px;margin:0;transform:none;pointer-events:auto;animation:none}'+
/* flyouts */
'#calf{color:#fff}#trf .qbr{color:var(--txt,inherit)}'+
'#calf{position:fixed;z-index:9400;width:min(340px,calc(100vw - 16px));padding:16px;border-radius:22px;background:linear-gradient(160deg,#1b2036f2,#0b0d12f2);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid #ffffff22;box-shadow:0 20px 60px #000a;visibility:hidden;opacity:0;transform:translateY(14px) scale(.96);pointer-events:none;transition:opacity .18s ease,transform .26s cubic-bezier(.2,.9,.3,1.1),visibility 0s .26s}'+
'#calf.show{visibility:visible;opacity:1;transform:none;pointer-events:auto;transition:opacity .2s ease,transform .3s cubic-bezier(.2,.9,.3,1.1),visibility 0s}'+
'#calf .cft{display:flex;flex-direction:column;gap:2px;padding:2px 4px 12px;border-bottom:1px solid #ffffff1f}#calf .cft b{font-size:34px;font-weight:300;letter-spacing:.5px}#calf .cft span{font-size:13px;opacity:.8}'+
'#calf .cfh{display:flex;align-items:center;justify-content:space-between;margin:12px 0 6px}#calf .cfh b{font-size:14px;font-weight:600}#calf .cfh button{width:34px;height:34px;border:0;border-radius:50%;background:none;color:#fff;font-size:20px;cursor:pointer}#calf .cfh button:hover{background:#ffffff1f}'+
'#calf .cfg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}#calf .cfg i{font-style:normal;font-size:11px;opacity:.6;padding:6px 0}#calf .cfg button{height:38px;border:0;border-radius:50%;background:none;color:#fff;font-size:13px;cursor:pointer}#calf .cfg button:hover{background:#ffffff1f}#calf .cfg button.o{opacity:.4}#calf .cfg button.t{background:var(--acc,#4f7cff);font-weight:700;opacity:1}'+
'#calf .cfl{display:block;width:100%;margin-top:8px;height:36px;border:0;border-radius:12px;background:#ffffff14;color:#fff;font-size:13px;cursor:pointer}#calf .cfl:hover{background:#ffffff24}'+
'#trf .qbr{display:flex;align-items:center;gap:10px;margin:10px 2px 4px;padding:10px 12px;border-radius:14px;background:var(--hov,#ffffff12)}#trf .qbr svg{flex:none;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}'+
'#trf .bsl{position:relative;flex:1;height:26px;cursor:pointer;touch-action:none}#trf .bsl:before{content:"";position:absolute;left:0;right:0;top:10px;height:6px;border-radius:3px;background:#ffffff30}#trf .bsl i{position:absolute;left:0;top:10px;height:6px;border-radius:3px;background:var(--acc,#fff)}#trf .bsl u{position:absolute;top:4px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#fff;box-shadow:0 2px 6px #0008}#trf .qbr small{width:34px;text-align:right;font-size:12px;opacity:.85}'+
'#tray .tri.netpop svg{animation:netpop .4s cubic-bezier(.2,.9,.3,1.3)}@keyframes netpop{from{transform:scale(.5);opacity:.2}}'+
'body.perf #calf,body.perf #mnpc,body.perf #mnp,body.rm #calf,body.rm #mnpc,body.rm #mnp{transition-duration:.01s!important}';
document.head.appendChild(st);
/* ---------- 1. cursor while moving / resizing windows ---------- */
var CK=['cur-move','cur-ew','cur-ns','cur-nwse'];
function clrCur(){CK.forEach(function(c){B.classList.remove(c)})}
addEventListener('pointerdown',function(e){var t=e.target;clrCur();if(!t||!t.closest)return;var rz=t.closest('.win:not(.max) .rz,.win:not(.max) .rzr,.win:not(.max) .rzb');
 if(rz){B.classList.add(rz.classList.contains('rz')?'cur-nwse':rz.classList.contains('rzr')?'cur-ew':'cur-ns');return}
 if(t.closest('.win:not(.max) .tbar')&&!t.closest('button'))B.classList.add('cur-move')},true);
addEventListener('pointerup',clrCur,true);addEventListener('pointercancel',clrCur,true);
/* ---------- 2. windows fly to / from the taskbar icon ---------- */
function aim(w){try{if(!w||!w.el||calm())return;var b=document.querySelector('#tasks .dk[data-id="'+w.app+'"]')||document.getElementById('startBtn');if(!b)return;
 var r=b.getBoundingClientRect(),e=w.el,op=e.offsetParent,o=op?op.getBoundingClientRect():{left:0,top:0};
 e.style.setProperty('--dx',(r.left+r.width/2-(o.left+e.offsetLeft+e.offsetWidth/2))+'px');e.style.setProperty('--dy',(r.top+r.height/2-(o.top+e.offsetTop+e.offsetHeight/2))+'px')}catch(x){}}
var _oa=openApp;openApp=function(){var w=_oa.apply(this,arguments);if(w&&w.el&&w.el.classList.contains('opening'))aim(w);return w};
var _sw=showW;showW=function(w){var was=w&&w.el&&w.el.classList.contains('min'),r=_sw.apply(this,arguments);if(was)aim(w);return r};
var _mw=minW;minW=function(w){aim(w);return _mw.apply(this,arguments)};
var _cw=closeW;closeW=function(key){var w=W[key];if(w)aim(w);return _cw.apply(this,arguments)};
/* ---------- 3. taskbar items slide, pop in and shrink out ---------- */
var _du=dockUpdate;dockUpdate=function(){var box=document.getElementById('tasks'),before={};
 if(box&&!calm())box.querySelectorAll('.dk').forEach(function(b){before[b.dataset.id]={r:b.getBoundingClientRect(),el:b}});
 var res=_du.apply(this,arguments);
 if(box&&!calm()){var seen={};box.querySelectorAll('.dk').forEach(function(b){var id=b.dataset.id,o=before[id];seen[id]=1;
   if(!b.animate)return;
   if(!o){b.animate([{opacity:0,transform:'translateY(12px) scale(.4)'},{opacity:1,transform:'none'}],{duration:340,easing:'cubic-bezier(.2,.9,.3,1.3)'})}
   else{var d=o.r.left-b.getBoundingClientRect().left;if(Math.abs(d)>1)b.animate([{transform:'translateX('+d+'px)'},{transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'})}});
  Object.keys(before).forEach(function(id){if(seen[id]||!before[id].el.animate)return;var o=before[id],g=o.el.cloneNode(true);
   g.style.cssText='position:fixed;left:'+o.r.left+'px;top:'+o.r.top+'px;width:'+o.r.width+'px;height:'+o.r.height+'px;margin:0;pointer-events:none;z-index:9400';B.appendChild(g);
   var a=g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(10px) scale(.3)'}],{duration:240,easing:'ease-in'});a.onfinish=function(){g.remove()}})}
 return res};
/* ---------- 4. double-click opens desktop icons for mouse / virtual mouse (touch keeps single tap) ---------- */
var _tap=tapEl;tapEl=function(el,fn){if(!(el&&el.classList&&el.classList.contains('di')))return _tap(el,fn);var last=0,pt='touch';
 el.addEventListener('pointerdown',function(e){pt=e.pointerType||'touch'},true);
 return _tap(el,function(){if(pt!=='mouse'){fn();return}var n=Date.now();document.querySelectorAll('#icons .di.sel').forEach(function(x){x.classList.remove('sel')});el.classList.add('sel');if(n-last<450){last=0;fn()}else last=n})};
try{buildIcons(true)}catch(e){}
/* ---------- 5. date / calendar flyout ---------- */
var cal=document.createElement('div');cal.id='calf';B.appendChild(cal);var view=new Date(),tm=0;
var WK=(function(){try{var w=new Intl.Locale(navigator.language).weekInfo;return w?(w.firstDay%7):0}catch(e){return 0}})();
function drawCal(){var now=new Date(),y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1),off=(first.getDay()-WK+7)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate(),h='';
 for(var i=0;i<7;i++){h+='<i>'+new Date(2023,0,1+((i+WK)%7)).toLocaleDateString([],{weekday:'short'}).slice(0,2)+'</i>'}
 for(var c=0;c<42;c++){var d=c-off+1,o=false,mm=m,yy=y;if(d<1){d=prev+d;o=true;mm=m-1}else if(d>days){d=d-days;o=true;mm=m+1}
  var t=!o&&d===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();h+='<button class="'+(o?'o':'')+(t?' t':'')+'" tabindex="-1">'+d+'</button>'}
 cal.innerHTML='<div class="cft"><b>'+now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</b><span>'+now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})+'</span></div>'+
  '<div class="cfh"><button data-c="prev" aria-label="Previous month">&#8249;</button><b>'+first.toLocaleDateString([],{month:'long',year:'numeric'})+'</b><button data-c="next" aria-label="Next month">&#8250;</button></div><div class="cfg">'+h+'</div><button class="cfl" data-c="today">Today</button>'}
function posCal(){var dk=$1('#dock'),ck=$1('#clock');if(!dk||!ck)return;var d=dk.getBoundingClientRect(),c=ck.getBoundingClientRect(),w=Math.min(340,innerWidth-16);cal.style.bottom=Math.max(8,innerHeight-d.top+10)+'px';cal.style.left=Math.max(8,Math.min(innerWidth-w-8,c.right-w+10))+'px'}
function openCal(){closeMenus();view=new Date();drawCal();posCal();cal.classList.add('show');menuOpen=true;sync();clearInterval(tm);tm=setInterval(function(){if(cal.classList.contains('show')){var b=cal.querySelector('.cft b');if(b)b.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}else clearInterval(tm)},1000)}
var ck0=$1('#clock');if(ck0){ck0.style.cursor='pointer';ck0.addEventListener('click',function(e){e.stopPropagation();var was=cal.classList.contains('show');closeMenus();if(!was)openCal()})}
cal.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('[data-c]');if(!b)return;var k=b.dataset.c;if(k==='prev')view=new Date(view.getFullYear(),view.getMonth()-1,1);else if(k==='next')view=new Date(view.getFullYear(),view.getMonth()+1,1);else view=new Date();drawCal()});
var _cm=closeMenus;closeMenus=function(){var was=cal.classList.contains('show');cal.classList.remove('show');if(was)menuOpen=false;return _cm.apply(this,arguments)};
/* ---------- 6. screen brightness slider in the battery / system panel ---------- */
var SUN='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
function setBright(v){v=Math.max(20,Math.min(100,Math.round(v)));S.dm=100-v;ls('aur.dm',String(S.dm));var d=document.getElementById('dmx');if(d){d.style.display=S.dm?'block':'none';d.style.setProperty('--dma',(S.dm/100).toFixed(2))}return v}
function addBright(trf){if(trf.querySelector('.qbr'))return;var cur=Math.max(20,100-(+S.dm||0)),box=document.createElement('div');box.className='qbr';box.innerHTML=SUN+'<div class="bsl"><i></i><u></u></div><small></small>';
 var sl=box.querySelector('.bsl'),fi=sl.querySelector('i'),th=sl.querySelector('u'),lb=box.querySelector('small');
 function paint(v){var p=(v-20)/80*100;fi.style.width=p+'%';th.style.left=p+'%';lb.textContent=v+'%'}paint(cur);
 function at(e){var r=sl.getBoundingClientRect();paint(setBright(20+Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*80))}
 sl.addEventListener('pointerdown',function(e){e.stopPropagation();e.preventDefault();at(e);var id=e.pointerId;function mv(x){if(x.pointerId===id)at(x)}function up(x){if(x.pointerId!==id)return;removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up)}addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)});
 var link=trf.querySelector('.qlink');if(link)trf.insertBefore(box,link);else trf.appendChild(box)}
var trf=document.getElementById('trf');if(trf)new MutationObserver(function(){addBright(trf)}).observe(trf,{childList:true});
/* ---------- 7. network icon: signal bars, details, smooth change ---------- */
function bars(){var c=navigator.connection;if(navigator.onLine===false)return 0;if(!c)return 4;var t=c.effectiveType,d=c.downlink||0;if(t==='slow-2g'||t==='2g'||d>0&&d<.4)return 1;if(t==='3g'||d>0&&d<1.5)return 2;if(t==='4g'&&d>0&&d<5)return 3;return 4}
function netSVG(n,cell){if(cell)return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 20v-3" opacity="'+(n>=1?1:.3)+'"/><path d="M9 20v-7" opacity="'+(n>=2?1:.3)+'"/><path d="M14 20v-11" opacity="'+(n>=3?1:.3)+'"/><path d="M19 20V4" opacity="'+(n>=4?1:.3)+'"/></svg>';
 return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a15 15 0 0 1 20 0" opacity="'+(n>=4?1:.3)+'"/><path d="M5.5 12.5a10 10 0 0 1 13 0" opacity="'+(n>=3?1:.3)+'"/><path d="M9 16a5 5 0 0 1 6 0" opacity="'+(n>=2?1:.3)+'"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>'}
var tray=document.getElementById('tray'),busy=false;
function fixNet(){if(busy||!tray)return;var b=tray.querySelector('#trNet');if(!b||navigator.onLine===false){if(b){b.title='Offline: no connection';b.classList.add('netpop')}return}
 var c=navigator.connection,n=bars(),cell=c&&c.type==='cellular';busy=true;b.innerHTML=netSVG(n,cell);b.title=(cell?'Mobile data':'Wi-Fi / network')+(c&&c.effectiveType?' · '+c.effectiveType.toUpperCase():'')+(c&&c.downlink?' · '+c.downlink+' Mbps':'')+(c&&c.rtt?' · '+c.rtt+' ms':'');b.classList.add('netpop');busy=false}
if(tray)new MutationObserver(function(){if(!busy)fixNet()}).observe(tray,{childList:true});
fixNet();
})();

/* CC-5.1.0 - Control Center rebuilt (replaces the old quick-settings flyout #trf).
   Network: Wi-Fi / Bluetooth / Mobile data / Airplane / Hotspot / Display tiles show live state and open the real Android connect screens (AuroraSys.panel),
   paired Bluetooth devices, sliders (volume, brightness, night light), quick toggles (theme, performance, reduce motion, auto saver, record, tasks, lock, settings),
   media card (Music player) and battery card. Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document,B=doc.body;
if(typeof closeMenus!=='function'||typeof S==='undefined')return;
function $(s,r){return(r||doc).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(t){try{toast(t)}catch(e){}}
function lsw(k,v){try{ls(k,v)}catch(e){}}
var SYS=null;try{if(window.Capacitor&&window.Capacitor.registerPlugin)SYS=window.Capacitor.registerPlugin('AuroraSys')}catch(e){}
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var I={
 wifi:sv('<path d="M2.5 9a14 14 0 0119 0M5.8 12.5a9.3 9.3 0 0112.4 0M9.1 16a4.6 4.6 0 015.8 0"/><circle cx="12" cy="19.2" r=".9" fill="currentColor"/>'),
 bt:sv('<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>'),
 data:sv('<path d="M5 19v-4M10 19v-8M15 19V7M20 19V3" stroke-width="2.4"/>'),
 air:sv('<path d="M21 15.5v-1.7l-7.5-4.7V4.5a1.5 1.5 0 00-3 0v4.6L3 13.8v1.7l7.5-2.2v4.3L8.5 19v1.5l3.5-1 3.5 1V19l-2-1.4v-4.3z"/>'),
 hot:sv('<path d="M5 12.5a7 7 0 0114 0M8.2 12.5a3.8 3.8 0 017.6 0"/><circle cx="12" cy="12.5" r="1" fill="currentColor"/><path d="M12 14v6"/>'),
 disp:sv('<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/>'),
 vol:sv('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>'),
 sun:sv('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
 moon:sv('<path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a8 8 0 1010 10z"/>'),
 gear:sv('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>'),
 lock:sv('<rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/>'),
 power:sv('<path d="M12 3.5v8M7 6.5a7.5 7.5 0 1010 0"/>'),
 theme:sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 000-17z" fill="currentColor"/>'),
 perf:sv('<path d="M13 2.8L5.5 13.2h5.5L10 21.2l8-10.8h-5.6z"/>'),
 motion:sv('<path d="M4 12h5M4 7.5h8M4 16.5h8"/><circle cx="17" cy="12" r="3.5"/>'),
 saver:sv('<rect x="3" y="7.5" width="16" height="9" rx="2.2"/><path d="M21 10.5v3M7 12h4"/>'),
 rec:sv('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>'),
 tasks:sv('<path d="M4 6.5h16M4 12h16M4 17.5h9"/><path d="M17 16l2 2 3-3.5" />'),
 prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.5h2.2v13H6zM19 5.8v12.4L9.6 12z"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.8 5.5H18v13h-2.2zM5 5.8v12.4L14.4 12z"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6l11-6.8z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.4z"/></svg>',
 note:sv('<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.8" cy="17.5" r="2.4"/><circle cx="16.8" cy="15.5" r="2.4"/>')};
/* ---------- css ---------- */
var st=doc.createElement('style');st.id='nx-cc-css';st.textContent=[
'#trf{display:none!important}',
'#ncc{position:fixed;z-index:9400;width:min(392px,calc(100vw - 16px));overflow:auto;scrollbar-width:none;padding:14px;border-radius:28px;background:var(--surf,#141824);background:color-mix(in srgb,var(--surf,#141824) 90%,transparent);-webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%);border:1px solid var(--line,rgba(255,255,255,.14));box-shadow:0 26px 70px rgba(0,0,0,.5);color:var(--txt,#eef1f6);font:13px/1.3 system-ui,sans-serif;visibility:hidden;opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;transition:opacity .18s ease,transform .28s cubic-bezier(.2,.9,.3,1.1),visibility 0s .28s;-webkit-user-select:none;user-select:none}',
'#ncc::-webkit-scrollbar{display:none}#ncc.show{visibility:visible;opacity:1;transform:none;pointer-events:auto;transition:opacity .2s ease,transform .3s cubic-bezier(.2,.9,.3,1.1),visibility 0s}#ncc *{box-sizing:border-box}#ncc button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}',
'#ncc svg{width:20px;height:20px;display:block}',
'#ncc .cch{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 4px 12px}#ncc .cch b{display:block;font-size:17px;font-weight:700;letter-spacing:-.2px}#ncc .cch span{display:block;margin-top:2px;font-size:12px;color:var(--mut,#9aa3b2)}',
'#ncc .cbp{display:flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;background:var(--surf2,rgba(255,255,255,.08));border:1px solid var(--line,rgba(255,255,255,.12));font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}#ncc .cbp svg{width:18px;height:18px}#ncc .cbp.lo{color:#ff5d73}#ncc .cbp.ch{color:#35d07f}',
'#ncc .cct{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
'#ncc .cct button{display:flex;flex-direction:column;align-items:flex-start;gap:9px;min-width:0;padding:12px;border:1px solid var(--line,rgba(255,255,255,.1));border-radius:20px;background:var(--surf2,rgba(255,255,255,.07));text-align:left;cursor:pointer;transition:background-color .2s,transform .12s,color .2s}',
'#ncc .cct button:active,#ncc .cck button:active{transform:scale(.95)}#ncc .cct button.on{background:var(--acc,#4f7cff);color:var(--accT,#fff);border-color:transparent;box-shadow:0 8px 20px rgba(0,0,0,.25)}',
'#ncc .ci{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex:none;background:rgba(128,134,150,.22)}#ncc .on .ci{background:rgba(255,255,255,.24)}',
'#ncc .cct b,#ncc .cck b{display:block;font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}#ncc .cct small,#ncc .cck small{display:block;margin-top:1px;font-size:11px;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
'#ncc .ccd{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}#ncc .ccd:empty{display:none}#ncc .ccd button{display:flex;align-items:center;gap:7px;padding:7px 12px;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:999px;background:var(--surf2,rgba(255,255,255,.07));cursor:pointer;max-width:100%}#ncc .ccd svg{width:15px;height:15px;color:var(--acc,#4f7cff);flex:none}#ncc .ccd span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#ncc .ccsl{margin-top:10px;display:flex;flex-direction:column;gap:8px}#ncc .ccs{display:flex;align-items:center;gap:12px;height:48px;padding:0 14px;border-radius:18px;background:var(--surf2,rgba(255,255,255,.07));border:1px solid var(--line,rgba(255,255,255,.1))}',
'#ncc .ccs .ic{flex:none;opacity:.85}#ncc .ccs .ic svg{width:19px;height:19px}#ncc .ccs em{flex:none;min-width:40px;text-align:right;font-style:normal;font-size:12px;font-weight:650;font-variant-numeric:tabular-nums;opacity:.85}',
'#ncc .sl{position:relative;flex:1;height:30px;cursor:pointer;touch-action:none}#ncc .sl:before{content:"";position:absolute;left:0;right:0;top:12px;height:6px;border-radius:3px;background:rgba(128,134,150,.35)}#ncc .sl i{position:absolute;left:0;top:12px;height:6px;border-radius:3px;background:var(--acc,#4f7cff)}#ncc .sl u{position:absolute;top:5px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.45);transition:transform .15s}#ncc .sl.on u{transform:scale(1.2)}',
'#ncc .cck{margin-top:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}#ncc .cck button{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:11px 4px 9px;border:1px solid var(--line,rgba(255,255,255,.1));border-radius:18px;background:var(--surf2,rgba(255,255,255,.07));cursor:pointer;text-align:center;transition:background-color .2s,transform .12s}',
'#ncc .cck button.on{background:var(--acc,#4f7cff);color:var(--accT,#fff);border-color:transparent}#ncc .cck button.on .ci{background:rgba(255,255,255,.24)}',
'#ncc .ccm{margin-top:10px;display:flex;align-items:center;gap:12px;padding:12px;border-radius:20px;background:var(--surf2,rgba(255,255,255,.07));border:1px solid var(--line,rgba(255,255,255,.1));position:relative;overflow:hidden}#ncc .ccm:empty{display:none}',
'#ncc .ccm .ar{width:48px;height:48px;border-radius:13px;flex:none;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#ff7ab8,#8b5cf6) center/cover no-repeat}#ncc .ccm .tx{flex:1;min-width:0}#ncc .ccm .tx b{display:block;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ncc .ccm .tx span{display:block;color:var(--mut,#9aa3b2);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#ncc .ccm .mc{display:flex;gap:2px}#ncc .ccm .mc button{width:38px;height:38px;border:0;border-radius:50%;background:none;display:grid;place-items:center;cursor:pointer}#ncc .ccm .mc button:hover{background:var(--hov,rgba(255,255,255,.1))}#ncc .ccm .mc button:active{transform:scale(.88)}#ncc .ccm .mc .pp{background:var(--acc,#4f7cff);color:var(--accT,#fff)}#ncc .ccm .pg{position:absolute;left:0;bottom:0;height:3px;background:var(--acc,#4f7cff)}',
'#ncc .ccb{margin-top:10px;padding:12px 14px;border-radius:20px;background:var(--surf2,rgba(255,255,255,.07));border:1px solid var(--line,rgba(255,255,255,.1))}#ncc .ccb:empty{display:none}#ncc .ccb .r{display:flex;align-items:baseline;justify-content:space-between;gap:10px}#ncc .ccb .r b{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}#ncc .ccb .r b small{font-size:13px;opacity:.7;margin-left:1px}#ncc .ccb .r span{font-size:12px;color:var(--mut,#9aa3b2);text-align:right}',
'#ncc .ccb .bar{height:8px;margin-top:9px;border-radius:5px;background:rgba(128,134,150,.3);overflow:hidden}#ncc .ccb .bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#2fd27a,#7ef0b0);transition:width .6s}#ncc .ccb.lo .bar i{background:linear-gradient(90deg,#ff5a5a,#ff8a6a)}',
'body.perf #ncc,body.rm #ncc{transition-duration:.01s!important}',
'@media (max-width:420px){#ncc .cct{grid-template-columns:repeat(2,1fr)}}'
].join('\n');
doc.head.appendChild(st);
/* ---------- state ---------- */
var ST={have:false,wifiOn:null,ssid:'',transport:'',btOn:false,btDevices:[],btNeedsPermission:false,btSupported:true,air:false,down:0,vol:null,bat:null};
function pull(){
 var p=SYS&&SYS.status?SYS.status().then(function(r){Object.assign(ST,r);ST.have=true}).catch(function(){}):Promise.resolve();
 var b=navigator.getBattery?navigator.getBattery().then(function(x){ST.bat={l:x.level,c:x.charging,t:x.charging?x.chargingTime:x.dischargingTime}}).catch(function(){}):Promise.resolve();
 var v=SYS&&SYS.volume?SYS.volume({}).then(function(r){ST.vol=r.v}).catch(function(){}):Promise.resolve();
 return Promise.all([p,b,v])}
function tmId(){try{return window.NXTMID||Object.keys(A).filter(function(k){return /task manager/i.test((A[k]&&A[k].n)||'')})[0]||'nxtm'}catch(e){return'nxtm'}}
/* ---------- sections ---------- */
function secNet(){var c=navigator.connection||{},have=ST.have,online=navigator.onLine!==false,wifiOn=have?!!ST.wifiOn:(online&&c.type!=='cellular'),cell=ST.transport==='cellular'||(!have&&c.type==='cellular');
 var T=[
  ['wifi',I.wifi,'Wi-Fi',wifiOn,have?(ST.transport==='wifi'&&ST.ssid?ST.ssid:(ST.wifiOn?'Not connected':'Off')):(wifiOn?'Connected':'Off')],
  ['bluetooth',I.bt,'Bluetooth',!!ST.btOn,ST.btSupported===false?'Not supported':ST.btNeedsPermission?'Tap to allow':(ST.btOn?(ST.btDevices.length?ST.btDevices.length+' paired':'On'):'Off')],
  ['data',I.data,'Mobile data',cell,cell?(ST.down?Math.round(ST.down/1000)+' Mbps':'Connected'):'Manage'],
  ['airplane',I.air,'Airplane',!!ST.air,ST.air?'On':'Off'],
  ['hotspot',I.hot,'Hotspot',false,'Set up'],
  ['display',I.disp,'Display',false,'Settings']];
 return T.map(function(t){return'<button data-p="'+t[0]+'" class="'+(t[3]?'on':'')+'"><span class="ci">'+t[1]+'</span><span style="min-width:0;max-width:100%"><b>'+t[2]+'</b><small>'+esc(t[4])+'</small></span></button>'}).join('')}
function secBt(){if(!ST.btOn||!ST.btDevices.length)return'';return ST.btDevices.slice(0,6).map(function(d){return'<button data-p="bluetooth">'+I.bt+'<span>'+esc(d.name||d.addr||'Device')+'</span></button>'}).join('')}
function brightNow(){return Math.max(20,100-(+S.dm||0))}
function secSl(){var v=ST.vol==null?(window.NXMZ&&NXMZ.au?Math.round(NXMZ.au.volume*100):70):ST.vol,b=brightNow(),n=+S.nl||0;
 function row(id,ic,min,max,val,txt){var p=(val-min)/(max-min)*100;return'<div class="ccs" data-s="'+id+'"><span class="ic">'+ic+'</span><div class="sl" data-min="'+min+'" data-max="'+max+'"><i style="width:'+p+'%"></i><u style="left:'+p+'%"></u></div><em>'+txt+'</em></div>'}
 return row('vol',I.vol,0,100,v,v+'%')+row('bri',I.sun,20,100,b,b+'%')+row('nl',I.moon,0,80,n,n?n+'%':'Off')}
function secCk(){var th=String(S.theme||'auto'),on=function(x){return x?' class="on"':''};
 var C=[['theme',I.theme,'Theme',th.charAt(0).toUpperCase()+th.slice(1),th==='dark'],['perf',I.perf,'Performance',S.perf?'On':'Off',!!S.perf],['motion',I.motion,'Less motion',S.rm?'On':'Off',!!S.rm],['saver',I.saver,'Auto saver',S.ap?'On':'Off',!!S.ap],
  ['rec',I.rec,'Record','Screen',false],['tasks',I.tasks,'Tasks',(function(){try{return Object.keys(W).length+' open'}catch(e){return''}})(),false],['lock',I.lock,'Lock','Now',false],['set',I.gear,'Settings','All',false]];
 return C.map(function(c){return'<button data-c="'+c[0]+'"'+on(c[4])+'><span class="ci">'+c[1]+'</span><span style="min-width:0;max-width:100%"><b>'+c[2]+'</b><small>'+esc(c[3])+'</small></span></button>'}).join('')}
function secMd(){var M=window.NXMZ;if(!M||!M.q||!M.q.cur)return'';var s=M.q.cur,pl=!M.au.paused,pc=M.au.duration?M.au.currentTime/M.au.duration*100:0,art=M.q.art;
 return'<div class="ar"'+(art?' style="background-image:url(\''+art+'\')"':'')+'>'+(art?'':I.note)+'</div><div class="tx"><b>'+esc(s.t)+'</b><span>'+esc(s.a)+'</span></div><div class="mc"><button data-m="prev" aria-label="Previous">'+I.prev+'</button><button data-m="pp" class="pp" aria-label="Play or pause">'+(pl?I.pause:I.play)+'</button><button data-m="next" aria-label="Next">'+I.next+'</button></div><div class="pg" style="width:'+pc.toFixed(1)+'%"></div>'}
function secBat(){var b=ST.bat;if(!b)return'';var l=Math.round(b.l*100),tm=b.t,s=b.c?(l>=100?'Fully charged':'Charging'):'On battery',ts='';
 if(isFinite(tm)&&tm>0){var h=Math.floor(tm/3600),m=Math.round(tm%3600/60);ts=(h?h+' h ':'')+m+' min '+(b.c?'until full':'left')}
 return'<div class="r"><b>'+l+'<small>%</small></b><span>'+s+(ts?'<br>'+ts:'')+'</span></div><div class="bar"><i style="width:'+Math.max(2,l)+'%"></i></div>'}
function secHd(){var d=new Date(),b=ST.bat,l=b?Math.round(b.l*100):null,cls=b?(b.c?' ch':(l<20?' lo':'')):'';
 return'<div><b>Control Center</b><span>'+d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})+' \u00b7 '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</span></div>'+(b?'<div class="cbp'+cls+'">'+I.saver+'<span>'+l+'%</span></div>':'')}
/* ---------- panel ---------- */
var cc=doc.createElement('div');cc.id='ncc';
cc.innerHTML='<div class="cch" data-sec="hd"></div><div class="cct" data-sec="net"></div><div class="ccd" data-sec="bt"></div><div class="ccsl" data-sec="sl"></div><div class="cck" data-sec="ck"></div><div class="ccm" data-sec="md"></div><div class="ccb" data-sec="bat"></div>';
B.appendChild(cc);
var SEC={hd:secHd,net:secNet,bt:secBt,sl:secSl,ck:secCk,md:secMd,bat:secBat},open=false,tmr=0,closedAt=0,openedAt=0,drag=null;
function paint(){if(!open)return;Object.keys(SEC).forEach(function(k){if(k==='sl'&&drag)return;var el=$('[data-sec='+k+']',cc),h=SEC[k]();if(el&&el._h!==h){el._h=h;el.innerHTML=h;if(k==='bat'){el.classList.toggle('lo',!!(ST.bat&&!ST.bat.c&&ST.bat.l<.2))}}})}
function place(){var dk=$('#dock'),tr=$('#tray'),d=dk?dk.getBoundingClientRect():{top:innerHeight-56},t=tr?tr.getBoundingClientRect():{right:innerWidth},w=Math.min(392,innerWidth-16);
 cc.style.bottom=Math.max(8,innerHeight-d.top+10)+'px';cc.style.left=Math.max(8,Math.min(innerWidth-w-8,t.right-w+8))+'px';cc.style.maxHeight=Math.max(240,d.top-22)+'px'}
function mzTick(){if(open)paint()}
function openCC(){if(open){closeCC();return}if(Date.now()-closedAt<250)return;closeMenus();place();open=true;openedAt=Date.now();
 Object.keys(SEC).forEach(function(k){var e=$('[data-sec='+k+']',cc);if(e)e._h=null});paint();pull().then(paint);cc.classList.add('show');
 try{menuOpen=true;sync()}catch(e){}tmr=setInterval(function(){pull().then(paint)},2500);try{if(window.NXMZ)NXMZ.on(mzTick)}catch(e){}}
function closeCC(){if(!open)return;open=false;closedAt=Date.now();cc.classList.remove('show');clearInterval(tmr);drag=null;try{if(window.NXMZ)NXMZ.off(mzTick)}catch(e){}try{menuOpen=false}catch(e){}}
var _cm=closeMenus;closeMenus=function(){if(open&&Date.now()-openedAt>200)closeCC();return _cm.apply(this,arguments)};
var trf=$('#trf');if(trf)new MutationObserver(function(){if(trf.classList.contains('show')){trf.classList.remove('show');openCC()}}).observe(trf,{attributes:true,attributeFilter:['class']});
doc.addEventListener('keydown',function(e){if(e.key==='Escape')closeCC()});
addEventListener('resize',function(){if(open)place()});
/* ---------- actions ---------- */
function panel(k){if(k==='bluetooth'&&ST.btNeedsPermission&&SYS&&SYS.btPermission){SYS.btPermission().then(function(){setTimeout(function(){pull().then(paint)},900)});return}
 if(SYS&&SYS.panel)SYS.panel({k:k}).catch(function(){say('Could not open the system screen')});else say('Open the NexOS app on your phone to use system connections')}
function cyc(){var t=String(S.theme||'auto'),n=t==='auto'?'dark':t==='dark'?'light':'auto';S.theme=n;lsw('aur.theme',n);try{applyTheme()}catch(e){}}
function chip(k){
 if(k==='theme')cyc();
 else if(k==='perf'){try{setPerf(!S.perf)}catch(e){}}
 else if(k==='motion'){S.rm=!S.rm;lsw('aur.rm',S.rm?'1':'0');try{NX3.apply()}catch(e){}}
 else if(k==='saver'){S.ap=!S.ap;lsw('aur.ap',S.ap?'1':'0');try{NX3.apply()}catch(e){}}
 else if(k==='rec'){closeCC();try{openApp('nxrec')}catch(e){say('Screen Recorder is not installed')}return}
 else if(k==='tasks'){closeCC();try{openApp(tmId())}catch(e){}return}
 else if(k==='lock'){closeCC();setTimeout(function(){try{doLock()}catch(e){say('Lock is not available')}},120);return}
 else if(k==='set'){closeCC();try{openApp('set')}catch(e){}return}
 var el=$('[data-sec=ck]',cc);if(el){el._h=null}paint()}
function media(k){var M=window.NXMZ;if(!M)return;if(k==='pp')M.toggle();else if(k==='next')M.next();else if(k==='prev')M.prev();setTimeout(paint,80)}
cc.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-p'))panel(b.getAttribute('data-p'));else if(b.hasAttribute('data-c'))chip(b.getAttribute('data-c'));else if(b.hasAttribute('data-m'))media(b.getAttribute('data-m'))});
cc.addEventListener('pointerdown',function(e){e.stopPropagation();var sl=e.target.closest('.sl');if(!sl)return;e.preventDefault();drag={el:sl,id:e.pointerId,row:sl.parentNode,t:0};sl.classList.add('on');slide(e)});
/* ---------- sliders ---------- */
function setVal(id,v){
 if(id==='vol'){ST.vol=v;if(SYS&&SYS.volume)SYS.volume({set:v}).catch(function(){});else if(window.NXMZ)NXMZ.au.volume=v/100}
 else if(id==='bri'){S.dm=100-v;lsw('aur.dm',String(S.dm));var d=doc.getElementById('dmx');if(d){d.style.display=S.dm?'block':'none';d.style.setProperty('--dma',(S.dm/100).toFixed(2))}}
 else if(id==='nl'){S.nl=v;lsw('aur.nl',String(v));try{NX3.apply()}catch(e){}}}
function slide(e){if(!drag)return;var sl=drag.el,r=sl.getBoundingClientRect(),mn=+sl.dataset.min,mx=+sl.dataset.max,p=Math.max(0,Math.min(1,(e.clientX-r.left)/(r.width||1))),v=Math.round(mn+p*(mx-mn)),id=drag.row.getAttribute('data-s');
 sl.querySelector('i').style.width=p*100+'%';sl.querySelector('u').style.left=p*100+'%';drag.row.querySelector('em').textContent=id==='nl'&&!v?'Off':v+'%';
 var n=Date.now();if(id==='vol'&&n-drag.t<70)return;drag.t=n;setVal(id,v)}
addEventListener('pointermove',function(e){if(drag&&e.pointerId===drag.id){slide(e);e.preventDefault()}},true);
['pointerup','pointercancel'].forEach(function(t){addEventListener(t,function(e){if(drag&&e.pointerId===drag.id){slide(e);drag.el.classList.remove('on');drag=null;var el=$('[data-sec=sl]',cc);if(el)el._h=null}},true)});
window.NXCC={open:openCC,close:closeCC};
})();

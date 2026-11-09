/* LAYOUT-4.5.0 - second layout: "Dock + top bar" (macOS style), chosen in Settings > Themes > Layout (key aur.layout = classic | dock).
   Dock layout:
   - bottom: floating frosted dock with only the app icons, a thin separator, then the Start button (search, tray, clock, island chip are hidden there)
   - top: two frosted pills. Left = Wi-Fi, volume, keyboard. Right = time, date, battery. The middle is left free for Nex Island.
   - tapping the left pill or the right pill opens the Control Center, which grows out of Nex Island (top centre).
   Control Center: calendar, Wi-Fi / Bluetooth / Mobile data / Airplane (open the Android screens through AuroraNet.panel), theme, performance, night light,
   software brightness, app volume, battery and network info, Settings and power.
   The classic layout is untouched (this file only adds body.lay-dock rules).
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document,root=doc.documentElement,body=doc.body;
function g(k,d){var v;try{v=localStorage.getItem(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function ok(f){try{return f()}catch(e){}}
function say(t){ok(function(){if(typeof toast==='function')toast(t)})}
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.9)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var IC={wifi:'<path d="M4.5 9.5a11 11 0 0 1 15 0M7.5 12.8a6.8 6.8 0 0 1 9 0M10.3 16a2.6 2.6 0 0 1 3.4 0M12 19.2h.01"/>',wifioff:'<path d="M4.5 9.5a11 11 0 0 1 15 0M7.5 12.8a6.8 6.8 0 0 1 9 0M12 19.2h.01M4 4l16 16"/>',data:'<path d="M8 4v16M5 7l3-3 3 3M16 20V4M13 17l3 3 3-3"/>',vol:'<path d="M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.8 6.5a8 8 0 0 1 0 11"/>',bt:'<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>',air:'<path d="M3 13l8-2 3-7 2 1-1 7 6 2v2l-7-1-2 4-2-1 1-4-8-1z"/>',theme:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.500 10.500z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',dock:'<rect x="4" y="4.500" width="16" height="3" rx="1.500"/><rect x="7" y="16.500" width="10" height="3" rx="1.500"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>',power:'<path d="M12 3v8M7 6.500a7.500 7.500 0 1 0 10 0"/>',left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>'};
var LAY=g('aur.layout','classic');if(LAY!=='dock')LAY='classic';
/* ---------- css ---------- */
var CSS=[
'#nxTop[hidden],#nxdkSep{display:none}',
'#nxTop{position:fixed;left:0;right:0;top:8px;height:36px;padding:0 12px;display:flex;justify-content:space-between;align-items:center;z-index:4000;pointer-events:none;font:500 13px system-ui,-apple-system,sans-serif;color:var(--txt,#fff)}',
'#nxTop .tp{pointer-events:auto;display:flex;align-items:center;gap:12px;height:34px;padding:0 15px;border-radius:999px;cursor:pointer;background:rgba(28,32,44,.55);border:1px solid rgba(255,255,255,.16);box-shadow:0 8px 26px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.18);-webkit-backdrop-filter:blur(22px) saturate(1.6);backdrop-filter:blur(22px) saturate(1.6);transition:transform .15s,background-color .2s}',
':root[data-theme=light] #nxTop .tp{background:rgba(255,255,255,.55);border-color:rgba(255,255,255,.7);box-shadow:0 8px 26px rgba(60,70,120,.16),inset 0 1px 0 rgba(255,255,255,.8)}',
':root[data-skin=glass] #nxTop .tp{background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.1));border-color:rgba(255,255,255,.4)}',
'#nxTop .tp:active{transform:scale(.96)}#nxTop .tp svg{width:17px;height:17px;display:block}#nxTop .i{display:grid;place-items:center;font-weight:700;font-size:14px}#nxTop .dt{opacity:.82}',
'#nxTop .bt{display:flex;align-items:center;gap:7px}#nxTop .bt b{font-weight:600}',
'.nxbi{position:relative;width:24px;height:12px;border:1.5px solid currentColor;border-radius:4px;opacity:.92;flex:none}.nxbi::after{content:"";position:absolute;right:-4px;top:3px;width:2px;height:4px;background:currentColor;border-radius:0 2px 2px 0}.nxbi u{display:block;height:100%;width:50%;background:currentColor;border-radius:2px;text-decoration:none}.nxbi.ch u{background:#32d74b}',
'@media(max-width:560px){#nxTop .dt{display:none}}',
/* dock layout */
'body.lay-dock #srchBtn,body.lay-dock #tbR,body.lay-dock #dock>.dv,body.lay-dock #dock>#nxdChip{display:none!important}',
'body.lay-dock #tbL{display:contents!important}',
'body.lay-dock #dock{display:flex!important;align-items:center;gap:10px;position:fixed!important;left:50%!important;right:auto!important;top:auto!important;bottom:12px!important;width:auto!important;height:auto!important;max-width:calc(100vw - 20px);transform:translateX(-50%)!important;padding:9px 14px!important;border-radius:30px!important;background:rgba(28,32,44,.55)!important;border:1px solid rgba(255,255,255,.2)!important;box-shadow:0 18px 50px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.22)!important;-webkit-backdrop-filter:blur(28px) saturate(1.7);backdrop-filter:blur(28px) saturate(1.7)}',
':root[data-theme=light] body.lay-dock #dock{background:rgba(255,255,255,.42)!important;border-color:rgba(255,255,255,.7)!important;box-shadow:0 18px 50px rgba(60,70,120,.2),inset 0 1px 0 rgba(255,255,255,.85)!important}',
':root[data-skin=glass] body.lay-dock #dock{background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,.1))!important;border-color:rgba(255,255,255,.42)!important}',
'body.lay-dock #tasks{order:1}body.lay-dock #nxdkSep{display:block;order:2;width:1px;height:38px;background:rgba(127,127,127,.4);border-radius:1px;flex:none}body.lay-dock #startBtn{order:3}',
'@media(hover:hover){body.lay-dock #tasks>*,body.lay-dock #startBtn{transition:transform .2s cubic-bezier(.3,1.5,.5,1)}body.lay-dock #tasks>*:hover,body.lay-dock #startBtn:hover{transform:translateY(-8px) scale(1.18)}}',
/* control center, grows out of the island */
'#nxcc{position:fixed;left:50%;top:56px;width:min(392px,calc(100vw - 16px));overflow:auto;padding:14px;border-radius:30px;background:rgba(28,32,44,.9);background:color-mix(in srgb,var(--pn,#1c2030) 88%,transparent);color:var(--txt,#fff);border:1px solid var(--line,rgba(255,255,255,.16));box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.14);z-index:9600;transform-origin:50% 0;transform:translateX(-50%) scale(.3,.1);opacity:0;pointer-events:none;transition:transform .42s cubic-bezier(.34,1.3,.5,1),opacity .2s;-webkit-backdrop-filter:blur(32px) saturate(1.7);backdrop-filter:blur(32px) saturate(1.7);font:13px system-ui,-apple-system,sans-serif;scrollbar-width:none}',
'#nxcc::-webkit-scrollbar{display:none}#nxcc.open{transform:translateX(-50%) scale(1);opacity:1;pointer-events:auto}',
'#nxcc *{box-sizing:border-box}#nxcc button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}#nxcc svg{display:block}',
'#nxcc .h{display:flex;align-items:center;gap:8px;margin-bottom:12px}#nxcc .tt{flex:1;min-width:0}#nxcc .tm{font-size:30px;font-weight:650;letter-spacing:.5px;line-height:1}#nxcc .dd{opacity:.7;margin-top:4px}',
'#nxcc .rb{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(127,127,127,.2);transition:transform .12s}#nxcc .rb:active{transform:scale(.9)}#nxcc .rb svg{width:18px;height:18px}',
'#nxcc .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 6px;margin-bottom:12px}',
'#nxcc .tl{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;min-width:0}#nxcc .tl .ti{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:rgba(127,127,127,.2);transition:background-color .2s,transform .12s}#nxcc .tl:active .ti{transform:scale(.92)}#nxcc .tl .ti svg{width:24px;height:24px}',
'#nxcc .tl.on .ti{background:var(--acc,#4f7cff);color:#fff}#nxcc .tl b{font-weight:600;font-size:11.5px}#nxcc .tl small{font-size:10.5px;opacity:.65;margin-top:-3px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#nxcc .sl{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-radius:16px;background:rgba(127,127,127,.18);margin-bottom:8px}#nxcc .sl svg{width:18px;height:18px;flex:none;opacity:.8}#nxcc .sl input{flex:1;min-width:0;accent-color:var(--acc,#4f7cff);height:24px}',
'#nxcc .in{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}#nxcc .cd{padding:11px 13px;border-radius:16px;background:rgba(127,127,127,.18)}#nxcc .cd small{display:block;opacity:.65;font-size:11px}#nxcc .cd b{font-size:16px;font-weight:650}#nxcc .cd span{display:block;opacity:.7;font-size:11.5px;margin-top:2px}',
'#nxcc .cl{padding:12px 13px 8px;border-radius:18px;background:rgba(127,127,127,.18)}#nxcc .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:650}#nxcc .ch button{width:28px;height:28px;border-radius:50%;display:grid;place-items:center}#nxcc .ch button:hover{background:rgba(127,127,127,.25)}#nxcc .ch svg{width:15px;height:15px}',
'#nxcc .cg{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:2px}#nxcc .cg i{font-style:normal;padding:6px 0;border-radius:50%;font-size:12px}#nxcc .cg .w{opacity:.55;font-size:10.5px}#nxcc .cg .o{opacity:.35}#nxcc .cg .t{background:var(--acc,#4f7cff);color:#fff;font-weight:700}',
'#nxdim,#nxnl{position:fixed;inset:0;pointer-events:none;z-index:99990;transition:opacity .25s}#nxdim{background:#000;opacity:0}#nxnl{background:rgba(255,150,40,.2);mix-blend-mode:multiply;opacity:0}',
/* settings cards */
'#lay-sec{margin-top:18px}#lay-sec .nxh{font-weight:700;font-size:13px;margin:0 2px 10px}#lay-sec .nxg{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}',
'#lay-sec .wbc{display:flex;flex-direction:column;gap:8px;padding:8px 8px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surf2,transparent);color:var(--txt);text-align:left;font:inherit;cursor:pointer}#lay-sec .wbc.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc)}#lay-sec .wbc b{font-size:13px;padding:0 2px}#lay-sec .wbc em{font-style:normal;font-size:11px;opacity:.65;padding:0 2px}#lay-sec .wbp{display:block;height:70px;border-radius:9px;overflow:hidden;background:#12151c}#lay-sec .wbp svg{display:block;width:100%;height:100%}'
].join('\n');
var st=doc.createElement('style');st.id='nx-layout-css';st.textContent=CSS;doc.head.appendChild(st);
/* ---------- top bar ---------- */
var top=doc.createElement('div');top.id='nxTop';top.hidden=true;
top.innerHTML='<div class="tp" data-cc="1"><span class="i w">'+sv(IC.wifi)+'</span><span class="i v">'+sv(IC.vol)+'</span><span class="i">A</span></div><div class="tp" data-cc="1"><span class="tm"></span><span class="dt"></span><span class="bt"><b></b><span class="nxbi"><u></u></span></span></div>';
body.appendChild(top);
var elT=top.querySelector('.tm'),elD=top.querySelector('.dt'),elW=top.querySelector('.w'),elB=top.querySelector('.bt'),BAT=null;
function clockTxt(){var d=new Date();return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}
function dateTxt(){return new Date().toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric'})}
function netInfo(){var c=navigator.connection||{};return{on:navigator.onLine!==false,type:c.type||'',eff:c.effectiveType||'',down:c.downlink,rtt:c.rtt}}
function updTop(){elT.textContent=clockTxt();elD.textContent=dateTxt();var n=netInfo();elW.innerHTML=sv(!n.on?IC.wifioff:(n.type==='cellular'?IC.data:IC.wifi));
 if(BAT){var p=Math.round(BAT.level*100);elB.querySelector('b').textContent=p+'%';var u=elB.querySelector('u');u.style.width=Math.max(8,p)+'%';elB.querySelector('.nxbi').classList.toggle('ch',!!BAT.charging);elB.style.display=''}else elB.style.display='none'}
ok(function(){navigator.getBattery().then(function(b){BAT=b;['levelchange','chargingchange'].forEach(function(e){b.addEventListener(e,updTop)});updTop()})});
setInterval(function(){updTop();if(CC&&CC.classList.contains('open'))updCC()},10000);
ok(function(){(navigator.connection||window).addEventListener(navigator.connection?'change':'online',updTop);window.addEventListener('offline',updTop)});
/* ---------- layout switch ---------- */
var fitT=0,TH=44;
function fit(){fitT=0;if(LAY!=='dock')return;var W=innerWidth;[].forEach.call(doc.querySelectorAll('.win'),function(w){var r=w.getBoundingClientRect();if(!w.dataset.nxm){if(r.top<=2&&r.left<=2&&r.width>=W-4&&r.height>200&&!/(^|\s)(fs|full|fsd)/.test(w.className)){w.dataset.nxm='1';w.style.top=TH+'px';w.style.height=Math.max(120,r.height-TH)+'px'}}else if(r.width<W-4||r.top>TH+8||r.top<TH-8){delete w.dataset.nxm}})}
function sched(){if(!fitT&&LAY==='dock')fitT=setTimeout(fit,120)}
ok(function(){new MutationObserver(sched).observe(body,{attributes:true,attributeFilter:['style','class'],subtree:true,childList:true})});
function unfit(){[].forEach.call(doc.querySelectorAll('.win[data-nxm]'),function(w){var r=w.getBoundingClientRect();w.style.top='0px';w.style.height=(r.height+TH)+'px';delete w.dataset.nxm})}
var sep=doc.createElement('span');sep.id='nxdkSep';
ok(function(){var d=doc.getElementById('dock'),t=doc.getElementById('tasks');if(d&&t)d.insertBefore(sep,t.nextSibling)});
function apply(v){LAY=v==='dock'?'dock':'classic';put('aur.layout',LAY);if(LAY!=='dock')unfit();body.classList.toggle('lay-dock',LAY==='dock');top.hidden=LAY!=='dock';if(LAY!=='dock')closeCC();else{updTop();sched()}if(window.NXLAY)window.NXLAY.value=LAY}
window.NXLAY={value:LAY,set:apply,openCC:function(){openCC()}};
/* ---------- control center ---------- */
var CC=null,calM=new Date();
function nat(){return ok(function(){return window.Capacitor.Plugins.AuroraNet})}
function panel(kind){var n=nat();if(n&&n.panel){n.panel({kind:kind}).catch(function(){say('Could not open the Android screen')})}else say('Rebuild the app to use this')}
function curTheme(){return(typeof S!=='undefined'&&S.theme)||g('aur.theme','dark')}
function cycleTheme(){var o=['dark','light','glass'],i=(o.indexOf(curTheme())+1)%o.length,v=o[i];ok(function(){if(typeof S!=='undefined')S.theme=v});put('aur.theme',v);ok(function(){if(typeof applyTheme==='function')applyTheme(v)});updCC()}
function setBr(p){put('aur.cc.br',String(p));var d=doc.getElementById('nxdim');if(!d){d=doc.createElement('div');d.id='nxdim';body.appendChild(d)}d.style.opacity=((100-p)/100*.7).toFixed(2)}
function setNl(on){put('aur.cc.nl',on?'1':'0');var d=doc.getElementById('nxnl');if(!d){d=doc.createElement('div');d.id='nxnl';body.appendChild(d)}d.style.opacity=on?'1':'0'}
function setVol(p){put('aur.cc.vol',String(p));window.NXVOL=p/100;[].forEach.call(doc.querySelectorAll('audio,video'),function(e){ok(function(){e.volume=window.NXVOL})});ok(function(){if(window.NXMZ&&NXMZ.setVolume)NXMZ.setVolume(window.NXVOL)})}
if(g('aur.cc.vol','')!==''){window.NXVOL=(+g('aur.cc.vol',100))/100;if(window.HTMLMediaElement){var op=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){ok(function(){})||0;try{this.volume=window.NXVOL}catch(e){}return op.apply(this,arguments)}}}
if(g('aur.cc.br','100')!=='100')setBr(+g('aur.cc.br',100));if(g('aur.cc.nl','0')==='1')setNl(true);
function tile(c,ic,l){return'<button class="tl" data-c="'+c+'"><span class="ti">'+sv(ic)+'</span><b>'+l+'</b><small></small></button>'}
function buildCC(){CC=doc.createElement('div');CC.id='nxcc';
 CC.innerHTML='<div class="h"><div class="tt"><div class="tm"></div><div class="dd"></div></div><button class="rb" data-c="set" aria-label="Settings">'+sv(IC.gear)+'</button><button class="rb" data-c="pow" aria-label="Power">'+sv(IC.power)+'</button></div>'+
 '<div class="gr">'+tile('wifi',IC.wifi,'Wi-Fi')+tile('bt',IC.bt,'Bluetooth')+tile('data',IC.data,'Mobile data')+tile('air',IC.air,'Airplane')+tile('theme',IC.theme,'Theme')+tile('perf',IC.bolt,'Performance')+tile('night',IC.moon,'Night light')+tile('lay',IC.dock,'Layout')+'</div>'+
 '<div class="sl">'+sv(IC.sun)+'<input type="range" data-r="br" min="15" max="100" aria-label="Brightness"></div><div class="sl">'+sv(IC.vol)+'<input type="range" data-r="vol" min="0" max="100" aria-label="Volume"></div>'+
 '<div class="in"><div class="cd"><small>Battery</small><b class="bl">-</b><span class="bs"></span></div><div class="cd"><small>Network</small><b class="nl">-</b><span class="ns"></span></div></div><div class="cl"></div>';
 body.appendChild(CC);
 CC.addEventListener('click',onCC);
 CC.addEventListener('input',function(e){var r=e.target.closest('[data-r]');if(!r)return;if(r.dataset.r==='br')setBr(+r.value);else setVol(+r.value)})}
function calHtml(){var d=new Date(calM.getFullYear(),calM.getMonth(),1),n=new Date(),off=(d.getDay()+6)%7,days=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(),prev=new Date(d.getFullYear(),d.getMonth(),0).getDate();
 var h='<div class="ch"><button data-c="cm-" aria-label="Previous month">'+sv(IC.left,2.2)+'</button><span>'+d.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</span><button data-c="cm+" aria-label="Next month">'+sv(IC.right,2.2)+'</button></div><div class="cg">';
 ['M','T','W','T','F','S','S'].forEach(function(x){h+='<i class="w">'+x+'</i>'});
 for(var i=0;i<off;i++)h+='<i class="o">'+(prev-off+i+1)+'</i>';
 for(var k=1;k<=days;k++){var t=k===n.getDate()&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();h+='<i'+(t?' class="t"':'')+'>'+k+'</i>'}
 var tail=(7-((off+days)%7))%7;for(var j=1;j<=tail;j++)h+='<i class="o">'+j+'</i>';
 return h+'</div>'}
function setTile(c,on,sub){var t=CC.querySelector('[data-c="'+c+'"]');if(!t)return;t.classList.toggle('on',!!on);t.querySelector('small').textContent=sub||''}
function updCC(){if(!CC)return;var n=netInfo();CC.querySelector('.tm').textContent=clockTxt();CC.querySelector('.dd').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
 setTile('wifi',n.type==='wifi'||(n.on&&!n.type),!n.on?'Off':(n.type==='wifi'?'Connected':'Tap to open'));
 setTile('bt',false,'Tap to open');setTile('data',n.type==='cellular',n.type==='cellular'?'On':'Tap to open');setTile('air',false,'Settings');
 setTile('theme',false,curTheme());setTile('perf',ok(function(){return S.perf}),ok(function(){return S.perf})?'On':'Off');setTile('night',g('aur.cc.nl','0')==='1',g('aur.cc.nl','0')==='1'?'On':'Off');setTile('lay',true,'Dock + top bar');
 CC.querySelector('[data-r=br]').value=g('aur.cc.br','100');CC.querySelector('[data-r=vol]').value=String(Math.round((window.NXVOL!=null?window.NXVOL:1)*100));
 CC.querySelector('.bl').textContent=BAT?Math.round(BAT.level*100)+'%':'-';CC.querySelector('.bs').textContent=BAT?(BAT.charging?'Charging':'On battery'):'Not available';
 CC.querySelector('.nl').textContent=!n.on?'Offline':(n.type==='wifi'?'Wi-Fi':n.type==='cellular'?'Mobile':(n.eff||'Online').toUpperCase());CC.querySelector('.ns').textContent=n.down?n.down+' Mbps'+(n.rtt?' \u00b7 '+n.rtt+' ms':''):'';
 CC.querySelector('.cl').innerHTML=calHtml()}
function place(){var d=doc.querySelector('.nxd'),t=d?Math.round(d.getBoundingClientRect().bottom)+10:56;CC.style.top=t+'px';CC.style.maxHeight='calc(100% - '+(t+96)+'px)'}
function openCC(){if(!CC)buildCC();calM=new Date();place();updCC();CC.getBoundingClientRect();CC.classList.add('open')}
function closeCC(){if(CC)CC.classList.remove('open')}
function toggleCC(){if(CC&&CC.classList.contains('open'))closeCC();else openCC()}
function onCC(e){var b=e.target.closest('[data-c]');if(!b)return;var c=b.dataset.c;
 if(c==='wifi'){closeCC();panel('wifi')}else if(c==='bt'){closeCC();panel('bluetooth')}else if(c==='data'){closeCC();panel('data')}else if(c==='air'){closeCC();panel('airplane')}
 else if(c==='theme')cycleTheme();
 else if(c==='perf'){ok(function(){if(typeof setPerf==='function')setPerf(!S.perf)});updCC()}
 else if(c==='night'){setNl(g('aur.cc.nl','0')!=='1');updCC()}
 else if(c==='lay'){closeCC();apply('classic')}
 else if(c==='set'){closeCC();ok(function(){openApp(typeof A!=='undefined'&&A.settings?'settings':'set')})}
 else if(c==='pow'){var r=b.getBoundingClientRect(),m=[];if(typeof doSleep==='function')m.push(['Sleep',function(){doSleep()}]);if(typeof doRestart==='function')m.push(['Restart',function(){doRestart()}]);if(typeof doShut==='function')m.push(['Shut down',function(){doShut()}]);if(m.length&&typeof ctx==='function'){closeCC();ctx(r.left,r.bottom+6,m)}}
 else if(c==='cm-'){calM=new Date(calM.getFullYear(),calM.getMonth()-1,1);CC.querySelector('.cl').innerHTML=calHtml()}
 else if(c==='cm+'){calM=new Date(calM.getFullYear(),calM.getMonth()+1,1);CC.querySelector('.cl').innerHTML=calHtml()}}
top.addEventListener('click',function(e){if(e.target.closest('[data-cc]'))toggleCC()});
doc.addEventListener('pointerdown',function(e){if(CC&&CC.classList.contains('open')&&!CC.contains(e.target)&&!e.target.closest('#nxTop'))closeCC()},true);
doc.addEventListener('keydown',function(e){if(e.key==='Escape')closeCC()});
/* ---------- Settings > Themes > Layout cards ---------- */
var PRE={
 classic:'<svg viewBox="0 0 160 70"><rect width="160" height="70" fill="#12151c"/><rect x="0" y="58" width="160" height="12" fill="#1d222c"/><rect x="4" y="60.500" width="8" height="7" rx="2" fill="#5b7cff"/><rect x="15" y="60.500" width="30" height="7" rx="2" fill="#2b3240"/><rect x="62" y="60.500" width="7" height="7" rx="2" fill="#8b5cf6"/><rect x="72" y="60.500" width="7" height="7" rx="2" fill="#34d6c6"/><rect x="82" y="60.500" width="7" height="7" rx="2" fill="#ffb15c"/><rect x="128" y="61.500" width="28" height="5" rx="2.500" fill="#2b3240"/><rect x="14" y="10" width="80" height="36" rx="4" fill="#1d222c"/></svg>',
 dock:'<svg viewBox="0 0 160 70"><rect width="160" height="70" fill="#12151c"/><rect x="6" y="5" width="26" height="8" rx="4" fill="#2b3240"/><rect x="112" y="5" width="42" height="8" rx="4" fill="#2b3240"/><rect x="64" y="3" width="32" height="10" rx="5" fill="#05070d" stroke="#2b3240"/><rect x="14" y="20" width="80" height="34" rx="4" fill="#1d222c"/><rect x="42" y="56" width="76" height="11" rx="5.500" fill="#2b3240"/><rect x="47" y="58" width="7" height="7" rx="2" fill="#5b7cff"/><rect x="57" y="58" width="7" height="7" rx="2" fill="#8b5cf6"/><rect x="67" y="58" width="7" height="7" rx="2" fill="#34d6c6"/><rect x="77" y="58" width="7" height="7" rx="2" fill="#ffb15c"/><rect x="89" y="58" width="1" height="7" fill="#5a6275"/><rect x="96" y="58" width="7" height="7" rx="2" fill="#ff7a8a"/></svg>'};
var NM={classic:['Classic taskbar','Start, search, apps, tray and clock in one bar'],dock:['Dock + top bar','Floating dock below, clock, battery and Wi-Fi on top']};
function card(m){return'<button class="wbc'+(LAY===m?' sel':'')+'" data-lay="'+m+'"><span class="wbp">'+PRE[m]+'</span><b>'+NM[m][0]+'</b><em>'+NM[m][1]+'</em></button>'}
function mountLay(){var t=doc.querySelector('.thc');if(!t||!t.closest('.win'))return;var grid=t.parentElement;if(!grid)return;
 var prev=doc.getElementById('wb-sec')||doc.getElementById('ic-sec')||grid,sec=doc.getElementById('lay-sec');
 if(!sec||!sec.isConnected||sec.previousElementSibling!==prev){if(sec)sec.remove();sec=doc.createElement('div');sec.id='lay-sec';prev.insertAdjacentElement('afterend',sec);
  sec.addEventListener('click',function(e){var c=e.target.closest('[data-lay]');if(!c)return;e.stopPropagation();apply(c.dataset.lay);sec.dataset.m='';mountLay()});sec.dataset.m=''}
 if(sec.dataset.m!==LAY){sec.dataset.m=LAY;sec.innerHTML='<div class="nxh">Layout</div><div class="nxg">'+card('classic')+card('dock')+'</div>'}}
var busy=0;function scan(){busy=0;mountLay()}
ok(function(){new MutationObserver(function(){if(!busy){busy=1;requestAnimationFrame(scan)}}).observe(body,{childList:true,subtree:true})});
if(LAY==='dock')apply('dock');else updTop();
})();

/* CLOCK-4.2.0 - Clock app (World clock, Alarm, Timer, Stopwatch). Timers and alarms run on Nex Island (needs zz-island-3.9.0.js + the island-3.9.1 patch that exposes NXISLAND.ST/timer/decide).
   Alarms live in localStorage key aur.alarms and timers in aur.timers (same keys as the island), world cities in aur.clk.zones.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
if(typeof A==='undefined'||typeof openApp!=='function')return;
function g(k,d){var v;try{v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{ls(k,v)}catch(e){}}
function pad(n){return(n<10?'0':'')+n}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
function NI(){var n=window.NXISLAND;return n&&n.ST?n:null}
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.9)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var CI={world:sv('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.3 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.3-3.6-8.5S9.4 5.9 12 3.5z"/>'),alarm:sv('<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M5 4.5L3 6.5M19 4.5l2 2"/>'),timer:sv('<circle cx="12" cy="13.5" r="7"/><path d="M12 9.5v4l2.5 1.5M9.5 3.5h5"/>'),sw:sv('<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5L15 10M10 3.5h4M12 3.5v3"/>'),x:sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>')};
var CITIES=[['UTC','UTC'],['London','Europe/London'],['Paris','Europe/Paris'],['Berlin','Europe/Berlin'],['Istanbul','Europe/Istanbul'],['Moscow','Europe/Moscow'],['Dubai','Asia/Dubai'],['Tehran','Asia/Tehran'],['Karachi','Asia/Karachi'],['Delhi','Asia/Kolkata'],['Dhaka','Asia/Dhaka'],['Bangkok','Asia/Bangkok'],['Shanghai','Asia/Shanghai'],['Tokyo','Asia/Tokyo'],['Seoul','Asia/Seoul'],['Sydney','Australia/Sydney'],['Auckland','Pacific/Auckland'],['Cairo','Africa/Cairo'],['Lagos','Africa/Lagos'],['Sao Paulo','America/Sao_Paulo'],['New York','America/New_York'],['Chicago','America/Chicago'],['Denver','America/Denver'],['Los Angeles','America/Los_Angeles'],['Mexico City','America/Mexico_City'],['Toronto','America/Toronto']];
function cityName(tz){for(var i=0;i<CITIES.length;i++)if(CITIES[i][1]===tz)return CITIES[i][0];return tz}
function zones(){try{var z=JSON.parse(g('aur.clk.zones',''));if(Array.isArray(z))return z}catch(e){}return['Asia/Tehran','Europe/London','America/New_York','Asia/Tokyo']}
function saveZones(z){put('aur.clk.zones',JSON.stringify(z))}
function tfmt(tz,now){var o={hour:'2-digit',minute:'2-digit'};if(tz)o.timeZone=tz;return now.toLocaleTimeString([],o)}
function dayLbl(tz,now){var a=now.toLocaleDateString('en-CA',{timeZone:tz}),b=now.toLocaleDateString('en-CA');return a===b?'Today':a>b?'Tomorrow':'Yesterday'}
function offLbl(tz,now){var a=new Date(now.toLocaleString('en-US',{timeZone:tz})),b=new Date(now.toLocaleString('en-US')),d=Math.round((a-b)/60000),m=Math.abs(d),h=Math.floor(m/60),mm=m%60;return d===0?'Same time':(d<0?'-':'+')+h+'h'+(mm?' '+mm+'m':'')}
function islOn(){return g('aur.isl.mode','auto')==='always'&&g('aur.isl.clock','1')==='1'}
function fmtT(ms){var s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);s%=60;return h?h+':'+pad(m)+':'+pad(s):pad(m)+':'+pad(s)}
function fmtSW(ms){var c=Math.floor(ms/10)%100,s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000);return pad(m)+':'+pad(s)+'.'+pad(c)}
/* stopwatch state survives closing the window */
var SW={run:false,t0:0,acc:0,laps:[]};
function swNow(){return SW.acc+(SW.run?Date.now()-SW.t0:0)}
/* ---------- css ---------- */
var CSS=[
'.ck{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--txt);font-size:13px;position:relative;overflow:hidden}.ck *{box-sizing:border-box}.ck button,.ck input,.ck select{font:inherit;color:inherit}',
'.ck-tabs{display:flex;gap:6px;padding:12px 14px 6px;flex:none}',
'.ck-tabs button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line);background:var(--surf2);border-radius:12px;padding:9px 6px;cursor:pointer;transition:background-color .2s,transform .12s,border-color .2s}.ck-tabs button:active{transform:scale(.95)}.ck-tabs svg{width:17px;height:17px;flex:none}',
'.ck[data-tab=world] [data-tab=world],.ck[data-tab=alarm] [data-tab=alarm],.ck[data-tab=timer] [data-tab=timer],.ck[data-tab=sw] [data-tab=sw]{background:var(--acc,#4f7cff);border-color:transparent;color:#fff}',
'.ck-pgs{flex:1;min-height:0;overflow:auto;padding:6px 16px 18px}',
'.ck[data-tab=world] .ck-pg:not([data-pg=world]),.ck[data-tab=alarm] .ck-pg:not([data-pg=alarm]),.ck[data-tab=timer] .ck-pg:not([data-pg=timer]),.ck[data-tab=sw] .ck-pg:not([data-pg=sw]){display:none}',
'.ck h4{margin:16px 2px 8px;font-size:11.5px;font-weight:650;letter-spacing:.5px;text-transform:uppercase;color:var(--mut)}',
'.ck-hero{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;padding:8px 0 4px}.ck-an{width:min(190px,44vw);flex:none}.ck-an svg{width:100%;height:auto;display:block}',
'.ck .face{fill:var(--surf2);stroke:var(--line);stroke-width:2}.ck .tk{stroke:var(--mut);stroke-width:2;stroke-linecap:round}.ck .tk.b{stroke:var(--txt);stroke-width:3.4}',
'.ck .hh,.ck .mh{stroke:var(--txt);stroke-linecap:round}.ck .hh{stroke-width:7}.ck .mh{stroke-width:5}.ck .sh line{stroke:#ff9f0a;stroke-width:2.6;stroke-linecap:round}.ck .pin{fill:#ff9f0a}',
'.ck-big{display:flex;flex-direction:column;align-items:center;gap:4px}.ck-t{font-size:44px;font-weight:650;letter-spacing:1px;font-variant-numeric:tabular-nums}.ck-d{color:var(--mut);font-size:13px}',
'.ck-list{display:flex;flex-direction:column;gap:8px}',
'.ck-card{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:15px;background:var(--surf2);border:1px solid var(--line)}',
'.ck-card .l{flex:1;min-width:0}.ck-card .l b{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ck-card .l span{display:block;color:var(--mut);font-size:12px;margin-top:1px}.ck-card .r{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}',
'.ck-card .x{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:10px;background:var(--hov);cursor:pointer;padding:0}.ck-card .x:active{transform:scale(.9)}.ck-card .x svg{width:16px;height:16px}',
'.ck-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.ck-form.c{justify-content:center}',
'.ck input,.ck select{background:var(--surf2);border:1px solid var(--line);border-radius:11px;padding:8px 10px;outline:0;-webkit-user-select:text;user-select:text}.ck input:focus,.ck select:focus{border-color:var(--acc)}',
'.ck-b{border:1px solid var(--line);background:var(--surf2);border-radius:11px;padding:8px 14px;cursor:pointer;transition:transform .12s,background-color .2s}.ck-b:hover{background:var(--hov)}.ck-b:active{transform:scale(.94)}.ck-b.pri{background:var(--acc,#4f7cff);border-color:transparent;color:#fff;font-weight:600}',
'.ck-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 2px;margin-top:10px;border-top:1px solid var(--line)}',
'.ck-sw{position:relative;width:46px;height:28px;border-radius:999px;border:0;background:var(--line);cursor:pointer;padding:0;transition:background-color .2s}.ck-sw:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .22s}.ck-sw.on{background:#32d74b}.ck-sw.on:after{transform:translateX(18px)}',
'.ck-tin{display:flex;gap:10px;justify-content:center;margin:14px 0 8px}.ck-tin label{display:flex;align-items:baseline;gap:5px}.ck-tin input{width:70px;text-align:center;font-size:26px;font-weight:600;padding:8px 4px}.ck-tin small{color:var(--mut)}',
'.ck-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.ck-chips button{border:1px solid var(--line);background:var(--surf2);border-radius:999px;padding:6px 14px;cursor:pointer}.ck-chips button:active{transform:scale(.94)}',
'.ck-swt{font-size:54px;font-weight:600;text-align:center;margin:26px 0 10px;font-variant-numeric:tabular-nums;letter-spacing:1px}',
'.ck-lap{display:flex;justify-content:space-between;padding:9px 6px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}.ck-lap span:first-child{color:var(--mut)}',
'.ck-note{color:var(--mut);font-size:12px;margin:10px 2px}.ck-empty{color:var(--mut);text-align:center;padding:18px 0}'
].join('\n');
var st=doc.createElement('style');st.id='nx-clock-css';st.textContent=CSS;doc.head.appendChild(st);
/* ---------- clock face ---------- */
function face(){var t='',i,a,b;for(i=0;i<60;i++){b=i%5===0;t+='<line class="tk'+(b?' b':'')+'" x1="100" y1="'+(b?12:16)+'" x2="100" y2="'+(b?24:20)+'" transform="rotate('+(i*6)+' 100 100)"/>'}
 return'<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="face" cx="100" cy="100" r="94"/>'+t+'<line class="hh" x1="100" y1="106" x2="100" y2="56"/><line class="mh" x1="100" y1="108" x2="100" y2="34"/><g class="sh"><line x1="100" y1="116" x2="100" y2="26"/></g><circle class="pin" cx="100" cy="100" r="5"/></svg>'}
/* ---------- app ---------- */
function appClock(w){var B=w.body;
 var tabs=[['world','World'],['alarm','Alarm'],['timer','Timer'],['sw','Stopwatch']].map(function(t){return'<button data-tab="'+t[0]+'">'+CI[t[0]]+'<span>'+t[1]+'</span></button>'}).join('');
 B.innerHTML='<div class="ck" data-tab="world"><div class="ck-tabs">'+tabs+'</div><div class="ck-pgs">'+
  '<div class="ck-pg" data-pg="world"><div class="ck-hero"><div class="ck-an">'+face()+'</div><div class="ck-big"><b class="ck-t"></b><span class="ck-d"></span></div></div><h4>World clock</h4><div class="ck-list ck-zl"></div><div class="ck-form"><select class="ck-sel"></select><button class="ck-b" data-a="zadd">Add city</button></div><div class="ck-row"><span>Show the clock on Nex Island</span><button class="ck-sw" data-a="isl" role="switch" aria-label="Show the clock on Nex Island"></button></div></div>'+
  '<div class="ck-pg" data-pg="alarm"><div class="ck-form"><input type="time" class="ck-at" value="07:00"><input class="ck-al" placeholder="Label" maxlength="24"><button class="ck-b" data-a="arep">Once</button><button class="ck-b pri" data-a="aadd">Add alarm</button></div><div class="ck-list ck-alist"></div><p class="ck-note">Alarms ring on Nex Island, with sound, and can be snoozed there.</p></div>'+
  '<div class="ck-pg" data-pg="timer"><div class="ck-tin"><label><input type="number" class="ck-th" min="0" max="99" value="0"><small>h</small></label><label><input type="number" class="ck-tm" min="0" max="59" value="5"><small>m</small></label><label><input type="number" class="ck-ts" min="0" max="59" value="0"><small>s</small></label></div><div class="ck-chips"><button data-a="chip" data-m="1">1 min</button><button data-a="chip" data-m="5">5 min</button><button data-a="chip" data-m="10">10 min</button><button data-a="chip" data-m="15">15 min</button><button data-a="chip" data-m="30">30 min</button></div><div class="ck-form c"><input class="ck-tl" placeholder="Label (optional)" maxlength="24"><button class="ck-b pri" data-a="tstart">Start timer</button></div><h4>Running</h4><div class="ck-list ck-tlist"></div></div>'+
  '<div class="ck-pg" data-pg="sw"><div class="ck-swt">00:00.00</div><div class="ck-form c"><button class="ck-b" data-a="swlap">Lap</button><button class="ck-b pri" data-a="swgo">Start</button><button class="ck-b" data-a="swreset">Reset</button></div><div class="ck-laps"></div></div>'+
 '</div></div>';
 var root=B.firstChild;function $(s){return root.querySelector(s)}
 var sel=$('.ck-sel');sel.innerHTML='<option value="">Choose a city</option>'+CITIES.map(function(c){return'<option value="'+c[1]+'">'+esc(c[0])+'</option>'}).join('');
 var hands={h:$('.hh'),m:$('.mh'),s:$('.sh')},tkeys='';
 function rot(el,deg){if(el)el.setAttribute('transform','rotate('+deg.toFixed(1)+' 100 100)')}
 function renderZones(){var now=new Date(),z=zones(),h='';z.forEach(function(tz){h+='<div class="ck-card"><div class="l"><b>'+esc(cityName(tz))+'</b><span data-z="'+tz+'"></span></div><div class="r" data-zt="'+tz+'"></div><button class="x" data-a="zrm" data-tz="'+tz+'" aria-label="Remove">'+CI.x+'</button></div>'});
  $('.ck-zl').innerHTML=h||'<div class="ck-empty">No cities yet</div>';tickWorld()}
 function tickWorld(){var now=new Date();$('.ck-t').textContent=tfmt('',now);$('.ck-d').textContent=now.toLocaleDateString([],{weekday:'long',day:'numeric',month:'long'});
  var s=now.getSeconds()+now.getMilliseconds()/1000,m=now.getMinutes()+s/60,h=(now.getHours()%12)+m/60;rot(hands.h,h*30);rot(hands.m,m*6);rot(hands.s,s*6);
  [].forEach.call(root.querySelectorAll('[data-zt]'),function(e){e.textContent=tfmt(e.getAttribute('data-zt'),now)});
  [].forEach.call(root.querySelectorAll('[data-z]'),function(e){var tz=e.getAttribute('data-z');e.textContent=dayLbl(tz,now)+' \u00b7 '+offLbl(tz,now)})}
 function renderIsl(){$('[data-a=isl]').classList.toggle('on',islOn())}
 function renderAlarms(){var n=NI(),box=$('.ck-alist');if(!n){box.innerHTML='<div class="ck-empty">Nex Island is not available, so alarms cannot ring.</div>';return}
  var A_=n.ST.alarms||[];box.innerHTML=A_.length?A_.map(function(a){return'<div class="ck-card"><div class="l"><b>'+esc(a.label||'Alarm')+'</b><span>'+(a.rep==='daily'?'Every day':'Once')+'</span></div><div class="r">'+pad(a.h)+':'+pad(a.m)+'</div><button class="ck-sw'+(a.on?' on':'')+'" data-a="atog" data-id="'+a.id+'" role="switch" aria-label="Alarm on or off"></button><button class="x" data-a="adel" data-id="'+a.id+'" aria-label="Delete">'+CI.x+'</button></div>'}).join(''):'<div class="ck-empty">No alarms yet</div>'}
 function saveAlarms(){var n=NI();if(n)put('aur.alarms',JSON.stringify(n.ST.alarms))}
 function renderTimers(){var n=NI(),box=$('.ck-tlist');if(!n){box.innerHTML='<div class="ck-empty">Nex Island is not available, so timers cannot run.</div>';tkeys='';return}
  var T=n.ST.timers||[],key=T.map(function(t){return t.id}).join(',');
  if(key!==tkeys){tkeys=key;box.innerHTML=T.length?T.map(function(t){return'<div class="ck-card"><div class="l"><b>'+esc(t.label||'Timer')+'</b><span data-tt="'+t.id+'"></span></div><div class="r" data-tr="'+t.id+'"></div><button class="x" data-a="tdel" data-id="'+t.id+'" aria-label="Cancel">'+CI.x+'</button></div>'}).join(''):'<div class="ck-empty">No timers running</div>'}
  var now=Date.now();T.forEach(function(t){var r=box.querySelector('[data-tr="'+t.id+'"]'),s=box.querySelector('[data-tt="'+t.id+'"]');if(r)r.textContent=fmtT(t.end-now);if(s)s.textContent='of '+fmtT(t.total)})}
 function renderSW(){var d=swNow();$('.ck-swt').textContent=fmtSW(d);var go=$('[data-a=swgo]');go.textContent=SW.run?'Stop':(SW.acc?'Resume':'Start');
  var lk=SW.laps.join('|');if(root._lk!==lk){root._lk=lk;$('.ck-laps').innerHTML=SW.laps.slice().reverse().map(function(l,i){var n=SW.laps.length-i,prev=n>1?SW.laps[n-2]:0;return'<div class="ck-lap"><span>Lap '+n+'</span><span>'+fmtSW(l-prev)+'</span><span>'+fmtSW(l)+'</span></div>'}).join('')}}
 function tick(){if(!root.isConnected)return;var t=root.getAttribute('data-tab');if(t==='world')tickWorld();else if(t==='timer')renderTimers();else if(t==='sw')renderSW()}
 function show(t){root.setAttribute('data-tab',t);if(t==='alarm')renderAlarms();if(t==='timer'){tkeys='#';renderTimers()}if(t==='sw'){root._lk=null;renderSW()}if(t==='world')renderIsl();tick()}
 root.addEventListener('click',function(e){var tb=e.target.closest('[data-tab]');if(tb&&tb.closest('.ck-tabs')){show(tb.getAttribute('data-tab'));return}
  var b=e.target.closest('[data-a]');if(!b)return;var a=b.getAttribute('data-a'),id=b.getAttribute('data-id'),n=NI();
  if(a==='zadd'){var v=sel.value;if(!v)return;var z=zones();if(z.indexOf(v)<0){z.push(v);saveZones(z)}sel.value='';renderZones()}
  else if(a==='zrm'){var tz=b.getAttribute('data-tz');saveZones(zones().filter(function(x){return x!==tz}));renderZones()}
  else if(a==='isl'){if(islOn()){put('aur.isl.mode','auto')}else{put('aur.isl.mode','always');put('aur.isl.clock','1')}if(n&&n.decide)n.decide();renderIsl()}
  else if(a==='arep'){b.textContent=b.textContent==='Once'?'Daily':'Once'}
  else if(a==='aadd'){if(!n){say('Nex Island is not available');return}var tv=($('.ck-at').value||'07:00').split(':');n.ST.alarms.push({id:Date.now()+'',h:+tv[0],m:+tv[1],label:$('.ck-al').value.trim(),rep:$('[data-a=arep]').textContent==='Daily'?'daily':'once',on:true});n.ST.alarms.sort(function(x,y){return x.h*60+x.m-(y.h*60+y.m)});saveAlarms();$('.ck-al').value='';renderAlarms();say('Alarm added')}
  else if(a==='atog'&&n){n.ST.alarms.forEach(function(x){if(x.id===id)x.on=!x.on});saveAlarms();renderAlarms()}
  else if(a==='adel'&&n){n.ST.alarms=n.ST.alarms.filter(function(x){return x.id!==id});saveAlarms();renderAlarms()}
  else if(a==='chip'){var m=+b.getAttribute('data-m');$('.ck-th').value=Math.floor(m/60);$('.ck-tm').value=m%60;$('.ck-ts').value=0}
  else if(a==='tstart'){if(!n||!n.timer){say('Nex Island is not available');return}var sec=(+$('.ck-th').value||0)*3600+(+$('.ck-tm').value||0)*60+(+$('.ck-ts').value||0);if(sec<=0){say('Set a time first');return}n.timer(sec*1000,$('.ck-tl').value.trim());$('.ck-tl').value='';tkeys='#';renderTimers()}
  else if(a==='tdel'&&n){n.ST.timers=n.ST.timers.filter(function(x){return x.id!==id});put('aur.timers',JSON.stringify(n.ST.timers));if(n.decide)n.decide();tkeys='#';renderTimers()}
  else if(a==='swgo'){if(SW.run){SW.acc+=Date.now()-SW.t0;SW.run=false}else{SW.t0=Date.now();SW.run=true}renderSW()}
  else if(a==='swlap'){if(SW.run||SW.acc){SW.laps.push(swNow());renderSW()}}
  else if(a==='swreset'){SW.run=false;SW.acc=0;SW.laps=[];renderSW()}});
 var iv=setInterval(tick,250);
 w.onclose=function(){clearInterval(iv)};
 renderZones();renderIsl();renderAlarms();renderSW()}
/* ---------- register the app ---------- */
var ID='nxclock';
A[ID]=Object.assign(A[ID]||{},{n:'Clock',g:'linear-gradient(160deg,#ffc45a,#ff7a1a)',w:600,h:620,f:appClock,kw:'clock alarm timer stopwatch world time'});
try{if(typeof IC!=='undefined'&&typeof P==='function')IC[ID]=P('<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></g>')}catch(e){}
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
window.NXCLOCK={open:function(){openApp(ID)},id:ID};
})();

/* ISLAND-3.9.0 - Nex Island: dynamic-island style pill (music, notifications, timer, alarm, battery, clock) + settings */
(function(){'use strict';
var doc=document,root=doc.documentElement;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
var DEF={mode:'auto',music:'island',notif:'1',timer:'1',batt:'1',clock:'1',top:'8'};
function C(k){return g('aur.isl.'+k,DEF[k])}
function pad(n){return(n<10?'0':'')+n}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function J(k,d){try{return JSON.parse(g(k,''))||d}catch(e){return d}}
function fmt(ms){var s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);s%=60;return h?h+':'+pad(m)+':'+pad(s):pad(m)+':'+pad(s)}
function mmss(t){if(!isFinite(t))return'0:00';t=Math.floor(t);return Math.floor(t/60)+':'+pad(t%60)}
function sv(i,f){return'<svg viewBox="0 0 24 24" '+(f?'fill="currentColor"':'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"')+'>'+i+'</svg>'}
var IC={play:sv('<path d="M8 5.5v13l11-6.5z"/>',1),pause:sv('<path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/>',1),prev:sv('<path d="M6 5.5h2.2v13H6zM19 5.8v12.4L9.6 12z"/>',1),next:sv('<path d="M15.8 5.5H18v13h-2.2zM5 5.8v12.4L14.4 12z"/>',1),
 bell:sv('<path d="M6.5 16.5v-5a5.5 5.5 0 0111 0v5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 004 0"/>'),timer:sv('<circle cx="12" cy="13.5" r="7"/><path d="M12 9.5v4l2.5 1.5M9.5 3.5h5"/>'),bolt:sv('<path d="M13 3L5.5 13.5H11L10 21l8-11h-5.5z"/>',1),note:sv('<path d="M9 17.5V6.5l10-2v11"/><circle cx="6.8" cy="17.5" r="2.4"/><circle cx="16.8" cy="15.5" r="2.4"/>')};
function batIc(l,ch,low){var w=Math.max(1,Math.round(l*11));return'<svg viewBox="0 0 28 16"><rect x="1" y="1.5" width="22" height="13" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.4"/><rect x="3.2" y="3.7" width="'+(w*1.6).toFixed(1)+'" height="8.6" rx="2" fill="'+(low?'#ff453a':ch?'#32d74b':'currentColor')+'"/><path d="M25 5.5v5" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/></svg>'}
/* ---------- state ---------- */
var ST={media:null,timers:J('aur.timers',[]),alarms:J('aur.alarms',[]),snz:[],ring:null,pin:null,pinT:0,tr:null,trT:0,q:[],bat:null,fired:{}};
function saveT(){put('aur.timers',JSON.stringify(ST.timers))}function saveA(){put('aur.alarms',JSON.stringify(ST.alarms))}
/* ---------- dom ---------- */
var el=doc.createElement('div');el.id='nxd';el.className='nxd';el.setAttribute('data-show','0');el.setAttribute('data-v','idle');
el.innerHTML='<div class="nxd-v v-idle"><span class="nxd-clk"></span></div>'+
'<div class="nxd-v v-live"><div class="nxd-l"></div><div class="nxd-r"></div></div>'+
'<div class="nxd-v v-music"><div class="mu-top"><div class="mu-art"></div><div class="mu-tx"><b class="mu-t"></b><span class="mu-a"></span></div><div class="mu-bars"><i></i><i></i><i></i><i></i></div></div><div class="mu-pr"><span class="mu-c">0:00</span><div class="mu-bar"><i></i></div><span class="mu-d">0:00</span></div><div class="mu-ct"><button data-nxdc="prev">'+IC.prev+'</button><button data-nxdc="pp" class="big">'+IC.pause+'</button><button data-nxdc="next">'+IC.next+'</button></div></div>'+
'<div class="nxd-v v-timer"><div class="ti-ring"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" class="bg"/><circle cx="30" cy="30" r="26" class="fg"/></svg><span class="ti-ico">'+IC.timer+'</span></div><div class="ti-tx"><b class="ti-t">00:00</b><span class="ti-l">Timer</span></div><div class="ti-bt"><button data-nxdc="t+">+1 min</button><button data-nxdc="tx" class="red">Cancel</button></div></div>'+
'<div class="nxd-v v-alarm"><div class="al-ico">'+IC.bell+'</div><div class="al-tx"><b class="al-t"></b><span class="al-s"></span></div><div class="al-bt"><button data-nxdc="snooze">Snooze</button><button data-nxdc="stop" class="red">Stop</button></div></div>'+
'<div class="nxd-v v-notif"><div class="no-i"></div><div class="no-b"><span class="no-a"></span><b class="no-t"></b><span class="no-x"></span></div></div>'+
'<div class="nxd-v v-batt"><div class="ba-i"></div><div class="ba-b"><b class="ba-t"></b><span class="ba-s"></span></div></div>'+
'<div class="nxd-v v-quick"><div class="qk-t"><b class="qk-c"></b><span class="qk-d"></span></div><div class="qk-bat"></div><div class="qk-tm"><button data-nxdq="1">1 min</button><button data-nxdq="5">5 min</button><button data-nxdq="10">10 min</button><button data-nxdq="15">15 min</button></div></div>';
function q(s){return el.querySelector(s)}
var CSS=[
'.nxd{position:fixed;left:50%;top:calc(var(--nxd-top,8px) + env(safe-area-inset-top,0px));width:120px;height:34px;max-width:calc(100vw - 16px);border-radius:17px;transform:translateX(-50%);z-index:2147483250;background:#05070d;color:#fff;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.07);transition:width .55s cubic-bezier(.2,.95,.25,1.18),height .55s cubic-bezier(.2,.95,.25,1.18),border-radius .55s cubic-bezier(.2,.95,.25,1.18),opacity .3s,transform .5s cubic-bezier(.2,.95,.25,1.18);font-family:system-ui,sans-serif;-webkit-user-select:none;user-select:none;cursor:pointer}',
'.nxd[data-show="0"]{opacity:0;transform:translateX(-50%) translateY(-14px) scale(.7);pointer-events:none}',
'.nxd[data-v=live]{width:196px;height:36px;border-radius:18px}.nxd[data-v=live][data-two="1"]{width:214px}',
'.nxd[data-v=music]{width:min(352px,calc(100vw - 20px));height:140px;border-radius:32px}.nxd[data-v=timer]{width:min(352px,calc(100vw - 20px));height:104px;border-radius:30px}',
'.nxd[data-v=alarm]{width:min(352px,calc(100vw - 20px));height:104px;border-radius:30px}.nxd[data-v=notif]{width:min(352px,calc(100vw - 20px));height:92px;border-radius:30px}',
'.nxd[data-v=batt]{width:min(290px,calc(100vw - 20px));height:64px;border-radius:26px}.nxd[data-v=quick]{width:min(352px,calc(100vw - 20px));height:170px;border-radius:32px}',
'.nxd-v{position:absolute;inset:0;display:flex;opacity:0;transform:scale(.92);filter:blur(6px);pointer-events:none;transition:opacity .22s,transform .35s cubic-bezier(.2,.95,.25,1.1),filter .25s}',
'.nxd[data-v=idle] .v-idle,.nxd[data-v=live] .v-live,.nxd[data-v=music] .v-music,.nxd[data-v=timer] .v-timer,.nxd[data-v=alarm] .v-alarm,.nxd[data-v=notif] .v-notif,.nxd[data-v=batt] .v-batt,.nxd[data-v=quick] .v-quick{opacity:1;transform:none;filter:none;pointer-events:auto;transition-delay:.1s}',
'.nxd button{background:rgba(255,255,255,.14);border:0;color:#fff;border-radius:999px;font:600 12px system-ui,sans-serif;padding:8px 14px;cursor:pointer;transition:transform .12s,background .2s}.nxd button:active{transform:scale(.9)}.nxd button.red{background:#ff3b5c}',
'.v-idle{align-items:center;justify-content:center;font:600 12px system-ui;letter-spacing:.3px;opacity:.9}',
'.v-live{align-items:center;justify-content:space-between;padding:0 12px}.nxd-l,.nxd-r{display:flex;align-items:center;gap:6px}.nxd-r .tm{font:600 13px ui-monospace,monospace;color:#ff9f0a}',
'.nxd .art{width:22px;height:22px;border-radius:7px;object-fit:cover;display:grid;place-items:center;background:linear-gradient(180deg,#c7a0ff,#7b4dff);color:#fff}.nxd .art svg{width:14px;height:14px}.nxd .ic{width:22px;height:22px;display:grid;place-items:center;border-radius:7px}.nxd .ic.o{background:linear-gradient(180deg,#ffc45a,#ff7a1a)}.nxd .ic svg{width:14px;height:14px}',
'.mu-bars{display:flex;align-items:flex-end;gap:2.5px;height:16px}.mu-bars i{width:3px;height:100%;border-radius:2px;background:#fff;transform-origin:bottom;animation:nxdB .9s ease-in-out infinite alternate}.mu-bars i:nth-child(2){animation-delay:-.3s}.mu-bars i:nth-child(3){animation-delay:-.6s}.mu-bars i:nth-child(4){animation-delay:-.15s}',
'.nxd.paused .mu-bars i,.nxd .nxd-r .mu-bars.off i{animation-play-state:paused;transform:scaleY(.25)}@keyframes nxdB{from{transform:scaleY(.25)}to{transform:scaleY(1)}}',
'.v-music{flex-direction:column;padding:14px 16px 10px;gap:8px}.mu-top{display:flex;align-items:center;gap:12px}.mu-art{width:54px;height:54px;border-radius:14px;flex:none;overflow:hidden;display:grid;place-items:center;background:linear-gradient(180deg,#c7a0ff,#7b4dff)}.mu-art img{width:100%;height:100%;object-fit:cover}.mu-art svg{width:26px;height:26px}',
'.mu-tx{flex:1;min-width:0;display:flex;flex-direction:column}.mu-t{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mu-a{font-size:12.5px;color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.mu-pr{display:flex;align-items:center;gap:8px;font:500 10.5px ui-monospace,monospace;color:rgba(255,255,255,.6)}.mu-bar{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.2);overflow:hidden}.mu-bar i{display:block;width:100%;height:100%;background:#fff;border-radius:2px;transform:scaleX(0);transform-origin:left}',
'.mu-ct{display:flex;justify-content:center;gap:18px}.mu-ct button{background:none;padding:0;width:44px;height:30px;display:grid;place-items:center}.mu-ct svg{width:22px;height:22px}.mu-ct .big svg{width:28px;height:28px}',
'.v-timer,.v-alarm{align-items:center;gap:14px;padding:0 16px}.ti-ring{position:relative;width:60px;height:60px;flex:none}.ti-ring svg{width:100%;height:100%}.ti-ring .bg{fill:none;stroke:rgba(255,255,255,.16);stroke-width:4}.ti-ring .fg{fill:none;stroke:#ff9f0a;stroke-width:4;stroke-linecap:round;stroke-dasharray:163.4;stroke-dashoffset:0;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset .3s linear}',
'.ti-ico{position:absolute;inset:0;display:grid;place-items:center;color:#ff9f0a}.ti-ico svg{width:22px;height:22px}.ti-tx,.al-tx{flex:1;min-width:0;display:flex;flex-direction:column}.ti-t{font:600 26px ui-monospace,monospace;letter-spacing:.5px}.ti-l,.al-s{font-size:12px;color:rgba(255,255,255,.6)}.ti-bt,.al-bt{display:flex;flex-direction:column;gap:6px}',
'.al-ico{width:46px;height:46px;border-radius:14px;flex:none;display:grid;place-items:center;background:linear-gradient(180deg,#ffc45a,#ff7a1a);animation:nxdR .7s ease-in-out infinite}.al-ico svg{width:26px;height:26px}.al-t{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'@keyframes nxdR{0%,100%{transform:rotate(0)}15%{transform:rotate(14deg)}30%{transform:rotate(-12deg)}45%{transform:rotate(9deg)}60%{transform:rotate(-6deg)}}',
'.v-notif,.v-batt{align-items:center;gap:12px;padding:0 16px}.no-i,.ba-i{width:44px;height:44px;flex:none}.no-i svg,.no-i img{width:100%;height:100%;border-radius:12px;display:block}',
'.no-b,.ba-b{flex:1;min-width:0;display:flex;flex-direction:column}.no-a{font-size:10.5px;letter-spacing:.4px;text-transform:uppercase;color:rgba(255,255,255,.55)}.no-t,.ba-t{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.no-x,.ba-s{font-size:12.5px;line-height:1.3;color:rgba(255,255,255,.65);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
'.ba-i{display:grid;place-items:center}.ba-i svg{width:40px;height:24px}',
'.v-quick{flex-direction:column;padding:16px 18px 14px;gap:10px}.qk-t{display:flex;align-items:baseline;gap:10px}.qk-c{font-size:34px;letter-spacing:.5px}.qk-d{font-size:13px;color:rgba(255,255,255,.6)}.qk-bat{display:flex;align-items:center;gap:8px;font-size:12.5px;color:rgba(255,255,255,.7)}.qk-bat svg{width:26px;height:15px}.qk-tm{display:flex;gap:8px;margin-top:auto}.qk-tm button{flex:1;padding:9px 0}',
':root[data-skin=glass] .nxd{background:rgba(10,14,28,.62);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.12),0 14px 40px rgba(0,0,0,.42);-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%)}',
':root[data-nxperf=balanced][data-skin=glass] .nxd{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}:root[data-nxperf=lite][data-skin=glass] .nxd{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(10,14,28,.92)}',
':root[data-nxperf=lite] .nxd{transition-duration:.25s}:root[data-nxperf=lite] .nxd-v{filter:none}',
/* chip on taskbar */
'#nxdChip{display:flex;align-items:center;gap:8px;flex:none;max-width:170px;margin:0 8px;padding:3px 10px 3px 4px;border-radius:999px;background:var(--surf2,rgba(255,255,255,.1));border:1px solid var(--line,rgba(255,255,255,.14));color:var(--txt,#fff);font:600 12px system-ui;cursor:pointer;-webkit-user-select:none;user-select:none}',
'#nxdChip .art{width:22px;height:22px;border-radius:7px;object-fit:cover;display:grid;place-items:center;background:linear-gradient(180deg,#c7a0ff,#7b4dff);color:#fff}#nxdChip .art svg{width:13px;height:13px}#nxdChip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:92px}#nxdChip b{width:16px;height:16px;display:grid;place-items:center}#nxdChip b svg{width:14px;height:14px}',
/* settings */
'.nxd-set{margin:0 0 18px}.nxd-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)}.nxd-row .seg{margin:0}.nxd-row span{font-size:13px}',
'.nxd-set .nxd-btns{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.nxd-set input{background:var(--surf2);border:1px solid var(--line);color:var(--txt);border-radius:10px;padding:7px 9px;font:inherit}.nxd-set .nxd-add{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}',
'.nxd-al{display:flex;align-items:center;gap:10px;padding:6px 0}.nxd-al b{font-size:16px}.nxd-al span{flex:1;font-size:12.5px;color:var(--mut)}.nxd-hint{font-size:12px;color:var(--mut);margin:4px 0}'
].join('\n');
var sty=doc.createElement('style');sty.id='nx-island-css';sty.textContent=CSS;doc.head.appendChild(sty);
/* ---------- media tracking ---------- */
function metaOf(m){var ms=navigator.mediaSession&&navigator.mediaSession.metadata,e=m.el,src=(e.currentSrc||e.src||'').split('/').pop().split('?')[0],t='';try{t=decodeURIComponent(src).replace(/\.[a-z0-9]+$/i,'')}catch(x){t=src}
 var art='';if(ms&&ms.artwork&&ms.artwork.length)art=ms.artwork[ms.artwork.length-1].src;
 return{title:(ms&&ms.title)||e.getAttribute('data-title')||e.title||t||'Now Playing',artist:(ms&&ms.artist)||e.getAttribute('data-artist')||'',art:art||e.getAttribute('data-art')||e.poster||''}}
function track(e){if(!e||e._nxd)return;e._nxd=1;var h=function(){mediaEv(e)};['play','playing','pause','ended','timeupdate','loadedmetadata'].forEach(function(t){e.addEventListener(t,h)})}
function mediaEv(e){if(e.tagName==='VIDEO'&&(e.muted||(e.duration&&e.duration<30)))return;
 if(!e.paused&&!e.ended){ST.media={el:e,pausedAt:0}}else if(ST.media&&ST.media.el===e){if(e.ended)ST.media=null;else if(!ST.media.pausedAt)ST.media.pausedAt=Date.now()}
 if(ST.media&&ST.media.el===e)soft()}
if(window.HTMLMediaElement){var op=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){try{track(this)}catch(x){}return op.apply(this,arguments)}}
doc.addEventListener('play',function(e){if(e.target&&e.target.tagName)track(e.target);mediaEv(e.target)},true);
function mu(){var m=ST.media;if(!m||!m.el.isConnected&&false)return null;if(m&&m.pausedAt&&Date.now()-m.pausedAt>45000){ST.media=null;return null}return m}
function musicLoc(){return C('music')}
function musicOnIsland(){var l=musicLoc();return l==='island'||l==='both'}
function artHtml(m,cls){var d=metaOf(m);return d.art?'<img class="art" src="'+esc(d.art)+'" alt="">':'<span class="art">'+IC.note+'</span>'}
/* ---------- timers / alarms ---------- */
var ac=null,sT=0,sStop=0;
function stopSound(){clearInterval(sT);clearTimeout(sStop);sT=0}
function startSound(){stopSound();try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.resume)ac.resume();var n=0;sT=setInterval(function(){try{var o=ac.createOscillator(),gn=ac.createGain(),t=ac.currentTime;o.type='sine';o.frequency.value=n%2?988:784;o.connect(gn);gn.connect(ac.destination);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.25,t+.02);gn.gain.exponentialRampToValueAtTime(.0001,t+.28);o.start(t);o.stop(t+.3)}catch(x){}if(navigator.vibrate&&n%3===0)navigator.vibrate(200);n++},420)}catch(e){}
 sStop=setTimeout(function(){if(ST.ring){var r=ST.ring;stopRing();if(window.NXN)window.NXN.notify({type:'info',app:r.kind==='alarm'?'Alarm':'Timer',title:'Missed: '+r.label,text:r.time})}},90000)}
function ring(kind,label,time){ST.ring={kind:kind,label:label,time:time};startSound();if(C('mode')==='off'||C('timer')!=='1'){if(window.NXN)window.NXN.notify({type:'info',app:kind==='alarm'?'Alarm':'Timer',title:label,text:time,ms:15000});return}decide()}
function stopRing(){stopSound();ST.ring=null;decide()}
function startTimer(ms,label){ms=Math.max(1000,ms);ST.timers.push({id:Date.now()+'',end:Date.now()+ms,total:ms,label:label||''});ST.timers.sort(function(a,b){return a.end-b.end});saveT();if(C('mode')!=='off'&&C('timer')==='1')pin('timer',3000);else if(window.NXN)window.NXN.notify({type:'info',app:'Timer',title:'Timer started',text:fmt(ms)});decide();loop()}
function liveTimer(){return C('timer')==='1'&&ST.timers.length?ST.timers[0]:null}
function checkAlarms(){var d=new Date(),h=d.getHours(),m=d.getMinutes(),key=d.toDateString()+h+':'+m,ch=false;
 ST.alarms.forEach(function(a){if(a.on&&a.h===h&&a.m===m&&ST.fired[a.id]!==key){ST.fired[a.id]=key;if(a.rep!=='daily'){a.on=false;ch=true}ring('alarm',a.label||'Alarm',pad(h)+':'+pad(m))}});if(ch)saveA();
 var now=Date.now();ST.snz=ST.snz.filter(function(s){if(s.at<=now){ring('alarm',s.label,'Snoozed');return false}return true})}
/* ---------- transient events ---------- */
function trans(t){if(C('mode')==='off')return;ST.q.push(t);if(ST.q.length>5)ST.q.shift();if(!ST.tr)nextTr()}
function nextTr(){clearTimeout(ST.trT);var t=ST.q.shift();if(!t){ST.tr=null;decide();return}ST.tr=t;fillTr(t);decide();ST.trT=setTimeout(nextTr,t.ms||4500)}
function fillTr(t){if(t.view==='notif'){q('.no-i').innerHTML=t.icon||'';q('.no-a').textContent=t.app||'';q('.no-t').textContent=t.title||'';q('.no-x').textContent=t.text||'';q('.no-a').style.display=t.app?'':'none';q('.no-x').style.display=t.text?'':'none'}
 else{var b=t.b;q('.ba-i').innerHTML=batIc(b.level,b.charging,t.low);q('.ba-t').textContent=t.title;q('.ba-s').textContent=Math.round(b.level*100)+'%'+(t.sub?' · '+t.sub:'')}}
function pin(v,ms){ST.pin=v;clearTimeout(ST.pinT);if(ms)ST.pinT=setTimeout(function(){ST.pin=null;decide()},ms);decide()}
/* ---------- decide + render ---------- */
function liveOn(){var items=[];if(mu()&&musicOnIsland())items.push('music');if(liveTimer())items.push('timer');return items}
function decide(){var mode=C('mode'),v=null;root.style.setProperty('--nxd-top',C('top')+'px');
 if(mode!=='off'){if(ST.ring)v='alarm';else if(ST.tr)v=ST.tr.view;else if(ST.pin&&(ST.pin!=='music'||mu())&&(ST.pin!=='timer'||liveTimer()||ST.pin==='quick'))v=ST.pin;else if(ST.pin==='quick')v='quick';else if(liveOn().length)v='live';else if(mode==='always')v='idle'}
 if(!v){el.setAttribute('data-show','0')}else{if(el.getAttribute('data-v')!==v)el.setAttribute('data-v',v);el.setAttribute('data-show','1')}
 render();chip()}
function soft(){render();chip()}
function render(){var v=el.getAttribute('data-v'),m=mu(),t=liveTimer(),now=Date.now();if(el.getAttribute('data-show')==='0'&&!ST.ring)return;
 var playing=m&&!m.el.paused;el.classList.toggle('paused',!playing);
 if(v==='idle'){q('.nxd-clk').textContent=C('clock')==='1'?new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):''}
 else if(v==='live'){var it=liveOn(),L='',R='';
  if(it.indexOf('music')>=0){L=artHtml(m);R=it.length>1?'<span class="tm">'+fmt(t.end-now)+'</span>':'<span class="mu-bars'+(playing?'':' off')+'"><i></i><i></i><i></i><i></i></span>'}
  else if(t){L='<span class="ic o">'+IC.timer+'</span>';R='<span class="tm">'+fmt(t.end-now)+'</span>'}
  var l=q('.nxd-l'),r=q('.nxd-r');if(l.innerHTML!==L)l.innerHTML=L;if(r.getAttribute('data-k')!==R||t)r.innerHTML=R;r.setAttribute('data-k',R);el.setAttribute('data-two',it.length>1?'1':'0')}
 else if(v==='music'&&m){var d=metaOf(m);q('.mu-t').textContent=d.title;q('.mu-a').textContent=d.artist||(m.el.tagName==='VIDEO'?'Video':'');
  var art=q('.mu-art'),k=d.art||'';if(art.getAttribute('data-k')!==k){art.setAttribute('data-k',k);art.innerHTML=k?'<img src="'+esc(k)+'" alt="">':IC.note}
  q('.mu-c').textContent=mmss(m.el.currentTime);q('.mu-d').textContent=mmss(m.el.duration);q('.mu-bar i').style.transform='scaleX('+(m.el.duration?Math.min(1,m.el.currentTime/m.el.duration):0)+')';
  q('[data-nxdc=pp]').innerHTML=playing?IC.pause:IC.play}
 else if(v==='timer'&&t){var rem=Math.max(0,t.end-now);q('.ti-t').textContent=fmt(rem);q('.ti-l').textContent=t.label||(ST.timers.length>1?'Timer · '+ST.timers.length+' running':'Timer');q('.ti-ring .fg').style.strokeDashoffset=String(163.4*(1-Math.min(1,rem/t.total)))}
 else if(v==='alarm'&&ST.ring){q('.al-t').textContent=ST.ring.label;q('.al-s').textContent=ST.ring.time;q('[data-nxdc=snooze]').style.display=ST.ring.kind==='alarm'?'':'none'}
 else if(v==='quick'){var dd=new Date();q('.qk-c').textContent=dd.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});q('.qk-d').textContent=dd.toLocaleDateString([], {weekday:'long',day:'numeric',month:'short'});var b=ST.bat;q('.qk-bat').innerHTML=b?batIc(b.level,b.charging,b.level<.2&&!b.charging)+'<span>'+Math.round(b.level*100)+'%'+(b.charging?' · Charging':'')+'</span>':''}}
/* ---------- taskbar chip for music ---------- */
function chip(){var want=mu()&&(musicLoc()==='taskbar'||musicLoc()==='both'),c=doc.getElementById('nxdChip'),dock=doc.getElementById('dock');
 if(!want||!dock){if(c)c.remove();return}
 var m=mu(),d=metaOf(m),playing=!m.el.paused;
 if(!c){c=doc.createElement('div');c.id='nxdChip';c.addEventListener('click',function(){var x=mu();if(x)x.el.paused?x.el.play():x.el.pause()});var tray=doc.getElementById('tray');dock.insertBefore(c,tray&&tray.parentNode===dock?tray:null)}
 var h=artHtml(m)+'<span>'+esc(d.title)+'</span><b>'+(playing?IC.pause:IC.play)+'</b>';if(c.getAttribute('data-k')!==h){c.setAttribute('data-k',h);c.innerHTML=h}}
/* ---------- interactions ---------- */
function act(b){var c=b.getAttribute('data-nxdc'),m=mu(),t=ST.timers[0];
 if(c==='pp'&&m){m.el.paused?m.el.play():m.el.pause()}
 else if(c==='prev'&&m){if(m.el.currentTime>3)m.el.currentTime=0;else{var e=new KeyboardEvent('keydown',{key:'MediaTrackPrevious',bubbles:true,cancelable:true});doc.dispatchEvent(e)}}
 else if(c==='next'&&m){var e2=new KeyboardEvent('keydown',{key:'MediaTrackNext',bubbles:true,cancelable:true});if(doc.dispatchEvent(e2)&&m.el.duration)m.el.currentTime=Math.min(m.el.duration-.1,m.el.currentTime+15)}
 else if(c==='t+'&&t){t.end+=60000;t.total+=60000;saveT()}
 else if(c==='tx'&&t){ST.timers.shift();saveT();ST.pin=null}
 else if(c==='snooze'&&ST.ring){ST.snz.push({at:Date.now()+540000,label:ST.ring.label});stopRing();return}
 else if(c==='stop'){stopRing();return}
 decide()}
el.addEventListener('click',function(e){var b=e.target.closest('[data-nxdc]'),qb=e.target.closest('[data-nxdq]');
 if(b){e.stopPropagation();act(b);return}if(qb){e.stopPropagation();startTimer(+qb.getAttribute('data-nxdq')*60000);return}
 var v=el.getAttribute('data-v');
 if(v==='live'){pin(mu()&&musicOnIsland()?'music':'timer',8000)}
 else if(v==='idle'){pin('quick',8000)}
 else if(v==='notif'&&ST.tr){var t=ST.tr;if(typeof t.onClick==='function'){try{t.onClick()}catch(x){}}nextTr()}
 else if(v==='batt'){nextTr()}
 else if(v==='music'||v==='timer'||v==='quick'){pin(null)}
});
/* ---------- feed: notifications from the popup system ---------- */
new MutationObserver(function(ms){if(C('mode')==='off'||C('notif')!=='1')return;for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++){var n=a[j];if(n.nodeType===1&&n.classList.contains('nxn')){
 var ic=n.querySelector('.nxn-i'),ap=n.querySelector('.nxn-a'),ti=n.querySelector('.nxn-ti'),tx=n.querySelector('.nxn-tx'),d=parseInt(n.style.getPropertyValue('--d'),10)||5000;
 trans({view:'notif',icon:ic?ic.innerHTML:'',app:ap?ap.textContent:'',title:ti?ti.textContent:'',text:tx?tx.textContent:'',ms:Math.min(d,6500),onClick:function(node){return function(){node.click()}}(n)});
 n.style.display='none';if(n.parentNode)n.parentNode.removeChild(n)}}}}).observe(doc.body,{childList:true,subtree:true});
/* ---------- feed: battery ---------- */
if(navigator.getBattery){navigator.getBattery().then(function(b){function snap(){ST.bat={level:b.level,charging:b.charging}}snap();var lastL=b.level,full=false;
 b.addEventListener('chargingchange',function(){snap();full=false;if(C('batt')==='1'&&b.charging)trans({view:'batt',b:ST.bat,title:'Charging',ms:3500});render()});
 b.addEventListener('levelchange',function(){snap();var l=b.level;if(C('batt')==='1'&&!b.charging){if(lastL>.2&&l<=.2)trans({view:'batt',b:ST.bat,title:'Low battery',sub:'20% remaining',low:true,ms:5000});else if(lastL>.1&&l<=.1)trans({view:'batt',b:ST.bat,title:'Battery very low',sub:'Plug in soon',low:true,ms:6000})}
  if(C('batt')==='1'&&b.charging&&l>=1&&!full){full=true;trans({view:'batt',b:ST.bat,title:'Fully charged',ms:3500})}lastL=l})}).catch(function(){})}
/* ---------- loop ---------- */
var lt=0;function loop(){clearTimeout(lt);var fast=ST.timers.length||ST.ring||el.getAttribute('data-v')==='music'&&el.getAttribute('data-show')==='1';var d=doc.hidden?3000:(fast?250:1000);
 lt=setTimeout(tick,d)}
var tc=0;function tick(){tc++;var now=Date.now();
 for(var i=ST.timers.length-1;i>=0;i--){if(ST.timers[i].end<=now){var t=ST.timers.splice(i,1)[0];saveT();ring('timer',t.label||'Timer','Time is up');if(ST.pin==='timer')ST.pin=null}}
 if(tc%8===0||!lastChk||now-lastChk>15000){lastChk=now;checkAlarms()}
 var m=mu();if(!m&&ST.media){ST.media=null;decide()}
 if(!doc.hidden)render();
 if(el.getAttribute('data-v')==='live'&&!liveOn().length)decide();
 loop()}
var lastChk=0;
/* ---------- settings ---------- */
function seg(key,vals){var cur=C(key);return'<div class="seg" data-nxi="1">'+vals.map(function(v){return'<button data-nxd="'+key+':'+v[0]+'" class="'+(cur===v[0]?'sel':'')+'">'+v[1]+'</button>'}).join('')+'</div>'}
function row(l,key,vals){return'<div class="nxd-row" data-nxi="1"><span data-nxi="1">'+l+'</span>'+seg(key,vals)+'</div>'}
var ONOFF=[['1','On'],['0','Off']];
function alarmList(){return ST.alarms.length?ST.alarms.map(function(a){return'<div class="nxd-al" data-nxi="1"><b data-nxi="1">'+pad(a.h)+':'+pad(a.m)+'</b><span data-nxi="1">'+esc(a.label||'Alarm')+(a.rep==='daily'?' · Daily':'')+'</span><button data-nxda="tog:'+a.id+'" class="pgb">'+(a.on?'On':'Off')+'</button><button data-nxda="del:'+a.id+'" class="pgb">Delete</button></div>'}).join(''):'<p class="nxd-hint">No alarms yet.</p>'}
function setHtml(){return'<h4>Nex Island</h4>'+row('Island','mode',[['off','Off'],['auto','When active'],['always','Always on']])+
 row('Music shows on','music',[['island','Island'],['taskbar','Taskbar'],['both','Both'],['off','Off']])+row('Notifications on island','notif',ONOFF)+row('Timer & alarm','timer',ONOFF)+row('Battery alerts','batt',ONOFF)+row('Clock when idle','clock',ONOFF)+row('Position','top',[['8','Normal'],['22','Lower']])+
 '<div class="nxd-btns" data-nxi="1"><button class="pgb" data-nxdp="1">Preview island</button></div>'+
 '<h4>Timer</h4><div class="nxd-btns" data-nxi="1"><button class="pgb" data-nxdt="1">1 min</button><button class="pgb" data-nxdt="5">5 min</button><button class="pgb" data-nxdt="10">10 min</button><button class="pgb" data-nxdt="15">15 min</button></div>'+
 '<h4>Alarms</h4><div class="nxd-add" data-nxi="1"><input type="time" id="nxdAT" value="07:00"><input id="nxdAL" placeholder="Label" maxlength="24"><button class="pgb" data-nxda="rep" id="nxdARep">Once</button><button class="pgb" data-nxda="add">Add alarm</button></div><div id="nxdAList">'+alarmList()+'</div>'}
function inject(){var p=doc.getElementById('spg');if(!p||p.querySelector('.nxd-set'))return;var hs=p.querySelectorAll('h3'),h=null;for(var i=0;i<hs.length;i++)if(/^\s*(nex ?island|island)/i.test(hs[i].textContent)){h=hs[i];break}
 var b=doc.createElement('div');b.className='nxd-set';b.setAttribute('data-nxi','1');b.innerHTML=setHtml();if(h)h.parentNode.insertBefore(b,h.nextSibling);else{var t=p.querySelector('.nxf,.nxs,.nxc,.nxt');if(!t)return;t.appendChild(b)}}
function preview(){trans({view:'notif',icon:'<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6.4" fill="#7b4dff"/><path d="M8 17V8l8-1.6V15" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',app:'Nex Island',title:'Hello from Nex Island',text:'Notifications, music, timers and more appear here.',ms:3800});
 if(ST.bat)trans({view:'batt',b:ST.bat,title:ST.bat.charging?'Charging':'Battery',ms:3000})}
doc.addEventListener('click',function(e){var t=e.target;if(!t.closest||t.closest('#nxd'))return;
 var b=t.closest('[data-nxd]');if(b){e.stopPropagation();e.preventDefault();var kv=b.getAttribute('data-nxd').split(':');put('aur.isl.'+kv[0],kv[1]);[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('sel',x===b)});if(kv[0]==='mode'&&kv[1]==='off')ST.pin=null;decide();return}
 var tb=t.closest('[data-nxdt]');if(tb){e.stopPropagation();e.preventDefault();startTimer(+tb.getAttribute('data-nxdt')*60000);return}
 if(t.closest('[data-nxdp]')){e.stopPropagation();e.preventDefault();if(C('mode')==='off')put('aur.isl.mode','auto');preview();return}
 var ab=t.closest('[data-nxda]');if(ab){e.stopPropagation();e.preventDefault();var s=ab.getAttribute('data-nxda');
  if(s==='rep'){ab.textContent=ab.textContent==='Once'?'Daily':'Once'}
  else if(s==='add'){var tv=(doc.getElementById('nxdAT').value||'07:00').split(':'),lab=doc.getElementById('nxdAL').value.trim();ST.alarms.push({id:Date.now()+'',h:+tv[0],m:+tv[1],label:lab,rep:doc.getElementById('nxdARep').textContent==='Daily'?'daily':'once',on:true});ST.alarms.sort(function(a,b){return a.h*60+a.m-(b.h*60+b.m)});saveA();doc.getElementById('nxdAList').innerHTML=alarmList()}
  else{var p=s.split(':'),id=p[1];if(p[0]==='del')ST.alarms=ST.alarms.filter(function(a){return a.id!==id});else ST.alarms.forEach(function(a){if(a.id===id)a.on=!a.on});saveA();doc.getElementById('nxdAList').innerHTML=alarmList()}}},true);
var raf=0;new MutationObserver(function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;inject();if(mu()&&(musicLoc()==='taskbar'||musicLoc()==='both')&&!doc.getElementById('nxdChip'))chip()})}).observe(doc.body,{childList:true,subtree:true});
doc.body.appendChild(el);
doc.addEventListener('visibilitychange',function(){if(!doc.hidden){decide();loop()}});
window.NXISLAND={timer:startTimer,show:function(o){o=o||{};trans({view:'notif',icon:o.icon||'',app:o.app||'',title:o.title||'',text:o.text||'',ms:o.ms||4500,onClick:o.onClick})},preview:preview,alarms:ST.alarms};
decide();loop();inject();
})();

/* CLOCK-4.1.0 - Clock app (clock, timer, stopwatch with laps) + Task Manager "Details" tab */
(function(){'use strict';
if(typeof A==='undefined'||typeof P!=='function')return;
var doc=document;
function two(n){return(n<10?'0':'')+n}
function fmtSw(ms){var c=Math.floor(ms/10)%100,s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000);return(h?h+':':'')+two(m)+':'+two(s)+','+two(c)}
function fmtT(ms){ms=Math.max(0,Math.ceil(ms/1000));var h=Math.floor(ms/3600),m=Math.floor(ms/60)%60,s=ms%60;return(h?h+':':'')+two(m)+':'+two(s)}
var css=['.ck{display:flex;flex-direction:column;height:100%;color:var(--txt)}',
'.ck .ckt{display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid var(--line)}.ck .ckt button{flex:1;border:0;border-radius:10px;padding:8px;background:none;color:inherit;font:inherit;cursor:pointer}.ck .ckt button.on{background:var(--acc);color:var(--accT,#fff)}',
'.ck .ckb{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;align-items:center;gap:14px}',
'.ck .big{font:300 54px/1 system-ui;letter-spacing:1px;font-variant-numeric:tabular-nums}.ck .sub{opacity:.65;font-size:13px}',
'.ck svg.an{width:190px;height:190px}.ck .an .f{fill:none;stroke:var(--line);stroke-width:2}.ck .an .h{stroke:var(--txt);stroke-linecap:round}.ck .an .s{stroke:var(--acc);stroke-linecap:round}',
'.ck .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.ck .row button,.ck .pre button{border:1px solid var(--line);border-radius:999px;padding:9px 18px;background:var(--surf2);color:inherit;font:inherit;cursor:pointer}',
'.ck .row button.pri{background:var(--acc);color:var(--accT,#fff);border-color:transparent}.ck .row button.red{background:#e5484d;color:#fff;border-color:transparent}',
'.ck .laps{width:100%;max-width:360px;display:flex;flex-direction:column;gap:2px;font-variant-numeric:tabular-nums}.ck .laps div{display:flex;justify-content:space-between;padding:7px 10px;border-radius:8px}.ck .laps div:nth-child(odd){background:var(--surf2)}',
'.ck .pre{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.ck input[type=number]{width:64px;text-align:center;font:inherit;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--surf2);color:inherit}',
'.ck .ti{display:flex;align-items:center;gap:6px}.ck .tl{width:100%;max-width:360px;display:flex;flex-direction:column;gap:6px}.ck .tl div{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:10px;background:var(--surf2)}',
'.tk .tkd{display:none;padding:14px;gap:10px;flex-wrap:wrap;overflow:auto}.tk[data-tab=d] .tkd{display:flex}.tk[data-tab=d] .tkp,.tk[data-tab=d] .tkf{display:none}',
'.tk .tkd .cd2{flex:1 1 150px;padding:12px;border-radius:12px;background:var(--surf2);border:1px solid var(--line)}.tk .tkd .cd2 b{display:block;font-size:20px;margin-top:4px}.tk .tkd .cd2 span{font-size:12px;opacity:.7}'].join('\n');
var st=doc.createElement('style');st.id='nx-clock-css';st.textContent=css;doc.head.appendChild(st);
function appClock(w){
 var B=w.body,tab='c',iv=null,sw=JSON.parse(sessionStorage.getItem('aur.sw')||'{"run":0,"t0":0,"acc":0,"laps":[]}');
 function save(){try{sessionStorage.setItem('aur.sw',JSON.stringify(sw))}catch(e){}}
 B.innerHTML='<div class="ck"><div class="ckt"><button data-t="c" class="on">Clock</button><button data-t="t">Timer</button><button data-t="s">Stopwatch</button></div><div class="ckb"></div></div>';
 var body=B.querySelector('.ckb');
 function swNow(){return sw.acc+(sw.run?Date.now()-sw.t0:0)}
 function view(){
  if(tab==='c'){body.innerHTML='<svg class="an" viewBox="0 0 100 100"><circle class="f" cx="50" cy="50" r="46"/><line class="h" id="ckH" x1="50" y1="50" x2="50" y2="28" stroke-width="3.4"/><line class="h" id="ckM" x1="50" y1="50" x2="50" y2="16" stroke-width="2.4"/><line class="s" id="ckS" x1="50" y1="56" x2="50" y2="10" stroke-width="1.2"/><circle cx="50" cy="50" r="2.6" fill="var(--acc)"/></svg><div class="big" id="ckD"></div><div class="sub" id="ckDt"></div>';tickC()}
  else if(tab==='t'){var tl=(window.NXISLAND&&JSON.parse(localStorage.getItem('aur.timers')||'[]'))||[];
   body.innerHTML='<div class="ti"><input type="number" id="ckTh" min="0" max="99" value="0"><span>h</span><input type="number" id="ckTm" min="0" max="999" value="5"><span>m</span><input type="number" id="ckTs" min="0" max="59" value="0"><span>s</span></div><div class="pre"><button data-p="1">1 min</button><button data-p="5">5 min</button><button data-p="10">10 min</button><button data-p="30">30 min</button></div><div class="row"><button class="pri" data-a="start">Start timer</button></div><div class="sub">Running timers also show on Nex Island.</div><div class="tl" id="ckTl"></div>';tickT()}
  else{body.innerHTML='<div class="big" id="ckSw"></div><div class="row"><button class="pri" data-a="go"></button><button data-a="lap">Lap</button><button data-a="rs">Reset</button></div><div class="laps" id="ckL"></div>';tickS()}}
 function tickC(){var d=new Date(),h=d.getHours()%12,m=d.getMinutes(),s=d.getSeconds(),q=function(id){return body.querySelector(id)};
  if(!q('#ckH'))return;q('#ckH').setAttribute('transform','rotate('+((h+m/60)*30)+' 50 50)');q('#ckM').setAttribute('transform','rotate('+((m+s/60)*6)+' 50 50)');q('#ckS').setAttribute('transform','rotate('+(s*6)+' 50 50)');
  q('#ckD').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});q('#ckDt').textContent=d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
 function tickT(){var el=body.querySelector('#ckTl');if(!el)return;var tl=[];try{tl=JSON.parse(localStorage.getItem('aur.timers')||'[]')}catch(e){}
  el.innerHTML=tl.map(function(t){return'<div><span>'+(t.label||'Timer')+'</span><b>'+fmtT(t.end-Date.now())+'</b></div>'}).join('')}
 function tickS(){var e=body.querySelector('#ckSw');if(!e)return;e.textContent=fmtSw(swNow());var g=body.querySelector('[data-a=go]');g.textContent=sw.run?'Pause':(sw.acc?'Resume':'Start');g.className=sw.run?'red':'pri';
  var L=body.querySelector('#ckL'),h=sw.laps.map(function(l,i){return'<div><span>Lap '+(i+1)+'</span><span>'+fmtSw(l.d)+'</span><span>'+fmtSw(l.t)+'</span></div>'}).reverse().join('');if(L.getAttribute('data-n')!==String(sw.laps.length)){L.innerHTML=h;L.setAttribute('data-n',sw.laps.length)}}
 B.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){tab=t.dataset.t;B.querySelectorAll('.ckt button').forEach(function(b){b.classList.toggle('on',b===t)});view();return}
  var p=e.target.closest('[data-p]');if(p){body.querySelector('#ckTm').value=p.dataset.p;body.querySelector('#ckTh').value=0;body.querySelector('#ckTs').value=0;return}
  var a=e.target.closest('[data-a]');if(!a)return;var k=a.dataset.a;
  if(k==='start'){var ms=((+body.querySelector('#ckTh').value||0)*3600+(+body.querySelector('#ckTm').value||0)*60+(+body.querySelector('#ckTs').value||0))*1000;if(ms>=1000&&window.NXISLAND)window.NXISLAND.timer(ms,'');tickT()}
  else if(k==='go'){if(sw.run){sw.acc+=Date.now()-sw.t0;sw.run=0}else{sw.t0=Date.now();sw.run=1}save();tickS()}
  else if(k==='lap'){if(sw.run||sw.acc){var n=swNow(),pv=sw.laps.length?sw.laps[sw.laps.length-1].t:0;sw.laps.push({t:n,d:n-pv});save();tickS()}}
  else if(k==='rs'){sw={run:0,t0:0,acc:0,laps:[]};save();body.querySelector('#ckL')&&body.querySelector('#ckL').setAttribute('data-n','-1');tickS()}});
 iv=setInterval(function(){if(tab==='c')tickC();else if(tab==='t')tickT();else tickS()},tab==='s'?50:250);
 var iv2=setInterval(function(){if(tab==='s')tickS()},50);
 w.onclose=function(){clearInterval(iv);clearInterval(iv2)};view()}
A.clock={n:'Clock',g:'linear-gradient(160deg,#fbbf24,#f97316)',w:420,h:520,f:appClock};
if(typeof IC!=='undefined')IC.clock=P('<g stroke="none"><circle cx="12" cy="12" r="9" fill="#fff" opacity=".4"/><path d="M12 6.5V12l3.6 2.2" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></g>');
/* ---- Task Manager: Details tab ---- */
var tries=0,iv3=setInterval(function(){tries++;doc.querySelectorAll('.tk').forEach(function(tk){if(tk._d)return;tk._d=1;
  var tabs=tk.querySelector('.tkt'),pn=doc.createElement('div');pn.className='tkd';var b=doc.createElement('button');b.setAttribute('data-t','d');b.textContent='Details';tabs.appendChild(b);tk.appendChild(pn);
  function upd(){if(!tk.isConnected)return;if(tk.dataset.tab!=='d')return;var up=Math.round(performance.now()/1000),h=Math.floor(up/3600),m=Math.floor(up/60)%60,n=navigator,items=[['Uptime',h+'h '+m+'m'],['Windows open',(typeof W!=='undefined'?Object.keys(W).length:0)],['CPU threads',n.hardwareConcurrency||'?'],['Device memory',(n.deviceMemory?n.deviceMemory+' GB':'n/a')],['Screen',innerWidth+'×'+innerHeight+' @'+(window.devicePixelRatio||1)+'x'],['Network',n.onLine?(n.connection&&n.connection.effectiveType||'online'):'offline']];
   var pm=performance.memory;if(pm)items.push(['JS heap',(pm.usedJSHeapSize/1048576|0)+' / '+(pm.jsHeapSizeLimit/1048576|0)+' MB']);
   pn.innerHTML=items.map(function(i){return'<div class="cd2"><span>'+i[0]+'</span><b>'+i[1]+'</b></div>'}).join('')}
  tk.addEventListener('click',function(e){if(e.target.closest('[data-t=d]')){tk.dataset.tab='d';tk.querySelectorAll('.tkt button').forEach(function(x){x.classList.toggle('on',x===b)});upd()}});
  setInterval(upd,1000)});if(tries>600)clearInterval(iv3)},1000);
})();

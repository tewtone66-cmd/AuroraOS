/* TM-5.1.0 - Task Manager rebuilt: live Processes (switch / minimize / end task), Performance charts (frame rate, UI load, JS memory), Details, quick clean-up.
   Replaces the old Task Manager app (found by name) or registers one. Do not write octal escapes or the HTML comment opener in this file. */
(function(){'use strict';
var doc=document;
if(typeof A==='undefined'||typeof W==='undefined')return;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(t){try{toast(t)}catch(e){}}
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var ID=Object.keys(A).filter(function(k){return /task manager/i.test((A[k]&&A[k].n)||'')})[0]||'nxtm';window.NXTMID=ID;
var N=60,H={fps:[],lag:[],mem:[],nodes:[]},fr=0,lagS=0,lagN=0,lastT=0,raf=0,iv=0,lv=0,users=0,BAT=null;
function loop(){fr++;raf=requestAnimationFrame(loop)}
function lagTick(){var n=performance.now();if(lastT){lagS+=Math.max(0,n-lastT-100);lagN++}lastT=n}
function push(k,v){H[k].push(v);if(H[k].length>N)H[k].shift()}
function tick(){var f=fr;fr=0;push('fps',f);var lag=lagN?lagS/lagN:0;lagS=0;lagN=0;push('lag',Math.min(100,lag*2));
 var pm=performance.memory;push('mem',pm?pm.usedJSHeapSize/1048576:0);push('nodes',doc.getElementsByTagName('*').length);
 if(navigator.getBattery&&!BAT)navigator.getBattery().then(function(b){BAT=b}).catch(function(){})}
function startS(){if(users++)return;fr=0;lastT=0;raf=requestAnimationFrame(loop);lv=setInterval(lagTick,100);iv=setInterval(tick,1000)}
function stopS(){if(--users>0)return;users=0;cancelAnimationFrame(raf);clearInterval(lv);clearInterval(iv)}
var st=doc.createElement('style');st.id='nx-tm5-css';st.textContent=[
'.tmx{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--txt);font-size:13px;overflow:hidden}.tmx *{box-sizing:border-box}.tmx button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}',
'.tmx .tmh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px 10px}.tmx .tmh b{display:block;font-size:20px;font-weight:750;letter-spacing:-.3px}.tmx .tmh span{display:block;color:var(--mut);font-size:12px;margin-top:2px}',
'.tmx .tab{display:flex;gap:3px;padding:3px;border-radius:13px;background:var(--surf2);border:1px solid var(--line)}.tmx .tab button{border:0;background:none;border-radius:10px;padding:7px 14px;cursor:pointer;color:var(--mut);font-weight:600;transition:background-color .2s,color .2s}.tmx .tab button.on{background:var(--acc);color:var(--accT,#fff)}',
'.tmx .tmb{flex:1;min-height:0;overflow:auto;padding:4px 18px 18px;scrollbar-width:thin}',
'.tmx .sm{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:12px}.tmx .sm div{padding:11px 13px;border-radius:15px;background:var(--surf2);border:1px solid var(--line)}.tmx .sm span{display:block;color:var(--mut);font-size:11.5px}.tmx .sm b{display:block;margin-top:3px;font-size:20px;font-weight:700;font-variant-numeric:tabular-nums}.tmx .sm small{font-size:12px;font-weight:500;opacity:.7;margin-left:2px}',
'.tmx .ph{display:flex;align-items:center;justify-content:space-between;margin:2px 2px 8px}.tmx .ph h4{margin:0;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--mut);font-weight:700}',
'.tmx .btn{border:1px solid var(--line);background:var(--surf2);border-radius:11px;padding:7px 13px;cursor:pointer;transition:transform .12s,background-color .2s}.tmx .btn:hover{background:var(--hov)}.tmx .btn:active{transform:scale(.95)}.tmx .btn.dg{color:#ff5d73}.tmx .btn.pr{background:var(--acc);color:var(--accT,#fff);border-color:transparent}',
'.tmx .rows{border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--surf2)}.tmx .r{display:flex;align-items:center;gap:12px;padding:10px 14px}.tmx .r+.r{border-top:1px solid var(--line)}',
'.tmx .ti{width:36px;height:36px;border-radius:11px;flex:none;display:grid;place-items:center;color:#fff;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,.25)}.tmx .ti svg{width:60%;height:60%}',
'.tmx .tn{flex:1;min-width:0}.tmx .tn b{display:block;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tmx .tn span{display:block;color:var(--mut);font-size:11.5px;margin-top:1px}',
'.tmx .tw{width:84px;flex:none}.tmx .tw i{display:block;height:6px;border-radius:3px;background:var(--acc);min-width:3px;transition:width .5s}.tmx .tw{height:6px;border-radius:3px;background:rgba(128,134,150,.3)}',
'.tmx .ta{display:flex;gap:6px;flex:none}.tmx .ta .btn{padding:6px 11px}',
'.tmx .em{padding:34px 16px;text-align:center;color:var(--mut)}',
'.tmx .ch{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.tmx .cd{padding:13px 14px 8px;border-radius:18px;background:var(--surf2);border:1px solid var(--line)}.tmx .cd header{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.tmx .cd header span{color:var(--mut);font-size:12px}.tmx .cd header b{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}.tmx .cd header b small{font-size:12px;opacity:.7;margin-left:2px}.tmx .cd svg{display:block;width:100%;height:64px;margin-top:6px}',
'.tmx .kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px}.tmx .kv div{padding:11px 14px;border-radius:15px;background:var(--surf2);border:1px solid var(--line)}.tmx .kv span{display:block;color:var(--mut);font-size:11.5px}.tmx .kv b{display:block;margin-top:2px;font-weight:650;font-size:14px}',
'.tmx .ac{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}'
].join('\n');
doc.head.appendChild(st);
function spark(a,mx,col){var n=a.length;if(n<2)return'<svg viewBox="0 0 240 64"></svg>';var m=mx||Math.max.apply(null,a.concat([1])),pts=a.map(function(v,i){return[((i+N-n)/(N-1))*240,60-(Math.min(v,m)/m)*54]}),d='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1)}).join('L');
 return'<svg viewBox="0 0 240 64" preserveAspectRatio="none"><path d="'+d+'L240 64L'+pts[0][0].toFixed(1)+' 64Z" fill="'+col+'" opacity=".16"/><path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>'}
function last(a){return a.length?a[a.length-1]:0}
function fmtUp(){var s=Math.round(performance.now()/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60;return h+'h '+m+'m'}
function procs(){var out=[];Object.keys(W).forEach(function(k){var w=W[k];if(!w||!w.el)return;var a=A[w.app]||{},min=w.el.classList.contains('min');
  out.push({k:k,app:w.app,name:a.n||w.app,g:a.g||'linear-gradient(135deg,#6b7280,#374151)',min:min,nodes:w.el.getElementsByTagName('*').length,w:w})});return out}
function icon(p){var s=typeof IC!=='undefined'&&IC[p.app];return typeof s==='string'&&s.indexOf('<svg')>=0?s:esc((p.name||'?').charAt(0).toUpperCase())}
function appTM(w){var B=w.body,tab='p',alive=true;startS();
 B.innerHTML='<div class="tmx"><div class="tmh"><div><b>Task Manager</b><span class="sub"></span></div><div class="tab"><button data-t="p">Processes</button><button data-t="f">Performance</button><button data-t="d">Details</button></div></div><div class="tmb"></div></div>';
 var root=B.firstChild,body=root.querySelector('.tmb'),sub=root.querySelector('.sub'),lastH='';
 function view(){var P=procs(),h='',tot=0,mx=1;P.forEach(function(p){tot+=p.nodes;if(p.nodes>mx)mx=p.nodes});
  sub.textContent=P.length+' app'+(P.length===1?'':'s')+' open \u00b7 up '+fmtUp();
  if(tab==='p'){var pm=performance.memory,M=window.NXMZ,bg=M&&M.q&&M.q.cur&&!M.au.paused;
   h='<div class="sm"><div><span>Frame rate</span><b>'+last(H.fps)+'<small>fps</small></b></div><div><span>UI load</span><b>'+Math.round(last(H.lag))+'<small>%</small></b></div><div><span>JS memory</span><b>'+(pm?Math.round(pm.usedJSHeapSize/1048576):'n/a')+(pm?'<small>MB</small>':'')+'</b></div><div><span>Page elements</span><b>'+((last(H.nodes)||doc.getElementsByTagName('*').length)/1000).toFixed(1)+'<small>k</small></b></div></div>'+
    '<div class="ph"><h4>Apps</h4><button class="btn" data-a="clean">Close minimized</button></div><div class="rows">';
   if(!P.length&&!bg)h+='<div class="em">No apps are running.</div>';
   P.forEach(function(p){h+='<div class="r" data-k="'+esc(p.k)+'"><div class="ti" style="background:'+p.g+'">'+icon(p)+'</div><div class="tn"><b>'+esc(p.name)+'</b><span>'+(p.min?'Minimized':'Running')+' \u00b7 '+p.nodes+' elements</span></div><div class="tw"><i style="width:'+Math.max(4,Math.round(p.nodes/mx*100))+'%"></i></div><div class="ta"><button class="btn" data-a="show">'+(p.min?'Open':'Switch')+'</button><button class="btn" data-a="min"'+(p.min?' style="display:none"':'')+'>Minimize</button><button class="btn dg" data-a="end">End</button></div></div>'});
   if(bg)h+='<div class="r"><div class="ti" style="background:linear-gradient(135deg,#ff7ab8,#8b5cf6)">'+sv('<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.8" cy="17.5" r="2.4"/><circle cx="16.8" cy="15.5" r="2.4"/>')+'</div><div class="tn"><b>Music playback</b><span>Background \u00b7 '+esc(M.q.cur.t)+'</span></div><div class="ta"><button class="btn dg" data-a="stopm">Stop</button></div></div>';
   h+='</div>'}
  else if(tab==='f'){var pm2=performance.memory;
   h='<div class="ch"><div class="cd"><header><span>Frame rate</span><b>'+last(H.fps)+'<small>fps</small></b></header>'+spark(H.fps,60,'#35d07f')+'</div>'+
    '<div class="cd"><header><span>UI load</span><b>'+Math.round(last(H.lag))+'<small>%</small></b></header>'+spark(H.lag,100,'#ff8a5b')+'</div>'+
    '<div class="cd"><header><span>JS memory</span><b>'+(pm2?Math.round(last(H.mem)):'n/a')+(pm2?'<small>MB</small>':'')+'</b></header>'+spark(H.mem,0,'#7c9bff')+'</div>'+
    '<div class="cd"><header><span>Page elements</span><b>'+((last(H.nodes)||doc.getElementsByTagName('*').length)/1000).toFixed(1)+'<small>k</small></b></header>'+spark(H.nodes,0,'#c58bff')+'</div></div>'+
    '<div class="ac"><button class="btn pr" data-a="perf">'+(S.perf?'Turn off Performance mode':'Turn on Performance mode')+'</button><button class="btn" data-a="clean">Close minimized apps</button></div>'}
  else{var n=navigator,c=n.connection||{},b=BAT?Math.round(BAT.level*100)+'%'+(BAT.charging?' (charging)':''):'n/a',K=[['Uptime',fmtUp()],['Open apps',P.length],['Total UI elements',tot.toLocaleString()],['CPU threads',n.hardwareConcurrency||'n/a'],['Device memory',n.deviceMemory?n.deviceMemory+' GB':'n/a'],['Screen',innerWidth+' \u00d7 '+innerHeight+' @'+(window.devicePixelRatio||1)+'x'],['Network',n.onLine===false?'Offline':((c.effectiveType||'online').toUpperCase()+(c.downlink?' \u00b7 '+c.downlink+' Mbps':'')+(c.rtt?' \u00b7 '+c.rtt+' ms':''))],['Battery',b],['Performance mode',S.perf?'On':'Off'],['Reduce motion',S.rm?'On':'Off']];
   h='<div class="kv">'+K.map(function(x){return'<div><span>'+x[0]+'</span><b>'+esc(x[1])+'</b></div>'}).join('')+'</div>'}
  if(h!==lastH){lastH=h;var sc=body.scrollTop;body.innerHTML=h;body.scrollTop=sc}
  root.querySelectorAll('.tab button').forEach(function(b){b.classList.toggle('on',b.dataset.t===tab)})}
 root.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.t){tab=b.dataset.t;lastH='';view();return}
  var a=b.dataset.a,row=b.closest('.r'),k=row&&row.dataset.k,p=k&&W[k];
  if(a==='show'&&p){try{showW(p)}catch(x){}}else if(a==='min'&&p){try{minW(p)}catch(x){}}else if(a==='end'&&k){try{closeW(k)}catch(x){}}
  else if(a==='stopm'){try{NXMZ.au.pause()}catch(x){}}
  else if(a==='perf'){try{setPerf(!S.perf)}catch(x){}}
  else if(a==='clean'){var n=0;procs().forEach(function(q){if(q.min&&q.w!==w){try{closeW(q.k);n++}catch(x){}}});say(n?('Closed '+n+' minimized app'+(n>1?'s':'')):'No minimized apps')}
  setTimeout(function(){lastH='';view()},120)});
 var t=setInterval(function(){if(!alive||!root.isConnected)return;view()},1000);
 w.onclose=function(){alive=false;clearInterval(t);stopS()};
 view()}
A[ID]=Object.assign(A[ID]||{},{n:(A[ID]&&A[ID].n)||'Task Manager',g:(A[ID]&&A[ID].g)||'linear-gradient(155deg,#37d6a0,#0e7c86)',w:820,h:560,f:appTM,kw:'task manager processes performance cpu memory end task'});
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
})();

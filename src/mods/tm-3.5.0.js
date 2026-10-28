/* TASKMGR-3.5.0 - new Task Manager: Processes, Performance, App history, Startup apps, Details.
   Replaces the UI of the old appTask at runtime (no change in src/index.html). On any error the old UI is used. */
(function(){'use strict';
var B=document.body,K='taskmgr';
function calm(){return B.classList.contains('perf')||B.classList.contains('rm')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function jget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function rnd(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function pad(n){return n<10?'0'+n:''+n}
function fPct(v){return v<.05?'0%':(v<10?v.toFixed(1):Math.round(v))+'%'}
function fMem(v){return v>=1024?(v/1024).toFixed(2)+' GB':(v>=100?Math.round(v):v.toFixed(1))+' MB'}
function fRate(v,u){return (v<.05?'0':v<10?v.toFixed(1):Math.round(v))+' '+u}
function fTime(ms){var s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return (d?d+':':'')+pad(h)+':'+pad(m)+':'+pad(s%60)}
function fCpuT(s){return s<60?s.toFixed(1)+' s':s<3600?(s/60).toFixed(1)+' min':(s/3600).toFixed(1)+' h'}
function fAgo(t){if(!t)return '\u2014';var s=(Date.now()-t)/1000;return s<60?'Just now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':Math.floor(s/86400)+' d ago'}
function heat(v,max){var a=Math.sqrt(clamp(v/max,0,1));return a<.03?'transparent':'hsla('+Math.round(50-a*44)+',95%,52%,'+(.1+a*.5).toFixed(2)+')'}
function cp(s){try{navigator.clipboard.writeText(s)}catch(e){}if(typeof toast==='function')toast('Copied: '+s)}

/* ---------- css ---------- */
var st=document.createElement('style');st.textContent=`
.tm5{position:absolute;inset:0;display:flex;flex-direction:column;--rh:34px;font:12.5px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--txt,#e8ecf4);-webkit-user-select:none;user-select:none;overflow:hidden;outline:0}
.tm5 *{box-sizing:border-box}.tm5 button,.tm5 input{font:inherit;color:inherit}
.tm5 .hd{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;flex:none}
.tm5 .tabs{position:relative;display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;padding-bottom:5px}.tm5 .tabs::-webkit-scrollbar{display:none}
.tm5 .tab{display:flex;align-items:center;gap:7px;height:32px;padding:0 12px;border:0;border-radius:9px;background:none;color:var(--mut,#8b93a7);cursor:pointer;white-space:nowrap;flex:none;transition:background .18s,color .18s}
.tm5 .tab svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.tm5 .tab:hover{background:var(--hov,rgba(128,128,128,.14))}.tm5 .tab.on{color:var(--txt,#e8ecf4);background:var(--hov,rgba(128,128,128,.16))}
.tm5 .ind{position:absolute;left:0;bottom:0;height:2px;width:20px;border-radius:2px;background:var(--acc,#4f7cff);transition:transform .34s cubic-bezier(.2,.9,.3,1),width .34s cubic-bezier(.2,.9,.3,1)}
.tm5 .srch{display:flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:16px;background:rgba(128,128,128,.15);flex:0 1 190px;min-width:90px;transition:background .2s,box-shadow .2s}
.tm5 .srch:focus-within{background:rgba(128,128,128,.22);box-shadow:0 0 0 2px var(--acc,#4f7cff)}
.tm5 .srch svg{width:15px;height:15px;fill:none;stroke:var(--mut,#8b93a7);stroke-width:2;stroke-linecap:round;flex:none}
.tm5 .srch input{flex:1;min-width:0;border:0;background:none;outline:0}
.tm5 .btn{height:30px;padding:0 14px;border:0;border-radius:9px;background:var(--acc,#4f7cff);color:#fff;cursor:pointer;white-space:nowrap;transition:opacity .2s,transform .15s,background .2s}
.tm5 .btn:active{transform:scale(.96)}.tm5 .btn:disabled{opacity:.4;pointer-events:none}.tm5 .btn.sec{background:rgba(128,128,128,.2);color:var(--txt,#e8ecf4)}.tm5 .btn.sec:hover{background:rgba(128,128,128,.3)}
.tm5 .pn{position:relative;flex:1;min-height:0}
.tm5 .pane{position:absolute;inset:0;display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateX(var(--sx,18px));transition:opacity .22s ease,transform .32s cubic-bezier(.2,.9,.3,1),visibility 0s .32s}
.tm5 .pane.on{opacity:1;visibility:visible;transform:none;transition:opacity .24s ease,transform .34s cubic-bezier(.2,.9,.3,1),visibility 0s}
.tm5 .ft{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;border-top:1px solid var(--line,rgba(128,128,128,.22));flex:none;color:var(--mut,#8b93a7)}
.tm5 .ft b{color:var(--txt,#e8ecf4);font-weight:500;margin:0 10px 0 3px}
.tm5 .bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 12px;color:var(--mut,#8b93a7);flex:none}
.tm5 .tbl{display:flex;flex-direction:column;flex:1;min-height:0}
.tm5 .th,.tm5 .r:not(.g){display:grid;grid-template-columns:var(--gt)}
.tm5 .th{padding-right:var(--sb,0);border-bottom:1px solid var(--line,rgba(128,128,128,.22));flex:none}
.tm5 .th .c{display:flex;flex-direction:column;justify-content:flex-end;min-height:46px;padding:4px 10px;cursor:pointer;gap:1px;transition:background .15s}
.tm5 .th .c:hover{background:var(--hov,rgba(128,128,128,.14))}.tm5 .th .c.rt{align-items:flex-end}
.tm5 .th .c b{font-weight:500;font-size:12px;color:var(--mut,#8b93a7);white-space:nowrap}
.tm5 .th .c.as b:after{content:" \\25B2";font-size:8px}.tm5 .th .c.ds b:after{content:" \\25BC";font-size:8px}
.tm5 .th .c i{font-style:normal;font-size:16px;line-height:1.1}.tm5 .th .c i:empty{display:none}
.tm5 .tl{position:relative;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-gutter:stable}
.tm5 .r{height:var(--rh);overflow:hidden;border-bottom:1px solid rgba(128,128,128,.09);cursor:default;transition:background .15s}
.tm5 .r:hover{background:var(--hov,rgba(128,128,128,.12))}.tm5 .r.sel{background:rgba(79,124,255,.2);box-shadow:inset 3px 0 var(--acc,#4f7cff)}
.tm5 .r .c{display:flex;align-items:center;height:100%;padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background-color .7s ease;min-width:0}
.tm5 .r .c.rt{justify-content:flex-end}
.tm5 .r.g{display:flex;align-items:center;background:rgba(128,128,128,.08);font-weight:600;cursor:pointer}.tm5 .r.g .c{gap:7px}.tm5 .r.g small{font-weight:400;color:var(--mut,#8b93a7)}
.tm5 .chv{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;transform:rotate(90deg);transition:transform .22s cubic-bezier(.2,.9,.3,1)}.tm5 .r.g.cl .chv{transform:none}
.tm5 .nm{display:flex;align-items:center;gap:9px;min-width:0}.tm5 .nt{overflow:hidden;text-overflow:ellipsis}.tm5 .nd{color:var(--mut,#8b93a7);font-size:11.5px;margin-left:8px}
.tm5 .tmi{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;flex:none;color:#fff;background:linear-gradient(135deg,#4f7cff,#8b5cf6)}.tm5 .tmi svg{width:13px!important;height:13px!important}
.tm5 .tmi.sy{background:#5b6478}.tm5 .sl{color:#e6a817;font-style:normal;font-size:11px}
.tm5 .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;flex:none;background:#3ec46d}.tm5 .dot.wn{background:#e6a817}.tm5 .dot.of{background:#8b93a7}
.tm5 .r.new{animation:tmNew .55s cubic-bezier(.2,.9,.3,1) backwards}.tm5 .r.rp{animation:tmIn .4s cubic-bezier(.2,.9,.3,1) backwards}
.tm5 .r.out{animation:tmOut .3s ease forwards;pointer-events:none}.tm5 .r.end{animation:tmEnd .48s cubic-bezier(.5,0,.75,.3) forwards;pointer-events:none}.tm5 .r.end .nt{text-decoration:line-through;text-decoration-color:#ff5a5a}
.tm5 .r.shk{animation:tmShk .42s}
@keyframes tmIn{from{opacity:0;transform:translateY(10px)}}
@keyframes tmNew{0%{opacity:0;transform:translateX(-14px);background:rgba(79,124,255,.4)}100%{opacity:1;transform:none}}
@keyframes tmOut{to{opacity:0;height:0;transform:translateX(-18px)}}
@keyframes tmEnd{0%{background-color:transparent}15%{background-color:rgba(255,72,72,.42);height:var(--rh)}55%{background-color:rgba(255,72,72,.26);opacity:1;transform:none;height:var(--rh)}100%{opacity:0;transform:translateX(48px);height:0;background-color:rgba(255,72,72,0)}}
@keyframes tmShk{0%,100%{background-color:rgba(255,72,72,.3)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.tm5 .pf{display:flex;flex:1;min-height:0;gap:12px;padding:12px}
.tm5 .pl{display:flex;flex-direction:column;gap:6px;width:210px;flex:none;overflow:auto}
.tm5 .rc{display:flex;gap:10px;align-items:center;padding:8px;border-radius:12px;border:1px solid transparent;cursor:pointer;flex:none;transition:background .2s,border-color .2s}
.tm5 .rc:hover{background:var(--hov,rgba(128,128,128,.12))}.tm5 .rc.on{background:rgba(128,128,128,.14);border-color:var(--rcc)}
.tm5 .rc canvas{width:64px;height:44px;flex:none;border-radius:6px;border:1px solid var(--rcc)}
.tm5 .rc .ri{min-width:0;display:flex;flex-direction:column;gap:2px}.tm5 .rc .ri b{font-weight:500;font-size:13px}.tm5 .rc .ri span{color:var(--mut,#8b93a7);font-size:11.5px;white-space:nowrap}
.tm5 .pr{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;overflow:auto}
.tm5 .pt{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}.tm5 .pt h2{margin:0;font-size:21px;font-weight:500}.tm5 .pt span{color:var(--mut,#8b93a7)}
.tm5 .big{width:100%;height:clamp(120px,32vh,270px);flex:none;border-radius:12px;border:1px solid var(--rcc);background:rgba(128,128,128,.06)}
.tm5 .cores{display:none;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}.tm5 .cores canvas{width:100%;height:38px;border-radius:7px;border:1px solid var(--rcc);background:rgba(128,128,128,.05)}
.tm5 .sts{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px 16px}.tm5 .st span{display:block;color:var(--mut,#8b93a7);font-size:11.5px}.tm5 .st b{font-size:19px;font-weight:400}
.tm5.nr .pf{flex-direction:column}.tm5.nr .pl{width:auto;flex-direction:row;overflow-x:auto}.tm5.nr .rc{min-width:170px}
.tm5.xs .tab span{display:none}.tm5.xs .tab.on span{display:inline}.tm5.xs .run span{display:none}.tm5.xs .ft .xh{display:none}
.tm5ctx{position:fixed;z-index:9600;min-width:190px;max-height:62vh;overflow:auto;padding:6px;border-radius:12px;background:var(--pn,var(--surf,#1d2130));color:var(--txt,#e8ecf4);border:1px solid var(--line,rgba(128,128,128,.3));box-shadow:var(--pop-sh,0 14px 40px rgba(0,0,0,.45));font:13px system-ui,sans-serif;opacity:0;transform:scale(.94) translateY(-4px);transform-origin:top left;transition:opacity .14s,transform .2s cubic-bezier(.2,.9,.3,1.2)}
.tm5ctx.on{opacity:1;transform:none}.tm5ctx button{display:block;width:100%;padding:8px 11px;border:0;border-radius:8px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.tm5ctx button:hover{background:var(--hov,rgba(128,128,128,.18))}.tm5ctx button.dg{color:#ff6b6b}.tm5ctx button:disabled{opacity:.4}.tm5ctx .sp{height:1px;margin:5px 6px;background:var(--line,rgba(128,128,128,.3))}
html[data-skin="glass"] .tm5ctx{backdrop-filter:blur(26px) saturate(1.5);-webkit-backdrop-filter:blur(26px) saturate(1.5)}
body.perf .tm5 *,body.rm .tm5 *,body.perf .tm5ctx,body.rm .tm5ctx{animation-duration:.01s!important;transition-duration:.01s!important}
`;
document.head.appendChild(st);

/* ---------- icons / app info ---------- */
var GEAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>';
var DEF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 9h16"/></svg>';
var ICO={proc:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',perf:'<svg viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',hist:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',start:'<svg viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',det:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/></svg>',srch:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'};
var TABS=[['proc','Processes'],['perf','Performance'],['hist','App history'],['start','Startup apps'],['det','Details']];
function appMeta(id){try{return A[id]||{}}catch(e){return{}}}
function appName(id){var a=appMeta(id),n=a.n||a.name||a.title||a.t;return typeof n==='string'&&n?n:String(id).charAt(0).toUpperCase()+String(id).slice(1)}
function tile(id,sys){var a=appMeta(id),s='',bg='';try{var ic=typeof IC!=='undefined'?IC[id]:null;if(typeof ic==='string'&&ic.indexOf('<svg')>-1)s=ic}catch(e){}
 if(typeof a.g==='string'&&/gradient|#|rgb/i.test(a.g))bg=a.g;if(sys||!id)bg='';
 return '<span class="tmi'+(sys||!id?' sy':'')+'"'+(bg?' style="background:'+esc(bg)+'"':'')+'>'+(s||(sys||!id?GEAR:DEF))+'</span>'}
function userName(){try{return localStorage.getItem('aur.user')||'User'}catch(e){return 'User'}}

/* ---------- data model (real windows + simulated metrics) ---------- */
var CORES=clamp(navigator.hardwareConcurrency||4,1,16),DEVMEM=clamp(navigator.deviceMemory||4,1,16)*1024;
var P={},DEAD={},REAL={},STO={usage:0,quota:0},H=jget('aur.tmh',{}),COL=jget('aur.tmcol',{}),SEL=null,pidSeq=3000,T0=Date.now(),lastS=0,lastSave=0;
var NC=Math.min(CORES,12);
function zeros(){var a=[];for(var i=0;i<61;i++)a.push(0);return a}
var S={cpu:0,mem:0,total:DEVMEM,memPct:0,disk:0,diskPct:0,net:0,netD:0,netU:0,t:0,iv:1000,k:0,n:0,th:0,h:{cpu:zeros(),mem:zeros(),disk:zeros(),net:zeros()},mx:{net:8},ch:[]};
for(var ci=0;ci<NC;ci++)S.ch.push(zeros());
if(!jget('aur.tmhs',0))jset('aur.tmhs',Date.now());
try{navigator.storage.estimate().then(function(e){STO.usage=e.usage||0;STO.quota=e.quota||0})}catch(e){}
var BGD=[['System','NexOS kernel and core services','sys',.5,14,.05,0,4,1],['NexOS Desktop','Desktop shell and icons','sys',1.1,96,.1,0,812,1],['Window Manager','Window compositor','sys',.9,38,.05,0,1184,1],['Taskbar & Dock','Taskbar, tray and Start menu','sys',.5,26,.02,0,1220,1],
['Virtual Mouse','Virtual pointer service','bg',.3,12,0,0,1301,0],['Audio Service','Audio mixer and playback','bg',.2,18,.02,0,1342,0],['Network Service','Connectivity and tray status','bg',.3,21,.01,.06,1377,0],['File Indexer','Search index for Start and Files','bg',.35,46,.45,0,1410,0],
['Notification Center','Toasts and quick settings','bg',.1,15,0,0,1456,0],['Theme Engine','Themes and Liquid Glass renderer','bg',.15,22,0,0,1490,0],['Update Service','Checks for NexOS updates','bg',.05,9,0,.03,1522,0]];
function mkBg(d){return{key:'b:'+d[0],def:d,pid:d[7]+(d[8]?0:Math.round(rnd(0,3))*4),name:d[0],desc:d[1],type:d[2],cpu:d[3],mem:d[4],disk:d[5],net:d[6],base:{cpu:d[3],mem:d[4],disk:d[5],net:d[6]},thr:Math.round(rnd(6,40)),locked:!!d[8],t0:T0,st:'Running',user:d[2]==='sys'?'SYSTEM':'LOCAL SERVICE'}}
var AB={browser:[8,260],vscode:[7,320],exe:[22,420],term:[1.2,48],music:[2.5,90],files:[2,110],photos:[2,130],media:[4,150],calc:[.4,34],code:[3,88],notepad:[.5,30],settings:[.8,70],taskmgr:[1.5,52],zip:[1,40]};
function mkApp(k,w){var id=w.app||k,b=AB[id]||[1.2,60+Math.round(rnd(0,40))];return{key:k,app:id,pid:(pidSeq+=4+Math.round(rnd(0,24))),name:appName(id),desc:'Application window',type:'app',cpu:0,mem:b[1]*rnd(.85,1.1),disk:0,net:0,base:{cpu:b[0],mem:b[1],disk:id==='files'?1.2:.2,net:id==='browser'?3:id==='music'?.8:.05},thr:Math.round(rnd(10,36)),t0:Date.now(),st:'Running',user:userName()}}
function mkH(){return{cpuS:0,net:0,launches:0,last:0}}
function evolve(p){var b=p.base,f=p.type==='app'?(p.top?1.7:p.min?.12:.6):1;
 if(p.tc==null||Math.random()<.2){p.tc=rnd(.35,1.6);p.td=Math.random()<.18?rnd(1.5,5):rnd(.1,.9);p.tn=Math.random()<.2?rnd(1.5,5):rnd(.1,1.2)}
 var sp=Math.random()<.03?rnd(1,3)*b.cpu:0;
 p.cpu=Math.max(0,p.cpu+((b.cpu*p.tc*f+sp)-p.cpu)*.45);p.disk=Math.max(0,p.disk+(b.disk*p.td-p.disk)*.45);p.net=Math.max(0,p.net+(b.net*p.tn*(p.min?.3:1)-p.net)*.45);
 p.mem=clamp(p.mem+rnd(-.5,.7)*(p.type==='app'?1:.3)*(b.mem/60),b.mem*.85,b.mem*(p.type==='app'?1.8:1.25));
 if(p.name==='NexOS Desktop'&&performance.memory)p.mem=b.mem+performance.memory.usedJSHeapSize/1048576}
function push(a,v){a.push(v);if(a.length>61)a.shift()}
function sample(seed){var now=Date.now(),dt=lastS?Math.min((now-lastS)/1000,5):1;lastS=now;
 var ks=[],seen={},topZ=-1,topK=null;try{if(typeof W!=='undefined'&&W)ks=Object.keys(W)}catch(e){}
 var live=function(w){return w&&w.el&&w.el.classList&&!w.el.classList.contains('closing')};
 ks.forEach(function(k){var w=W[k];if(!live(w))return;var z=parseInt(w.el.style.zIndex,10)||0;if(!w.el.classList.contains('min')&&z>=topZ){topZ=z;topK=k}});
 ks.forEach(function(k){var w=W[k];if(!live(w)||(DEAD[k]&&now-DEAD[k]<1500))return;seen[k]=1;var p=P[k]||(P[k]=mkApp(k,w));p.min=w.el.classList.contains('min');p.top=k===topK;p.st=p.min?'Suspended':'Running'});
 Object.keys(P).forEach(function(k){if(P[k].type==='app'&&!seen[k])delete P[k]});
 BGD.forEach(function(d){if(!P['b:'+d[0]]&&!(DEAD['b:'+d[0]]))P['b:'+d[0]]=mkBg(d)});
 var c=0,m=0,dk=0,nn=0,th=0,n=0;
 Object.keys(P).forEach(function(k){var p=P[k];evolve(p);c+=p.cpu;m+=p.mem;dk+=p.disk;nn+=p.net;th+=p.thr;n++;
  if(!seed&&p.type==='app'){var h=H[p.app]||(H[p.app]=mkH());h.cpuS+=p.cpu/100*CORES*dt;h.net+=p.net/8*dt}});
 S.n=n;S.th=th;S.cpu=clamp(c+rnd(0,.5),0,100);
 var tot=REAL.total||DEVMEM,used=REAL.total&&REAL.avail?REAL.total-REAL.avail:DEVMEM*.26+m;
 S.total=tot;S.mem=clamp(used,0,tot);S.memPct=S.mem/tot*100;S.disk=dk;S.diskPct=clamp(dk/40*100,0,100);S.net=nn;S.netD=nn*.82;S.netU=nn*.18;
 push(S.h.cpu,S.cpu);push(S.h.mem,S.memPct);push(S.h.disk,S.diskPct);push(S.h.net,S.net);
 for(var i=0;i<NC;i++)push(S.ch[i],clamp(S.cpu*rnd(.55,1.45)+rnd(-2,2),0,100));
 var pk=0;S.h.net.forEach(function(v){if(v>pk)pk=v});S.mx.net+=(Math.max(5,pk*1.3)-S.mx.net)*.25;
 S.t=performance.now();S.iv=calm()?2000:1000;S.k++;
 if(!seed&&now-lastSave>20000){lastSave=now;jset('aur.tmh',H)}}
function toMB(v,b,k){return v>b?v/1048576:v>k?v/1024:v}
function readReal(){try{if(!window.NF||!NF.sysInfo)return;Promise.resolve(NF.sysInfo()).then(function(r){if(!r)return;var t=0,a=0,ps=0;Object.keys(r).forEach(function(k){var v=r[k];if(typeof v!=='number'||!isFinite(v))return;
 if(/(mem|ram)/i.test(k)&&/total/i.test(k))t=toMB(v,1e8,1e5);else if(/(mem|ram)/i.test(k)&&/(avail|free)/i.test(k))a=toMB(v,1e8,1e5);else if(/pss/i.test(k))ps=toMB(v,5e7,5e4)});
 REAL.total=t;REAL.avail=a;REAL.pss=ps}).catch(function(){})}catch(e){}}

/* ---------- context menu ---------- */
var CM=null;
function closeMenu(){if(CM){var m=CM;CM=null;m.classList.remove('on');setTimeout(function(){m.remove()},170)}}
function menu(x,y,items){closeMenu();var m=document.createElement('div');m.className='tm5ctx';
 items.forEach(function(it){if(it==='-'){var s=document.createElement('div');s.className='sp';m.appendChild(s);return}var b=document.createElement('button');b.textContent=it.t;if(it.d)b.className='dg';if(it.off)b.disabled=true;b.onclick=function(e){e.stopPropagation();closeMenu();it.f()};m.appendChild(b)});
 B.appendChild(m);var r=m.getBoundingClientRect();m.style.left=Math.max(6,Math.min(x,innerWidth-r.width-6))+'px';m.style.top=Math.max(6,Math.min(y,innerHeight-r.height-6))+'px';requestAnimationFrame(function(){m.classList.add('on')});CM=m}
addEventListener('pointerdown',function(e){if(CM&&!CM.contains(e.target))closeMenu()},true);
addEventListener('blur',closeMenu);

/* ---------- generic table (keyed rows, FLIP reorder, enter/leave animations) ---------- */
function Table(host,cols,o){var t=this;t.o=o||{};t.cols=cols.map(function(c){return Object.assign({},c)});t.byId={};t.cols.forEach(function(c){t.byId[c.id]=c});
 t.sort={id:t.o.sortId||t.cols[0].id,dir:t.o.sortDir||1};t.els={};t.pfx=t.o.pfx||'';
 var r=t.root=document.createElement('div');r.className='tbl';r.innerHTML='<div class="th"></div><div class="tl"></div>';t.th=r.firstChild;t.tl=r.lastChild;
 t.cols.forEach(function(c){var d=document.createElement('div');d.className='c'+(c.rt?' rt':'');d.innerHTML='<b></b><i></i>';d.firstChild.textContent=c.label;d.onclick=function(){t.setSort(c.id)};c.th=d;t.th.appendChild(d)});
 t.mark();host.appendChild(r)}
Table.prototype.mark=function(){var t=this;t.cols.forEach(function(c){c.th.classList.toggle('as',t.sort.id===c.id&&t.sort.dir>0);c.th.classList.toggle('ds',t.sort.id===c.id&&t.sort.dir<0)})};
Table.prototype.setSort=function(id){var t=this;if(t.sort.id===id)t.sort.dir*=-1;else{t.sort.id=id;t.sort.dir=t.byId[id].str?1:-1}t.mark();if(t.o.onsort)t.o.onsort()};
Table.prototype.sorted=function(rows){var c=this.byId[this.sort.id],d=this.sort.dir;return rows.slice().sort(function(a,b){var x=c.val(a),y=c.val(b),r=typeof x==='string'?x.localeCompare(y):x-y;return (r||((a.pid||0)-(b.pid||0)))*d})};
Table.prototype.setTot=function(){this.cols.forEach(function(c){if(c.tot)c.th.lastChild.textContent=c.tot()})};
Table.prototype.markEnd=function(k){var e=this.els[this.pfx+k];if(e)e.__end=1};
Table.prototype.layout=function(w){var t=this,gt=[];t.cols.forEach(function(c,i){var h=!!c.min&&w<c.min;if(c.hid!==h){c.hid=h;var dp=h?'none':'';c.th.style.display=dp;Object.keys(t.els).forEach(function(k){var e=t.els[k];if(!e.__g&&e.children[i])e.children[i].style.display=dp})}if(!h)gt.push(c.w)});
 t.root.style.setProperty('--gt',gt.join(' '));t.root.style.setProperty('--sb',(t.tl.offsetWidth-t.tl.clientWidth)+'px')};
Table.prototype.mk=function(it){var t=this,e=document.createElement('div');
 if(it.hd){e.className='r g';e.__g=1;e.innerHTML='<div class="c"><svg class="chv" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg><span></span><small></small></div>';e.onclick=function(){if(t.o.ongrp)t.o.ongrp(e.__it.gk)};return e}
 e.className='r';t.cols.forEach(function(c){var d=document.createElement('div');d.className='c'+(c.rt?' rt':'');if(c.hid)d.style.display='none';e.appendChild(d)});
 function ctx(x,y){if(t.o.onctx){pickSel(e.__it.o.key);t.o.onctx(e.__it.o,x,y)}}
 e.onclick=function(){pickSel(e.__it.o.key)};e.ondblclick=function(){if(t.o.onopen)t.o.onopen(e.__it.o)};
 e.oncontextmenu=function(ev){ev.preventDefault();ctx(ev.clientX,ev.clientY)};
 e.onpointerdown=function(ev){if(ev.pointerType==='mouse')return;var x=ev.clientX,y=ev.clientY;clearTimeout(e.__lp);e.__sx=x;e.__sy=y;e.__lp=setTimeout(function(){ctx(x,y)},520)};
 e.onpointermove=function(ev){if(Math.abs(ev.clientX-e.__sx)+Math.abs(ev.clientY-e.__sy)>10)clearTimeout(e.__lp)};e.onpointerup=e.onpointercancel=function(){clearTimeout(e.__lp)};
 return e};
Table.prototype.fill=function(e,it){var t=this;e.__it=it;
 if(it.hd){var g=e.firstChild;g.children[1].textContent=it.label;g.children[2].textContent='('+it.n+')';e.classList.toggle('cl',!it.open);return}
 var o=it.o,i,c,d,s,h;for(i=0;i<t.cols.length;i++){c=t.cols[i];d=e.children[i];s=c.get(o);if(d.__s!==s){if(c.html)d.innerHTML=s;else d.textContent=s;d.__s=s}
  if(c.heat){h=c.heat(o);if(d.__h!==h){d.style.backgroundColor=h;d.__h=h}}}
 e.classList.toggle('sel',SEL!=null&&o.key===SEL);
 if(e.__nt){e.__nt=0;setTimeout(function(){e.classList.remove('new')},700)}};
Table.prototype.paintSel=function(){Object.keys(this.els).forEach(function(k){var e=this.els[k];if(!e.__g)e.classList.toggle('sel',!!(SEL!=null&&e.__it&&e.__it.o&&e.__it.o.key===SEL))},this)};
Table.prototype.update=function(items){var t=this,tl=t.tl,anim=!calm(),before={},seen={},cur;
 Object.keys(t.els).forEach(function(k){before[k]=t.els[k].offsetTop});
 cur=tl.firstChild;while(cur&&cur.__lv)cur=cur.nextSibling;
 items.forEach(function(it){seen[it.key]=1;var e=t.els[it.key];if(!e){e=t.els[it.key]=t.mk(it);if(anim&&t.shown){e.classList.add('new');e.__nt=1}}
  t.fill(e,it);if(e===cur){cur=cur.nextSibling;while(cur&&cur.__lv)cur=cur.nextSibling}else tl.insertBefore(e,cur)});
 Object.keys(t.els).forEach(function(k){if(seen[k])return;var e=t.els[k];delete t.els[k];if(!anim||!t.shown){e.remove();return}
  e.__lv=1;e.classList.remove('new');e.classList.add(e.__end?'end':'out');setTimeout(function(){e.remove()},e.__end?500:320)});
 if(anim&&t.shown)Object.keys(before).forEach(function(k){var e=t.els[k];if(!e||!e.animate)return;var d=before[k]-e.offsetTop;if(Math.abs(d)>2)e.animate([{transform:'translateY('+d+'px)'},{transform:'none'}],{duration:340,easing:'cubic-bezier(.2,.9,.3,1)'})});
 t.shown=1};
Table.prototype.replay=function(){if(calm())return;var t=this,i=0,rows=[].filter.call(t.tl.children,function(e){return !e.__lv});
 rows.forEach(function(e){e.classList.remove('rp');e.style.animationDelay=Math.min(i++*16,320)+'ms'});void t.tl.offsetWidth;rows.forEach(function(e){e.classList.add('rp')});
 setTimeout(function(){rows.forEach(function(e){e.classList.remove('rp');e.style.animationDelay=''})},800)};

/* ---------- columns ---------- */
function nameH(p){return '<span class="nm">'+tile(p.type==='app'?p.app:'',p.type!=='app')+'<span class="nt">'+esc(p.name)+'</span>'+(p.min?'<em class="sl" title="Suspended">&#10070;</em>':'')+'</span>'}
function stH(p){return '<span class="dot '+(p.min?'wn':'ok')+'"></span>'+esc(p.st)}
function cCpu(){return{id:'cpu',label:'CPU',w:'80px',rt:1,val:function(p){return p.cpu},get:function(p){return fPct(p.cpu)},heat:function(p){return heat(p.cpu,40)},tot:function(){return fPct(S.cpu)}}}
function cMem(){return{id:'mem',label:'Memory',w:'94px',rt:1,val:function(p){return p.mem},get:function(p){return fMem(p.mem)},heat:function(p){return heat(p.mem,600)},tot:function(){return Math.round(S.memPct)+'%'}}}
function colsProc(){var d=cCpu(),m=cMem();return [{id:'name',label:'Name',w:'minmax(150px,1.7fr)',html:1,str:1,val:function(p){return p.name.toLowerCase()},get:nameH},
 {id:'st',label:'Status',w:'104px',min:620,html:1,str:1,val:function(p){return p.st},get:stH},d,m,
 {id:'disk',label:'Disk',w:'92px',min:480,rt:1,val:function(p){return p.disk},get:function(p){return fRate(p.disk,'MB/s')},heat:function(p){return heat(p.disk,6)},tot:function(){return fPct(S.diskPct)}},
 {id:'net',label:'Network',w:'98px',min:400,rt:1,val:function(p){return p.net},get:function(p){return fRate(p.net,'Mbps')},heat:function(p){return heat(p.net,8)},tot:function(){return fRate(S.net,'Mbps')}}]}
function colsDet(){return [{id:'name',label:'Name',w:'minmax(150px,1.5fr)',html:1,str:1,val:function(p){return p.name.toLowerCase()},get:nameH},
 {id:'pid',label:'PID',w:'64px',min:380,rt:1,val:function(p){return p.pid},get:function(p){return String(p.pid)}},
 {id:'st',label:'Status',w:'100px',min:560,html:1,str:1,val:function(p){return p.st},get:stH},
 {id:'user',label:'User',w:'110px',min:760,str:1,val:function(p){return p.user},get:function(p){return p.user}},cCpu(),cMem(),
 {id:'thr',label:'Threads',w:'76px',min:680,rt:1,val:function(p){return p.thr},get:function(p){return String(p.thr)}},
 {id:'up',label:'Up time',w:'92px',min:860,rt:1,val:function(p){return -p.t0},get:function(p){return fTime(Date.now()-p.t0)}},
 {id:'desc',label:'Description',w:'minmax(120px,1.2fr)',min:980,str:1,val:function(p){return p.desc},get:function(p){return p.desc}}]}
function colsHist(){return [{id:'name',label:'Name',w:'minmax(150px,1.6fr)',html:1,str:1,val:function(p){return p.name.toLowerCase()},get:nameH},
 {id:'cpuT',label:'CPU time',w:'110px',rt:1,val:function(p){return p.cpuS},get:function(p){return fCpuT(p.cpuS)}},
 {id:'net',label:'Network',w:'100px',min:420,rt:1,val:function(p){return p.net},get:function(p){return p.net<1?(p.net*1024).toFixed(0)+' KB':p.net.toFixed(1)+' MB'}},
 {id:'launches',label:'Launches',w:'90px',min:520,rt:1,val:function(p){return p.launches},get:function(p){return String(p.launches)}},
 {id:'last',label:'Last used',w:'110px',min:600,rt:1,val:function(p){return p.last},get:function(p){return fAgo(p.last)}}]}
var STU=[['NexOS Desktop',420],['Taskbar & Dock',210],['Window Manager',180],['File Indexer',320],['Network Service',130],['Audio Service',90],['Notification Center',60],['Theme Engine',45],['Virtual Mouse',15],['Update Service',25]];
var ST=jget('aur.tmst',{});
function impact(ms){return ms>300?'High':ms>120?'Medium':ms>0?'Low':'None'}
function colsStart(){return [{id:'name',label:'Name',w:'minmax(150px,1.6fr)',html:1,str:1,val:function(p){return p.name.toLowerCase()},get:nameH},
 {id:'pub',label:'Publisher',w:'100px',min:560,str:1,val:function(p){return p.pub},get:function(p){return p.pub}},
 {id:'en',label:'Status',w:'100px',html:1,str:1,val:function(p){return p.en?'Enabled':'Disabled'},get:function(p){return '<span class="dot '+(p.en?'ok':'of')+'"></span>'+(p.en?'Enabled':'Disabled')}},
 {id:'imp',label:'Startup impact',w:'120px',min:460,str:1,val:function(p){return p.ms},get:function(p){return p.en?impact(p.ms):'Not measured'}},
 {id:'ms',label:'Startup time',w:'100px',min:600,rt:1,val:function(p){return p.ms},get:function(p){return p.en?p.ms+' ms':'\u2014'}}]}

/* ---------- graphs ---------- */
var RES=[{id:'cpu',name:'CPU',color:'#3b9eff'},{id:'mem',name:'Memory',color:'#a96bff'},{id:'disk',name:'Disk',color:'#3ec46d'},{id:'net',name:'Network',color:'#ff9a3d'}];
function maxOf(id){return id==='net'?S.mx.net:100}
function draw(cv,data,max,color,ph,fa,lw,grid){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;var dpr=Math.min(window.devicePixelRatio||1,2),w2=Math.round(w*dpr),h2=Math.round(h*dpr);
 if(cv.width!==w2||cv.height!==h2){cv.width=w2;cv.height=h2}
 var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);var n=data.length;if(n<3)return;var step=w/58,i;
 if(grid){g.strokeStyle='rgba(128,128,128,.2)';g.lineWidth=1;g.beginPath();for(i=1;i<4;i++){var y=Math.round(h*i/4)+.5;g.moveTo(0,y);g.lineTo(w,y)}
  var off=((S.k%6)+ph)*step;for(var x=w-off;x>0;x-=step*6){g.moveTo(Math.round(x)+.5,0);g.lineTo(Math.round(x)+.5,h)}g.stroke()}
 function yv(v){return h-1-clamp(v/max,0,1)*(h-3)}
 var pts=[];for(i=0;i<n-1;i++)pts.push([w-((n-2-i)+ph)*step,yv(data[i])]);pts.push([w,yv(data[n-2]+(data[n-1]-data[n-2])*ph)]);
 g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(i=1;i<pts.length-1;i++){g.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2)}
 var L=pts[pts.length-1];g.lineTo(L[0],L[1]);g.lineWidth=lw;g.strokeStyle=color;g.lineJoin='round';g.stroke();
 g.lineTo(w,h);g.lineTo(pts[0][0],h);g.closePath();var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,color+fa);gr.addColorStop(1,color+'00');g.fillStyle=gr;g.fill()}
function connInfo(){return navigator.connection||navigator.mozConnection||{}}
function connType(){var c=connInfo();return c.type==='cellular'?'Mobile data'+(c.effectiveType?' \u00B7 '+c.effectiveType.toUpperCase():''):navigator.onLine===false?'Offline':'Wi-Fi / network'}
function appMem(){return REAL.pss||(performance.memory?performance.memory.usedJSHeapSize/1048576:0)}
function statDefs(id){var c=connInfo();
 if(id==='cpu')return [['Utilization',fPct(S.cpu)],['Speed',(1.1+S.cpu/100*1.7).toFixed(2)+' GHz'],['Processes',String(S.n)],['Threads',String(S.th)],['Handles',String(Math.round(S.th*23.4))],['Cores',String(CORES)],['Up time',fTime(performance.now())]];
 if(id==='mem'){var am=appMem();return [['In use',fMem(S.mem)],['Available',fMem(S.total-S.mem)],['Total',fMem(S.total)],['Cached',fMem(S.total*.12+S.mem*.05)],['NexOS app',am?fMem(am):'\u2014'],['Usage',Math.round(S.memPct)+'%']]}
 if(id==='disk')return [['Active time',fPct(S.diskPct)],['Read speed',fRate(S.disk*.62,'MB/s')],['Write speed',fRate(S.disk*.38,'MB/s')],['Storage used',STO.quota?fMem(STO.usage/1048576):'\u2014'],['Storage quota',STO.quota?fMem(STO.quota/1048576):'\u2014']];
 return [['Send',fRate(S.netU,'Mbps')],['Receive',fRate(S.netD,'Mbps')],['Connection',connType()],['Latency',c.rtt!=null?c.rtt+' ms':'\u2014'],['Link speed',c.downlink?c.downlink+' Mbps':'\u2014'],['State',navigator.onLine===false?'Offline':'Connected']]}
function subTxt(id){return id==='cpu'?'NexOS virtual processor \u00B7 '+CORES+' cores':id==='mem'?fMem(S.total)+' RAM':id==='disk'?'Internal storage':connType()}
function cardTxt(id){return id==='cpu'?fPct(S.cpu)+'  '+(1.1+S.cpu/100*1.7).toFixed(2)+' GHz':id==='mem'?(S.mem/1024).toFixed(1)+'/'+(S.total/1024).toFixed(1)+' GB ('+Math.round(S.memPct)+'%)':id==='disk'?fRate(S.disk,'MB/s')+'  '+fPct(S.diskPct):'S '+fRate(S.netU,'')+'R '+fRate(S.netD,'Mbps')}

/* ---------- instances ---------- */
var INST=[],tm=0;
function vis(i){return !document.hidden&&!B.classList.contains('hid')&&!(i.w&&i.w.el&&i.w.el.classList.contains('min'))}
function loop(){INST=INST.filter(function(i){return i.root.isConnected});if(!INST.length){tm=0;return}
 var v=INST.filter(vis);if(v.length){sample();if(S.k%4===0)readReal();v.forEach(function(i){try{i.render()}catch(e){console.error('TASKMGR',e)}})}
 tm=setTimeout(loop,calm()?2000:1000)}
function pickSel(k){SEL=k;INST.forEach(function(i){i.paint()})}
function endTask(k){var p=P[k];if(!p)return;
 if(p.locked){if(typeof toast==='function')toast('Access denied: '+p.name+' is a protected system process.');INST.forEach(function(i){i.shake(k)});return}
 INST.forEach(function(i){i.mark(k)});DEAD[k]=Date.now();delete P[k];if(SEL===k)SEL=null;
 if(p.type==='app'){try{closeW(k)}catch(e){}}
 else{var d=p.def;DEAD[k]=1;setTimeout(function(){delete DEAD[k];if(!P[k])P[k]=mkBg(d)},7000);if(typeof toast==='function')toast(p.name+' was ended and restarts automatically.')}
 INST.forEach(function(i){i.render();i.paint()})}
function sw(p){try{var w=W[p.key];if(w)showW(w)}catch(e){}}
function bodyOf(w){var b=w&&w.el&&w.el.querySelector('.body');if(b)return b;return (w&&w.b instanceof Element&&w.b.classList.contains('body'))?w.b:null}

function build(w){
 if(w.el&&w.el.querySelector('.tm5'))return;
 var body=bodyOf(w);if(!body)throw new Error('window body not found');
 var root=document.createElement('div');root.className='tm5';root.tabIndex=0;
 root.innerHTML='<div class="hd"><div class="tabs">'+TABS.map(function(t){return '<button class="tab" data-t="'+t[0]+'">'+ICO[t[0]]+'<span>'+t[1]+'</span></button>'}).join('')+'<i class="ind"></i></div><label class="srch">'+ICO.srch+'<input type="text" placeholder="Search" spellcheck="false" autocomplete="off" aria-label="Search"></label><button class="btn sec run">+ <span>Run</span></button></div><div class="pn">'+TABS.map(function(t){return '<div class="pane" data-p="'+t[0]+'"></div>'}).join('')+'</div><div class="ft"><span class="sum"></span><button class="btn end" disabled>End task</button></div>';
 while(body.firstChild)body.removeChild(body.firstChild);
 body.style.padding='0';body.style.overflow='hidden';if(getComputedStyle(body).position==='static')body.style.position='relative';body.appendChild(root);
 function $(s){return root.querySelector(s)}
 var I={w:w,root:root,tab:'',res:jget('aur.tmres','cpu'),raf:0,fr:0,shown:0,stb:[]},inp=$('.srch input'),sum=$('.sum'),endB=$('.end'),tabs=[].slice.call(root.querySelectorAll('.tab')),ind=$('.ind'),pn={};
 TABS.forEach(function(t){pn[t[0]]=$('.pane[data-p="'+t[0]+'"]')});
 if(S.k===0)for(var s0=0;s0<45;s0++)sample(1);

 var tP=new Table(pn.proc,colsProc(),{sortId:'cpu',sortDir:-1,pfx:'p:',onsort:rn,onctx:ctxP,onopen:openP,ongrp:function(k){COL[k]=!COL[k];jset('aur.tmcol',COL);rn()}});
 var tD=new Table(pn.det,colsDet(),{sortId:'pid',sortDir:1,pfx:'d:',onsort:rn,onctx:ctxP,onopen:openP});
 pn.hist.insertAdjacentHTML('afterbegin','<div class="bar"><span class="hs"></span><button class="btn sec hdel">Delete usage history</button></div>');
 pn.start.insertAdjacentHTML('afterbegin','<div class="bar"><span>Changes apply the next time NexOS starts.</span></div>');
 var tH=new Table(pn.hist,colsHist(),{sortId:'cpuT',sortDir:-1,pfx:'h:',onsort:rn,onctx:ctxH});
 var tS=new Table(pn.start,colsStart(),{sortId:'name',sortDir:1,pfx:'s:',onsort:rn,onctx:ctxS,onopen:togStart});
 var tbls={proc:tP,det:tD,hist:tH,start:tS};
 $('.hs').textContent='Resource usage since '+new Date(jget('aur.tmhs',Date.now())).toLocaleDateString();
 $('.hdel').onclick=function(){H={};jset('aur.tmh',H);jset('aur.tmhs',Date.now());$('.hs').textContent='Resource usage since '+new Date().toLocaleDateString();rn()};

 /* performance pane */
 pn.perf.innerHTML='<div class="pf"><div class="pl">'+RES.map(function(r){return '<div class="rc" data-r="'+r.id+'" style="--rcc:'+r.color+'"><canvas></canvas><div class="ri"><b>'+r.name+'</b><span></span></div></div>'}).join('')+'</div><div class="pr"><div class="pt"><h2></h2><span></span></div><canvas class="big"></canvas><div class="cores"></div><div class="sts"></div></div></div>';
 var cards={},prEl=$('.pr'),big=$('.big'),coresEl=$('.cores'),stsEl=$('.sts'),h2=$('.pt h2'),psub=$('.pt span'),coreCv=[];
 [].forEach.call(root.querySelectorAll('.rc'),function(el){var id=el.dataset.r;cards[id]={el:el,cv:el.querySelector('canvas'),sub:el.querySelector('span')};el.onclick=function(){selRes(id)}});
 var cs='';for(var q=0;q<NC;q++)cs+='<canvas></canvas>';coresEl.innerHTML=cs;coreCv=[].slice.call(coresEl.children);
 function resObj(id){return RES.filter(function(r){return r.id===id})[0]||RES[0]}
 function selRes(id,first){I.res=id;jset('aur.tmres',id);var r=resObj(id);prEl.style.setProperty('--rcc',r.color);h2.textContent=r.name;
  RES.forEach(function(x){cards[x.id].el.classList.toggle('on',x.id===id)});coresEl.style.display=id==='cpu'?'grid':'none';
  var d=statDefs(id);stsEl.innerHTML=d.map(function(x){return '<div class="st"><span>'+x[0]+'</span><b></b></div>'}).join('');I.stb=[].slice.call(stsEl.querySelectorAll('b'));
  if(!first&&!calm()&&prEl.animate)prEl.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.9,.3,1)'});perfTxt();paint()}
 function perfTxt(){RES.forEach(function(r){cards[r.id].sub.textContent=cardTxt(r.id)});statDefs(I.res).forEach(function(x,i){if(I.stb[i])I.stb[i].textContent=x[1]});psub.textContent=subTxt(I.res)}
 function paint(){var ph=calm()?1:clamp((performance.now()-S.t)/S.iv,0,1);
  RES.forEach(function(r){draw(cards[r.id].cv,S.h[r.id],maxOf(r.id),r.color,ph,'55',1.4)});
  var r=resObj(I.res);draw(big,S.h[r.id],maxOf(r.id),r.color,ph,'66',2,1);
  if(I.res==='cpu')coreCv.forEach(function(cv,i){draw(cv,S.ch[i],100,r.color,ph,'44',1.2)})}
 function frame(){I.raf=0;if(!root.isConnected||I.tab!=='perf'||calm())return;I.fr^=1;if(I.fr&&vis(I))paint();I.raf=requestAnimationFrame(frame)}

 /* actions */
 function ctxP(p,x,y){var it=[];if(p.type==='app')it.push({t:'Switch to',f:function(){sw(p)}});it.push({t:'End task',d:1,f:function(){endTask(p.key)}},'-');
  if(I.tab!=='det')it.push({t:'Go to details',f:function(){setTab('det')}});it.push({t:'Copy PID',f:function(){cp(String(p.pid))}},{t:'Copy name',f:function(){cp(p.name)}});menu(x,y,it)}
 function openP(p){if(p.type==='app')sw(p)}
 function ctxH(o,x,y){menu(x,y,[{t:'Open '+o.name,f:function(){try{openApp(o.app)}catch(e){}}},'-',{t:'Remove from history',d:1,f:function(){delete H[o.app];jset('aur.tmh',H);rn()}}])}
 function togStart(o){ST[o.name]=ST[o.name]?0:1;jset('aur.tmst',ST);rn()}
 function ctxS(o,x,y){menu(x,y,[{t:o.en?'Disable':'Enable',f:function(){togStart(o)}}])}
 $('.run').onclick=function(e){var r=e.currentTarget.getBoundingClientRect(),it=[];try{Object.keys(A).forEach(function(k){if(A[k]&&!A[k].hid&&k!==K)it.push({t:appName(k),f:function(){openApp(k)}})})}catch(x){}menu(r.left,r.bottom+6,it.length?it:[{t:'No apps',off:1,f:function(){}}])};
 endB.onclick=function(){if(SEL&&P[SEL])endTask(SEL)};
 inp.oninput=function(){clearTimeout(I.st);I.st=setTimeout(rn,90)};
 root.addEventListener('keydown',function(e){if(e.key==='Delete'&&e.target!==inp&&SEL&&P[SEL]){e.preventDefault();endTask(SEL)}else if(e.key==='Escape')closeMenu()});
 tabs.forEach(function(b){b.onclick=function(){setTab(b.dataset.t)}});
 function moveInd(){var b=tabs.filter(function(x){return x.classList.contains('on')})[0];if(!b)return;ind.style.width=b.offsetWidth+'px';ind.style.transform='translateX('+b.offsetLeft+'px)'}
 function setTab(id){if(id===I.tab)return;var oi=0,ni=0;TABS.forEach(function(t,i){if(t[0]===I.tab)oi=i;if(t[0]===id)ni=i});var dir=ni>=oi?1:-1,po=pn[I.tab],pw=pn[id];
  if(I.shown&&po){po.style.setProperty('--sx',(-dir*18)+'px');po.classList.remove('on');pw.style.transition='none';pw.style.setProperty('--sx',(dir*18)+'px');void pw.offsetWidth;pw.style.transition=''}
  pw.classList.add('on');I.tab=id;I.shown=1;jset('aur.tmtab',id);tabs.forEach(function(b){b.classList.toggle('on',b.dataset.t===id)});moveInd();
  var t=tbls[id];if(t)t.layout(root.clientWidth);
  if(id==='perf'){selRes(I.res,1);if(!I.raf&&!calm())I.raf=requestAnimationFrame(frame)}
  rn();if(t)t.replay()}
 function match(p,q){return !q||p.name.toLowerCase().indexOf(q)>-1||String(p.pid).indexOf(q)>-1||(p.desc||'').toLowerCase().indexOf(q)>-1}
 function procItems(list,q){var items=[];[['app','Apps'],['bg','Background processes'],['sys','NexOS system processes']].forEach(function(g){
   var rows=list.filter(function(p){return p.type===g[0]&&match(p,q)});if(!rows.length&&(q||g[0]!=='app'))return;var open=!COL[g[0]];
   items.push({key:'g:'+g[0],hd:1,gk:g[0],label:g[1],n:rows.length,open:open});if(open)tP.sorted(rows).forEach(function(p){items.push({key:'p:'+p.key,o:p})})});return items}
 function histItems(q){var rows=Object.keys(H).filter(function(id){var h=H[id];return h&&(h.launches||h.cpuS>.05)&&(!q||appName(id).toLowerCase().indexOf(q)>-1)}).map(function(id){var h=H[id];return{key:id,app:id,type:'app',name:appName(id),pid:0,cpuS:h.cpuS,net:h.net,launches:h.launches,last:h.last}});
  return tH.sorted(rows).map(function(r){return{key:'h:'+r.key,o:r}})}
 function startItems(q){var rows=STU.filter(function(d){return !q||d[0].toLowerCase().indexOf(q)>-1}).map(function(d){return{key:d[0],name:d[0],type:'sys',pid:0,pub:'NexOS',en:!ST[d[0]],ms:d[1]}});return tS.sorted(rows).map(function(r){return{key:'s:'+r.key,o:r}})}
 function rn(){var q=inp.value.trim().toLowerCase(),list=Object.keys(P).map(function(k){return P[k]});
  sum.innerHTML='Processes<b>'+S.n+'</b>CPU<b>'+fPct(S.cpu)+'</b>Memory<b>'+Math.round(S.memPct)+'%</b><span class="xh">Up time<b>'+fTime(performance.now())+'</b></span>';
  if(I.tab==='proc'){tP.setTot();tP.update(procItems(list,q))}
  else if(I.tab==='det'){tD.setTot();tD.update(tD.sorted(list.filter(function(p){return match(p,q)})).map(function(p){return{key:'d:'+p.key,o:p}}))}
  else if(I.tab==='hist')tH.update(histItems(q));else if(I.tab==='start')tS.update(startItems(q));else if(I.tab==='perf'){perfTxt();if(calm()||!I.raf)paint()}
  endB.disabled=!(SEL&&P[SEL])}
 I.render=rn;I.paint=function(){[tP,tD,tH,tS].forEach(function(t){t.paintSel()});endB.disabled=!(SEL&&P[SEL])};
 I.mark=function(k){tP.markEnd(k);tD.markEnd(k)};
 I.shake=function(k){[tP,tD].forEach(function(t){var e=t.els[t.pfx+k];if(e){e.classList.remove('shk');void e.offsetWidth;e.classList.add('shk');setTimeout(function(){e.classList.remove('shk')},450)}})};
 function fit(){var w2=root.clientWidth;root.classList.toggle('nr',w2<640);root.classList.toggle('xs',w2<480);[tP,tD,tH,tS].forEach(function(t){t.layout(w2)});moveInd();if(I.tab==='perf')paint()}
 if(window.ResizeObserver)new ResizeObserver(fit).observe(root);else addEventListener('resize',fit);
 INST.push(I);fit();var t0=jget('aur.tmtab','proc');setTab(TABS.some(function(t){return t[0]===t0})?t0:'proc');
 if(!tm)loop()}

/* ---------- hook into the app system ---------- */
function hook(){var k=K;try{for(var id in A){if(A[id]&&typeof appTask==='function'&&A[id].f===appTask){k=id;break}}}catch(e){}
 K=k;var a;try{a=A[k]}catch(e){}if(!a)return;var orig=a.f;
 a.f=function(w){try{build(w)}catch(e){console.error('TASKMGR-3.5.0 fallback to old UI',e);try{var b=bodyOf(w);if(b)while(b.firstChild)b.removeChild(b.firstChild)}catch(x){}if(typeof orig==='function')return orig.apply(this,arguments)}};
 if(typeof a.w==='number'&&a.w<760)a.w=860;if(typeof a.h==='number'&&a.h<520)a.h=560;
 var _oa=openApp;openApp=function(id){var had=false;try{had=Object.keys(W).some(function(x){return W[x]&&W[x].app===id})}catch(e){}
  var w=_oa.apply(this,arguments);
  try{if(!had&&w&&A[id]){var h=H[id]||(H[id]=mkH());h.launches++;h.last=Date.now();jset('aur.tmh',H)}
   if(id===K&&w&&w.el&&!w.el.querySelector('.tm5'))build(w)}catch(e){console.error('TASKMGR-3.5.0',e)}return w}}
try{hook()}catch(e){console.error('TASKMGR-3.5.0 hook failed',e)}
})();

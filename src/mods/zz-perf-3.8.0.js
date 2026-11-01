/* PERF-3.8.0 - adaptive performance: device tier, 3 quality levels, FPS-based auto downgrade, only-top-window blur, lighter shadows/filters, pause when hidden, FPS HUD */
(function(){'use strict';
var doc=document,root=doc.documentElement;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
var LV=['smooth','balanced','lite'],LN=['Smooth','Balanced','Battery'];
var mem=navigator.deviceMemory||4,cores=navigator.hardwareConcurrency||4;
var tier=mem>=8&&cores>=8?0:(mem>=4?1:2);
var autoLv=+g('aur.perfAuto',tier);if(!(autoLv>=0&&autoLv<=2))autoLv=tier;
function mode(){return g('aur.perf','auto')}
function level(){var m=mode();return m==='auto'?autoLv:({smooth:0,balanced:1,battery:2})[m]||0}
function apply(){root.setAttribute('data-nxperf',LV[level()]);markTop()}
/* ---------- css ---------- */
var BL=':is(.nxw,#dock,#start,#ctx,#trf,#pwm,#selbar,#tbpv,.nxkb,#nxkbBtn,.nxn)';
var CSS=[
'.nxi,.nxn-i{will-change:auto}',
':root[data-nxhidden] *,:root[data-nxhidden] *::before,:root[data-nxhidden] *::after{animation-play-state:paused!important}',
'.nx-cv{content-visibility:auto;contain-intrinsic-size:auto 38px}',
/* balanced: cheaper blur, only the top window is blurred, lighter shadows, no per-icon filters */
':root[data-nxperf=balanced] .nxi,:root[data-nxperf=lite] .nxi,:root[data-nxperf=balanced] .nxn-i,:root[data-nxperf=lite] .nxn-i{filter:none!important}',
':root[data-nxperf=balanced][data-skin=glass] '+BL+'{-webkit-backdrop-filter:blur(14px) saturate(140%)!important;backdrop-filter:blur(14px) saturate(140%)!important}',
':root[data-nxperf=balanced][data-skin=glass] .nxw:not(.nx-top){-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background-color:rgba(26,34,58,.84)}',
':root[data-nxperf=balanced][data-skin=glass] .nxw{box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.2),0 10px 26px rgba(0,0,0,.34)!important}',
':root[data-nxperf=balanced] .nxkb.open .k{animation-duration:.26s;animation-delay:calc(var(--i,0)*3ms)}',
':root[data-nxperf=balanced] .star,:root[data-nxperf=balanced] #nxb svg{filter:none}',
/* lite: no backdrop blur at all, flat translucent panels, minimal shadows, shorter animations */
':root[data-nxperf=lite][data-skin=glass] '+BL+'{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background-color:rgba(24,30,50,.9)}',
':root[data-nxperf=lite] .nxw,:root[data-nxperf=lite] .nxkb,:root[data-nxperf=lite] .nxn,:root[data-nxperf=lite] #start,:root[data-nxperf=lite] #ctx{box-shadow:0 4px 14px rgba(0,0,0,.3)!important}',
':root[data-nxperf=lite] .nxkb.open .k{animation:none}',
':root[data-nxperf=lite] .nxn{animation-duration:.25s}:root[data-nxperf=lite] .nxkb{transition-duration:.18s}',
':root[data-nxperf=lite] .star,:root[data-nxperf=lite] #nxb svg{filter:none}',
'#nxfps{position:fixed;left:8px;top:calc(8px + env(safe-area-inset-top,0px));z-index:2147483300;padding:4px 9px;border-radius:10px;font:600 11px/1.2 ui-monospace,monospace;color:#d6ffe0;background:rgba(10,14,24,.72);pointer-events:none;white-space:pre}',
'.nxf{margin:0 0 18px}.nxf .seg{margin:6px 0 12px}.nxf p{font-size:12px;color:var(--mut);margin:4px 0 10px}'
].join('\n');
var st=doc.createElement('style');st.id='nx-perf-css';st.textContent=CSS;doc.head.appendChild(st);
/* ---------- only the top window gets backdrop blur ---------- */
var mt=0;
function markTop(){clearTimeout(mt);mt=setTimeout(function(){var ws=doc.querySelectorAll('.nxw'),best=null,bz=-1;
 for(var i=0;i<ws.length;i++){var w=ws[i],cs=getComputedStyle(w);if(cs.display==='none'||cs.visibility==='hidden')continue;var z=parseInt(cs.zIndex,10);if(isNaN(z))z=0;if(z>=bz){bz=z;best=w}}
 for(i=0;i<ws.length;i++)ws[i].classList.toggle('nx-top',ws[i]===best)},50)}
doc.addEventListener('pointerdown',function(){markTop();kick()},true);
['wheel','keydown','touchmove','pointermove'].forEach(function(t){doc.addEventListener(t,kick,{capture:true,passive:true})});
['animationstart','transitionrun'].forEach(function(t){doc.addEventListener(t,kick,true)});
/* ---------- long lists: skip rendering off-screen rows; async image decode ---------- */
function cv(n){if(n.nodeType!==1)return;if(n.tagName==='IMG'){n.decoding='async';return}
 var q=n.querySelectorAll?n.querySelectorAll('.row,.ftile'):[];if(q.length>60){for(var i=0;i<q.length;i++)q[i].classList.add('nx-cv')}
 var im=n.querySelectorAll?n.querySelectorAll('img:not([decoding])'):[];for(i=0;i<im.length&&i<80;i++)im[i].decoding='async'}
var pend=[],pt=0;
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)if(a[j].nodeType===1&&a[j].id!=='nxfps')pend.push(a[j])}
 if(!pt)pt=setTimeout(function(){pt=0;var q=pend.splice(0,pend.length).slice(0,40);q.forEach(function(n){if(n.isConnected)cv(n)});markTop()},250)}).observe(doc.body,{childList:true,subtree:true});
/* ---------- FPS monitor: runs only while the user interacts ---------- */
var run=false,last=0,buf=[],idle=0,bad=0,lastChange=0,hud=null,hudOn=g('aur.fps','0')==='1',hudT=0;
function kick(){idle=performance.now();if(!run&&!doc.hidden){run=true;last=0;requestAnimationFrame(tick)}}
function tick(t){if(doc.hidden){run=false;last=0;return}
 if(last){var dt=t-last;if(dt<250){buf.push(dt);if(buf.length>45)buf.shift()}}last=t;
 var avg=0;if(buf.length>=20){for(var i=0;i<buf.length;i++)avg+=buf[i];avg/=buf.length}
 if(mode()==='auto'&&buf.length>=45){if(avg>27)bad++;else if(bad>0)bad--;
  if(bad>=2&&autoLv<2&&performance.now()-lastChange>8000){autoLv++;put('aur.perfAuto',autoLv);lastChange=performance.now();bad=0;buf=[];apply();
   if(window.NXN)window.NXN.notify({type:'info',app:'Performance',title:'Performance mode: '+LN[autoLv],text:'Animations were lagging, so visual effects were reduced automatically.'})}}
 if(hud&&avg&&t-hudT>400){hudT=t;hud.textContent=Math.round(1000/avg)+' fps  '+avg.toFixed(1)+' ms\n'+LN[level()]+(mode()==='auto'?' (auto)':'')}
 if(hudOn||performance.now()-idle<1500)requestAnimationFrame(tick);else{run=false;last=0}}
function setHud(v){hudOn=v;put('aur.fps',v?'1':'0');if(v&&!hud){hud=doc.createElement('div');hud.id='nxfps';doc.body.appendChild(hud)}if(!v&&hud){hud.remove();hud=null}if(v)kick()}
doc.addEventListener('visibilitychange',function(){if(doc.hidden)root.setAttribute('data-nxhidden','');else{root.removeAttribute('data-nxhidden');if(hudOn)kick()}});
/* ---------- Settings: Performance section ---------- */
function sg(attr,vals,cur){return'<div class="seg">'+vals.map(function(v){return'<button '+attr+'="'+v[0]+'" class="'+(String(cur)===String(v[0])?'sel':'')+'">'+v[1]+'</button>'}).join('')+'</div>'}
function box(){return'<h4>Performance</h4>'+sg('data-nxp',[['auto','Auto'],['smooth','Smooth'],['balanced','Balanced'],['battery','Battery']],mode())+
 '<p>Detected: '+mem+' GB RAM, '+cores+' cores. Auto starts in '+LN[tier]+' and lowers effects only if frames drop.</p>'+
 '<h4>Show FPS counter</h4>'+sg('data-nxf',[['1','On'],['0','Off']],hudOn?'1':'0')}
function inject(){var p=doc.getElementById('spg');if(!p||p.querySelector('.nxf'))return;var hs=p.querySelectorAll('h3'),h=null;for(var i=0;i<hs.length;i++)if(/^\s*(perform|battery)/i.test(hs[i].textContent)){h=hs[i];break}
 var b=doc.createElement('div');b.className='nxf';b.innerHTML=box();if(h)h.parentNode.insertBefore(b,h.nextSibling);else{var t=p.querySelector('.nxs,.nxc,.nxt');if(!t)return;t.appendChild(b)}}
doc.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var a=t.closest('[data-nxp]'),f=t.closest('[data-nxf]');
 if(a){e.stopPropagation();e.preventDefault();put('aur.perf',a.dataset.nxp);if(a.dataset.nxp==='auto'){autoLv=tier;put('aur.perfAuto',tier);bad=0}buf=[];apply();a.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===a)});return}
 if(f){e.stopPropagation();e.preventDefault();setHud(f.dataset.nxf==='1');f.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===f)})}},true);
var raf=0;new MutationObserver(function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;inject()})}).observe(doc.body,{childList:true,subtree:true});
window.NXPERF={level:level,mode:mode,tier:function(){return LN[tier]},fps:function(){kick()}};
apply();inject();if(hudOn)setHud(true);
})();

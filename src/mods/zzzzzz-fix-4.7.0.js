/* FIX-4.7.0 - no search button, top-bar tap opens the new Control Center (stays up to 4 s after the pointer leaves), animated wallpaper off by default + paused under windows,
   auto "lite" mode when the frame rate drops, Nex Island edit mode (move / resize from Settings), window button colours. */
(function(){'use strict';var doc=document,B=doc.body;
function g(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var css=[
/* 1. search button gone everywhere */
'html body #srchBtn,html body.lay-dock #srchBtn,html body.tb-full #srchBtn,html body.tbw #srchBtn,#startSearch{display:none!important}',
/* 2. control centre under the top bar in the dock layout */
'html body.lay-dock #ncc{top:calc(var(--nxwt,44px) + 2px)!important;bottom:auto!important;max-height:calc(100% - var(--nxwt,44px) - 80px)!important}',
/* 3. lite mode */
'body.nxlite *,body.nxlite *::before,body.nxlite *::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}body.nxlite #nxbl *{animation:none!important}',
/* 4. island edit mode */
'body.nxie #nxd{outline:2px dashed var(--acc,#6c8cff);outline-offset:4px;pointer-events:none}',
'#nxieBar{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483647;display:flex;gap:8px;align-items:center;padding:10px 12px;border-radius:16px;background:rgba(20,22,28,.92);color:#fff;font:500 13px system-ui,sans-serif;box-shadow:0 10px 34px rgba(0,0,0,.4)}',
'#nxieBar button{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:inherit;cursor:pointer}#nxieBar button.p{background:var(--acc,#6c8cff);border-color:transparent}',
'#nxieG{position:fixed;z-index:2147483646;border-radius:22px;background:rgba(108,140,255,.22);border:2px dashed var(--acc,#6c8cff);cursor:grab;touch-action:none;display:grid;place-items:center;color:#fff;font:600 11px system-ui,sans-serif;pointer-events:auto}',
'#nxieG i{position:absolute;right:-9px;bottom:-9px;width:22px;height:22px;border-radius:50%;background:var(--acc,#6c8cff);border:2px solid #fff;cursor:nwse-resize;touch-action:none}',
/* 5. window button colours */
'#wbc-sec{margin-top:18px}#wbc-sec .nxh{font-weight:700;font-size:13px;margin:0 2px 10px}#wbc-sec .r{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surf2,transparent);margin-bottom:8px;font-size:13px}#wbc-sec input[type=color]{width:44px;height:28px;border:none;background:none;padding:0;cursor:pointer}#wbc-sec button{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surf2,transparent);color:var(--txt);font:inherit;font-size:12px;cursor:pointer}'
].join('\n');
var st=doc.createElement('style');st.id='nx-fix470-css';st.textContent=css;doc.head.appendChild(st);

/* ---- window button colours ---- */
var WB=document.createElement('style');WB.id='nx-wbc-dyn';doc.head.appendChild(WB);
function wbc(){var c={};try{c=JSON.parse(g('aur.wbc','{}'))||{}}catch(e){}
 var o='';[['x','x'],['mn','mn'],['mx','mx']].forEach(function(p){if(c[p[0]])o+='html body .win .tbar .'+p[1]+'{background:'+c[p[0]]+'!important}'});
 if(c.bg)o+='html body .win .tbar{background:'+c.bg+'!important}';
 WB.textContent=o;return c}
wbc();
function wbMount(){var wb=doc.getElementById('wb-sec');if(!wb||!wb.isConnected||doc.getElementById('wbc-sec'))return;
 var c=wbc(),s=doc.createElement('div');s.id='wbc-sec';
 var rows=[['x','Close button','#ff5f57'],['mn','Minimize button','#febc2e'],['mx','Maximize button','#28c840'],['bg','Title bar background (behind the buttons)','#1c1f27']];
 s.innerHTML='<div class="nxh">Window button colors</div>'+rows.map(function(r){return'<div class="r"><span>'+r[1]+'</span><input type="color" data-k="'+r[0]+'" value="'+(c[r[0]]||r[2])+'"></div>'}).join('')+'<button data-reset="1">Reset colors</button>';
 s.addEventListener('input',function(e){var k=e.target.getAttribute&&e.target.getAttribute('data-k');if(!k)return;var o=wbc();o[k]=e.target.value;put('aur.wbc',JSON.stringify(o));wbc()});
 s.addEventListener('click',function(e){if(e.target.closest('[data-reset]')){put('aur.wbc','{}');wbc();s.remove();wbMount()}});
 var ref=doc.getElementById('tb-sec')||wb;ref.parentNode.insertBefore(s,ref.nextSibling)}

/* ---- control centre ---- */
doc.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('#nxTop [data-cc]');if(!t||!window.NXCC||!B.classList.contains('lay-dock'))return;e.stopPropagation();e.preventDefault();NXCC.open()},true);
var px=-1,py=-1,leave=0;
function inside(x,y){var n=doc.getElementById('ncc'),t=doc.getElementById('nxTop'),ok=false;
 [n].concat(t?[].slice.call(t.querySelectorAll('.tp')):[]).forEach(function(el){if(!el)return;var r=el.getBoundingClientRect();if(x>=r.left-8&&x<=r.right+8&&y>=r.top-8&&y<=r.bottom+8)ok=true});return ok}
['pointermove','mousemove','touchmove'].forEach(function(ev){doc.addEventListener(ev,function(e){var p=e.touches?e.touches[0]:e;if(p){px=p.clientX;py=p.clientY}},true)});
setInterval(function(){var n=doc.getElementById('ncc');if(!n||!n.classList.contains('show')){leave=0;return}
 var x=px,y=py;try{if(B.classList.contains('vm')&&typeof VM!=='undefined'){x=VM.x;y=VM.y}}catch(e){}
 if(x<0||inside(x,y)){leave=0;return}
 if(!leave)leave=Date.now();else if(Date.now()-leave>4000){leave=0;try{NXCC.close()}catch(e){}}},400);

/* ---- animated wallpaper: off unless the user turned it on; paused while windows cover the desktop ---- */
if(g('aur.wanim',null)===null)put('aur.wanim','0');
B.classList.toggle('nxwoff',g('aur.wanim','0')==='0');
setInterval(function(){var any=false;doc.querySelectorAll('.win').forEach(function(w){if(!any&&w.offsetParent!==null&&!w.classList.contains('min')&&w.offsetWidth>300)any=true});B.classList.toggle('nxwhid',doc.hidden||any)},1500);

/* ---- lite mode when the frame rate drops ---- */
var low=0;function sample(){if(doc.hidden||B.classList.contains('nxlite')){setTimeout(sample,6000);return}
 var n=0,t0=performance.now();function f(){n++;if(performance.now()-t0<1000)requestAnimationFrame(f);else{var fps=n;low=fps<24?low+1:0;if(low>=2){B.classList.add('nxlite');B.classList.add('nxwoff')}setTimeout(sample,5000)}}requestAnimationFrame(f)}
setTimeout(sample,8000);

/* ---- Nex Island edit mode ---- */
function iv(k,d){return parseFloat(g(k,d))||0}
function applyIsl(){var el=doc.getElementById('nxd');if(!el)return;var sc=(parseFloat(g('aur.isl.scale','100'))||100)/100;el.style.translate=iv('aur.isl.ox','0')+'px '+iv('aur.isl.oy','0')+'px';el.style.scale=sc}
applyIsl();setInterval(function(){var el=doc.getElementById('nxd');if(el&&el.style.translate!==iv('aur.isl.ox','0')+'px '+iv('aur.isl.oy','0')+'px')applyIsl()},2500);
function editIsland(){if(doc.getElementById('nxieG'))return;
 try{if(typeof closeMenus==='function')closeMenus()}catch(e){}
 var set=doc.getElementById('win-set')||doc.querySelector('.win .nxd-set');var W=set&&set.closest?set.closest('.win'):null;if(W)W.style.visibility='hidden';
 B.classList.add('nxie');
 var base=doc.getElementById('nxd'),bw=120,bh=34,top0=8;
 var G=doc.createElement('div');G.id='nxieG';G.innerHTML='Nex Island<i></i>';doc.body.appendChild(G);
 function lay(){var sc=(parseFloat(g('aur.isl.scale','100'))||100)/100,w=bw*sc,h=bh*sc;G.style.width=w+'px';G.style.height=h+'px';G.style.left=(innerWidth/2-w/2+iv('aur.isl.ox','0'))+'px';G.style.top=(top0+iv('aur.isl.oy','0')+(bh-h)/2)+'px';applyIsl()}
 lay();
 var bar=doc.createElement('div');bar.id='nxieBar';bar.innerHTML='<span>Drag to move, pull the corner to resize</span><button data-a="reset">Reset</button><button class="p" data-a="done">Done</button>';doc.body.appendChild(bar);
 var drag=null;
 G.addEventListener('pointerdown',function(e){e.preventDefault();G.setPointerCapture(e.pointerId);var rz=e.target.tagName==='I';drag={rz:rz,x:e.clientX,y:e.clientY,ox:iv('aur.isl.ox','0'),oy:iv('aur.isl.oy','0'),sc:parseFloat(g('aur.isl.scale','100'))||100}});
 G.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(drag.rz){put('aur.isl.scale',String(Math.max(60,Math.min(220,Math.round(drag.sc+dx/bw*100*2)))))}
  else{put('aur.isl.ox',String(Math.round(Math.max(-innerWidth/2+40,Math.min(innerWidth/2-40,drag.ox+dx)))));put('aur.isl.oy',String(Math.round(Math.max(-8,Math.min(innerHeight-80,drag.oy+dy)))))}
  lay()});
 ['pointerup','pointercancel'].forEach(function(ev){G.addEventListener(ev,function(){drag=null})});
 bar.addEventListener('click',function(e){var a=e.target.getAttribute('data-a');if(a==='reset'){put('aur.isl.ox','0');put('aur.isl.oy','0');put('aur.isl.scale','100');lay()}
  if(a==='done'){G.remove();bar.remove();B.classList.remove('nxie');if(W)W.style.visibility='';applyIsl()}})}
function islMount(){var box=doc.querySelector('#spg .nxd-set');if(!box||box.querySelector('.nxie-btn'))return;var ref=box.querySelector('.nxd-btns');if(!ref)return;
 var b=doc.createElement('button');b.className='pgb nxie-btn';b.textContent='Edit island position & size';b.addEventListener('click',editIsland);ref.appendChild(b)}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;wbMount();islMount()})}).observe(doc.body,{childList:true,subtree:true});
})();

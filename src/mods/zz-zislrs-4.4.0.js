/* ISLRS-4.4.0 - Nex Island: drag the left or right edge to stretch it wider (it keeps its place and never grows downward).
   Width is stored in aur.isl.x (extra px, applied to every island view through --nxd-x). Double-tap an edge to reset. Needs zz-island-3.9.0.js. */
(function(){'use strict';
var doc=document,el=doc.getElementById('nxd');if(!el)return;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
var X=parseInt(g('aur.isl.x','0'),10)||0,MIN=-40,MAX=900;
function set(v){X=Math.max(MIN,Math.min(MAX,Math.round(v)));doc.documentElement.style.setProperty('--nxd-x',X+'px')}
set(X);
var W='var(--nxd-x,0px)',T='min(352px,100vw - 20px)';
var css=[
'.nxd[data-v=idle]{width:calc(120px + '+W+')}',
'.nxd[data-v=live]{width:calc(196px + '+W+')}.nxd[data-v=live][data-two="1"]{width:calc(214px + '+W+')}',
'.nxd[data-v=music],.nxd[data-v=timer],.nxd[data-v=alarm],.nxd[data-v=notif],.nxd[data-v=quick]{width:calc('+T+' + '+W+')}',
'.nxd[data-v=batt]{width:calc(min(290px,100vw - 20px) + '+W+')}',
'.nxd[data-v=dl]{width:calc(min(376px,100vw - 20px) + '+W+')}.nxd[data-v=dlm]{width:calc(148px + '+W+')}',
'.nxd-rs{position:absolute;top:0;bottom:0;width:24px;z-index:6;display:grid;place-items:center;cursor:ew-resize;touch-action:none;opacity:0;transition:opacity .2s}',
'.nxd-rs.l{left:0}.nxd-rs.r{right:0}.nxd-rs:after{content:"";width:3px;height:42%;max-height:18px;min-height:8px;border-radius:2px;background:rgba(255,255,255,.6)}',
'.nxd:hover .nxd-rs,.nxd.nxd-rsz .nxd-rs{opacity:1}@media (hover:none){.nxd[data-show="1"] .nxd-rs{opacity:.35}}',
'.nxd.nxd-rsz{transition:none!important}.nxd.nxd-rsz .nxd-v{transition:none!important}'
].join('\n');
var st=doc.createElement('style');st.id='nx-islrs-css';st.textContent=css;doc.head.appendChild(st);
function mk(side){var h=doc.createElement('i');h.className='nxd-rs '+side;h.setAttribute('aria-label','Resize island');el.appendChild(h);
 var x0=0,e0=0,id=-1;
 h.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();id=e.pointerId;x0=e.clientX;e0=X;el.classList.add('nxd-rsz');try{h.setPointerCapture(id)}catch(x){}});
 h.addEventListener('pointermove',function(e){if(e.pointerId!==id)return;var dx=e.clientX-x0;set(e0+(side==='r'?2*dx:-2*dx))});
 function end(e){if(e.pointerId!==id)return;id=-1;el.classList.remove('nxd-rsz');put('aur.isl.x',String(X))}
 h.addEventListener('pointerup',end);h.addEventListener('pointercancel',end);
 h.addEventListener('click',function(e){e.stopPropagation()});
 h.addEventListener('dblclick',function(e){e.stopPropagation();set(0);put('aur.isl.x','0')})}
mk('l');mk('r');
window.NXISLRS={reset:function(){set(0);put('aur.isl.x','0')},set:function(v){set(v);put('aur.isl.x',String(X))},get:function(){return X}};
})();

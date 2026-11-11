/* TOPBAR-4.6.9 - dock layout: slimmer top bar (two small pills at the corners, like a desktop panel) and windows keep out from under it and the dock. */
(function(){'use strict';var doc=document,TOP=44,SAT=0;
function inset(){try{var q=doc.createElement('div');q.style.cssText='position:fixed;left:0;top:0;width:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';doc.body.appendChild(q);var cs=getComputedStyle(q);var t=parseFloat(cs.paddingTop)||0,l=parseFloat(cs.paddingLeft)||0,r=parseFloat(cs.paddingRight)||0;doc.body.removeChild(q);return{t:t,l:l,r:r}}catch(e){return{t:0,l:0,r:0}}}
var T='html body #nxTop';
var css=[
T+'{top:calc(7px + var(--nxsat,0px))!important;height:28px!important;padding:0 calc(10px + var(--nxsal,0px)) 0 calc(10px + var(--nxsal,0px))!important;padding-right:calc(10px + var(--nxsar,0px))!important;font:500 12px system-ui,-apple-system,sans-serif!important}',
T+' .tp{height:26px!important;padding:0 11px!important;gap:9px!important;border-radius:999px!important;box-shadow:0 2px 8px rgba(0,0,0,.18)!important;background:#16181d!important;color:#f2f3f5!important;border:1px solid rgba(255,255,255,.08)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
'html[data-theme=light] body #nxTop .tp{background:#fff!important;color:#14161a!important;border-color:rgba(0,0,0,.1)!important;box-shadow:0 2px 8px rgba(40,50,80,.16)!important}',
'html[data-theme=light] body #nxTop .tp svg{filter:brightness(0)!important;opacity:.85}',
T+' .tp svg{width:13px!important;height:13px!important}',
T+' .tp .nxbi{width:20px!important;height:10px!important;border-width:1.3px!important}',
T+' .tp .dt{opacity:.8}',
'body.lay-dock:not(.nxfs) .win.max{top:var(--nxwt,'+TOP+'px)!important;height:calc(100% - var(--nxwt,'+TOP+'px) - var(--nxwb,0px))!important;border-radius:12px!important}'
].join('\n');
var s=doc.createElement('style');s.id='nx-topbar-css';s.textContent=css;doc.head.appendChild(s);
function vars(){var d=doc.getElementById('dock'),b=0;if(d&&doc.body.classList.contains('lay-dock')){var r=d.getBoundingClientRect();if(r.height)b=Math.max(0,innerHeight-r.top+8)}
 var n=inset();SAT=n.t;var rs=doc.documentElement.style;rs.setProperty('--nxsat',n.t+'px');rs.setProperty('--nxsal',n.l+'px');rs.setProperty('--nxsar',n.r+'px');rs.setProperty('--nxwt',(TOP+SAT)+'px');doc.documentElement.style.setProperty('--nxwb',b+'px')}
vars();addEventListener('resize',vars);setInterval(vars,2000);
/* keep dragged windows below the top bar (checked after a drag ends; no heavy style observer) */
function clamp(){if(!doc.body.classList.contains('lay-dock'))return;var m=TOP+SAT;doc.querySelectorAll('.win:not(.max)').forEach(function(w){var t=parseFloat(w.style.top);if(!isNaN(t)&&t<m)w.style.top=m+'px'})}
['pointerup','pointercancel'].forEach(function(e){doc.addEventListener(e,function(){setTimeout(clamp,30)},true)});
setInterval(clamp,3000);
})();

/* TOPBAR-4.6.9 - dock layout: slimmer top bar (two small pills at the corners, like a desktop panel) and windows keep out from under it and the dock. */
(function(){'use strict';var doc=document,TOP=44;
var T='html body #nxTop';
var css=[
T+'{top:7px!important;height:28px!important;padding:0 10px!important;font:500 12px system-ui,-apple-system,sans-serif!important}',
T+' .tp{height:26px!important;padding:0 11px!important;gap:9px!important;border-radius:999px!important;box-shadow:0 4px 14px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.16)!important}',
T+' .tp svg{width:13px!important;height:13px!important}',
T+' .tp .nxbi{width:20px!important;height:10px!important;border-width:1.3px!important}',
T+' .tp .dt{opacity:.8}',
'body.lay-dock:not(.nxfs) .win.max{top:var(--nxwt,'+TOP+'px)!important;height:calc(100% - var(--nxwt,'+TOP+'px) - var(--nxwb,0px))!important;border-radius:12px!important}'
].join('\n');
var s=doc.createElement('style');s.id='nx-topbar-css';s.textContent=css;doc.head.appendChild(s);
function vars(){var d=doc.getElementById('dock'),b=0;if(d&&doc.body.classList.contains('lay-dock')){var r=d.getBoundingClientRect();if(r.height)b=Math.max(0,innerHeight-r.top+8)}
 doc.documentElement.style.setProperty('--nxwt',TOP+'px');doc.documentElement.style.setProperty('--nxwb',b+'px')}
vars();addEventListener('resize',vars);setInterval(vars,2000);
/* keep dragged windows below the top bar */
var busy=false;new MutationObserver(function(ms){if(busy||!doc.body.classList.contains('lay-dock'))return;busy=true;
 for(var i=0;i<ms.length;i++){var w=ms[i].target;if(!w.classList||!w.classList.contains('win')||w.classList.contains('max'))continue;var t=parseFloat(w.style.top);if(!isNaN(t)&&t<TOP)w.style.top=TOP+'px'}
 busy=false}).observe(doc.body,{attributes:true,attributeFilter:['style'],subtree:true});
})();

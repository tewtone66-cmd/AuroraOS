/* CC-4.7.1 - Control Center, minimal: Wi-Fi + Bluetooth tile and Volume + Brightness sliders in two soft glass cards (pure CSS on top of CC-5.1.0 / CCFIX-4.6.7). */
(function(){'use strict';var P='html body #ncc',L=':root[data-theme=light] ';
var css=[
P+'{width:min(720px,calc(100vw - 16px))!important;padding:12px!important;border-radius:28px!important;grid-template-columns:1fr 1fr!important;grid-template-areas:"net bat" "sl ck"!important;gap:12px!important;background:rgba(30,33,44,.82)!important;border:1px solid rgba(255,255,255,.1)!important;box-shadow:0 24px 60px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:blur(22px)!important;backdrop-filter:blur(22px)!important}',
'html[data-theme=light] body #ncc{background:rgba(255,255,255,.78)!important;border-color:rgba(255,255,255,.9)!important;box-shadow:0 24px 60px rgba(70,80,130,.25)!important}',
'body.nxlite #ncc{background:rgba(30,33,44,.97)!important}html[data-theme=light] body.nxlite #ncc{background:rgba(255,255,255,.98)!important}',
P+' [data-sec=hd],'+P+' [data-sec=bt],'+P+' [data-sec=md]{display:none!important}',
'#nxcc{display:none!important}',
/* connection card */
P+' .cct,'+P+' .ccsl,'+P+' .ccb,'+P+' .cck{display:flex!important;flex-direction:column;justify-content:center;gap:10px!important;padding:14px!important;border-radius:22px;background:rgba(255,255,255,.07);margin:0!important}',
'html[data-theme=light] body #ncc .cct,html[data-theme=light] body #ncc .ccsl,html[data-theme=light] body #ncc .ccb,html[data-theme=light] body #ncc .cck{background:rgba(255,255,255,.7);box-shadow:0 1px 0 rgba(255,255,255,.9) inset}',
P+' .cct button:not([data-p=wifi]):not([data-p=bluetooth]){display:none!important}',
P+' .cct button{background:none!important;border:0!important;box-shadow:none!important;padding:2px!important;gap:12px!important;text-align:left}',
P+' .cct .ci{width:40px!important;height:40px!important;border-radius:50%!important;background:rgba(128,134,160,.3)!important;color:#fff!important;display:grid;place-items:center}',
P+' .cct button.on .ci{background:linear-gradient(180deg,#7b93ff,#4c63e6)!important;box-shadow:0 4px 12px rgba(76,99,230,.4)}',
P+' .cct .ci svg{width:20px!important;height:20px!important}',
P+' .cct b{font-size:15px!important;font-weight:600}'+P+' .cct small{font-size:12px!important;opacity:.6}',
/* battery + round buttons (right column) */
P+' .ccb{display:flex!important;justify-content:center}'+P+' .ccb:empty{display:flex!important}'+P+' .ccb .r b{font-size:30px!important}'+P+' .ccb .bar{height:10px!important}',
P+' .cck{display:grid!important;grid-template-columns:repeat(4,1fr)!important;justify-items:center;align-items:center;gap:8px!important}',
P+' .cck button:not([data-c=theme]):not([data-c=perf]):not([data-c=lock]):not([data-c=set]){display:none!important}',
P+' .cck button{width:56px!important;height:56px!important;border-radius:50%!important;padding:0!important;display:grid!important;place-items:center;background:rgba(128,134,160,.22)!important;border:0!important;box-shadow:none!important;color:var(--txt,inherit)!important}',
P+' .cck button.on{background:linear-gradient(180deg,#7b93ff,#4c63e6)!important;color:#fff!important}',
P+' .cck button b,'+P+' .cck button small{display:none!important}'+P+' .cck .ci{background:none!important;width:auto!important;height:auto!important}'+P+' .cck svg{width:24px!important;height:24px!important}',
P+' .cct button{padding:6px 2px!important}'+P+' .cct .ci{width:46px!important;height:46px!important}'+P+' .cct b{font-size:16px!important}'+P+' .ccs{height:44px!important}',
/* sliders card */
P+' .ccs[data-s=nl]{display:none!important}',
P+' .ccs{background:none!important;border:0!important;height:36px!important;padding:0 4px!important;gap:12px!important;box-shadow:none!important}',
P+' .ccs em{display:none!important}'+P+' .ccs .ic svg{width:18px!important;height:18px!important;opacity:.7}',
P+' .ccs .sl{height:30px!important;background:none!important}',
P+' .ccs .sl i{background:linear-gradient(90deg,#6f88ff,#4c63e6)!important;height:8px!important;top:11px!important;border-radius:4px!important}'+P+' .ccs .sl:before{height:8px;top:11px;border-radius:4px}',
P+' .ccs .sl u{width:22px!important;height:22px!important;margin-left:-11px!important;top:4px!important}',
P+' .cct button,'+P+' .cct button.on{color:var(--txt,inherit)!important}',
'@media (max-width:480px){'+P+'{grid-template-columns:1fr!important;grid-template-areas:"net" "bat" "sl" "ck"!important}}'
].join('\n');
var s=document.createElement('style');s.id='nx-cc471-css';s.textContent=css;document.head.appendChild(s);
/* the icon pack turned the Bluetooth glyph into a coloured square: strip it back to a plain glyph like Wi-Fi */
var n=document.getElementById('ncc');function flat(){if(!n)return;n.querySelectorAll('.ci.nxi-in svg').forEach(function(v){v.querySelectorAll(':scope>rect,:scope>path').forEach(function(x){x.remove()});var g=v.querySelector('g');if(g){g.setAttribute('transform','');g.setAttribute('stroke','currentColor')}v.style.width='';v.style.height='';v.parentNode.classList.remove('nxi-in')})}
if(n)new MutationObserver(flat).observe(n,{childList:true,subtree:true});flat();
})();

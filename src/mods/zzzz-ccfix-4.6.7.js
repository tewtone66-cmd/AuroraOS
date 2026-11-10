/* CCFIX-4.6.7 - Control Center redesigned: one compact horizontal panel (connections | sliders | quick toggles) centred above the dock, instead of a tall column. Pure CSS on top of CC-5.1.0. Also: the top-bar clock (.tm) was picking up the Terminal's black monospace style. */
(function(){'use strict';var P='html body #ncc';
var css=[
P+'{width:min(740px,calc(100vw - 16px))!important;left:50%!important;right:auto!important;padding:10px!important;border-radius:22px!important;display:grid!important;grid-template-columns:1.15fr 1fr 1.1fr;grid-template-areas:"hd hd hd" "net sl ck" "bt bt bt" "md md md";gap:8px 10px;max-height:calc(100vh - 90px)!important;transform:translateX(-50%) translateY(12px) scale(.97)}',
P+'.show{transform:translateX(-50%)!important}',
P+' [data-sec=hd]{grid-area:hd}'+P+' [data-sec=net]{grid-area:net}'+P+' [data-sec=bt]{grid-area:bt}'+P+' [data-sec=sl]{grid-area:sl}'+P+' [data-sec=ck]{grid-area:ck}'+P+' [data-sec=md]{grid-area:md}'+P+' [data-sec=bat]{display:none!important}',
P+' .cch{padding:0 4px 2px!important}'+P+' .cch>div:first-child{display:flex;align-items:baseline;gap:10px}'+P+' .cch b{font-size:14px!important}'+P+' .cch span{margin:0!important;font-size:11.5px!important}'+P+' .cbp{padding:4px 10px!important;font-size:12px}'+P+' .cbp svg{width:15px!important;height:15px!important}',
P+' .cct{grid-template-columns:1fr 1fr!important;gap:6px!important;margin:0!important}'+P+' .cct button{flex-direction:row!important;align-items:center!important;gap:8px!important;padding:6px 8px!important;border-radius:14px!important}'+P+' .ci{width:28px!important;height:28px!important}'+P+' svg{width:17px!important;height:17px!important}'+P+' .cct b{font-size:12px!important}'+P+' .cct small{font-size:10.5px!important;margin:0!important}',
P+' .ccsl{margin:0!important;gap:6px!important;justify-content:space-between}'+P+' .ccs{height:38px!important;gap:8px!important;padding:0 10px!important;border-radius:14px!important}'+P+' .ccs em{min-width:34px!important;font-size:11px!important}',
P+' .cck{margin:0!important;grid-template-columns:repeat(4,1fr)!important;gap:6px!important}'+P+' .cck button{padding:7px 2px 6px!important;gap:3px!important;border-radius:14px!important}'+P+' .cck b{font-size:10.5px!important}'+P+' .cck small{display:none!important}',
P+' .ccd{margin:0!important}'+P+' .ccm{margin:0!important;padding:8px 10px!important;border-radius:14px!important}'+P+' .ccm .ar{width:38px!important;height:38px!important}',
'html body #nxTop .tp .tm{background:none!important;color:inherit!important;font:600 13px system-ui,-apple-system,sans-serif!important;font-variant-numeric:tabular-nums;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;display:inline!important;height:auto!important;width:auto!important;box-shadow:none!important}',
'@media (max-width:640px){'+P+'{grid-template-columns:1fr 1fr;grid-template-areas:"hd hd" "net ck" "sl sl" "bt bt" "md md"}}'
].join('\n');
var s=document.createElement('style');s.id='nx-ccfix-css';s.textContent=css;document.head.appendChild(s);
/* the panel was placed from the tray; keep it centred over the dock instead */
var n=document.getElementById('ncc');if(n)new MutationObserver(function(){if(n.style.left)n.style.removeProperty('left')}).observe(n,{attributes:true,attributeFilter:['style']});
})();

/* WALL-4.6.1 - wallpaper animation on/off switch (Settings > Background), darker overlay, GPU-friendlier live layer (fixes black flashes/glitches). */
(function(){'use strict';
var doc=document,K='aur.wanim';
function g(){try{return localStorage.getItem(K)!=='0'}catch(e){return true}}
function put(v){try{localStorage.setItem(K,v?'1':'0')}catch(e){}}
var st=doc.createElement('style');st.id='nx-wall2-css';
st.textContent='#nxbl{contain:strict;transform:translateZ(0);backface-visibility:hidden}#nxbl svg{shape-rendering:optimizeSpeed;transform:translateZ(0)}'
+'#nxbl::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,6,18,.58),rgba(4,6,18,.42));pointer-events:none}'
+'body.nxwoff #nxbl *{animation:none!important}body.nxwhid #nxbl *{animation-play-state:paused!important}'
+'#nx-wanim{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surf2,transparent)}'
+'#nx-wanim b{display:block;font-size:13px}#nx-wanim em{display:block;font-style:normal;font-size:11px;opacity:.65;margin-top:2px}'
+'#nx-wanim .sw{flex:none;width:42px;height:24px;border-radius:12px;background:rgba(127,127,127,.4);position:relative;cursor:pointer;transition:background .15s}'
+'#nx-wanim .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}'
+'#nx-wanim.on .sw{background:var(--acc,#6c8cff)}#nx-wanim.on .sw::after{transform:translateX(18px)}';
doc.head.appendChild(st);
function apply(){doc.body.classList.toggle('nxwoff',!g())}
apply();
doc.addEventListener('visibilitychange',function(){doc.body.classList.toggle('nxwhid',doc.hidden)});
function inject(){var w=doc.querySelector('.win .walls');if(!w||doc.getElementById('nx-wanim'))return;
 var r=doc.createElement('div');r.id='nx-wanim';r.className=g()?'on':'';r.innerHTML='<div><b>Animated background</b><em>Petals sway and blow in the wind. Turn off to save battery.</em></div><div class="sw" role="switch" tabindex="0"></div>';
 w.parentNode.insertBefore(r,w);
 var t=function(){var v=!g();put(v);apply();r.classList.toggle('on',v)};
 r.querySelector('.sw').addEventListener('click',t);r.querySelector('.sw').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t()}})}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;inject()})}).observe(doc.body,{childList:true,subtree:true});
})();

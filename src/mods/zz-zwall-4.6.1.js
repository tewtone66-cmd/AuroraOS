/* WALL-4.6.1 - wallpaper animation on/off switch (Settings > Background), darker overlay, GPU-friendlier live layer (fixes black flashes/glitches). */
(function(){'use strict';
var doc=document,K='aur.wanim';
function g(){try{return localStorage.getItem(K)!=='0'}catch(e){return true}}
function put(v){try{localStorage.setItem(K,v?'1':'0')}catch(e){}}
function gd(){try{var v=localStorage.getItem('aur.wdark');return v==null?50:Math.max(0,Math.min(85,+v||0))}catch(e){return 50}}
function sd(v){try{localStorage.setItem('aur.wdark',v)}catch(e){}doc.documentElement.style.setProperty('--nxwd',v/100)}
sd(gd());
var st=doc.createElement('style');st.id='nx-wall2-css';
st.textContent='#nxbl{contain:strict;transform:translateZ(0);backface-visibility:hidden}#nxbl svg{shape-rendering:optimizeSpeed;transform:translateZ(0)}'
+'#nxbl::after{content:"";position:absolute;inset:0;background:rgba(4,6,18,var(--nxwd,.5));pointer-events:none}'
+'body.nxwoff #nxbl *{animation:none!important}body.nxwhid #nxbl *{animation-play-state:paused!important}'
+'#nx-wanim{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surf2,transparent)}'
+'#nx-wanim b{display:block;font-size:13px}#nx-wanim em{display:block;font-style:normal;font-size:11px;opacity:.65;margin-top:2px}'
+'#nx-wanim .sw{flex:none;width:42px;height:24px;border-radius:12px;background:rgba(127,127,127,.4);position:relative;cursor:pointer;transition:background .15s}'
+'#nx-wanim .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}'
+'#nx-wanim{flex-wrap:wrap}#nx-wanim .dk{flex:1 0 100%;display:flex;align-items:center;gap:10px;font-size:12px}#nx-wanim .dk input{flex:1;accent-color:var(--acc,#6c8cff)}#nx-wanim .dk span{width:34px;text-align:right;opacity:.7}'
+'#nx-wanim.on .sw{background:var(--acc,#6c8cff)}#nx-wanim.on .sw::after{transform:translateX(18px)}';
doc.head.appendChild(st);
function apply(){doc.body.classList.toggle('nxwoff',!g())}
apply();
doc.addEventListener('visibilitychange',function(){doc.body.classList.toggle('nxwhid',doc.hidden)});
function inject(){var w=doc.querySelector('.win .walls');if(!w||doc.getElementById('nx-wanim'))return;
 var r=doc.createElement('div');r.id='nx-wanim';r.className=g()?'on':'';r.innerHTML='<div><b>Animated background</b><em>Petals sway and blow in the wind. Turn off to save battery.</em></div><div class="sw" role="switch" tabindex="0"></div><label class="dk"><span style="width:auto;text-align:left">Brightness</span><input type="range" min="0" max="85" step="1"><span></span></label>';
 var rg=r.querySelector('input'),lb=r.querySelector('.dk span:last-child');rg.value=85-gd();lb.textContent=rg.value+'%';rg.addEventListener('input',function(){sd(85-rg.value);lb.textContent=rg.value+'%'});
 w.parentNode.insertBefore(r,w);
 var t=function(){var v=!g();put(v);apply();r.classList.toggle('on',v)};
 r.querySelector('.sw').addEventListener('click',t);r.querySelector('.sw').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t()}})}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;inject()})}).observe(doc.body,{childList:true,subtree:true});
})();

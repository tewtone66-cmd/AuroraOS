/* GLASS-3.6.0 - Liquid Glass v2 (macOS 26 / iOS 26 Control Center look).
   Only affects :root[data-skin=glass]; Dark and Light are untouched. Loaded after the main script, so it overrides the older glass rules.
   Optional lensing (edge refraction, Chromium only, off by default): localStorage aur.lens=1 or NXGlass.setLens(true).
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
const G=':root[data-skin=glass][data-skin=glass] ';
const BLUR='#dock,#start,#tray,#clock,#wn,#ctx,#trf,.dlg,.dkb,.snav';
const CSS=[
/* tokens: clearer, brighter, bluish-neutral glass with a strong specular rim (bright top-left and bottom-right) */
G+'{--gl-blur:blur(16px) saturate(1.9) brightness(1.1);--gl-tint:rgba(16,30,64,.14);'+
 '--gl-fill:radial-gradient(120% 90% at 0% 0%,rgba(255,255,255,.26),rgba(255,255,255,0) 55%),radial-gradient(90% 70% at 100% 100%,rgba(255,255,255,.14),rgba(255,255,255,0) 60%),linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03));'+
 '--gl-rim:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,255,255,.28) 22%,rgba(255,255,255,.06) 48%,rgba(255,255,255,.22) 76%,rgba(255,255,255,.85));'+
 '--gl-edge:inset 0 1px 0 rgba(255,255,255,.75),inset 1px 0 0 rgba(255,255,255,.28),inset 0 -1px 0 rgba(255,255,255,.3),inset 0 0 18px rgba(255,255,255,.16),inset 0 12px 22px -14px rgba(255,255,255,.5),0 10px 30px rgba(8,20,50,.22),0 2px 6px rgba(8,20,50,.12);'+
 '--gl-btn:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,.08));--gl-btn-on:linear-gradient(180deg,rgba(190,225,255,.62),rgba(120,185,255,.3));'+
 '--gl-btn-edge:inset 0 1px 0 rgba(255,255,255,.8),inset 0 0 0 1px rgba(255,255,255,.14),inset 0 -1px 0 rgba(255,255,255,.22),inset 0 0 14px rgba(255,255,255,.14),0 4px 14px rgba(8,20,50,.2)}',
/* performance / lite: no blur, more opaque so text stays readable */
':root[data-skin=glass] body:is(.perf,.lite){--gl-blur:none;--gl-tint:rgba(24,36,70,.8);--gl-fill:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));--gl-btn:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.08))}',
/* top-level glass surfaces (no backdrop-filter on children: nested backdrops would not see the wallpaper) */
G+':is('+BLUR+'){-webkit-backdrop-filter:var(--gl-blur);backdrop-filter:var(--gl-blur);background:var(--gl-fill),var(--gl-tint);box-shadow:var(--gl-edge);text-shadow:0 1px 2px rgba(0,0,0,.3)}',
G+'#start,'+G+'.dlg{--gl-tint:rgba(16,30,64,.3)}',
G+'#trf{border-radius:30px;padding:14px}',
G+'.qs{gap:10px}',
/* capsule tiles and slider cards like the Control Center in the reference */
G+'.qt{border-radius:999px;min-height:56px;padding:9px 16px 9px 9px;background:var(--gl-btn);box-shadow:var(--gl-btn-edge);transition:transform .32s var(--spring),box-shadow .25s,filter .25s,background .25s}',
G+'.qt:hover{transform:scale(1.03)}',G+'.qt:active{transform:scale(.96)}',
G+'.qt .qi{width:38px;height:38px;background:rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}',
G+'.qt.on{background:var(--gl-btn-on);color:#fff;box-shadow:var(--gl-btn-edge),0 0 24px rgba(120,185,255,.38)}',
G+'.qt.on .qi{background:#fff;color:#0b1226;box-shadow:0 2px 8px rgba(0,0,0,.28)}',
G+':is(.qb,.qbr){border-radius:26px;background:var(--gl-btn);box-shadow:var(--gl-btn-edge)}',
G+'.qlink{border-radius:999px;background:var(--gl-btn);box-shadow:var(--gl-btn-edge);font-weight:600}',
/* glass range sliders: white fill up to a round white thumb (--v is set by the script) */
G+'input[type=range]{-webkit-appearance:none;appearance:none;height:28px;border-radius:999px;border:0;padding:0;cursor:pointer;outline:0;box-shadow:var(--gl-btn-edge);background:linear-gradient(90deg,rgba(255,255,255,.92) var(--v,50%),rgba(255,255,255,.2) var(--v,50%))}',
G+'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3),inset 0 0 0 1px rgba(255,255,255,.7)}',
G+'input[type=range]::-webkit-slider-runnable-track{background:transparent;height:28px}',
/* pop + light flash when a tile or button is pressed */
'@keyframes glPop{0%{transform:scale(.93);filter:brightness(1.35)}55%{transform:scale(1.06)}100%{transform:scale(1);filter:none}}',
'.gl-pop{animation:glPop .5s var(--spring,cubic-bezier(.34,1.56,.64,1))}',
'@media (prefers-reduced-motion:reduce){.gl-pop{animation:none}}',
/* optional lensing: SVG displacement inside the backdrop-filter (Chromium) */
':root[data-skin=glass].gl-lens body:not(.perf):not(.lite) :is(#dock,#start,#trf){-webkit-backdrop-filter:url(#gl-lens) var(--gl-blur);backdrop-filter:url(#gl-lens) var(--gl-blur)}'
].join('\n');
const st=document.createElement('style');st.id='gl-css';st.textContent=CSS;document.head.appendChild(st);

const glass=()=>document.documentElement.getAttribute('data-skin')==='glass';
/* range sliders */
const setV=el=>{const mn=+el.min||0,mx=el.max===''?100:+el.max,v=(+el.value-mn)/((mx-mn)||1)*100;el.style.setProperty('--v',Math.max(0,Math.min(100,v))+'%')};
const scan=root=>{if(root.querySelectorAll)root.querySelectorAll('input[type=range]').forEach(setV)};
document.addEventListener('input',e=>{if(e.target&&e.target.type==='range')setV(e.target)},true);
try{new MutationObserver(ms=>{if(!glass())return;for(const m of ms)m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches&&n.matches('input[type=range]'))setV(n);scan(n)}})}).observe(document.body,{childList:true,subtree:true});scan(document)}catch(e){}
/* pop animation */
document.addEventListener('pointerdown',e=>{if(!glass()||!e.target.closest)return;const b=e.target.closest('.qt,.dk,.tbar button');if(!b)return;b.classList.remove('gl-pop');void b.offsetWidth;b.classList.add('gl-pop');setTimeout(()=>b.classList.remove('gl-pop'),520)},true);

/* lensing */
const MAP=(()=>{const g=(id,x1,y1,x2,y2,c)=>'<linearGradient id="'+id+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"><stop offset="0" stop-color="'+c+'"/><stop offset="1" stop-color="'+c+'" stop-opacity="0"/></linearGradient>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs>'+g('l',0,0,1,0,'rgb(255,128,128)')+g('r',1,0,0,0,'rgb(0,128,128)')+g('t',0,0,0,1,'rgb(128,255,128)')+g('b',0,1,0,0,'rgb(128,0,128)')+'</defs><rect width="100" height="100" fill="rgb(128,128,128)"/><rect width="14" height="100" fill="url(#l)"/><rect x="86" width="14" height="100" fill="url(#r)"/><rect width="100" height="14" fill="url(#t)"/><rect y="86" width="100" height="14" fill="url(#b)"/></svg>'})();
const lensOK=()=>/Chrome\//.test(navigator.userAgent)&&!/Edg\/|OPR\//.test(navigator.userAgent);
function setLens(on){try{ls('aur.lens',on?'1':'0')}catch(e){}
 if(on&&lensOK()){if(!document.getElementById('gl-lens-svg')){const d=document.createElement('div');d.id='gl-lens-svg';d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
   d.innerHTML='<svg width="0" height="0"><filter id="gl-lens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="data:image/svg+xml,'+encodeURIComponent(MAP)+'" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="m"/><feDisplacementMap in="SourceGraphic" in2="m" scale="34" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';document.body.appendChild(d)}
  document.documentElement.classList.add('gl-lens')}else document.documentElement.classList.remove('gl-lens')}
window.NXGlass={setLens:setLens,lensSupported:lensOK};
if(ls('aur.lens')==='1')setLens(true);
})();

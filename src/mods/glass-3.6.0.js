/* GLASS-3.6.0 - Liquid Glass v2 (macOS 26 / iOS 26 Control Center look).
   Only affects :root[data-skin=glass]; Dark and Light are untouched. Loaded after the main script, so it overrides the older glass rules.
   Lensing (edge refraction, Chromium/WebView only, ON by default; auto-off in perf/lite): localStorage aur.lens=0 turns it off, NXGlass.setLens(false).
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
const G=':root[data-skin=glass][data-skin=glass] ';
const BLUR='#dock,#start,#wn,#ctx,#trf,.dlg,.dkb,.snav';
const CSS=[
/* tokens: clearer, brighter, bluish-neutral glass with a strong specular rim (bright top-left and bottom-right) */
G+'{--gl-blur:blur(9px) saturate(1.8) brightness(1.1);--gl-tint:rgba(16,30,64,.1);--dock-bg:rgba(30,44,80,.08);'+
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
/* v4: really clear glass - windows see the wallpaper, glass window buttons light up in their own colour only on hover */
G+'.win:not(.max){background:var(--gl-fill),rgba(14,24,54,.2);-webkit-backdrop-filter:blur(12px) saturate(1.8) brightness(1.08);backdrop-filter:blur(12px) saturate(1.8) brightness(1.08)}',
G+'.win:not(.on):not(.max){background:var(--gl-fill),rgba(14,24,54,.3)}',
G+'.win .tbar span{text-shadow:0 1px 3px rgba(0,0,0,.45)}',
G+'.tbar button{width:38px;height:26px;border-radius:999px;color:rgba(255,255,255,.92);background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.02) 60%);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.14),0 2px 6px rgba(0,0,0,.12)}',
G+'.tbar button:hover,'+G+'.tbar button.vh{background:linear-gradient(180deg,rgba(255,255,255,.34),rgba(255,255,255,.08))}',
G+'.tbar button svg{stroke-width:1.7;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35))}',
/* v5 (Apple guidance): glass = the control/navigation layer (title bar, sidebar, dock, panels); window content is a calmer layer under it */
G+'.win:not(.max){border-radius:26px}',
G+'.win .body{background:linear-gradient(180deg,rgba(8,16,40,.34),rgba(8,16,40,.46))}',
G+'.win .snav{background:rgba(255,255,255,.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 0 0 1px rgba(255,255,255,.1),0 6px 20px rgba(0,0,0,.14)}',
/* slider knob turns into clear glass while it is held */
G+'input[type=range]::-webkit-slider-thumb{transition:transform .22s var(--spring),box-shadow .2s,background .2s}',
G+'input[type=range]:active::-webkit-slider-thumb{transform:scale(1.28);background:rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 0 1px rgba(255,255,255,.6),0 6px 16px rgba(0,0,0,.3)}',
/* Reduce transparency (system setting): opaque surfaces */
'@media (prefers-reduced-transparency:reduce){:root[data-skin=glass] :is(.win,#dock,#start,#trf,.dlg,.dkb,#ctx){-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(24,34,66,.94)!important}}',
/* v6: cleaner - less haze (lighter fill, less blur, no milky white wash) */
G+'{--gl-blur:blur(5px) saturate(1.7) brightness(1.06);--gl-tint:rgba(12,22,50,.05);--gl-fill:radial-gradient(120% 80% at 0% 0%,rgba(255,255,255,.14),rgba(255,255,255,0) 45%),linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0))}',
G+'.win:not(.max){background:var(--gl-fill),rgba(12,22,50,.1);-webkit-backdrop-filter:blur(6px) saturate(1.7) brightness(1.06);backdrop-filter:blur(6px) saturate(1.7) brightness(1.06)}',
G+'.win:not(.on):not(.max){background:var(--gl-fill),rgba(12,22,50,.2)}',
G+'.win .body{background:rgba(8,16,40,.3)}',
/* clean-up: no boxes around tray/clock inside the dock; readable search box; tiles never cut their labels */
G+'#tray,'+G+'#clock{background:none;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;border:0}',
G+'#start .sbox input{background:rgba(10,18,40,.38);color:#fff;border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}',
G+'#start .sbox input::placeholder{color:rgba(255,255,255,.82)}',
G+'.qt{padding:9px 12px 9px 9px;gap:8px}'+G+'.qt .qx b{font-size:12px}'
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

/* lensing: per-element refraction map (rounded-rect distance field) used by an SVG feDisplacementMap inside backdrop-filter (Chromium / Android WebView) */
const lensOK=()=>/Chrome\//.test(navigator.userAgent)&&!/Edg\/|OPR\//.test(navigator.userAgent);
const TARGETS='#dock,#trf,#start';
const lensOn=()=>{let v=null;try{v=ls('aur.lens')}catch(e){}return v!=='0'&&lensOK()&&glass()&&!document.body.classList.contains('perf')&&!document.body.classList.contains('lite')};
const cache={};let svgRoot=null,uid=0;
function mapURL(w,h,r,B){const k=w+'x'+h+'x'+r+'x'+B;if(cache[k])return cache[k];
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),im=x.createImageData(w,h),d=im.data,cx=w/2,cy=h/2,hx=w/2,hy=h/2;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const px=i+.5-cx,py=j+.5-cy,qx=Math.abs(px)-(hx-r),qy=Math.abs(py)-(hy-r),ox=Math.max(qx,0),oy=Math.max(qy,0),sd=Math.hypot(ox,oy)+Math.min(Math.max(qx,qy),0)-r,dd=-sd,o=(j*w+i)*4;
  let R=128,G=128;
  if(dd<B){let nx,ny;if(qx>0&&qy>0){const l=Math.hypot(qx,qy)||1;nx=Math.sign(px)*qx/l;ny=Math.sign(py)*qy/l}else if(qx>qy){nx=Math.sign(px);ny=0}else{nx=0;ny=Math.sign(py)}
   const t=Math.max(0,dd)/B,m=Math.pow(1-t,2.4);R=128-nx*m*127;G=128-ny*m*127}
  d[o]=R;d[o+1]=G;d[o+2]=128;d[o+3]=255}
 x.putImageData(im,0,0);return cache[k]=c.toDataURL('image/png')}
function lensFor(el){if(!el)return;
 if(!lensOn()){el.style.removeProperty('-webkit-backdrop-filter');el.style.removeProperty('backdrop-filter');return}
 const w=Math.round(el.offsetWidth),h=Math.round(el.offsetHeight);if(w<40||h<40||w*h>900000)return;
 const cs=getComputedStyle(el);let r=parseFloat(cs.borderTopLeftRadius)||20;r=Math.min(r,w/2,h/2);const B=Math.max(10,Math.min(26,Math.round(Math.min(w,h)*.3)));
 if(!svgRoot){svgRoot=document.createElement('div');svgRoot.id='gl-lens-svg';svgRoot.setAttribute('aria-hidden','true');svgRoot.style.cssText='position:absolute;width:0;height:0;overflow:hidden';document.body.appendChild(svgRoot)}
 const id=el.dataset.glLens||(el.dataset.glLens='gl-l'+(++uid));let f=document.getElementById(id);
 const key=w+'x'+h;if(!f||f.getAttribute('data-k')!==key){const url=mapURL(w,h,r,B),sc=Math.round(B*1.7);
  const html='<svg width="0" height="0"><filter id="'+id+'" data-k="'+key+'" x="0" y="0" width="'+w+'" height="'+h+'" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage href="'+url+'" x="0" y="0" width="'+w+'" height="'+h+'" preserveAspectRatio="none" result="m"/><feDisplacementMap in="SourceGraphic" in2="m" scale="'+sc+'" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
  const old=document.getElementById(id);if(old)old.parentNode.parentNode.removeChild(old.parentNode);const wr=document.createElement('div');wr.innerHTML=html;svgRoot.appendChild(wr.firstChild)}
 const v='url(#'+id+') blur(3px) saturate(1.9) brightness(1.1)';el.style.setProperty('-webkit-backdrop-filter',v,'important');el.style.setProperty('backdrop-filter',v,'important')}
let raf=0;const all=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>document.querySelectorAll(TARGETS).forEach(lensFor))};
function setLens(on){try{ls('aur.lens',on?'1':'0')}catch(e){}all()}
try{const ro=new ResizeObserver(all);const hook=()=>document.querySelectorAll(TARGETS).forEach(e=>ro.observe(e));hook();
 new MutationObserver(all).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(all).observe(document.documentElement,{attributes:true,attributeFilter:['data-skin']});
 new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))hook()}).observe(document.body,{childList:true})}catch(e){}
window.NXGlass={setLens:setLens,lensSupported:lensOK};
all();setTimeout(all,600);
})();

/* THEME-FIX-3.4.1 - robust Themes section in Settings + Liquid Glass intensity sliders (injected by scripts/prepare-web.mjs) */
(function(){'use strict';
if(typeof S==='undefined'||typeof ls!=='function')return;
var root=document.documentElement;root.setAttribute('data-nx','3.4.1');
if(!document.getElementById('nx-theme-css'))console.warn('THEME-FIX-3.4.1: base theme mod (zz-theme-3.4.0) did not run');
var IDS=['dark','light','glass'],NM={dark:'Dark',light:'Light',glass:'Liquid Glass'},NT={dark:'Default',light:'Bright and clean',glass:'Frosted translucent glass'};
/* PREVIEW PLACEHOLDERS: replace with your own images, e.g. 'assets/themes/dark.png' */
function ph(k){var C={dark:['#0f172a','#1e293b','#1f232b'],light:['#dbeafe','#e0e7ff','#ffffff'],glass:['#4f46e5','#ec4899','rgba(255,255,255,.25)']}[k],g=k==='glass',st=g?' stroke="rgba(255,255,255,.55)" stroke-width="1.5"':'';
 var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+C[0]+'"/><stop offset="1" stop-color="'+C[1]+'"/></linearGradient></defs><rect width="320" height="200" fill="url(#w)"/>'+(g?'<circle cx="250" cy="50" r="46" fill="#fbbf24" opacity=".55"/>':'')+'<rect x="36" y="28" width="176" height="112" rx="10" fill="'+C[2]+'"'+st+'/><rect x="36" y="28" width="176" height="20" rx="10" fill="#fff" opacity=".12"/><rect x="50" y="64" width="110" height="6" rx="3" fill="#fff" opacity=".7"/><rect x="50" y="80" width="140" height="5" rx="2.5" fill="#fff" opacity=".4"/><rect x="70" y="166" width="180" height="22" rx="10" fill="'+C[2]+'"'+st+'/></svg>';
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(s)}
var PV={dark:ph('dark'),light:ph('light'),glass:ph('glass')};
/* glass intensity */
function gnum(k,d,a,b){var v=parseFloat(ls(k));return v>=a&&v<=b?v:d}
function applyGlass(){root.style.setProperty('--nx-blur',gnum('aur.gb',26,6,50)+'px');root.style.setProperty('--nx-a',String(gnum('aur.ga',.5,.2,.85)))}
var st=document.createElement('style');st.id='nx-theme-fix-css';st.textContent=[
':root[data-skin=glass]{--surf:rgba(26,34,58,var(--nx-a,.5));--pn:rgba(22,30,54,calc(var(--nx-a,.5) - .06))}',
':root[data-skin=glass] body:not(.pdrag):not(.perf):not(.lite) :is(.nxw,#dock,#start,#ctx,#trf,#pwm,#selbar,#tbpv){-webkit-backdrop-filter:blur(var(--nx-blur,26px)) saturate(170%);backdrop-filter:blur(var(--nx-blur,26px)) saturate(170%)}',
'.nxt-gl{margin:0 0 18px;padding:12px 14px;border-radius:16px;background:var(--surf2);border:1px solid var(--line)}',
'.nxt-gl h4{margin:0 0 8px}.nxt-gl label{display:block;font-size:12.5px;color:var(--mut);margin:10px 0 4px}.nxt-gl label b{float:right;color:var(--txt);font-weight:600}',
'.nxt-gl input[type=range]{width:100%;background:none;border:0;padding:0;margin:0;-webkit-user-select:none;user-select:none}',
'.nxt-gl .pgb{margin-top:12px}'
].join('\n');document.head.appendChild(st);applyGlass();
function cards(){return IDS.map(function(t){return '<button class="nxt-card'+(S.theme===t?' sel':'')+'" data-nxt="'+t+'"><img src="'+PV[t]+'" alt="'+NM[t]+' preview" draggable="false"><b>'+NM[t]+'</b><small>'+NT[t]+'</small></button>'}).join('')}
function sliders(){var b=gnum('aur.gb',26,6,50),a=Math.round(gnum('aur.ga',.5,.2,.85)*100);
 return '<h4>Liquid Glass intensity</h4><label>Blur <b data-nxv="gb">'+b+'</b><input type="range" min="6" max="50" step="1" value="'+b+'" data-nxg="gb"></label><label>Tint (opacity) <b data-nxv="ga">'+a+'%</b><input type="range" min="20" max="85" step="1" value="'+a+'" data-nxg="ga"></label><button class="pgb" data-nxg="reset">Reset glass</button>'}
function hdr(el){return el&&/^H[2-4]$/.test(el.tagName)}
function anchor(p){var hs=p.querySelectorAll('h3'),h3=null;for(var i=0;i<hs.length;i++)if(/^\s*colou?rs?\s*$/i.test(hs[i].textContent)){h3=hs[i];break}
 if(h3)return{parent:h3.parentNode,ref:h3.nextSibling};
 var o=p.querySelector('[data-k="theme"],[data-k="acc"],[data-k="accent"]');if(o){var s=o.closest('.seg')||o.parentElement,h=s.previousElementSibling;return{parent:s.parentNode,ref:hdr(h)?h:s}}
 return null}
function hideOld(p){p.querySelectorAll('[data-k="theme"]').forEach(function(b){var s=b.closest('.seg');if(!s)return;s.style.display='none';var h=s.previousElementSibling;if(hdr(h)&&/theme/i.test(h.textContent))h.style.display='none'})}
function sweep(){var p=document.getElementById('spg');if(!p)return;var box=p.querySelector('.nxt');
 if(!box){var an=anchor(p);if(!an)return;box=document.createElement('div');box.className='nxt';box.innerHTML='<h4>Themes</h4><div class="nxt-grid">'+cards()+'</div>';an.parent.insertBefore(box,an.ref||null)}
 hideOld(p);
 if(!box.querySelector('.nxt-gl')){var g=document.createElement('div');g.className='nxt-gl';g.innerHTML=sliders();box.appendChild(g)}}
function pick(v){if(IDS.indexOf(v)<0)return;if(S.theme!==v){S.theme=v;ls('aur.theme',v);if(typeof window.applyTheme==='function')window.applyTheme();try{if(typeof applyTb==='function')applyTb()}catch(e){}}
 document.querySelectorAll('.nxt-card').forEach(function(c){c.classList.toggle('sel',c.dataset.nxt===v)})}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var c=t.closest('[data-nxt]');if(c){pick(c.dataset.nxt);return}
 var r=t.closest('[data-nxg="reset"]');if(r){ls('aur.gb','');ls('aur.ga','');applyGlass();var b=r.closest('.nxt-gl');if(b)b.innerHTML=sliders()}},true);
document.addEventListener('input',function(e){var t=e.target,k=t&&t.dataset&&t.dataset.nxg;if(k!=='gb'&&k!=='ga')return;var v=parseFloat(t.value);
 ls(k==='gb'?'aur.gb':'aur.ga',String(k==='gb'?v:v/100));applyGlass();var l=t.closest('.nxt-gl').querySelector('[data-nxv="'+k+'"]');if(l)l.textContent=k==='gb'?v:v+'%'},true);
var tm=0;new MutationObserver(function(){if(tm)return;tm=setTimeout(function(){tm=0;sweep()},80)}).observe(document.body,{childList:true,subtree:true});
sweep();
})();

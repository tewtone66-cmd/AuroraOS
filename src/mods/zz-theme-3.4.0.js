/* THEME-3.4.0 - Dark / Light / Liquid Glass, new logo look, global text selection (injected by scripts/prepare-web.mjs) */
(function(){'use strict';
if(typeof S==='undefined'||typeof ls!=='function')return;
var IDS=['dark','light','glass'];
var NAMES={dark:'Dark',light:'Light',glass:'Liquid Glass'};
var NOTES={dark:'Default',light:'Bright and clean',glass:'Frosted translucent glass'};
/* ---------- preview images: PLACEHOLDERS. Replace the three values with your own images, e.g. 'assets/themes/dark.png' ---------- */
function ph(k){var C={dark:['#0f172a','#1e293b','#1f232b','#2b303a','#9aa3b2','#eef1f6'],light:['#dbeafe','#e0e7ff','#ffffff','#f0f2f7','#69717f','#161a22'],glass:['#4f46e5','#ec4899','rgba(255,255,255,.22)','rgba(255,255,255,.16)','rgba(255,255,255,.7)','#ffffff']}[k];
 var glass=k==='glass',st=glass?' stroke="rgba(255,255,255,.55)" stroke-width="1.5"':'';
 var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+C[0]+'"/>'+(glass?'<stop offset=".5" stop-color="#06b6d4"/>':'')+'<stop offset="1" stop-color="'+C[1]+'"/></linearGradient></defs>'+
 '<rect width="320" height="200" fill="url(#w)"/>'+(glass?'<circle cx="250" cy="50" r="46" fill="#fbbf24" opacity=".55"/>':'')+
 '<rect x="150" y="60" width="120" height="80" rx="10" fill="'+C[2]+'"'+st+'/>'+
 '<rect x="36" y="28" width="176" height="112" rx="10" fill="'+C[2]+'"'+st+'/>'+
 '<rect x="36" y="28" width="176" height="20" rx="10" fill="'+C[3]+'"/>'+
 '<circle cx="48" cy="38" r="3" fill="#f87171"/><circle cx="58" cy="38" r="3" fill="#fbbf24"/><circle cx="68" cy="38" r="3" fill="#4ade80"/>'+
 '<rect x="50" y="62" width="110" height="6" rx="3" fill="'+C[5]+'" opacity=".9"/><rect x="50" y="78" width="140" height="5" rx="2.5" fill="'+C[4]+'"/><rect x="50" y="92" width="96" height="5" rx="2.5" fill="'+C[4]+'"/><rect x="50" y="106" width="120" height="5" rx="2.5" fill="'+C[4]+'"/>'+
 '<rect x="70" y="166" width="180" height="22" rx="11" fill="'+C[2]+'"'+st+'/><circle cx="160" cy="177" r="5" fill="#7c9bff"/></svg>';
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(s)}
var PREVIEW={dark:ph('dark'),light:ph('light'),glass:ph('glass')};
/* ---------- state: Dark is the default, 'auto' is migrated ---------- */
function valid(t){return IDS.indexOf(t)>=0}
if(!valid(S.theme)){S.theme='dark';ls('aur.theme','dark')}
var root=document.documentElement;
function applyNex(){if(!valid(S.theme)){S.theme='dark';ls('aur.theme','dark')}
 var t=S.theme,base=t==='light'?'light':'dark';
 if(root.getAttribute('data-theme')!==base)root.setAttribute('data-theme',base);
 if(t==='glass'){if(root.getAttribute('data-skin')!=='glass')root.setAttribute('data-skin','glass')}else if(root.hasAttribute('data-skin'))root.removeAttribute('data-skin');
 root.style.colorScheme=base;if(document.body)document.body.classList.toggle('nx-glass',t==='glass')}
var _at=window.applyTheme;
window.applyTheme=function(){try{if(typeof _at==='function')_at.apply(this,arguments)}catch(e){}applyNex()};
new MutationObserver(applyNex).observe(root,{attributes:true,attributeFilter:['data-theme']});
function setTheme(v){if(!valid(v))return;S.theme=v;ls('aur.theme',v);window.applyTheme();try{if(typeof applyTb==='function')applyTb()}catch(e){}
 document.querySelectorAll('.nxt-card').forEach(function(c){c.classList.toggle('sel',c.dataset.nxt===v)});
 document.querySelectorAll('#oobe [data-t]').forEach(function(c){c.classList.toggle('sel',c.dataset.t===v)})}
if(typeof togTheme==='function')window.togTheme=function(){setTheme(S.theme==='light'?'dark':'light')};
/* ---------- css ---------- */
var G=':root[data-skin=glass]',SURF=G+' :is(.nxw,#start,#ctx,#trf,#pwm,#selbar,#tbpv)';
var css=[
/* selection: blue everywhere, per theme */
':root{--nx-sel:#2b7fff;--nx-selfg:#fff}:root[data-theme=dark]{--nx-sel:#2f6df0}'+G+'{--nx-sel:rgba(64,140,255,.66)}',
'::selection{background:var(--nx-sel);color:var(--nx-selfg);text-shadow:none}',
'.body,.tmo,.cro,#spg,#wn,#oobe .oc{-webkit-user-select:text;user-select:text}',
'button,[role=button],.tbar,.tbar *,.ni,.ib,.dk,.di,.row,.ftile,.drive,.btab,.seg,.step,.qt,.sbk,svg,img,#dock,#dock *,#start .sfoot,#ctx,#ctx *,#selbar,#selbar *,#tbpv,.nxt-card{-webkit-user-select:none;user-select:none}',
'input,textarea,[contenteditable=true]{-webkit-user-select:text;user-select:text}',
/* logo: cleaner N, deeper glow */
'.star path,#nxb path.p{d:path("M196 348V164L316 348V164");stroke-width:40px}',
'.star,#nxb svg{filter:drop-shadow(0 0 12px rgba(99,102,241,.5))}body.perf .star,body.perf #nxb svg{filter:none}',
/* theme cards */
'.nxt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:10px 0 18px}',
'.nxt-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:16px;border:2px solid var(--line);background:var(--surf2);color:var(--txt);font:inherit;text-align:left;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}',
'.nxt-card:active{transform:scale(.98)}.nxt-card img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;display:block;pointer-events:none}',
'.nxt-card b{font-size:13px;padding:0 2px}.nxt-card small{font-size:11px;color:var(--mut);padding:0 2px 2px}',
'.nxt-card.sel{border-color:var(--acc);box-shadow:0 0 0 3px rgba(124,155,255,.28)}',
'.nxt-card.sel::after{content:"\2713";position:absolute;top:14px;right:14px;width:22px;height:22px;border-radius:50%;background:var(--acc);color:var(--accT);display:grid;place-items:center;font-size:13px;font-weight:700}',
/* liquid glass tokens */
G+'{--surf:rgba(26,34,58,.5);--surf2:rgba(255,255,255,.09);--txt:#f5f8ff;--mut:rgba(226,234,255,.7);--line:rgba(255,255,255,.17);--acc:#9bb8ff;--accT:#0a1330;--pn:rgba(22,30,54,.44);--hov:rgba(255,255,255,.13);--dim:.2;--selbg:rgba(90,150,255,.4)}',
SURF+'{background-color:var(--surf);background-image:radial-gradient(120% 70% at 0% 0%,rgba(255,255,255,.2),rgba(255,255,255,0) 55%),radial-gradient(90% 60% at 100% 100%,rgba(110,160,255,.14),rgba(110,160,255,0) 60%),linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0));border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.2),inset 0 0 0 1px rgba(255,255,255,.05),0 24px 60px rgba(0,0,0,.38),0 2px 10px rgba(0,0,0,.22)}',
G+' body:not(.pdrag):not(.perf):not(.lite) :is(.nxw,#dock,#start,#ctx,#trf,#pwm,#selbar,#tbpv){-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%)}',
G+' body.perf :is(.nxw,#dock,#start,#ctx,#trf,#pwm,#selbar,#tbpv){background-color:rgba(24,30,50,.94)}',
G+' #dock{background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.05)),rgba(20,28,52,.42)!important;border-color:rgba(255,255,255,.2)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.38),0 10px 34px rgba(0,0,0,.35)!important}',
G+' body #clock,'+G+' body #tray{color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)}',
G+' .nxw .body{background:transparent}',
G+' .nxw .tbar{background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0));border-bottom:1px solid rgba(255,255,255,.12)}',
G+' :is(.sinp,input,textarea){background:rgba(255,255,255,.08);border:1px solid var(--line);color:var(--txt)}',
G+' .seg{background:rgba(255,255,255,.08);border:1px solid var(--line)}',
G+' .seg button.sel{background:linear-gradient(180deg,rgba(150,185,255,.6),rgba(100,140,240,.48));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}',
G+' .pgb{background:rgba(255,255,255,.12);border:1px solid var(--line);color:var(--txt)}',
G+' .qt{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12)}'
].join('\n');
var st=document.createElement('style');st.id='nx-theme-css';st.textContent=css;document.head.appendChild(st);
/* ---------- logo: gradient + favicon ---------- */
(function(){var g=document.getElementById('nxg');if(g){var s=g.querySelectorAll('stop');if(s.length>=2){s[0].setAttribute('stop-color','#67e8f9');s[s.length-1].setAttribute('stop-color','#a78bfa');if(s.length===2){var m=document.createElementNS('http://www.w3.org/2000/svg','stop');m.setAttribute('offset','.55');m.setAttribute('stop-color','#6366f1');g.insertBefore(m,s[1])}}}
 var fav='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a2250"/><stop offset="1" stop-color="#05070f"/></linearGradient><linearGradient id="n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset=".55" stop-color="#6366f1"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#t)"/><path d="M196 348V164L316 348V164" fill="none" stroke="url(#n)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 var l=document.querySelector('link[rel~=icon]');if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}l.type='image/svg+xml';l.href='data:image/svg+xml;utf8,'+encodeURIComponent(fav)})();
/* ---------- tag window elements (parent chain of .tbar that is positioned) ---------- */
function winOf(b){var e=b.parentElement;while(e&&e!==document.body){var c=getComputedStyle(e).position;if(c==='absolute'||c==='fixed')return e;e=e.parentElement}return b.parentElement}
function tag(n){if(!n||n.nodeType!==1)return;var bs=n.matches&&n.matches('.tbar')?[n]:(n.querySelectorAll?n.querySelectorAll('.tbar'):[]);
 for(var i=0;i<bs.length;i++){var w=winOf(bs[i]);if(w&&!w.classList.contains('nxw'))w.classList.add('nxw')}}
/* ---------- Settings > Colors: Themes section ---------- */
function cards(){return IDS.map(function(t){return '<button class="nxt-card'+(S.theme===t?' sel':'')+'" data-nxt="'+t+'"><img src="'+PREVIEW[t]+'" alt="'+NAMES[t]+' preview" draggable="false"><b>'+NAMES[t]+'</b><small>'+NOTES[t]+'</small></button>'}).join('')}
function injectSettings(){var p=document.getElementById('spg');if(!p||p.querySelector('.nxt'))return;var old=p.querySelector('[data-k="theme"]');if(!old)return;
 var seg=old.closest('.seg')||old.parentElement,h=seg.previousElementSibling,hh=h&&/^H[2-4]$/.test(h.tagName)&&/theme/i.test(h.textContent);
 var box=document.createElement('div');box.className='nxt';box.innerHTML='<h4>Themes</h4><div class="nxt-grid">'+cards()+'</div>';
 seg.parentNode.insertBefore(box,hh?h:seg);seg.style.display='none';if(hh)h.style.display='none'}
function fixOobe(){var seg=document.querySelector('#oobe .oseg');if(!seg||seg.dataset.nx||!seg.querySelector('[data-t="dark"]'))return;seg.dataset.nx='1';
 seg.innerHTML=IDS.map(function(t){return '<button data-t="'+t+'" class="'+(S.theme===t?'sel':'')+'">'+NAMES[t]+'</button>'}).join('')}
document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('[data-nxt]');if(c){e.stopPropagation();e.preventDefault();setTheme(c.dataset.nxt);if(typeof toast==='function')try{toast('Theme: '+NAMES[c.dataset.nxt])}catch(_){}return}
 var o=e.target.closest&&e.target.closest('#oobe [data-t]');if(o&&valid(o.dataset.t)){e.stopPropagation();e.preventDefault();setTheme(o.dataset.t)}},true);
var raf=0;function sweep(){raf=0;injectSettings();fixOobe()}
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)tag(a[j])}if(!raf)raf=requestAnimationFrame(sweep)}).observe(document.body,{childList:true,subtree:true});
document.querySelectorAll('.tbar').forEach(tag);
applyNex();sweep();
})();

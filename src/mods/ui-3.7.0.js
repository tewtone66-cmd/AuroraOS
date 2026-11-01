/* UI-3.7.0 - clean app icons (selectable in Settings > Themes: Icon style), new wallpapers, softer window buttons, see-through title bar, window drag/resize safety net.
   Works on top of the existing app (overrides A[id].g and IC[id], pushes into WALL). Dark/Light/Glass themes keep working.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
if(typeof A==='undefined')return;
const KEY='aur.icons',nk=x=>String(x).replace(/\s+/g,'');
/* ---------- icons: calm two-tone gradients + simple glyphs with a soft body fill ---------- */
const PAL={browser:['#6f9ceb','#4f78c9'],files:['#e0b66a','#c7924a'],notes:['#9bb87a','#6f9658'],photos:['#c78fb0','#9a6ea0'],media:['#e08a8a','#bd6262'],calc:['#8a94a6','#5f6878'],set:['#9aa3b2','#6b7484'],trash:['#8fb3b3','#648f94'],code:['#6fb8a0','#4a8f7e'],music:['#e08aa8','#bf5f85'],zip:['#d9a76a','#b98046'],term:['#4a5260','#2c323d'],taskmgr:['#7fb0c9','#5a8fae']};
const svg=b=>'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+b+'</svg>';
const dots=d=>'<path d="'+d+'" stroke-width="2.6"/>',SF=' fill="#fff" fill-opacity=".2"';
const GL={
 browser:'<circle cx="12" cy="12" r="8.8"'+SF+'/><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z" fill="#fff" fill-opacity=".9"/>',
 files:'<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"'+SF+'/>',
 notes:'<rect x="5" y="3.5" width="14" height="17" rx="2.6"'+SF+'/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
 photos:'<rect x="3.5" y="4.5" width="17" height="15" rx="3"'+SF+'/><circle cx="9" cy="10" r="1.6" fill="#fff"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/>',
 media:'<circle cx="12" cy="12" r="8.8"'+SF+'/><path d="M10 8.6l5.6 3.4-5.6 3.4z" fill="#fff"/>',
 calc:'<rect x="5.5" y="3" width="13" height="18" rx="2.6"'+SF+'/><path d="M8.5 6.5h7v3h-7z"/>'+dots('M9 13.5h.01M12 13.5h.01M15 13.5h.01M9 17h.01M12 17h.01M15 17h.01'),
 set:'<path d="M5 7h8M17 7h2M5 17h2M11 17h8"/><circle cx="15" cy="7" r="2"'+SF+'/><circle cx="9" cy="17" r="2"'+SF+'/>',
 trash:'<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10.5 11v5M13.5 11v5"/>',
 code:'<path d="M8.5 8l-4 4 4 4M15.5 8l4 4-4 4M13 6.5l-2 11"/>',
 music:'<path d="M9 17.5v-11l10-2v11"/><circle cx="7" cy="17.5" r="2"'+SF+'/><circle cx="17" cy="15.5" r="2"'+SF+'/>',
 zip:'<path d="M4 7.5h16v3H4zM5.5 10.5V19h13v-8.5M10 13.5h4"/>',
 term:'<path d="M5 8l4 4-4 4M11 16h7"/>',
 taskmgr:'<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>'
};
const ICN={};for(const id in GL)ICN[id]=svg(GL[id]);
const NG=id=>'linear-gradient(160deg,'+PAL[id][0]+','+PAL[id][1]+')';
const OLDG={},OLDIC={},GMAP={};
for(const id in PAL){if(A[id])OLDG[id]=A[id].g}
try{if(typeof IC!=='undefined')for(const id in PAL)if(IC[id]!==undefined)OLDIC[id]=IC[id]}catch(e){}
for(const id in PAL){if(OLDG[id])GMAP[nk(OLDG[id])]=id;GMAP[nk(NG(id))]=id}
let mode=(typeof ls==='function'&&ls(KEY)==='classic')?'classic':'clean';
const dyn=document.createElement('style');dyn.id='ui-icons';
function applyMode(m){mode=m;try{ls(KEY,m)}catch(e){}
 for(const id in PAL){if(!A[id])continue;A[id].g=m==='clean'?NG(id):(OLDG[id]||A[id].g);try{if(typeof IC!=='undefined'){const v=m==='clean'?ICN[id]:OLDIC[id];if(v!==undefined)IC[id]=v}}catch(e){}}
 let c='';if(m==='clean'){c=':root:root .ico{box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.2)!important}:root:root .ico svg{filter:drop-shadow(0 1px 1px rgba(0,0,0,.2))}';for(const id in PAL)c+='[data-id="'+id+'"] .ico{--g:'+NG(id)+'!important}'}
 dyn.textContent=c;refreshIcons();mountCards()}
function refreshIcons(){document.querySelectorAll('.ico').forEach(el=>{if(el.dataset.nx===mode)return;const id=GMAP[nk(el.style.getPropertyValue('--g'))];if(!id)return;el.dataset.nx=mode;const v=mode==='clean'?ICN[id]:OLDIC[id];if(v!==undefined)el.innerHTML=v;el.style.setProperty('--g',mode==='clean'?NG(id):(OLDG[id]||NG(id)))})}
/* Settings > Themes: "Icon style" cards (same look as the theme cards) */
const PV=['browser','files','photos','code','music','set'];
const prev=m=>'<span class="nxd">'+PV.map(id=>{const g=(m==='clean'?NG(id):(OLDG[id]||NG(id))).replace(/"/g,'&quot;'),s=m==='clean'?ICN[id]:(OLDIC[id]||ICN[id]);return '<i class="nxm" style="--g:'+g+'">'+s+'</i>'}).join('')+'</span>';
const card=(m,n)=>'<button class="nxc'+(mode===m?' sel':'')+'" data-icm="'+m+'"><span class="nxp">'+prev(m)+'</span><b>'+n+'</b></button>';
function mountCards(){const t=document.querySelector('.thc');if(!t||!t.closest('.win'))return;const grid=t.parentElement;if(!grid)return;let sec=document.getElementById('ic-sec');
 if(!sec||!sec.isConnected||sec.previousElementSibling!==grid){if(sec)sec.remove();sec=document.createElement('div');sec.id='ic-sec';grid.insertAdjacentElement('afterend',sec);
  sec.addEventListener('click',e=>{const c=e.target.closest('[data-icm]');if(!c)return;e.stopPropagation();applyMode(c.dataset.icm);if(typeof toast==='function')toast('Icon style: '+(c.dataset.icm==='clean'?'Clean':'Classic'))});sec.dataset.mode=''}
 if(sec.dataset.mode!==mode){sec.dataset.mode=mode;sec.innerHTML='<div class="nxh">Icon style</div><div class="nxg">'+card('clean','Clean')+card('classic','Classic')+'</div>'}}

/* ---------- wallpapers ---------- */
const wp=(c0,c1,bl)=>{let d='',e='';bl.forEach((b,i)=>{d+='<radialGradient id="b'+i+'"><stop offset="0" stop-color="'+b[4]+'" stop-opacity="'+b[5]+'"/><stop offset="1" stop-color="'+b[4]+'" stop-opacity="0"/></radialGradient>';e+='<ellipse cx="'+b[0]+'" cy="'+b[1]+'" rx="'+b[2]+'" ry="'+b[3]+'" fill="url(#b'+i+')"/>'});
 const s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c0+'"/><stop offset="1" stop-color="'+c1+'"/></linearGradient>'+d+'</defs><rect width="1600" height="900" fill="url(#g)"/>'+e+'</svg>';
 return 'url("data:image/svg+xml,'+encodeURIComponent(s)+'")'};
const NEW=[
 wp('#0e1b2e','#17324d',[[420,260,700,460,'#3fd0c9',.55],[1250,200,620,420,'#7a6cff',.5],[900,780,800,420,'#2e8bff',.45]]),
 wp('#fbe9e0','#e8eefc',[[300,200,640,420,'#ffb59a',.7],[1280,300,640,440,'#b9a8ff',.55],[800,820,760,380,'#9cd0ff',.6]]),
 wp('#06141f','#0a2a43',[[380,700,720,420,'#0fa3b1',.5],[1200,260,700,440,'#1f6fb2',.55],[820,120,520,260,'#123c69',.6]]),
 wp('#eef3ec','#dfe9e4',[[320,280,640,420,'#b7d3c0',.8],[1300,700,700,420,'#f3e7cf',.8],[900,300,520,300,'#cfe0d6',.7]]),
 wp('#1a1230','#2b1d4f',[[300,720,700,420,'#ff7aa8',.5],[1300,260,640,420,'#7a5cff',.55],[860,860,620,300,'#ffb36b',.4]]),
 wp('#14161a','#23272e',[[400,240,640,400,'#3b4252',.7],[1240,680,720,420,'#4c566a',.5],[820,420,420,260,'#2b303b',.8]]),
 wp('#cfe6ff','#eaf4ff',[[320,220,640,400,'#8ec5ff',.75],[1280,260,620,380,'#b8d9ff',.8],[840,820,760,360,'#ffffff',.9]]),
 wp('#f6dfe6','#e4dcf3',[[300,260,640,420,'#f4a6c0',.65],[1300,640,700,440,'#c3b3f2',.6],[860,200,560,300,'#ffd9c2',.7]])
];
try{if(typeof WALL!=='undefined'&&Array.isArray(WALL)&&WALL.length<40&&!WALL.__nx){NEW.forEach(w=>WALL.push(w));WALL.__nx=1}}catch(e){}

/* ---------- css ---------- */
let css=':root:root .win .tbar{background:transparent!important;box-shadow:none!important;border:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'+
':root:root .win .tbar span{opacity:.72;font-weight:600}'+
':root:root .win .tbar button{width:26px!important;height:26px!important;margin:0 4px!important;padding:0!important;border-radius:50%!important;align-self:center;display:grid!important;place-items:center;border:0!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 1px 3px rgba(0,0,0,.28)!important;transition:transform .22s var(--spring,cubic-bezier(.34,1.56,.64,1)),filter .15s,background-color .15s}'+
':root:root .win .tbar button:last-child{margin-right:10px!important}'+
':root:root .win .tbar button svg{width:12px!important;height:12px!important;opacity:.92}'+
':root:root .win .tbar button:hover{transform:scale(1.14);filter:brightness(1.08)}:root:root .win .tbar button:active{transform:scale(.86)}'+
':root:root .win .tbar .x,:root:root .win .tbar .x:hover,:root:root .win .tbar .x.vh,:root:root .win .tbar .x.fl{background:linear-gradient(180deg,#ff8279,#e5484d)!important}'+
':root:root .win .tbar .mn,:root:root .win .tbar .mn:hover,:root:root .win .tbar .mn.vh,:root:root .win .tbar .mn.fl{background:linear-gradient(180deg,#ffd978,#f2a93b)!important;color:#5a3b00!important}'+
':root:root .win .tbar .mx,:root:root .win .tbar .mx:hover,:root:root .win .tbar .mx.vh,:root:root .win .tbar .mx.fl{background:linear-gradient(180deg,#6fe39c,#2fb36a)!important}'+
':root:root .win .tbar .fsd{background:linear-gradient(180deg,#9db2d2,#6b82a8)!important}';
css+='#ic-sec{margin-top:18px}.nxh{font-weight:700;font-size:13px;margin:0 2px 10px}.nxg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.nxc{position:relative;display:flex;flex-direction:column;gap:10px;padding:8px 8px 12px;border:1px solid var(--line);border-radius:18px;background:var(--surf2);color:var(--txt);text-align:left;cursor:pointer;font:inherit;transition:transform .2s var(--ease),border-color .2s,box-shadow .25s}.nxc:hover{transform:translateY(-2px);border-color:var(--acc)}.nxc:active{transform:scale(.985)}.nxc.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc),0 10px 26px rgba(0,0,0,.18)}.nxp{display:block;position:relative;aspect-ratio:16/10;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#1b2036,#0b0d12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}.nxd{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:6px;padding:7px;border-radius:16px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.nxm{display:block;width:22px;height:22px;padding:4px;border-radius:7px;background:var(--g);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 1px 3px rgba(0,0,0,.3)}.nxm svg{width:100%;height:100%;display:block}:root[data-skin=glass] .nxc{border-radius:22px}';
const st=document.createElement('style');st.id='ui-css';st.textContent=css;document.head.appendChild(st);document.head.appendChild(dyn);
const tick=()=>{refreshIcons();mountCards()};applyMode(mode);setTimeout(tick,900);
try{new MutationObserver(()=>{clearTimeout(tick.t);tick.t=setTimeout(tick,120)}).observe(document.body,{childList:true,subtree:true})}catch(e){}

/* ---------- window drag / resize safety net ---------- */
let cur=null,raf=0;
function fit(el){if(!el||!el.isConnected||el.classList.contains('max'))return;
 const vw=innerWidth,vh=innerHeight,w=el.offsetWidth,h=el.offsetHeight;let L=parseFloat(el.style.left),T=parseFloat(el.style.top);if(!isFinite(L))L=0;if(!isFinite(T))T=0;
 const nL=Math.min(Math.max(L,-(w-96)),vw-96),nT=Math.min(Math.max(T,0),vh-48);
 if(nL!==L)el.style.left=nL+'px';if(nT!==T)el.style.top=nT+'px';if(w>vw)el.style.width=vw+'px';if(h>vh)el.style.height=vh+'px'}
function repair(el){if(!el||!el.isConnected||/minning|closing/.test(el.className))return;const cs=getComputedStyle(el);
 if(+cs.opacity<.05)el.style.opacity='1';if(cs.visibility==='hidden')el.style.visibility='visible';if(cs.display==='none')el.style.display='flex'}
function loop(){raf=0;if(!cur)return;if(cur.classList.contains('tr'))cur.classList.remove('tr');fit(cur);
 if(document.body.classList.contains('pdrag'))raf=requestAnimationFrame(loop);else{fit(cur);repair(cur);cur=null}}
addEventListener('pointerdown',e=>{const t=e.target;if(!t||!t.closest||t.closest('button'))return;if(!t.closest('.tbar,.rz,.rzr,.rzb'))return;cur=t.closest('.win');if(cur&&!raf)raf=requestAnimationFrame(loop)},true);
addEventListener('resize',()=>document.querySelectorAll('.win:not(.max)').forEach(fit));
})();

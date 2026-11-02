/* UX-4.0.3 - window button styles (Mac / Classic), wallpaper tiles, Update page, Mouse quick links */
(function(){'use strict';
var doc=document,root=doc.documentElement;
function g(k,d){var v;try{v=localStorage.getItem(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
/* ---------- what's new for 4.0.0 (used by the dialog and the Update page) ---------- */
window.NXWN=[
['🖱️','Better virtual mouse','Cursor stays visible while moving windows, hand/text/resize icons, drag files onto folders and other windows'],
['⌨️','On-screen keyboard','Sits next to the clock, stays above web pages, and its keys reach websites'],
['🪟','Window button styles','Choose Mac or Classic buttons in Settings > Themes'],
['🏝️','Nex Island downloads','Downloads appear in the island with a cancel button'],
['🎨','All wallpapers show','The new wallpapers are visible in Settings > Background'],
['✨','Simpler logo','A cleaner NexOS mark everywhere'],
['⚙️','Calmer Settings','No icon flicker when switching pages, Update page with what is new']
];
/* ---------- window button styles ---------- */
var WB=g('aur.wbs','round');if(!/^(round|mac|classic)$/.test(WB))WB='round';
function applyWB(v){WB=v;put('aur.wbs',v);if(v==='round')root.removeAttribute('data-wbs');else root.setAttribute('data-wbs',v)}
if(WB!=='round')root.setAttribute('data-wbs',WB);
var X=':root[data-wbs]:root:root ';
var css=[
/* mac */
X+'.win .tbar{flex-direction:row}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar{padding-left:10px}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar button{width:13px!important;height:13px!important;margin:0 4px 0 0!important;border-radius:50%!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)!important;color:transparent!important;align-self:center;transform:none;filter:none;transition:filter .12s}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar button:hover{filter:brightness(1.1);transform:none}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar button svg{width:8px!important;height:8px!important;opacity:0;stroke-width:2.2}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar:hover button svg{opacity:.75;color:#3a2a10}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar .x{order:-30;background:#ff5f57!important}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar .mn{order:-29;background:#febc2e!important}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar .mx{order:-28;background:#28c840!important}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar .fsd{order:50;margin-left:auto!important;background:transparent!important;box-shadow:none!important;color:inherit!important}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar .tt{order:-20}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar span{order:-19}',
X.replace('[data-wbs]','[data-wbs=mac]')+'.win .tbar button:last-child{margin-right:0!important}',
/* classic (Windows) */
X.replace('[data-wbs]','[data-wbs=classic]')+'.win .tbar button{width:46px!important;height:100%!important;min-height:30px;margin:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:inherit!important;transform:none!important;filter:none!important;align-self:stretch}',
X.replace('[data-wbs]','[data-wbs=classic]')+'.win .tbar button:hover{background:rgba(127,127,127,.22)!important}',
X.replace('[data-wbs]','[data-wbs=classic]')+'.win .tbar .x:hover{background:#e81123!important;color:#fff!important}',
X.replace('[data-wbs]','[data-wbs=classic]')+'.win .tbar button svg{width:12px!important;height:12px!important;opacity:.9}',
X.replace('[data-wbs]','[data-wbs=classic]')+'.win .tbar button:last-child{margin-right:0!important}',
/* settings cards */
'#wb-sec{margin-top:18px}#wb-sec .nxh{font-weight:700;font-size:13px;margin:0 2px 10px}#wb-sec .nxg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
'#wb-sec .wbc{position:relative;display:flex;flex-direction:column;gap:8px;padding:8px 8px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surf2,transparent);color:var(--txt);text-align:left;font:inherit;cursor:pointer}',
'#wb-sec .wbc.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc)}#wb-sec .wbc b{font-size:13px;padding:0 2px}#wb-sec .wbc em{font-style:normal;font-size:11px;opacity:.65;padding:0 2px}',
'#wb-sec .wbp{display:block;height:64px;border-radius:9px;overflow:hidden;background:#12151c}#wb-sec .wbp svg{display:block;width:100%;height:100%}',
/* update page */
'.nxu .uh{display:flex;align-items:center;gap:14px;margin:4px 0 12px}.nxu .ul{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(160deg,#5b7cff,#8b5cf6)}.nxu .ul svg{width:30px;height:30px}',
'.nxu .uh h2{margin:0;font-size:18px}.nxu .uh p{margin:2px 0 0;font-size:12px;opacity:.7}',
'.nxu .uw{display:flex;flex-direction:column;gap:8px;margin:8px 0 14px}.nxu .ui{display:flex;gap:10px;align-items:flex-start;padding:9px 11px;border-radius:12px;background:var(--surf2,rgba(127,127,127,.1));border:1px solid var(--line)}',
'.nxu .ui i{font-style:normal;font-size:18px;line-height:1.2}.nxu .ui b{display:block;font-size:13px}.nxu .ui span{display:block;font-size:11.5px;opacity:.7;margin-top:2px}',
'.nxu .ub{display:flex;gap:8px;flex-wrap:wrap}',
/* mouse quick links */
'.mql{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.mql button{border:1px solid var(--line);background:var(--surf2,transparent);color:var(--txt);border-radius:999px;padding:5px 11px;font-size:12px;cursor:pointer}.mql button:active{transform:scale(.95)}'
].join('\n');
var st=doc.createElement('style');st.id='nx-ux-css';st.textContent=css;doc.head.appendChild(st);
var bar='<rect width="160" height="64" fill="#12151c"/><rect x="0" y="0" width="160" height="16" fill="#1d222c"/><rect x="10" y="24" width="90" height="5" rx="2.5" fill="#2b3240"/><rect x="10" y="35" width="120" height="5" rx="2.5" fill="#2b3240"/><rect x="10" y="46" width="70" height="5" rx="2.5" fill="#2b3240"/>';
var PRE={
 round:'<svg viewBox="0 0 160 64">'+bar+'<circle cx="118" cy="8" r="4.5" fill="#6fe39c"/><circle cx="130" cy="8" r="4.5" fill="#ffd978"/><circle cx="142" cy="8" r="4.5" fill="#ff8279"/></svg>',
 mac:'<svg viewBox="0 0 160 64">'+bar+'<circle cx="10" cy="8" r="3.6" fill="#ff5f57"/><circle cx="21" cy="8" r="3.6" fill="#febc2e"/><circle cx="32" cy="8" r="3.6" fill="#28c840"/></svg>',
 classic:'<svg viewBox="0 0 160 64">'+bar+'<rect x="106" y="0" width="18" height="16" fill="#2b3240"/><rect x="124" y="0" width="18" height="16" fill="#2b3240"/><rect x="142" y="0" width="18" height="16" fill="#e81123"/><path d="M111 8h8M129 5h8v6h-8zM148 5l6 6M154 5l-6 6" stroke="#fff" stroke-width="1" fill="none"/></svg>'
};
var NAMES={round:['Round','Colored buttons on the right'],mac:['Mac','Dots on the left'],classic:['Classic','Flat buttons like Windows']};
function wbCard(m){return '<button class="wbc'+(WB===m?' sel':'')+'" data-wb="'+m+'"><span class="wbp">'+PRE[m]+'</span><b>'+NAMES[m][0]+'</b><em>'+NAMES[m][1]+'</em></button>'}
function mountWB(){var t=doc.querySelector('.thc');if(!t||!t.closest('.win'))return;var grid=t.parentElement;if(!grid)return;
 var after=doc.getElementById('ic-sec')||grid,sec=doc.getElementById('wb-sec');
 if(!sec||!sec.isConnected||sec.previousElementSibling!==after){if(sec)sec.remove();sec=doc.createElement('div');sec.id='wb-sec';after.insertAdjacentElement('afterend',sec);
  sec.addEventListener('click',function(e){var c=e.target.closest('[data-wb]');if(!c)return;e.stopPropagation();applyWB(c.dataset.wb);sec.dataset.m='';mountWB()});sec.dataset.m=''}
 if(sec.dataset.m!==WB){sec.dataset.m=WB;sec.innerHTML='<div class="nxh">Window buttons</div><div class="nxg">'+wbCard('round')+wbCard('mac')+wbCard('classic')+'</div>'}}
/* ---------- wallpapers: quotes inside url("...") broke the inline style, so set it through the DOM ---------- */
function fixWalls(){if(typeof WALL==='undefined')return;doc.querySelectorAll('.walls button[data-v]').forEach(function(b){if(b.dataset.nxw)return;var i=+b.dataset.v,w=WALL[i];if(w){b.style.background=w;b.dataset.nxw='1'}})}
/* ---------- Update page ---------- */
function logoSvg(){return '<svg viewBox="0 0 512 512"><path d="M136 392 136 120 188 120 324 322 324 120 376 120 376 392 324 392 188 190 188 392Z" fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round"/></svg>'}
function updPage(pg){if(pg.dataset.nxu==='1')return;pg.dataset.nxu='1';
 var rows=window.NXWN.map(function(r){return '<div class="ui"><i>'+r[0]+'</i><div><b>'+r[1]+'</b><span>'+r[2]+'</span></div></div>'}).join('');
 pg.innerHTML='<button class="sbk" data-k="back">&#8249; Settings</button><div class="nxu"><div class="uh"><div class="ul">'+logoSvg()+'</div><div><h2>NexOS 4.0.0</h2><p>You are up to date. Channel: Alpha</p></div></div>'
  +'<h4>What is new</h4><div class="uw">'+rows+'</div><div class="ub"><button class="pgb" data-k="go" data-v="https://github.com/tewtone66-cmd/NexOS">Open GitHub</button><button class="pgb" data-nxwn="1">Show welcome</button></div><p class="bnote">Updates are installed manually: rebuild the app from GitHub.</p></div>'}
function mouseLinks(pg){if(pg.querySelector('.mql'))return;var h=pg.querySelector('h3');if(!h)return;var hs=[].slice.call(pg.querySelectorAll('h4,.mpv'));
 function find(re){for(var i=0;i<hs.length;i++){if(re.test(hs[i].textContent))return hs[i]}return null}
 var items=[['Preview',pg.querySelector('.mpv')],['Style',find(/Cursor style/i)],['Size',find(/^Size$/i)],['Color',find(/^Color$/i)],['Speed',find(/Pointer speed/i)]].filter(function(x){return x[1]});
 if(!items.length)return;var w=doc.createElement('div');w.className='mql';items.forEach(function(it){var b=doc.createElement('button');b.type='button';b.textContent=it[0];b.addEventListener('click',function(e){e.stopPropagation();try{it[1].scrollIntoView({behavior:'smooth',block:'start'})}catch(x){it[1].scrollIntoView()}});w.appendChild(b)});h.insertAdjacentElement('afterend',w)}
var busy=0;
function scan(){busy=0;
 mountWB();fixWalls();
 var pg=doc.getElementById('spg');if(!pg)return;var h=pg.querySelector('h3'),t=h?h.textContent.trim():'';
 if(t==='Update'&&!pg.querySelector('.nxu'))updPage(pg);else if(t!=='Update')pg.dataset.nxu='';
 if(t==='Mouse')mouseLinks(pg)}
function sched(){if(!busy){busy=1;requestAnimationFrame(scan)}}
try{new MutationObserver(sched).observe(doc.body,{childList:true,subtree:true})}catch(e){}
doc.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-nxwn]');if(b&&window.showWhatsNew)window.showWhatsNew()},true);
})();

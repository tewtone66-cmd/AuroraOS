/* TASKBAR-4.0.1 - clean Windows-style taskbar: [start + search] [apps centered] [tray + clock] */
(function(){'use strict';
var doc=document,dock=doc.getElementById('dock');if(!dock)return;
var sb=doc.getElementById('startBtn'),se=doc.getElementById('srchBtn'),tasks=doc.getElementById('tasks'),tray=doc.getElementById('tray'),clk=doc.getElementById('clock');
if(!sb||!tasks||!tray||!clk)return;
/* wrappers: invisible (display:contents) in the floating dock, real groups in full-width mode */
var L=doc.createElement('div');L.id='tbL';var R=doc.createElement('div');R.id='tbR';
dock.insertBefore(L,dock.firstChild);L.appendChild(sb);if(se)L.appendChild(se);
dock.appendChild(R);R.appendChild(tray);R.appendChild(clk);
/* the island music chip belongs with the tray */
function adopt(){var c=dock.querySelector(':scope>#nxdChip');if(c)R.insertBefore(c,tray)}
new MutationObserver(adopt).observe(dock,{childList:true});adopt();
var st=doc.createElement('style');st.id='nx-taskbar-css';st.textContent=[
'#tbL,#tbR{display:contents}#dock>#nxdChip{order:4}#tray{order:5}#clock{order:6}',
'body.tb-full #dock{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);column-gap:10px;align-items:center;justify-content:stretch;height:calc(var(--tbs,62px) + 12px);padding:0 10px;border-radius:0!important;box-shadow:none!important}',
'body.tb-full #dock>.dv{display:none!important}',
'body.tb-full #tbL{display:flex;align-items:center;gap:8px;grid-column:1;grid-row:1;justify-self:start;min-width:0}',
'body.tb-full #tasks{grid-column:2;grid-row:1;justify-self:center;min-width:0}',
'body.tb-full #tbR{display:flex;align-items:center;gap:4px;grid-column:3;grid-row:1;justify-self:end;min-width:0}',
'body.tb-full #tbR>*{order:0;margin:0}body.tb-full #tray,body.tb-full #clock{grid-column:auto;grid-row:auto;justify-self:auto}',
'body.tb-full.tb-left #dock{grid-template-columns:auto minmax(0,1fr) auto}body.tb-full.tb-left #tasks{justify-self:start}',
/* start button + search box (Windows 10 style) */
'body.tb-full #srchBtn{width:clamp(190px,24vw,320px);height:calc(var(--tbs,62px)*.66);min-width:0;padding:0 14px;display:flex;align-items:center;justify-content:flex-start;gap:10px;border-radius:10px;background:var(--surf2,rgba(255,255,255,.1));border:1px solid var(--line,rgba(255,255,255,.16));box-shadow:none;transform:none}',
'body.tb-full #srchBtn:hover{background:var(--hov,rgba(255,255,255,.16))}',
'body.tb-full #srchBtn .ico{width:20px;height:20px;flex:none;background:none!important;box-shadow:none!important;border-radius:0;filter:none}body.tb-full #srchBtn .ico svg{width:100%!important;height:100%!important;color:var(--txt,#fff)}body.tb-full #srchBtn .ico svg *{stroke:currentColor}',
'body.tb-full #srchBtn::after{content:"Type here to search";font:500 13px system-ui,sans-serif;color:var(--mut,rgba(255,255,255,.65));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'body.tb-full #srchBtn::before,body.tb-full #startBtn::before{display:none}',
/* tray: compact, no labels, tidy spacing */
'body.tb-full #tray{display:flex;align-items:center;gap:2px}body.tb-full #tray .tri{padding:6px 7px;border-radius:8px}body.tb-full #clock{padding:4px 10px;border-radius:8px;text-align:right}body.tb-full #clock small{display:block;opacity:.75}',
'body.tb-full #dock>#nxdChip,body.tb-full #tbR>#nxdChip{max-width:170px;margin:0 6px 0 0}'
].join('\n');
doc.head.appendChild(st);
})();

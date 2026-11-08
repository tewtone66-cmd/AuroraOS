/* CTX-4.1.0 - one clean right-click menu for the whole system.
   - all "Add/New/Create ..." items are folded into ONE "Add file >" entry with a flyout submenu (Windows style)
   - line icons for common actions, tidy separators, theme-aware (Dark / Light / Liquid Glass)
   Works on the existing menu nodes (re-parents them), so the original click handlers keep working. */
(function(){'use strict';
var doc=document,busy=false;
var SEL='#ctx,.ctx,.cmenu,[role=menu]';
var STRIP_PREFIX=true; /* set false if an item stops working because its handler reads the visible text */
function svg(p){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var IC={
 open:svg('<path d="M3.5 7.5a2 2 0 012-2h4l2 2.2h7a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>'),
 openwith:svg('<path d="M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>'),
 rename:svg('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>'),
 trash:svg('<path d="M5 7h14M10 4h4M7 7l.8 12a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4L17 7M10 11v6M14 11v6"/>'),
 copy:svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.5a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2"/>'),
 cut:svg('<circle cx="6.5" cy="17.5" r="2.5"/><circle cx="6.5" cy="6.5" r="2.5"/><path d="M8.5 8l11 9M8.5 16l11-9"/>'),
 paste:svg('<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1M9 12h6M9 16h4"/>'),
 refresh:svg('<path d="M19.5 12a7.5 7.5 0 01-13 5M4.5 12a7.5 7.5 0 0113-5"/><path d="M17.5 3.5V7H14M6.5 20.5V17H10"/>'),
 info:svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.8h.01"/>'),
 download:svg('<path d="M12 4.5v10M7.8 10.8L12 15l4.2-4.2M5 19.5h14"/>'),
 share:svg('<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8 11l7.5-4M8 13l7.5 4"/>'),
 sel:svg('<rect x="4" y="4" width="16" height="16" rx="2.5" stroke-dasharray="3 2.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>'),
 sort:svg('<path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3"/>'),
 view:svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
 plus:svg('<path d="M12 5v14M5 12h14"/>'),
 gear:svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18"/>'),
 brush:svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15 13.5l5 4.5"/>'),
 display:svg('<rect x="3" y="4.5" width="18" height="12" rx="2.2"/><path d="M8 20h8M12 16.5V20"/>'),
 term:svg('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 10l3 2-3 2M12.5 15h4"/>'),
 arch:svg('<rect x="4" y="4" width="16" height="5" rx="1.5"/><path d="M5.5 9v9a2 2 0 002 2h9a2 2 0 002-2V9M10 13h4"/>'),
 link:svg('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'),
 undo:svg('<path d="M9 7L4.5 11.5 9 16M5 11.5h9a5 5 0 010 9"/>'),
 mouse:svg('<rect x="6.5" y="3.5" width="11" height="17" rx="5.5"/><path d="M12 3.5v6M6.5 9.5h11"/>')
};
IC.bin=IC.trash;
var CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
var MAP=[[/^open with|^open in/,'openwith'],[/^(open|launch|run)\b/,'open'],[/rename/,'rename'],[/^(delete|remove|trash|move to trash|empty)/,'trash'],[/^copy (path|link)/,'link'],[/^(copy|duplicate)/,'copy'],[/^(cut|move)/,'cut'],[/^paste/,'paste'],[/^(refresh|reload)/,'refresh'],
 [/^(properties|details|info|about)/,'info'],[/^(download|save)/,'download'],[/^(share|send)/,'share'],[/^select all/,'sel'],[/^sort/,'sort'],[/^(view|layout|grid|list|icons)/,'view'],[/^(settings|preferences)/,'gear'],[/^(personali|wallpaper|background|change background)/,'brush'],
 [/^display/,'display'],[/^(terminal|command|console)/,'term'],[/^(compress|zip|extract|unzip|archive)/,'arch'],[/^edit/,'rename'],[/^preview/,'brush'],[/^undo|^reset/,'undo'],[/recycle/,'bin'],[/explorer|^this pc|^files/,'open'],[/mouse/,'mouse']];
var PUC=/[\p{Extended_Pictographic}️‍]/gu;
function lab(e){return(e.textContent||'').replace(PUC,'').replace(/[›»>▸►]+\s*$/,'').replace(/\s+/g,' ').trim()}
function iconKey(t){var s=t.toLowerCase();for(var i=0;i<MAP.length;i++)if(MAP[i][0].test(s))return MAP[i][1];return''}
function putIcon(it,html){var c=it.firstElementChild;if(c&&c.classList.contains('nxcm-i'))return;
 if(c&&!lab(c)&&!(c.querySelector&&c.querySelector('img'))){c.className='nxcm-i';c.innerHTML=html;return}
 var f=it.firstChild;if(f&&f.nodeType===3)f.nodeValue=f.nodeValue.replace(/^\s*[\p{Extended_Pictographic}️‍]+\s*/u,'');
 var sp=doc.createElement('span');sp.className='nxcm-i';sp.innerHTML=html;it.insertBefore(sp,it.firstChild)}
function folderSvg(){return'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 6.3A1.8 1.8 0 014.3 4.5h4.2c.5 0 .9.2 1.2.6l1 1.2h9a1.8 1.8 0 011.8 1.8v9.9a1.8 1.8 0 01-1.8 1.8H4.3a1.8 1.8 0 01-1.8-1.8z" fill="'+(doc.getElementById('nxi-defs')?'url(#nxi-yellow)':'#F5B93F')+'"/></svg>'}
function typeIcon(t){var s=t.toLowerCase();if(/folder|directory/.test(s))return folderSvg();
 var ext=/html?/.test(s)?'html':/json/.test(s)?'json':/(txt|text|note)/.test(s)?'txt':/(js|javascript)/.test(s)?'js':/css/.test(s)?'css':/(md|markdown)/.test(s)?'md':/py/.test(s)?'py':/xml/.test(s)?'xml':/csv/.test(s)?'csv':'txt';
 return window.NXICON&&window.NXICON.file?window.NXICON.file(ext):IC.plus}
var ADD=/^(?:\+\s*)?(?:add|new|create|insert)\s+\S/i;
function stripPrefix(it){if(!STRIP_PREFIX)return;var w=doc.createTreeWalker(it,4),n;while((n=w.nextNode())){if(/\S/.test(n.nodeValue)){
  var v=n.nodeValue.replace(/^(\s*[\p{Extended_Pictographic}️‍]*\s*)(?:\+\s*)?(?:add|new|create|insert)\s+(?:a\s+|an\s+)?/iu,'$1');v=v.replace(/^(\s*)([a-z])/,function(m,a,b){return a+b.toUpperCase()});n.nodeValue=v;break}}}
function tidy(c){var all=[c].concat([].slice.call(c.querySelectorAll('*'))),list=null,i;
 for(i=0;i<all.length;i++){var e=all[i];if(e.children.length>=3&&(!list||e.children.length>list.children.length))list=e}
 if(!list||list.getAttribute('data-nxcm'))return;list.setAttribute('data-nxcm','1');c.classList.add('nxcm');
 var kids=[].slice.call(list.children),adds=[],items=[];
 kids.forEach(function(k){var t=lab(k);if(!t){k.classList.add('nxcm-sep');return}k.classList.add('nxcm-it');items.push(k);if(ADD.test(t))adds.push(k)});
 if(adds.length>=2){var proto=adds[0],p=proto.cloneNode(false);
  [].slice.call(p.attributes).forEach(function(a){if(/^(data-|on|id$)/i.test(a.name))p.removeAttribute(a.name)});
  p.className='nxcm-it nxcm-parent';p.setAttribute('data-nxcm','p');
  p.innerHTML='<span class="nxcm-i">'+IC.plus+'</span><span class="nxcm-l">Add file</span><span class="nxcm-ch">'+CHEV+'</span>';
  var sub=doc.createElement('div');sub.className='nxcm-sub';
  list.insertBefore(p,proto);
  adds.forEach(function(a){stripPrefix(a);putIcon(a,typeIcon(lab(a)));a.classList.add('nxcm-si');sub.appendChild(a)});
  p.appendChild(sub);items=items.filter(function(x){return adds.indexOf(x)<0})}
 items.forEach(function(it){var k=iconKey(lab(it));if(k)putIcon(it,IC[k]);else if(!it.firstElementChild||lab(it.firstElementChild))putIcon(it,'<svg viewBox="0 0 24 24"></svg>');if(k)it.setAttribute('data-ik',k);if(k==='trash')it.classList.add('nxcm-danger')});
 /* tidy separators */
 var prevSep=true,ch=[].slice.call(list.children);
 ch.forEach(function(k){if(k.classList.contains('nxcm-sep')){if(prevSep)k.remove();else prevSep=true}else prevSep=false});
 var last=list.lastElementChild;while(last&&last.classList.contains('nxcm-sep')){last.remove();last=list.lastElementChild}}
/* ---------- submenu behaviour ---------- */
var ot=0,ct=0;
function closeAll(root){(root||doc).querySelectorAll('.nxcm-sub.open').forEach(function(s){s.classList.remove('open')})}
function openSub(p){clearTimeout(ct);var s=p.querySelector(':scope>.nxcm-sub');if(!s)return;[].forEach.call(p.parentNode.querySelectorAll('.nxcm-sub.open'),function(x){if(x!==s)x.classList.remove('open')});
 s.classList.remove('left');s.style.top='';s.classList.add('open');var r=s.getBoundingClientRect();if(r.right>innerWidth-6)s.classList.add('left');r=s.getBoundingClientRect();if(r.bottom>innerHeight-6)s.style.top=(-(r.bottom-innerHeight+10)-6)+'px'}
function hov(e){var t=e.target;if(!t.closest)return;var p=t.closest('.nxcm-parent');
 if(p){clearTimeout(ct);clearTimeout(ot);ot=setTimeout(function(){openSub(p)},70);return}
 var it=t.closest('.nxcm-it');if(it&&!it.closest('.nxcm-sub')){clearTimeout(ot);ct=setTimeout(function(){closeAll(it.parentNode)},160)}}
doc.addEventListener('pointerover',hov,true);doc.addEventListener('mouseover',hov,true);doc.addEventListener('mousemove',function(e){var t=e.target;if(t&&t.closest){var p=t.closest('.nxcm-parent');if(p&&!p.querySelector(':scope>.nxcm-sub.open'))openSub(p)}},true);
doc.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var p=t.closest('.nxcm-parent');if(!p||t.closest('.nxcm-sub'))return;
 e.stopPropagation();e.preventDefault();var s=p.querySelector(':scope>.nxcm-sub');openSub(p)},true);
/* ---------- css ---------- */
var st=doc.createElement('style');st.id='nx-ctx-css';st.textContent=[
'.nxcm{overflow:visible!important;padding:6px!important;border-radius:14px!important;min-width:208px}',
'.nxcm .nxcm-it{position:relative;display:flex!important;align-items:center;gap:10px;padding:7px 10px!important;border-radius:9px;font-size:13px;line-height:1.25;cursor:pointer;white-space:nowrap}',
'.nxcm .nxcm-it:hover{background:var(--hov,rgba(255,255,255,.1))}',
'.nxcm .nxcm-sep{height:1px!important;min-height:0;margin:5px 8px!important;padding:0!important;background:var(--line,rgba(255,255,255,.14));border:0!important;pointer-events:none}',
'.nxcm .nxcm-i{display:inline-flex;flex:none;width:18px;height:18px;align-items:center;justify-content:center;color:var(--mut,#9aa3b2);pointer-events:none}.nxcm .nxcm-i svg{width:18px;height:18px;display:block}',
'.nxcm .nxcm-danger,.nxcm .nxcm-danger>.nxcm-i{color:#ff5d73!important}',
'.nxcm .nxcm-l{flex:1}.nxcm .nxcm-ch{display:inline-flex;width:14px;height:14px;opacity:.6;pointer-events:none}.nxcm .nxcm-ch svg{width:14px;height:14px}',
'.nxcm-parent{position:relative}',
'.nxcm .nxcm-it,.nxcm-sub .nxcm-si{justify-content:flex-start!important;text-align:left!important}',
'.nxcm .nxcm-it[data-ik=open]>.nxcm-i{color:#f5b93f}.nxcm .nxcm-it[data-ik=openwith]>.nxcm-i{color:#5b9dff}.nxcm .nxcm-it[data-ik=rename]>.nxcm-i{color:#a78bfa}.nxcm .nxcm-it[data-ik=copy]>.nxcm-i{color:#38bdf8}.nxcm .nxcm-it[data-ik=cut]>.nxcm-i{color:#fb923c}.nxcm .nxcm-it[data-ik=paste]>.nxcm-i{color:#2dd4bf}.nxcm .nxcm-it[data-ik=refresh]>.nxcm-i{color:#4ade80}.nxcm .nxcm-it[data-ik=info]>.nxcm-i{color:#60a5fa}.nxcm .nxcm-it[data-ik=download]>.nxcm-i{color:#34d399}.nxcm .nxcm-it[data-ik=share]>.nxcm-i{color:#f472b6}.nxcm .nxcm-it[data-ik=sel]>.nxcm-i{color:#818cf8}.nxcm .nxcm-it[data-ik=sort]>.nxcm-i{color:#fbbf24}.nxcm .nxcm-it[data-ik=view]>.nxcm-i{color:#22d3ee}.nxcm .nxcm-it[data-ik=gear]>.nxcm-i{color:#94a3b8}.nxcm .nxcm-it[data-ik=brush]>.nxcm-i{color:#e879f9}.nxcm .nxcm-it[data-ik=display]>.nxcm-i{color:#38bdf8}.nxcm .nxcm-it[data-ik=term]>.nxcm-i{color:#a3e635}.nxcm .nxcm-it[data-ik=arch]>.nxcm-i{color:#f59e0b}.nxcm .nxcm-it[data-ik=link]>.nxcm-i{color:#60a5fa}.nxcm .nxcm-it[data-ik=undo]>.nxcm-i{color:#fb7185}.nxcm .nxcm-it[data-ik=mouse]>.nxcm-i{color:#f9a8d4}.nxcm .nxcm-it[data-ik=bin]>.nxcm-i{color:#94a3b8}.nxcm .nxcm-it[data-ik=plus]>.nxcm-i{color:#7c9bff}',
'.nxcm .nxcm-it:hover>.nxcm-i{filter:brightness(1.15)}',
'.nxcm-sub{position:absolute;left:calc(100% - 2px);top:-7px;min-width:196px;padding:6px;border-radius:14px;background:var(--pn,var(--surf,#161a22));color:var(--txt,#eef1f6);border:1px solid var(--line,rgba(255,255,255,.14));box-shadow:0 16px 40px rgba(0,0,0,.38);opacity:0;transform:translateX(-6px) scale(.97);transform-origin:left top;pointer-events:none;transition:opacity .16s,transform .2s cubic-bezier(.2,.9,.25,1.1);z-index:5}',
'.nxcm-sub.left{left:auto;right:calc(100% - 2px);transform-origin:right top;transform:translateX(6px) scale(.97)}',
'.nxcm-sub.open{opacity:1;transform:none;pointer-events:auto}',
'.nxcm-parent:hover>.nxcm-sub{opacity:1;transform:none;pointer-events:auto}',
'.nxcm-sub .nxcm-si{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;font-size:13px;white-space:nowrap}.nxcm-sub .nxcm-si:hover{background:var(--hov,rgba(255,255,255,.1))}.nxcm-sub .nxcm-i{width:20px;height:20px;color:inherit}.nxcm-sub .nxcm-i svg{width:20px;height:20px}',
':root[data-skin=glass] .nxcm-sub{background-color:rgba(26,34,58,.62);background-image:radial-gradient(120% 80% at 0% 0%,rgba(255,255,255,.2),rgba(255,255,255,0) 55%);border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 18px 44px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%)}',
':root[data-nxperf=lite][data-skin=glass] .nxcm-sub{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(24,30,50,.94)}'
].join('\n');
doc.head.appendChild(st);
/* ---------- hook menus (also menus created later or rebuilt on every open) ---------- */
var seen=new WeakSet();
function run(c){if(busy)return;busy=true;try{tidy(c)}catch(e){}busy=false}
function hook(){doc.querySelectorAll(SEL).forEach(function(c){if(seen.has(c))return;seen.add(c);
 new MutationObserver(function(){if(busy)return;Promise.resolve().then(function(){run(c)})}).observe(c,{childList:true,subtree:true});run(c)})}
var rf=0;new MutationObserver(function(){if(!rf)rf=requestAnimationFrame(function(){rf=0;hook()})}).observe(doc.body,{childList:true,subtree:true});
hook();
window.NXCTX={tidy:run};
})();

// Hide Photos/Media/Music from search+taskbar; remove Archive app; open archives inside File Explorer.
export default [
{
"name": "archive-viewers-0",
"find": ".thd{display:inline-block;padding:1px 8px;border-radius:999px;background:var(--hov);color:var(--mut);font-size:10.5px;font-weight:600}",
"replace": ".thd{display:inline-block;padding:1px 8px;border-radius:999px;background:var(--hov);color:var(--mut);font-size:10.5px;font-weight:600}\n.arcbar{display:flex;gap:6px;align-items:center;padding:4px 8px;border-bottom:1px solid var(--line)}.arcbar .nmx{margin-left:auto;color:var(--mut);font-size:12px}"
},
{
"name": "archive-viewers-1",
"find": "photos:{n:'Photos',g:'linear-gradient(160deg,#f9a8d4,#a855f7)',w:720,h:460,f:appPhotos},\nmedia:{n:'Media Player',g:'linear-gradient(160deg,#ff8a7a,#e11d6a)',w:620,h:400,f:appMedia},",
"replace": "photos:{hid:1,n:'Photos',g:'linear-gradient(160deg,#f9a8d4,#a855f7)',w:720,h:460,f:appPhotos},\nmedia:{hid:1,n:'Media Player',g:'linear-gradient(160deg,#ff8a7a,#e11d6a)',w:620,h:400,f:appMedia},"
},
{
"name": "archive-viewers-2",
"find": "music:{n:'Music',g:'linear-gradient(150deg,#ff5fa8,#7c3aed 55%,#3b82f6)',w:700,h:440,f:(w,a)=>appMusic(w,a)},\nzip:{n:'Archive',g:'linear-gradient(160deg,#fcd34d,#d97706)',w:600,h:420,f:appZip,multi:1},",
"replace": "music:{hid:1,n:'Music',g:'linear-gradient(150deg,#ff5fa8,#7c3aed 55%,#3b82f6)',w:700,h:440,f:(w,a)=>appMusic(w,a)},"
},
{
"name": "archive-viewers-3",
"find": "IC.zip=P('<g stroke=\"none\"><path d=\"M5 3h9l5 5v13H5z\" fill=\"#fff\"/><path d=\"M11 3.5h2v2h-2zM11 7.5h2v2h-2zM11 11.5h2v2h-2z\" fill=\"#d97706\"/><path d=\"M10.5 14.5h3v3a1.5 1.5 0 0 1-3 0z\" fill=\"#d97706\"/></g>');\nconst PIN=['browser','files','notes','photos','calc','set'],DESK=[['files','This PC'],['browser','Browser'],['trash','Recycle Bin']];\ntry{const sp=jl('aur.pin',null);if(Array.isArray(sp)){const ok=sp.filter(x=>typeof x==='string'&&A[x]&&x!=='trash');PIN.splice(0,PIN.length,...ok)}}catch(e){}",
"replace": "const PIN=['browser','files','notes','calc','set'],DESK=[['files','This PC'],['browser','Browser'],['trash','Recycle Bin']];\ntry{const sp=jl('aur.pin',null);if(Array.isArray(sp)){const ok=sp.filter(x=>typeof x==='string'&&A[x]&&!A[x].hid&&x!=='trash');PIN.splice(0,PIN.length,...ok)}}catch(e){}"
},
{
"name": "archive-viewers-4",
"find": "Object.keys(A).filter(id=>id!=='about'&&id!=='dl'&&id!=='exew'&&A[id].n.toLowerCase().includes(ql)).forEach(id=>add('<div class=\"t\">'+tile(id)+'</div>',A[id].n,'App',()=>openApp(id)));",
"replace": "Object.keys(A).filter(id=>id!=='about'&&id!=='dl'&&id!=='exew'&&!A[id].hid&&A[id].n.toLowerCase().includes(ql)).forEach(id=>add('<div class=\"t\">'+tile(id)+'</div>',A[id].n,'App',()=>openApp(id)));"
},
{
"name": "archive-viewers-5",
"find": "async function load(){let acc=null;E.sr=0;if(E.path==null){E.items=[];E.sel.clear();return draw()}try{const r=await NF.list({path:E.path});E.items=r.items||[]}catch(e){E.items=[];if(/NEEDS_(GRANT|ROOT)/.test(String((e&&e.code)||'')+' '+String((e&&e.message)||'')))acc=e;else err(e)}E.sel.clear();draw();if(acc)showAcc(acc)}",
"replace": "const ARC=/\\.(zip|rar|7z)$/i;\nfunction arcBar(){let b=$('.arcbar',B);if(!(E.path!=null&&ARC.test(E.path))){if(b)b.remove();return}if(!b){b=h('div','arcbar','<button class=\"ib\" data-z=\"all\">Extract all</button><button class=\"ib\" data-z=\"to\">Extract to…</button><span class=\"nmx\"></span>');L.parentNode.insertBefore(b,L);b.onclick=e=>{const a=e.target.closest('[data-z]');if(!a)return;const dd=E.path.replace(/\\.[^./]*$/,''),nx=$('.nmx',b),run=d=>{nx.textContent='Extracting…';NF.zipExtract({path:E.path,dest:d,entries:[],unique:true}).then(r=>{nx.textContent='Done: '+(r?r.count:'')+' files';toast('Extracted to '+((r&&r.dest)||d))}).catch(x=>{nx.textContent='';err(x)})};if(a.dataset.z==='all')run(dd);else dialog(w,{title:'Extract to (full path)',def:dd},q=>q&&run(q.replace(/\\/+$/,'')))}}$('.nmx',b).textContent=E.items.length+' items'}\nasync function load(){let acc=null;E.sr=0;if(E.path==null){E.items=[];E.sel.clear();draw();return arcBar()}if(ARC.test(E.path)){try{const r=await NF.zipList({path:E.path});E.items=(r.items||[]).map(i=>({name:i.name,path:E.path+'/'+i.name,isDirectory:!!i.dir,size:i.size,arc:1}))}catch(e){E.items=[];err(e)}E.sel.clear();draw();return arcBar()}try{const r=await NF.list({path:E.path});E.items=r.items||[]}catch(e){E.items=[];if(/NEEDS_(GRANT|ROOT)/.test(String((e&&e.code)||'')+' '+String((e&&e.message)||'')))acc=e;else err(e)}E.sel.clear();draw();arcBar();if(acc)showAcc(acc)}"
},
{
"name": "archive-viewers-6",
"find": "function open(it){if(it.isDirectory)return go(it.path);const k=kind(it),sib=kk=>E.items.filter(x=>!x.isDirectory&&kind(x)===kk).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(x=>x.path);\nif(k==='img')openApp('photos',{path:it.path,list:sib('img')});else if(k==='vid')openApp('media',{path:it.path,list:sib(k)});else if(k==='aud')openApp('music',{path:it.path,list:sib(k)});else if(k==='code')openApp('code',{path:it.path});else if(/\\.(bat|cmd)$/i.test(it.name))openApp('term',{bat:it.path});else if(k==='txt')openApp('notes',{path:it.path});else if(k==='zip')openApp('zip',{path:it.path});else if(k==='exe')window.aurora.openExe(it.path);else NF.open({path:it.path,mimeType:it.mimeType}).catch(err)}",
"replace": "function open(it){if(it.arc)return;if(it.isDirectory)return go(it.path);const k=kind(it),sib=kk=>E.items.filter(x=>!x.isDirectory&&kind(x)===kk).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(x=>x.path);\nif(k==='img')openApp('photos',{path:it.path,list:sib('img')});else if(k==='vid')openApp('media',{path:it.path,list:sib(k)});else if(k==='aud')openApp('music',{path:it.path,list:sib(k)});else if(k==='code')openApp('code',{path:it.path});else if(/\\.(bat|cmd)$/i.test(it.name))openApp('term',{bat:it.path});else if(k==='txt')openApp('notes',{path:it.path});else if(k==='zip')go(it.path);else if(k==='exe')window.aurora.openExe(it.path);else NF.open({path:it.path,mimeType:it.mimeType}).catch(err)}"
},
{
"name": "archive-viewers-7",
"find": "r.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();if(!E.sel.has(it.path)){E.sel=new Set([it.path]);E.anchor=it;paint()}const one=E.sel.size===1;ctx(e.clientX,e.clientY,[['Open',()=>open(it),'',!one],...(E.sr&&one?[['Open file location',()=>go(dirname(it.path))]]:[]),...(one&&!it.isDirectory?[['Open with Notepad',()=>openApp('notes',{path:it.path})],['Open with Code Editor',()=>openApp('code',{path:it.path})],...(kind(it)==='zip'?[['Extract here',()=>cmd('unzip')],['Extract to…',()=>cmd('unzipto')]]:[])]:[]),['Compress to ZIP',()=>cmd('zip')],...(one&&!it.isDirectory&&kind(it)==='exe'?[['Add to Desktop',()=>addExe({p:it.path})]]:[]),...[['Send to Desktop (shortcut)',()=>window.DSKX2&&DSKX2.addIts(selItems())]],null,['Cut',()=>cmd('cut'),'Ctrl+X'],['Copy',()=>cmd('copy'),'Ctrl+C'],null,['Rename',()=>cmd('ren'),'F2',!one],['Delete',()=>cmd('del'),'Del'],null,['Properties',()=>cmd('props')]])};return r}",
"replace": "r.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();if(it.arc)return;if(!E.sel.has(it.path)){E.sel=new Set([it.path]);E.anchor=it;paint()}const one=E.sel.size===1;ctx(e.clientX,e.clientY,[['Open',()=>open(it),'',!one],...(E.sr&&one?[['Open file location',()=>go(dirname(it.path))]]:[]),...(one&&!it.isDirectory?[['Open with Notepad',()=>openApp('notes',{path:it.path})],['Open with Code Editor',()=>openApp('code',{path:it.path})],...(kind(it)==='zip'?[['Extract here',()=>cmd('unzip')],['Extract to…',()=>cmd('unzipto')]]:[])]:[]),['Compress to ZIP',()=>cmd('zip')],...(one&&!it.isDirectory&&kind(it)==='exe'?[['Add to Desktop',()=>addExe({p:it.path})]]:[]),...[['Send to Desktop (shortcut)',()=>window.DSKX2&&DSKX2.addIts(selItems())]],null,['Cut',()=>cmd('cut'),'Ctrl+X'],['Copy',()=>cmd('copy'),'Ctrl+C'],null,['Rename',()=>cmd('ren'),'F2',!one],['Delete',()=>cmd('del'),'Del'],null,['Properties',()=>cmd('props')]])};return r}"
},
{
"name": "archive-viewers-8",
"find": "/* ---------- Archive manager (v3-p05) ---------- */\nfunction appZip(w,arg){const B=w.body,st={path:null,items:[],sel:new Set()};\nB.innerHTML=`<div class=\"zp\"><div class=\"zt\"><button class=\"ib\" data-a=\"all\">Extract all</button><button class=\"ib\" data-a=\"to\">Extract to…</button><button class=\"ib\" data-a=\"show\">Show folder</button><span class=\"nmx\"></span></div><div class=\"zl\"></div></div>`;\nconst L=$('.zl',B),nm=$('.nmx',B);let pl=null,last=null;\ntry{Promise.resolve(NF.addListener('fprog',e=>{if(e.total>0&&e.done<e.total)nm.textContent='Extracting… '+Math.round(e.done/e.total*100)+'%'})).then(x=>pl=x)}catch(e){}\nw.onclose=()=>{if(pl&&pl.remove)pl.remove()};\nconst defDest=()=>st.path.replace(/\\.[^./]*$/,'');\nconst paint=()=>{$$('.row[data-n]',L).forEach(r=>r.classList.toggle('sel',st.sel.has(r.dataset.n)));$('[data-a=all]',B).textContent=st.sel.size?'Extract selected':'Extract all'};\nfunction draw(){L.innerHTML='<div class=\"row hd\"><span>Name</span><span></span><span>Type</span><span>Size</span></div>';st.items.forEach(it=>{const r=h('div','row',`<div class=\"nm\">${ficon({name:it.name,isDirectory:it.dir})}<span></span></div><span></span><span>${it.dir?'Folder':esc(ftype({name:it.name}))}</span><span>${it.dir?'':fsz(it.size)}</span>`);$('.nm span',r).textContent=it.name;r.dataset.n=it.name;r.onclick=()=>{st.sel.has(it.name)?st.sel.delete(it.name):st.sel.add(it.name);paint()};L.appendChild(r)});if(!st.items.length)L.insertAdjacentHTML('beforeend','<div class=\"eempty\">This archive is empty.</div>');paint()}\nasync function open(p){try{const r=await NF.zipList({path:p});st.path=p;w.path=p;st.items=r.items||[];const n=p.split('/').pop();w.setTitle(n+' - Archive');nm.textContent=st.items.length+' items';draw()}catch(e){L.innerHTML='<div class=\"eempty\">Could not read this archive.</div>';toast((e&&e.message)||'Could not read archive')}}\nfunction run(d,uq){nm.textContent='Extracting…';return NF.zipExtract({path:st.path,dest:d,entries:[...st.sel],unique:!!uq}).then(r=>{last=(r&&r.dest)||d;nm.textContent='Done: '+(r?r.count:'')+' files';toast('Extracted to '+last)}).catch(e=>{nm.textContent='';toast((e&&e.message)||'Extract failed')})}\nB.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a||!st.path)return;const k=a.dataset.a;if(k==='all')run(defDest(),true);else if(k==='to')dialog(w,{title:'Extract to (full path)',def:last||defDest()},p=>p&&run(p.replace(/\\/+$/,'')));else if(k==='show')openApp('files',last||st.path.replace(/\\/[^/]*$/,''))});\nif(arg&&arg.path)open(arg.path);else L.innerHTML='<div class=\"eempty\">Open a .zip file from File Explorer (double-click it).</div>'}\n",
"replace": ""
},
{
"name": "archive-viewers-9",
"find": " else if(/^(js|json|html?|css|java|kt|py|xml|sh|bat|c|cpp|h|ts)$/.test(e))openApp('code',{path:p});\n else if(/^(zip|rar|7z)$/.test(e))openApp('zip',{path:p});",
"replace": " else if(/^(js|json|html?|css|java|kt|py|xml|sh|bat|c|cpp|h|ts)$/.test(e))openApp('code',{path:p});\n else if(/^(zip|rar|7z)$/.test(e))openApp('files',p);"
},
{
"name": "archive-viewers-10",
"find": " Object.keys(A).filter(function(id){return !HIDE[id]&&(A[id].n+' '+(A[id].kw||'')).toLowerCase().indexOf(ql)>-1}).sort(function(a,b){return rk(A[a].n)-rk(A[b].n)}).forEach(function(id){o.apps.push({ic:tl(id),lb:A[id].n,tag:'App',fn:function(){openApp(id)}})});",
"replace": " Object.keys(A).filter(function(id){return !HIDE[id]&&!A[id].hid&&(A[id].n+' '+(A[id].kw||'')).toLowerCase().indexOf(ql)>-1}).sort(function(a,b){return rk(A[a].n)-rk(A[b].n)}).forEach(function(id){o.apps.push({ic:tl(id),lb:A[id].n,tag:'App',fn:function(){openApp(id)}})});"
},
{
"name": "archive-viewers-11",
"find": " else if(/^(bat|cmd)$/.test(e))id='term';else if(/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml)$/.test(e))id='code';else if(/^(zip|rar|7z)$/.test(e))id='zip';else if(e==='exe')id='win'}",
"replace": " else if(/^(bat|cmd)$/.test(e))id='term';else if(/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml)$/.test(e))id='code';else if(/^(zip|rar|7z)$/.test(e))id='files';else if(e==='exe')id='win'}"
},
{
"name": "archive-viewers-12",
"find": " else if(/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml)$/.test(e))openApp('code',{path:p});\n else if(/^(zip|rar|7z)$/.test(e))openApp('zip',{path:p});",
"replace": " else if(/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml)$/.test(e))openApp('code',{path:p});\n else if(/^(zip|rar|7z)$/.test(e))openApp('files',p);"
}
];

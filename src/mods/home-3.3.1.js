/* HOME-3.3.1 - home screen, desktop files, inline rename, drag fixes (needs src/patches/home-3.3.1.mjs) */
(function(){'use strict';
var DI=window.DSKI;if(!DI||!window.DSKX){console.warn('HOME-3.3.1: desktop internals missing');return}
function NFx(){return typeof NF!=='undefined'?NF:null}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]})}
function lnkById(id){return DI.lnks().find(function(l){return l.id===id})}
function btnOf(id){return document.querySelector('#icons .di[data-l="'+id+'"]')}
/* ---------- 1. hit-testing under the virtual mouse (#pad covers the screen) ---------- */
var _efp=document.elementFromPoint.bind(document),SKIP='#pad,#cur,#vbtns,.rip,.dndg';
document.elementFromPoint=function(x,y){var e=_efp(x,y);if(e&&e.closest&&e.closest(SKIP)){var l=document.elementsFromPoint(x,y);for(var i=0;i<l.length;i++)if(!l[i].closest(SKIP))return l[i];return document.body}return e};
/* ---------- 2. css ---------- */
var st=document.createElement('style');st.textContent=
'body .dndg{flex-direction:column;align-items:center;gap:4px;width:84px;max-width:none;padding:6px 4px;border-radius:10px;background:#ffffff26;border:1px solid #ffffff55;backdrop-filter:blur(6px);box-shadow:0 10px 24px #0006;text-align:center;overflow:visible}'+
'body .dndg .nm{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;min-width:0}'+
'body .dndg .nm svg,body .dndg .nm img{width:48px;height:48px;object-fit:cover;border-radius:6px;filter:drop-shadow(0 4px 6px #0006)}'+
'body .dndg .nm span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;word-break:break-word;font-size:12px;line-height:1.2;color:#fff;text-shadow:0 1px 3px #000c;max-width:78px}'+
'body .dndg b{position:absolute;top:-8px;right:-8px;min-width:22px;height:22px;border-radius:11px;padding:0 6px;box-sizing:border-box;background:var(--acc,#4f7cff);color:#fff;font-size:12px;display:grid;place-items:center}'+
'body .dndg i{position:absolute;left:0;top:100%;margin-top:6px;white-space:nowrap;background:#000b;color:#fff;font-style:normal;font-size:11px;padding:3px 8px;border-radius:6px}'+
'body .dndg i:empty{display:none}body .dndg.no{opacity:.6}'+
'#icons .di .t.fld{width:var(--is,48px);height:var(--is,48px)}#icons .di .t.fld svg{width:100%;height:100%;display:block;overflow:visible}'+
'#icons .di .drn{width:100%;height:32px;resize:none;overflow:hidden;font:inherit;font-size:12px;line-height:1.2;text-align:center;color:#fff;background:#0b1020e6;border:1px solid var(--acc,#4f7cff);border-radius:3px;padding:1px 2px;outline:none;box-sizing:border-box;user-select:text;-webkit-user-select:text}';
document.head.appendChild(st);
/* ---------- 3. Windows-like folder icons with peeking contents ---------- */
var IMG=/^(jpe?g|png|gif|webp|bmp|svg|avif)$/i,COL={txt:'#6b7a90',md:'#4a7bd0',js:'#e5c443',html:'#e0693a',css:'#3a8bd6',json:'#c9a227',py:'#3f7fbf',zip:'#a06bd0',mp3:'#d6477b',mp4:'#7a52d0',pdf:'#d8453b'};
function extOf(n){var m=/\.([^.]+)$/.exec(n||'');return m?m[1].toLowerCase():''}
var uid=0;
function card(it,i,n,id){var rot=n===1?0:n===2?(i?7:-7):(i===0?-11:i===1?0:11),x=18,y=6,w=28,hh=30,r='<g transform="rotate('+rot+' 32 42)">',e=extOf(it.name);
 if(IMG.test(e)&&it.src){var cp='cp'+id+'_'+i;r+='<clipPath id="'+cp+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="2"/></clipPath><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="2" fill="#dfe6f0"/><image href="'+esc(it.src)+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#'+cp+')"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="2" fill="none" stroke="#0003"/>'}
 else if(it.dir){r+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="2" fill="#f4f6fa" stroke="#0003"/><path d="M'+(x+3)+' '+(y+9)+'h8l2 2h12v12H'+(x+3)+'z" fill="#f2b632"/>'}
 else{r+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="2" fill="#fff" stroke="#0003"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="6" rx="2" fill="'+(COL[e]||'#8e98a8')+'"/><path d="M'+(x+4)+' '+(y+12)+'h20M'+(x+4)+' '+(y+17)+'h20M'+(x+4)+' '+(y+22)+'h13" stroke="#b7bfcc" stroke-width="1.6" stroke-linecap="round"/>'}
 return r+'</g>'}
function folderSVG(items){var id=++uid,c=items.slice(0,3),n=c.length,s='<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ff'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd978"/><stop offset="1" stop-color="#f2b632"/></linearGradient><linearGradient id="fb'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2a92a"/><stop offset="1" stop-color="#c58d14"/></linearGradient></defs>'+
 '<path d="M5 14a4 4 0 0 1 4-4h14l5 5h27a4 4 0 0 1 4 4v33a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="url(#fb'+id+')"/>';
 c.forEach(function(it,i){s+=card(it,i,n,id)});
 s+='<path d="M3 27a4 4 0 0 1 4-4h50a4 4 0 0 1 4 4l-2.4 26a4 4 0 0 1-4 3.6H9.4a4 4 0 0 1-4-3.6z" fill="url(#ff'+id+')"/><path d="M4.4 27.5a3 3 0 0 1 3-2.6h49.2a3 3 0 0 1 3 2.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/></svg>';return s}
var FC={};
function listDir(p){var n=NFx();if(!n)return Promise.resolve(null);var c=FC[p];if(c&&Date.now()-c.t<4000)return Promise.resolve(c.v);
 return n.list({path:p}).then(function(r){var it=(r.items||[]).filter(function(x){return!x.hidden&&x.name[0]!=='.'});
  it.sort(function(a,b){var ai=IMG.test(extOf(a.name))?0:a.isDirectory?2:1,bi=IMG.test(extOf(b.name))?0:b.isDirectory?2:1;return ai-bi||a.name.localeCompare(b.name)});
  var v=it.slice(0,3).map(function(x){var o={name:x.name,dir:!!x.isDirectory};if(IMG.test(extOf(x.name))&&x.size>0&&x.size<2.5e6&&typeof fsrc==='function')o.src=fsrc(x.path);return o});
  FC[p]={t:Date.now(),v:v};return v}).catch(function(){return null})}
function paintFolder(b,l,items){var t=b.querySelector('.t');if(!t)return;var key=JSON.stringify(items||[])+(l.own?'o':'s');if(t.dataset.fk===key)return;t.dataset.fk=key;t.classList.add('fld');t.innerHTML=folderSVG(items||[])+(l.own?'':'<i class="sc"></i>')}
function decorate(){var ls=DI.lnks();document.querySelectorAll('#icons .di[data-l]').forEach(function(b){var l=ls.find(function(x){return x.id===b.dataset.l});if(l&&l.own){var sc=b.querySelector('.sc');if(sc&&!l.d)sc.remove()}if(!l||!l.d)return;paintFolder(b,l,null);listDir(l.p).then(function(it){if(it&&b.isConnected)paintFolder(b,l,it)})})}
var _bi=buildIcons;buildIcons=function(){var r=_bi.apply(this,arguments);try{decorate()}catch(e){}return r};
setInterval(function(){if(!document.hidden)try{decorate()}catch(e){}},8000);
/* ---------- 4. inline rename ---------- */
var ILLEGAL=/[\\\/:*?"<>|]/g;
function startRename(id,isNew){var b=btnOf(id),l=lnkById(id);if(!b||!l)return;var sp=b.querySelector('span');if(!sp||b.querySelector('.drn'))return;
 document.querySelectorAll('#icons .di.sel').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');
 var ta=document.createElement('textarea');ta.className='drn';ta.spellcheck=false;ta.value=l.n;sp.style.display='none';sp.insertAdjacentElement('afterend',ta);
 ['pointerdown','pointerup','click','dblclick','contextmenu','mousedown'].forEach(function(t){ta.addEventListener(t,function(e){e.stopPropagation()})});
 var done=false;function finish(ok){if(done)return;done=true;var v=ta.value.replace(ILLEGAL,'').trim();ta.remove();sp.style.display='';if(ok&&v&&v!==l.n&&v!=='.'&&v!=='..')commit(l,v);else if(isNew&&ok&&!v)toast('Name not changed')}
 ta.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter'){e.preventDefault();finish(true)}else if(e.key==='Escape'){e.preventDefault();finish(false)}});
 ta.addEventListener('blur',function(){finish(true)});
 setTimeout(function(){ta.focus();var dot=l.d?-1:l.n.lastIndexOf('.');ta.setSelectionRange(0,dot>0?dot:l.n.length)},30)}
function commit(l,name){var n=NFx();
 function apply(){l.n=name;var d=DI.desk.find(function(q){return q[0]==='lnk'&&q[2]===l.id});if(d)d[1]=name;DI.saveL();buildIcons(true);var nb=btnOf(l.id);if(nb)nb.classList.add('sel')}
 if(l.own&&n){n.rename({path:l.p,name:name}).then(function(){var dir=l.p.slice(0,l.p.lastIndexOf('/'));l.p=dir+'/'+name;l.f=name;delete FC[dir];apply()}).catch(function(e){toast('Could not rename: '+((e&&e.message)||'name already exists'))})}
 else apply()}
document.addEventListener('keydown',function(e){if(e.key!=='F2')return;var a=document.activeElement;if(a&&/INPUT|TEXTAREA/.test(a.tagName))return;var s=document.querySelector('#icons .di.sel[data-l]');if(s){e.preventDefault();startRename(s.dataset.l)}});
/* ---------- 5. create folders / files straight on the desktop ---------- */
var NEWS=[['New folder','folder','New folder',''],['New text document','file','New Text Document','.txt'],['New Markdown file','file','New Markdown File','.md'],['New HTML file','file','New HTML Document','.html'],['New JavaScript file','file','New JavaScript File','.js']];
function createItem(spec,x,y){var n=NFx();if(!n){toast('Storage is not available');return}var dir=DI.ddir,isDir=spec[1]==='folder';
 n.mkdir({path:'/storage/emulated/0',name:'Desktop'}).catch(function(){}).then(function(){return n.list({path:dir}).catch(function(){return{items:[]}})}).then(function(r){
  var have=(r.items||[]).map(function(i){return i.name.toLowerCase()}),k=1,nm;do{nm=spec[2]+(k>1?' ('+k+')':'')+spec[3];k++}while(have.indexOf(nm.toLowerCase())>=0);
  var p=dir+'/'+nm;return(isDir?n.mkdir({path:dir,name:nm}):n.writeText({path:p,text:''})).then(function(){
   DI.addLnk([{path:p,name:nm,isDirectory:isDir}],x,y);var l=DI.lnks().find(function(q){return q.p===p});if(!l)return;l.own=true;DI.saveL();delete FC[dir];buildIcons(true);setTimeout(function(){startRename(l.id,true)},60)})}).catch(function(e){toast('Could not create it: '+((e&&e.message)||'error'))})}
var _menu=DSKX.menu;
DSKX.menu=function(x,y,t,orig){var di=t&&t.closest&&t.closest('.di'),oc=ctx;
 ctx=function(cx,cy,items){ctx=oc;var out=[];items.forEach(function(it){
   if(!di&&it&&it[0]==='New folder'){NEWS.forEach(function(s){out.push([s[0],function(){createItem(s,x,y)}])})}
   else if(di&&di.dataset.l&&it&&it[0]==='Rename'){out.push(['Rename',function(){startRename(di.dataset.l)},'F2'])}
   else out.push(it)});return oc.call(this,cx,cy,out)};
 try{return _menu.apply(this,arguments)}finally{ctx=oc}};
/* ---------- 6. visible errors for drops from File Explorer ---------- */
if(window.DNDX&&DNDX.hit){var _h=DNDX.hit;DNDX.hit=function(){var r=_h.apply(this,arguments);if(r&&r.drop){var d=r.drop;r.drop=function(){try{var v=d.apply(this,arguments);if(v&&v.catch)v.catch(function(e){toast('Drop failed: '+((e&&e.message)||e))});return v}catch(e){toast('Drop failed: '+((e&&e.message)||e))}}}return r}}
decorate();
})();

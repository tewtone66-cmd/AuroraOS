/* DND-3.2.0 : free icon layout, shortcuts, drops, cursors, dock reorder */
(function(){
'use strict';
var CW=86,CH=94,PX=12,PY=12,doc=document;
var DP=jl('aur.dpos',{});if(!DP||typeof DP!=='object'||Array.isArray(DP))DP={};
var HID=jl('aur.dhide',[]);if(!Array.isArray(HID))HID=[];
var LNKS=jl('aur.lnks',[]);if(!Array.isArray(LNKS))LNKS=[];LNKS=LNKS.filter(function(l){return l&&l.id&&l.p});
var saveDP=function(){ls('aur.dpos',JSON.stringify(DP))},saveL=function(){ls('aur.lnks',JSON.stringify(LNKS));ls('aur.desk',JSON.stringify(DESK.map(dkey)))};
LNKS.forEach(function(l){if(!DESK.some(function(d){return d[0]==='lnk'&&d[2]===l.id}))DESK.push(['lnk',l.n,l.id])});
var dirOf=function(p){return p.slice(0,p.lastIndexOf('/'))||'/'};
/* ---------- grid ---------- */
function geom(){var ic=$('#icons');return{cols:Math.max(1,Math.floor((ic.clientWidth-PX*2+4)/CW)),rows:Math.max(1,Math.floor((ic.clientHeight-PY*2+4)/CH))}}
function free(g,occ,c0,r0){var best=null,bd=1e9;
 if(c0==null){for(var c=0;c<g.cols;c++)for(var r=0;r<g.rows;r++)if(!occ[c+','+r])return[c,r];return[0,0]}
 for(var c2=0;c2<g.cols;c2++)for(var r2=0;r2<g.rows;r2++)if(!occ[c2+','+r2]){var d=(c2-c0)*(c2-c0)+(r2-r0)*(r2-r0);if(d<bd){bd=d;best=[c2,r2]}}
 return best||[0,0]}
function items(){return $$('#icons .di').filter(function(b){return!b.classList.contains('ghost')})}
function layout(){var g=geom(),bs=items(),occ={},un=[];
 bs.forEach(function(b){var p=DP[b.dataset.k];if(p&&p[0]<g.cols&&p[1]<g.rows&&!occ[p[0]+','+p[1]])occ[p[0]+','+p[1]]=1;else un.push(b)});
 un.forEach(function(b){var c=free(g,occ);occ[c[0]+','+c[1]]=1;DP[b.dataset.k]=c});
 bs.forEach(function(b){var p=DP[b.dataset.k];b.style.left=(PX+p[0]*CW)+'px';b.style.top=(PY+p[1]*CH)+'px'});
 saveDP()}
var rt=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(layout,160)});
/* ---------- shortcuts (files / folders on the desktop) ---------- */
function lnkTile(l){var id='notes';if(l.d)id='files';else{var e=((l.f||l.n).split('.').pop()||'').toLowerCase();
 if(/^(jpe?g|png|gif|webp|bmp|svg|avif)$/.test(e))id='photos';else if(/^(mp4|mkv|webm|avi|mov|3gp|m4v)$/.test(e))id='media';else if(/^(mp3|m4a|aac|wav|flac|ogg|opus)$/.test(e))id='music';
 else if(/^(bat|cmd)$/.test(e))id='term';else if(/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml)$/.test(e))id='code';else if(/^(zip|rar|7z)$/.test(e))id='zip';else if(e==='exe')id='win'}
 return tile(id)}
function lnkBtn(l,re){var b=h('button','di'+(re?' re':''),'<div class="t">'+lnkTile(l)+'<i class="sc"></i></div><span></span>');$('span',b).textContent=l.n;b.dataset.k='lnk|'+l.id;b.dataset.l=l.id;
 b.onclick=function(){$$('.di.sel').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel')};tapEl(b,function(){openLnk(l)});return b}
function openIt(it){var e=(it.name.split('.').pop()||'').toLowerCase(),p=it.path,a={path:p,list:[p]};
 if(it.isDirectory)openApp('files',p);
 else if(/^(jpe?g|png|gif|webp|bmp|svg|avif)$/.test(e))openApp('photos',a);
 else if(/^(mp4|mkv|webm|avi|mov|3gp|m4v)$/.test(e))openApp('media',a);
 else if(/^(mp3|m4a|aac|wav|flac|ogg|opus)$/.test(e))openApp('music',a);
 else if(/^(txt|md|log|ini|cfg|csv)$/.test(e))openApp('notes',{path:p});
 else if(/^(bat|cmd)$/.test(e))openApp('term',{bat:p});
 else if(/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml)$/.test(e))openApp('code',{path:p});
 else if(/^(zip|rar|7z)$/.test(e))openApp('zip',{path:p});
 else if(e==='exe'&&window.aurora&&aurora.openExe)aurora.openExe(p);
 else if(NF)NF.open({path:p,mimeType:it.mimeType}).catch(function(){})}
async function openLnk(l){try{if(NF)await NF.info({path:l.p})}catch(e){toast('This shortcut is broken: the original was moved or deleted');return}
 openIt({name:l.f||l.n,path:l.p,isDirectory:!!l.d})}
function addLnk(its,x,y){var g=geom(),r=$('#icons').getBoundingClientRect(),occ={},n=0;
 items().forEach(function(b){var p=DP[b.dataset.k];if(p)occ[p[0]+','+p[1]]=1});
 var c0=Math.max(0,Math.min(g.cols-1,Math.floor((x-r.left-PX)/CW))),r0=Math.max(0,Math.min(g.rows-1,Math.floor((y-r.top-PY)/CH)));
 its.forEach(function(it){if(!it||!it.path||LNKS.some(function(l){return l.p===it.path}))return;
  var l={id:'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),p:it.path,f:it.name,n:it.name.replace(/\.lnk$/i,''),d:!!it.isDirectory};
  LNKS.push(l);DESK.push(['lnk',l.n,l.id]);var c=free(g,occ,c0,r0);occ[c[0]+','+c[1]]=1;DP['lnk|'+l.id]=c;n++});
 if(!n){toast('Already on the desktop');return 0}
 saveL();saveDP();buildIcons(true);toast(n===1?'Shortcut added to the desktop':n+' shortcuts added to the desktop');return n}
function ask(title,def,cb){var m=h('div','dkm','<div class="dkb"><b></b><input spellcheck="false"><div class="r"><button class="ib" data-k="c">Cancel</button><button class="ib pri" data-k="o">OK</button></div></div>');$('b',m).textContent=title;var i=$('input',m);i.value=def;doc.body.appendChild(m);i.focus();i.select();
 var done=function(ok){var v=i.value.trim();m.remove();if(ok&&v)cb(v)};m.addEventListener('click',function(e){var k=e.target.dataset&&e.target.dataset.k;if(k)done(k==='o');else if(e.target===m)done(false)});i.onkeydown=function(e){if(e.key==='Enter')done(true);else if(e.key==='Escape')done(false)}}
/* ---------- removing things from the desktop ---------- */
function removeItem(b){var k=b.dataset.k||'';
 if(b.dataset.s){DSKX0.siteToTrash(b.dataset.s);delete DP[k];saveDP();return}
 if(b.dataset.e){removeExe(b.dataset.e);delete DP[k];saveDP();return}
 if(b.dataset.l){var id=b.dataset.l;LNKS=LNKS.filter(function(l){return l.id!==id});var i=DESK.findIndex(function(d){return d[0]==='lnk'&&d[2]===id});if(i>=0)DESK.splice(i,1);delete DP[k];saveL();saveDP();buildIcons(true);toast('Shortcut removed');return}
 if(k.split('|')[0]==='trash'){toast("The Recycle Bin can't be removed");return}
 if(HID.indexOf(k)<0)HID.push(k);delete DP[k];ls('aur.dhide',JSON.stringify(HID));saveDP();buildIcons(true);toast('Removed from the desktop (right-click the desktop to restore)')}
/* ---------- build / menus ---------- */
var _bi=buildIcons;
buildIcons=function(re){var keep=DESK.slice(),vis=DESK.filter(function(d){return d[0]!=='lnk'&&HID.indexOf(dkey(d))<0}),r;
 DESK.splice(0,DESK.length);vis.forEach(function(d){DESK.push(d)});
 try{r=_bi(re)}finally{DESK.splice(0,DESK.length);keep.forEach(function(d){DESK.push(d)})}
 var ic=$('#icons');keep.forEach(function(d){if(d[0]!=='lnk')return;var l=LNKS.find(function(x){return x.id===d[2]});if(l)ic.appendChild(lnkBtn(l,re))});
 layout();return r};
window.DSKX={menu:function(x,y,t,orig){var di=t.closest('.di');
 if(di&&di.dataset.l){var l=LNKS.find(function(q){return q.id===di.dataset.l});if(!l)return true;ctx(x,y,[['Open',function(){openLnk(l)}],['Open file location',function(){openApp('files',dirOf(l.p))}],['Rename',function(){ask('Rename shortcut',l.n,function(v){l.n=v;var d=DESK.find(function(q){return q[0]==='lnk'&&q[2]===l.id});if(d)d[1]=v;saveL();buildIcons(true)})}],null,['Remove shortcut',function(){removeItem(di)}]]);return true}
 if(di){var k=(di.dataset.k||'').split('|')[0];if(!di.dataset.s&&!di.dataset.e&&k!=='trash'&&A[k]){ctx(x,y,[['Open',function(){openApp(k)}],null,['Remove from desktop',function(){removeItem(di)}]]);return true}return false}
 var m=[['Refresh',function(){buildIcons(true)}],['Sort by name',function(){DP={};saveDP();DSKX0.sortDesk()}],['Reset icon positions',function(){DP={};saveDP();buildIcons(true)}]];
 if(HID.length)m.push(['Restore removed icons',function(){HID=[];ls('aur.dhide','[]');buildIcons(true)}]);
 m.push(null,['Personalize',function(){openApp('set','bg')}],['Display settings',function(){openApp('set','display')}],['Settings',function(){openApp('set')}],null,['File Explorer',function(){openApp('files')}],['Recycle Bin',function(){openApp('trash')}],[VM.on?'Virtual mouse: off':'Virtual mouse: on',function(){vmSet(!VM.on)}]);
 ctx(x,y,m);return true}};
/* ---------- drag icons around the desktop ---------- */
(function(){var ic=$('#icons'),d=null,ra=0,le=null,sup=false,hot=null,cell=null;
 var clr=function(){if(hot){hot.classList.remove('dndt');hot=null}};
 var tg=function(x,y){var e=doc.elementFromPoint(x,y);if(!e)return{t:'none'};var di=e.closest&&e.closest('#icons .di');
  if(di&&di!==d.b&&(di.dataset.k||'').split('|')[0]==='trash')return{t:'trash',el:di};
  if(e.closest('.win,#dock,#start,#ctx,#trf,#mnpc,#pwm,#tbpv,#np,#npc,.dlg'))return{t:'none'};
  var g=geom(),r=ic.getBoundingClientRect(),c=Math.round((x-d.gx-r.left-PX)/CW),rr=Math.round((y-d.gy-r.top-PY)/CH);
  return{t:'cell',c:Math.max(0,Math.min(g.cols-1,c)),r:Math.max(0,Math.min(g.rows-1,rr))}};
 var frame=function(){ra=0;if(!d||!d.go||!le)return;var e=le;le=null;d.g.style.transform='translate('+(e.clientX-d.x)+'px,'+(e.clientY-d.y)+'px) scale(1.04)';
  var t=tg(e.clientX,e.clientY);d.t=t;d.g.classList.toggle('bad',t.t==='none');
  if(t.t==='trash'){if(hot!==t.el){clr();hot=t.el;hot.classList.add('dndt')}}else clr();
  if(t.t==='cell'){if(!cell){cell=h('div','dcell','');ic.appendChild(cell)}cell.style.display='block';cell.style.left=(PX+t.c*CW)+'px';cell.style.top=(PY+t.r*CH)+'px'}else if(cell)cell.style.display='none'};
 var fin=function(){if(ra){cancelAnimationFrame(ra);ra=0}le=null;clr();if(cell){cell.remove();cell=null}if(d&&d.g)d.g.remove();if(d&&d.b)d.b.classList.remove('drag');doc.body.classList.remove('pdrag');dragging=false};
 ic.addEventListener('pointerdown',function(e){var b=e.target.closest&&e.target.closest('.di');if(!b||e.button||d)return;var r=b.getBoundingClientRect();d={b:b,x:e.clientX,y:e.clientY,gx:e.clientX-r.left,gy:e.clientY-r.top,go:false,pid:e.pointerId,t:null}});
 addEventListener('pointermove',function(e){if(!d||e.pointerId!==d.pid)return;
  if(!d.go){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)return;d.go=true;var r=d.b.getBoundingClientRect(),g=d.b.cloneNode(true);g.classList.add('ghost');g.style.cssText='left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px';doc.body.appendChild(g);d.g=g;d.b.classList.add('drag');doc.body.classList.add('pdrag');dragging=true;sync()}
  le=e;if(!ra)ra=requestAnimationFrame(frame)});
 var end=function(e){if(!d||e.pointerId!==d.pid)return;var s=d;if(!s.go){d=null;return}
  if(ra){cancelAnimationFrame(ra);ra=0}if(le){frame()}var t=s.t||tg(e.clientX,e.clientY);fin();d=null;sup=true;setTimeout(function(){sup=false},80);
  if(e.type==='pointercancel'){sync();return}
  var b=s.b,k=b.dataset.k;
  if(t.t==='trash'){removeItem(b)}
  else if(t.t==='cell'){var occ={},g=geom();items().forEach(function(q){if(q===b)return;var p=DP[q.dataset.k];if(p)occ[p[0]+','+p[1]]=1});
   var c=occ[t.c+','+t.r]?free(g,occ,t.c,t.r):[t.c,t.r];var o=DP[k];if(!o||o[0]!==c[0]||o[1]!==c[1]){DP[k]=c;b.classList.add('pl');layout();setTimeout(function(){b.classList.remove('pl')},320)}}
  sync()};
 addEventListener('pointerup',end);addEventListener('pointercancel',end);
 addEventListener('keydown',function(e){if(e.key==='Escape'&&d&&d.go){fin();d=null;sup=true;setTimeout(function(){sup=false},80);sync()}});
 ic.addEventListener('click',function(e){if(sup){e.stopPropagation();e.preventDefault()}},true)})();
/* ---------- drops coming from File Explorer rows ---------- */
function winOf(e){var el=e.closest&&e.closest('.win');if(!el)return null;var k=Object.keys(W).find(function(q){return W[q].el===el});return k?W[k]:null}
window.DNDX={hit:function(s,x,y,e){if(!e)return null;
 var di=e.closest&&e.closest('#icons .di');
 if(di&&(di.dataset.k||'').split('|')[0]==='trash')return{ext:1,el:di,name:'Recycle Bin',tip:'Move to Recycle Bin',drop:function(its){return trashFiles(its)}};
 var w=winOf(e);if(w){if(w.app==='trash')return{ext:1,el:w.el,name:'Recycle Bin',tip:'Move to Recycle Bin',drop:function(its){return trashFiles(its)}};return null}
 if(e.closest('#dock,#start,#ctx,#trf,#mnpc,#pwm,#tbpv,.dlg'))return null;
 if(e.closest('#desk'))return{ext:1,el:$('#icons'),name:'Desktop',tip:'Create shortcut on the desktop',drop:function(its,px,py){return addLnk(its,px,py)}};
 return null}};
/* ---------- reorder pinned apps on the taskbar ---------- */
(function(){var box=$('#tasks'),d=null,sup=false,ra=0,le=null,ins=null;
 var clr=function(){if(ins){ins.classList.remove('dkins');ins=null}};
 var pinned=function(){return $$('#tasks .dk').filter(function(b){return PIN.indexOf(b.dataset.id)>=0})};
 var idx=function(x,b){var o=pinned().filter(function(q){return q!==b}),n=0;o.forEach(function(q){var r=q.getBoundingClientRect();if(r.left+r.width/2<x)n++});return n};
 var fr=function(){ra=0;if(!d||!d.go||!le)return;var e=le;le=null;d.g.style.transform='translate('+(e.clientX-d.x)+'px,'+(e.clientY-d.y)+'px)';
  var o=pinned().filter(function(q){return q!==d.b}),i=idx(e.clientX,d.b);clr();var t=o[Math.min(i,o.length-1)];if(t){ins=t;t.classList.add('dkins');t.classList.toggle('after',i>=o.length)}};
 box.addEventListener('pointerdown',function(e){var b=e.target.closest&&e.target.closest('.dk');if(!b||e.button||d||PIN.indexOf(b.dataset.id)<0)return;d={b:b,x:e.clientX,y:e.clientY,pid:e.pointerId,go:false}});
 addEventListener('pointermove',function(e){if(!d||e.pointerId!==d.pid)return;
  if(!d.go){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<14)return;d.go=true;var r=d.b.getBoundingClientRect(),g=d.b.cloneNode(true);g.className='dkgh';g.style.cssText='left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px';doc.body.appendChild(g);d.g=g;d.b.classList.add('dkdrag');doc.body.classList.add('pdrag');dragging=true;sync()}
  le=e;if(!ra)ra=requestAnimationFrame(fr)});
 var end=function(e){if(!d||e.pointerId!==d.pid)return;var s=d;d=null;if(!s.go)return;if(ra){cancelAnimationFrame(ra);ra=0}clr();s.g.remove();s.b.classList.remove('dkdrag');doc.body.classList.remove('pdrag');dragging=false;sup=true;setTimeout(function(){sup=false},80);
  if(e.type!=='pointercancel'){var id=s.b.dataset.id,from=PIN.indexOf(id),to=idx(e.clientX,s.b);if(from>=0){PIN.splice(from,1);PIN.splice(Math.min(to,PIN.length),0,id);ls('aur.pin',JSON.stringify(PIN));dockUpdate()}}sync()};
 addEventListener('pointerup',end);addEventListener('pointercancel',end);
 box.addEventListener('click',function(e){if(sup){e.stopPropagation();e.preventDefault()}},true)})();
/* ---------- cursors: resize / move / grab / no-drop ---------- */
var WDK=null,CM={'ew-resize':'ew','col-resize':'ew','ns-resize':'ns','row-resize':'ns','nwse-resize':'nwse','nesw-resize':'nesw','move':'move','all-scroll':'move','grab':'grab','grabbing':'grabbing','not-allowed':'no','no-drop':'no'};
var AR='M2 14L8 8V12H18V8L24 14L18 20V16H8V20Z';
$('#cur').insertAdjacentHTML('beforeend',
 '<svg class="cs sr sew" viewBox="0 0 26 28"><path d="'+AR+'" stroke-width="1.3" stroke-linejoin="round"/></svg>'+
 '<svg class="cs sr sns" viewBox="0 0 26 28"><path d="'+AR+'" stroke-width="1.3" stroke-linejoin="round" transform="rotate(90 13 14)"/></svg>'+
 '<svg class="cs sr snwse" viewBox="0 0 26 28"><path d="'+AR+'" stroke-width="1.3" stroke-linejoin="round" transform="rotate(45 13 14)"/></svg>'+
 '<svg class="cs sr snesw" viewBox="0 0 26 28"><path d="'+AR+'" stroke-width="1.3" stroke-linejoin="round" transform="rotate(-45 13 14)"/></svg>'+
 '<svg class="cs sr smove" viewBox="0 0 26 28"><path d="M13 1L18 6H15V12H21V9L26 14L21 19V16H15V22H18L13 27L8 22H11V16H5V19L0 14L5 9V12H11V6H8Z" stroke-width="1.2" stroke-linejoin="round"/></svg>'+
 '<svg class="cs sr sgrab" viewBox="0 0 26 28"><path d="M7.5 25C5.5 23.3 4.5 20.8 4.5 18V13.2C4.5 12.2 5.3 11.6 6.2 11.8V8C6.2 7 7 6.4 7.8 6.4C8.6 6.4 9.4 7 9.4 8V5.8C9.4 4.8 10.2 4.2 11 4.2C11.8 4.2 12.6 4.8 12.6 5.8V6.8C12.8 6.2 13.4 5.8 14.1 5.8C14.9 5.8 15.6 6.4 15.6 7.3V8.6C15.9 8.2 16.4 8 17 8C17.8 8 18.5 8.6 18.5 9.6V17.8C18.5 21.8 16 25 12.6 25Z" stroke-width="1.2" stroke-linejoin="round"/></svg>'+
 '<svg class="cs sr sgg" viewBox="0 0 26 28"><path d="M6.5 14.2C6.5 12.9 7.4 12.2 8.4 12.2C8.8 11.2 9.6 10.7 10.5 10.7C11.3 10.7 12 11.1 12.4 11.7C12.8 11.3 13.4 11.1 14 11.1C15 11.1 15.8 11.7 16 12.6C16.4 12.3 16.9 12.2 17.3 12.2C18.5 12.2 19.5 13.2 19.5 14.5V19.3C19.5 22.2 17.4 24.5 14.6 24.5H12.2C10 24.5 8.4 23.2 7.6 21.3L6.3 17.4C6.1 16.6 6.5 15.9 6.5 14.2Z" stroke-width="1.2" stroke-linejoin="round"/></svg>'+
 '<svg class="cs sno" viewBox="0 0 26 28"><circle cx="13" cy="14" r="8.6" fill="none" stroke="#111" stroke-opacity=".6" stroke-width="5.4"/><circle cx="13" cy="14" r="8.6" fill="none" stroke="#fff" stroke-width="3.6"/><circle cx="13" cy="14" r="8.6" fill="none" stroke="#e5484d" stroke-width="2.2"/><path d="M7.2 8.2L18.8 19.8" stroke="#e5484d" stroke-width="2.2" stroke-linecap="round"/></svg>');
var _cs=curState;
curState=function(t){
 if($('.dndg'))return $('.dndg').classList.contains('no')?'no':'grabbing';
 var gh=$('.di.ghost');if(gh)return gh.classList.contains('bad')?'no':'grabbing';
 if($('.dkgh'))return'grabbing';
 if(WDK&&doc.body.classList.contains('pdrag'))return WDK;
 if(t&&t.closest){var rz=t.closest('.win:not(.max) .rz,.win:not(.max) .rzr,.win:not(.max) .rzb');if(rz)return rz.classList.contains('rz')?'nwse':rz.classList.contains('rzr')?'ew':'ns';
  if(!doc.body.classList.contains('busy')&&!t.closest('textarea,input,button,a[href],select,[contenteditable]')){var c='';try{c=getComputedStyle(t).cursor}catch(e){}if(CM[c])return CM[c]}}
 return _cs(t)};
addEventListener('pointerdown',function(e){var t=e.target;WDK=null;if(!t||!t.closest)return;
 var rz=t.closest('.rz,.rzr,.rzb');if(rz){WDK=rz.classList.contains('rz')?'nwse':rz.classList.contains('rzr')?'ew':'ns';return}
 var tb=t.closest('.win:not(.max) .tbar');if(tb&&!t.closest('button'))WDK='move'},true);
var clrW=function(){WDK=null};addEventListener('pointerup',clrW,true);addEventListener('pointercancel',clrW,true);
/* ---------- fullscreen: keep the peeked taskbar open for 5 s after the last interaction ---------- */
window.peekKeep=function(){if(doc.body.classList.contains('peek')){clearTimeout(peekT);peekT=setTimeout(function(){fsPeek(false)},5000)}};
var keepSel='#dock,.fsd,#start,#ctx,#trf,#mnpc,#pwm,#tbpv,#np,#npc';
doc.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest(keepSel))peekKeep()},true);
doc.addEventListener('pointermove',function(e){if(doc.body.classList.contains('peek')&&e.target.closest&&e.target.closest('#dock'))peekKeep()},{capture:true,passive:true});
setInterval(function(){if(!doc.body.classList.contains('peek'))return;var dk=$('#dock');if(!dk)return;
 if(menuOpen||dk.matches(':hover')||(VM.on&&doc.elementsFromPoint(VM.x,VM.y).some(function(x){return x.id==='dock'||(x.closest&&x.closest('#dock'))})))peekKeep()},400);
/* ---------- go ---------- */
buildIcons(true);
})();

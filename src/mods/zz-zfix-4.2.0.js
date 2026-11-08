/* FIX-4.2.0 - right-click menu, Nex Island, File Manager.
   1. Right-click menu: solid, readable background in Dark / Light / Liquid Glass (menu + submenu), colourful icon tiles,
      the Add/New items stay in one flyout called New, and Sort.../View... items get their own flyouts (Windows style).
   2. Nex Island: no more blur glitches (no blur filter on views, no backdrop blur on the pill, centred without half pixels),
      cover art of the playing song (ID3 / FLAC / M4A) on the pill, the expanded player and the taskbar chip.
   3. File Manager: .exe files show their own icon (native NW.exeIcon), doubled icons are removed.
   Everything is wrapped in try/catch: if one part fails the rest of the system keeps working.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
function ok(f){try{return f()}catch(e){}}
var PICT=/[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
/* ---------- css ---------- */
var TILE={open:['#62B4FF','#1F6BFF'],openwith:['#74D8FF','#1E9BE8'],rename:['#FFC45A','#FF7A1A'],trash:['#FF7F96','#EE3560'],copy:['#74D8FF','#1E9BE8'],cut:['#FFC45A','#FF7A1A'],paste:['#93A0FF','#4954E0'],refresh:['#6EE79C','#1DB35B'],info:['#62B4FF','#1F6BFF'],download:['#6EE79C','#1DB35B'],share:['#C7A0FF','#7B4DFF'],sel:['#93A0FF','#4954E0'],sort:['#5BE0D8','#12A39C'],view:['#C7A0FF','#7B4DFF'],plus:['#6EE79C','#1DB35B'],gear:['#AEB8CA','#5F6B82'],brush:['#FF8FC8','#C94BE0'],display:['#FFC45A','#FF7A1A'],term:['#6B768D','#2E3748'],arch:['#FFDA78','#F5A524'],link:['#62B4FF','#1F6BFF'],undo:['#FFC45A','#FF7A1A']};
var CSS=[
/* menu colours: one set of tokens per theme */
':root{--nxm-bg:rgba(24,28,38,.97);--nxm-bd:rgba(255,255,255,.12);--nxm-hov:rgba(255,255,255,.1)}',
':root[data-theme=light]{--nxm-bg:rgba(252,253,255,.98);--nxm-bd:rgba(0,0,0,.1);--nxm-hov:rgba(0,0,0,.07)}',
':root[data-skin=glass]{--nxm-bg:rgba(26,36,68,.9);--nxm-bd:rgba(255,255,255,.22);--nxm-hov:rgba(255,255,255,.16)}',
':root:not([data-skin=glass]) :is(#ctx,.ctx,.cmenu,[role=menu]).nxm{background:var(--nxm-bg)!important;color:var(--txt)!important;border:1px solid var(--nxm-bd)!important;box-shadow:0 18px 48px rgba(0,0,0,.34)!important}',
':root:not([data-skin=glass]) .nxm-sub{background:var(--nxm-bg)!important;color:var(--txt)!important;border:1px solid var(--nxm-bd)!important}',
':root[data-skin=glass] .nxm-sub{background-color:var(--nxm-bg)!important;background-image:radial-gradient(120% 80% at 0% 0%,rgba(255,255,255,.18),rgba(255,255,255,0) 55%)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
'.nxm .nxm-it:hover,.nxm-sub .nxm-si:hover{background:var(--nxm-hov)!important}',
'.nxm-sub .nxm-si{color:inherit;cursor:pointer}',
/* Nex Island: no blur glitches, centred with auto margins (translateX(-50%) gave half pixels = blurry text) */
'.nxd{left:0!important;right:0!important;margin-left:auto!important;margin-right:auto!important;transform:translateY(0)!important;-webkit-font-smoothing:antialiased}',
'.nxd[data-show="0"]{transform:translateY(-14px) scale(.7)!important}',
'.nxd-v{filter:none!important}',
':root[data-skin=glass] .nxd,:root[data-skin=glass] .nxs-b{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(7,10,20,.94)!important}',
'.nxd .art,.nxd .mu-art img,#nxdChip .art{image-rendering:auto}'
];
Object.keys(TILE).forEach(function(k){CSS.push('.nxm .nxm-it .nxm-i[data-k='+k+']{background:linear-gradient(180deg,'+TILE[k][0]+','+TILE[k][1]+')}')});
CSS.push('.nxm .nxm-it .nxm-i[data-k]{width:22px!important;height:22px!important;border-radius:7px;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 1px 3px rgba(0,0,0,.25)}.nxm .nxm-it .nxm-i[data-k] svg{width:14px!important;height:14px!important;stroke-width:2}');
var st=doc.createElement('style');st.id='nx-fix-css';st.textContent=CSS.join('\n');doc.head.appendChild(st);
/* ---------- 1. right-click menu ---------- */
function sv(p){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
var SORT=sv('<path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3"/>'),VIEW=sv('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>');
var MAP=[[/^open with|^open in/,'openwith'],[/^(open|launch|run)\b/,'open'],[/rename/,'rename'],[/^(delete|remove|trash|move to trash|empty)/,'trash'],[/^copy (path|link)/,'link'],[/^(copy|duplicate)/,'copy'],[/^(cut|move)/,'cut'],[/^paste/,'paste'],[/^(refresh|reload)/,'refresh'],[/^(properties|details|info|about)/,'info'],[/^(download|save)/,'download'],[/^(share|send)/,'share'],[/^select all/,'sel'],[/^sort/,'sort'],[/^(view|layout|grid|list|icons)/,'view'],[/^(settings|preferences)/,'gear'],[/^(personali|wallpaper|background|change background)/,'brush'],[/^display/,'display'],[/^(terminal|command|console)/,'term'],[/^(compress|zip|extract|unzip|archive)/,'arch'],[/^edit/,'rename'],[/^preview/,'brush'],[/^undo/,'undo'],[/^(new|add)\b/,'plus']];
function lab(e){return(e.textContent||'').replace(PICT,'').replace(/\s+/g,' ').trim()}
function plabel(it){var l=it.querySelector(':scope>.nxm-l');return l?l.textContent.trim():lab(it)}
function keyOf(t){var s=t.toLowerCase();for(var i=0;i<MAP.length;i++)if(MAP[i][0].test(s))return MAP[i][1];return''}
function strip(it,rx){var w=doc.createTreeWalker(it,4),n;while((n=w.nextNode())){if(/\S/.test(n.nodeValue)){var v=n.nodeValue.replace(rx,'$1');v=v.replace(/^(\s*)([a-z])/,function(m,a,b){return a+b.toUpperCase()});n.nodeValue=v;break}}}
var GROUPS=[
 {rx:/^sort\b\s*\S/i,strip:/^(\s*[\p{Extended_Pictographic}\uFE0F\u200D]*\s*)sort(?:\s+by)?\s*[:\-]?\s*/iu,label:'Sort by',ic:SORT},
 {rx:/^view\b\s*\S/i,strip:/^(\s*[\p{Extended_Pictographic}\uFE0F\u200D]*\s*)view(?:\s+as)?\s*[:\-]?\s*/iu,label:'View',ic:VIEW}
];
function group(list){GROUPS.forEach(function(G){
 if(list.querySelector(':scope>[data-nx2="'+G.label+'"]'))return;
 var items=[].filter.call(list.children,function(k){return k.classList.contains('nxm-it')&&!k.classList.contains('nxm-parent')&&G.rx.test(plabel(k))});
 if(items.length<2)return;
 var first=items[0],p=first.cloneNode(false);
 [].slice.call(p.attributes).forEach(function(a){if(/^(data-|on|id$)/i.test(a.name))p.removeAttribute(a.name)});
 p.className='nxm-it nxm-parent';p.setAttribute('data-nxm','p');p.setAttribute('data-nx2',G.label);
 p.innerHTML='<span class="nxm-i">'+G.ic+'</span><span class="nxm-l">'+G.label+'</span><span class="nxm-ch">'+CHEV+'</span>';
 var sub=doc.createElement('div');sub.className='nxm-sub';sub.setAttribute('data-nxm','1');
 list.insertBefore(p,first);
 items.forEach(function(a){strip(a,G.strip);var ic=a.querySelector(':scope>.nxm-i');if(ic)ic.remove();a.classList.remove('nxm-it');a.classList.add('nxm-si');sub.appendChild(a)});
 p.appendChild(sub)})}
function paint(c){[].forEach.call(c.querySelectorAll('.nxm-it'),function(it){if(it.closest('.nxm-sub'))return;var ic=it.querySelector(':scope>.nxm-i');if(!ic||ic.hasAttribute('data-k'))return;var k=keyOf(plabel(it));if(k&&TILE[k])ic.setAttribute('data-k',k)})}
function fixMenu(c){var list=c.getAttribute('data-nxm')==='1'?c:c.querySelector('[data-nxm="1"]');if(!list)return;
 group(list);
 var l=list.querySelector(':scope>.nxm-parent:not([data-nx2])>.nxm-l');if(l&&l.textContent.trim()==='Add file')l.textContent='New';
 paint(c)}
/* ---------- 2. Nex Island: cover art of the playing song ---------- */
var MAXB=12000000;
function s32(u,p){return((u[p]&127)<<21)|((u[p+1]&127)<<14)|((u[p+2]&127)<<7)|(u[p+3]&127)}
function u32(u,p){return u[p]*16777216+(u[p+1]<<16)+(u[p+2]<<8)+u[p+3]}
function le(u,p){return u[p]+(u[p+1]<<8)+(u[p+2]<<16)+u[p+3]*16777216}
function dec(u,a,b,enc){try{var d=u.subarray(a,b),t;
 if(enc===1)t=(d[0]===255&&d[1]===254)?new TextDecoder('utf-16le').decode(d.subarray(2)):(d[0]===254&&d[1]===255)?new TextDecoder('utf-16be').decode(d.subarray(2)):new TextDecoder('utf-16le').decode(d);
 else if(enc===2)t=new TextDecoder('utf-16be').decode(d);else if(enc===3)t=new TextDecoder('utf-8').decode(d);else t=new TextDecoder('windows-1252').decode(d);
 return t.split(String.fromCharCode(0)).join('').trim()}catch(e){return''}}
function deun(u){var o=new Uint8Array(u.length),j=0;for(var i=0;i<u.length;i++){o[j++]=u[i];if(u[i]===255&&u[i+1]===0)i++}return o.subarray(0,j)}
function imime(u,p){return u[p]===137?'image/png':'image/jpeg'}
function id3(u){if(u[0]!==73||u[1]!==68||u[2]!==51)return null;var ver=u[3],fl=u[5],size=s32(u,6);if(ver<3||ver>4)return null;
 var body=u.subarray(10,Math.min(u.length,10+size));if((fl&128)&&ver===3)body=deun(body);
 var p=0,out={};if(fl&64)p=ver===4?s32(body,0):u32(body,0)+4;
 while(p+10<=body.length){var id=String.fromCharCode(body[p],body[p+1],body[p+2],body[p+3]);if(!/^[A-Z0-9]{4}$/.test(id))break;
  var fs=ver===4?s32(body,p+4):u32(body,p+4),ff=body[p+9],d=p+10,e=d+fs;if(fs<=0||e>body.length)break;if(ver===4&&(ff&1))d+=4;
  if(id==='TIT2'&&!out.title)out.title=dec(body,d+1,e,body[d]);
  else if(id==='TPE1'&&!out.artist)out.artist=dec(body,d+1,e,body[d]);
  else if(id==='APIC'&&!out.data){var enc=body[d],q=d+1;while(q<e&&body[q]!==0)q++;q+=2;
   if(enc===1||enc===2){while(q+1<e&&!(body[q]===0&&body[q+1]===0))q+=2;q+=2}else{while(q<e&&body[q]!==0)q++;q++}
   if(q<e){out.data=body.subarray(q,e);out.mime=imime(body,q)}}
  p=e}
 return out}
function flac(u){if(u[0]!==102||u[1]!==76||u[2]!==97||u[3]!==67)return null;var p=4,out={};
 while(p+4<=u.length){var h=u[p],last=h&128,t=h&127,len=(u[p+1]<<16)|(u[p+2]<<8)|u[p+3],d=p+4,e=d+len;if(e>u.length)break;
  if(t===6&&!out.data){var q=d+4,ml=u32(u,q);q+=4+ml;var dl=u32(u,q);q+=4+dl+16;var n=u32(u,q);q+=4;if(q+n<=e){out.data=u.subarray(q,q+n);out.mime=imime(u,q)}}
  else if(t===4){var r=d,vl=le(u,r);r+=4+vl;var cnt=le(u,r);r+=4;for(var i=0;i<cnt&&r+4<=e;i++){var cl=le(u,r);r+=4;var s=dec(u,r,r+cl,3),k=s.indexOf('=');if(k>0){var key=s.slice(0,k).toUpperCase(),val=s.slice(k+1);if(key==='TITLE'&&!out.title)out.title=val;if(key==='ARTIST'&&!out.artist)out.artist=val}r+=cl}}
  p=e;if(last)break}
 return out}
function find(u,s,from){for(var i=from||0;i+s.length<=u.length;i++){var k=0;while(k<s.length&&u[i+k]===s.charCodeAt(k))k++;if(k===s.length)return i}return -1}
function mp4(u){var f=find(u,'ftyp',0);if(f<0||f>12)return null;var c=find(u,'covr',0);if(c<0)return null;var d=find(u,'data',c);if(d<0||d-c>16)return null;var size=u32(u,d-4),a=d+12,b=d-4+size;if(b>u.length||b<=a)return null;return{data:u.subarray(a,b),mime:imime(u,a)}}
function parse(u){return ok(function(){return id3(u)})||ok(function(){return flac(u)})||ok(function(){return mp4(u)})||null}
/* reads only the start of the file (the whole ID3 tag when there is one) and stops the download */
function head(src){return fetch(src).then(function(r){if(!r.ok&&r.status!==206)throw new Error('http');
 var rd=r.body&&r.body.getReader?r.body.getReader():null;
 if(!rd)return r.arrayBuffer().then(function(b){return new Uint8Array(b.slice(0,MAXB))});
 var chunks=[],len=0,need=0;
 function cat(){var u=new Uint8Array(len),o=0;chunks.forEach(function(c){u.set(c,o);o+=c.length});return u}
 function pump(){return rd.read().then(function(x){if(x.done)return cat();chunks.push(x.value);len+=x.value.length;
  if(!need&&len>=10){var h=cat();chunks=[h];need=(h[0]===73&&h[1]===68&&h[2]===51)?Math.min(MAXB,10+s32(h,6)):Math.min(MAXB,1500000)}
  if(need&&len>=need){try{rd.cancel()}catch(e){}return cat()}
  return pump()})}
 return pump()})}
var AM={};
function load(src){if(AM[src])return AM[src];return AM[src]=head(src).then(function(u){var m=parse(u)||{},r={title:m.title||'',artist:m.artist||'',url:''};
 if(m.data&&m.data.length>200){r.url=URL.createObjectURL(new Blob([m.data],{type:m.mime||'image/jpeg'}));r.mime=m.mime||'image/jpeg'}return r}).catch(function(){return{title:'',artist:'',url:''}})}
function refresh(){var N=window.NXISLAND;if(N&&N.decide)N.decide();else doc.dispatchEvent(new Event('visibilitychange'))}
function art(el){var src=el.currentSrc||el.src;if(!src||el._nxa===src)return;el._nxa=src;
 load(src).then(function(r){if((el.currentSrc||el.src)!==src)return;
  if(r.url)el.setAttribute('data-art',r.url);else el.removeAttribute('data-art');
  if(r.title){el.setAttribute('data-title',r.title);el._nxs=1}else if(el._nxs)el.removeAttribute('data-title');
  if(r.artist){el.setAttribute('data-artist',r.artist);el._nxs=1}else if(el._nxs)el.removeAttribute('data-artist');
  ok(function(){var ms=navigator.mediaSession;if(ms&&window.MediaMetadata&&r.url){var m=ms.metadata;if(!(m&&m.artwork&&m.artwork.length))ms.metadata=new MediaMetadata({title:(m&&m.title)||r.title||'',artist:(m&&m.artist)||r.artist||'',album:(m&&m.album)||'',artwork:[{src:r.url,sizes:'512x512',type:r.mime||'image/jpeg'}]})}});
  refresh()})}
if(window.HTMLMediaElement){var op=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){var el=this;ok(function(){if(el.tagName==='AUDIO')art(el)});return op.apply(this,arguments)}}
['play','loadedmetadata'].forEach(function(t){doc.addEventListener(t,function(e){var el=e.target;if(el&&el.tagName==='AUDIO')ok(function(){art(el)})},true)});
/* ---------- 3. File Manager: exe icons + doubled icons ---------- */
var PATHS={},ICO={},Qn=0,Qq=[];
function hookNF(){if(typeof NF==='undefined'||!NF||!NF.list||NF.list._nxe)return;var ol=NF.list;
 var nl=function(){var p=ol.apply(NF,arguments);ok(function(){p.then(function(r){((r&&r.items)||[]).forEach(function(i){if(i&&i.name&&i.path&&/\.exe$/i.test(i.name))PATHS[i.name.toLowerCase()]=i.path})}).catch(function(){})});return p};
 nl._nxe=1;NF.list=nl}
function nextQ(){while(Qn<2&&Qq.length)Qq.shift()()}
function lim(fn){return new Promise(function(res){Qq.push(function(){Qn++;var d=function(v){Qn--;res(v);nextQ()};ok(function(){fn().then(d,function(){d('')})})||0});nextQ()})}
function exeSrc(p){if(ICO[p])return ICO[p];var W=typeof NW!=='undefined'?NW:null;if(!W||!W.exeIcon)return Promise.resolve('');
 return ICO[p]=W.exeIcon({path:p}).then(function(r){return(r&&r.png)||''}).catch(function(){return''})}
function rowName(row){var w=doc.createTreeWalker(row,4),n;while((n=w.nextNode())){var t=(n.nodeValue||'').trim();if(t)return t.split(/\s{2,}/)[0].trim()}return''}
function pathFor(row,nm){var low=nm.toLowerCase(),e=row;for(var d=0;d<4&&e&&e!==doc.body;d++,e=e.parentElement){var at=e.attributes;for(var i=0;i<at.length;i++){var v=at[i].value;if(v&&v.length<600&&v.charAt(0)==='/'&&v.slice(-low.length).toLowerCase()===low)return v}}return PATHS[low]||''}
function scanFiles(){var list=doc.querySelectorAll('.win .nxi,.win .nxi-in');
 for(var i=0;i<list.length&&i<1500;i++){var ic=list[i],row=ic.parentElement;if(!row||!ic.isConnected)continue;
  var sibs=row.querySelectorAll(':scope>.nxi,:scope>.nxi-in');
  if(sibs.length>1){for(var k=0;k<sibs.length-1;k++)sibs[k].remove();if(sibs[sibs.length-1]!==ic)continue}
  [].slice.call(row.children).forEach(function(s){if(s===ic||s.classList.contains('nxi')||s.classList.contains('nxi-in')||s.children.length)return;var t=(s.textContent||'').trim();if(t&&!t.replace(PICT,'').trim())s.remove()});
  var nm=rowName(row);if(ic._nxn===nm)continue;ic._nxn=nm;
  if(!/\.exe$/i.test(nm))continue;
  var p=pathFor(row,nm);if(!p){ic._nxt=(ic._nxt||0)+1;if(ic._nxt<4)ic._nxn=null;continue}
  (function(ic,p){lim(function(){return exeSrc(p)}).then(function(png){if(png&&ic.isConnected)ic.innerHTML='<img alt="" draggable="false" src="'+png+'" style="width:100%;height:100%;object-fit:contain;display:block;border-radius:4px">'})})(ic,p)}}
/* ---------- observer ---------- */
function tickAll(){ok(hookNF);[].forEach.call(doc.querySelectorAll('.nxm'),function(c){ok(function(){fixMenu(c)})});ok(scanFiles)}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;tickAll()})}).observe(doc.body,{childList:true,subtree:true});
tickAll();
})();

/* ICONS-3.6.0 - clean colored SVG icons for Settings sections and File Manager (places, folders, file types).
   Label-driven: finds lists of known names (System, Display, Downloads, ...) and prepends an icon. No emoji. */
(function(){'use strict';
var doc=document;
/* ---------- palette (gradients live once in a hidden svg) ---------- */
var COL={blue:['#62B4FF','#1F6BFF'],orange:['#FFC45A','#FF7A1A'],red:['#FF7F96','#EE3560'],green:['#6EE79C','#1DB35B'],purple:['#C7A0FF','#7B4DFF'],teal:['#5BE0D8','#12A39C'],gray:['#AEB8CA','#5F6B82'],indigo:['#93A0FF','#4954E0'],slate:['#6B768D','#2E3748'],pink:['#FF8FC8','#C94BE0'],yellow:['#FFDA78','#F5A524'],sky:['#74D8FF','#1E9BE8']};
function defs(){var s='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>';
 Object.keys(COL).forEach(function(k){s+='<linearGradient id="nxi-'+k+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+COL[k][0]+'"/><stop offset="1" stop-color="'+COL[k][1]+'"/></linearGradient>'});
 s+='<linearGradient id="nxi-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>';
 var d=doc.createElement('div');d.id='nxi-defs';d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';d.innerHTML=s;doc.body.appendChild(d)}
/* ---------- tile icons (Settings) : colored squircle + white glyph ---------- */
function tile(c,g){return'<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.4" fill="url(#nxi-'+c+')"/><path d="M0 6.4A6.4 6.4 0 016.4 0h11.2A6.4 6.4 0 0124 6.4V12H0z" fill="url(#nxi-shine)"/><g transform="translate(12 12) scale(.78) translate(-12 -12)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+g+'</g></svg>'}
var DOT=function(x,y,r){return'<circle cx="'+x+'" cy="'+y+'" r="'+(r||1)+'" fill="#fff" stroke="none"/>'};
var SET=[
 ['system',/^(system|general)/,'blue','<rect x="3" y="4.5" width="18" height="12" rx="2.2"/><path d="M8 20h8M12 16.5V20"/>'],
 ['display',/^(display|screen|brightness)/,'orange','<circle cx="12" cy="12" r="3.4"/><path d="M12 3.8v1.9M12 18.3v1.9M3.8 12h1.9M18.3 12h1.9M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4"/>'],
 ['sound',/^(sound|audio|volume)/,'red','<path d="M4.8 9.6h3.2l4.2-3.6v12l-4.2-3.6H4.8z"/><path d="M15.6 9.3a4 4 0 010 5.4M18.2 7a7.4 7.4 0 010 10"/>'],
 ['network',/^(network|wi-?fi|internet|connections?)/,'sky','<path d="M3.5 9.4a12 12 0 0117 0M6.4 12.5a8 8 0 0111.2 0M9.3 15.5a4 4 0 015.4 0"/>'+DOT(12,18.6,1.1)],
 ['bluetooth',/^(bluetooth|devices)/,'blue','<path d="M7 8l10 8-5 4V4l5 4-10 8"/>'],
 ['personal',/^(personali[sz]ation|wallpaper|background|appearance)/,'purple','<rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15 13.5l5 4.5"/>'],
 ['colors',/^colou?rs?$/,'pink','<path d="M12 3.5a8.5 8.5 0 100 17c1.2 0 1.8-.9 1.4-1.9-.5-1.2.2-2.4 1.5-2.4H17a3.5 3.5 0 003.5-3.5C20.5 7 16.8 3.5 12 3.5z"/>'+DOT(8,11.2,1.1)+DOT(11,7.8,1.1)+DOT(15.3,8.7,1.1)],
 ['themes',/^themes?$/,'indigo','<path d="M12 3.5l2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8 5.4-.7z"/>'],
 ['mouse',/^(mouse|pointer|cursor|touchpad)/,'gray','<rect x="6.5" y="3.5" width="11" height="17" rx="5.5"/><path d="M12 3.5v6M6.5 9.5h11"/>'],
 ['keyboard',/^keyboard/,'slate','<rect x="3" y="6.5" width="18" height="11" rx="2.4"/><path d="M7 10h.01M10 10h.01M13 10h.01M17 10h.01M7.6 14h8.8"/>'],
 ['taskbar',/^(taskbar|dock|start)/,'indigo','<rect x="3.5" y="5" width="17" height="14" rx="2.6"/><path d="M3.5 15h17M8 17.2h.01M12 17.2h.01M16 17.2h.01"/>'],
 ['apps',/^(apps?|applications|default apps)/,'green','<rect x="4" y="4" width="6.5" height="6.5" rx="1.7"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.7"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.7"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.7"/>'],
 ['accounts',/^(accounts?|users?|profile|sign.?in)/,'teal','<circle cx="12" cy="8.5" r="3.7"/><path d="M5 19.6c.6-3.7 3.5-5.7 7-5.7s6.4 2 7 5.7"/>'],
 ['time',/^(time|date|clock)/,'sky','<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'],
 ['language',/^(language|region)/,'blue','<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.3 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.3-3.6-8.5S9.4 5.9 12 3.5z"/>'],
 ['privacy',/^(privacy|security)/,'green','<path d="M12 3.5l7 2.7v5.3c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6.2z"/><path d="M9 12l2.2 2.2L15.2 10"/>'],
 ['lock',/^lock/,'indigo','<rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>'],
 ['update',/^(updates?|software update)/,'green','<path d="M19.5 12a7.5 7.5 0 01-13 5M4.5 12a7.5 7.5 0 0113-5"/><path d="M17.5 3.5V7H14M6.5 20.5V17H10"/>'],
 ['storage',/^(storage|disk|memory)/,'gray','<rect x="3.5" y="6" width="17" height="12" rx="2.6"/><path d="M3.5 13.5h17M7 16h.01"/>'],
 ['battery',/^(battery|power)/,'green','<rect x="3.5" y="8" width="15" height="8.5" rx="2.3"/><path d="M21 11v2.5M7 12.2h5"/>'],
 ['notif',/^notif/,'red','<path d="M6.5 16.5v-5a5.5 5.5 0 0111 0v5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 004 0"/>'],
 ['access',/^(accessibility|ease of access)/,'blue','<circle cx="12" cy="5.3" r="1.7"/><path d="M5 9l7 1.3L19 9M12 10.3v4.2M9 20l3-5.5 3 5.5"/>'],
 ['search',/^search/,'orange','<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>'],
 ['dev',/^(developer|advanced|terminal)/,'slate','<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5"/>'],
 ['about',/^(about|info)/,'gray','<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2"/>'+DOT(12,7.9,1)]
];
/* ---------- folder / file / drive icons (File Manager) ---------- */
var WH='fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
function folder(c,g){return'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 6.3A1.8 1.8 0 014.3 4.5h4.2c.5 0 .9.2 1.2.6l1 1.2h9a1.8 1.8 0 011.8 1.8v9.9a1.8 1.8 0 01-1.8 1.8H4.3a1.8 1.8 0 01-1.8-1.8z" fill="url(#nxi-'+c+')"/><path d="M2.5 6.3A1.8 1.8 0 014.3 4.5h4.2c.5 0 .9.2 1.2.6l1 1.2h9a1.8 1.8 0 011.8 1.8v9.9a1.8 1.8 0 01-1.8 1.8H4.3a1.8 1.8 0 01-1.8-1.8z" fill="#000" opacity=".16"/><path d="M2.5 10a1.8 1.8 0 011.8-1.8h15.4A1.8 1.8 0 0121.5 10v7.4a1.8 1.8 0 01-1.8 1.8H4.3a1.8 1.8 0 01-1.8-1.8z" fill="url(#nxi-'+c+')"/><path d="M2.5 10a1.8 1.8 0 011.8-1.8h15.4A1.8 1.8 0 0121.5 10v1.2h-19z" fill="url(#nxi-shine)"/>'+(g?'<g '+WH+'>'+g+'</g>':'')+'</svg>'}
var FG={
 downloads:['green','<path d="M12 11.3v5M9.8 14.4l2.2 2.2 2.2-2.2"/>'],
 documents:['blue','<path d="M9 12.2h6M9 14.6h6M9 17h3.4"/>'],
 pictures:['orange','<circle cx="9.6" cy="12.4" r=".9" fill="#fff" stroke="none"/><path d="M7.8 17.2l2.8-2.8 1.8 1.6 1.8-1.5 2.2 2.7"/>'],
 music:['pink','<path d="M14.4 11.2v4.6a1.5 1.5 0 11-1.1-1.4v-3.5l3-.8"/>'],
 videos:['purple','<path d="M10.5 11.9v4.5l4-2.25z" fill="#fff"/>'],
 desktop:['sky','<rect x="8" y="11.2" width="8" height="5" rx="1"/>'],
 home:['blue','<path d="M8.4 14.4L12 11.4l3.6 3v3h-7.2z"/>'],
 recent:['teal','<circle cx="12" cy="14.2" r="3.1"/><path d="M12 12.6v1.7l1.1.7"/>'],
 starred:['orange','<path d="M12 11.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z"/>'],
 shared:['indigo','<circle cx="10" cy="13" r="1.4"/><circle cx="14.6" cy="13" r="1.4"/><path d="M7.8 17c.3-1.4 1.2-2 2.2-2M16.8 17c-.3-1.4-1.2-2-2.2-2"/>'],
 plain:['yellow','']
};
var PLACES=[
 ['downloads',/^downloads?$/],['documents',/^(documents?|docs)$/],['pictures',/^(pictures?|photos?|images?|gallery)$/],['music',/^(music|audio)$/],['videos',/^(videos?|movies)$/],
 ['desktop',/^desktop$/],['home',/^(home|this (device|pc)|my files)$/],['recent',/^recent/],['starred',/^(favou?rites?|starred)$/],['shared',/^shared$/],
 ['trash',/^(trash|recycle bin|bin)$/],['drive',/^(internal storage|sd ?card|usb|phone|computer|local disk|drive|c:|d:)/]
];
function trash(){return'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 8h11.6l-.9 10.6a1.8 1.8 0 01-1.8 1.6H8.9a1.8 1.8 0 01-1.8-1.6z" fill="url(#nxi-gray)"/><rect x="4.5" y="5.6" width="15" height="2.6" rx="1.3" fill="url(#nxi-gray)"/><path d="M9.2 5.6l.6-1.6h4.4l.6 1.6" fill="none" stroke="#7B879B" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 11v6M12 11v6M14 11v6" stroke="#fff" stroke-opacity=".8" stroke-width="1.3" stroke-linecap="round"/></svg>'}
function drive(){return'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="7.5" width="19" height="9.5" rx="2.6" fill="url(#nxi-gray)"/><rect x="2.5" y="7.5" width="19" height="4.8" rx="2.4" fill="url(#nxi-shine)"/><rect x="5.2" y="12.4" width="8" height="1.6" rx=".8" fill="#fff" opacity=".6"/><circle cx="17.8" cy="13.2" r="1.15" fill="#6EE79C"/></svg>'}
function page(c,g){return'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 2.5h7.6L19 7.7V20a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20V4a1.5 1.5 0 011.2-1.5z" fill="url(#nxi-'+c+')"/><path d="M13.8 2.5v3.7a1.5 1.5 0 001.5 1.5H19z" fill="#fff" fill-opacity=".42"/><g '+WH+'>'+g+'</g></svg>'}
var FT={
 image:['orange','<circle cx="9.6" cy="12.6" r="1" fill="#fff" stroke="none"/><path d="M7.2 18l3.1-3.1 2.2 1.9 2-1.7L17 18"/>',/^(png|jpe?g|gif|webp|bmp|svg|ico|avif|heic)$/],
 audio:['pink','<path d="M13.6 12v4.7a1.6 1.6 0 11-1.2-1.5v-3.8l3.1-.9"/>',/^(mp3|wav|ogg|flac|m4a|aac|opus)$/],
 video:['purple','<path d="M10 12.2v5.1l4.5-2.55z" fill="#fff"/>',/^(mp4|mkv|webm|avi|mov|3gp)$/],
 archive:['yellow','<path d="M11 8.8h1.6M12.4 10.4H14M11 12h1.6M12.4 13.6H14"/><rect x="10.6" y="15" width="2.8" height="2.8" rx=".9" fill="#fff" stroke="none"/>',/^(zip|rar|7z|tar|gz|xz|bz2)$/],
 pdf:['red','<path d="M8.6 17.4c2.8-3 3.6-5.4 3-6.2s-1.4.8-.6 2.6 2.4 3.2 4.2 3"/>',/^pdf$/],
 doc:['blue','<path d="M8.5 12.4h7M8.5 14.9h7M8.5 17.4h4"/>',/^(txt|md|rtf|doc|docx|odt|log)$/],
 sheet:['green','<path d="M8 12h8M8 14.8h8M8 17.6h8M11.2 10.6v8"/>',/^(csv|xls|xlsx|ods)$/],
 code:['slate','<path d="M10.2 12.4L8 14.9l2.2 2.5M13.8 12.4l2.2 2.5-2.2 2.5"/>',/^(js|mjs|ts|json|html?|css|py|java|c|cpp|h|sh|xml|ya?ml)$/],
 app:['teal','<rect x="8.4" y="11.4" width="7.2" height="7.2" rx="1.8"/>',/^(apk|exe|msi|bat|appimage)$/]
};
function fileIcon(ext){for(var k in FT)if(FT[k][2].test(ext))return page(FT[k][0],FT[k][1]);return page('gray','')}
var EXT=/\.([a-z0-9]{1,8})$/i;
/* ---------- helpers ---------- */
var PICT=/[\p{Extended_Pictographic}\uFE0F\u200D\u203A\u00BB>\u2022\u00B7]/gu;
function norm(s){return(s||'').replace(PICT,'').replace(/\s+/g,' ').trim().toLowerCase()}
function firstLeafText(el){var w=doc.createTreeWalker(el,4),n;while((n=w.nextNode())){var t=norm(n.nodeValue);if(t)return t}return''}
var cache={};
function setIcon(name){return cache[name]||(cache[name]=(function(){for(var i=0;i<SET.length;i++)if(SET[i][0]===name)return tile(SET[i][2],SET[i][3]);return''})())}
function match(el){if(el.dataset.nxi)return null;var txt=norm(el.textContent);if(!txt||txt.length>40)return null;var tries=[txt];var f=firstLeafText(el);if(f&&f!==txt)tries.push(f);
 for(var t=0;t<tries.length;t++){var s=tries[t];if(s.length>30)continue;
  for(var i=0;i<PLACES.length;i++)if(PLACES[i][1].test(s))return{kind:'place',key:PLACES[i][0]};
  for(i=0;i<SET.length;i++)if(SET[i][1].test(s))return{kind:'set',key:SET[i][0]}}
 return null}
function nameOf(el){var w=doc.createTreeWalker(el,4),n;while((n=w.nextNode())){var t=(n.nodeValue||'').replace(PICT,'').trim();if(t)return t}return''}
function isFolderEl(el){return /[\u{1F4C1}\u{1F4C2}\u{1F5C2}]/u.test(el.textContent||'')||/(^|[\s_-])(dir|folder|directory)([\s_-]|$)/i.test(el.className||'')||/^(dir|folder|directory)$/i.test(el.dataset.type||el.dataset.kind||'')}
function addIcon(el,svg,cls){if(!svg||el.dataset.nxi)return;el.dataset.nxi='1';
 var c=el.firstElementChild,lab=norm(el.textContent);
 if(c&&c.children.length<=1&&norm(c.textContent)!==lab&&(!norm(c.textContent)||/[\p{Extended_Pictographic}]/u.test(c.textContent)||c.querySelector('svg,img')||c.tagName==='IMG'||c.tagName==='SVG'||c.tagName==='svg')){
  if(!c.classList.contains('nxi')){c.style.display='none';c.setAttribute('data-nxi-old','1')}}
 var f=el.firstChild;if(f&&f.nodeType===3){f.nodeValue=f.nodeValue.replace(/^\s*[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u,'')}
 var sp=doc.createElement('span');sp.className='nxi '+(cls||'');sp.innerHTML=svg;el.insertBefore(sp,el.firstChild)}
function placeSvg(k){if(k==='trash')return trash();if(k==='drive')return drive();var g=FG[k];return g?folder(g[0],g[1]):folder('yellow','')}
function decorate(el,m){if(m.kind==='set')addIcon(el,setIcon(m.key),el.classList.contains('ftile')?'big':'');else addIcon(el,placeSvg(m.key),el.classList.contains('ftile')?'big fl':'fl')}
/* ---------- scan ---------- */
var SEL='div,button,li,a,span,p,tr';
function scanParent(p){if(!p||p.dataset.nxScan==='1'&&false)return;var kids=[].slice.call(p.children),hits=[],files=[];
 if(kids.length<2||kids.length>400)return;
 kids.forEach(function(k){if(k.dataset.nxi||k.classList.contains('nxi'))return;var m=match(k);if(m){hits.push([k,m]);return}
  var nm=nameOf(k);if(nm&&nm.length<120&&EXT.test(nm.split(/\s{2,}/)[0].trim()))files.push(k)});
 if(hits.length>=3)hits.forEach(function(h){decorate(h[0],h[1])});
 if(files.length>=2){kids.forEach(function(k){if(k.dataset.nxi||k.classList.contains('nxi'))return;var nm=nameOf(k).split(/\s{2,}/)[0].trim(),x=EXT.exec(nm),big=k.classList.contains('ftile')?'big fl':'fl';
  if(x&&nm.length<120)addIcon(k,fileIcon(x[1].toLowerCase()),big);
  else if(isFolderEl(k)){var s=norm(nm),key='plain';for(var i=0;i<PLACES.length;i++)if(PLACES[i][1].test(s)&&FG[PLACES[i][0]]){key=PLACES[i][0];break}addIcon(k,placeSvg(key),big)}})}}
function scan(r){if(!r||r.nodeType!==1||r.closest&&r.closest('#nxi-defs,.nxkb,#dock'))return;
 var ps=new Set();var list=[].slice.call(r.querySelectorAll(SEL));if(r.matches&&r.matches(SEL))list.unshift(r);
 list.forEach(function(el){if(el.children.length<=4&&(el.textContent||'').length<=140&&el.parentElement)ps.add(el.parentElement)});
 ps.forEach(scanParent);
 /* Settings page title */
 var sp=r.id==='spg'?r:(r.querySelector?r.querySelector('#spg'):null);if(!sp&&r.closest)sp=r.closest('#spg');
 if(sp)sp.querySelectorAll('h3').forEach(function(h){if(h.dataset.nxi)return;var s=norm(h.textContent);for(var i=0;i<SET.length;i++)if(SET[i][1].test(s)){addIcon(h,tile(SET[i][2],SET[i][3]),'lg');return}})}
/* ---------- css + boot ---------- */
var st=doc.createElement('style');st.id='nx-icons-css';st.textContent=[
'.nxi{display:inline-flex;flex:none;width:20px;height:20px;margin-right:10px;vertical-align:-5px;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.28));pointer-events:none;-webkit-user-select:none;user-select:none}',
'.nxi svg{width:100%;height:100%;display:block}.nxi.lg{width:26px;height:26px;margin-right:12px;vertical-align:-7px}.nxi.fl{width:22px;height:22px;margin-right:9px;vertical-align:-6px}',
'.nxi.big{display:flex;width:46px;height:46px;margin:0 auto 6px}'].join('\n');
doc.head.appendChild(st);
defs();
var pend=[],tm=0;
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)if(a[j].nodeType===1&&!a[j].classList.contains('nxi')&&a[j].id!=='nxi-defs')pend.push(a[j])}
 if(!tm&&pend.length)tm=setTimeout(function(){tm=0;var q=pend.splice(0,pend.length).slice(0,60);q.forEach(function(n){if(n.isConnected)scan(n)})},60)}).observe(doc.body,{childList:true,subtree:true});
window.NXICON={scan:scan,set:setIcon,file:fileIcon};
scan(doc.body);
})();

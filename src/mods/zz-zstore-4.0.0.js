/* STORE-4.0.0 - Nex Store: app store with Windows programs (run through Wine) and web apps.
   Sources: GitHub Releases / official download servers (files), Wikipedia REST API (poster + screenshots, cached). Needs zz-zdl-4.0.0.js (NXDL download engine). */
(function(){'use strict';
if(typeof A==='undefined'||typeof openApp!=='function')return;
var doc=document,X=window.NXDL||null,root=null;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
function J(k,d){try{var v=JSON.parse(g(k,''));return v==null?d:v}catch(e){return d}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function calm(){var b=doc.body.classList;return b.contains('perf')||b.contains('rm')}
function say(m){try{toast(m)}catch(e){}}
function nfo(){return typeof NF!=='undefined'?NF:null}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function fb(n){n=+n||0;if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(0)+' KB';if(n<1073741824)return(n/1048576).toFixed(n<10485760?1:0)+' MB';return(n/1073741824).toFixed(2)+' GB'}
function cssUrl(u){return String(u).replace(/[()' "]/g,function(c){return'%'+c.charCodeAt(0).toString(16).toUpperCase()})}
function when(t){if(!t)return'-';var d=new Date(t);return isNaN(d)?'-':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function user(){return g('aur.user','You')}
/* ---------- catalog ---------- */
var G={
 doc:'<path d="M7 4h7l4 4v12H7z"/><path d="M14 4v4h4M9.5 12h6M9.5 15.5h6"/>',
 pdf:'<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4"/><path d="M9.5 15c2-2.6 2.8-4.4 2.4-5s-1.2.6-.6 2 1.8 2.4 3.4 2.2"/>',
 lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8 10.5V8a4 4 0 018 0v2.5M12 14.2v2.4"/>',
 wave:'<path d="M4 12h2M8 8v8M12 5v14M16 8.5v7M20 11v2"/>',
 cone:'<path d="M12 4.5l6 14.5H6z"/><path d="M9 14h6"/>',
 term:'<rect x="3.5" y="5" width="17" height="14" rx="2.4"/><path d="M7.5 10l3 2.5-3 2.5M12.5 15h4"/>',
 train:'<rect x="6" y="4.5" width="12" height="11.5" rx="3"/><path d="M6 11h12M9 19.5l-1.5 1.5M15 19.5l1.5 1.5M9.5 13.6h.01M14.5 13.6h.01"/>',
 merge:'<rect x="3.5" y="5" width="7" height="14" rx="1.6"/><rect x="13.5" y="5" width="7" height="14" rx="1.6"/><path d="M10.5 12h3"/>',
 img:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15 13.5l5 4.5"/>',
 pen:'<path d="M4 20l1-4L16.5 4.5a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8 19z"/><path d="M14.5 6.5l3 3"/>',
 shape:'<path d="M4 18l5-12 5 12z"/><circle cx="17.5" cy="7.5" r="3"/>',
 squash:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M9 9l6 6M15 9l-6 6"/>',
 flow:'<rect x="3.5" y="4" width="7" height="5.5" rx="1.4"/><rect x="13.5" y="14.5" width="7" height="5.5" rx="1.4"/><path d="M7 9.5v3.5a2 2 0 002 2h4.5"/>',
 flag:'<path d="M3.5 5.5l7-1v7h-7zM13.5 4.3l7-1.1v8.3h-7zM3.5 13.5h7v7l-7-1zM13.5 13.5h7v8.3l-7-1.1z"/>',
 chef:'<path d="M7 19h10v-4.2a4 4 0 00-1-7.7 4 4 0 00-8 0 4 4 0 00-1 7.7z"/><path d="M7 17h10"/>'
};
var CAT=[
{id:'vlc',kind:'win',name:'VLC media player',dev:'VideoLAN',cat:'Media',tag:'Plays almost any video or audio file',c:['#ffb347','#f2711c'],gl:G.cone,url:'https://get.videolan.org/vlc/3.0.21/win64/vlc-3.0.21-win64.zip',ver:'3.0.21',exe:/^vlc\.exe$/i,wiki:'VLC media player',site:'https://www.videolan.org/vlc/',lic:'GPL-2.0',feat:1,pick:1,fit:'Good',
 desc:'The media player that opens nearly everything: local files, discs, network streams and subtitles, without hunting for codecs. Light on the interface, heavy on format support.',feats:['Plays almost any format','Subtitles and audio tracks','Network streams'],req:{cpu:'x64 processor',ram:'1 GB',disk:'260 MB',gfx:'OpenGL 2.0 or better'},size:'~ 45 MB'},
{id:'npp',kind:'win',name:'Notepad++',dev:'Don Ho',cat:'Developer',tag:'Fast, free code and text editor',c:['#8be07a','#2f9e44'],gl:G.doc,gh:'notepad-plus-plus/notepad-plus-plus',asset:/portable\.x64\.zip$/i,exe:/^notepad\+\+\.exe$/i,wiki:'Notepad++',site:'https://notepad-plus-plus.org',lic:'GPL-3.0',feat:1,pick:1,fit:'Great',
 desc:'A lightweight editor with tabs, syntax highlighting for dozens of languages, search across files, macros and a large plugin ecosystem. Starts instantly and handles big files.',feats:['Tabbed editing','Syntax highlighting','Find in files','Plugins'],req:{cpu:'x64 processor',ram:'256 MB',disk:'40 MB',gfx:'Not required'},size:'~ 8 MB'},
{id:'sumatra',kind:'win',name:'SumatraPDF',dev:'Krzysztof Kowalczyk',cat:'Productivity',tag:'A tiny, quick reader for PDF and ebooks',c:['#ffd36e','#e8a317'],gl:G.pdf,gh:'sumatrapdfreader/sumatrapdf',asset:/SumatraPDF-[\d.]+-64\.zip$/i,exe:/^SumatraPDF.*\.exe$/i,wiki:'SumatraPDF',site:'https://www.sumatrapdfreader.org',lic:'GPL-3.0',pick:1,fit:'Great',
 desc:'Opens PDF, ePub, MOBI, comics and more in a blink. Minimal interface, keyboard friendly and small enough to run anywhere.',feats:['PDF, ePub, MOBI, CBZ','Opens instantly','Keyboard shortcuts'],req:{cpu:'x64 processor',ram:'128 MB',disk:'30 MB',gfx:'Not required'},size:'~ 10 MB'},
{id:'keepassxc',kind:'win',name:'KeePassXC',dev:'KeePassXC Team',cat:'Security',tag:'Offline password manager you control',c:['#7bd88f','#1f9d55'],gl:G.lock,gh:'keepassxc/keepassxc',asset:/Win64\.zip$/i,exe:/^KeePassXC\.exe$/i,wiki:'KeePassXC',site:'https://keepassxc.org',lic:'GPL-3.0',pick:1,fit:'Good',
 desc:'Keeps passwords in an encrypted file that only you hold. Includes a strong password generator, one-time codes and auto-type.',feats:['Encrypted local database','Password generator','TOTP codes'],req:{cpu:'x64 processor',ram:'256 MB',disk:'80 MB',gfx:'Basic graphics'},size:'~ 35 MB'},
{id:'audacity',kind:'win',name:'Audacity',dev:'Audacity Team',cat:'Media',tag:'Record and edit audio, free',c:['#59c9ff','#1b73e8'],gl:G.wave,gh:'audacity/audacity',asset:/audacity-win-[\d.]+-64bit\.zip$/i,exe:/^audacity\.exe$/i,wiki:'Audacity (audio editor)',site:'https://www.audacityteam.org',lic:'GPL-3.0',pick:1,fit:'Good',
 desc:'A multi-track audio editor and recorder. Cut and mix clips, remove noise, add effects and export to common formats.',feats:['Multi-track editing','Noise reduction','Effects and plugins'],req:{cpu:'x64 processor',ram:'2 GB',disk:'200 MB',gfx:'Basic graphics'},size:'~ 90 MB'},
{id:'putty',kind:'win',name:'PuTTY',dev:'Simon Tatham',cat:'Utilities',tag:'SSH and Telnet client in a single file',c:['#9aa7bd','#4a566c'],gl:G.term,url:'https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe',ver:'latest',exe:/^putty\.exe$/i,wiki:'PuTTY',site:'https://www.chiark.greenend.org.uk/~sgtatham/putty/',lic:'MIT',fit:'Great',
 desc:'The classic SSH client. Connect to servers and devices securely, save sessions and use key authentication, all from one small program.',feats:['SSH, Telnet, serial','Saved sessions','Key authentication'],req:{cpu:'x64 processor',ram:'64 MB',disk:'4 MB',gfx:'Not required'},size:'~ 1.5 MB'},
{id:'openttd',kind:'win',name:'OpenTTD',dev:'OpenTTD team',cat:'Games',tag:'Build a transport empire',c:['#ff9d6c','#e04f5f'],gl:G.train,url:'https://cdn.openttd.org/openttd-releases/14.1/openttd-14.1-windows-win64.zip',ver:'14.1',exe:/^openttd\.exe$/i,wiki:'OpenTTD',site:'https://www.openttd.org',lic:'GPL-2.0',feat:1,fit:'Good',
 desc:'Lay roads, rails, ships and planes and grow a transport network across the map. Open-source and packed with scenarios, with free graphics included.',feats:['Trains, road, ships, planes','Endless scenarios','Free graphics included'],req:{cpu:'x64 processor',ram:'1 GB',disk:'120 MB',gfx:'OpenGL capable GPU'},size:'~ 25 MB'},
{id:'winmerge',kind:'win',name:'WinMerge',dev:'WinMerge team',cat:'Developer',tag:'Compare and merge files and folders',c:['#7aa2ff','#4054d6'],gl:G.merge,gh:'WinMerge/winmerge',asset:/x64-exe\.zip$/i,exe:/^WinMergeU\.exe$/i,wiki:'WinMerge',site:'https://winmerge.org',lic:'GPL-2.0',fit:'Good',
 desc:'Shows differences between files and folders side by side with colour highlights, and lets you merge changes in either direction.',feats:['Folder comparison','Inline differences','Merge in both directions'],req:{cpu:'x64 processor',ram:'256 MB',disk:'40 MB',gfx:'Not required'},size:'~ 15 MB'},
{id:'photopea',kind:'web',name:'Photopea',dev:'Ivan Kutskir',cat:'Creativity',tag:'Full image editor in your browser',c:['#2fd1c5','#127e94'],gl:G.img,site:'https://www.photopea.com',wiki:'Photopea',feat:1,pick:1,
 desc:'A powerful image editor that runs in a web page. Works with layers, masks, filters and opens PSD, XCF, Sketch and common image files.',feats:['Layers and masks','Opens PSD and more','Filters and effects'],req:{cpu:'Any',ram:'1 GB',disk:'None',gfx:'Hardware acceleration recommended'}},
{id:'jspaint',kind:'web',name:'JS Paint',dev:'Isaiah Odhner',cat:'Creativity',tag:'Classic Paint, in the browser',c:['#ff8fc8','#7b4dff'],gl:G.pen,site:'https://jspaint.app',pick:1,
 desc:'A faithful web recreation of the classic Windows Paint, with the same tools, the familiar look and image export.',feats:['Familiar Paint tools','Saves PNG and more','Works offline after loading'],req:{cpu:'Any',ram:'512 MB',disk:'None',gfx:'Basic graphics'}},
{id:'excalidraw',kind:'web',name:'Excalidraw',dev:'Excalidraw',cat:'Productivity',tag:'Hand-drawn whiteboard for ideas',c:['#a5a2ff','#5a4de0'],gl:G.shape,site:'https://excalidraw.com',wiki:'Excalidraw',pick:1,
 desc:'A virtual whiteboard with a hand-drawn look. Sketch diagrams, wireframes and notes, then export them as images.',feats:['Hand-drawn style','Export to PNG and SVG','Simple shapes and arrows'],req:{cpu:'Any',ram:'512 MB',disk:'None',gfx:'Basic graphics'}},
{id:'squoosh',kind:'web',name:'Squoosh',dev:'Google Chrome Labs',cat:'Utilities',tag:'Shrink images with live preview',c:['#ffcf5c','#f0762a'],gl:G.squash,site:'https://squoosh.app',
 desc:'Compress and convert images in the browser and compare the result side by side before you save it.',feats:['Side-by-side preview','Modern formats','Private, runs locally'],req:{cpu:'Any',ram:'1 GB',disk:'None',gfx:'Basic graphics'}},
{id:'diagrams',kind:'web',name:'diagrams.net',dev:'JGraph',cat:'Productivity',tag:'Flowcharts, UML and network diagrams',c:['#ffa86b','#e8590c'],gl:G.flow,site:'https://app.diagrams.net',wiki:'Diagrams.net',
 desc:'Free diagramming tool for flowcharts, UML, network maps and more, with a big shape library and many export formats.',feats:['Large shape library','Export PDF, PNG, SVG','Works with local files'],req:{cpu:'Any',ram:'1 GB',disk:'None',gfx:'Basic graphics'}},
{id:'win98',kind:'web',name:'Windows 98 Desktop',dev:'1j01',cat:'Games',tag:'A retro desktop in a web page',c:['#5aa7ff','#2c4fc4'],gl:G.flag,site:'https://98.js.org',
 desc:'A playful Windows 98 style desktop that runs entirely in the browser, with working apps like Paint and Notepad.',feats:['Retro look and feel','Working mini apps','Nothing to install'],req:{cpu:'Any',ram:'1 GB',disk:'None',gfx:'Basic graphics'}},
{id:'cyberchef',kind:'web',name:'CyberChef',dev:'GCHQ',cat:'Developer',tag:'The cyber Swiss Army knife',c:['#8fd3ff','#2f6fdb'],gl:G.chef,site:'https://gchq.github.io/CyberChef/',wiki:'CyberChef',
 desc:'Encode, decode, hash and analyse data by chaining operations together. Handy for developers and curious minds.',feats:['Hundreds of operations','Chain steps as recipes','Runs locally in the page'],req:{cpu:'Any',ram:'1 GB',disk:'None',gfx:'Basic graphics'}}
];
var byId={};CAT.forEach(function(a){byId[a.id]=a;a.web=a.kind==='web'});
var CATS=['All','Productivity','Media','Developer','Creativity','Security','Utilities','Games'];
/* ---------- persisted state ---------- */
var lib=J('aur.nxs.lib',{}),revs=J('aur.nxs.rev',{}),JOB={},MC=J('aur.nxs.mc',{});
function savLib(){put('aur.nxs.lib',JSON.stringify(lib))}
function savRev(){put('aur.nxs.rev',JSON.stringify(revs))}
function rating(a){var r=revs[a.id]||[];if(!r.length)return null;var s=0;r.forEach(function(x){s+=x.r});return{v:s/r.length,n:r.length}}
/* ---------- artwork ---------- */
var PC={};
function poster(a,w,h,txt){var k=a.id+w+h+(txt||'');if(PC[k])return PC[k];var c=a.c;
 var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c[0]+'"/><stop offset="1" stop-color="'+c[1]+'"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="'+(w*.84)+'" cy="'+(h*.18)+'" r="'+(h*.6)+'" fill="#fff" opacity=".11"/><circle cx="'+(w*.08)+'" cy="'+(h*1.08)+'" r="'+(h*.62)+'" fill="#000" opacity=".13"/>'+
  '<g transform="translate('+(w*(txt?.8:.76))+' '+(h*.5)+') scale('+(h/(txt?95:64))+') translate(-12 -12)" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">'+a.gl+'</g>'+
  (txt?'<text x="'+(w*.07)+'" y="'+(h*.56)+'" font-family="system-ui,sans-serif" font-weight="800" font-size="'+(h*.12)+'" fill="#fff">'+esc(txt)+'</text><text x="'+(w*.07)+'" y="'+(h*.7)+'" font-family="system-ui,sans-serif" font-weight="500" font-size="'+(h*.065)+'" fill="#fff" opacity=".8">'+esc(a.name)+'</text>':'')+'</svg>';
 return PC[k]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg).replace(/[()']/g,function(ch){return'%'+ch.charCodeAt(0).toString(16).toUpperCase()})}
function icon(a){return'<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.4" fill="url(#nxsg-'+a.id+')"/><path d="M0 6.4A6.4 6.4 0 016.4 0h11.2A6.4 6.4 0 0124 6.4V12H0z" fill="#fff" opacity=".22"/><g transform="translate(12 12) scale(.62) translate(-12 -12)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+a.gl+'</g></svg>'}
function defsSvg(){var s='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="nxsHalf" x1="0" y1="0" x2="1" y2="0"><stop offset=".5" stop-color="#ffb340"/><stop offset=".5" stop-color="#8a8a8a" stop-opacity=".4"/></linearGradient>';
 CAT.forEach(function(a){s+='<linearGradient id="nxsg-'+a.id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a.c[0]+'"/><stop offset="1" stop-color="'+a.c[1]+'"/></linearGradient>'});return s+'</defs></svg>'}
var STAR='<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6 6.9 19.3l1-5.7-4.1-4 5.7-.8z"/>';
function stars(v,s){var o='';for(var i=1;i<=5;i++){var f=v>=i-.25?'#ffb340':v>=i-.75?'url(#nxsHalf)':'rgba(138,138,138,.4)';o+=`<svg viewBox='0 0 24 24' width='${s}' height='${s}' fill='${f}'>${STAR}</svg>`}return`<span class='nxs-st'>${o}</span>`}
function ic(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.9)+'" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
/* ---------- remote metadata (cached) ---------- */
function jf(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status===403?'GitHub request limit reached, try again later':'Server answered '+r.status);return r.json()})}
function cached(key,ttl,fn){var c=MC[key];if(c&&Date.now()-c.t<ttl)return Promise.resolve(c.v);return fn().then(function(v){MC[key]={t:Date.now(),v:v};try{put('aur.nxs.mc',JSON.stringify(MC))}catch(e){}return v}).catch(function(e){if(c)return c.v;throw e})}
function wiki(a){if(!a.wiki)return Promise.resolve(null);return cached('w:'+a.id,6048e5,function(){var t=encodeURIComponent(a.wiki.replace(/ /g,'_')),b='https://en.wikipedia.org/api/rest_v1/page/';
 return Promise.all([jf(b+'summary/'+t).catch(function(){return null}),jf(b+'media-list/'+t).catch(function(){return null})]).then(function(r){var s=r[0],m=r[1],img=s&&s.thumbnail&&s.thumbnail.source||'',shots=[];if(img)img=img.replace(/\/\d+px-/,'/960px-');
  if(m&&m.items){var tok=a.name.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(' ').filter(function(x){return x.length>2});
   m.items.forEach(function(it){if(it.type!=='image'||shots.length>=6)return;var t2=String(it.title||'').toLowerCase();if(/\.svg$/.test(t2)||/(logo|icon|symbol|wordmark|flag|commons|wikidata|ambox|edit-)/.test(t2))return;
    var ok=/screenshot|screen|window|interface/.test(t2)||tok.some(function(x){return t2.indexOf(x)>=0});if(!ok)return;var src=it.srcset&&it.srcset.length?it.srcset[it.srcset.length-1].src:'';if(!src&&it.original)src=it.original.source;if(!src)return;
    if(src.indexOf('//')===0)src='https:'+src;shots.push(src.replace(/\/\d+px-/,'/800px-'))})}
  return{img:img,shots:shots}})})}
function ghRel(a){return cached('r:'+a.id,216e5,function(){return jf('https://api.github.com/repos/'+a.gh+'/releases/latest').then(function(r){return{tag:r.tag_name,date:r.published_at,body:String(r.body||'').slice(0,1400),url:r.html_url,assets:(r.assets||[]).map(function(x){return{name:x.name,size:x.size,url:x.browser_download_url}})}})})}
function ghRepo(a){return cached('g:'+a.id,216e5,function(){return jf('https://api.github.com/repos/'+a.gh).then(function(r){return{stars:r.stargazers_count,lic:r.license&&r.license.spdx_id||'',pushed:r.pushed_at}})})}
/* ---------- install pipeline ---------- */
var STEPS=['resolve','download','install','done'];
function setJob(id,st,p,msg){var j=JOB[id]||(JOB[id]={}),prev=j.st;j.st=st;j.p=p||0;j.msg=msg||'';if(st==='error')j.last=prev&&prev!=='error'?prev:(j.last||'resolve');paint(id)}
function ovl(j){var s=j.st==='error'?(j.last||'resolve'):j.st;return s==='resolve'?.06:s==='download'?.1+.6*j.p:s==='install'?.7+.28*j.p:s==='done'?1:0}
function gstate(a){var j=JOB[a.id];if(j&&j.st&&j.st!=='done'&&j.st!=='error')return'busy';if(lib[a.id])return'ready';return j&&j.st==='error'?'retry':'idle'}
function ginner(a,big){var s=gstate(a),j=JOB[a.id]||{};
 if(s==='busy'){var ind=j.st!=='download'||!(j.p>.01),off=69.1*(1-(ind?.3:j.p));return`<svg class='rg${ind?' sp':''}' viewBox='0 0 28 28'><circle class='b' cx='14' cy='14' r='11'/><circle class='f' cx='14' cy='14' r='11' style='stroke-dashoffset:${off.toFixed(1)}'/></svg>`+(big?`<span class='lb'>${j.st==='download'?Math.round(j.p*100)+'%':j.st==='install'?'Installing':'Preparing'}</span>`:'')}
 return s==='ready'?'Open':s==='retry'?'Retry':'Get'}
function getBtn(a,big){return`<button class='nxs-get${big?' big':''}' data-get='${a.id}' data-st='${gstate(a)}'>${ginner(a,big)}</button>`}
function jobUI(p,a){var j=JOB[a.id];if(!j||!j.st){p.classList.remove('on');return}p.classList.add('on');var ix=STEPS.indexOf(j.st==='error'?(j.last||'resolve'):j.st);
 p.querySelectorAll('.stp').forEach(function(s,i){s.classList.toggle('done',j.st==='done'||i<ix);s.classList.toggle('act',i===ix&&j.st!=='done'&&j.st!=='error');s.classList.toggle('err',j.st==='error'&&i===ix)});
 p.querySelector('.bar i').style.width=(ovl(j)*100).toFixed(1)+'%';p.querySelector('.msg').textContent=j.msg;p.classList.toggle('bad',j.st==='error')}
function paint(id){var a=byId[id];if(!a||!root||!root.isConnected)return;
 root.querySelectorAll("[data-get='"+id+"']").forEach(function(b){var st=gstate(a);if(b.getAttribute('data-st')!==st)b.setAttribute('data-st',st);b.innerHTML=ginner(a,b.classList.contains('big'))});
 root.querySelectorAll("[data-job='"+id+"']").forEach(function(p){jobUI(p,a)});
 root.querySelectorAll("[data-acts='"+id+"']").forEach(function(p){var h=actsHtml(a);if(p._h!==h){p._h=h;p.innerHTML=h}});badge()}
function badge(){var n=Object.keys(lib).length,b=root&&root.querySelector('.nxs-rail .bd');if(b){b.textContent=n||'';b.style.display=n?'':'none'}}
function burst(el){if(calm()||!el||!el.animate)return;var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,cols=['#ff8fc8','#c94be0','#ffd6ec','#7b4dff','#ffffff'];
 for(var i=0;i<20;i++){var p=doc.createElement('i');p.className='nxs-cf';p.style.cssText='left:'+cx+'px;top:'+cy+'px;background:'+cols[i%5];doc.body.appendChild(p);var ang=Math.PI*2*i/20+Math.random()*.4,d=44+Math.random()*70;
  p.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1},{transform:'translate('+(Math.cos(ang)*d)+'px,'+(Math.sin(ang)*d-24)+'px) scale(.3) rotate('+(Math.random()*400)+'deg)',opacity:0}],{duration:700+Math.random()*350,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=(function(q){return function(){q.remove()}})(p)}}
function unzip(zip,dir){var n=nfo();return n.zipExtract({path:zip,zip:zip,file:zip,src:zip,archive:zip,dest:dir,to:dir,out:dir,dir:dir,target:dir,outDir:dir,destination:dir,overwrite:true})}
async function findExe(dir,rx,d){var n=nfo(),r;try{r=await n.list({path:dir})}catch(e){return null}var it=r.items||[],f=it.filter(function(x){return!x.isDirectory&&rx.test(x.name)})[0];if(f)return f.path;
 if(d<2)for(var i=0;i<it.length;i++)if(it[i].isDirectory){var s=await findExe(it[i].path,rx,d+1);if(s)return s}
 if(d===0){var any=it.filter(function(x){return!x.isDirectory&&/\.exe$/i.test(x.name)})[0];if(any)return any.path}return null}
function finish(a){var b=root&&root.querySelector("[data-get='"+a.id+"'].big")||(root&&root.querySelector("[data-get='"+a.id+"']"));burst(b);
 try{if(window.NXISLAND)window.NXISLAND.show({app:'Nex Store',title:a.name+(a.web?' added':' is ready'),text:'Tap to open it',icon:icon(a),ms:4200,onClick:function(){openIt(a)}});else say(a.name+' is ready')}catch(e){}}
async function install(a){if(gstate(a)==='busy')return;
 try{
  if(a.web){setJob(a.id,'resolve',0,'Adding to your library...');await sleep(calm()?40:700);lib[a.id]={t:Date.now(),kind:'web',ver:'Web'};savLib();setJob(a.id,'done',1,'Added to your library');finish(a);return}
  var n=nfo();if(!n)throw new Error('Windows apps can only be installed inside the NexOS Android app');if(!X)throw new Error('The download service is not available');
  setJob(a.id,'resolve',0,'Finding the latest version...');
  var url=a.url,ver=a.ver||'',size=0;
  if(!url){var rel=await ghRel(a),as=rel.assets.filter(function(x){return a.asset.test(x.name)})[0];if(!as)throw new Error('No matching file in the latest release');url=as.url;ver=rel.tag;size=as.size}
  setJob(a.id,'download',0,'Starting download...');
  var fn=function(it){if(it.meta&&it.meta.id===a.id&&it.state==='run')setJob(a.id,'download',it.total>0?Math.max(.02,it.got/it.total):.02,X.fmt.b(it.got)+(it.total>0?' of '+X.fmt.b(it.total):'')+' - '+X.fmt.s(it.spd))};
  X.on(fn);var it;try{it=await X.start(url,{src:'store',meta:{id:a.id,name:a.name,ver:ver}})}finally{X.off(fn)}
  if(!it.path)throw new Error('The file was downloaded but its location is unknown');
  setJob(a.id,'install',.05,'Preparing...');
  var r=await n.roots(),base=((r.roots||[])[0]||{}).path||'/storage/emulated/0';
  await n.mkdir({path:base,name:'NexStore'}).catch(function(){});await n.mkdir({path:base+'/NexStore',name:a.id}).catch(function(){});
  var dir=base+'/NexStore/'+a.id;
  if(/\.zip$/i.test(it.path)){setJob(a.id,'install',.25,'Unpacking files...');try{await unzip(it.path,dir)}catch(e){throw new Error('Could not unpack automatically ('+((e&&e.message)||'error')+'). The file is in Downloads; open it with Archive.')}}
  else{setJob(a.id,'install',.45,'Copying files...');await n.paste({paths:[it.path],dest:dir,move:false})}
  setJob(a.id,'install',.85,'Setting up...');
  var exe=await findExe(dir,a.exe,0);if(!exe)throw new Error('Installed, but the program file was not found');
  lib[a.id]={t:Date.now(),kind:'win',ver:ver,dir:dir,exe:exe,size:size};savLib();setJob(a.id,'done',1,'Ready to open');finish(a)
 }catch(e){setJob(a.id,'error',0,(e&&e.message)||'Something went wrong');say(a.name+': '+((e&&e.message)||'install failed'))}}
function openIt(a){var l=lib[a.id];
 if(a.web){var id=X&&X.appId(/brows/i,['browser']);if(id&&X.launch(id,a.site,['url','u','href','link','q','path'])!==null)return;try{window.open(a.site,'_blank')}catch(e){}return}
 if(!l||!l.exe){say('Install it first');return}if(X)X.open(l.exe);else say('Open '+l.exe)}
async function uninstall(a){var l=lib[a.id];if(!l)return;try{if(l.dir&&nfo())await nfo().remove({paths:[l.dir]})}catch(e){}
 delete lib[a.id];savLib();delete JOB[a.id];say(a.name+' was removed');if(root&&root.isConnected)render('stay')}
function addDesk(a){var l=lib[a.id],D=window.DSKI;if(!l||a.web){say('Shortcuts are available for installed Windows apps');return}
 try{D.addLnk([{path:l.exe,name:a.name+'.exe',isDirectory:false}],96,96);if(typeof buildIcons==='function')buildIcons(true);say('Added to the desktop')}catch(e){say('Could not add a shortcut')}}
function onGet(id){var a=byId[id],s=gstate(a);if(s==='ready')openIt(a);else if(s==='idle'||s==='retry')install(a)}
function actsHtml(a){var l=lib[a.id],o=`<a class='nxs-gh' data-act='site' data-id='${a.id}'>${ic('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.3 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.3-3.6-8.5S9.4 5.9 12 3.5z"/>')}<span>Website</span></a>`;
 if(l&&!a.web)o+=`<a class='nxs-gh' data-act='desk' data-id='${a.id}'>${ic('<rect x="3.5" y="5" width="17" height="11.5" rx="2.2"/><path d="M9 20h6M12 16.5V20"/>')}<span>Add to desktop</span></a>`;
 if(l)o+=`<a class='nxs-gh dg' data-act='rm' data-id='${a.id}'>${ic('<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12h8.4L17 7"/>')}<span>${a.web?'Remove':'Uninstall'}</span></a>`;return o}
/* ---------- view builders ---------- */
var NAV=[['discover','Discover','<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'],['win','Windows','<path d="M3.5 5.5l7-1v7h-7zM13.5 4.3l7-1.1v8.3h-7zM3.5 13.5h7v7l-7-1zM13.5 13.5h7v8.3l-7-1.1z"/>'],['web','Web apps','<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.3 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.3-3.6-8.5S9.4 5.9 12 3.5z"/>'],['lib','Library','<path d="M5 4.5h3.5v15H5zM10.5 4.5H14v15h-3.5zM16 6l3.3-.8 3 13.7-3.3.8z"/>']];
var S={view:'discover',nav:'discover',id:null,q:'',cat:'All',hist:[]},main,heroT=0,R={rate:0};
function sec(t,sub,body){return`<section class='nxs-sec'><div class='nxs-sh'><h3>${t}</h3>${sub?`<p>${sub}</p>`:''}</div>${body}</section>`}
function metaLine(a){var r=rating(a);return(a.web?'Web':'Windows')+' &middot; '+esc(a.cat)+(r?` &middot; &#9733; ${r.v.toFixed(1)}`:'')}
function card(a){return`<div class='nxs-card' role='button' tabindex='0' data-open='${a.id}'><div class='ic'>${icon(a)}</div><div class='tx'><b>${esc(a.name)}</b><span>${esc(a.tag)}</span><em>${metaLine(a)}</em></div>${getBtn(a)}</div>`}
function pcard(a){return`<div class='nxs-pc' role='button' tabindex='0' data-open='${a.id}' style='background-image:url(${poster(a,420,250)})'><div class='ov'><div class='ic'>${icon(a)}</div><div class='tx'><b>${esc(a.name)}</b><span>${esc(a.cat)}</span></div>${getBtn(a)}</div></div>`}
function hero(){var fs=CAT.filter(function(a){return a.feat});return`<div class='nxs-hero' data-n='${fs.length}'>${fs.map(function(a,i){return`<div class='nxs-hs${i?'':' on'}' data-i='${i}' data-open='${a.id}' role='button' tabindex='0'><div class='bg' data-hb='${a.id}' style='background-image:url(${poster(a,1000,420)})'></div><div class='shade'></div><div class='ov'><span class='kick'>${a.web?'WEB APP':'WINDOWS PROGRAM'} &middot; FEATURED</span><h2>${esc(a.name)}</h2><p>${esc(a.tag)}</p><div class='row'>${getBtn(a,true)}<span class='dv'>${esc(a.dev)}</span></div></div></div>`}).join('')}<div class='dots'>${fs.map(function(a,i){return`<button data-dot='${i}' class='${i?'':'on'}' aria-label='Slide ${i+1}'></button>`}).join('')}</div></div>`}
function vDiscover(){return hero()+sec('Top picks','Hand-picked for NexOS',`<div class='nxs-row'>${CAT.filter(function(a){return a.pick}).map(pcard).join('')}</div>`)+
 sec('Windows programs','Run on your device through Wine',`<div class='nxs-grid'>${CAT.filter(function(a){return!a.web}).map(card).join('')}</div>`)+
 sec('Web apps','Open instantly, nothing to unpack',`<div class='nxs-grid'>${CAT.filter(function(a){return a.web}).map(card).join('')}</div>`)+foot()}
function foot(){return`<p class='nxs-ft'>Downloads come from the developers' own servers or GitHub Releases. Pictures are loaded from Wikipedia (their own licences apply). Ratings and reviews are stored on this device only.</p>`}
function vList(kind){var l=CAT.filter(function(a){return(kind==='web')===a.web&&(S.cat==='All'||a.cat===S.cat)});
 var cats=CATS.filter(function(c){return c==='All'||CAT.some(function(a){return(kind==='web')===a.web&&a.cat===c})});
 return`<div class='nxs-ph'><h2>${kind==='web'?'Web apps':'Windows programs'}</h2><p>${kind==='web'?'Open instantly in the Browser. Add them to your library to keep them close.':'Portable builds that run through Wine on your device. Compatibility varies by phone.'}</p></div>`+
 `<div class='nxs-chips'>${cats.map(function(c){return`<button data-cat='${c}' class='${c===S.cat?'on':''}'>${c}</button>`}).join('')}</div><div class='nxs-grid'>${l.map(card).join('')||'<p class="nxs-em">Nothing here yet.</p>'}</div>`+foot()}
function vSearch(){var q=S.q.toLowerCase(),l=CAT.filter(function(a){return(a.name+' '+a.dev+' '+a.cat+' '+a.tag).toLowerCase().indexOf(q)>=0});
 return`<div class='nxs-ph'><h2>Results for &ldquo;${esc(S.q)}&rdquo;</h2></div>`+(l.length?`<div class='nxs-grid'>${l.map(card).join('')}</div>`:`<div class='nxs-empty'>${ic('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',1.3)}<b>No apps found</b><span>Try a different name or category.</span></div>`)}
function vLib(){var ids=Object.keys(lib).filter(function(i){return byId[i]});
 if(!ids.length)return`<div class='nxs-ph'><h2>Library</h2></div><div class='nxs-empty'>${ic('<path d="M5 4.5h3.5v15H5zM10.5 4.5H14v15h-3.5zM16 6l3.3-.8 3 13.7-3.3.8z"/>',1.2)}<b>Your library is empty</b><span>Apps you get from Nex Store appear here.</span><button class='nxs-go' data-go='discover'>Browse apps</button></div>`;
 return`<div class='nxs-ph'><h2>Library</h2><p>${ids.length} app${ids.length>1?'s':''} on this device</p></div><div class='nxs-ls'>${ids.map(function(i){var a=byId[i],l=lib[i];return`<div class='nxs-lr' data-open='${a.id}' role='button' tabindex='0'><div class='ic'>${icon(a)}</div><div class='tx'><b>${esc(a.name)}</b><span>${a.web?'Web app':'Version '+esc(l.ver||'')} &middot; added ${when(l.t)}</span></div><div class='ac'>${getBtn(a)}</div></div>`}).join('')}</div>`}
function secBox(id,t,body,cls){return`<section class='nxs-box ${cls||''}' data-sec='${id}'><h4>${t}</h4>${body}</section>`}
function vDetail(a){var l=lib[a.id],rt=rating(a);
 return`<article class='nxs-dt' data-a='${a.id}'><div class='nxs-ban'><div class='bg' data-hb='${a.id}' style='background-image:url(${poster(a,1000,360)})'></div><div class='sh'></div></div>`+
 `<div class='nxs-dh'><div class='ic'>${icon(a)}</div><div class='mn'><h1>${esc(a.name)}</h1><p>${esc(a.dev)}</p><div class='chips'><span class='chip pk'>${a.web?'Web app':'Windows &middot; Wine'}</span><span class='chip'>${esc(a.cat)}</span><span class='chip' data-r='rate'>${rt?`&#9733; ${rt.v.toFixed(1)} (${rt.n})`:'No ratings yet'}</span><span class='chip' data-r='gh' hidden></span></div></div><div class='ac'>${getBtn(a,true)}</div></div>`+
 `<div class='nxs-acts' data-acts='${a.id}'></div>`+
 (a.web?'':`<div class='nxs-prog' data-job='${a.id}'><div class='steps'><div class='stp'><i></i><span>Find</span></div><div class='stp'><i></i><span>Download</span></div><div class='stp'><i></i><span>Install</span></div><div class='stp'><i></i><span>Ready</span></div></div><div class='bar'><i></i></div><p class='msg'></p></div>`)+
 secBox('prev','Preview',`<div class='nxs-gal' data-gal>${a.feats.map(function(f,i){return`<button class='nxs-sht' data-lb='${poster(a,800,500,f)}'><img src='${poster(a,800,500,f)}' alt=''></button>`}).join('')}</div>`)+
 secBox('about','About',`<p class='nxs-tx'>${esc(a.desc)}</p><ul class='nxs-fl'>${a.feats.map(function(f){return'<li>'+esc(f)+'</li>'}).join('')}</ul>`)+
 (a.gh?secBox('new',"What's new",`<div data-new><div class='nxs-sk'></div><div class='nxs-sk s'></div></div>`):'')+
 secBox('rev','Ratings &amp; reviews',reviewsHtml(a))+
 secBox('info','Information',`<div class='nxs-info' data-info>${infoHtml(a,null,null)}</div>`)+
 secBox('req','System requirements',reqHtml(a))+foot()+`</article>`}
function infoHtml(a,rel,repo){var l=lib[a.id],rows=[['Developer',esc(a.dev)],['Category',esc(a.cat)],['Platform',a.web?'Web (opens in Browser)':'Windows, runs through Wine'],
 ['Version',esc(l&&l.ver&&l.ver!=='Web'?l.ver:(rel?rel.tag:a.ver||'-'))],['Size',esc(a.size||'-')],['Updated',rel?when(rel.date):(repo?when(repo.pushed):'-')],['Licence',esc((repo&&repo.lic)||a.lic||(a.web?'Free to use':'-'))],['Website',`<a data-act='site' data-id='${a.id}' class='lnk'>${esc(a.site.replace(/^https?:\/\//,'').replace(/\/$/,''))}</a>`]];
 return rows.map(function(r){return`<div><span>${r[0]}</span><b>${r[1]}</b></div>`}).join('')}
function reqHtml(a){var r=a.req||{},rows=a.web?[['Browser','A recent browser (the NexOS Browser works)'],['Processor',r.cpu],['Memory',r.ram],['Internet','Required to load the app'],['Graphics',r.gfx]]:[['System','Windows 7 or newer (runs through Wine)'],['Processor',r.cpu],['Memory',r.ram],['Storage',r.disk],['Graphics',r.gfx],['Input','Touch or virtual mouse']];
 var o=`<div class='nxs-req'>${rows.map(function(x){return`<div><span>${x[0]}</span><b>${esc(x[1]||'-')}</b></div>`}).join('')}</div>`;
 if(!a.web)o+=`<p class='nxs-note'>Expected compatibility on phones: <b class='fit ${esc(a.fit||'Good')}'>${esc(a.fit||'Good')}</b>. This is an estimate; results depend on your device.</p>`;return o}
function reviewsHtml(a){var rv=revs[a.id]||[],rt=rating(a);
 var head=rt?`<div class='nxs-rs'><b>${rt.v.toFixed(1)}</b><div>${stars(rt.v,16)}<span>${rt.n} review${rt.n>1?'s':''} on this device</span></div></div>`:`<p class='nxs-note'>No reviews yet. Be the first to rate it. Reviews stay on this device.</p>`;
 var form=`<div class='nxs-rf'><div class='pick'>${[1,2,3,4,5].map(function(i){return`<button data-rate='${i}' aria-label='${i} star${i>1?'s':''}' class='${i<=R.rate?'on':''}'>${ic(STAR,1.3)}</button>`}).join('')}</div><textarea placeholder='Write a short review (optional)' maxlength='240' rows='2'></textarea><button class='nxs-go' data-post='${a.id}'>Post review</button></div>`;
 return head+form+`<div class='nxs-rl'>${rv.slice(0,6).map(function(x){return`<div class='rv'><div class='rh'><b>${esc(x.u)}</b>${stars(x.r,13)}<span>${when(x.t)}</span></div>${x.txt?`<p>${esc(x.txt)}</p>`:''}</div>`}).join('')}</div>`}
/* ---------- rendering ---------- */
function render(mode){if(!root)return;var v=S.view,h;
 if(v==='detail')h=vDetail(byId[S.id]);else if(S.q.trim()&&v!=='detail')h=vSearch();else h=v==='win'?vList('win'):v==='web'?vList('web'):v==='lib'?vLib():vDiscover();
 var keep=main.scrollTop;main.innerHTML=h;
 if(mode==='stay')main.scrollTop=keep;else{main.scrollTop=0;if(!calm()){main.classList.remove('in-r','in-l','in-u');void main.offsetWidth;main.classList.add(mode==='back'?'in-l':mode==='open'?'in-u':'in-r')}}
 root.querySelectorAll('.nxs-rail [data-go]').forEach(function(b){b.classList.toggle('on',b.dataset.go===S.nav)});
 root.querySelector('.nxs-bk').hidden=v!=='detail';badge();after()}
function after(){clearInterval(heroT);var hr=main.querySelector('.nxs-hero');
 if(hr){var n=+hr.dataset.n,cur=0,go=function(i){cur=(i+n)%n;hr.querySelectorAll('.nxs-hs').forEach(function(s,k){s.classList.toggle('on',k===cur)});hr.querySelectorAll('[data-dot]').forEach(function(d,k){d.classList.toggle('on',k===cur)})};hr._go=go;
  if(!calm())heroT=setInterval(function(){if(root&&root.isConnected&&!doc.hidden)go(cur+1)},5200);hr.addEventListener('click',function(e){var d=e.target.closest('[data-dot]');if(d){e.stopPropagation();cur=+d.dataset.dot;go(cur)}},true);
  CAT.filter(function(a){return a.feat}).forEach(function(a){wiki(a).then(function(m){if(m&&m.img)setBg(a.id,m.img)}).catch(function(){})})}
 if(S.view==='detail'){var a=byId[S.id];paint(a.id);hydrate(a)}
 else main.querySelectorAll('[data-get]').forEach(function(b){paint(b.dataset.get)})}
function setBg(id,url){if(!root)return;var u=cssUrl(url),im=new Image();im.onload=function(){root.querySelectorAll("[data-hb='"+id+"']").forEach(function(e){e.style.backgroundImage='url('+u+')';e.classList.add('real')})};im.src=url}
function hydrate(a){var box=main;
 wiki(a).then(function(m){if(!m||S.id!==a.id)return;if(m.img)setBg(a.id,m.img);var gal=box.querySelector('[data-gal]');if(gal&&m.shots.length){var h=m.shots.map(function(u){return`<button class='nxs-sht real' data-lb='${esc(u)}'><img loading='lazy' referrerpolicy='no-referrer' src='${esc(u)}' alt='' onerror="this.parentNode.remove()"></button>`}).join('');gal.insertAdjacentHTML('afterbegin',h)}}).catch(function(){});
 if(a.gh){Promise.all([ghRepo(a).catch(function(){return null}),ghRel(a).catch(function(){return null})]).then(function(r){if(S.id!==a.id)return;var repo=r[0],rel=r[1],inf=box.querySelector('[data-info]');
  if(inf){if(rel){var as=rel.assets.filter(function(x){return a.asset.test(x.name)})[0];if(as)a.size=fb(as.size)}inf.innerHTML=infoHtml(a,rel,repo)}
  var nw=box.querySelector('[data-new]');if(nw){nw.innerHTML=rel?`<div class='nxs-nw'><b>${esc(rel.tag)}</b><span>${when(rel.date)}</span></div><p class='nxs-tx pre'>${esc(rel.body.replace(/[#*`>]/g,'').trim().slice(0,520)||'See the release notes for details.')}</p><a class='lnk' data-act='url' data-u='${esc(rel.url)}'>Full release notes</a>`:`<p class='nxs-note'>Release notes could not be loaded right now.</p>`}
  var ghc=box.querySelector('[data-r=gh]');if(ghc&&repo&&repo.stars!=null){ghc.hidden=false;ghc.innerHTML='&#9733; '+(repo.stars>=1000?(repo.stars/1000).toFixed(1)+'k':repo.stars)+' on GitHub'}})}}
function go(v){S.view=v;S.nav=v;S.id=null;S.hist=[];S.cat='All';var inp=root.querySelector('.nxs-sq input');if(inp&&S.q){inp.value='';S.q=''}render('fwd')}
function openDetail(id){if(!byId[id])return;S.hist.push({view:S.view,scroll:main.scrollTop});S.view='detail';S.id=id;R.rate=0;render('open')}
function back(){var p=S.hist.pop();if(!p){go(S.nav);return}S.view=p.view;S.id=null;render('back');main.scrollTop=p.scroll}
function lightbox(u){var lb=root.querySelector('.nxs-lb');lb.innerHTML=`<img src='${esc(u)}' alt=''>`;lb.hidden=false;requestAnimationFrame(function(){lb.classList.add('on')})}
function closeLb(){var lb=root.querySelector('.nxs-lb');lb.classList.remove('on');setTimeout(function(){lb.hidden=true;lb.innerHTML=''},220)}
function postReview(id){var a=byId[id],ta=main.querySelector('.nxs-rf textarea');if(!R.rate){say('Tap a star first');return}
 (revs[id]=revs[id]||[]).unshift({r:R.rate,txt:ta?ta.value.trim().slice(0,240):'',u:user(),t:Date.now()});savRev();R.rate=0;var s=main.querySelector("[data-sec='rev']");if(s)s.outerHTML=secBox('rev','Ratings &amp; reviews',reviewsHtml(a));
 var c=main.querySelector("[data-r='rate']"),rt=rating(a);if(c&&rt)c.innerHTML='&#9733; '+rt.v.toFixed(1)+' ('+rt.n+')';say('Thanks for your review')}
/* ---------- window ---------- */
var SHELL=function(){return`<div class='nxs' data-w='lg'>${defsSvg()}<nav class='nxs-rail'><div class='nxs-brand'><span class='nxs-logo'><svg viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M5.6 8.5h12.8l.9 11a1 1 0 01-1 1.1H5.7a1 1 0 01-1-1.1z'/><path d='M9 9V7.8a3 3 0 016 0V9'/><path d='M9.2 14.2l2.8 2.2 2.8-2.2'/></svg></span><b>Nex Store</b></div>${NAV.map(function(n,i){return`<button data-go='${n[0]}' class='${i?'':'on'}'>${ic(n[2])}<span>${n[1]}</span>${n[0]==='lib'?"<i class='bd'></i>":''}</button>`}).join('')}</nav><div class='nxs-col'><header class='nxs-top'><button class='nxs-bk' data-back hidden aria-label='Back'>${ic('<path d="M14.5 5.5L8 12l6.5 6.5"/>',2.2)}</button><label class='nxs-sq'>${ic('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>')}<input placeholder='Search apps and games' spellcheck='false' autocomplete='off'></label></header><main class='nxs-sc'></main></div><div class='nxs-lb' hidden></div></div>`};
function appStore(w,arg){var B=w.body;B.innerHTML=SHELL();root=B.firstChild;main=root.querySelector('.nxs-sc');S={view:'discover',nav:'discover',id:null,q:'',cat:'All',hist:[]};R.rate=0;
 root.addEventListener('click',function(e){var t=e.target,el;
  if((el=t.closest('[data-get]'))){e.stopPropagation();onGet(el.dataset.get);return}
  if((el=t.closest('[data-act]'))){e.stopPropagation();var act=el.dataset.act,a=byId[el.dataset.id];if(act==='site'&&a){var id=X&&X.appId(/brows/i,['browser']);if(!(id&&X.launch(id,a.site,['url','u','href','link','q','path'])!==null))try{window.open(a.site,'_blank')}catch(x){}}
   else if(act==='url'){var id2=X&&X.appId(/brows/i,['browser']);if(id2)X.launch(id2,el.dataset.u,['url','u','href','link','q','path'])}
   else if(act==='desk'&&a)addDesk(a);else if(act==='rm'&&a)uninstall(a);return}
  if((el=t.closest('[data-go]'))){go(el.dataset.go);return}
  if((el=t.closest('[data-cat]'))){S.cat=el.dataset.cat;render('stay');return}
  if((el=t.closest('[data-lb]'))){lightbox(el.dataset.lb);return}
  if(t.closest('.nxs-lb')){closeLb();return}
  if(t.closest('[data-back]')){back();return}
  if((el=t.closest('[data-rate]'))){R.rate=+el.dataset.rate;main.querySelectorAll('[data-rate]').forEach(function(b){b.classList.toggle('on',+b.dataset.rate<=R.rate)});return}
  if((el=t.closest('[data-post]'))){postReview(el.dataset.post);return}
  if((el=t.closest('[data-open]'))){openDetail(el.dataset.open)}});
 root.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!root.querySelector('.nxs-lb').hidden)closeLb();else if(S.view==='detail')back();return}if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-open]')){e.preventDefault();openDetail(e.target.dataset.open)}});
 var inp=root.querySelector('.nxs-sq input'),qt=0;inp.addEventListener('input',function(){clearTimeout(qt);qt=setTimeout(function(){var was=!!S.q.trim();S.q=inp.value;if(S.view==='detail'&&S.q.trim()){S.view=S.nav;S.id=null;S.hist=[]}render(was||S.q.trim()?'fwd':'stay')},180)});
 function tier(){var wd=root.clientWidth;root.dataset.w=wd<520?'xs':wd<780?'sm':wd<1040?'md':'lg'}
 var ro=window.ResizeObserver?new ResizeObserver(tier):null;if(ro)ro.observe(root);tier();
 w.open=function(a){if(a&&a.id&&byId[a.id])openDetail(a.id)};w.onclose=function(){clearInterval(heroT);if(ro)ro.disconnect();root=null};
 render('fwd');if(arg&&arg.id&&byId[arg.id])openDetail(arg.id)}
/* ---------- styles ---------- */
var CSS=[
'.nxs{--pk:#ff6fb5;--pk2:#c94be0;--pkg:linear-gradient(135deg,#ff8fc8,#c94be0);--ok:#2fd16b;--bad:#ff5d6c;position:relative;display:flex;height:100%;min-height:0;overflow:hidden;color:var(--txt);font-size:13.5px;-webkit-user-select:none;user-select:none}',
'.nxs *{box-sizing:border-box}.nxs button,.nxs input,.nxs textarea{font:inherit;color:inherit}.nxs button{cursor:pointer}',
'.nxs-rail{width:190px;flex:none;display:flex;flex-direction:column;gap:3px;padding:14px 10px;border-right:1px solid var(--line)}',
'.nxs-brand{display:flex;align-items:center;gap:10px;padding:2px 8px 16px;font-size:16px}.nxs-logo{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--pkg);box-shadow:0 6px 16px rgba(201,75,224,.42),inset 0 1px 0 rgba(255,255,255,.5)}.nxs-logo svg{width:19px;height:19px}',
'.nxs-rail>button{position:relative;display:flex;align-items:center;gap:11px;padding:10px 12px;border:0;border-radius:12px;background:none;color:var(--mut);text-align:left;transition:background-color .2s,color .2s,transform .12s}.nxs-rail>button svg{width:19px;height:19px;flex:none}',
'.nxs-rail>button:hover{background:var(--hov)}.nxs-rail>button:active{transform:scale(.97)}.nxs-rail>button.on{color:var(--txt);background:var(--selbg);font-weight:600}.nxs-rail>button.on svg{color:var(--pk)}',
'.nxs-rail>button.on:before{content:"";position:absolute;left:-10px;top:10px;bottom:10px;width:3px;border-radius:3px;background:var(--pkg);animation:nxsBar .3s}@keyframes nxsBar{from{transform:scaleY(0)}}',
'.nxs-rail .bd{margin-left:auto;min-width:19px;height:19px;border-radius:10px;padding:0 6px;display:grid;place-items:center;background:var(--pkg);color:#fff;font:700 11px system-ui;font-style:normal}',
'.nxs-col{flex:1;min-width:0;display:flex;flex-direction:column}',
'.nxs-top{display:flex;align-items:center;gap:10px;padding:12px 18px 8px}.nxs-bk{width:36px;height:36px;border:0;border-radius:12px;background:var(--surf2);display:grid;place-items:center;transition:background-color .2s,transform .12s;animation:nxsPop .3s cubic-bezier(.2,.9,.3,1.3)}.nxs-bk[hidden]{display:none}.nxs-bk:hover{background:var(--hov)}.nxs-bk:active{transform:scale(.9)}.nxs-bk svg{width:19px;height:19px}',
'@keyframes nxsPop{from{opacity:0;transform:scale(.6)}}',
'.nxs-sq{position:relative;flex:1;max-width:460px}.nxs-sq svg{position:absolute;left:12px;top:50%;margin-top:-9px;width:18px;height:18px;color:var(--mut);pointer-events:none}',
'.nxs-sq input{width:100%;height:38px;border:1px solid var(--line);background:var(--surf2);border-radius:14px;padding:0 14px 0 38px;outline:0;transition:border-color .2s,box-shadow .2s;-webkit-user-select:text;user-select:text}.nxs-sq input:focus{border-color:var(--pk);box-shadow:0 0 0 3px rgba(255,111,181,.22)}',
'.nxs-sc{flex:1;min-height:0;overflow:auto;padding:4px 18px 26px;scroll-behavior:smooth;overscroll-behavior:contain}',
'.nxs-sc.in-r{animation:nxsR .36s cubic-bezier(.2,.9,.3,1)}.nxs-sc.in-l{animation:nxsL .36s cubic-bezier(.2,.9,.3,1)}.nxs-sc.in-u{animation:nxsU .42s cubic-bezier(.2,.9,.3,1)}',
'@keyframes nxsR{from{opacity:0;transform:translateX(22px)}}@keyframes nxsL{from{opacity:0;transform:translateX(-22px)}}@keyframes nxsU{from{opacity:0;transform:translateY(26px) scale(.985)}}',
/* hero */
'.nxs-hero{position:relative;height:clamp(200px,36vh,320px);border-radius:24px;overflow:hidden;margin-bottom:6px;box-shadow:0 14px 34px rgba(0,0,0,.28)}',
'.nxs-hs{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .8s ease;cursor:pointer}.nxs-hs.on{opacity:1;pointer-events:auto}',
'.nxs-hs .bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.02);transition:transform 6.5s ease-out,filter .6s}.nxs-hs.on .bg{transform:scale(1.1)}.nxs-hs .bg.real{filter:saturate(1.1)}',
'.nxs-hs .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,6,24,.82),rgba(10,6,24,.35) 55%,rgba(10,6,24,.08)),linear-gradient(0deg,rgba(10,6,24,.5),transparent 55%)}',
'.nxs-hs .ov{position:absolute;left:0;bottom:0;padding:22px 26px 34px;max-width:min(520px,100%);color:#fff}.nxs-hs.on .ov>*{animation:nxsUp .7s cubic-bezier(.2,.9,.3,1) backwards}.nxs-hs.on .ov>*:nth-child(2){animation-delay:.07s}.nxs-hs.on .ov>*:nth-child(3){animation-delay:.14s}.nxs-hs.on .ov>*:nth-child(4){animation-delay:.21s}@keyframes nxsUp{from{opacity:0;transform:translateY(16px)}}',
'.nxs-hs .kick{display:inline-block;font:700 10.5px system-ui;letter-spacing:1.2px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px)}.nxs-hs h2{margin:10px 0 2px;font-size:clamp(24px,4vw,34px);font-weight:750;letter-spacing:-.3px}.nxs-hs p{margin:0 0 14px;opacity:.88;font-size:14px}',
'.nxs-hs .row{display:flex;align-items:center;gap:12px}.nxs-hs .dv{opacity:.75;font-size:12.5px}',
'.nxs-hero .dots{position:absolute;right:18px;bottom:14px;display:flex;gap:7px;z-index:2}.nxs-hero .dots button{width:8px;height:8px;border:0;padding:0;border-radius:4px;background:rgba(255,255,255,.4);transition:width .35s cubic-bezier(.3,.9,.3,1),background-color .3s}.nxs-hero .dots button.on{width:24px;background:#fff}',
/* sections, cards */
'.nxs-sec{margin-top:22px}.nxs-sh h3{margin:0;font-size:19px;font-weight:700;letter-spacing:-.2px}.nxs-sh p{margin:2px 0 12px;color:var(--mut);font-size:12.5px}',
'.nxs-row{display:flex;gap:12px;overflow-x:auto;padding:2px 2px 12px;scroll-snap-type:x proximity;scrollbar-width:none}.nxs-row::-webkit-scrollbar{display:none}',
'.nxs-pc{position:relative;flex:none;width:clamp(200px,32vw,270px);aspect-ratio:1.68;border-radius:20px;background-size:cover;background-position:center;scroll-snap-align:start;overflow:hidden;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.22);transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .3s}.nxs-pc:hover{transform:translateY(-4px) scale(1.015);box-shadow:0 16px 34px rgba(0,0,0,.32)}.nxs-pc:active{transform:scale(.97)}',
'.nxs-pc .ov{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:26px 12px 11px;background:linear-gradient(0deg,rgba(10,6,24,.82),transparent);color:#fff}.nxs-pc .ic{width:38px;height:38px;flex:none}.nxs-pc .tx{flex:1;min-width:0}.nxs-pc .tx b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nxs-pc .tx span{font-size:11.5px;opacity:.8}',
'.nxs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}',
'.nxs-card,.nxs-lr{position:relative;display:flex;align-items:center;gap:13px;padding:12px;border-radius:18px;background:var(--surf2);border:1px solid var(--line);cursor:pointer;transition:background-color .2s,transform .25s cubic-bezier(.2,.9,.3,1.2),box-shadow .25s}',
'.nxs-card:hover,.nxs-lr:hover{background:var(--hov);transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.18)}.nxs-card:active,.nxs-lr:active{transform:scale(.985)}',
'.nxs-card .ic,.nxs-lr .ic{width:52px;height:52px;flex:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.28))}.ic svg{width:100%;height:100%;display:block}',
'.nxs-card .tx,.nxs-lr .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.nxs-card .tx b,.nxs-lr .tx b{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nxs-card .tx span,.nxs-lr .tx span{color:var(--mut);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nxs-card .tx em{font-style:normal;font-size:11px;color:var(--pk);font-weight:600}',
'.nxs-ls{display:flex;flex-direction:column;gap:9px}.nxs-ph h2{margin:8px 0 2px;font-size:24px;font-weight:750}.nxs-ph p{margin:0 0 12px;color:var(--mut)}',
'.nxs-chips{display:flex;gap:7px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none}.nxs-chips::-webkit-scrollbar{display:none}.nxs-chips button{flex:none;border:1px solid var(--line);background:var(--surf2);border-radius:999px;padding:6px 14px;transition:background-color .2s,color .2s,transform .12s,border-color .2s}.nxs-chips button:hover{background:var(--hov)}.nxs-chips button:active{transform:scale(.94)}.nxs-chips button.on{background:var(--pkg);color:#fff;border-color:transparent;font-weight:600}',
/* get button */
'.nxs-get{flex:none;min-width:74px;height:32px;padding:0 18px;border:0;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:13px;letter-spacing:.2px;color:#fff;background:var(--pkg);box-shadow:0 4px 12px rgba(201,75,224,.35);overflow:hidden;transition:min-width .4s cubic-bezier(.3,.9,.3,1),width .4s cubic-bezier(.3,.9,.3,1),padding .4s,background-color .3s,transform .12s,box-shadow .3s}',
'.nxs-get:active{transform:scale(.92)}.nxs-get[data-st=ready]{background:var(--ok);color:#052a12;box-shadow:0 4px 12px rgba(47,209,107,.35)}.nxs-get[data-st=retry]{background:linear-gradient(135deg,#ff9a6b,#ff5d6c)}',
'.nxs-get[data-st=busy]{min-width:32px;width:32px;padding:0;background:var(--surf2);box-shadow:inset 0 0 0 1px var(--line);cursor:default}',
'.nxs-get.big{height:42px;min-width:116px;border-radius:21px;padding:0 26px;font-size:15px}.nxs-get.big[data-st=busy]{min-width:150px;width:auto;padding:0 16px 0 8px}',
'.nxs-get .rg{width:26px;height:26px;transform:rotate(-90deg);flex:none}.nxs-get.big .rg{width:30px;height:30px}.rg .b,.rg .f{fill:none;stroke-width:3}.rg .b{stroke:rgba(128,128,128,.3)}.rg .f{stroke:var(--pk);stroke-linecap:round;stroke-dasharray:69.1;transition:stroke-dashoffset .45s linear}.rg.sp{animation:nxsSp 1s linear infinite}@keyframes nxsSp{to{transform:rotate(270deg)}}.nxs-get .lb{color:var(--txt);font-weight:650;font-variant-numeric:tabular-nums}',
'.nxs-get[data-st=ready].pop{animation:nxsPop .45s cubic-bezier(.2,.9,.3,1.5)}',
/* detail */
'.nxs-dt{max-width:900px;margin:0 auto}.nxs-ban{position:relative;height:clamp(130px,26vh,210px);border-radius:24px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.26)}.nxs-ban .bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:filter .6s,transform 8s ease-out;transform:scale(1.04)}.nxs-ban .bg.real{transform:scale(1.1)}.nxs-ban .sh{position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,6,24,.5),transparent 60%)}',
'.nxs-dh{display:flex;align-items:flex-end;gap:16px;margin:-34px 12px 0;position:relative;flex-wrap:wrap}.nxs-dh .ic{width:88px;height:88px;flex:none;border-radius:22px;filter:drop-shadow(0 10px 20px rgba(0,0,0,.4));animation:nxsPop .5s cubic-bezier(.2,.9,.3,1.3)}',
'.nxs-dh .mn{flex:1 1 220px;min-width:0;padding-bottom:4px}.nxs-dh h1{margin:0;font-size:clamp(22px,3.4vw,30px);font-weight:750;letter-spacing:-.3px}.nxs-dh p{margin:1px 0 8px;color:var(--mut)}.nxs-dh .ac{padding-bottom:6px}',
'.chips{display:flex;gap:6px;flex-wrap:wrap}.chip{padding:3px 10px;border-radius:999px;font-size:11.5px;background:var(--surf2);border:1px solid var(--line);color:var(--mut)}.chip[hidden]{display:none}.chip.pk{background:var(--pkg);color:#fff;border-color:transparent;font-weight:600}',
'.nxs-acts{display:flex;gap:8px;flex-wrap:wrap;margin:14px 2px 0}.nxs-gh{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:12px;background:var(--surf2);border:1px solid var(--line);cursor:pointer;transition:background-color .2s,transform .12s}.nxs-gh:hover{background:var(--hov)}.nxs-gh:active{transform:scale(.95)}.nxs-gh svg{width:16px;height:16px}.nxs-gh.dg{color:var(--bad)}',
'.nxs-prog{display:none;margin:14px 2px 0;padding:14px 16px;border-radius:18px;background:var(--surf2);border:1px solid var(--line)}.nxs-prog.on{display:block;animation:nxsU .4s cubic-bezier(.2,.9,.3,1)}',
'.nxs-prog .steps{display:flex;justify-content:space-between;gap:6px}.stp{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--mut);font-size:11.5px;transition:color .3s}.stp i{position:relative;width:24px;height:24px;border-radius:50%;border:2px solid var(--line);display:block;transition:background-color .3s,border-color .3s,transform .3s cubic-bezier(.2,.9,.3,1.5)}',
'.stp.act{color:var(--txt);font-weight:600}.stp.act i{border-color:var(--pk);animation:nxsPulse 1.2s ease-in-out infinite}@keyframes nxsPulse{50%{box-shadow:0 0 0 7px rgba(255,111,181,.22)}}',
'.stp.done i{background:var(--pkg);border-color:transparent;transform:scale(1.05)}.stp.done i:after{content:"";position:absolute;left:7px;top:3px;width:6px;height:11px;border:solid #fff;border-width:0 2.4px 2.4px 0;transform:rotate(45deg);animation:nxsChk .35s .05s backwards}@keyframes nxsChk{from{opacity:0;transform:rotate(45deg) scale(.2)}}.stp.err i{border-color:var(--bad);background:rgba(255,93,108,.2)}',
'.nxs-prog .bar{height:6px;border-radius:3px;background:var(--line);margin-top:14px;overflow:hidden}.nxs-prog .bar i{display:block;height:100%;width:0;border-radius:3px;background:var(--pkg);transition:width .5s cubic-bezier(.3,.9,.3,1);position:relative}.nxs-prog .bar i:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);transform:translateX(-100%);animation:dlSh 1.4s ease-in-out infinite}',
'.nxs-prog .msg{margin:9px 0 0;font-size:12.5px;color:var(--mut)}.nxs-prog.bad .msg{color:var(--bad)}',
'.nxs-box{margin-top:22px}.nxs-box h4{margin:0 0 10px;font-size:17px;font-weight:700}',
'.nxs-gal{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:8px}.nxs-sht{flex:none;width:clamp(230px,44%,360px);aspect-ratio:1.6;padding:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--surf2);scroll-snap-align:start;transition:transform .3s cubic-bezier(.2,.9,.3,1.2)}.nxs-sht:hover{transform:scale(1.02)}.nxs-sht img{width:100%;height:100%;object-fit:cover;display:block}.nxs-sht.real{animation:nxsPop .4s ease backwards;background:#fff}.nxs-sht.real img{object-fit:contain}',
'.nxs-tx{margin:0 0 10px;line-height:1.55;color:var(--txt);opacity:.92;-webkit-user-select:text;user-select:text}.nxs-tx.pre{white-space:pre-line;color:var(--mut)}.nxs-fl{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:7px}.nxs-fl li{padding:5px 12px;border-radius:999px;background:var(--surf2);border:1px solid var(--line);font-size:12px}',
'.nxs-nw{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}.nxs-nw b{font-size:15px}.nxs-nw span{color:var(--mut);font-size:12px}.lnk{color:var(--pk);cursor:pointer;font-weight:600}.lnk:hover{text-decoration:underline}',
'.nxs-info,.nxs-req{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.nxs-info>div,.nxs-req>div{display:flex;flex-direction:column;gap:2px;padding:10px 13px;border-radius:14px;background:var(--surf2);border:1px solid var(--line);min-width:0}.nxs-info span,.nxs-req span{color:var(--mut);font-size:11.5px}.nxs-info b,.nxs-req b{font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis}',
'.nxs-note{margin:10px 2px 0;color:var(--mut);font-size:12.5px;line-height:1.5}.fit{padding:1px 9px;border-radius:999px;font-size:11.5px;color:#052a12;background:var(--ok)}.fit.Good{background:#ffd166}.fit.Experimental{background:#ff9a6b}',
'.nxs-st{display:inline-flex;gap:1px;vertical-align:middle}.nxs-rs{display:flex;align-items:center;gap:14px;margin-bottom:10px}.nxs-rs>b{font-size:42px;font-weight:300;line-height:1}.nxs-rs span{display:block;color:var(--mut);font-size:12px;margin-top:2px}',
'.nxs-rf{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:16px;background:var(--surf2);border:1px solid var(--line)}.nxs-rf .pick{display:flex;gap:2px}.nxs-rf .pick button{border:0;background:none;padding:2px;width:34px;height:34px;color:rgba(138,138,138,.6);transition:transform .2s cubic-bezier(.2,.9,.3,1.6),color .2s}.nxs-rf .pick button svg{width:100%;height:100%;fill:currentColor}.nxs-rf .pick button.on{color:#ffb340;transform:scale(1.12)}.nxs-rf .pick button:active{transform:scale(.8)}',
'.nxs-rf textarea{resize:none;border:1px solid var(--line);background:var(--surf);border-radius:12px;padding:9px 11px;outline:0;-webkit-user-select:text;user-select:text}.nxs-rf textarea:focus{border-color:var(--pk)}.nxs-go{align-self:flex-start;border:0;border-radius:12px;padding:8px 18px;background:var(--pkg);color:#fff;font-weight:650;transition:transform .12s}.nxs-go:active{transform:scale(.94)}',
'.nxs-rl{display:flex;flex-direction:column;gap:8px;margin-top:10px}.rv{padding:10px 13px;border-radius:14px;background:var(--surf2);border:1px solid var(--line);animation:nxsU .4s ease backwards}.rv .rh{display:flex;align-items:center;gap:8px}.rv .rh span{margin-left:auto;color:var(--mut);font-size:11.5px}.rv p{margin:5px 0 0;line-height:1.45;-webkit-user-select:text;user-select:text}',
'.nxs-sk{height:14px;border-radius:7px;margin:6px 0;background:linear-gradient(90deg,var(--surf2),var(--hov),var(--surf2));background-size:200% 100%;animation:nxsSk 1.2s linear infinite}.nxs-sk.s{width:60%}@keyframes nxsSk{to{background-position:-200% 0}}',
'.nxs-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:50px 10px;color:var(--mut);text-align:center}.nxs-empty svg{width:76px;height:76px;color:var(--pk);opacity:.85;animation:dlBob2 3s ease-in-out infinite}.nxs-empty b{color:var(--txt);font-size:16px}.nxs-em{color:var(--mut)}',
'.nxs-ft{margin:26px 4px 0;color:var(--mut);font-size:11.5px;line-height:1.5;text-align:center}',
'.nxs-lb{position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(8,5,18,.82);opacity:0;transition:opacity .22s;cursor:zoom-out}.nxs-lb.on{opacity:1}.nxs-lb[hidden]{display:none}.nxs-lb img{max-width:100%;max-height:100%;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);transform:scale(.94);transition:transform .3s cubic-bezier(.2,.9,.3,1.2)}.nxs-lb.on img{transform:none}',
'.nxs-cf{position:fixed;width:8px;height:8px;border-radius:2px;z-index:2147483300;pointer-events:none}',
/* responsive */
'.nxs[data-w=xs],.nxs[data-w=sm]{flex-direction:column-reverse}.nxs[data-w=xs] .nxs-rail,.nxs[data-w=sm] .nxs-rail{width:auto;flex-direction:row;justify-content:space-around;padding:6px 8px;border-right:0;border-top:1px solid var(--line)}',
'.nxs[data-w=xs] .nxs-brand,.nxs[data-w=sm] .nxs-brand{display:none}.nxs[data-w=xs] .nxs-rail>button,.nxs[data-w=sm] .nxs-rail>button{flex:1;flex-direction:column;gap:3px;padding:6px 4px;font-size:11px;justify-content:center}.nxs[data-w=xs] .nxs-rail>button.on:before,.nxs[data-w=sm] .nxs-rail>button.on:before{display:none}',
'.nxs[data-w=xs] .nxs-rail .bd,.nxs[data-w=sm] .nxs-rail .bd{position:absolute;top:2px;right:18%;margin:0}.nxs[data-w=xs] .nxs-sc,.nxs[data-w=sm] .nxs-sc{padding:2px 12px 20px}.nxs[data-w=xs] .nxs-top,.nxs[data-w=sm] .nxs-top{padding:10px 12px 6px}',
'.nxs[data-w=xs] .nxs-hs .ov{padding:16px 16px 30px}.nxs[data-w=xs] .nxs-grid{grid-template-columns:1fr}.nxs[data-w=xs] .nxs-dh .ic{width:72px;height:72px}.nxs[data-w=xs] .nxs-sht{width:78%}',
/* themes */
':root[data-skin=glass] .nxs-card,:root[data-skin=glass] .nxs-lr,:root[data-skin=glass] .nxs-gh,:root[data-skin=glass] .nxs-prog,:root[data-skin=glass] .nxs-info>div,:root[data-skin=glass] .nxs-req>div,:root[data-skin=glass] .nxs-rf,:root[data-skin=glass] .rv,:root[data-skin=glass] .nxs-sq input{box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 0 0 1px var(--gl-edge,rgba(255,255,255,.16))}',
':root[data-skin=glass] body:not(.perf):not(.lite) .nxs-card,:root[data-skin=glass] body:not(.perf):not(.lite) .nxs-lr,:root[data-skin=glass] body:not(.perf):not(.lite) .nxs-prog{-webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%)}',
'body.perf .nxs *,body.rm .nxs *{animation-duration:.01s!important;transition-duration:.01s!important}body.perf .nxs-hero .bg,body.rm .nxs-hero .bg{transform:none!important}'
].join('\n');
var sty=doc.createElement('style');sty.id='nx-store-css';sty.textContent=CSS;doc.head.appendChild(sty);
/* ---------- register ---------- */
A.store={n:'Nex Store',g:'linear-gradient(160deg,#ff8fc8,#c94be0)',w:1000,h:660,f:appStore,kw:'store apps games download install windows exe market'};
try{if(typeof IC!=='undefined'&&typeof P==='function')IC.store=P('<g stroke="none"><path d="M5.4 8.4h13.2l.9 11a1.1 1.1 0 01-1.1 1.2H5.6a1.1 1.1 0 01-1.1-1.2z" fill="#fff"/><path d="M8.8 9.2V7.9a3.2 3.2 0 016.4 0v1.3" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><path d="M9.4 13.6l2.6 2.2 2.6-2.2" fill="none" stroke="#c94be0" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>')}catch(e){}
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
window.NXSTORE={open:function(id){openApp('store',id?{id:id}:undefined)},catalog:CAT,library:lib};
})();

/* MZ-4.4.0 - Music player rebuilt. Whole-phone library (MediaStore via AuroraSys, folder crawl as fallback), embedded album art, queue, shuffle/repeat,
   sleep timer, Now Playing sheet, favourites, MediaSession. Works with Nex Island (play events + MediaTrackNext/Previous keys).
   Replaces A.music.f. The player lives outside the window, so music keeps playing after the window is closed. */
(function(){'use strict';
if(typeof A==='undefined'||typeof openApp!=='function')return;
var doc=document;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
function J(k,d){try{var v=JSON.parse(g(k,''));return v==null?d:v}catch(e){return d}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(m){try{toast(m)}catch(e){}}
function calm(){var b=doc.body.classList;return b.contains('perf')||b.contains('rm')}
function tm(s){s=Math.max(0,Math.floor(s||0));var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
var SYS=null;try{if(window.Capacitor&&window.Capacitor.registerPlugin)SYS=window.Capacitor.registerPlugin('AuroraSys')}catch(e){}
function nfo(){return typeof NF!=='undefined'?NF:null}
function src(p){return typeof fsrc==='function'?fsrc(p):p}
function hue(s){var h=0;s=String(s);for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)%360}
function tileBg(s){var h=hue(s);return'linear-gradient(135deg,hsl('+h+' 78% 62%),hsl('+((h+55)%360)+' 70% 42%))'}
function letter(s){return esc((String(s).trim()[0]||'?').toUpperCase())}
function base(p){return String(p).split('/').pop()}
/* ---------- library ---------- */
var EXT=/\.(mp3|m4a|aac|flac|wav|ogg|opus|wma|amr|3gp)$/i,LIB={songs:[],albums:[],artists:[],ready:false,loading:false,err:'',via:''},FAV=J('aur.mz.fav',{}),libSubs=[];
function norm(r){var t=r.t&&r.t!=='<unknown>'?r.t:base(r.p).replace(/\.[^.]+$/,'');return{p:r.p,t:t,a:r.a&&r.a!=='<unknown>'?r.a:'Unknown artist',al:r.al&&r.al!=='<unknown>'?r.al:'Unknown album',d:+r.d||0,aid:r.aid||0,da:r.da||0}}
function byName(a,b){return a.name.localeCompare(b.name,undefined,{sensitivity:'base'})}
function index(items){var songs=items.map(norm);songs.sort(function(a,b){return a.t.localeCompare(b.t,undefined,{sensitivity:'base'})});var al={},ar={};
 songs.forEach(function(s){var k=s.al+'\u0001'+s.a;(al[k]=al[k]||{key:k,name:s.al,artist:s.a,tracks:[]}).tracks.push(s);(ar[s.a]=ar[s.a]||{name:s.a,tracks:[]}).tracks.push(s)});
 LIB.songs=songs;LIB.albums=Object.keys(al).map(function(k){return al[k]}).sort(byName);LIB.artists=Object.keys(ar).map(function(k){return ar[k]}).sort(byName)}
async function crawl(){var n=nfo();if(!n)throw new Error('Storage is not available');var rt=await n.roots(),b=((rt.roots||[])[0]||{}).path||'/storage/emulated/0',out=[],q=[],seen=0;
 ['Music','Download','Documents','Podcasts','Audiobooks','Recordings'].forEach(function(d){q.push([b+'/'+d,0])});
 while(q.length&&out.length<4000&&seen<1500){var cur=q.shift();seen++;var r;try{r=await n.list({path:cur[0]})}catch(e){continue}
  (r.items||[]).forEach(function(it){if(it.name[0]==='.')return;if(it.isDirectory){if(cur[1]<4)q.push([it.path,cur[1]+1])}else if(EXT.test(it.name))out.push({p:it.path,t:'',d:0})})}
 return out}
function loadLib(force){if(LIB.loading)return LIB.pr;if(LIB.ready&&!force)return Promise.resolve();LIB.loading=true;LIB.err='';libSubs.forEach(function(f){f()});
 LIB.pr=(SYS&&SYS.audioList?SYS.audioList().then(function(r){LIB.via='phone';return r.items||[]}):Promise.reject(new Error('no plugin'))).catch(function(){LIB.via='folders';return crawl()})
  .then(function(items){index(items)}).catch(function(e){LIB.err=(e&&e.message)||'Could not read your music'}).then(function(){LIB.loading=false;LIB.ready=true;restore();libSubs.forEach(function(f){f()})});return LIB.pr}
/* ---------- player engine (lives outside the window) ---------- */
var au=new Audio(),subs=[],Q={list:[],i:-1,cur:null,art:'',sh:+g('aur.mz.sh','0')===1,rp:+g('aur.mz.rp','0'),ord:[],pos:0},ART={},artQ=[],artBusy=0,sleepT=0,sleepAt=0,tc=0;
au.preload='auto';
function fire(){subs.slice().forEach(function(f){try{f()}catch(e){}})}
function mkOrd(){var n=Q.list.length,o=[],i;for(i=0;i<n;i++)o.push(i);if(Q.sh){for(i=n-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=o[i];o[i]=o[j];o[j]=t}var k=o.indexOf(Q.i);if(k>0){o.splice(k,1);o.unshift(Q.i)}}Q.ord=o;Q.pos=Math.max(0,o.indexOf(Q.i))}
function playList(list,i,auto){if(!list.length)return;Q.list=list.slice();Q.i=Math.max(0,Math.min(list.length-1,i||0));mkOrd();loadCur(auto!==false)}
function loadCur(play){var s=Q.list[Q.i];if(!s)return;Q.cur=s;Q.art='';au.src=src(s.p);if(play)au.play().catch(function(){});setMeta(s);fire();saveLast()}
function step(d,auto){var n=Q.list.length;if(!n)return;if(auto&&Q.rp===2){au.currentTime=0;au.play().catch(function(){});return}
 var p=Q.pos+d;if(p>=n){if(Q.rp===1||!auto){p=0;if(Q.sh&&auto)mkOrd()}else{au.pause();au.currentTime=0;fire();return}}if(p<0)p=n-1;Q.pos=p;Q.i=Q.ord[p];loadCur(true)}
function next(auto){step(1,auto)}
function prev(){if(au.currentTime>3){au.currentTime=0;return}step(-1,false)}
function toggle(){if(!Q.cur)return;if(au.paused)au.play().catch(function(){});else au.pause()}
function saveLast(){if(Q.cur)put('aur.mz.last',JSON.stringify({p:Q.cur.p,t:Math.floor(au.currentTime||0)}))}
function restore(){if(Q.cur||!LIB.songs.length)return;var L=J('aur.mz.last',null);if(!L)return;var idx=-1;for(var i=0;i<LIB.songs.length;i++)if(LIB.songs[i].p===L.p){idx=i;break}if(idx<0)return;
 Q.list=LIB.songs.slice();Q.i=idx;mkOrd();Q.cur=LIB.songs[idx];au.src=src(Q.cur.p);var f=function(){au.currentTime=L.t||0;au.removeEventListener('loadedmetadata',f);fire()};au.addEventListener('loadedmetadata',f);setMeta(Q.cur)}
au.addEventListener('ended',function(){next(true)});
au.addEventListener('play',fire);au.addEventListener('pause',function(){saveLast();fire()});
au.addEventListener('error',function(){if(Q.cur){say('Cannot play '+Q.cur.t);setTimeout(function(){if(Q.list.length>1&&au.error)next(true)},500)}});
au.addEventListener('timeupdate',function(){if(++tc%4===0){fire();if(tc%24===0)saveLast()}});
function getArt(s){if(!SYS||!SYS.art)return Promise.resolve('');var k=s.aid||s.p;if(ART[k]!==undefined)return Promise.resolve(ART[k]);return new Promise(function(res){artQ.push({s:s,k:k,res:res});pumpArt()})}
function pumpArt(){while(artBusy<2&&artQ.length){var j=artQ.shift();artBusy++;(function(j){SYS.art({path:j.s.p}).then(function(r){ART[j.k]=r&&r.img||'';j.res(ART[j.k])},function(){ART[j.k]='';j.res('')}).then(function(){artBusy--;pumpArt()})})(j)}}
function setMeta(s){var ms=navigator.mediaSession;try{if(ms&&window.MediaMetadata)ms.metadata=new MediaMetadata({title:s.t,artist:s.a,album:s.al})}catch(e){}
 getArt(s).then(function(img){if(Q.cur!==s)return;Q.art=img;try{if(img&&ms&&window.MediaMetadata)ms.metadata=new MediaMetadata({title:s.t,artist:s.a,album:s.al,artwork:[{src:img,sizes:'512x512',type:'image/jpeg'}]})}catch(e){}fire()})}
try{var ms0=navigator.mediaSession;if(ms0){ms0.setActionHandler('play',function(){au.play()});ms0.setActionHandler('pause',function(){au.pause()});ms0.setActionHandler('previoustrack',prev);ms0.setActionHandler('nexttrack',function(){next(false)});ms0.setActionHandler('seekto',function(d){if(d&&d.seekTime!=null)au.currentTime=d.seekTime})}}catch(e){}
doc.addEventListener('keydown',function(e){if(!Q.cur)return;if(e.key==='MediaTrackNext'){e.preventDefault();next(false)}else if(e.key==='MediaTrackPrevious'){e.preventDefault();prev()}else if(e.key==='MediaPlayPause'){e.preventDefault();toggle()}});
function setSleep(min){clearTimeout(sleepT);sleepAt=0;if(!min){fire();return}sleepAt=Date.now()+min*60000;sleepT=setTimeout(function(){var v=au.volume,n=0,iv=setInterval(function(){n++;au.volume=Math.max(0,v*(1-n/12));if(n>=12){clearInterval(iv);au.pause();au.volume=v;sleepAt=0;fire()}},250)},min*60000);fire()}
function fav(s){if(FAV[s.p])delete FAV[s.p];else FAV[s.p]=1;put('aur.mz.fav',JSON.stringify(FAV))}
window.NXMZ={au:au,q:Q,next:function(){next(false)},prev:prev,toggle:toggle,on:function(f){subs.push(f)},off:function(f){var i=subs.indexOf(f);if(i>=0)subs.splice(i,1)},play:function(l,i){playList(l,i)},lib:LIB,load:loadLib};
/* ---------- UI ---------- */
var HEART='<svg viewBox="0 0 24 24"><path d="M12 20.2s-7.5-4.6-7.5-10.1A4.3 4.3 0 0112 7.6a4.3 4.3 0 017.5 2.5c0 5.5-7.5 10.1-7.5 10.1z"/></svg>';
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.9)+'" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var IC={songs:sv('<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.8" cy="17.5" r="2.4"/><circle cx="16.8" cy="15.5" r="2.4"/>'),albums:sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6"/>'),artists:sv('<circle cx="12" cy="8.5" r="3.7"/><path d="M5 19.6c.6-3.7 3.5-5.7 7-5.7s6.4 2 7 5.7"/>'),favs:sv('<path d="M12 20.2s-7.5-4.6-7.5-10.1A4.3 4.3 0 0112 7.6a4.3 4.3 0 017.5 2.5c0 5.5-7.5 10.1-7.5 10.1z"/>'),
 search:sv('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6l11-6.8z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.4z"/></svg>',
 prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.5h2.2v13H6zM19 5.8v12.4L9.6 12z"/></svg>',next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.8 5.5H18v13h-2.2zM5 5.8v12.4L14.4 12z"/></svg>',
 shuf:sv('<path d="M3.5 7h3c2 0 3.4 1 4.5 3l2 4c1.1 2 2.5 3 4.5 3h3M3.5 17h3c1.4 0 2.5-.5 3.4-1.4M14 8.4c.9-.9 2-1.4 3.4-1.4h3M17.8 4.5L20.5 7l-2.7 2.5M17.8 14.5l2.7 2.5-2.7 2.5"/>'),rep:sv('<path d="M4 11V9.5A2.5 2.5 0 016.5 7H19M16.5 4L19.5 7l-3 3M20 13v1.5a2.5 2.5 0 01-2.5 2.5H5M7.5 20L4.5 17l3-3"/>'),
 queue:sv('<path d="M4 6.5h12M4 12h12M4 17.5h7M18 14.5v5M15.5 17l2.5 2.5 2.5-2.5" />'),moon:sv('<path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a8 8 0 1010 10z"/>'),down:sv('<path d="M6 9.5l6 6 6-6"/>',2.2),refresh:sv('<path d="M19.5 12a7.5 7.5 0 01-13 5M4.5 12a7.5 7.5 0 0113-5"/><path d="M17.5 3.5V7H14M6.5 20.5V17H10"/>')};
var EQ='<span class="mz-eq"><i></i><i></i><i></i></span>';
var RH=58;
function appMusicPro(w,arg){var B=w.body;
 B.innerHTML=`<div class='mzp' data-w='lg'><aside class='mz-rail'><div class='mz-brand'><span class='lg'>${IC.songs}</span><b>Music</b></div>${[['songs','Songs'],['albums','Albums'],['artists','Artists'],['favs','Favorites']].map(function(n,i){return`<button data-v='${n[0]}' class='${i?'':'on'}'>${IC[n[0]]}<span>${n[1]}</span></button>`}).join('')}<button class='rs' data-a='scan' title='Rescan'>${IC.refresh}<span>Rescan</span></button></aside>`+
 `<section class='mz-main'><header class='mz-top'><h2 class='mz-ti'>Songs</h2><label class='mz-q'>${IC.search}<input placeholder='Search music' spellcheck='false' autocomplete='off'></label></header><div class='mz-hd' hidden></div><div class='mz-body'><div class='mz-vl'><div class='mz-sp'></div></div><div class='mz-gr' hidden></div><div class='mz-em' hidden></div></div></section>`+
 `<footer class='mz-bar' hidden><div class='pg'><i></i></div><div class='mt'><div class='ar'></div><div class='tx'><b></b><span></span></div></div><div class='ct'><button data-a='prev' aria-label='Previous'>${IC.prev}</button><button data-a='pp' class='pp' aria-label='Play or pause'>${IC.play}</button><button data-a='next' aria-label='Next'>${IC.next}</button></div></footer>`+
 `<div class='mz-np' hidden><div class='bgb'></div><header><button data-a='close' aria-label='Close'>${IC.down}</button><span>Now playing</span><button data-a='queue' aria-label='Queue'>${IC.queue}</button></header><div class='cnt'><div class='art'><div class='cv'></div>${EQ}</div><div class='ctl'><div class='inf'><div><b class='t'></b><span class='s'></span></div><button data-a='fav' class='hr' aria-label='Favorite'>${HEART}</button></div><div class='sk'><div class='bar'><i></i><u></u></div><div class='tt'><span class='c'>0:00</span><span class='d'>0:00</span></div></div>`+
 `<div class='bt'><button data-a='shuf' aria-label='Shuffle'>${IC.shuf}</button><button data-a='prev' aria-label='Previous'>${IC.prev}</button><button data-a='pp' class='big' aria-label='Play or pause'>${IC.play}</button><button data-a='next' aria-label='Next'>${IC.next}</button><button data-a='rep' aria-label='Repeat'>${IC.rep}<b></b></button></div><div class='ex'><button data-a='sleep'>${IC.moon}<span>Sleep timer</span></button></div></div></div><div class='ql' hidden><h4>Up next</h4><div class='qs'></div></div><div class='slm' hidden></div></div></div>`;
 var root=B.firstChild,$=function(s){return root.querySelector(s)},vl=$('.mz-vl'),sp=$('.mz-sp'),gr=$('.mz-gr'),em=$('.mz-em'),hd=$('.mz-hd'),ti=$('.mz-ti'),inp=$('.mz-q input'),bar=$('.mz-bar'),np=$('.mz-np'),view={k:'songs',list:[],title:'Songs'},drag=false,io=null,lastIdx=-1;
 function cur(){return Q.cur}
 function filt(l){var q=inp.value.trim().toLowerCase();return q?l.filter(function(s){return(s.t+' '+s.a+' '+s.al).toLowerCase().indexOf(q)>=0}):l}
 function rowHtml(s,i){var on=Q.cur&&Q.cur.p===s.p;return`<div class='mz-r${on?' on':''}' data-i='${i}' style='transform:translateY(${i*RH}px)'><div class='tl' style='background:${tileBg(s.al)}'>${on&&!au.paused?EQ:letter(s.t)}</div><div class='tx'><b>${esc(s.t)}</b><span>${esc(s.a)} &middot; ${esc(s.al)}</span></div><em>${s.d?tm(s.d/1000):''}</em><button class='hr${FAV[s.p]?' on':''}' data-f='${i}' aria-label='Favorite'>${HEART}</button></div>`}
 function paintList(){var L=view.list,h=vl.clientHeight||400,st=vl.scrollTop,a=Math.max(0,Math.floor(st/RH)-5),b=Math.min(L.length,Math.ceil((st+h)/RH)+6),o='';for(var i=a;i<b;i++)o+=rowHtml(L[i],i);sp.style.height=(L.length*RH)+'px';sp.innerHTML=o}
 function showMode(m){vl.hidden=m!=='list';gr.hidden=m!=='grid';em.hidden=m!=='empty'}
 function emptyMsg(t,s,btn){em.innerHTML=`<div class='ei'>${IC.songs}</div><b>${t}</b><span>${s||''}</span>${btn||''}`;showMode('empty')}
 function header(h){if(!h){hd.hidden=true;return}hd.hidden=false;hd.innerHTML=`<div class='ar' style='background:${tileBg(h.t)}'>${letter(h.t)}</div><div class='tx'><b>${esc(h.t)}</b><span>${esc(h.s)}</span></div><div class='ac'><button data-a='playall'>${IC.play}<span>Play</span></button><button data-a='shufall' class='sec'>${IC.shuf}<span>Shuffle</span></button></div>`}
 function setView(k,arg){view.k=k;var h=null;io&&io.disconnect();
  root.querySelectorAll('.mz-rail [data-v]').forEach(function(b){b.classList.toggle('on',b.dataset.v===(k==='album'?'albums':k==='artist'?'artists':k))});
  if(!LIB.ready){emptyMsg('Loading your music...','This can take a few seconds the first time.');ti.textContent='Music';return}
  if(LIB.err&&!LIB.songs.length){emptyMsg('Could not read your music',esc(LIB.err),`<button class='go' data-a='scan'>Try again</button>`);return}
  if(k==='songs'){view.list=filt(LIB.songs);ti.textContent='Songs'}
  else if(k==='favs'){view.list=filt(LIB.songs.filter(function(s){return FAV[s.p]}));ti.textContent='Favorites'}
  else if(k==='album'){var al=arg;view.list=filt(al.tracks);ti.textContent=al.name;h={t:al.name,s:al.artist+' \u00b7 '+al.tracks.length+' songs'}}
  else if(k==='artist'){var ar=arg;view.list=filt(ar.tracks);ti.textContent=ar.name;h={t:ar.name,s:ar.tracks.length+' songs'}}
  else if(k==='albums'||k==='artists'){ti.textContent=k==='albums'?'Albums':'Artists';grid(k);header(null);return}
  view.title=ti.textContent;header(h);
  if(!view.list.length){emptyMsg(k==='favs'?'No favorites yet':inp.value?'No matches':'No music found',k==='favs'?'Tap the heart on a song to keep it here.':'Music on your phone shows up here.',k==='songs'&&!inp.value?`<button class='go' data-a='scan'>Rescan</button>`:'');return}
  showMode('list');vl.scrollTop=0;paintList()}
 function grid(k){var L=k==='albums'?LIB.albums:LIB.artists,q=inp.value.trim().toLowerCase();if(q)L=L.filter(function(x){return(x.name+' '+(x.artist||'')).toLowerCase().indexOf(q)>=0});
  if(!L.length){emptyMsg('Nothing here','Try another search.');return}
  gr.innerHTML=L.map(function(x,i){return`<div class='mz-c${k==='artists'?' rd':''}' data-g='${i}'><div class='im' data-first='${esc(x.tracks[0].p)}' data-aid='${x.tracks[0].aid}' style='background:${tileBg(x.name)}'><span>${letter(x.name)}</span></div><b>${esc(x.name)}</b><span>${k==='albums'?esc(x.artist):x.tracks.length+' songs'}</span></div>`}).join('');gr._l=L;gr._k=k;showMode('grid');gr.scrollTop=0;
  if(window.IntersectionObserver){io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var el=e.target;getArt({p:el.dataset.first,aid:+el.dataset.aid}).then(function(img){if(img){el.style.backgroundImage='url('+img+')';el.classList.add('has')}})})},{root:gr,rootMargin:'200px'});gr.querySelectorAll('.im').forEach(function(e){io.observe(e)})}}
 function ctrl(){var s=Q.cur,pl=!au.paused;bar.hidden=!s;if(!s)return;
  var ar=bar.querySelector('.ar');ar.style.background=Q.art?'url('+Q.art+') center/cover':tileBg(s.al);ar.innerHTML=Q.art?'':letter(s.t);
  bar.querySelector('.tx b').textContent=s.t;bar.querySelector('.tx span').textContent=s.a;
  root.querySelectorAll('[data-a=pp]').forEach(function(b){var h=pl?IC.pause:IC.play;if(b._h!==h){b._h=h;b.innerHTML=h}});
  var pc=au.duration?au.currentTime/au.duration:0;bar.querySelector('.pg i').style.transform='scaleX('+pc+')';
  root.classList.toggle('playing',pl);
  if(!np.hidden){npPaint(pc)}
  if(!vl.hidden){var on=sp.querySelector('.mz-r.on'),want=s.p;if(!on||lastIdx!==Q.i||true){var rs=sp.querySelectorAll('.mz-r');rs.forEach(function(r){var it=view.list[+r.dataset.i],o=it&&it.p===want;if(o!==r.classList.contains('on')){r.classList.toggle('on',o);r.querySelector('.tl').innerHTML=o&&pl?EQ:letter(it.t)}else if(o){var t=r.querySelector('.tl'),has=!!t.querySelector('.mz-eq');if(pl&&!has)t.innerHTML=EQ;if(!pl&&has)t.innerHTML=letter(it.t)}})}}}
 function npPaint(pc){var s=Q.cur;if(!s)return;var cv=np.querySelector('.cv'),k=Q.art||'';if(cv.getAttribute('data-k')!==s.p+k){cv.setAttribute('data-k',s.p+k);cv.style.background=k?'url('+k+') center/cover':tileBg(s.al);cv.innerHTML=k?'':'<span>'+letter(s.t)+'</span>';np.querySelector('.bgb').style.background=k?'url('+k+') center/cover':tileBg(s.al);
   np.querySelector('.t').textContent=s.t;np.querySelector('.s').textContent=s.a+' \u00b7 '+s.al}
  np.classList.toggle('pl',!au.paused);if(!drag){np.querySelector('.bar i').style.width=(pc*100)+'%';np.querySelector('.bar u').style.left=(pc*100)+'%';np.querySelector('.c').textContent=tm(au.currentTime);}np.querySelector('.d').textContent=tm(au.duration||0);
  np.querySelector('[data-a=fav]').classList.toggle('on',!!FAV[s.p]);np.querySelector('[data-a=shuf]').classList.toggle('on',Q.sh);var rb=np.querySelector('[data-a=rep]');rb.classList.toggle('on',Q.rp>0);rb.querySelector('b').textContent=Q.rp===2?'1':'';
  var sl=np.querySelector('[data-a=sleep] span');sl.textContent=sleepAt?'Stops in '+Math.max(1,Math.round((sleepAt-Date.now())/60000))+' min':'Sleep timer'}
 function openNp(){if(!Q.cur)return;np.hidden=false;np.querySelector('.ql').hidden=true;np.classList.remove('q');requestAnimationFrame(function(){np.classList.add('on')});npPaint(au.duration?au.currentTime/au.duration:0)}
 function closeNp(){np.classList.remove('on');setTimeout(function(){np.hidden=true},320)}
 function queue(){var ql=np.querySelector('.ql'),open=ql.hidden;ql.hidden=!open;np.classList.toggle('q',open);if(!open)return;var o='';for(var p=Q.pos;p<Math.min(Q.ord.length,Q.pos+60);p++){var s=Q.list[Q.ord[p]];o+=`<div class='qr${p===Q.pos?' on':''}' data-p='${p}'><div class='tl' style='background:${tileBg(s.al)}'>${letter(s.t)}</div><div class='tx'><b>${esc(s.t)}</b><span>${esc(s.a)}</span></div></div>`}np.querySelector('.qs').innerHTML=o||'<p>Queue is empty</p>'}
 function sleepMenu(){var m=np.querySelector('.slm');m.innerHTML=[['Off',0],['15 minutes',15],['30 minutes',30],['60 minutes',60]].map(function(x){return`<button data-sl='${x[1]}'>${x[0]}</button>`}).join('');m.hidden=false;requestAnimationFrame(function(){m.classList.add('on')})}
 function playFromView(i){playList(view.list,i)}
 root.addEventListener('click',function(e){var t=e.target,el;
  if((el=t.closest('[data-f]'))){e.stopPropagation();var s=view.list[+el.dataset.f];if(s){fav(s);el.classList.toggle('on',!!FAV[s.p]);if(view.k==='favs'){setView('favs')}}return}
  if((el=t.closest('[data-sl]'))){setSleep(+el.dataset.sl);var m=np.querySelector('.slm');m.classList.remove('on');setTimeout(function(){m.hidden=true},200);say(+el.dataset.sl?'Music will stop in '+el.dataset.sl+' minutes':'Sleep timer off');return}
  if(!np.querySelector('.slm').hidden&&!t.closest('.slm')){var m2=np.querySelector('.slm');m2.classList.remove('on');m2.hidden=true}
  if((el=t.closest('.qr'))){Q.pos=+el.dataset.p;Q.i=Q.ord[Q.pos];loadCur(true);queue();queue();return}
  if((el=t.closest('[data-a]'))){var a=el.dataset.a;
   if(a==='pp')toggle();else if(a==='next')next(false);else if(a==='prev')prev();
   else if(a==='scan'){LIB.ready=false;setView(view.k);loadLib(true).then(function(){setView('songs')})}
   else if(a==='close')closeNp();else if(a==='queue')queue();else if(a==='sleep')sleepMenu();
   else if(a==='fav'&&Q.cur){fav(Q.cur);el.classList.toggle('on',!!FAV[Q.cur.p])}
   else if(a==='shuf'){Q.sh=!Q.sh;put('aur.mz.sh',Q.sh?'1':'0');mkOrd();npPaint(0)}
   else if(a==='rep'){Q.rp=(Q.rp+1)%3;put('aur.mz.rp',String(Q.rp));npPaint(0)}
   else if(a==='playall'){playList(view.list,0)}else if(a==='shufall'){var was=Q.sh;Q.sh=true;playList(view.list,Math.floor(Math.random()*view.list.length));Q.sh=was}
   return}
  if((el=t.closest('[data-v]'))){inp.value='';setView(el.dataset.v);return}
  if((el=t.closest('.mz-r'))){playFromView(+el.dataset.i);return}
  if((el=t.closest('.mz-c'))){var it=gr._l[+el.dataset.g];inp.value='';setView(gr._k==='albums'?'album':'artist',it);return}
  if(t.closest('.mz-bar')&&!t.closest('button')){openNp()}});
 vl.addEventListener('scroll',function(){if(!vl._r)vl._r=requestAnimationFrame(function(){vl._r=0;paintList()})});
 inp.addEventListener('input',function(){clearTimeout(inp._t);inp._t=setTimeout(function(){setView(view.k==='album'||view.k==='artist'?view.k:view.k,view._arg)},160)});
 (function seek(){var bx=np.querySelector('.bar');function at(e){var r=bx.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))}
  bx.addEventListener('pointerdown',function(e){drag=true;try{bx.setPointerCapture(e.pointerId)}catch(x){}var p=at(e);bx.querySelector('i').style.width=p*100+'%';bx.querySelector('u').style.left=p*100+'%'});
  bx.addEventListener('pointermove',function(e){if(!drag)return;var p=at(e);bx.querySelector('i').style.width=p*100+'%';bx.querySelector('u').style.left=p*100+'%';np.querySelector('.c').textContent=tm(p*(au.duration||0))});
  bx.addEventListener('pointerup',function(e){if(!drag)return;drag=false;if(au.duration)au.currentTime=at(e)*au.duration;ctrl()});bx.addEventListener('pointercancel',function(){drag=false})})();
 function tier(){var wd=root.clientWidth;root.dataset.w=wd<560?'xs':wd<860?'sm':'lg';if(!vl.hidden)paintList()}
 var ro=window.ResizeObserver?new ResizeObserver(tier):null;if(ro)ro.observe(root);tier();
 var onState=function(){ctrl()},onLib=function(){if(LIB.ready||LIB.loading)setView(view.k==='album'||view.k==='artist'?'songs':view.k)};subs.push(onState);libSubs.push(onLib);
 w.open=function(a){if(!a)return;if(a.path){var all=(a.list&&a.list.length?a.list:[a.path]),L=all.map(function(p){return LIB.songs.filter(function(s){return s.p===p})[0]||norm({p:p,t:'',a:'',al:'',d:0})}),i=Math.max(0,all.indexOf(a.path));playList(L,i)}};
 w.onclose=function(){var i=subs.indexOf(onState);if(i>=0)subs.splice(i,1);i=libSubs.indexOf(onLib);if(i>=0)libSubs.splice(i,1);if(ro)ro.disconnect();if(io)io.disconnect()};
 setView('songs');loadLib().then(function(){ctrl()});ctrl();if(arg)w.open(arg)}
/* ---------- styles ---------- */
var CSS=[
'.mzp{--mz:#ff5fa2;--mz2:#8b5cf6;--mzg:linear-gradient(135deg,#ff7ab8,#8b5cf6);position:relative;display:flex;height:100%;min-height:0;overflow:hidden;color:var(--txt);font-size:13.5px;-webkit-user-select:none;user-select:none}',
'.mzp *{box-sizing:border-box}.mzp button,.mzp input{font:inherit;color:inherit}.mzp button{cursor:pointer}',
'.mz-rail{width:178px;flex:none;display:flex;flex-direction:column;gap:3px;padding:14px 10px 74px;border-right:1px solid var(--line)}',
'.mz-brand{display:flex;align-items:center;gap:10px;padding:2px 8px 14px;font-size:16px}.mz-brand .lg{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--mzg);color:#fff;box-shadow:0 6px 16px rgba(139,92,246,.4)}.mz-brand .lg svg{width:18px;height:18px}',
'.mz-rail>button{position:relative;display:flex;align-items:center;gap:11px;padding:10px 12px;border:0;border-radius:12px;background:none;color:var(--mut);text-align:left;transition:background-color .2s,color .2s,transform .12s}.mz-rail>button svg{width:19px;height:19px;flex:none}.mz-rail>button:hover{background:var(--hov)}.mz-rail>button:active{transform:scale(.97)}',
'.mz-rail>button.on{color:var(--txt);background:var(--selbg);font-weight:600}.mz-rail>button.on svg{color:var(--mz)}.mz-rail>button.on:before{content:"";position:absolute;left:-10px;top:10px;bottom:10px;width:3px;border-radius:3px;background:var(--mzg);animation:mzBar .3s}@keyframes mzBar{from{transform:scaleY(0)}}.mz-rail .rs{margin-top:auto}',
'.mz-main{flex:1;min-width:0;display:flex;flex-direction:column;padding-bottom:64px}',
'.mz-top{display:flex;align-items:center;gap:12px;padding:14px 18px 8px}.mz-ti{margin:0;flex:1;min-width:0;font-size:24px;font-weight:750;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.mz-q{position:relative;flex:0 1 240px}.mz-q svg{position:absolute;left:11px;top:50%;margin-top:-9px;width:18px;height:18px;color:var(--mut);pointer-events:none}.mz-q input{width:100%;height:38px;border:1px solid var(--line);background:var(--surf2);border-radius:13px;padding:0 12px 0 36px;outline:0;transition:border-color .2s,box-shadow .2s;-webkit-user-select:text;user-select:text}.mz-q input:focus{border-color:var(--mz);box-shadow:0 0 0 3px rgba(255,95,162,.2)}',
'.mz-hd{display:flex;align-items:center;gap:14px;padding:6px 18px 10px;animation:mzUp .4s cubic-bezier(.2,.9,.3,1)}.mz-hd[hidden]{display:none}.mz-hd .ar{width:64px;height:64px;border-radius:16px;display:grid;place-items:center;color:#fff;font-size:26px;font-weight:800;flex:none;box-shadow:0 8px 20px rgba(0,0,0,.3)}.mz-hd .tx{flex:1;min-width:0}.mz-hd .tx b{display:block;font-size:17px}.mz-hd .tx span{color:var(--mut)}',
'.mz-hd .ac{display:flex;gap:8px}.mz-hd .ac button{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:999px;padding:9px 16px;background:var(--mzg);color:#fff;font-weight:650;transition:transform .12s}.mz-hd .ac button.sec{background:var(--surf2);color:var(--txt);box-shadow:inset 0 0 0 1px var(--line)}.mz-hd .ac button:active{transform:scale(.94)}.mz-hd .ac svg{width:16px;height:16px}',
'@keyframes mzUp{from{opacity:0;transform:translateY(12px)}}',
'.mz-body{position:relative;flex:1;min-height:0}.mz-vl{position:absolute;inset:0;overflow:auto;padding:0 10px;overscroll-behavior:contain}.mz-vl[hidden],.mz-gr[hidden],.mz-em[hidden]{display:none}.mz-sp{position:relative}',
'.mz-r{position:absolute;left:0;right:0;height:'+RH+'px;display:flex;align-items:center;gap:13px;padding:0 10px;border-radius:14px;cursor:pointer;transition:background-color .15s}.mz-r:hover{background:var(--hov)}.mz-r.on{background:var(--selbg)}.mz-r.on .tx b{color:var(--mz)}',
'.mz-r .tl,.qr .tl{width:42px;height:42px;border-radius:12px;flex:none;display:grid;place-items:center;color:#fff;font-weight:800;font-size:17px;box-shadow:0 3px 8px rgba(0,0,0,.22)}',
'.mz-r .tx,.qr .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.mz-r .tx b,.qr .tx b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz-r .tx span,.qr .tx span{color:var(--mut);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz-r em{font-style:normal;color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums}',
'.hr{border:0;background:none;width:34px;height:34px;padding:7px;color:var(--mut);opacity:.55;transition:transform .25s cubic-bezier(.2,.9,.3,1.6),color .2s,opacity .2s}.hr svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round}.hr.on{color:var(--mz);opacity:1}.hr.on svg{fill:currentColor}.hr:active{transform:scale(.75)}',
'.mz-eq{display:inline-flex;align-items:flex-end;gap:2.5px;height:16px}.mz-eq i{width:3.5px;height:100%;border-radius:2px;background:#fff;transform-origin:bottom;animation:mzEq .9s ease-in-out infinite alternate}.mz-eq i:nth-child(2){animation-delay:-.35s}.mz-eq i:nth-child(3){animation-delay:-.65s}@keyframes mzEq{from{transform:scaleY(.2)}to{transform:scaleY(1)}}',
'.mz-gr{position:absolute;inset:0;overflow:auto;padding:4px 18px 10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:16px 14px;align-content:start;overscroll-behavior:contain}',
'.mz-c{cursor:pointer;content-visibility:auto;contain-intrinsic-size:200px;transition:transform .25s cubic-bezier(.2,.9,.3,1.3)}.mz-c:hover{transform:translateY(-3px)}.mz-c:active{transform:scale(.96)}',
'.mz-c .im{aspect-ratio:1;border-radius:18px;display:grid;place-items:center;color:#fff;font-size:34px;font-weight:800;background-size:cover!important;background-position:center!important;box-shadow:0 8px 20px rgba(0,0,0,.3);margin-bottom:8px;transition:box-shadow .25s}.mz-c .im.has span{display:none}.mz-c.rd .im{border-radius:50%}',
'.mz-c b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz-c>span{color:var(--mut);font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.mz-em{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--mut);text-align:center;padding:20px}.mz-em b{color:var(--txt);font-size:16px}.mz-em .ei svg{width:70px;height:70px;color:var(--mz);opacity:.85;animation:mzFl 3s ease-in-out infinite}@keyframes mzFl{50%{transform:translateY(-6px)}}',
'.mz-em .go{border:0;border-radius:12px;padding:9px 20px;background:var(--mzg);color:#fff;font-weight:650;margin-top:6px}',
/* mini bar */
'.mz-bar{position:absolute;left:10px;right:10px;bottom:10px;height:58px;display:flex;align-items:center;gap:12px;padding:0 12px;border-radius:20px;background:var(--surf);border:1px solid var(--line);box-shadow:0 12px 30px rgba(0,0,0,.3);z-index:5;overflow:hidden;cursor:pointer;animation:mzUp .45s cubic-bezier(.2,.9,.3,1.2)}.mz-bar[hidden]{display:none}',
'.mz-bar .pg{position:absolute;left:0;right:0;top:0;height:3px;background:var(--line)}.mz-bar .pg i{display:block;height:100%;background:var(--mzg);transform-origin:left;transform:scaleX(0);transition:transform .9s linear}',
'.mz-bar .mt{flex:1;min-width:0;display:flex;align-items:center;gap:12px}.mz-bar .ar{width:40px;height:40px;border-radius:11px;flex:none;display:grid;place-items:center;color:#fff;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,.3)}.mz-bar .tx{min-width:0;display:flex;flex-direction:column}.mz-bar .tx b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz-bar .tx span{color:var(--mut);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.mz-bar .ct{display:flex;align-items:center;gap:4px}.mz-bar .ct button{width:38px;height:38px;border:0;border-radius:50%;background:none;display:grid;place-items:center;transition:transform .12s,background-color .2s}.mz-bar .ct button:hover{background:var(--hov)}.mz-bar .ct button:active{transform:scale(.88)}.mz-bar .ct svg{width:20px;height:20px}.mz-bar .ct .pp{background:var(--mzg);color:#fff}.mz-bar .ct .pp:hover{background:var(--mzg)}',
/* now playing */
'.mz-np{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;overflow:hidden;background:var(--surf);transform:translateY(100%);transition:transform .45s cubic-bezier(.2,.9,.3,1)}.mz-np.on{transform:none}.mz-np[hidden]{display:none}',
'.mz-np .bgb{position:absolute;inset:-40px;filter:blur(46px) saturate(1.4);opacity:.5;transform:scale(1.2);transition:background .6s}.mz-np:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent,var(--surf) 92%);opacity:.7;pointer-events:none}',
'.mz-np>header{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:12px 14px}.mz-np>header span{font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:var(--mut);font-weight:650}.mz-np>header button{width:40px;height:40px;border:0;border-radius:50%;background:rgba(128,128,128,.18);display:grid;place-items:center;backdrop-filter:blur(8px)}.mz-np>header svg{width:20px;height:20px}',
'.mz-np .cnt{position:relative;z-index:2;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(18px,5vw,56px);padding:0 clamp(16px,5vw,56px) 18px}',
'.mz-np .art{position:relative;flex:0 1 min(46vh,360px);aspect-ratio:1;min-width:140px}.mz-np .cv{position:absolute;inset:0;border-radius:28px;display:grid;place-items:center;color:#fff;font-size:80px;font-weight:800;box-shadow:0 24px 60px rgba(0,0,0,.5);transform:scale(.88);transition:transform .6s cubic-bezier(.2,.9,.3,1.3)}.mz-np.pl .cv{transform:scale(1)}',
'.mz-np .art .mz-eq{position:absolute;left:14px;bottom:14px;height:20px;opacity:0;transition:opacity .3s}.mz-np.pl .art .mz-eq{opacity:.95}',
'.mz-np .ctl{flex:1 1 320px;min-width:0;max-width:440px;display:flex;flex-direction:column;gap:16px}.mz-np .inf{display:flex;align-items:center;gap:10px}.mz-np .inf>div{flex:1;min-width:0}.mz-np .t{display:block;font-size:clamp(19px,3vw,26px);font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz-np .s{display:block;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz-np .inf .hr{width:44px;height:44px;opacity:1}',
'.mz-np .bar{position:relative;height:22px;cursor:pointer;touch-action:none}.mz-np .bar:before{content:"";position:absolute;left:0;right:0;top:9px;height:5px;border-radius:3px;background:rgba(128,128,128,.3)}.mz-np .bar i{position:absolute;left:0;top:9px;height:5px;border-radius:3px;background:var(--mzg);width:0}.mz-np .bar u{position:absolute;top:3px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.5);left:0;transition:transform .15s}.mz-np .bar:active u{transform:scale(1.3)}',
'.mz-np .tt{display:flex;justify-content:space-between;color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums;margin-top:2px}',
'.mz-np .bt{display:flex;align-items:center;justify-content:space-between}.mz-np .bt button{border:0;background:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;color:var(--mut);transition:transform .12s,color .2s,background-color .2s;position:relative}.mz-np .bt button svg{width:24px;height:24px}.mz-np .bt button:active{transform:scale(.86)}.mz-np .bt button.on{color:var(--mz)}',
'.mz-np .bt button b{position:absolute;right:7px;bottom:6px;font-size:10px}.mz-np .bt button[data-a=prev],.mz-np .bt button[data-a=next]{color:var(--txt)}.mz-np .bt .big{width:68px;height:68px;background:var(--mzg);color:#fff;box-shadow:0 10px 26px rgba(139,92,246,.5)}.mz-np .bt .big svg{width:30px;height:30px}',
'.mz-np .ex{display:flex;justify-content:center}.mz-np .ex button{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:8px 16px;background:rgba(128,128,128,.18);color:var(--txt);font-size:12.5px}.mz-np .ex svg{width:16px;height:16px}',
'.mz-np .ql{position:absolute;z-index:4;right:0;top:64px;bottom:0;width:min(360px,100%);padding:12px;background:var(--surf);border-left:1px solid var(--line);overflow:auto;animation:mzR .3s cubic-bezier(.2,.9,.3,1)}.mz-np .ql[hidden]{display:none}.mz-np .ql h4{margin:4px 6px 10px}@keyframes mzR{from{transform:translateX(30px);opacity:0}}',
'.qr{display:flex;align-items:center;gap:11px;padding:7px 8px;border-radius:12px;cursor:pointer}.qr:hover{background:var(--hov)}.qr.on{background:var(--selbg)}',
'.mz-np .slm{position:absolute;z-index:6;left:50%;bottom:90px;transform:translate(-50%,12px) scale(.96);display:flex;flex-direction:column;min-width:190px;padding:6px;border-radius:16px;background:var(--surf);border:1px solid var(--line);box-shadow:0 16px 40px rgba(0,0,0,.4);opacity:0;transition:opacity .18s,transform .22s cubic-bezier(.2,.9,.3,1.2)}.mz-np .slm.on{opacity:1;transform:translate(-50%,0)}.mz-np .slm[hidden]{display:none}.slm button{border:0;background:none;text-align:left;padding:10px 14px;border-radius:10px}.slm button:hover{background:var(--hov)}',
'.mzp[data-w=xs],.mzp[data-w=sm]{flex-direction:column}.mzp[data-w=xs] .mz-rail,.mzp[data-w=sm] .mz-rail{width:auto;flex-direction:row;padding:8px 10px;border-right:0;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none;gap:4px}',
'.mzp[data-w=xs] .mz-brand,.mzp[data-w=sm] .mz-brand{display:none}.mzp[data-w=xs] .mz-rail>button,.mzp[data-w=sm] .mz-rail>button{padding:8px 13px;flex:none}.mzp[data-w=xs] .mz-rail .rs span,.mzp[data-w=sm] .mz-rail .rs span{display:none}.mzp[data-w=xs] .mz-rail>button.on:before,.mzp[data-w=sm] .mz-rail>button.on:before{display:none}.mzp[data-w=xs] .mz-rail .rs,.mzp[data-w=sm] .mz-rail .rs{margin:0 0 0 auto}',
'.mzp[data-w=xs] .mz-main,.mzp[data-w=sm] .mz-main{padding-bottom:0}.mzp[data-w=xs] .mz-body,.mzp[data-w=sm] .mz-body{padding-bottom:70px}.mzp[data-w=xs] .mz-ti{font-size:20px}.mzp[data-w=xs] .mz-q{flex-basis:130px}',
'.mzp[data-w=xs] .mz-np .cnt,.mzp[data-w=sm] .mz-np .cnt{flex-direction:column;justify-content:center;gap:16px;overflow:auto}.mzp[data-w=xs] .mz-np .art{flex:0 0 auto;width:min(60vw,36vh)}',
':root[data-skin=glass] .mz-bar,:root[data-skin=glass] .mz-np .slm,:root[data-skin=glass] .mz-np .ql{background:rgba(24,30,52,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 14px 36px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%)}:root[data-skin=glass] .mz-np{background:rgba(14,18,36,.72);-webkit-backdrop-filter:blur(26px);backdrop-filter:blur(26px)}',
'body.perf .mzp *,body.rm .mzp *{animation-duration:.01s!important;transition-duration:.01s!important}body.perf .mz-np .bgb{filter:none;opacity:.25}'
].join('\n');
var sty=doc.createElement('style');sty.id='nx-mz-css';sty.textContent=CSS;doc.head.appendChild(sty);
A.music=Object.assign(A.music||{},{n:'Music',g:'linear-gradient(160deg,#ff7ab8,#8b5cf6)',w:900,h:600,f:appMusicPro});
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
})();

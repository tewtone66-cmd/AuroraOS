/* WALL-4.6.0 - three "Bloom" wallpapers (Bloom / Orchid / Ember) replace every old wallpaper; Bloom is the default.
   The desktop shows a LIVE layer: petals sway softly, and a wind gust blows through them when you log in (unlock), start up or change wallpaper.
   4th card "Auto" = Bloom whose colours follow the time of day (dawn, day, golden hour, dusk, night) and fade slowly.
   Static versions of the same art are used for the picker thumbnails and the lock screen.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
if(typeof WALL==='undefined'||!Array.isArray(WALL))return;
function rng(s){return function(){s|=0;s=s+1831565813|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hx(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]}
function th(v){v=Math.max(0,Math.min(255,Math.round(v)));return(v<16?'0':'')+v.toString(16)}
function mix(a,b,t){var x=hx(a),y=hx(b);return'#'+th(x[0]+(y[0]-x[0])*t)+th(x[1]+(y[1]-x[1])*t)+th(x[2]+(y[2]-x[2])*t)}
function r0(n){return Math.round(n)}
/* palettes: bg = 3 sky colours, p = petal ramp dark / mid / light / glow */
var PAL={
 bloom:{bg:['#2f63c8','#5b95ec','#8fbdfc'],p:['#0a2fd0','#1a6cf0','#4fb3ff','#bfe6ff']},
 orchid:{bg:['#3b2a8f','#7a5be0','#c9aaff'],p:['#3a0ca3','#7b2ff7','#d56bff','#ffd2f6']},
 ember:{bg:['#1f2f6b','#c8506a','#ffb26b'],p:['#8a1c4a','#ff5a5f','#ff9e57','#ffe3b0']}
};
var DAWN={bg:['#5b4b9a','#e58fa0','#ffd3a8'],p:['#4a2a8f','#e0568a','#ff9d7a','#ffe6c8']},
 GOLD={bg:['#2a3f86','#e07a5f','#ffc27a'],p:['#7a2a6a','#f2606a','#ffa45c','#ffe7b8']},
 NIGHT={bg:['#050b24','#0b1f5c','#1a3a8a'],p:['#030a3a','#0b2a9a','#2a6be0','#8fc4ff']};
var KEYS=[[0,NIGHT],[5.5,DAWN],[11,PAL.bloom],[16,PAL.bloom],[17.8,GOLD],[20,PAL.orchid],[23,NIGHT],[24,NIGHT]];
function autoPal(d){var h=d.getHours()+d.getMinutes()/60,i=0;while(i<KEYS.length-2&&h>=KEYS[i+1][0])i++;
 var a=KEYS[i],b=KEYS[i+1],t=b[0]===a[0]?0:(h-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);
 return{bg:a[1].bg.map(function(c,k){return mix(c,b[1].bg[k],t)}),p:a[1].p.map(function(c,k){return mix(c,b[1].p[k],t)})}}
/* compositions */
var COMPS=[
 {seed:11,cx:1060,cy:740,n:17,a0:-112,a1:48,L0:430,L1:820,gx:.62,gy:.72,wv:[800,850,890]},
 {seed:27,cx:540,cy:760,n:19,a0:-86,a1:86,L0:380,L1:760,gx:.34,gy:.74,wv:[830,870]},
 {seed:43,cx:1200,cy:790,n:15,a0:-176,a1:-6,L0:470,L1:860,gx:.72,gy:.8,wv:[800,855,895]}
];
var GF=['g0','g1','g2','g1','g3'];
function petal(L,W){return'M0 0C'+r0(-W*.75)+' '+r0(-L*.2)+' '+r0(-W*1.15)+' '+r0(-L*.62)+' '+r0(-W*.15)+' '+r0(-L)+'C'+r0(W*.95)+' '+r0(-L*.96)+' '+r0(W*1.45)+' '+r0(-L*.5)+' '+r0(W*.65)+' '+r0(-L*.2)+'C'+r0(W*.4)+' '+r0(-L*.07)+' '+r0(W*.12)+' '+r0(-L*.02)+' 0 0Z'}
function stop(k,c,o,pos,live){return'<stop offset="'+pos+'" stop-color="'+c+'"'+(o!=null?' stop-opacity="'+o+'"':'')+(live&&k?' data-c="'+k+'"':'')+'/>'}
function build(cp,pal,live){var R=rng(cp.seed),b=pal.bg,p=pal.p,s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>'+
 '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'+stop('bg0',b[0],null,0,live)+stop('bg1',b[1],null,.55,live)+stop('bg2',b[2],null,1,live)+'</linearGradient>'+
 '<radialGradient id="gl" cx="'+cp.gx+'" cy="'+cp.gy+'" r=".55">'+stop('p3',p[3],.55,0,live)+stop('p3',p[3],0,1,live)+'</radialGradient>'+
 '<linearGradient id="g0" x1="0" y1="1" x2="0" y2="0">'+stop('p0',p[0],null,0,live)+stop('p1',p[1],null,1,live)+'</linearGradient>'+
 '<linearGradient id="g1" x1="0" y1="1" x2="0" y2="0">'+stop('p1',p[1],null,0,live)+stop('p2',p[2],null,1,live)+'</linearGradient>'+
 '<linearGradient id="g2" x1="0" y1="1" x2="0" y2="0">'+stop('p0',p[0],null,0,live)+stop('p1',p[1],null,.5,live)+stop('p3',p[3],null,1,live)+'</linearGradient>'+
 '<linearGradient id="g3" x1="0" y1="1" x2="0" y2="0">'+stop('p1',p[1],null,0,live)+stop('p3',p[3],null,1,live)+'</linearGradient>'+
 '<linearGradient id="rm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+
 '<rect width="1600" height="900" fill="url(#bg)"/><rect width="1600" height="900" fill="url(#gl)"/>',
 items=[],i;
 for(i=0;i<cp.n;i++){var ang=cp.a0+(cp.a1-cp.a0)*(i+R()*.6)/cp.n,L=cp.L0+(cp.L1-cp.L0)*R(),W=L*(.24+R()*.16);items.push({a:ang,L:L,W:W,f:R()<.3?-1:1,r:R()})}
 items.sort(function(x,y){return y.L-x.L});
 var o='transform-origin:'+cp.cx+'px '+cp.cy+'px';
 items.forEach(function(it,k){var g='<g transform="translate('+cp.cx+' '+cp.cy+') rotate('+r0(it.a)+') scale('+it.f+' 1)"><path d="'+petal(it.L,it.W)+'" fill="url(#'+GF[k%5]+')" fill-opacity=".94"/><path d="'+petal(it.L,it.W)+'" fill="none" stroke="url(#rm)" stroke-width="2.4" stroke-opacity=".55"/></g>';
  if(live)s+='<g class="pw" style="--gd:'+(k*42)+'ms;--ga:'+(5+it.r*6).toFixed(1)+'deg;'+o+'"><g class="ps" style="--d:'+(5+it.r*4).toFixed(1)+'s;--dl:-'+(it.r*9).toFixed(1)+'s;--a:'+(1+it.r*2).toFixed(1)+'deg;'+o+'">'+g+'</g></g>';else s+=g});
 cp.wv.forEach(function(y,k){var d='M-60 900L-60 '+y+'C300 '+(y-95)+' 620 '+(y+60)+' 920 '+(y-25)+'S1420 '+(y-85)+' 1680 '+(y-8)+'L1680 900Z',f=k%2?'g1':'g0',w='<path d="'+d+'" fill="url(#'+f+')" fill-opacity="'+(.86+k*.04)+'"/><path d="M-60 '+y+'C300 '+(y-95)+' 620 '+(y+60)+' 920 '+(y-25)+'S1420 '+(y-85)+' 1680 '+(y-8)+'" fill="none" stroke="url(#rm)" stroke-width="2.2" stroke-opacity=".5"/>';
  s+=live?'<g class="wv" style="--dl:-'+(k*2.3)+'s;--d:'+(8+k*2)+'s">'+w+'</g>':w});
 return s+'</svg>'}
function uri(cp,pal){return'data:image/svg+xml,'+encodeURIComponent(build(cp,pal,false))}
/* ---------- replace every old wallpaper ---------- */
var s0=WALL[0],mk,OB=null;
if(typeof s0==='string'){var asUrl=/^\s*url\(/.test(s0);mk=function(u){return asUrl?'url("'+u+'")':u}}
else if(s0&&typeof s0==='object'){var key=Object.keys(s0).filter(function(k){return typeof s0[k]==='string'&&/data:|url\(/.test(s0[k])})[0]||'u',au=/^\s*url\(/.test(String(s0[key]||''));OB=true;
 mk=function(u,name){var o=Object.assign({},s0);o[key]=au?'url("'+u+'")':u;['n','name','t','title','label'].forEach(function(k){if(k in o)o[k]=name});return o}}
else mk=function(u){return u};
var NAMES=['Bloom','Orchid','Ember','Auto'];
function entries(){return[mk(uri(COMPS[0],PAL.bloom),NAMES[0]),mk(uri(COMPS[1],PAL.orchid),NAMES[1]),mk(uri(COMPS[2],PAL.ember),NAMES[2]),mk(uri(COMPS[0],autoPal(new Date())),NAMES[3])]}
var E=entries();WALL.length=0;E.forEach(function(e){WALL.push(e)});
function setS(v){try{if(typeof S!=='undefined')S.wall=v}catch(e){}try{ls('aur.wall',v)}catch(e){}}
function getS(){try{return typeof S!=='undefined'?(+S.wall||0):0}catch(e){return 0}}
try{if(ls('aur.wall.v')!=='460'){setS(0);ls('aur.wall.v','460')}else if(getS()>3)setS(0)}catch(e){}
/* ---------- live layer ---------- */
var st=doc.createElement('style');st.id='nx-wall-css';st.textContent=[
'#desk{isolation:isolate}#nxbl{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}#nxbl svg{width:100%;height:100%;display:block}',
'#nxbl stop{transition:stop-color 30s linear}#nxbl.fast stop{transition-duration:1.2s}',
'#nxbl .ps{animation:nxsw var(--d) ease-in-out var(--dl) infinite alternate}#nxbl .wv{animation:nxwv var(--d) ease-in-out var(--dl) infinite alternate}',
'#nxbl.gust .pw{animation:nxg 3.2s cubic-bezier(.22,.8,.3,1) var(--gd) 1}#nxbl.gust .wv{animation-duration:2.6s}',
'@keyframes nxsw{from{transform:rotate(calc(var(--a) * -1))}to{transform:rotate(var(--a))}}',
'@keyframes nxwv{from{transform:translateY(-7px)}to{transform:translateY(9px)}}',
'@keyframes nxg{0%{transform:rotate(0deg) scale(1)}16%{transform:rotate(var(--ga)) scale(1.035)}38%{transform:rotate(calc(var(--ga) * -.7)) scale(.99)}60%{transform:rotate(calc(var(--ga) * .35))}80%{transform:rotate(calc(var(--ga) * -.12))}100%{transform:rotate(0deg) scale(1)}}',
'body.perf #nxbl *,body.rm #nxbl *{animation:none!important}'
].join('\n');
doc.head.appendChild(st);
var L=doc.createElement('div');L.id='nxbl';
var host=doc.getElementById('desk')||doc.body;host.insertBefore(L,host.firstChild);
var cur=-1,gt=0,ft=0;
function gust(){if(!L.isConnected)return;L.classList.remove('gust');void L.offsetWidth;L.classList.add('gust');clearTimeout(gt);gt=setTimeout(function(){L.classList.remove('gust')},4600)}
function applyPal(pal){var m={bg0:pal.bg[0],bg1:pal.bg[1],bg2:pal.bg[2],p0:pal.p[0],p1:pal.p[1],p2:pal.p[2],p3:pal.p[3]};[].forEach.call(L.querySelectorAll('stop[data-c]'),function(e){e.style.stopColor=m[e.getAttribute('data-c')]})}
function palFor(i){return i===3?autoPal(new Date()):PAL[['bloom','orchid','ember'][i]]}
function refresh(force){var i=getS();if(i<0||i>3)i=0;var comp=i===3?0:i;
 if(force||cur!==comp){L.innerHTML=build(COMPS[comp],palFor(i),true);cur=comp;gust()}
 else{L.classList.add('fast');clearTimeout(ft);ft=setTimeout(function(){L.classList.remove('fast')},1500);applyPal(palFor(i));gust()}}
function slow(){if(getS()===3)applyPal(autoPal(new Date()))}
/* keep the lock screen / picker thumbnail of "Auto" current */
function refreshAutoThumb(){WALL[3]=mk(uri(COMPS[0],autoPal(new Date())),NAMES[3]);if(getS()===3){try{if(typeof applyWall==='function')applyWall()}catch(e){}}}
/* hook applyWall so picking a wallpaper updates the live layer */
if(typeof applyWall==='function'){var oa=applyWall;try{window.applyWall=function(){var r=oa.apply(this,arguments);try{var v=getS();if(v!==lastS){lastS=v;refresh(false)}}catch(e){}return r}}catch(e){}}
var lastS=getS();setInterval(function(){var v=getS();if(v!==lastS){lastS=v;refresh(false)}},700);
setInterval(slow,30000);setInterval(refreshAutoThumb,600000);
/* wind when you log in */
var lck=doc.getElementById('lck');
if(lck){var was=lck.classList.contains('on');new MutationObserver(function(){var on=lck.classList.contains('on');if(was&&!on)setTimeout(gust,260);was=on}).observe(lck,{attributes:true,attributeFilter:['class']})}
try{if(typeof applyWall==='function')applyWall()}catch(e){}
refresh(true);
if(!lck||!lck.classList.contains('on'))setTimeout(gust,2200);
window.NXWALL={gust:gust,refresh:function(){refresh(true)},names:NAMES};
})();

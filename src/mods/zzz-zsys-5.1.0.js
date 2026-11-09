/* SYS-5.1.0 - (1) Settings > Update page: no emoji stickers, a clean "Latest updates" list; (2) calmer start-up: apps from the last session are not all re-opened at once;
   (3) light system optimisation: animations pause when the app is in the background or fully covered, heavy blur is dropped when many windows are open.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document,B=doc.body,root=doc.documentElement,T0=performance.now();
function $(s,r){return(r||doc).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* ---------- 1. Update page ---------- */
var LIST=[
 ['5.1','Control Center rebuilt','Wi-Fi, Bluetooth, mobile data, airplane and hotspot tiles open the real connect screens. Paired Bluetooth devices, volume, brightness and night light sliders, quick toggles, music and battery cards.'],
 ['5.1','Task Manager rebuilt','Live process list with switch, minimize and end task, performance charts for frame rate, UI load and memory, a details page and one-tap clean-up.'],
 ['5.1','Music covers','Covers now show for songs, albums and artists. NexOS uses the picture inside the file, or cover.jpg / folder.jpg from the music folder.'],
 ['5.1','Faster start-up','Apps from your last session no longer open all at once. Animations pause when NexOS is in the background or fully covered.'],
 ['5.0','Settings redesign','New sidebar and page headers, real switches and sliders, and Nex Island move and size controls.'],
 ['4.6','Bloom wallpapers','Three live wallpapers with a wind gust when you log in, and an Auto mode that follows the time of day.'],
 ['4.5','Screen Recorder','Record the screen with quality, frame rate and microphone options, a library and a live recording pill next to Nex Island.'],
 ['4.4','Music player','Your whole phone library with albums, artists, queue, sleep timer and a Now Playing view.'],
 ['4.3','Files','A faster file manager with covers, previews and drag and drop.']
];
var CSS=[
 '.nwn{margin-top:10px;border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--surf2)}',
 '.nwn .nr{display:flex;gap:14px;align-items:flex-start;padding:14px 16px}.nwn .nr+.nr{border-top:1px solid var(--line)}',
 '.nwn .nv{flex:none;min-width:46px;text-align:center;padding:4px 0;border-radius:9px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;background:var(--acc);color:var(--accT,#fff)}.nwn .nv.o{background:var(--hov);color:var(--mut)}',
 '.nwn .nt{min-width:0}.nwn .nt b{display:block;font-size:14px;font-weight:650}.nwn .nt span{display:block;margin-top:3px;color:var(--mut);font-size:12.5px;line-height:1.55}',
 '.nwh{margin:22px 4px 0;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mut)}',
 'html.nx-bg *,html.nx-bg *::before,html.nx-bg *::after{animation-play-state:paused!important}',
 'body.nx-cover #nxbl *{animation-play-state:paused!important}',
 'body.nx-many .win,body.nx-many #dock,body.nx-many #ncc{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
 '.mz-r .tl.has{font-size:0}'
].join('\n');
var st=doc.createElement('style');st.id='nx-sys-css';st.textContent=CSS;doc.head.appendChild(st);
var EMO=/[\u2190-\u21FF\u2300-\u23FF\u2460-\u27BF\u2B00-\u2BFF\uFE0F\u200D]|[\uD83C-\uD83E][\uDC00-\uDFFF]/g;
function listHtml(){return'<div class="nwh">Latest updates</div><div class="nwn" data-nwn="1">'+LIST.map(function(x,i){return'<div class="nr"><span class="nv'+(i>3?' o':'')+'">'+x[0]+'</span><div class="nt"><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></div></div>'}).join('')+'</div>'}
function isSticker(el){if(el.children.length)return false;var t=(el.textContent||'').trim();return t.length>0&&t.length<=6&&EMO.test(t)&&!/[A-Za-z0-9]/.test(t)&&(EMO.lastIndex=0,true)}
function clean(pg){
 if(pg.querySelector('[data-nwn]'))return;
 var all=pg.querySelectorAll('*'),st2=[],i;EMO.lastIndex=0;
 for(i=0;i<all.length;i++){EMO.lastIndex=0;if(isSticker(all[i]))st2.push(all[i])}
 var groups=new Map();st2.forEach(function(s){var row=s.parentElement,box=row&&row.parentElement;if(!box||box===pg)return;groups.set(box,(groups.get(box)||0)+1)});
 var target=null,best=0;groups.forEach(function(n,box){if(n>best){best=n;target=box}});
 if(target&&best>=3){var wrap=doc.createElement('div');wrap.innerHTML=listHtml();target.parentNode.insertBefore(wrap.firstChild,target);var nw=wrap.firstChild;target.parentNode.insertBefore(nw,target);target.remove()}
 else{var h3=pg.querySelector(':scope>h3'),sub=h3&&h3.nextElementSibling,at=sub&&sub.classList.contains('nsub')?sub:h3,w2=doc.createElement('div');w2.innerHTML=listHtml();if(at){var f=w2.firstChild,l=w2.lastChild;at.after(l);at.after(f)}else{pg.appendChild(w2.firstChild);pg.appendChild(w2.firstChild)}}
 /* strip any other sticker glyphs left in the page */
 var tw=doc.createTreeWalker(pg,NodeFilter.SHOW_TEXT),n,dead=[];while((n=tw.nextNode())){EMO.lastIndex=0;if(EMO.test(n.nodeValue)){EMO.lastIndex=0;n.nodeValue=n.nodeValue.replace(EMO,'');if(!n.nodeValue.trim()&&n.parentElement&&!n.parentElement.children.length)dead.push(n.parentElement)}}
 dead.forEach(function(d){d.remove()})}
var raf=0;
function run(){raf=0;var sx=$('.sx'),pg=sx&&$('#spg',sx),h=pg&&pg.querySelector(':scope>h3');if(!h)return;if((h.textContent||'').trim().toLowerCase()!=='update')return;try{clean(pg)}catch(e){}}
new MutationObserver(function(){if(!raf)raf=requestAnimationFrame(run)}).observe(B,{childList:true,subtree:true});
/* ---------- 2. calmer start-up ---------- */
var oa=typeof openApp==='function'?openApp:null,boot=0,q=[],qt=0;
function userActive(){try{return navigator.userActivation&&navigator.userActivation.isActive}catch(e){return false}}
if(oa){openApp=function(){var a=arguments,self=this;
  if(performance.now()-T0<9000&&!userActive()){boot++;if(boot>1){q.push(a);if(!qt)qt=setTimeout(function pump(){var x=q.shift();if(x){try{var w=oa.apply(self,x);if(w&&typeof minW==='function')minW(w)}catch(e){}}qt=q.length?setTimeout(pump,900):0},1200);return}}
  return oa.apply(this,a)}}
/* ---------- 3. light optimisation ---------- */
doc.addEventListener('visibilitychange',function(){root.classList.toggle('nx-bg',doc.hidden)});
function covered(){try{var k=Object.keys(W),n=0,c=false;k.forEach(function(x){var w=W[x];if(!w||!w.el)return;if(!w.el.classList.contains('min')){n++;if(w.el.classList.contains('max'))c=true}});B.classList.toggle('nx-cover',c);B.classList.toggle('nx-many',n>4)}catch(e){}}
setInterval(covered,1200);covered();
window.NXSYS={updates:LIST,run:run};
})();

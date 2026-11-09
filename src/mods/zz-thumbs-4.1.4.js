/* THUMBS-4.1.4 - File Manager: photos, video frames and music covers replace the generic file icon. */
(function(){'use strict';
if(typeof fsrc!=='function')return;
var doc=document,IMG=/\.(jpe?g|png|gif|webp|bmp|avif)$/i,VID=/\.(mp4|m4v|webm|mkv|mov|3gp)$/i,AUD=/\.(mp3|flac|m4a|aac|ogg|opus|wav)$/i,busy=0,Q=[];
var st=doc.createElement('style');st.id='nx-thumbs-css';
st.textContent='.nxi.nxt{overflow:hidden;border-radius:6px;position:relative;background:var(--surf2)}.nxi.nxt>img,.nxi.nxt>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;pointer-events:none}.nxi.nxt.v::after{content:"";position:absolute;right:3px;bottom:3px;width:0;height:0;border-left:7px solid #fff;border-top:4.5px solid transparent;border-bottom:4.5px solid transparent;filter:drop-shadow(0 0 2px rgba(0,0,0,.7))}';
doc.head.appendChild(st);
function pump(){while(busy<3&&Q.length){var j=Q.shift();busy++;(function(j){var done=function(){busy--;pump()};try{j(done)}catch(e){done()}})(j)}}
function put(ic,el,vid){if(!ic.isConnected)return;ic.classList.add('nxt');if(vid)ic.classList.add('v');ic.innerHTML='';ic.appendChild(el)}
function mk(ic,p,nm){
 if(IMG.test(nm)){Q.push(function(d){var i=new Image();i.decoding='async';i.onload=function(){put(ic,i);d()};i.onerror=d;i.src=fsrc(p)})}
 else if(VID.test(nm)){Q.push(function(d){var v=doc.createElement('video');v.muted=true;v.preload='auto';v.playsInline=true;var f=function(){put(ic,v,1);d()};v.onloadeddata=f;v.onseeked=f;v.onerror=d;v.src=fsrc(p)+'#t=0.6';setTimeout(d,6000)})}
 else if(AUD.test(nm)&&window.NXART){Q.push(function(d){NXART.load(fsrc(p)).then(function(r){if(r&&r.url){var i=new Image();i.onload=function(){put(ic,i);d()};i.onerror=d;i.src=r.url}else d()}).catch(d)})}
 pump()}
var io=window.IntersectionObserver?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var ic=e.target,p=ic._nxp;if(p&&!ic._nxd){ic._nxd=1;mk(ic,p,p.split('/').pop())}})},{rootMargin:'120px'}):null;
function scan(){var rows=doc.querySelectorAll('.win [data-p]');for(var i=0;i<rows.length&&i<800;i++){var r=rows[i],p=r.getAttribute('data-p');if(!p||p.charAt(0)!=='/')continue;var nm=p.split('/').pop();if(!(IMG.test(nm)||VID.test(nm)||AUD.test(nm)))continue;
  var ic=r.querySelector('.nxi');if(!ic){var sv=r.querySelector('.nm>svg');if(!sv)continue;ic=doc.createElement('span');ic.className='nxi fl';ic.innerHTML=sv.outerHTML;sv.replaceWith(ic)}if(ic._nxp===p)continue;ic._nxp=p;ic._nxd=0;if(ic.classList.contains('nxt')){ic.classList.remove('nxt','v')}
  if(io)io.observe(ic);else{ic._nxd=1;mk(ic,p,nm)}}}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;scan()})}).observe(doc.body,{childList:true,subtree:true});scan();
})();

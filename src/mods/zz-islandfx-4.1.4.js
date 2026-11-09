/* ISLANDFX-4.1.4 - when music/timer/etc. starts, a glowing blob stretches from where you tapped up to the island, then the island pops open. */
(function(){'use strict';
var doc=document,last={x:innerWidth/2,y:innerHeight-60,t:0},prev='';
doc.addEventListener('pointerdown',function(e){last={x:e.clientX,y:e.clientY,t:Date.now()}},true);
function isl(){return doc.querySelector('.nxd')}
function blob(sx,sy,tx,ty,dl,sz,op){var b=doc.createElement('div');b.style.cssText='position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;width:'+sz+'px;height:'+sz+'px;margin:-'+sz/2+'px 0 0 -'+sz/2+'px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--acc,#8b6cff) 55%,rgba(139,108,255,0));box-shadow:0 0 18px 4px var(--acc,#8b6cff);opacity:0';
 doc.body.appendChild(b);var dx=tx-sx,dy=ty-sy,ang=Math.atan2(dy,dx)*180/Math.PI;
 var a=b.animate([{transform:'translate('+sx+'px,'+sy+'px) rotate('+ang+'deg) scale(.4,.4)',opacity:0},{transform:'translate('+(sx+dx*.25)+'px,'+(sy+dy*.25)+'px) rotate('+ang+'deg) scale(1.6,.7)',opacity:op,offset:.25},{transform:'translate('+(sx+dx*.75)+'px,'+(sy+dy*.75)+'px) rotate('+ang+'deg) scale(2.2,.45)',opacity:op,offset:.75},{transform:'translate('+tx+'px,'+ty+'px) rotate('+ang+'deg) scale(.5,.5)',opacity:0}],{duration:520,delay:dl,easing:'cubic-bezier(.5,0,.2,1)',fill:'both'});
 a.onfinish=function(){b.remove()}}
function launch(el){var r=el.getBoundingClientRect(),tx=r.left+r.width/2,ty=r.top+r.height/2,fresh=Date.now()-last.t<2500,sx=fresh?last.x:innerWidth/2,sy=fresh?last.y:innerHeight-60;
 blob(sx,sy,tx,ty,0,26,1);blob(sx,sy,tx,ty,70,16,.7);blob(sx,sy,tx,ty,130,10,.5);
 try{el.animate([{scale:'.55',opacity:0,filter:'blur(6px)'},{scale:'1.1',opacity:1,filter:'blur(0)',offset:.6},{scale:'1',opacity:1,filter:'blur(0)'}],{duration:480,delay:420,easing:'cubic-bezier(.3,1.4,.5,1)',fill:'backwards'})}catch(e){}}
function watch(){var el=isl();if(!el)return false;prev=el.getAttribute('data-v')||'';
 new MutationObserver(function(){var v=el.getAttribute('data-v')||'';if(v!==prev){var from=prev;prev=v;if((from===''||from==='idle'||from==='quick'||from==='none')&&(v==='live'||v==='music'||v==='timer'))launch(el)}}).observe(el,{attributes:true,attributeFilter:['data-v']});return true}
var n=0,iv=setInterval(function(){if(watch()||++n>40)clearInterval(iv)},500);
})();

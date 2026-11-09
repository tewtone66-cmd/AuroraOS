/* TBW-4.4.0 - Windows-style taskbar (setting), notification position, settings block.
   Taskbar > Windows: flat 48px bar, small icons, hover highlight + hop, press shrink, running / active indicators, show-desktop strip.
   Notifications > Above taskbar: popups appear bottom-right just above the bar and slide up (Nex Island no longer swallows them). Reversible. */
(function(){'use strict';
var doc=document,B=doc.body;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
function calm(){return B.classList.contains('perf')||B.classList.contains('rm')}
var CSS=[
/* ----- Windows taskbar ----- */
'body.tbw{--tbi:.62}body.tbw.tbi-m{--tbi:.78}',
'body.tbw #dock{height:48px!important;min-height:0!important;padding-top:0!important;padding-bottom:0!important;border-radius:0!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;max-width:none!important;margin:0!important;align-items:center;gap:2px;background:color-mix(in srgb,var(--surf,#14171f) 82%,transparent)!important;border:0!important;border-top:1px solid var(--line,rgba(255,255,255,.1))!important;box-shadow:none!important;-webkit-backdrop-filter:blur(26px) saturate(1.5);backdrop-filter:blur(26px) saturate(1.5)}',
'body.perf.tbw #dock,body.lite.tbw #dock{-webkit-backdrop-filter:none;backdrop-filter:none;background:var(--surf,#14171f)!important}',
'body.tbw #startBtn,body.tbw #tasks .dk{position:relative;width:44px;height:40px;min-width:0;margin:0 1px;padding:0;border-radius:6px;background:none;box-shadow:none;border:0;transition:background-color .15s}',
'body.tbw #startBtn:hover,body.tbw #tasks .dk:hover{background:var(--hov,rgba(255,255,255,.1))}body.tbw #startBtn:active,body.tbw #tasks .dk:active{background:var(--fxs,rgba(127,127,127,.14))}',
'body.tbw #startBtn>*,body.tbw #tasks .dk>*{transform:scale(var(--tbi,.62));transition:transform .15s cubic-bezier(.3,1.4,.5,1)}',
'body.tbw #startBtn:active>*,body.tbw #tasks .dk:active>*{transform:scale(calc(var(--tbi,.62) - .08))}',
'body.tbw.tbh #startBtn:hover>*,body.tbw.tbh #tasks .dk:hover>*{animation:tbwHop .45s cubic-bezier(.3,1.7,.5,1)}',
'@keyframes tbwHop{0%{transform:scale(var(--tbi,.62)) translateY(0)}35%{transform:scale(calc(var(--tbi,.62) + .09)) translateY(-7px)}100%{transform:scale(var(--tbi,.62)) translateY(0)}}',
'body.tbw #tasks{gap:0}',
'body.tbw #tasks .dk:after{content:"";position:absolute;top:auto;right:auto;left:50%;bottom:2px;width:6px;height:3px;margin-left:-3px;border:0;border-radius:3px;transform:none;background:var(--txt,#fff);opacity:0;transition:width .24s cubic-bezier(.3,1.3,.5,1),margin .24s cubic-bezier(.3,1.3,.5,1),opacity .2s,background-color .2s}',
'body.tbw #tasks .dk.tw-run:after{opacity:.6}body.tbw #tasks .dk.tw-act:after{opacity:1;width:16px;margin-left:-8px;background:var(--acc,#4f7cff)}',
'body.tbw #srchBtn{width:220px!important;max-width:34vw;height:34px!important;border-radius:17px!important;flex:none}',
'body.tbw #tray .tri{height:34px;min-width:30px;padding:0 6px;border-radius:6px;transition:background-color .15s}body.tbw #tray .tri:hover{background:var(--hov,rgba(255,255,255,.1))}',
'body.tbw #clock{padding:0 10px;height:38px;border-radius:6px;text-align:right;line-height:1.25;font-size:12px;display:flex;flex-direction:column;justify-content:center;transition:background-color .15s}body.tbw #clock:hover{background:var(--hov,rgba(255,255,255,.1))}',
'#tbwShow{display:none;align-self:stretch;flex:none;width:7px;margin:0 0 0 4px;border-left:1px solid var(--line,rgba(255,255,255,.18));cursor:pointer;transition:background-color .15s}body.tbw #tbwShow{display:block}#tbwShow:hover{background:var(--hov,rgba(255,255,255,.14))}',
/* ----- notifications above the taskbar ----- */
'body.nxnb #nxnHost{top:auto!important;bottom:calc(var(--tbh,56px) + 12px)!important;right:12px;flex-direction:column;justify-content:flex-end}',
'body.nxnb .nxn{animation-name:nxnBIn!important}@keyframes nxnBIn{0%{opacity:0;transform:translateY(54px) scale(.96)}60%{opacity:1;transform:translateY(-5px) scale(1.01)}100%{opacity:1;transform:none}}',
'body.nxnb .nxn.out{transform:translateY(24px) scale(.96)!important}',
/* ----- settings block ----- */
'.nxtb-set{margin:0 0 18px}.nxtb-set .nxtb-h{margin:12px 0 6px}.nxtb-set .nxd-hint{font-size:12px;color:var(--mut);margin:6px 0}'
].join('\n');
var sty=doc.createElement('style');sty.id='nx-tbw-css';sty.textContent=CSS;doc.head.appendChild(sty);
/* ----- state ----- */
function dock(){return doc.getElementById('dock')}
function measure(){var d=dock();B.style.setProperty('--tbh',(d?d.offsetHeight:56)+'px')}
function setNotifPos(pos){
 if(pos==='bottom'){if(g('aur.nxpos.bk','')===''){put('aur.nxpos.bk','keep:'+g('aur.isl.notif','1'))}put('aur.isl.notif','0')}
 else{var bk=g('aur.nxpos.bk','');if(bk.indexOf('keep:')===0){put('aur.isl.notif',bk.slice(5));put('aur.nxpos.bk','')}}
 put('aur.nxpos',pos)}
function apply(){var on=g('aur.tbw','0')==='1';B.classList.toggle('tbw',on);B.classList.toggle('tbi-m',g('aur.tbw.sz','s')==='m');B.classList.toggle('tbh',g('aur.tbw.hop','1')==='1');B.classList.toggle('nxnb',g('aur.nxpos','top')==='bottom');
 place();measure();mark();setTimeout(function(){measure();try{window.dispatchEvent(new Event('resize'))}catch(e){}},380)}
/* show desktop strip */
var sd=doc.createElement('div');sd.id='tbwShow';sd.title='Show desktop';
function place(){var d=dock();if(d&&sd.parentNode!==d)d.appendChild(sd)}
sd.addEventListener('click',function(e){e.stopPropagation();if(typeof W==='undefined')return;
 if(sd._m&&sd._m.length){sd._m.forEach(function(k){try{if(W[k])showW(W[k])}catch(x){}});sd._m=null;return}
 var ks=Object.keys(W).filter(function(k){return W[k]&&W[k].el&&!W[k].el.classList.contains('min')});ks.forEach(function(k){try{minW(W[k])}catch(x){}});sd._m=ks});
/* running / active indicators */
function mark(){if(!B.classList.contains('tbw'))return;var t=doc.getElementById('tasks');if(!t||typeof W==='undefined')return;var run={},top=typeof topId!=='undefined'?topId:null,tw=top&&W[top]?W[top]:null;
 Object.keys(W).forEach(function(k){var w=W[k];if(w&&w.app)run[w.app]=1});
 t.querySelectorAll('.dk').forEach(function(b){var id=b.dataset.id;b.classList.toggle('tw-run',!!run[id]);b.classList.toggle('tw-act',!!tw&&tw.app===id&&!(tw.el&&tw.el.classList.contains('min')))})}
setInterval(function(){if(!doc.hidden)mark()},500);
var tk=doc.getElementById('tasks');if(tk)new MutationObserver(mark).observe(tk,{childList:true});
var dk=dock();if(dk&&window.ResizeObserver)new ResizeObserver(measure).observe(dk);
/* ----- settings > Taskbar ----- */
function seg(key,vals,cur){return'<div class="seg" data-nxi="1">'+vals.map(function(v){return'<button data-tbw="'+key+':'+v[0]+'" class="'+(String(cur)===String(v[0])?'sel':'')+'">'+v[1]+'</button>'}).join('')+'</div>'}
function block(){return'<h4 class="nxtb-h">Taskbar style</h4>'+seg('style',[['def','Default'],['win','Windows']],g('aur.tbw','0')==='1'?'win':'def')+
 '<p class="nxd-hint">Windows style: flat taskbar, small icons, hover animation, running indicators and a show-desktop strip.</p>'+
 '<h4 class="nxtb-h">Taskbar icons</h4>'+seg('sz',[['s','Small'],['m','Medium']],g('aur.tbw.sz','s'))+'<h4 class="nxtb-h">Hover animation</h4>'+seg('hop',[['1','On'],['0','Off']],g('aur.tbw.hop','1'))+
 '<h4 class="nxtb-h">Notifications appear</h4>'+seg('pos',[['top','On Nex Island'],['bottom','Above taskbar']],g('aur.nxpos','top'))+
 '<h4 class="nxtb-h">Nex Island size</h4><div class="nxd-btns" data-nxi="1"><button class="pgb" data-tbw="islreset:1">Reset width</button></div><p class="nxd-hint">Drag the left or right edge of the island to stretch it.</p>'}
function inject(){var p=doc.getElementById('spg');if(!p||p.querySelector('.nxtb-set'))return;var hs=p.querySelectorAll('h3'),h=null;for(var i=0;i<hs.length;i++)if(/^\s*(taskbar|dock)/i.test(hs[i].textContent)){h=hs[i];break}
 var b=doc.createElement('div');b.className='nxtb-set';b.setAttribute('data-nxi','1');b.innerHTML='<h3 data-nxi="1" style="margin:4px 0 6px">Taskbar &amp; notifications</h3>'+block();
 if(h)h.parentNode.insertBefore(b,h.nextSibling);else{var t=p.querySelector('.nxf,.nxs,.nxc,.nxt');if(!t)return;t.insertBefore(b,t.firstChild)}}
doc.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var b=t.closest('[data-tbw]');if(!b)return;e.stopPropagation();e.preventDefault();var kv=b.getAttribute('data-tbw').split(':'),k=kv[0],v=kv[1];
 if(k==='style'){put('aur.tbw',v==='win'?'1':'0');setNotifPos(v==='win'?'bottom':'top')}
 else if(k==='sz')put('aur.tbw.sz',v);else if(k==='hop')put('aur.tbw.hop',v);else if(k==='pos')setNotifPos(v);
 else if(k==='islreset'){if(window.NXISLRS)window.NXISLRS.reset();return}
 apply();var bx=p2(b);if(bx){var f=doc.querySelector('.nxtb-set');if(f){f.innerHTML='<h3 data-nxi="1" style="margin:4px 0 6px">Taskbar &amp; notifications</h3>'+block()}}
 if(k==='pos'&&window.NXN)window.NXN.notify({type:'info',app:'Notifications',title:'Notifications moved',text:v==='bottom'?'They now appear above the taskbar.':'They now appear on Nex Island.'})},true);
function p2(b){return b.closest('.nxtb-set')}
var raf=0;new MutationObserver(function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;inject();place()})}).observe(doc.body,{childList:true,subtree:true});
window.NXTBW={apply:apply,notifPos:setNotifPos};
apply();inject();
})();

/* VHOVER-4.6.3 - hover for the virtual mouse. The on-screen pad moves a fake cursor, which never triggers the browser's real :hover, so hover colours and hover menus did nothing.
   While the virtual mouse is on, this tracks what is under the cursor, tags it and its parents with .nxhv, sends mouseover/mouseout, and every CSS ":hover" rule is also given a ".nxhv" twin.
   Also: macOS window buttons evenly spaced with the glyphs (x - +) shown only while the pointer is over the three dots. */
(function(){'use strict';
var doc=document;
function walk(rules,parent){for(var i=rules.length-1;i>=0;i--){var r=rules[i];if(r.cssRules&&!r.selectorText){walk(r.cssRules,r);continue}
 if(r.selectorText&&r.selectorText.indexOf(':hover')>-1){try{parent.insertRule(r.selectorText.replace(/:hover/g,'.nxhv')+'{'+r.style.cssText+'}',i+1)}catch(e){}}}}
function twins(){var ss=doc.styleSheets;for(var i=0;i<ss.length;i++){var s=ss[i],rl;try{rl=s.cssRules}catch(e){continue}if(!rl||s._nxl===rl.length)continue;walk(rl,s);s._nxl=s.cssRules.length}}
var X=':root[data-wbs=mac]:root:root .win .tbar ';
var st=doc.createElement('style');st.id='nx-vhover-css';
st.textContent=X+'button.x,'+X+'button.mn,'+X+'button.mx{box-sizing:border-box;flex:none!important;width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;padding:0!important;margin:0 8px 0 0!important;display:flex!important;align-items:center;justify-content:center;align-self:center!important}'
+X+'button.x svg,'+X+'button.mn svg,'+X+'button.mx svg{opacity:0!important;width:8px!important;height:8px!important}'
+X+'button.fsd{margin:0 0 0 auto!important}'
+':root[data-wbs=mac]:root:root .win .tbar:has(button.x:hover,button.mn:hover,button.mx:hover,button.x.nxhv,button.mn.nxhv,button.mx.nxhv) button svg{opacity:.8!important}';
doc.head.appendChild(st);
var n=0;twins();var iv=setInterval(function(){twins();if(++n>12)clearInterval(iv)},2500);
var last=null,px=-1,py=-1;
function tick(){if(doc.hidden||!doc.body.classList.contains('vm')||typeof VM==='undefined')return;var x=VM.x,y=VM.y;if(x===px&&y===py)return;px=x;py=y;
 var e=doc.elementFromPoint(x,y);if(e===last)return;var o=last;last=e;
 var old=doc.querySelectorAll('.nxhv');for(var i=0;i<old.length;i++)old[i].classList.remove('nxhv');
 for(var m=e;m&&m.classList;m=m.parentElement)m.classList.add('nxhv');
 var ev=function(t,tg,rel){try{tg.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,relatedTarget:rel}))}catch(_){}};
 if(o&&o.isConnected)ev('mouseout',o,e);if(e){ev('mouseover',e,o);ev('mousemove',e,null)}}
setInterval(tick,70);
})();

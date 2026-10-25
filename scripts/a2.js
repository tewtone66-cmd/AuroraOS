/* A2 3.2.1 - text selection (touch long-press, virtual mouse, real mouse) + copy bar */
(function(){'use strict';
var SELX='input,textarea,select,button,.row,.di,.dk,.tbar,.ni,.ib,svg,img,canvas,video,iframe,#cur,#pad,#vbtns,#ctx,#selbar,#dock,#start,.ftile,.drive,.btab';
var EDIT='input,textarea,[contenteditable="true"]';
var gs=function(){return window.getSelection()};
var clip='';
function el(n){return n&&n.nodeType===1?n:(n&&n.parentElement)}
function selectable(n){n=el(n);if(!n||!n.closest)return false;if(n.closest(SELX))return false;return !!n.closest('.body,.tmo,.cro')}
function editable(n){n=el(n);return n&&n.closest?n.closest(EDIT):null}
function caret(x,y){var r=null;try{if(document.caretRangeFromPoint)r=document.caretRangeFromPoint(x,y);else if(document.caretPositionFromPoint){var p=document.caretPositionFromPoint(x,y);if(p){r=document.createRange();r.setStart(p.offsetNode,p.offset)}}}catch(e){}return r}
function selText(){var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.selectionStart!=null&&a.selectionEnd>a.selectionStart)return a.value.slice(a.selectionStart,a.selectionEnd);return String(gs())}
function ensureBar(){var b=document.getElementById('selbar');if(!b){b=document.createElement('div');b.id='selbar';document.body.appendChild(b);
 b.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation()},true);
 b.addEventListener('mousedown',function(e){e.preventDefault()},true)}return b}
function hideBar(){var b=document.getElementById('selbar');if(b)b.classList.remove('show')}
function copyText(t){clip=t;var ok=false;
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).catch(function(){legacy(t)});ok=true}}catch(e){}
 if(!ok)legacy(t);toast('Copied')}
function legacy(t){try{if(document.execCommand('copy'))return}catch(e){}
 var a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;left:-999px;top:0;opacity:0';document.body.appendChild(a);var p=document.activeElement;a.select();try{document.execCommand('copy')}catch(e){}a.remove();try{p&&p.focus&&p.focus()}catch(e){}}
function act(k,ed){
 if(k==='copy'){var t=selText();if(t)copyText(t)}
 else if(k==='all'){if(ed){ed.focus();ed.select()}else{var r=lastRegion||document.body,rg=document.createRange();rg.selectNodeContents(r);gs().removeAllRanges();gs().addRange(rg);showBar()}}
 else if(k==='cut'&&ed){var t2=selText();if(t2){copyText(t2);var s=ed.selectionStart,e=ed.selectionEnd;ed.setRangeText('',s,e,'end');ed.dispatchEvent(new Event('input',{bubbles:true}))}}
 else if(k==='paste'&&ed){var ins=function(t){if(t==null)return;var s=ed.selectionStart,e=ed.selectionEnd;ed.setRangeText(t,s,e,'end');ed.dispatchEvent(new Event('input',{bubbles:true}));ed.focus()};
  try{navigator.clipboard.readText().then(function(t){ins(t||clip)}).catch(function(){ins(clip)})}catch(e){ins(clip)}}
 hideBar()}
var lastRegion=null;
function showBar(ed){var t=selText();if(!t){hideBar();return}ed=ed||editable(document.activeElement);var rect=null;
 if(ed&&/^(INPUT|TEXTAREA)$/.test(ed.tagName))rect=ed.getBoundingClientRect();
 else{var s=gs();if(!s.rangeCount)return;rect=s.getRangeAt(0).getBoundingClientRect();if(!rect||(!rect.width&&!rect.height))return}
 var b=ensureBar();var btn=[['copy','Copy']];if(ed){btn.unshift(['cut','Cut']);btn.push(['paste','Paste'])}btn.push(['all','Select all']);
 b.innerHTML='';btn.forEach(function(q){var x=document.createElement('button');x.textContent=q[1];x.onclick=function(){act(q[0],ed)};b.appendChild(x)});
 b.classList.add('show');var w=b.offsetWidth,h=b.offsetHeight,l=Math.max(6,Math.min(rect.left+rect.width/2-w/2,innerWidth-w-6)),tp=rect.top-h-8;if(tp<6)tp=Math.min(rect.bottom+8,innerHeight-h-6);b.style.left=l+'px';b.style.top=tp+'px'}
/* word / block selection */
function selWord(x,y){var c=caret(x,y);if(!c)return false;var s=gs();s.removeAllRanges();s.addRange(c);try{s.modify('move','backward','word');s.modify('extend','forward','word')}catch(e){}return String(s).trim().length>0}
function selBlock(x,y){var c=caret(x,y);if(!c)return;var n=el(c.startContainer),b=n&&n.closest('p,li,pre,div,td,h1,h2,h3,h4,span');if(!b)return;var r=document.createRange();r.selectNodeContents(b);var s=gs();s.removeAllRanges();s.addRange(r)}
/* custom engine for touch + virtual mouse */
var drag=null,lp=0,clicks={n:0,t:0,x:0,y:0};
document.addEventListener('pointerdown',function(e){
 if(e.target&&e.target.closest&&e.target.closest('#selbar'))return;
 var vm=e.pointerType==='mouse'&&e.pointerId===99,tc=e.pointerType==='touch';
 if(!document.getElementById('selbar')||!document.getElementById('selbar').classList.contains('show')){}else hideBar();
 if(!vm&&!tc){return}
 var t=e.target;clearTimeout(lp);
 if(editable(t)){if(vm){var now=Date.now();clicks=(now-clicks.t<450&&Math.hypot(e.clientX-clicks.x,e.clientY-clicks.y)<8)?{n:clicks.n+1,t:now,x:e.clientX,y:e.clientY}:{n:1,t:now,x:e.clientX,y:e.clientY};
   if(clicks.n>=2){var ed=editable(t);setTimeout(function(){wordIn(ed)},0)}}return}
 if(!selectable(t)){if(gs().rangeCount&&!gs().isCollapsed&&!(el(t).closest&&el(t).closest('#selbar')))gs().removeAllRanges();return}
 lastRegion=el(t).closest('.body,.tmo,.cro');
 if(vm){var n2=Date.now();clicks=(n2-clicks.t<450&&Math.hypot(e.clientX-clicks.x,e.clientY-clicks.y)<8)?{n:Math.min(3,clicks.n+1),t:n2,x:e.clientX,y:e.clientY}:{n:1,t:n2,x:e.clientX,y:e.clientY};
  if(clicks.n===2){selWord(e.clientX,e.clientY);drag=null;showBar();return}
  if(clicks.n===3){selBlock(e.clientX,e.clientY);drag=null;showBar();return}
  var c=caret(e.clientX,e.clientY);gs().removeAllRanges();if(c)drag={pid:e.pointerId,n:c.startContainer,o:c.startOffset,x:e.clientX,y:e.clientY,moved:false}}
 else{var x0=e.clientX,y0=e.clientY,pid=e.pointerId;gs().removeAllRanges();lp=setTimeout(function(){if(selWord(x0,y0)){var s=gs(),r=s.getRangeAt(0);drag={pid:pid,n:r.startContainer,o:r.startOffset,x:x0,y:y0,moved:true,touch:true};try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}}},450)}
},true);
document.addEventListener('pointermove',function(e){
 if(!drag&&lp&&e.pointerType==='touch'){return}
 if(!drag||e.pointerId!==drag.pid)return;
 if(!drag.moved){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4)return;drag.moved=true}
 var c=caret(e.clientX,e.clientY);if(!c)return;try{gs().setBaseAndExtent(drag.n,drag.o,c.startContainer,c.startOffset)}catch(_){}},true);
function endDrag(e){clearTimeout(lp);if(!drag||(e&&e.pointerId!==drag.pid))return;var d=drag;drag=null;if(d.moved&&!gs().isCollapsed)showBar()}
document.addEventListener('pointerup',endDrag,true);document.addEventListener('pointercancel',function(e){clearTimeout(lp);if(drag&&e.pointerId===drag.pid)drag=null},true);
/* stop scrolling while a touch selection drag is active; cancel the long-press timer if the finger scrolls */
document.addEventListener('touchmove',function(e){if(drag&&drag.touch&&e.cancelable)e.preventDefault();else clearTimeout(lp)},{passive:false,capture:true});
function wordIn(ed){if(!ed||ed.selectionStart==null)return;var v=ed.value,p=ed.selectionStart,a=p,b=p;while(a>0&&/\S/.test(v[a-1]))a--;while(b<v.length&&/\S/.test(v[b]))b++;ed.setSelectionRange(a,b);showBar(ed)}
/* real mouse: native selection, we only add the bar after it ends */
document.addEventListener('mouseup',function(e){if(e.isTrusted&&!drag)setTimeout(function(){var ed=editable(e.target);if((ed&&selText())||(!ed&&selectable(e.target)&&!gs().isCollapsed))showBar(ed)},0)},true);
document.addEventListener('dblclick',function(e){if(!e.isTrusted)return;var ed=editable(e.target);setTimeout(function(){if(selText())showBar(ed)},0)},true);
/* bar disappears when the selection goes away or the view scrolls */
document.addEventListener('selectionchange',function(){var a=document.activeElement;var inp=a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.selectionEnd>a.selectionStart;if(!inp&&gs().isCollapsed)hideBar()});
document.addEventListener('scroll',hideBar,true);
/* context menu: Copy / Select all where there is text */
document.addEventListener('contextmenu',function(e){var ed=editable(e.target),has=selText();
 if(ed&&!/^(button|submit|checkbox|radio|range|color|file)$/.test(ed.type||'')){e.preventDefault();e.stopImmediatePropagation();hideBar();ed.focus();
  ctx(e.clientX,e.clientY,[['Cut',function(){act('cut',ed)},'Ctrl+X',!has],['Copy',function(){act('copy',ed)},'Ctrl+C',!has],['Paste',function(){act('paste',ed)},'Ctrl+V'],null,['Select all',function(){act('all',ed)},'Ctrl+A']]);return}
 if(has&&selectable(e.target)){e.preventDefault();e.stopImmediatePropagation();hideBar();ctx(e.clientX,e.clientY,[['Copy',function(){act('copy')},'Ctrl+C'],['Select all',function(){act('all')},'Ctrl+A']])}},true);
console.log('NexOS text selection ready');
})();

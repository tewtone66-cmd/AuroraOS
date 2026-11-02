/* INPUT-4.0.2 - virtual mouse / keyboard / drag fixes */
(function(){'use strict';
if(typeof VM==='undefined'||typeof ls!=='function')return;
var doc=document,root=doc.documentElement,SKIP='#pad,#cur,#vbtns,.rip';
/* 1. cursor shapes were squashed by the generic .sr row style (invisible during move/resize) + classic/glass cursor scaling + other shapes */
var css=['#cur svg.cs.sr{padding:0!important;gap:0!important;margin:0!important;border-radius:0!important;background:none!important;width:100%!important;height:100%!important;box-sizing:content-box!important;min-width:0;overflow:visible}',
'#cur svg.cs.sr:hover{background:none!important}',
':root[data-nxcur] #cur::before,:root[data-nxcur] #cur::after{transform:scale(var(--nxs,1));transform-origin:0 0}',
':root[data-nxcur] #cur:not(.c-arrow)::before,:root[data-nxcur] #cur:not(.c-arrow)::after{display:none}',
':root[data-nxcur] #cur:not(.c-arrow)>*{opacity:1!important}',
'#dock #nxkbBtn.nxd{position:static;width:34px;height:34px;border-radius:10px;margin:0 4px;flex:none;right:auto;bottom:auto;box-shadow:none;border-color:transparent;background:transparent}',
'#dock #nxkbBtn.nxd.on{background:var(--acc);color:var(--accT)}',
'#dock #nxkbBtn.nxd svg{width:20px;height:20px}'].join('\n');
var st=doc.createElement('style');st.id='nx-input-css';st.textContent=css;doc.head.appendChild(st);
var cur=doc.getElementById('cur');
function scl(){if(!cur)return;var w=parseFloat(cur.style.width)||26;root.style.setProperty('--nxs',(w/26).toFixed(3))}
if(cur){scl();try{new MutationObserver(scl).observe(cur,{attributes:true,attributeFilter:['style']})}catch(e){}}
/* 2. real hit-testing ignores the touchpad/cursor layers (drag & drop targets) */
var ofp=doc.elementFromPoint.bind(doc);
doc.elementFromPoint=function(x,y){var e=ofp(x,y);if(e&&e.closest&&e.closest(SKIP)){var l=doc.elementsFromPoint(x,y);for(var i=0;i<l.length;i++)if(!l[i].closest(SKIP))return l[i];return doc.body}return e};
/* 3. keyboard geometry: clip native web views above the keyboard, mouse works over it */
function kb(){var p=doc.getElementById('nxkb');return p&&p.classList.contains('open')?p:null}
window.nxKbClip=function(r){var p=kb();if(!p)return r.height;var k=p.getBoundingClientRect();if(k.right<=r.left||k.left>=r.right||k.top>=r.bottom||k.bottom<=r.top)return r.height;var h=k.top-r.top;return h>=80?h:r.height};
var ob=window.bpos;
if(typeof ob==='function')window.bpos=function(){var p=kb();if(p&&VM.on){var k=p.getBoundingClientRect();if(VM.x>=k.left&&VM.x<k.right&&VM.y>=k.top&&VM.y<k.bottom)return null}return ob.apply(this,arguments)};
function resync(){try{sync()}catch(e){}}
/* 4. forward virtual-keyboard keys into the native web page */
window.NXNAT={on:function(el){try{if(!NB||!shown||el&&/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)||el&&el.isContentEditable)return false;return!!shownTab}catch(e){return false}},
send:function(c,key,ch,m){var o={key:key,code:c,ch:ch,sh:!!m.shift,ct:!!m.ctrl,al:!!m.alt,me:!!m.meta};
 var js='(function(o){try{var d=document,e=d.activeElement||d.body;while(e&&e.tagName==="IFRAME"){try{e=e.contentDocument.activeElement||e.contentDocument.body}catch(x){break}}var D=e.ownerDocument||d;var I={key:o.key,code:o.code,bubbles:true,cancelable:true,composed:true,shiftKey:o.sh,ctrlKey:o.ct,altKey:o.al,metaKey:o.me};var ed=e.isContentEditable||e.tagName==="TEXTAREA"||(e.tagName==="INPUT"&&!/^(button|checkbox|radio|submit|range|color|file)$/i.test(e.type));'
 +'var ok=e.dispatchEvent(new KeyboardEvent("keydown",I));if(ok){if(o.ch!=null&&!o.ct&&!o.me){e.dispatchEvent(new KeyboardEvent("keypress",I));if(ed){if(!D.execCommand("insertText",false,o.ch)&&e.setRangeText){e.setRangeText(o.ch,e.selectionStart,e.selectionEnd,"end");e.dispatchEvent(new Event("input",{bubbles:true}))}}else if(o.ch===" "&&e.click)e.click()}'
 +'else if(o.ct&&o.code==="KeyA"){if(e.select&&ed)e.select();else D.execCommand("selectAll")}else if(o.ct&&o.code==="KeyC")D.execCommand("copy");else if(o.ct&&o.code==="KeyX")D.execCommand("cut");else if(o.ct&&o.code==="KeyZ")D.execCommand("undo");'
 +'else if(o.key==="Backspace"&&ed)D.execCommand("delete");else if(o.key==="Delete"&&ed)D.execCommand("forwardDelete");'
 +'else if(o.key==="Enter"){if(ed&&e.tagName!=="INPUT")D.execCommand("insertParagraph");else if(e.tagName==="INPUT"&&e.form){var f=e.form;if(f.requestSubmit)f.requestSubmit();else f.submit()}else if(e.click&&e.tagName!=="BODY")e.click()}'
 +'else if(/^Arrow|^Home$|^End$/.test(o.key)&&ed){if(e.setSelectionRange&&e.value!=null){var v=e.value,s=e.selectionStart,n=e.selectionEnd,p=o.key==="ArrowLeft"?Math.max(0,s-1):o.key==="ArrowRight"?Math.min(v.length,n+1):o.key==="Home"?0:o.key==="End"?v.length:s;e.setSelectionRange(p,p)}else if(D.getSelection&&D.getSelection().modify){D.getSelection().modify("move",/Left|Up|Home/.test(o.key)?"backward":"forward",/Up|Down/.test(o.key)?"line":/Home|End/.test(o.key)?"lineboundary":"character")}}'
 +'else if(o.key==="Tab"){var q=[].filter.call(D.querySelectorAll("input,textarea,select,button,a[href],[tabindex]"),function(x){return !x.disabled&&x.tabIndex>=0&&x.offsetParent!==null}),i=q.indexOf(e);if(q.length){i=(i+(o.sh?-1:1)+q.length)%q.length;q[i].focus()}}}'
 +'e.dispatchEvent(new KeyboardEvent("keyup",I))}catch(x){}})('+JSON.stringify(o)+')';
 try{var id=shownTab==='vsc'?'vsc':(typeof BR!=='undefined'&&BR&&shownTab?shownTab:'');NB.act({id:id||shownTab,a:'js',js:js}).catch(function(){})}catch(e){}}};
/* 5. dropping files on another Explorer window = move into the folder it shows */
function patchDnd(){var D=window.DNDX;if(!D||D._nx)return;D._nx=1;var oh=D.hit;
 D.hit=function(s,x,y,e){var r=oh.apply(this,arguments);if(r)return r;try{var w=winOf(e);if(w&&w.app==='files'){var a=w.body.querySelector('.apath'),pth=a&&a.value&&a.value.trim();if(pth&&pth!=='This PC'&&pth.charAt(0)==='/'){var nm=pth.split('/').filter(Boolean).pop()||pth;return{ext:1,el:w.el,name:nm,tip:'Move to '+nm,drop:function(its){return NF.paste({paths:its.map(function(i){return i.path}),dest:pth,move:true}).then(function(){toast(its.length+' item'+(its.length>1?'s':'')+' moved to '+nm)})}}}}}catch(x2){}return null}}
/* 6. keyboard button lives in the taskbar (next to the clock) */
var tries=0,iv=setInterval(function(){tries++;var p=doc.getElementById('nxkb'),b=doc.getElementById('nxkbBtn'),dk=doc.getElementById('dock');
 if(p&&!p._nx){p._nx=1;try{new MutationObserver(resync).observe(p,{attributes:true,attributeFilter:['class','style']})}catch(e){}p.addEventListener('transitionend',resync)}
 if(b&&dk&&!b._nx){b._nx=1;var saved=null;try{saved=ls('aur.kbpos')}catch(e){}if(!saved||saved==='null'){b.classList.add('nxd');var clk=doc.getElementById('clock');dk.insertBefore(b,clk||null)}}
 patchDnd();if(tries>60||(p&&b&&b._nx&&window.DNDX&&window.DNDX._nx))clearInterval(iv)},250);
})();
